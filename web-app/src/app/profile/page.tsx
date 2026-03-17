'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '../../services/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [admissionId, setAdmissionId] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile();
        setUser(response.data);
        setName(response.data.name || '');
        setEmail(response.data.email || '');
        setAdmissionId(response.data.admissionId || '');
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Failed to load profile. Please log in again.');
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Create update payload based on role
      const payload: any = { name };
      
      if (user?.role === 'tutor' || user?.role === 'verified_tutor') {
         // Only tutors can update admission ID (or we could make it immutable)
         if (admissionId) payload.admissionId = admissionId;
      }

      await userApi.updateProfile(payload);
      alert('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="container pb-space-8 pt-space-8">
        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="container pb-space-8 pt-space-8">
      <div style={{ marginTop: 'var(--space-6)', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="card">
          <div className="card__body" style={{ textAlign: 'center' }}>
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop" 
              alt="Profile" 
              style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto var(--space-4)' }} 
            />
            <h1 className="page-header__title" style={{ marginBottom: 'var(--space-1)' }}>{user.name}</h1>
            {user.role !== 'tutee' && user.admissionId && (
               <p className="tutor-card__subject" style={{ marginBottom: 'var(--space-4)' }}>{user.admissionId} · {user.department || 'Engineering'}</p>
            )}
            {user.role === 'tutee' && (
                <p className="tutor-card__subject" style={{ marginBottom: 'var(--space-4)' }}>Student Profile</p>
            )}
            
            <span 
              className={`tutor-card__badge ${user.role === 'tutee' ? 'tutor-card__badge--green' : 'tutor-card__badge--orange'}`} 
              style={{ display: 'inline-block' }}
            >
              {user.role === 'verified_tutor' ? 'Verified Tutor' : user.role === 'tutor' ? 'Tutor' : 'Tutee'}
            </span>
          </div>
        </div>

        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card__body">
            <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Account Settings</h2>
            
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="form-input" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className="form-input" 
                  value={email}
                  disabled // Don't allow changing email for now
                />
              </div>
              
              {(user.role === 'tutor' || user.role === 'verified_tutor') && (
                <div className="form-group">
                  <label className="form-label" htmlFor="admission">Admission ID</label>
                  <input 
                    type="text" 
                    id="admission" 
                    className="form-input" 
                    value={admissionId}
                    onChange={(e) => setAdmissionId(e.target.value)}
                    placeholder="e.g. U21CO1015"
                  />
                </div>
              )}
              
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
          <a href="/wallet" className="btn btn--secondary" style={{ flex: 1 }}>Wallet</a>
          <a href="/my-sessions" className="btn btn--secondary" style={{ flex: 1 }}>My Sessions</a>
          <a href="/settings" className="btn btn--secondary" style={{ flex: 1 }}>Settings</a>
        </div>
      </div>
    </main>
  );
}
