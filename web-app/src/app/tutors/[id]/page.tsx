'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { userApi } from '../../../services/api';

export default function TutorProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [tutor, setTutor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTutor();
  }, [id]);

  const fetchTutor = async () => {
    try {
      const response = await userApi.getTutorProfile(id as string);
      setTutor(response.data);
    } catch (err) {
      console.error('Error fetching tutor profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Loading profile...</div>;
  if (!tutor) return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Tutor not found.</div>;

  return (
    <main className="container tutor-profile-page">
      <div className="page-header" style={{ marginTop: '40px' }}>
        <Link href="/tutors" className="btn btn--outline btn--sm" style={{ marginBottom: '20px' }}>← Back to Discovery</Link>
      </div>

      <div className="main-layout main-layout--dashboard">
        {/* Left Column: Profile Info */}
        <div className="main-layout__main">
          <section className="card">
            <div className="card__body">
              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                {tutor.documents?.profilePicture ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${tutor.documents.profilePicture}`} 
                    alt={tutor.name} 
                    style={{ width: '150px', height: '150px', borderRadius: '15px', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ 
                    width: '150px', height: '150px', borderRadius: '15px',
                    background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '64px', fontWeight: 'bold', border: '2px solid var(--color-primary)'
                  }}>
                    {tutor.name.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="tutor-card__name" style={{ fontSize: '32px' }}>{tutor.name}</h1>
                    <span className={`tutor-card__badge ${tutor.role === 'verified_tutor' ? 'tutor-card__badge--orange' : 'tutor-card__badge--green'}`} style={{ position: 'relative', top: 0, left: 0 }}>
                      {tutor.role === 'verified_tutor' ? 'Verified Tutor' : 'New Tutor'}
                    </span>
                  </div>
                  <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '15px' }}>{tutor.department} | {tutor.level}</p>
                  <div className="tutor-card__rating" style={{ marginBottom: '20px' }}>
                    <span className="star" style={{ fontSize: '24px' }}>★</span> 
                    <span style={{ fontSize: '20px' }}>{tutor.rating || 'New'}</span>
                    <span className="count">({tutor.sessionsCompleted || 0} sessions completed)</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '40px', borderTop: '1px solid var(--color-border)', paddingTop: '30px' }}>
                <h2 className="section-header__title" style={{ fontSize: '20px', marginBottom: '15px' }}>About</h2>
                <p className="hero-card__text" style={{ color: 'var(--color-text)', fontSize: '16px', lineHeight: '1.7' }}>
                  {tutor.about || "This tutor hasn't added a bio yet, but they are ready to help you excel in their expert courses!"}
                </p>

                <h2 className="section-header__title" style={{ fontSize: '20px', marginTop: '30px', marginBottom: '15px' }}>Expertise Courses</h2>
                <div className="course-tags">
                  {tutor.courses?.map((course: string) => (
                    <span key={course} className="course-tag course-tag--active">{course}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Booking Card */}
        <aside className="main-layout__sidebar">
          <div className="card">
            <div className="card__body">
              <h3 className="section-header__title" style={{ fontSize: '18px', marginBottom: '10px' }}>Book 1-on-1 Session</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>Connect with {tutor.name} for personalized help.</p>
              
              <div style={{ background: 'var(--color-primary-light)', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>₦{tutor.role === 'verified_tutor' ? (tutor.hourlyRate || 800) : 500}</span>
                <span style={{ color: 'var(--color-text-muted)' }}> / hour</span>
              </div>

              <Link href={`/book-session?tutor=${tutor._id}`} className="btn btn--primary btn--block" style={{ height: '50px' }}>
                Continue to Booking
              </Link>

              <button 
                onClick={() => router.push(`/messages?partnerId=${tutor._id}`)} 
                className="btn btn--secondary btn--block" 
                style={{ marginTop: '10px', height: '45px' }}
              >
                Message {tutor.name.split(' ')[0]}
              </button>
              
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '15px' }}>
                Payment is held in escrow until session completion.
              </p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card__body">
              <h3 className="section-header__title" style={{ fontSize: '16px', marginBottom: '10px' }}>Availability</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {tutor.availability || "Flexible (Mon - Sat, 4pm - 8pm)"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
