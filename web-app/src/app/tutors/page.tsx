'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { userApi } from '../../services/api';

function TutorsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [tutors, setTutors] = useState<any[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'COEN453', 'CCSN', 'MATHS', 'PHYSICS', 'CHEMISTRY'];

  useEffect(() => {
    fetchTutors();
  }, []);

  useEffect(() => {
    filterTutors();
  }, [searchTerm, activeCategory, tutors]);

  const fetchTutors = async () => {
    try {
      const response = await userApi.getTutors();
      setTutors(response.data);
    } catch (err) {
      console.error('Error fetching tutors', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTutors = () => {
    let filtered = [...tutors];

    if (activeCategory !== 'All') {
      filtered = filtered.filter(t => 
        t.courses?.includes(activeCategory) || 
        t.department?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(term) || 
        t.courses?.some((c: string) => c.toLowerCase().includes(term)) ||
        t.department?.toLowerCase().includes(term)
      );
    }

    setFilteredTutors(filtered);
  };

  return (
    <main className="container">
      <div className="page-header" style={{ marginTop: 'var(--space-8)' }}>
        <h1 className="page-header__title">Verified Tutors</h1>
        <p className="page-header__subtitle">Browse our community of verified ABU peer tutors</p>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card__body">
          <div className="search-box" style={{ marginBottom: 'var(--space-5)' }}>
            <input 
              type="text" 
              className="search-box__input" 
              placeholder="Search by name, course or topic..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn--primary">Search</button>
          </div>
          <div className="course-tags">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`course-tag ${activeCategory === cat ? 'course-tag--active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tutor Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading tutors...</p>
        </div>
      ) : filteredTutors.length > 0 ? (
        <div className="tutor-grid">
          {filteredTutors.map(tutor => (
            <article key={tutor._id} className="tutor-card">
              <Link href={`/tutors/${tutor._id}`}>
                  <div className="tutor-card__image-wrap">
                    {tutor.documents?.profilePicture ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${tutor.documents.profilePicture}`} 
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
              </Link>
              <div className="tutor-card__content">
                <Link href={`/tutors/${tutor._id}`}>
                  <h3 className="tutor-card__name">{tutor.name}</h3>
                </Link>
                <p className="tutor-card__subject" style={{ fontSize: '13px', color: '#64748B' }}>{tutor.faculty} · {tutor.department}</p>
                <p className="tutor-card__subject" style={{ margin: '8px 0', minHeight: '40px' }}>
                  {tutor.courses?.join(', ') || 'General Studies'}
                  {tutor.areaOfStrength && <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontStyle: 'italic', marginTop: '4px' }}>Strength: {tutor.areaOfStrength}</div>}
                </p>
                <div className="tutor-card__meta">
                  <div className="tutor-card__rating">
                    <span className="star" style={{ color: '#FBBF24' }}>★</span> {tutor.averageRating?.toFixed(1) || 'New'} 
                    <span className="count" style={{ marginLeft: '4px' }}>({tutor.sessionsCompleted || 0})</span>
                  </div>
                  <span className="tutor-card__price">₦{tutor.hourlyRate || 500}/hr</span>
                </div>
                <Link href={`/book-session?tutor=${tutor._id}`} className="btn btn--primary btn--block" style={{ marginTop: '12px' }}>Check Availability</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No tutors found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </main>
  );
}

export default function TutorsPage() {
  return (
    <Suspense fallback={<div>Loading Page...</div>}>
      <TutorsContent />
    </Suspense>
  );
}
