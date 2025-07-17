import { Metadata } from 'next';
import AwwwardsLayout from '../components/AwwwardsLayout/AwwwardsLayout';
import styles from './about.module.scss';

export const metadata: Metadata = {
  title: 'About Us | Vital Elements',
  description: 'Learn about Vital Elements and our mission to enhance wellbeing through immersive experiences',
};

export default function AboutPage() {
  return (
    <AwwwardsLayout>
      <main className={styles.container}>
        <section className={styles.hero}>
          <h1>About Vital Elements</h1>
          <p>Our mission is to enhance wellbeing through immersive therapeutic experiences</p>
        </section>
        
        <section className={styles.content}>
          <div className={styles.aboutCard}>
            <h2>Our Story</h2>
            <p>
              Vital Elements was founded with a simple yet powerful vision: to create immersive experiences 
              that positively impact mental wellbeing. Our journey began when our founders recognized the 
              potential of combining cutting-edge technology with therapeutic principles to create environments 
              that could help people manage stress, anxiety, and other mental health challenges.
            </p>
            <p>
              Today, we're proud to offer a range of immersive environments and pod experiences that are 
              designed to help our clients find peace, clarity, and emotional balance in their busy lives.
            </p>
          </div>
          
          <div className={styles.aboutCard}>
            <h2>Our Approach</h2>
            <p>
              At Vital Elements, we believe in the power of immersive experiences to transform how we feel 
              and think. Our approach combines insights from psychology, neuroscience, and design to create 
              environments that engage multiple senses and promote positive mental states.
            </p>
            <p>
              Each of our environments is carefully crafted to address specific needs, whether it's reducing 
              stress, enhancing focus, or facilitating emotional processing. We work with experts in various 
              fields to ensure our experiences are both effective and enjoyable.
            </p>
          </div>
          
          <div className={styles.aboutCard}>
            <h2>Our Team</h2>
            <p>
              Our diverse team brings together expertise in technology, psychology, design, and business. 
              We're united by our passion for creating experiences that make a positive difference in people's lives.
            </p>
            <p>
              From our developers who build the digital environments to our therapists who inform their design, 
              everyone at Vital Elements is committed to our mission of enhancing wellbeing through immersive experiences.
            </p>
          </div>
        </section>
      </main>
    </AwwwardsLayout>
  );
} 