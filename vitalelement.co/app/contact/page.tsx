import { Metadata } from 'next';
import AwwwardsLayout from '../components/AwwwardsLayout/AwwwardsLayout';
import styles from './contact.module.scss';

export const metadata: Metadata = {
  title: 'Contact Us | Vital Elements',
  description: 'Get in touch with Vital Elements for inquiries about our pods and environments',
};

export default function ContactPage() {
  return (
    <AwwwardsLayout>
      <main className={styles.container}>
        <section className={styles.hero}>
          <h1>Contact Us</h1>
          <p>We&apos;d love to hear from you. Reach out with any questions about our pods or environments.</p>
        </section>
        
        <section className={styles.contactSection}>
          <div className={styles.contactInfo}>
            <div className={styles.infoCard}>
              <h2>Get in Touch</h2>
              <div className={styles.infoItem}>
                <h3>Email</h3>
                <p>hello@vitalelements.co</p>
              </div>
              <div className={styles.infoItem}>
                <h3>Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
              <div className={styles.infoItem}>
                <h3>Headquarters</h3>
                <p>123 Wellness Avenue<br />San Francisco, CA 94103</p>
              </div>
              <div className={styles.infoItem}>
                <h3>Hours</h3>
                <p>Monday - Friday: 9am - 6pm<br />Saturday: 10am - 4pm<br />Sunday: Closed</p>
              </div>
            </div>
          </div>
          
          <div className={styles.contactForm}>
            <form className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" placeholder="Your name" required />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Your email" required />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" name="subject" placeholder="Subject" required />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows={5} placeholder="Your message" required></textarea>
              </div>
              
              <button type="submit" className={styles.submitButton}>Send Message</button>
            </form>
          </div>
        </section>
      </main>
    </AwwwardsLayout>
  );
} 