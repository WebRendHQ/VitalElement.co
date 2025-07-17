import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '../../lib/firebase-admin';
import { stripe } from '../../lib/stripe';
import styles from './success.module.css';

export const metadata: Metadata = {
  title: 'Purchase Successful | Vital Elements',
  description: 'Your purchase was successful',
};

async function getSessionDetails(sessionId: string) {
  try {
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer']
    });

    if (!session) {
      return null;
    }

    // Get the user ID from the client reference
    const userId = session.client_reference_id;
    
    if (!userId) {
      return { session };
    }

    // Get the purchase from Firestore
    const purchaseDoc = await db.collection('users').doc(userId).collection('purchases').doc(sessionId).get();
    
    if (!purchaseDoc.exists) {
      return { session };
    }

    // If the purchase exists but status is still 'created', update it to 'completed'
    const purchaseData = purchaseDoc.data();
    if (purchaseData?.status === 'created') {
      await db.collection('users').doc(userId).collection('purchases').doc(sessionId).update({
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Create an entry in the environments collection for this user
      if (purchaseData?.metadata?.environmentId && purchaseData?.metadata?.type === 'environment') {
        await db.collection('users').doc(userId).collection('environments').doc(purchaseData.metadata.environmentId).set({
          environmentId: purchaseData.metadata.environmentId,
          purchasedAt: new Date().toISOString(),
          sessionId: sessionId,
          allowanceId: purchaseData.allowanceId
        });
      }
    }

    return {
      session,
      purchase: purchaseData
    };
  } catch (error) {
    console.error('Error retrieving session details:', error);
    return null;
  }
}

// Define the proper types for Next.js App Router page props
type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function SuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id as string | undefined;
  
  if (!sessionId) {
    redirect('/marketplace');
  }
  
  const sessionDetails = await getSessionDetails(sessionId);
  
  if (!sessionDetails) {
    redirect('/marketplace');
  }

  const { session, purchase } = sessionDetails;
  const environmentId = purchase?.metadata?.environmentId;

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h1>Thank You for Your Purchase!</h1>
        <p className={styles.message}>
          Your transaction was successful and your purchase has been completed.
        </p>
        
        <div className={styles.orderDetails}>
          <h2>Order Details</h2>
          <div className={styles.detailRow}>
            <span>Order ID:</span>
            <span>{sessionId.substring(0, 8)}...</span>
          </div>
          <div className={styles.detailRow}>
            <span>Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Total:</span>
            <span>${((session.amount_total || 0) / 100).toFixed(2)}</span>
          </div>
        </div>
        
        <div className={styles.buttonContainer}>
          {environmentId ? (
            <Link href={`/environments/${environmentId}`} className={styles.primaryButton}>
              View Your Environment
            </Link>
          ) : (
            <Link href="/dashboard" className={styles.primaryButton}>
              Go to Dashboard
            </Link>
          )}
          <Link href="/marketplace" className={styles.secondaryButton}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
} 