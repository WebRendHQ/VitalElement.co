import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2025-02-24.acacia',
});

// Initialize Firestore
const db = admin.firestore();

// Define interfaces for function parameters
interface ProductData {
  name: string;
  description?: string;
  experienceId: string;
  metadata?: {
    [key: string]: string;
  };
}

interface PaymentIntentData {
  amount: number;
  currency?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface PaymentConfirmData {
  paymentIntentId: string;
  bookingId: string;
}

interface CancelBookingData {
  bookingId: string;
  paymentIntentId?: string;
  productId?: string;
}

/**
 * Create a Stripe product and price for an experience
 */
export const createProduct = functions.https.onCall(async (data: ProductData, context: functions.https.CallableContext) => {
  // Check if request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { name, description, experienceId, metadata } = data;
    
    if (!name || !experienceId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Product name and experience ID are required'
      );
    }

    // Calculate price based on pod type
    const podType = metadata?.podType || 'standard';
    const basePrice = podType === 'premium' ? 45 : 30;
    
    // Create a product in Stripe
    const product = await stripe.products.create({
      name,
      description: description || 'Vital Elements Experience',
      metadata: {
        ...metadata,
        experienceId,
        firebaseUID: context.auth.uid
      }
    });

    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: basePrice * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        experienceId,
        firebaseUID: context.auth.uid
      }
    });

    // Store the product and price info in Firestore
    await db.collection('stripe_products').doc(product.id).set({
      productId: product.id,
      priceId: price.id,
      experienceId,
      userId: context.auth.uid,
      name,
      description,
      price: basePrice,
      podType,
      created: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      productId: product.id,
      priceId: price.id
    };
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create Stripe product',
      error
    );
  }
});

/**
 * Create a payment intent for direct checkout
 */
export const createPaymentIntent = functions.https.onCall(async (data: PaymentIntentData, context: functions.https.CallableContext) => {
  // Check if request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { amount, currency = 'usd', metadata } = data;
    
    if (!amount) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Amount is required'
      );
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
      currency,
      metadata: {
        ...metadata,
        firebaseUID: context.auth.uid
      }
    });

    // Store the payment intent info in Firestore
    await db.collection('payment_intents').doc(paymentIntent.id).set({
      paymentIntentId: paymentIntent.id,
      userId: context.auth.uid,
      amount: amount,
      status: paymentIntent.status,
      created: admin.firestore.FieldValue.serverTimestamp(),
      metadata
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create payment intent',
      error
    );
  }
});

/**
 * Confirm payment and update booking status
 */
export const confirmPayment = functions.https.onCall(async (data: PaymentConfirmData, context: functions.https.CallableContext) => {
  // Check if request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { paymentIntentId, bookingId } = data;
    
    if (!paymentIntentId || !bookingId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment intent ID and booking ID are required'
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Verify payment status
    if (paymentIntent.status !== 'succeeded') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Payment is not complete. Status: ${paymentIntent.status}`
      );
    }

    // Update booking status in Firestore
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Booking not found'
      );
    }
    
    // Verify user owns this booking
    const bookingData = bookingDoc.data();
    if (bookingData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User does not have permission to update this booking'
      );
    }
    
    // Update booking status
    await bookingRef.update({
      status: 'confirmed',
      paymentIntentId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, bookingId };
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to confirm payment',
      error
    );
  }
});

/**
 * Cancel a booking, process refund, and delete the product
 */
export const cancelBooking = functions.https.onCall(async (data: CancelBookingData, context: functions.https.CallableContext) => {
  // Check if request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    const { bookingId, paymentIntentId, productId } = data;
    
    if (!bookingId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Booking ID is required'
      );
    }

    // Get the booking from Firestore
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Booking not found'
      );
    }
    
    // Verify user owns this booking
    const bookingData = bookingDoc.data();
    if (bookingData?.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User does not have permission to cancel this booking'
      );
    }

    let refundId = null;
    
    // Process refund if payment intent ID is provided
    if (paymentIntentId) {
      try {
        // Retrieve the payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // Only process refund if the payment was successful
        if (paymentIntent.status === 'succeeded' && paymentIntent.latest_charge) {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer'
          });
          
          refundId = refund.id;
          
          // Log the refund
          await db.collection('refunds').doc(refund.id).set({
            refundId: refund.id,
            paymentIntentId: paymentIntentId,
            bookingId: bookingId,
            userId: context.auth.uid,
            amount: paymentIntent.amount,
            status: refund.status,
            created: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        throw new functions.https.HttpsError(
          'internal',
          'Failed to process refund',
          refundError
        );
      }
    }

    // Delete product if product ID is provided
    if (productId) {
      try {
        // First, we need to archive any prices associated with the product
        const prices = await stripe.prices.list({
          product: productId,
          active: true
        });
        
        // Archive all active prices
        for (const price of prices.data) {
          await stripe.prices.update(price.id, { active: false });
        }
        
        // Then archive the product
        await stripe.products.update(productId, { active: false });
        
        // Log the product deletion
        await db.collection('stripe_products').doc(productId).update({
          active: false,
          deletedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (productError) {
        console.error('Error deleting product:', productError);
        // Continue with booking cancellation even if product deletion fails
      }
    }

    // Update booking status to cancelled
    await bookingRef.update({
      status: 'cancelled',
      refundId,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledBy: context.auth.uid
    });

    return { 
      success: true, 
      bookingId, 
      refundId, 
      message: refundId ? 'Booking cancelled and payment refunded' : 'Booking cancelled' 
    };
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to cancel booking',
      error
    );
  }
});

/**
 * Webhook to handle Stripe events
 */
export const stripeWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.https.Response) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    console.error('No signature provided in webhook');
    return res.status(400).send('Webhook Error: No signature provided');
  }
  
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.rawBody, 
      signature as string, 
      functions.config().stripe.webhook_secret
    );
    
    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      // Add other event handlers as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.status(200).send({ received: true });
  } catch (error: unknown) {
    console.error('Webhook signature verification failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
});

/**
 * Handle successful payment event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment intent in Firestore
    const paymentIntentRef = db.collection('payment_intents').doc(paymentIntent.id);
    await paymentIntentRef.update({
      status: paymentIntent.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Check if there's a booking ID in metadata
    const bookingId = paymentIntent.metadata?.bookingId;
    if (bookingId) {
      // Update booking status
      const bookingRef = db.collection('bookings').doc(bookingId);
      await bookingRef.update({
        status: 'confirmed',
        paymentIntentId: paymentIntent.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

/**
 * Handle failed payment event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment intent in Firestore
    const paymentIntentRef = db.collection('payment_intents').doc(paymentIntent.id);
    await paymentIntentRef.update({
      status: paymentIntent.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Check if there's a booking ID in metadata
    const bookingId = paymentIntent.metadata?.bookingId;
    if (bookingId) {
      // Update booking status
      const bookingRef = db.collection('bookings').doc(bookingId);
      await bookingRef.update({
        status: 'failed',
        paymentIntentId: paymentIntent.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`Payment failed for intent: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
} 