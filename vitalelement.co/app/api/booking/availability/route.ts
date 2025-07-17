import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

// Define the maximum number of pods per location
const LOCATION_PODS = {
  'nyc': 5,
  'sf': 3,
  'la': 4,
  'chicago': 3,
  'miami': 2
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const date = searchParams.get('date');
    const timeSlot = searchParams.get('timeSlot');

    if (!location || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the maximum number of pods for this location
    const maxPods = LOCATION_PODS[location as keyof typeof LOCATION_PODS] || 0;
    
    if (maxPods === 0) {
      return NextResponse.json(
        { error: 'Invalid location' },
        { status: 400 }
      );
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

    return NextResponse.json({
      location,
      date,
      timeSlot,
      maxPods,
      bookedPods,
      availablePods,
      isAvailable: availablePods > 0
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location, date, timeSlots } = body;

    if (!location || !date || !timeSlots || !Array.isArray(timeSlots)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the maximum number of pods for this location
    const maxPods = LOCATION_PODS[location as keyof typeof LOCATION_PODS] || 0;
    
    if (maxPods === 0) {
      return NextResponse.json(
        { error: 'Invalid location' },
        { status: 400 }
      );
    }

    // Query Firestore for all bookings at this location and date
    const bookingsSnapshot = await db.collection('bookings')
      .where('location', '==', location)
      .where('date', '==', date)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    // Count bookings for each time slot
    const bookingCounts: Record<string, number> = {};
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const timeSlot = booking.timeSlot;
      bookingCounts[timeSlot] = (bookingCounts[timeSlot] || 0) + 1;
    });

    // Calculate availability for each requested time slot
    const availability = timeSlots.map(timeSlot => {
      const bookedPods = bookingCounts[timeSlot] || 0;
      const availablePods = maxPods - bookedPods;
      
      return {
        timeSlot,
        maxPods,
        bookedPods,
        availablePods,
        isAvailable: availablePods > 0
      };
    });

    return NextResponse.json({
      location,
      date,
      availability
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 