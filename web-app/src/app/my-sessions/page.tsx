'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sessionApi, userApi } from '../../services/api';
import QRModal from '../../components/QRModal';

// --- Sub-component for Live Timer (Phase 4) ---
const SessionTimer = ({ session, onSync }: { session: any, onSync: (id: string, data: any) => void }) => {
    const [timeLeft, setTimeLeft] = useState<string>('00:00');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (session.status !== 'active' || !session.actualStartTime) return;

        const updateTimer = () => {
            const startTime = new Date(session.actualStartTime).getTime();
            const durationMs = 60 * 60 * 1000; // 1 hour default
            const endTime = startTime + durationMs;
            const now = new Date().getTime();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft('00:00');
                setIsExpired(true);
                return;
            }

            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };

        const timerId = setInterval(updateTimer, 1000);
        updateTimer();

        // Background Sync every 30 seconds
        const syncId = setInterval(async () => {
             try {
                const res = await sessionApi.syncSession(session._id, new Date().toISOString());
                onSync(session._id, res.data);
             } catch (err) {
                console.error("Sync failed", err);
             }
        }, 30000);

        return () => {
            clearInterval(timerId);
            clearInterval(syncId);
        };
    }, [session, onSync]);

    return (
        <div style={{ padding: 'var(--space-2) var(--space-4)', backgroundColor: isExpired ? '#FEF2F2' : '#F0FDF4', borderRadius: '12px', border: `1px solid ${isExpired ? '#FEE2E2' : '#DCFCE7'}`, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: isExpired ? '#EF4444' : '#16A34A', fontWeight: 'bold' }}>
                {isExpired ? 'SESSION TIME EXPIRED' : 'ACTIVE SESSION'}
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', color: isExpired ? '#B91C1C' : '#15803D' }}>
                {timeLeft}
            </p>
        </div>
    );
};

export default function MySessionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Upcoming');

  // QR/PIN Modal State
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    mode: 'generate' as 'generate' | 'scan',
    qrData: '',
    pin: '',
    title: '',
    sessionId: '',
    step: 'start' as 'start' | 'complete'
  });

  // Rating Modal State
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    sessionId: string;
    rating: number;
    verificationData?: { qrData?: string; pin?: string };
  }>({ isOpen: false, sessionId: '', rating: 5 });

  // Reschedule Modal State
  const [rescheduleModal, setRescheduleModal] = useState({
    isOpen: false,
    sessionId: '',
    date: '',
    time: '',
    submitting: false
  });

  useEffect(() => {
    const init = async () => {
        try {
            const userRes = await userApi.getProfile();
            setCurrentUser(userRes.data);
            await fetchSessions();
        } catch (err) {
            router.push('/login');
        }
    };
    init();
  }, [router]);

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

  const handleSyncUpdate = (id: string, data: any) => {
      // If server says it's complete, we could trigger a local UI update
      if (data.isComplete) {
          console.log(`Session ${id} marked as complete by server sync`);
      }
  };

  // --- Verification Flow ---

  const openVerifyModal = (session: any, step: 'start' | 'complete') => {
      const isTutor = currentUser._id === session.tutorId._id;
      
      setQrModal({
          isOpen: true,
          mode: isTutor ? 'scan' : 'generate',
          qrData: step === 'start' ? session.startQRCodeData : session.completionQRCodeData,
          pin: step === 'start' ? session.startPIN : session.completionPIN,
          title: `${step === 'start' ? 'Start' : 'Finish'} Session Verification`,
          sessionId: session._id,
          step: step
      });
  };

  const handleVerificationSuccess = async (data: { qrData?: string, pin?: string }) => {
      try {
          if (qrModal.step === 'start') {
              await sessionApi.startSession(qrModal.sessionId, data);
              alert('Session started! Timer is now active.');
          } else {
              // Store credentials to use after rating
              const isTutor = currentUser._id === sessions.find(s => s._id === qrModal.sessionId)?.tutorId?._id;
              
              setRatingModal({ 
                  isOpen: true, 
                  sessionId: qrModal.sessionId, 
                  rating: 5,
                  verificationData: data // STORE THE DATA HERE
              });
          }
          fetchSessions();
      } catch (err: any) {
          alert(err.response?.data?.message || 'Verification failed');
      }
  };

  const submitCompletion = async () => {
      try {
          const payload = {
              ...ratingModal.verificationData,
              rating: currentUser.role === 'tutee' ? ratingModal.rating : undefined
          };
          await sessionApi.completeSession(ratingModal.sessionId, payload);
          alert('Session completed! Funds released.');
          setRatingModal({ ...ratingModal, isOpen: false });
          fetchSessions();
      } catch (err: any) {
          alert(err.response?.data?.message || 'Completion failed');
      }
  };

  const handleCancel = async (id: string) => {
      if (!confirm('Are you sure you want to cancel this booking? Tutee will be refunded.')) return;
      try {
          await sessionApi.cancelSession(id);
          fetchSessions();
      } catch (err) {
          alert('Cancellation failed');
      }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModal.date || !rescheduleModal.time) {
        alert('Please select both date and time');
        return;
    }

    setRescheduleModal(prev => ({ ...prev, submitting: true }));
    try {
        await sessionApi.rescheduleSession(rescheduleModal.sessionId, {
            date: rescheduleModal.date,
            time: rescheduleModal.time
        });
        alert('Session rescheduled successfully!');
        setRescheduleModal({ isOpen: false, sessionId: '', date: '', time: '', submitting: false });
        fetchSessions();
    } catch (err: any) {
        alert(err.response?.data?.message || 'Rescheduling failed');
    } finally {
        setRescheduleModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleNoShow = async (id: string) => {
      if (!confirm('Report student no-show? You will receive a partial payout (30%) and the session will end.')) return;
      try {
          await sessionApi.reportNoShow(id);
          fetchSessions();
      } catch (err) {
          alert('Report failed');
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
        <p className="page-header__subtitle">
            {currentUser.role === 'tutee' ? 'View and track your learning progress' : 'Manage your tutoring schedule and verification'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {['Upcoming', 'Completed', 'Cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`course-tag ${filter === f ? 'course-tag--active' : ''}`} style={{ cursor: 'pointer', border: 'none', background: filter === f ? 'var(--color-primary)' : '#F1F5F9', color: filter === f ? 'white' : '#64748B' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filteredSessions.length > 0 ? (
          filteredSessions.map((s: any) => {
            const isTutor = currentUser._id === s.tutorId._id;
            const partner = isTutor ? s.tuteeId : s.tutorId;
            
            return (
              <div key={s._id} className="card" style={{ border: s.status === 'active' ? '2px solid var(--primary-color)' : '1px solid #E2E8F0' }}>
                <div className="card__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                         {partner.documents?.profilePicture ? (
                             <img 
                                 src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${partner.documents.profilePicture}`} 
                                 alt="Partner" 
                                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                             />
                         ) : (
                             <div style={{ 
                                 width: '100%', height: '100%', 
                                 background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 fontSize: '24px', fontWeight: 'bold'
                             }}>
                                 {partner.name.charAt(0)}
                             </div>
                         )}
                      </div>
                      <div>
                        <h3 className="tutor-card__name" style={{ margin: 0 }}>{partner.name}</h3>
                        <p style={{ margin: '4px 0', fontSize: '14px', color: '#64748B' }}>Topic: <strong>{s.topic}</strong></p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Venue: {s.venue}</p>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <span className={`tutor-card__badge ${s.status === 'active' ? 'tutor-card__badge--green' : s.status === 'pending' ? 'tutor-card__badge--orange' : ''}`} style={{ borderRadius: '6px' }}>
                            {s.status.toUpperCase()}
                        </span>
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>{new Date(s.date).toLocaleDateString()} · {s.time}</p>
                        <p style={{ margin: 0, fontSize: '16px', color: 'var(--primary-color)', fontWeight: 'bold' }}>₦{s.amount}</p>
                    </div>
                  </div>

                  {s.status === 'active' && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                          <SessionTimer session={s} onSync={handleSyncUpdate} />
                      </div>
                  )}
                  
                  <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {/* Tutee Actions */}
                    {s.status === 'pending' && (
                        <>
                            <button className="btn btn--primary" onClick={() => openVerifyModal(s, 'start')}>Show Start QR/PIN</button>
                            <button className="btn btn--secondary" onClick={() => router.push(`/messages?partnerId=${partner._id}`)} style={{ marginLeft: 'var(--space-2)' }}>Message</button>
                        </>
                    )}
                    {s.status === 'active' && (
                        <>
                            <button className="btn btn--primary" onClick={() => openVerifyModal(s, 'complete')}>Show Finish QR/PIN</button>
                            <button className="btn btn--secondary" onClick={() => router.push(`/messages?partnerId=${partner._id}`)} style={{ marginLeft: 'var(--space-2)' }}>Message</button>
                        </>
                    )}

                    {/* Tutor Actions */}
                    {isTutor && s.status === 'pending' && (
                        <>
                            <button className="btn btn--primary" onClick={() => openVerifyModal(s, 'start')}>Verify & Start Session</button>
                            <button className="btn btn--secondary" onClick={() => router.push(`/messages?partnerId=${partner._id}`)} style={{ marginLeft: 'var(--space-2)' }}>Message</button>
                            <button className="btn btn--outline" style={{ color: '#DC2626', borderColor: '#FECACA' }} onClick={() => handleNoShow(s._id)}>Tutee No-Show</button>
                        </>
                    )}
                    {isTutor && s.status === 'active' && (
                        <>
                            <button className="btn btn--primary" onClick={() => openVerifyModal(s, 'complete')}>Scan to Complete</button>
                            <button className="btn btn--secondary" onClick={() => router.push(`/messages?partnerId=${partner._id}`)} style={{ marginLeft: 'var(--space-2)' }}>Message</button>
                        </>
                    )}

                    {/* Common Actions */}
                    {s.status === 'pending' && (
                        <>
                            <button className="btn btn--outline" onClick={() => handleCancel(s._id)}>Cancel Session</button>
                            <button className="btn btn--outline" onClick={() => setRescheduleModal({ 
                                isOpen: true, 
                                sessionId: s._id, 
                                date: s.date.split('T')[0], 
                                time: s.time,
                                submitting: false 
                            })}>Reschedule</button>
                        </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p className="text-muted">No {filter.toLowerCase()} sessions found.</p>
              <button onClick={() => router.push('/tutors')} className="btn btn--primary" style={{ marginTop: 'var(--space-4)' }}>Explore Tutors</button>
          </div>
        )}
      </div>

      <QRModal 
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
        mode={qrModal.mode}
        qrData={qrModal.qrData}
        pin={qrModal.pin}
        title={qrModal.title}
        onScanSuccess={(decoded) => handleVerificationSuccess({ qrData: decoded })}
        onPinSubmit={(pin) => handleVerificationSuccess({ pin })}
      />

      {/* Rating Modal */}
      {ratingModal.isOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
                <div className="card__body" style={{ textAlign: 'center' }}>
                    <h2 className="section-header__title">{currentUser.role === 'tutee' ? 'Rate the Session' : 'Finalize Session'}</h2>
                    <p className="text-muted">{currentUser.role === 'tutee' ? 'How was your session? This helps the tutor get verified!' : 'Confirm session completion to release funds.'}</p>
                    
                    {currentUser.role === 'tutee' && (
                        <div style={{ fontSize: '32px', margin: '20px 0', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            {[1,2,3,4,5].map(star => (
                                <span 
                                    key={star} 
                                    style={{ cursor: 'pointer', color: star <= ratingModal.rating ? '#FBBF24' : '#E2E8F0' }}
                                    onClick={() => setRatingModal({ ...ratingModal, rating: star })}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    )}
                    
                    <button className="btn btn--primary btn--block" onClick={submitCompletion}>
                        {currentUser.role === 'tutee' ? 'Finish & Rate' : 'Complete & Release Payout'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal.isOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
                <div className="card__body">
                    <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Reschedule Session</h2>
                    <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>New Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                value={rescheduleModal.date}
                                onChange={(e) => setRescheduleModal({ ...rescheduleModal, date: e.target.value })}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>New Time Slot</label>
                            <select 
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                value={rescheduleModal.time}
                                onChange={(e) => setRescheduleModal({ ...rescheduleModal, time: e.target.value })}
                                required
                            >
                                <option value="">Select a time slot</option>
                                <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                                <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                                <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                                <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                                <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                                <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
                                <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                                <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                                <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                                <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={rescheduleModal.submitting}>
                                {rescheduleModal.submitting ? 'Updating...' : 'Confirm'}
                            </button>
                            <button type="button" className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </main>
  );
}
