'use client';

import React from 'react';
import Link from 'next/link';

export default function PaymentConfirmationPage() {
  return (
    <main className="container pb-space-8 pt-space-8">
      <div style={{ marginTop: 'var(--space-6)', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card__body" style={{ padding: 'var(--space-8)' }}>
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyCenter: 'center', width: '80px', height: '80px', background: 'var(--color-accent-green)', borderRadius: '50%', color: 'white', fontSize: '40px', marginBottom: 'var(--space-4)', display: 'flex' }}>✓</div>
            </div>
            <h1 className="page-header__title" style={{ marginBottom: 'var(--space-2)' }}>Payment Successful!</h1>
            <p className="tutor-card__subject" style={{ marginBottom: 'var(--space-6)' }}>Your session has been booked and payment has been held in escrow.</p>

            <div style={{ background: 'var(--color-secondary-light)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', textAlign: 'left' }}>
              <h3 className="tutor-card__name" style={{ margin: '0 0 var(--space-2)', color: 'var(--color-secondary)' }}>What happens next?</h3>
              <ul className="ai-features" style={{ margin: 0 }}>
                <li className="ai-features__item">
                  <span className="ai-features__bullet"></span>
                  <p className="ai-features__desc" style={{ margin: 0 }}>You'll receive a confirmation email shortly.</p>
                </li>
                <li className="ai-features__item">
                  <span className="ai-features__bullet"></span>
                  <p className="ai-features__desc" style={{ margin: 0 }}>Payment is secured in escrow until session completion.</p>
                </li>
                <li className="ai-features__item">
                  <span className="ai-features__bullet"></span>
                  <p className="ai-features__desc" style={{ margin: 0 }}>You'll scan a QR code to start and end the session.</p>
                </li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link href="/my-sessions" className="btn btn--primary" style={{ width: '100%' }}>View My Sessions</Link>
              <Link href="/tutors" className="btn btn--secondary" style={{ width: '100%' }}>Book Another Session</Link>
              <Link href="/" className="btn btn--outline" style={{ width: '100%' }}>Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
