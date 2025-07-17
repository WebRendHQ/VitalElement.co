import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import { stripe } from '../../../lib/stripe';
import { getAuth } from 'firebase-admin/auth';

async function getOrCreateStripeCustomer(userId: string) {
  try {
    // First try to get existing customer
    const userDoc = await db.collection('customers').doc(userId).get();
    const existingStripeId = userDoc.data()?.stripeId;

    if (userDoc.exists && existingStripeId) {
      return existingStripeId;
    }

    // If no customer exists, create a new one
    const user = await getAuth().getUser(userId);
    
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: {
        firebaseUID: userId
      }
    });

    await db.collection('customers').doc(userId).set({
      stripeId: customer.id,
      email: user.email
    }, { merge: true });

    return customer.id;
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomer:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, priceId, metadata = {} } = body;

    if (!userId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(userId);
    
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve Stripe customer' },
        { status: 400 }
      );
    }

    // Verify the price ID exists
    try {
      await stripe.prices.retrieve(priceId);
    } catch (error) {
      console.error('Error retrieving price:', error);
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    // Create a unique allowance ID for this purchase
    const allowanceId = `allow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Add the allowance ID to metadata
    const enhancedMetadata = {
      ...metadata,
      firebaseUID: userId,
      allowanceId
    };

    // Create checkout session for one-time purchase
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/marketplace`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      client_reference_id: userId,
      metadata: enhancedMetadata
    });

    // Pre-create a purchase document to help with tracking
    await db.collection('users').doc(userId).collection('purchases').doc(session.id).set({
      sessionId: session.id,
      created: new Date().toISOString(),
      priceId: priceId,
      status: 'created',
      allowanceId,
      metadata: enhancedMetadata
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    
    if (error instanceof Error && 'type' in error && error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 