'use client';

import React, { useState } from 'react';

const faqData = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is ABUTutorsConnect?',
        a: 'ABUTutorsConnect is a peer-to-peer tutoring marketplace specifically designed for students of Ahmadu Bello University (ABU). We connect students who need academic help with high-performing peers who have already aced those same courses.'
      },
      {
        q: 'How does it work?',
        a: 'Students can search for tutors by course code or department. Once a tutor is found, you can book a session, choose a venue on campus, and pay. The payment is held in our secure escrow system until the session is completed and verified by both parties.'
      }
    ]
  },
  {
    category: 'For Students (Tutees)',
    questions: [
      {
        q: 'How do I book a tutor?',
        a: 'Simply search for your course code (e.g., COEN 201), view the profiles of available tutors, and click "Book Session". You will see their availability matrix and can pick a time that works for you.'
      },
      {
        q: 'Is my payment secure?',
        a: 'Yes! We use an escrow system. When you book a session, your money is held by the platform. It is only released to the tutor after you provide the "Completion PIN" at the end of a successful session.'
      }
    ]
  },
  {
    category: 'For Tutors',
    questions: [
      {
        q: 'How do I become a tutor?',
        a: 'Register as a tutor and complete your profile. You will need to upload your ABU admission letter and your latest transcript/result as proof of your academic performance. Once an admin approves your profile, you can start receiving bookings.'
      },
      {
        q: 'How much can I earn?',
        a: 'Tutors set their own hourly rates (within system limits). New tutors usually start at ₦500/hr, while verified tutors can charge more. The platform takes a small commission to maintain the service.'
      }
    ]
  }
];

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState('General');

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
        <h1 className="page-header__title">Frequently Asked Questions</h1>
        <p className="page-header__subtitle">Everything you need to know about ABUTutorsConnect</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        {faqData.map(cat => (
          <button 
            key={cat.category}
            onClick={() => setActiveTab(cat.category)}
            className={`course-tag ${activeTab === cat.category ? 'course-tag--active' : ''}`}
            style={{ cursor: 'pointer', border: 'none', padding: '10px 20px' }}
          >
            {cat.category}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {faqData.find(c => c.category === activeTab)?.questions.map((item, idx) => (
          <div key={idx} className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="card__body">
              <h3 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--color-primary)' }}>Q: {item.q}</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
