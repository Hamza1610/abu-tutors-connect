'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sessionApi, userApi } from '../../services/api';
import QRModal from '../../components/QRModal';

export default function MySessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Upcoming');

  // QR Modal State
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    mode: 'generate' as 'generate' | 'scan',
    qrData: '',
    title: '',
    sessionId: ''
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await sessionApi.getSessions();
      setSessions(response.data);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQR = (session: any) => {
    setQrModal({
      isOpen: true,
      mode: 'generate',
      qrData: session._id, // Tutor scans sessionId to start
      title: 'Start Session QR',
      sessionId: session._id
    });
  };

  const handleScanComplete = (sessionId: string) => {
    setQrModal({
      isOpen: true,
      mode: 'scan',
      qrData: '',
      title: 'Scan Tutor QR to Complete',
      sessionId
    });
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      await sessionApi.completeSession(qrModal.sessionId, decodedText);
      alert('Session verified and completed! Payment released to tutor.');
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filter === 'Upcoming') return s.status === 'pending' || s.status === 'active';
    if (filter === 'Completed') return s.status === 'completed';
    if (filter === 'Cancelled') return s.status === 'cancelled';
    return true;
  });

  if (loading) return <main className="container pt-space-8 text-center">Loading sessions...</main>;

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <h1 className="page-header__title">My Sessions</h1>
        <p className="page-header__subtitle">View and manage your tutoring sessions</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {['Upcoming', 'Completed', 'Cancelled'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`course-tag ${filter === f ? 'course-tag--active' : ''}`}
            style={{ cursor: 'pointer', border: 'none', background: filter === f ? 'var(--color-primary)' : 'var(--color-bg)' }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filteredSessions.length > 0 ? (
          filteredSessions.map((s: any) => (
            <div key={s._id} className="card">
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" 
                      alt="Tutor" 
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    <div>
                      <h3 className="tutor-card__name" style={{ marginBottom: 'var(--space-1)' }}>
                        {s.tutorId.name}
                      </h3>
                      <p className="tutor-card__subject" style={{ margin: 0 }}>{s.topic}</p>
                      <p className="tutor-card__subject" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                        <strong>Role:</strong> {s.tutorId.role === 'tutor' || s.tutorId.role === 'verified_tutor' ? 'Tutor' : 'Tutee'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`tutor-card__badge ${s.status === 'completed' ? '' : 'tutor-card__badge--green'}`} style={{ display: 'inline-block', marginBottom: 'var(--space-2)', background: s.status === 'completed' ? 'var(--color-text-muted)' : '' }}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                    <p className="tutor-card__subject" style={{ margin: 0 }}>
                      {new Date(s.date).toLocaleDateString()} · {s.time}
                    </p>
                    <p className="tutor-card__price" style={{ marginTop: 'var(--space-1)' }}>₦{s.amount}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {s.status === 'pending' && (
                      <button className="btn btn--primary" onClick={() => handleStartQR(s)}>
                        Show Start QR
                      </button>
                  )}
                  {s.status === 'active' && (
                      <button className="btn btn--secondary" onClick={() => handleScanComplete(s._id)}>
                        Scan to Complete
                      </button>
                  )}
                  <button className="btn btn--outline" onClick={() => alert('Support feature coming soon!')}>Help</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted">No {filter.toLowerCase()} sessions found.</p>
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
    </main>
  );
}
