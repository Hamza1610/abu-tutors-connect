'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '../../../services/api';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('');
  const [courses, setCourses] = useState('');        // stored as comma-string
  const [areaOfStrength, setAreaOfStrength] = useState('');
  const [matchingBio, setMatchingBio] = useState(''); // Profile Summary
  const [about, setAbout] = useState('');

  useEffect(() => {
    userApi.getProfile().then(res => {
      const d = res.data;
      setUser(d);
      setPhone(d.phone || '');
      setLevel(d.level || '100L');
      setCourses(d.courses?.join(', ') || '');
      setAreaOfStrength(d.areaOfStrength || '');
      setMatchingBio(d.matchingBio || '');
      setAbout(d.about || '');
    }).catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('phone', phone);
      fd.append('level', level);
      fd.append('about', about);
      fd.append('areaOfStrength', areaOfStrength);
      fd.append('matchingBio', matchingBio);
      const courseArr = courses.split(',').map(c => c.trim()).filter(Boolean);
      fd.append('courses', JSON.stringify(courseArr));

      await userApi.updateProfile(fd);
      setSuccess('Profile updated successfully!');
      setTimeout(() => router.push('/profile'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;
  if (!user) return null;

  return (
    <main className="container" style={{ maxWidth: '680px', margin: '40px auto', padding: '0 16px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.push('/profile')} className="btn btn--outline btn--sm">← Back</button>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Edit Profile</h1>
      </div>

      <form onSubmit={handleSave}>
        {/* ── General Info ── */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card__body">
            <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-primary)' }}>General Information</h2>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" />
            </div>

            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-input" value={level} onChange={e => setLevel(e.target.value)}>
                {['100L','200L','300L','400L','500L'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">About Me (General Bio)</label>
              <textarea className="form-input" value={about} onChange={e => setAbout(e.target.value)} placeholder="A short general bio about yourself..." style={{ minHeight: '80px', resize: 'vertical' }}></textarea>
            </div>
          </div>
        </div>

        {/* ── Tutor Teaching Profile ── */}
        {user.role !== 'tutee' && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card__body">
              <h2 style={{ fontSize: '18px', marginBottom: '4px', color: 'var(--color-primary)' }}>Teaching Profile</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Shown to students on your public profile and used by the AI Matcher to recommend you.</p>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 'bold' }}>Courses I Teach</label>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Enter course codes separated by commas.</p>
                <input
                  type="text"
                  className="form-input"
                  value={courses}
                  onChange={e => setCourses(e.target.value)}
                  placeholder="e.g. MATH101, COEN201, PHYS301"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Area of Strength</label>
                <input type="text" className="form-input" value={areaOfStrength} onChange={e => setAreaOfStrength(e.target.value)} placeholder="e.g. Calculus, Logic Design, Data Structures" />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Profile Summary (AI Matching)</label>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Describe your teaching style and how you help students. The AI Matcher uses this for recommendations.</p>
                <textarea
                  className="form-input"
                  value={matchingBio}
                  onChange={e => setMatchingBio(e.target.value)}
                  placeholder="e.g. I specialize in Calculus and Mechanics. I explain complex topics using real-world examples and step-by-step breakdowns..."
                  style={{ minHeight: '120px', resize: 'vertical' }}
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* ── Error / Success ── */}
        {error && <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ padding: '12px 16px', background: '#F0FDF4', color: '#16A34A', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>✓ {success}</div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => router.push('/profile')} className="btn btn--secondary" style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn btn--primary" style={{ flex: 2 }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </main>
  );
}
