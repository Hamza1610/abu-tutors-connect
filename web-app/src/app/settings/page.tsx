'use client';

import React, { useState, useEffect } from 'react';
import { userApi } from '../../services/api';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile();
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateProfile(profile);
      alert('Settings updated successfully!');
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePrefChange = (pref: string, val: boolean) => {
      setProfile({
          ...profile,
          notificationPreferences: {
              ...profile.notificationPreferences,
              [pref]: val
          }
      });
  };

  if (loading) return <main className="container pt-space-8 text-center">Loading settings...</main>;

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h1 className="page-header__title">Settings</h1>
        <p className="page-header__subtitle">Manage your account preferences and notification settings</p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: '800px' }}>
        {/* Account Settings */}
        <div className="card">
          <div className="card__body">
            <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Account Information</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input 
                    type="text" 
                    id="name" 
                    className="form-input" 
                    value={profile.name} 
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input type="email" id="email" className="form-input" value={profile.email} disabled />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="bio">About You</label>
                <textarea 
                    id="bio" 
                    className="form-input" 
                    rows={4} 
                    value={profile.about} 
                    onChange={(e) => setProfile({...profile, about: e.target.value})}
                />
              </div>

              {(profile.role === 'tutor' || profile.role === 'verified_tutor') && (
                  <>
                    <h3 className="tutor-card__name" style={{ margin: 'var(--space-6) 0 var(--space-4)' }}>Tutoring Preferences</h3>
                    <div className="form-group">
                        <label className="form-label" htmlFor="hourly-rate">Hourly Rate (₦)</label>
                        <input 
                            type="number" 
                            id="hourly-rate" 
                            className="form-input" 
                            value={profile.hourlyRate}
                            onChange={(e) => setProfile({...profile, hourlyRate: Number(e.target.value)})}
                        />
                    </div>
                  </>
              )}

              <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="card__body">
            <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Notifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {Object.keys(profile.notificationPreferences || {}).map(pref => (
                  <label key={pref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: 'var(--space-2) 0' }}>
                    <span className="tutor-card__subject" style={{ margin: 0 }}>
                        {pref.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <input 
                        type="checkbox" 
                        checked={profile.notificationPreferences[pref]} 
                        onChange={(e) => handlePrefChange(pref, e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </label>
              ))}
            </div>
            <button className="btn btn--primary" style={{ marginTop: 'var(--space-4)' }} onClick={handleUpdate}>Save Preferences</button>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card__body">
            <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Privacy & Security</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button className="btn btn--secondary" onClick={() => alert('Password reset link sent to your email!')}>Change Password</button>
              <div style={{ padding: 'var(--space-4)', background: '#FEF3C7', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
                <p className="tutor-card__subject" style={{ margin: 0 }}><strong>Danger Zone:</strong> Delete all your account data permanently.</p>
                <button className="btn" style={{ background: '#DC2626', color: 'white', marginTop: 'var(--space-2)' }}>Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
