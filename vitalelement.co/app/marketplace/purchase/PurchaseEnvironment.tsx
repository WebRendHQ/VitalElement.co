'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase-client';
import { useAuthState } from 'react-firebase-hooks/auth';
import styles from './purchase.module.css';

interface Environment {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stripePriceId: string;
}

export default function PurchaseEnvironment({ environment }: { environment: Environment }) {
  const [user, loading] = useAuthState(auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async () => {
    if (!user) {
      router.push(`/auth?redirect=/marketplace/purchase?id=${environment.id}`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/one-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          priceId: environment.stripePriceId,
          metadata: {
            environmentId: environment.id,
            type: 'environment',
            purchaseType: 'one-time'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.purchaseCard}>
        <div className={styles.imageContainer}>
          <img 
            src={environment.imageUrl || '/placeholder-environment.jpg'} 
            alt={environment.name} 
            className={styles.environmentImage}
          />
        </div>
        
        <div className={styles.purchaseDetails}>
          <h1>{environment.name}</h1>
          <p className={styles.description}>{environment.description}</p>
          
          <div className={styles.priceSection}>
            <span className={styles.price}>${(environment.price / 100).toFixed(2)}</span>
            <span className={styles.oneTime}>One-time purchase</span>
          </div>
          
          <div className={styles.features}>
            <h3>Features:</h3>
            <ul>
              <li>Permanent access to this environment</li>
              <li>Use in any Vital Elements pod</li>
              <li>High-quality immersive experience</li>
              <li>Regular updates and improvements</li>
            </ul>
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button 
            className={styles.purchaseButton}
            onClick={handlePurchase}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Purchase Now'}
          </button>
          
          <p className={styles.secureNote}>
            <span className={styles.lockIcon}>🔒</span> Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
} 