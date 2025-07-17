import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '../../lib/firebase-admin';
import PurchaseEnvironment from './PurchaseEnvironment';

export const metadata: Metadata = {
  title: 'Purchase Environment | Vital Elements',
  description: 'Complete your purchase of a Vital Elements environment',
};

interface Environment {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stripePriceId: string;
}

async function getEnvironment(id: string): Promise<Environment | null> {
  try {
    const doc = await db.collection('environments').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data() as Omit<Environment, 'id'>
    };
  } catch (error) {
    console.error('Error fetching environment:', error);
    return null;
  }
}

// Define the proper types for Next.js App Router page props
type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function PurchasePage({ searchParams }: Props) {
  const environmentId = searchParams.id as string | undefined;
  
  if (!environmentId) {
    redirect('/marketplace');
  }
  
  const environment = await getEnvironment(environmentId);
  
  if (!environment) {
    redirect('/marketplace');
  }
  
  return <PurchaseEnvironment environment={environment} />;
} 