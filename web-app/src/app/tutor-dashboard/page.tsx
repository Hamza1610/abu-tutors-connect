'use client';

import React, { useState, useEffect } from 'react';
import { statsApi, sessionApi } from '../../services/api';
import QRModal from '../../components/QRModal';
import Link from 'next/link';

export default function TutorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');

  // QR Modal State
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    mode: 'generate' as 'generate' | 'scan',
    qrData: '',
    title: '',
    sessionId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        statsApi.getTutorStats(),
        sessionApi.getSessions()
      ]);
      setStats(statsRes.data);
      // Filter sessions where current user is the tutor
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error('Fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanStart = (sessionId: string) => {
    setQrModal({
      isOpen: true,
      mode: 'scan',
      qrData: '',
      title: 'Scan Tutee QR to Start',
      sessionId
    });
  };

  const handleCompleteQR = (session: any) => {
    setQrModal({
      isOpen: true,
      mode: 'generate',
      qrData: session.qrCodeData || `complete_${session._id}`,
      title: 'Complete Session QR',
      sessionId: session._id
    });
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      await sessionApi.startSession(qrModal.sessionId, decodedText);
      alert('Session started successfully!');
      setQrModal(prev => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const filteredSessions = sessions.filter(s => {
      if (activeTab === 'Upcoming') return s.status === 'pending' || s.status === 'active';
      if (activeTab === 'Completed') return s.status === 'completed';
      return true;
  });

  if (loading) return <main className="container pt-space-8 text-center">Loading Dashboard...</main>;

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <h1 className="page-header__title">Tutor Dashboard</h1>
        <p className="page-header__subtitle">Manage your sessions and earnings</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card__body">
            <p className="tutor-card__subject" style={{ margin: '0 0 var(--space-2)' }}>Total Earnings</p>
            <p style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', margin: 0 }}>
                ₦{stats?.totalEarnings?.toLocaleString() || '0'}
            </p>
            <p className="tutor-card__subject" style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-sm)' }}>Available Balance</p>
          </div>
        </div>
        <div className="card">
          <div className="card__body">
            <p className="tutor-card__subject" style={{ margin: '0 0 var(--space-2)' }}>Monthly Earnings</p>
            <p style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-secondary)', margin: 0 }}>
                ₦{stats?.monthlyEarnings?.toLocaleString() || '0'}
            </p>
            <p className="tutor-card__subject" style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-sm)' }}>This month</p>
          </div>
        </div>
        <div className="card">
          <div className="card__body">
            <p className="tutor-card__subject" style={{ margin: '0 0 var(--space-2)' }}>Sessions Completed</p>
            <p style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-accent-gold)', margin: 0 }}>
                {stats?.completedSessions || '0'}
            </p>
            <p className="tutor-card__subject" style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-sm)' }}>All time</p>
          </div>
        </div>
        <div className="card">
          <div className="card__body">
            <p className="tutor-card__subject" style={{ margin: '0 0 var(--space-2)' }}>Rating</p>
            <p style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: '#FF6B6B', margin: 0 }}>
                {stats?.rating || '4.8'} ★
            </p>
            <p className="tutor-card__subject" style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-sm)' }}>Average</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {['Upcoming', 'Completed'].map(t => (
            <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`course-tag ${activeTab === t ? 'course-tag--active' : ''}`}
                style={{ cursor: 'pointer', border: 'none', background: activeTab === t ? 'var(--color-primary)' : 'var(--color-bg)' }}
            >
                {t} Sessions
            </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {filteredSessions.length > 0 ? (
          filteredSessions.map((s: any) => (
            <div key={s._id} className="card">
              <div className="card__body" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" alt="Student" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 className="tutor-card__name" style={{ marginBottom: 'var(--space-1)' }}>{s.tuteeId.name}</h3>
                    <p className="tutor-card__subject" style={{ margin: 0 }}>{s.topic}</p>
                    <p className="tutor-card__subject" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                      <strong>Department:</strong> {s.tuteeId.department || 'General'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`tutor-card__badge ${s.status === 'active' ? 'tutor-card__badge--green' : 'tutor-card__badge--orange'}`} style={{ display: 'inline-block', marginBottom: 'var(--space-2)' }}>
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                  <p className="tutor-card__subject" style={{ margin: 0 }}>{new Date(s.date).toLocaleDateString()} · {s.time}</p>
                  <p className="tutor-card__price" style={{ marginTop: 'var(--space-1)' }}>₦{s.amount}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                {s.status === 'pending' && (
                    <button className="btn btn--primary" onClick={() => handleScanStart(s._id)}>Scan to Start Session</button>
                )}
                {s.status === 'active' && (
                    <button className="btn btn--secondary" onClick={() => handleCompleteQR(s)}>Show Complete QR</button>
                )}
                <button className="btn btn--outline" onClick={() => alert('Support feature coming soon!')}>Contact Student</button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted">No {activeTab.toLowerCase()} sessions found.</p>
        )}
      </div>

      <QRModal 
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
        mode={qrModal.mode}
        qrData={qrModal.qrData}
        title={qrModal.title}
        onScanSuccess={onScanSuccess}
      />

      {/* Quick Actions */}
      <div className="card">
        <div className="card__body">
          <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</h2>
          <div className="quick-actions">
            <Link href="/settings" className="quick-action-btn">
              <span className="quick-action-btn__icon">⚙️</span>
              Settings
            </Link>
            <Link href="/wallet" className="quick-action-btn">
              <span className="quick-action-btn__icon">💰</span>
              Withdraw Earnings
            </Link>
            <Link href="/profile" className="quick-action-btn">
              <span className="quick-action-btn__icon">📅</span>
              Manage Availability
            </Link>
            <Link href="/profile" className="quick-action-btn">
              <span className="quick-action-btn__icon">📝</span>
              Update Profile
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
