'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
        <h1 className="page-header__title">About ABUTutorsConnect</h1>
        <p className="page-header__subtitle">Empowering ABU Students Through Peer-Led Learning</p>
      </div>

      <div style={{ maxWidth: '900px', margin: 'var(--space-8) auto' }}>
        <section style={{ marginBottom: '60px' }}>
          <h2 className="section-header__title" style={{ marginBottom: '20px' }}>Our Mission</h2>
          <p style={{ fontSize: '18px', lineHeight: '1.8', color: 'var(--color-text-secondary)' }}>
            ABUTutorsConnect was born out of a simple observation: students often learn best from their peers who have recently navigated the same academic challenges. Our mission is to democratize academic support within Ahmadu Bello University by connecting ambitious students with proven peer experts.
          </p>
        </section>

        <div className="grid-2" style={{ gap: '40px', marginBottom: '60px' }}>
          <div className="card">
            <div className="card__body">
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>For Students</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Whether you're struggling with Engineering Mathematics or need help understanding Accounting principles, ABUTutorsConnect provides a safe and easy way to find help on campus.
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card__body">
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>For Tutors</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                If you excel in your studies, our platform gives you the opportunity to monetize your expertise, build your CV, and reinforce your own knowledge by teaching others.
              </p>
            </div>
          </div>
        </div>

        <section style={{ textAlign: 'center', background: 'var(--color-primary-light)', padding: '60px 40px', borderRadius: '24px' }}>
          <h2 className="section-header__title" style={{ marginBottom: '20px' }}>Join the Community</h2>
          <p style={{ marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Ready to improve your grades or start your journey as a tutor? Join thousands of other ABU students today.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn--primary">Get Started</Link>
            <Link href="/tutors" className="btn btn--secondary">Explore Tutors</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
