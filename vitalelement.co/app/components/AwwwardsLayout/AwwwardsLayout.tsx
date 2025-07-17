'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './AwwwardsLayout.module.scss';

interface AwwwardsLayoutProps {
  children: React.ReactNode;
}

export default function AwwwardsLayout({ children }: AwwwardsLayoutProps) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    // Reset loading state on route change
    setLoading(true);
    setProgress(0);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [pathname]);

  return (
    <div className={styles.layout}>
      {loading && (
        <div className={styles.loader}>
          <div className={styles.loaderContent}>
            <div className={styles.loaderLogo}>VE</div>
            <div className={styles.loaderProgressContainer}>
              <div 
                className={styles.loaderProgressBar} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className={styles.loaderText}>
              {progress}%
            </div>
          </div>
        </div>
      )}

      <div 
        className={styles.cursor} 
        style={{ 
          left: `${mousePosition.x}px`, 
          top: `${mousePosition.y}px`,
          opacity: loading ? 0 : 1
        }}
      ></div>

      <div className={`${styles.content} ${loading ? styles.hidden : ''}`}>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
} 