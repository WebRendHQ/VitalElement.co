'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../lib/firebase-client';
import { User } from 'firebase/auth';
import Image from 'next/image';
import styles from './NavBar.module.scss';

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.refresh();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logoContainer}>
          <Image 
            src="/logo.png" 
            alt="Vital Elements Logo" 
            width={28} 
            height={28} 
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Vital Elements</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>
            Home
          </Link>
          <Link href="/booking" className={`${styles.navLink} ${pathname === '/booking' ? styles.active : ''}`}>
            Book a Pod
          </Link>
          <Link href="/marketplace" className={`${styles.navLink} ${pathname === '/marketplace' ? styles.active : ''}`}>
            Environments
          </Link>
          <Link href="/about" className={`${styles.navLink} ${pathname === '/about' ? styles.active : ''}`}>
            About
          </Link>
          <Link href="/contact" className={`${styles.navLink} ${pathname === '/contact' ? styles.active : ''}`}>
            Contact
          </Link>
        </div>

        <div className={styles.authButtons}>
          {!loading && (
            <>
              {user ? (
                <div className={styles.authdiv}>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    Log Out
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/auth" className={styles.loginButton}>
                    Log In
                  </Link>
                  <Link href="/auth?signup=true" className={styles.signupButton}>
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile modal code has been removed */}
    </nav>
  );
};

export default NavBar;