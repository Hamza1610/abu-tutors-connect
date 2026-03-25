'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { userApi } from '../services/api';

export default function LandingPage() {
  const router = useRouter();
  const [tutors, setTutors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      const response = await userApi.getTutors();
      setTutors(response.data.slice(0, 2)); // Show only 2 on home as per design
    } catch (err) {
      console.error('Failed to fetch tutors', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tutors?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <main className="container">
      {/* Hero Banner: Orange Banner */}
      <section className="hero-banner">
        <div className="hero-banner__content">
          <h1 className="hero-banner__title">Find the best tutors at ABU</h1>
          <p className="hero-banner__text">Connect with top-performing students for personalized 1-on-1 tutoring in any course.</p>
          <form className="search-box hero-banner__search" onSubmit={handleSearch}>
            <input 
              type="text" 
              className="search-box__input" 
              placeholder="Search courses (e.g. CGEN, Math)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn--search">Search</button>
          </form>
        </div>
        <div className="hero-banner__illustration" aria-hidden="true" />
      </section>

      {/* Main Content Layout */}
      <div className="home-main">
        <div className="home-main__left">
          {/* AI Powered Card */}
          <section className="hero-card hero-card--purple home-ai-card">
            <div>
              <span className="hero-card__badge">AI POWERED</span>
              <h2 className="hero-card__title">Struggling with a concept?</h2>
              <p className="hero-card__text">Our agentic AI analyzes your academic problems and finds the tutor who matches your learning style perfectly.</p>
            </div>
            <Link href="/ai-match" className="btn btn--white-outline hero-ai-btn">Try AI Match</Link>
          </section>

          {/* Featured Tutors Section */}
          <section className="verified-tutors-section">
            <div className="section-header">
              <h2 className="section-header__title">Featured Tutors</h2>
              <Link href="/tutors" className="section-header__link">View All</Link>
            </div>
            <div className="tutor-grid tutor-grid--horizontal">
              {loading ? (
                <p>Loading top tutors...</p>
              ) : tutors.length > 0 ? (
                tutors.map((tutor) => (
                  <article key={tutor._id} className="tutor-card">
                    <div className="tutor-card__image-wrap">
                      {tutor.documents?.profilePicture ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${tutor.documents.profilePicture}`} 
                          alt={tutor.name} 
                          className="tutor-card__image" 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', height: '100%', 
                          background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '48px', fontWeight: 'bold'
                        }}>
                          {tutor.name.charAt(0)}
                        </div>
                      )}
                      <span className={`tutor-card__badge ${tutor.role === 'verified_tutor' ? 'tutor-card__badge--orange' : 'tutor-card__badge--green'}`}>
                        {tutor.role === 'verified_tutor' ? 'Verified Tutor' : 'New Tutor'}
                      </span>
                    </div>
                    <div className="tutor-card__content">
                      <h3 className="tutor-card__name">{tutor.name}</h3>
                      <p className="tutor-card__subject">{tutor.courses?.slice(0, 2).join(', ') || tutor.department}</p>
                      <div className="tutor-card__meta">
                        <div className="tutor-card__rating">
                          <span className="star">★</span> {tutor.rating || 'New'} 
                          <span className="count">({tutor.sessionsCompleted || 0})</span>
                        </div>
                        <span className="tutor-card__price">₦{tutor.role === 'verified_tutor' ? (tutor.hourlyRate || 800) : 500}</span>
                      </div>
                      <Link href={`/book-session?tutor=${tutor._id}`} className="btn btn--secondary btn--block">Book Session</Link>
                    </div>
                  </article>
                ))
              ) : (
                <p>No tutors available at the moment.</p>
              )}
            </div>
          </section>

          {/* Popular Courses Section */}
          <section className="popular-courses-section">
            <h2 className="section-header__title section-header__title--sm">Popular Courses</h2>
            <div className="course-tags">
              {['COEN453', 'MATHS', 'PHYSICS', 'CHEMISTRY', 'CCSN'].map(course => (
                <Link key={course} href={`/tutors?q=${course}`} className="course-tag">{course}</Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="home-main__right">
          {/* AI Features Card */}
          <div className="card home-side-card">
            <div className="card__body">
              <h3 className="section-header__title section-header__title--sm">AI Assistant Features</h3>
              <ul className="ai-features">
                <li className="ai-features__item">
                  <span className="ai-features__bullet" />
                  <div>
                    <h4 className="ai-features__title">Smart Matching</h4>
                    <p className="ai-features__desc">Gemini AI analyzes your academic needs and finds the best peer match.</p>
                  </div>
                </li>
                <li className="ai-features__item">
                  <span className="ai-features__bullet" />
                  <div>
                    <h4 className="ai-features__title">Tool-Calling Reasoning</h4>
                    <p className="ai-features__desc">Our agent reasons about availability and distance to suggest the best fit.</p>
                  </div>
                </li>
                <li className="ai-features__item">
                  <span className="ai-features__bullet" />
                  <div>
                    <h4 className="ai-features__title">Fast Resolution</h4>
                    <p className="ai-features__desc">Get matched and booked in under 60 seconds.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card home-side-card">
            <div className="card__body">
              <h3 className="section-header__title section-header__title--sm">Quick Actions</h3>
              <div className="quick-actions">
                <Link href="/my-sessions" className="quick-action-btn quick-action-btn--primary">
                  <span className="quick-action-btn__icon">📅</span>
                  Sessions
                </Link>
                <Link href="/wallet" className="quick-action-btn">
                  <span className="quick-action-btn__icon">💳</span>
                  Wallet
                </Link>
                <Link href="/notifications" className="quick-action-btn">
                  <span className="quick-action-btn__icon">🔔</span>
                  Alerts
                </Link>
                <Link href="/profile" className="quick-action-btn">
                  <span className="quick-action-btn__icon">👤</span>
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
