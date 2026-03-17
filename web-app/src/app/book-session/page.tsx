'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { userApi, sessionApi, walletApi } from '../../services/api';

function BookSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tutorId = searchParams.get('tutor');

  const [tutor, setTutor] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [fee, setFee] = useState(800);

  // Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (!tutorId) {
      router.push('/tutors');
      return;
    }

    const fetchData = async () => {
      try {
        const [tutorRes, walletRes] = await Promise.all([
          userApi.getTutorProfile(tutorId),
          walletApi.getWallet()
        ]);
        const tutorData = tutorRes.data;
        setTutor(tutorData);
        setWallet(walletRes.data);
        
        // Calculate fee based on role
        const calculatedFee = tutorData.role === 'verified_tutor' ? (tutorData.hourlyRate || 800) : 500;
        setFee(calculatedFee);
      } catch (err: any) {
        console.error('Data fetch error', err);
        setError('Failed to load tutor or wallet information.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tutorId, router]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || wallet.balance < fee) {
      alert(`Insufficient balance. This session costs ₦${fee}. Please fund your wallet first.`);
      router.push('/wallet');
      return;
    }

    setBooking(true);
    setError('');

    try {
      await sessionApi.bookSession({
        tutorId,
        date,
        time,
        topic,
        amount: fee
      });
      router.push('/my-sessions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book session');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <main className="container pt-space-8 text-center">Loading...</main>;
  if (error || !tutor) return <main className="container pt-space-8 text-center text-red">{error || 'Tutor not found'}</main>;

  return (
    <main className="container pb-space-8 pt-space-8">
      <div style={{ marginTop: 'var(--space-6)', display: 'grid', gap: 'var(--space-6)', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h1 className="page-header__title">Book a Session</h1>
        <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: '1fr' }}>
          <div className="card">
            <div className="card__body">
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
                  alt={tutor.name} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div>
                  <h2 className="section-header__title" style={{ marginBottom: 'var(--space-1)' }}>{tutor.name}</h2>
                  <p className="tutor-card__subject" style={{ marginBottom: 'var(--space-2)' }}>{tutor.department}</p>
                  <span className="tutor-card__price">N{fee}/hr</span>
                </div>
              </div>
              
              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label className="form-label" htmlFor="date">Session Date</label>
                  <input 
                    type="date" 
                    id="date" 
                    className="form-input" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="time">Preferred Time</label>
                  <select 
                    id="time" 
                    className="form-input" 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  >
                    <option value="">Select a time slot</option>
                    <option value="09:00 AM - 10:00 AM">9:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="02:00 PM - 03:00 PM">2:00 PM - 3:00 PM</option>
                    <option value="04:00 PM - 05:00 PM">4:00 PM - 5:00 PM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="topic">Topic to Cover</label>
                  <input 
                    type="text" 
                    id="topic" 
                    className="form-input" 
                    placeholder="e.g. Recursion, Binary Trees"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                
                <div style={{ background: 'var(--color-bg)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span className="tutor-card__subject">Session fee (1 hr)</span>
                    <span className="tutor-card__price">N{fee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--font-weight-bold)' }}>
                    <span>Total</span>
                    <span className="tutor-card__price">N{fee}</span>
                  </div>
                </div>
                
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  Payment will be held in escrow and released after session completion via QR code verification.
                </p>
                
                <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={booking}>
                  {booking ? 'Processing...' : 'Pay & Book Session'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookSessionPage() {
  return (
    <Suspense fallback={<div className="container text-center pt-space-8">Loading booking page...</div>}>
      <BookSessionContent />
    </Suspense>
  );
}
