import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '../lib/firebase-admin';
import AwwwardsLayout from '../components/AwwwardsLayout/AwwwardsLayout';
import styles from './marketplace.module.css';

export const metadata: Metadata = {
  title: 'Marketplace | Vital Elements',
  description: 'Purchase environments and digital assets for your Vital Elements experience',
};

interface Environment {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stripePriceId: string;
}

async function getEnvironments() {
  try {
    const environmentsSnapshot = await db.collection('environments').get();
    return environmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Environment[];
  } catch (error) {
    console.error('Error fetching environments:', error);
    return [];
  }
}

export default async function MarketplacePage() {
  const environments = await getEnvironments();

  return (
    <AwwwardsLayout>
      <main className={styles.container}>
        <section className={styles.hero}>
          <h1>Vital Elements Marketplace</h1>
          <p>Discover and purchase premium environments for your Vital Elements experience</p>
        </section>

        <section className={styles.environmentsGrid}>
          {environments.length > 0 ? (
            environments.map((env: Environment) => (
              <div key={env.id} className={styles.environmentCard}>
                <div className={styles.imageContainer}>
                  <img 
                    src={env.imageUrl || '/placeholder-environment.jpg'} 
                    alt={env.name} 
                    className={styles.environmentImage}
                  />
                </div>
                <div className={styles.environmentInfo}>
                  <h2>{env.name}</h2>
                  <p>{env.description}</p>
                  <div className={styles.priceContainer}>
                    <span className={styles.price}>${(env.price / 100).toFixed(2)}</span>
                    <Link 
                      href={`/marketplace/purchase?id=${env.id}`}
                      className={styles.purchaseButton}
                    >
                      Purchase
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noEnvironments}>
              <p>No environments available at the moment. Please check back later.</p>
            </div>
          )}
        </section>
      </main>
    </AwwwardsLayout>
  );
} 