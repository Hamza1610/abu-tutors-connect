'use client';

import React, { useState } from 'react';
import { useAlert } from '../../context/AlertContext';

export default function ContactPage() {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    setTimeout(() => {
      showAlert('Your message has been sent! We will get back to you shortly.', { type: 'success' });
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
        <h1 className="page-header__title">Contact Us</h1>
        <p className="page-header__subtitle">Have a question? We're here to help.</p>
      </div>

      <div className="grid-2" style={{ gap: '40px', marginTop: 'var(--space-8)' }}>
        <div>
          <div className="card" style={{ height: '100%' }}>
            <div className="card__body">
              <h2 className="section-header__title" style={{ marginBottom: '24px' }}>Get in Touch</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                Fill out the form and our support team will reach out to you within 24 hours.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📧</div>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>Email Us</p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>support@abututors.edu.ng</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📍</div>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>Visit Us</p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>ABU Main Campus, Samaru, Zaria</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📞</div>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>Call Us</p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>+234 800 000 0000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card__body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" placeholder="Your Name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="your@email.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input type="text" className="form-input" placeholder="What is this about?" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows={5} placeholder="Describe your issue..." required></textarea>
                </div>
                <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
