'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <h1 className="page-header__title">Privacy Policy</h1>
        <p className="page-header__subtitle">How we handle your data at ABUTutorsConnect</p>
      </div>

      <div className="card" style={{ marginTop: 'var(--space-6)', maxWidth: '800px' }}>
        <div className="card__body" style={{ lineHeight: '1.8' }}>
          <section style={{ marginBottom: '32px' }}>
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including your name, email address, phone number, faculty, department, and academic documents (for tutors).</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve our services.</li>
              <li>Verify tutor identities and academic backgrounds.</li>
              <li>Process transactions and send related information.</li>
              <li>Send you technical notices, updates, and support messages.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>3. Information Sharing</h2>
            <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., sharing a tutor's name with a student who books them) or as required by law.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2>4. Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>
          </section>

          <section>
            <h2>5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@abututors.edu.ng.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
