import { Metadata } from 'next';
import BookingForm from './BookingForm';
import AwwwardsLayout from '../components/AwwwardsLayout/AwwwardsLayout';
import styles from './booking.module.scss';

export const metadata: Metadata = {
  title: 'Book a Pod | Vital Elements',
  description: 'Reserve a Vital Elements pod for your immersive experience',
};

export default function BookingPage() {
  return (
    <AwwwardsLayout>
      <main className={styles.container}>
        <section className={styles.hero}>
          <h1>Book Your Vital Elements Pod</h1>
          <p>Reserve your immersive experience in one of our state-of-the-art pods</p>
        </section>
        
        <section className={styles.bookingSection}>
          <div className={styles.infoPanel}>
            <div className={styles.infoCard}>
              <h2>About Our Pods</h2>
              <p>
                Vital Elements pods offer a premium immersive experience with cutting-edge technology.
                Each pod is equipped with high-resolution displays, spatial audio, and environmental
                controls to create the perfect atmosphere for your chosen activity.
              </p>
              
              <h3>Features:</h3>
              <ul className={styles.featuresList}>
                <li>High-resolution 360° displays</li>
                <li>Spatial audio system</li>
                <li>Climate and lighting control</li>
                <li>Comfortable seating</li>
                <li>Private, soundproofed environment</li>
                <li>Access to all purchased environments</li>
              </ul>
              
              <h3>Locations:</h3>
              <p>
                Our pods are available at select locations across the United States. Use the interactive
                map in the booking form to choose your nearest location. Each location has a limited 
                number of pods available, so be sure to book in advance to secure your preferred time.
              </p>
              
              <h3>Real-time Availability:</h3>
              <p>
                Our booking system shows real-time pod availability at each location. When you select
                a date and location, you&apos;ll see which time slots are available and how many pods
                remain for each slot. This ensures you can always find a time that works for you.
              </p>
            </div>
            
            <div className={styles.imageContainer}>
              <img 
                src="/pod-image.jpg" 
                alt="Vital Elements Pod" 
                className={styles.podImage}
              />
            </div>
          </div>
          
          <div className={styles.formContainer}>
            <BookingForm />
          </div>
        </section>
      </main>
    </AwwwardsLayout>
  );
} 