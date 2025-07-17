import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import { stripe } from '../../../lib/stripe';
import { getAuth } from 'firebase-admin/auth';

// Define the maximum number of pods per location
const LOCATION_PODS = {
  'nyc': 5,
  'sf': 3,
  'la': 4,
  'chicago': 3,
  'miami': 2
};

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

interface AvailabilityResult {
  isAvailable: boolean;
  availablePods?: number;
  maxPods?: number;
  bookedPods?: number;
  error?: string;
}

async function checkAvailability(location: string, date: string, timeSlot: string): Promise<AvailabilityResult> {
  try {
    // Get the maximum number of pods for this location
    const maxPods = LOCATION_PODS[location as keyof typeof LOCATION_PODS] || 0;
    
    if (maxPods === 0) {
      return { isAvailable: false, error: 'Invalid location' };
    }

    // Query Firestore for existing bookings at this location, date, and time slot
    const bookingsSnapshot = await db.collection('bookings')
      .where('location', '==', location)
      .where('date', '==', date)
      .where('timeSlot', '==', timeSlot)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    const bookedPods = bookingsSnapshot.size;
    const availablePods = maxPods - bookedPods;

    return {
      isAvailable: availablePods > 0,
      availablePods,
      maxPods,
      bookedPods
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { isAvailable: false, error: 'Failed to check availability' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      priceId, 
      duration = 1, 
      category, 
      location, 
      date, 
      timeSlot, 
      userToken,
      metadata = {} 
    } = body;

    if (!userId || !priceId || !category || !location || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the user token
    try {
      await getAuth().verifyIdToken(userToken);
    } catch (error) {
      console.error('Invalid user token:', error);
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check availability before proceeding
    const availability = await checkAvailability(location, date, timeSlot);
    
    if (!availability.isAvailable) {
      return NextResponse.json(
        { error: availability.error || 'This time slot is no longer available' },
        { status: 409 } // Conflict status code
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

    // Create a unique booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Add the booking ID to metadata
    const enhancedMetadata = {
      ...metadata,
      firebaseUID: userId,
      bookingId,
      userToken
    };

    // Calculate the amount based on duration (assuming price is per hour)
    const unitAmount = 3000; // $30.00 per hour in cents
    const amount = unitAmount * duration;

    // Create checkout session for booking
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Pod Booking - ${category}`,
            description: `${duration} hour${duration !== 1 ? 's' : ''} on ${date} at ${timeSlot} (${location})`,
          },
          unit_amount: unitAmount,
        },
        quantity: duration,
      }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/booking`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      client_reference_id: userId,
      metadata: enhancedMetadata
    });

    // Create a booking document in Firestore
    await db.collection('bookings').doc(bookingId).set({
      userId,
      bookingId,
      sessionId: session.id,
      category,
      location,
      date,
      timeSlot,
      duration,
      status: 'pending',
      created: new Date().toISOString(),
      amount,
      availablePods: (availability.availablePods || 0) - 1, // Decrement available pods
      maxPods: availability.maxPods || 0
    });

    // Also store in user's bookings collection
    await db.collection('users').doc(userId).collection('bookings').doc(bookingId).set({
      bookingId,
      sessionId: session.id,
      category,
      location,
      date,
      timeSlot,
      duration,
      status: 'pending',
      created: new Date().toISOString(),
      amount
    });

    return NextResponse.json({ 
      sessionId: session.id,
      bookingId,
      url: session.url 
    });
  } catch (error: unknown) {
    console.error('Booking error:', error);
    
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