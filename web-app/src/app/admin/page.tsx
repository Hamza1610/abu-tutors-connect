'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, userApi } from '../../services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingTutors, setPendingTutors] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [venues, setVenues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [finances, setFinances] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tutors' | 'users' | 'marketplace' | 'logs' | 'sessions' | 'finances' | 'settings' | 'venues'>('tutors');
  
  // Settings Form
  const [maxHourlyRate, setMaxHourlyRate] = useState(0);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [minSessions, setMinSessions] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [isRegistrationFree, setIsRegistrationFree] = useState(false);
  const [platformCommission, setPlatformCommission] = useState(10);
  const [noShowPayout, setNoShowPayout] = useState(30);

  // Venue Form
  const [venueName, setVenueName] = useState('');
  const [venueLocation, setVenueLocation] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await userApi.getProfile();
        if (response.data.role !== 'admin') {
          router.push('/profile');
          return;
        }
        setIsAdmin(true);
        fetchData();
      } catch (err) {
        router.push('/login');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tutorsRes, settingsRes, venuesRes, usersRes, logsRes, sessionsRes, financesRes] = await Promise.all([
        adminApi.getPendingTutors(),
        adminApi.getSettings(),
        adminApi.getVenues(),
        adminApi.getAllUsers(),
        adminApi.getAdminLogs(),
        adminApi.getAllSessions(),
        adminApi.getFinances()
      ]);
      setPendingTutors(tutorsRes.data);
      setSettings(settingsRes.data);
      setVenues(venuesRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setSessions(sessionsRes.data);
      setFinances(financesRes.data);
      
      setMaxHourlyRate(settingsRes.data.maxHourlyRate);
      setRegistrationFee(settingsRes.data.registrationFee);
      setMinSessions(settingsRes.data.minSessionsForVerify);
      setMinRating(settingsRes.data.minRatingForVerify);
      setIsRegistrationFree(settingsRes.data.isRegistrationFree);
      setPlatformCommission(settingsRes.data.platformCommissionPercent || 10);
      setNoShowPayout(settingsRes.data.noShowPayoutPercent || 30);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, status: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${status} this tutor?`)) return;
    try {
      await adminApi.approveTutor(id, status);
      alert(`Tutor ${status}d successfully`);
      fetchData();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.updateSettings({
        maxHourlyRate,
        registrationFee,
        minSessionsForVerify: minSessions,
        minRatingForVerify: minRating,
        isRegistrationFree,
        platformCommissionPercent: platformCommission,
        noShowPayoutPercent: noShowPayout
      });
      alert('Settings updated');
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.addVenue({ name: venueName, location: venueLocation });
      setVenueName('');
      setVenueLocation('');
      fetchData();
      alert('Venue added');
    } catch (err) {
      alert('Failed to add venue');
    }
  };

  const handleDeleteVenue = async (id: string) => {
    if (!confirm('Delete this venue?')) return;
    try {
      await adminApi.deleteVenue(id);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (!isAdmin || loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>Loading Admin Dashboard...</div>;
  }

  return (
    <main className="container pb-space-8 pt-space-8">
      <h1 className="page-header__title" style={{ marginBottom: 'var(--space-6)' }}>Admin Control Panel</h1>
      
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', flexWrap: 'wrap' }}>
          {[
            { id: 'tutors', label: `Pending Tutors (${pendingTutors.length})` },
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'users', label: 'User Mgmt' },
            { id: 'sessions', label: 'Sessions' },
            { id: 'finances', label: 'Finances' },
            { id: 'logs', label: 'Activity Logs' },
            { id: 'settings', label: 'Settings' },
            { id: 'venues', label: 'Venues' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{ 
                  flex: '1 1 auto', padding: 'var(--space-4)', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : 'none',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  color: activeTab === tab.id ? 'var(--primary-color)' : '#64748B',
                  minWidth: '120px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card__body" style={{ minHeight: '400px' }}>
          {activeTab === 'tutors' && (
            <div>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Tutor Verification Queue</h2>
              {pendingTutors.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748B', marginTop: '40px' }}>No tutors awaiting approval.</p>
              ) : (
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {pendingTutors.map((tutor) => (
                    <div key={tutor._id} className="card" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="card__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>{tutor.name}</h3>
                          <p style={{ margin: '4px 0', fontSize: '14px', color: '#64748B' }}>{tutor.registrationNumber} · {tutor.faculty}</p>
                          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)' }}>
                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${tutor.documents?.admissionLetter}`} target="_blank" className="btn btn--secondary btn--sm" rel="noreferrer">Admission Letter</a>
                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${tutor.documents?.transcript}`} target="_blank" className="btn btn--secondary btn--sm" rel="noreferrer">Transcript</a>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button onClick={() => handleApprove(tutor._id, 'approve')} className="btn btn--primary btn--sm" style={{ backgroundColor: 'var(--success-green)', color: 'white' }}>Approve</button>
                          <button onClick={() => handleApprove(tutor._id, 'reject')} className="btn btn--secondary btn--sm" style={{ color: '#DC2626' }}>Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Tutor Marketplace Oversight</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {users.filter(u => u.role.includes('tutor') && u.isApproved).map(tutor => (
                  <div key={tutor._id} className="card" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="card__body">
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                          {tutor.name.charAt(0)}
                        </div>
                        <div>
                          <h4 style={{ margin: 0 }}>{tutor.name}</h4>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{tutor.department}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                        <strong>Rate:</strong> ₦{tutor.hourlyRate}/hr
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                        <span>Sessions: {tutor.sessionsCompleted || 0}</span>
                        <span>Rating: ★{tutor.averageRating || 'N/A'}</span>
                      </div>
                      <div style={{ marginTop: '15px' }}>
                        <button 
                          onClick={() => {
                            if (confirm(`Hide ${tutor.name} from marketplace? This will unapprove them.`)) {
                              handleApprove(tutor._id, 'reject');
                            }
                          }}
                          className="btn btn--secondary btn--sm btn--block" 
                          style={{ color: '#DC2626' }}
                        >
                          Hide from Marketplace
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.filter(u => u.role.includes('tutor') && u.isApproved).length === 0 && (
                   <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748B', padding: '40px' }}>
                     No active tutors in the marketplace.
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>All Users ({users.length})</h2>
              <div className="card" style={{ border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: 'var(--space-3)' }}>User</th>
                      <th style={{ padding: 'var(--space-3)' }}>Role</th>
                      <th style={{ padding: 'var(--space-3)' }}>Status</th>
                      <th style={{ padding: 'var(--space-3)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <span className={`tutor-card__badge ${u.role === 'admin' ? 'tutor-card__badge--orange' : u.role.includes('tutor') ? 'tutor-card__badge--green' : ''}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          {u.isApproved ? (
                            <span style={{ color: 'var(--success-green)', fontSize: '14px' }}>● Active</span>
                          ) : (
                            <span style={{ color: '#DC2626', fontSize: '14px' }}>● Pending/Offline</span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={async () => {
                                if (confirm(`Suspend ${u.name}?`)) {
                                  await adminApi.updateUserStatus(u._id, { isApproved: false });
                                  fetchData();
                                }
                              }}
                              className="btn btn--secondary btn--sm" 
                              style={{ color: '#DC2626' }}
                              disabled={u.role === 'admin'}
                            >
                              Suspend
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm(`Approve ${u.name}?`)) {
                                  await adminApi.updateUserStatus(u._id, { isApproved: true });
                                  fetchData();
                                }
                              }}
                              className="btn btn--primary btn--sm"
                              style={{ backgroundColor: 'var(--success-green)', color: 'white' }}
                              disabled={u.role === 'admin' || u.isApproved}
                            >
                              Activate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Global Session Monitoring</h2>
              <div className="card" style={{ border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: 'var(--space-3)' }}>Session</th>
                      <th style={{ padding: 'var(--space-3)' }}>Tutor/Tutee</th>
                      <th style={{ padding: 'var(--space-3)' }}>Status</th>
                      <th style={{ padding: 'var(--space-3)' }}>Escrow</th>
                      <th style={{ padding: 'var(--space-3)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontWeight: 'bold' }}>{s.topic}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{new Date(s.date).toLocaleDateString()} · {s.time}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontSize: '14px' }}><strong>Tutor:</strong> {s.tutorId?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '14px' }}><strong>Tutee:</strong> {s.tuteeId?.name || 'Unknown'}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <span className={`tutor-card__badge ${s.status === 'active' ? 'tutor-card__badge--green' : s.status === 'pending' ? 'tutor-card__badge--orange' : ''}`}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontSize: '14px' }}>₦{s.amount}</div>
                          <div style={{ fontSize: '12px', color: s.escrowStatus === 'held' ? 'orange' : 'var(--success-green)' }}>{s.escrowStatus}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          {s.status === 'pending' && (
                            <button 
                              onClick={async () => {
                                if (confirm('Manually cancel this session? Funds will be refunded if held.')) {
                                  await adminApi.overrideSession(s._id, { status: 'cancelled', escrowStatus: 'refunded' });
                                  fetchData();
                                }
                              }}
                              className="btn btn--secondary btn--sm" 
                              style={{ color: '#DC2626' }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'finances' && finances && (
            <div>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Financial Health Monitor</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="card" style={{ border: '1px solid #E2E8F0', padding: '20px' }}>
                  <div style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>Total Wallet Balances</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₦{finances.totalWalletBalance?.toLocaleString()}</div>
                </div>
                <div className="card" style={{ border: '1px solid #E2E8F0', padding: '20px' }}>
                  <div style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>Funds in Escrow</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'orange' }}>₦{finances.totalEscrowBalance?.toLocaleString()}</div>
                </div>
                <div className="card" style={{ border: '1px solid #E2E8F0', padding: '20px' }}>
                  <div style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>Recent Activity (30d)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{finances.recentWalletActivity} txns</div>
                </div>
                <div className="card" style={{ border: '1px solid #E2E8F0', padding: '20px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>Admin Wallet Balance</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>₦{finances.adminBalance?.toLocaleString() || '0'}</div>
                </div>
                <div className="card" style={{ border: '1px solid #E2E8F0', padding: '20px', background: '#f8fafc' }}>
                  <div style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>Total Platform Revenue</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success-green)' }}>
                    ₦{finances.platformFees?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Recent Administrative Actions</h2>
              <div className="card" style={{ border: '1px solid #E2E8F0' }}>
                <div className="card__body" style={{ padding: '0' }}>
                  {logs.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center' }}>No logs recorded yet.</p>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {logs.map((log) => (
                        <div key={log._id} style={{ padding: '15px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{log.action}</div>
                            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{log.details}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                              By {log.adminId?.name || 'Admin'} · {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                            ID: {log.targetId?.substring(log.targetId.length - 6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ maxWidth: '500px' }}>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Global System Settings</h2>
              <form onSubmit={handleUpdateSettings}>
                <div className="form-group">
                  <label className="form-label">Max Hourly Rate (₦)</label>
                  <input type="number" className="form-input" value={maxHourlyRate} onChange={(e) => setMaxHourlyRate(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tutor Registration Fee (₦)</label>
                  <input type="number" className="form-input" value={registrationFee} onChange={(e) => setRegistrationFee(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Sessions for Verification</label>
                  <input type="number" className="form-input" value={minSessions} onChange={(e) => setMinSessions(Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="isFree" checked={isRegistrationFree} onChange={(e) => setIsRegistrationFree(e.target.checked)} />
                  <label htmlFor="isFree" className="form-label" style={{ marginBottom: 0 }}>Make Tutor Registration Free</label>
                </div>
                <div className="form-group">
                   <label className="form-label">Platform Commission (%)</label>
                   <input type="number" className="form-input" value={platformCommission} onChange={(e) => setPlatformCommission(Number(e.target.value))} />
                </div>
                <div className="form-group">
                   <label className="form-label">Tutor Payout for Student No-Show (%)</label>
                   <input type="number" className="form-input" value={noShowPayout} onChange={(e) => setNoShowPayout(Number(e.target.value))} />
                </div>
                <button type="submit" className="btn btn--primary" style={{ marginTop: '20px' }}>Save Settings</button>
              </form>
            </div>
          )}

          {activeTab === 'venues' && (
            <div>
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Venue Management</h2>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }} className="card">
                    <div className="card__body">
                        <h3>Add New Venue</h3>
                        <form onSubmit={handleAddVenue}>
                            <div className="form-group">
                                <label className="form-label">Venue Name</label>
                                <input type="text" className="form-input" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="e.g. CBT Centre" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location/Description</label>
                                <input type="text" className="form-input" value={venueLocation} onChange={(e) => setVenueLocation(e.target.value)} placeholder="e.g. Near Faculty of Arts" required />
                            </div>
                            <button type="submit" className="btn btn--primary btn--sm">Add Venue</button>
                        </form>
                    </div>
                  </div>
                  <div style={{ flex: '2 1 400px' }} className="card">
                    <div className="card__body">
                        <h3>Venue List</h3>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-2)' }}>
                              <thead>
                                  <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                                      <th style={{ padding: '8px' }}>Name</th>
                                      <th style={{ padding: '8px' }}>Location</th>
                                      <th style={{ padding: '8px' }}>Action</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {venues.map(v => (
                                      <tr key={v._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                          <td style={{ padding: '8px' }}>{v.name}</td>
                                          <td style={{ padding: '8px', fontSize: '14px', color: '#64748B' }}>{v.location}</td>
                                          <td style={{ padding: '8px' }}>
                                              <button onClick={() => handleDeleteVenue(v._id)} style={{ color: '#DC2626', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
