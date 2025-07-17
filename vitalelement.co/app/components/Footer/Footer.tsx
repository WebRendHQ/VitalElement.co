// app/components/Footer.tsx
import Link from 'next/link'
import Image from 'next/image'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-cta">
        <div className="footer-cta-content">
          <h2 className="footer-cta-title">Experience Vital Elements</h2>
          <p className="footer-cta-text">
            Immerse yourself in therapeutic environments designed to enhance your wellbeing.
          </p>
          <Link href="/booking" className="footer-cta-button">
            <span>BOOK A POD SESSION</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
        <div className="footer-cta-image" aria-hidden="true">
          <Image 
            src="/pod-image.jpg" 
            alt="Vital Elements Pod" 
            width={200}
            height={200}
            quality={100}
            style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
          />
        </div>
      </div>

      <div className="footer-content">
        <div className="footer-sections">
          <div className="footer-section">
            <h3>Services</h3>
            <div className="footer-links">
              <Link href="/booking" className="footer-link">Pod Booking</Link>
              <Link href="/marketplace" className="footer-link">Environments</Link>
              <Link href="/therapy" className="footer-link">Therapeutic Sessions</Link>
              <Link href="/corporate" className="footer-link">Corporate Wellness</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Connect</h3>
            <div className="footer-links">
              <Link href="https://instagram.com/vitalelements" className="footer-link">Instagram</Link>
              <Link href="https://twitter.com/vitalelements" className="footer-link">Twitter</Link>
              <Link href="https://linkedin.com/company/vitalelements" className="footer-link">LinkedIn</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Resources</h3>
            <div className="footer-links">
              <Link href="/blog" className="footer-link">Wellness Blog</Link>
              <Link href="/research" className="footer-link">Research</Link>
              <Link href="/terms" className="footer-link">Terms</Link>
              <Link href="/privacy" className="footer-link">Privacy</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Contact</h3>
            <div className="footer-links">
              <Link href="mailto:hello@vitalelements.co" className="footer-link">hello@vitalelements.co</Link>
              <Link href="/locations" className="footer-link">Our Locations</Link>
              <div className="footer-link">Enhancing wellbeing through immersive experiences</div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-text">
            © {new Date().getFullYear()} Vital Elements. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}