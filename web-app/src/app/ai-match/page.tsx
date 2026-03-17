"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function AIMatch() {
    const router = useRouter();
    const [course, setCourse] = useState('');
    const [topic, setTopic] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [matchResult, setMatchResult] = useState<any>(null);

    const handleMatch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMatchResult(null);
        setLoading(true);

        try {
            const res = await api.post('/match/request', { course, topic, prompt });
            setMatchResult(res.data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to process match request';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <div style={{ marginTop: 'var(--space-6)', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' }}>
                <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
                    <span className="hero-card__badge" style={{ background: 'var(--color-secondary-light)', color: 'var(--color-secondary)', marginBottom: 'var(--space-3)' }}>AI Powered</span>
                    <h1 className="page-header__title">Find Your Perfect Tutor Match</h1>
                    <p className="page-header__subtitle">Describe your problem, course, and area of concern. Our AI will match you with the best available tutor.</p>
                </div>

                <div className="card">
                    <div className="card__body">
                        {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                        {matchResult ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Match Found!</h3>
                                <p style={{ marginBottom: '1rem' }}>{matchResult.message}</p>
                                <div style={{ background: 'var(--color-background)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>{matchResult.tutor.name}</h4>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Faculty: {matchResult.tutor.faculty} | Level: {matchResult.tutor.level}</p>
                                    <p style={{ marginBottom: '1rem' }}><strong>Expertise:</strong> {matchResult.tutor.courses.join(', ')}</p>
                                    <button 
                                        className="btn btn--primary" 
                                        onClick={() => router.push(`/book-session?tutor=${matchResult.tutor._id}`)}
                                    >
                                        Book Session with {matchResult.tutor.name}
                                    </button>
                                </div>
                                <button className="btn btn--outline" style={{ marginTop: '1rem' }} onClick={() => setMatchResult(null)}>Try Another Search</button>
                            </div>
                        ) : (
                            <form onSubmit={handleMatch}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="course">Course Code or Name</label>
                                    <input
                                        type="text"
                                        id="course"
                                        className="form-input"
                                        placeholder="e.g. COEN453, CCSN, Engineering Math"
                                        value={course}
                                        onChange={(e) => setCourse(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="topic">Specific Topic or Area of Concern</label>
                                    <input
                                        type="text"
                                        id="topic"
                                        className="form-input"
                                        placeholder="e.g. Binary Search Trees, Vector Calculus"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="prompt">Describe Your Problem</label>
                                    <textarea
                                        id="prompt"
                                        className="form-input"
                                        rows={5}
                                        placeholder="I'm struggling with understanding how recursion works in data structures. I need someone who can explain with simple examples and practice problems."
                                        style={{ resize: 'vertical', minHeight: '120px' }}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn--primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Analyzing with AI...' : 'Find My Match'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                    <div className="card__body">
                        <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>How AI Matching Works</h2>
                        <ul className="ai-features">
                            <li className="ai-features__item">
                                <span className="ai-features__bullet">1</span>
                                <div>
                                    <h4 className="ai-features__title">Enter Your Details</h4>
                                    <p className="ai-features__desc">Describe your course, topic, and what you're struggling with.</p>
                                </div>
                            </li>
                            <li className="ai-features__item">
                                <span className="ai-features__bullet">2</span>
                                <div>
                                    <h4 className="ai-features__title">AI Analyzes & Matches</h4>
                                    <p className="ai-features__desc">Our agentic AI checks tutor availability and skills to find the best match.</p>
                                </div>
                            </li>
                            <li className="ai-features__item">
                                <span className="ai-features__bullet">3</span>
                                <div>
                                    <h4 className="ai-features__title">Book Your Session</h4>
                                    <p className="ai-features__desc">Pick a time slot and confirm your session.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
