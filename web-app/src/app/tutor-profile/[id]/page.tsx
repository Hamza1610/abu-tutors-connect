'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { userApi } from '../../../services/api';

export default function TutorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tutor, setTutor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchTutor = async () => {
      try {
        const response = await userApi.getTutorProfile(id);
        setTutor(response.data);
      } catch (err: any) {
        console.error('Failed to fetch tutor', err);
        setError(err.response?.data?.message || 'Tutor not found');
      } finally {
        setLoading(false);
      }
    };

    fetchTutor();
  }, [id]);

  if (loading) {
    return (
      <main className="container pb-space-8 pt-space-8">
        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>Loading tutor profile...</div>
      </main>
    );
  }

  if (error || !tutor) {
    return (
      <main className="container pb-space-8 pt-space-8">
        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', color: 'red' }}>
          {error || 'Tutor not found'}
          <br /><br />
          <button className="btn btn--secondary" onClick={() => router.push('/tutors')}>Back to Search</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container pb-space-8 pt-space-8">
      <div style={{ marginTop: 'var(--space-6)', display: 'grid', gap: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-6)', gridTemplateColumns: '1fr' }}>
          
          {/* Header Card */}
          <div className="card">
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" 
                  alt={tutor.name} 
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{ textAlign: 'center' }}>
                  <h1 className="page-header__title" style={{ marginBottom: 'var(--space-2)' }}>{tutor.name}</h1>
                  <span className={`tutor-card__badge ${tutor.role === 'verified_tutor' ? 'tutor-card__badge--green' : 'tutor-card__badge--orange'}`} style={{ display: 'inline-block' }}>
                    {tutor.level || (tutor.role === 'verified_tutor' ? 'Verified Tutor' : 'Tutor')}
                  </span>
                  <p className="tutor-card__subject" style={{ margin: 'var(--space-3) 0 0' }}>
                    {tutor.department}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                <div>
                  <div className="tutor-card__rating">★ {(tutor.rating || 0).toFixed(1)} <span className="count">({tutor.sessionsCompleted || 0} sessions)</span></div>
                </div>
                <div>
                  {/* Mock price since it's not in the model right now, or we can use a hardcoded value based on tier */}
                  <span className="tutor-card__price" style={{ fontSize: 'var(--font-size-xl)' }}>N800/hr</span>
                </div>
              </div>
              <a href={`/book-session?tutor=${tutor._id}`} className="btn btn--primary" style={{ width: '100%', textAlign: 'center' }}>Book Session</a>
            </div>
          </div>

          {/* About Section */}
          <div className="card">
            <div className="card__body">
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>About</h2>
              <p className="tutor-card__subject" style={{ lineHeight: 1.7 }}>
                {tutor.about || "This tutor hasn't written an about me yet."}
              </p>
            </div>
          </div>

          {/* Courses Section */}
          <div className="card">
            <div className="card__body">
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Courses</h2>
              <div className="course-tags">
                {tutor.courses && tutor.courses.length > 0 ? (
                  tutor.courses.map((course: string, idx: number) => (
                    <span key={idx} className="course-tag course-tag--active">{course}</span>
                  ))
                ) : (
                  <p className="tutor-card__subject">No specific courses listed.</p>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
