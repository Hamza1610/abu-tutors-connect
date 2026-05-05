'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="app-footer__grid">
          <div className="footer-brand">
            <img src="/logo.png" alt="ABUTutors" style={{ height: '40px', marginBottom: '20px' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', maxWidth: '300px' }}>
              The official peer-tutoring marketplace for Ahmadu Bello University students. Empowering academic excellence through peer-led learning.
            </p>
          </div>
          <div>
            <h4 className="app-footer__title">Platform</h4>
            <ul className="app-footer__links">
              <li><Link href="/tutors">Find Tutors</Link></li>
              <li><Link href="/ai-match">AI Matching</Link></li>
              <li><Link href="/register">Join as Student</Link></li>
              <li><Link href="/register?role=tutor">Become a Tutor</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="app-footer__title">Support</h4>
            <ul className="app-footer__links">
              <li><Link href="/faq">FAQs</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/about">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="app-footer__title">Contact</h4>
            <ul className="app-footer__links" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              <li>📍 ABU Main Campus, Samaru, Zaria</li>
              <li>📧 support@abututors.edu.ng</li>
              <li>📞 +234 902 688 0099</li>
            </ul>
          </div>
        </div>
        <div className="app-footer__bottom">
          <p>© {new Date().getFullYear()} ABUTutorsConnect. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
