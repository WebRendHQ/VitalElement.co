'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/app/lib/firebase-client';
import styles from './ComingSoon.module.scss';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gradientRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate position as percentage of window
      const x = clientX / innerWidth;
      const y = clientY / innerHeight;
      
      // Update gradient position with a bit of lag for smoothness
      gradientRef.current.style.setProperty('--mouse-x', `${x}`);
      gradientRef.current.style.setProperty('--mouse-y', `${y}`);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Add email to Firestore
      await addDoc(collection(db, 'comingSoonEmails'), {
        email,
        createdAt: new Date(),
      });
      
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Error adding email:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.gradientBackground} ref={gradientRef}>
        <div className={styles.gradientLayer}></div>
        <div className={styles.gradientLayer}></div>
        <div className={styles.gradientLayer}></div>
      </div>
      
      <div className={styles.content}>
        <motion.div 
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.logoContainer}>
            <h1 className={styles.logo}>VITAL ELEMENT</h1>
          </div>
          
          <motion.h2 
            className={styles.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Coming Soon
          </motion.h2>
          
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            We're crafting something special for you. 
            Be the first to know when we launch.
          </motion.p>
          
          {!submitted ? (
            <motion.form 
              className={styles.form}
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={styles.input}
                  disabled={isSubmitting}
                />
                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Notify Me'}
                </button>
              </div>
              {error && <p className={styles.error}>{error}</p>}
            </motion.form>
          ) : (
            <motion.div 
              className={styles.successMessage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg className={styles.checkmark} viewBox="0 0 52 52">
                <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
              <p>Thank you! We'll notify you when we launch.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 