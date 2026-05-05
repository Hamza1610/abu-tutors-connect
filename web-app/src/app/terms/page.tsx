'use client';

import React from 'react';

export default function TermsPage() {
  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <h1 className="page-header__title">Terms of Service</h1>
        <p className="page-header__subtitle">The rules of the marketplace</p>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-6)', maxWidth: '800px' }}>
        <div className="card__body" style={{ lineHeight: '1.8' }}>
          <section style={{ marginBottom: '32px' }}>
            <h2>1. Acceptance of Terms</h2>
            <p>By using ABUTutorsConnect, you agree to comply with and be bound by these Terms of Service.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>3. Tutor Verification</h2>
            <p>Tutors must provide accurate academic information. ABUTutorsConnect reserves the right to verify this information and suspend any accounts providing false data.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>4. Payments and Escrow</h2>
            <p>All payments are handled through our secure platform. Funds are held in escrow and released only upon session completion or according to our cancellation policy.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>5. Conduct</h2>
            <p>Users must treat each other with respect. Harassment, fraud, or inappropriate behavior will result in immediate account termination.</p>
          </section>

          <section>
            <h2>6. Limitation of Liability</h2>
            <p>ABUTutorsConnect is a marketplace platform. We are not responsible for the quality of tutoring or any disputes between users, although we will provide mediation where possible.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
