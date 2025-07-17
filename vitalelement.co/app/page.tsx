'use client';

import { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import AwwwardsLayout from './components/AwwwardsLayout/AwwwardsLayout';
import styles from './page.module.scss';

// import HeroSection from './components/index/HeroSection/HeroSection';
// import TabComponent from './components/index/TabComponent/TabComponent';
// import FeaturesSection from './components/index/FeatureSection/FeatureSection';
// import Newsletter from './components/index/Newsletter/Newsletter';
// import LovedBy from './components/index/LovedBy/LovedBy';
// import ConvergingFeatures from './components/index/ConvergingFeatures/ConvergingFeatures';
// import FAQ from './components/FAQ/FAQ';
// import Trusted from '../app/components/index/Trusted/Trusted';


// import DTFA from "./components/index/DTFA/DTFA";
// import VideoSection from "./components/index/VideoSection/VideoSection";

export default function Home() {
  // We keep the scroll tracking for potential future animations
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The scrollY value will be used in future animation enhancements
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = scrollY;

  return (
    <AwwwardsLayout>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Immersive Therapeutic Experiences</h1>
          <p className={styles.heroSubtitle}>
            Discover a new dimension of wellness with Vital Elements. Our immersive pods and environments
            are designed to enhance your mental wellbeing through cutting-edge technology.
          </p>
          <div className={styles.heroCta}>
            <Link href="/booking" className={styles.primaryButton}>
              Book a Pod
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/marketplace" className={styles.secondaryButton}>
              Explore Environments
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresContent}>
          <div className={styles.sectionTitle}>
            <h2>Enhance Your Wellbeing</h2>
            <p>Our therapeutic pods offer a range of benefits for your mental and emotional health</p>
          </div>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>Stress Reduction</h3>
              <p>Immerse yourself in calming environments designed to reduce stress and anxiety, promoting a sense of peace and relaxation.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3>Mental Clarity</h3>
              <p>Experience enhanced focus and mental clarity through our specially designed environments that minimize distractions.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3>Emotional Wellbeing</h3>
              <p>Improve your emotional health with environments that promote positive feelings and help process difficult emotions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.environments}>
        <div className={styles.environmentsContent}>
          <div className={styles.sectionTitle}>
            <h2>Explore Our Environments</h2>
            <p>Discover our collection of therapeutic digital environments designed for various needs</p>
          </div>
          
          <div className={styles.environmentGrid}>
            <div className={styles.environmentCard}>
              <div className={styles.environmentImageContainer}>
                <Image 
                  src="/environments/meditation.jpg" 
                  alt="Meditation Environment" 
                  width={400}
                  height={200}
                  className={styles.environmentImage}
                />
              </div>
              <div className={styles.environmentInfo}>
                <h3>Meditation Sanctuary</h3>
                <p>A peaceful environment designed to enhance your meditation practice with calming visuals and sounds.</p>
                <Link href="/marketplace" className={styles.primaryButton}>
                  Learn More
                </Link>
              </div>
            </div>
            
            <div className={styles.environmentCard}>
              <div className={styles.environmentImageContainer}>
                <Image 
                  src="/environments/forest.jpg" 
                  alt="Forest Retreat" 
                  width={400}
                  height={200}
                  className={styles.environmentImage}
                />
              </div>
              <div className={styles.environmentInfo}>
                <h3>Forest Retreat</h3>
                <p>Immerse yourself in a lush forest environment with the sounds of nature to reduce stress and anxiety.</p>
                <Link href="/marketplace" className={styles.primaryButton}>
                  Learn More
                </Link>
              </div>
            </div>
            
            <div className={styles.environmentCard}>
              <div className={styles.environmentImageContainer}>
                <Image 
                  src="/environments/ocean.jpg" 
                  alt="Ocean Calm" 
                  width={400}
                  height={200}
                  className={styles.environmentImage}
                />
              </div>
              <div className={styles.environmentInfo}>
                <h3>Ocean Calm</h3>
                <p>Experience the tranquility of ocean waves and coastal scenery to promote relaxation and peace.</p>
                <Link href="/marketplace" className={styles.primaryButton}>
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.testimonials}>
        <div className={styles.testimonialsContent}>
          <div className={styles.sectionTitle}>
            <h2>What Our Clients Say</h2>
            <p>Hear from people who have experienced the benefits of Vital Elements</p>
          </div>
          
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              <p className={styles.quote}>
                &ldquo;The meditation environment has completely transformed my practice. I&apos;ve never felt so focused and at peace during meditation.&rdquo;
              </p>
              <div className={styles.author}>
                <div className={styles.authorImage}>
                  <Image 
                    src="/testimonials/person1.jpg" 
                    alt="Sarah J." 
                    width={50}
                    height={50}
                  />
                </div>
                <div className={styles.authorInfo}>
                  <h4>Sarah J.</h4>
                  <p>Meditation Practitioner</p>
                </div>
              </div>
            </div>
            
            <div className={styles.testimonialCard}>
              <p className={styles.quote}>
                &ldquo;As a therapist, I&apos;ve seen remarkable progress in my clients who use the Vital Elements pods. It&apos;s a powerful tool for emotional healing.&rdquo;
              </p>
              <div className={styles.author}>
                <div className={styles.authorImage}>
                  <Image 
                    src="/testimonials/person2.jpg" 
                    alt="Dr. Michael T." 
                    width={50}
                    height={50}
                  />
                </div>
                <div className={styles.authorInfo}>
                  <h4>Dr. Michael T.</h4>
                  <p>Clinical Psychologist</p>
                </div>
              </div>
            </div>
            
            <div className={styles.testimonialCard}>
              <p className={styles.quote}>
                &ldquo;The Forest Retreat environment helps me unwind after stressful workdays. It&apos;s like having a nature escape without leaving the city.&rdquo;
              </p>
              <div className={styles.author}>
                <div className={styles.authorImage}>
                  <Image 
                    src="/testimonials/person3.jpg" 
                    alt="Emma L." 
                    width={50}
                    height={50}
                  />
                </div>
                <div className={styles.authorInfo}>
                  <h4>Emma L.</h4>
                  <p>Marketing Executive</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Begin Your Wellness Journey Today</h2>
          <p className={styles.ctaText}>
            Experience the transformative power of Vital Elements pods and environments.
            Book your session now and take the first step toward enhanced wellbeing.
          </p>
          <Link href="/booking" className={styles.primaryButton}>
            Book a Pod Session
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
    </div>
      </section>
    </AwwwardsLayout>
  );
}