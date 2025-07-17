import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '../../lib/firebase-admin';
import { stripe } from '../../lib/stripe';
import styles from './confirmation.module.css';

export const metadata: Metadata = {
  title: 'Booking Confirmation | Vital Elements',
  description: 'Your pod booking has been confirmed',
};

async function getBookingDetails(sessionId: string) {
  try {
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer']
    });

    if (!session) {
      return null;
    }

    // Get the booking ID from metadata
    const bookingId = session.metadata?.bookingId;
    
    if (!bookingId) {
      return { session };
    }

    // Get the booking from Firestore
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      return { session };
    }

    // If the booking exists but status is still 'pending', update it to 'confirmed'
    const bookingData = bookingDoc.data();
    if (bookingData?.status === 'pending') {
      await db.collection('bookings').doc(bookingId).update({
        status: 'confirmed',
        confirmedAt: new Date().toISOString()
      });

      // Also update in user's bookings collection
      const userId = bookingData.userId;
      if (userId) {
        await db.collection('users').doc(userId).collection('bookings').doc(bookingId).update({
          status: 'confirmed',
          confirmedAt: new Date().toISOString()
        });
      }
    }

    return {
      session,
      booking: bookingData
    };
  } catch (error) {
    console.error('Error retrieving booking details:', error);
    return null;
  }
}

// Define the proper types for Next.js App Router page props
type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ConfirmationPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id as string | undefined;
  
  if (!sessionId) {
    redirect('/booking');
  }
  
  const bookingDetails = await getBookingDetails(sessionId);
  
  if (!bookingDetails) {
    redirect('/booking');
  }

  const { session, booking } = bookingDetails;

  // Format the date
  const formattedDate = booking?.date ? new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Date not available';

  return (
    <div className={styles.container}>
      <div className={styles.confirmationCard}>
        <div className={styles.confirmationIcon}>✓</div>
        <h1>Booking Confirmed!</h1>
        <p className={styles.message}>
          Your pod has been successfully booked. We look forward to seeing you!
        </p>
        
        <div className={styles.bookingDetails}>
          <h2>Booking Details</h2>
          
          <div className={styles.detailRow}>
            <span>Booking ID:</span>
            <span>{booking?.bookingId?.substring(0, 8)}...</span>
          </div>
          
          <div className={styles.detailRow}>
            <span>Date:</span>
            <span>{formattedDate}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span>Time:</span>
            <span>{booking?.timeSlot}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span>Duration:</span>
            <span>{booking?.duration} hour{booking?.duration !== 1 ? 's' : ''}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span>Location:</span>
            <span>{booking?.location}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span>Category:</span>
            <span>{booking?.category}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span>Total Paid:</span>
            <span>${((session.amount_total || 0) / 100).toFixed(2)}</span>
          </div>
        </div>
        
        <div className={styles.instructions}>
          <h3>What&apos;s Next?</h3>
          <p>
            Please arrive 10 minutes before your scheduled time. Bring your confirmation
            email or booking ID. Your pod will be unlocked automatically at your scheduled time
            using the authentication token associated with your account.
          </p>
        </div>
        
        <div className={styles.buttonContainer}>
          <Link href="/dashboard" className={styles.primaryButton}>
            Go to Dashboard
          </Link>
          <Link href="/booking" className={styles.secondaryButton}>
            Book Another Pod
          </Link>
        </div>
      </div>
    </div>
  );
} 