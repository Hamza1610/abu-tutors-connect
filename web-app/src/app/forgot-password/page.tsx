"use client";
import React, { useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccess(res.data.message || 'If an account exists with that email, a reset link has been sent.');
            setEmail('');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Something went wrong';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-layout">
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                <div className="card shadow-lg" style={{ maxWidth: '400px', width: '100%', borderRadius: '16px' }}>
                    <div className="card__body" style={{ padding: 'var(--space-8)' }}>
                        <h1 className="page-header__title" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>Forgot Password</h1>
                        <p className="page-header__subtitle" style={{ textAlign: 'center', marginBottom: 'var(--space-6)', color: '#64748b' }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
 
                         {error && <div className="alert alert--error" style={{ marginBottom: '15px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px', textAlign: 'center' }}>{error}</div>}
                         {success && <div className="alert alert--success" style={{ marginBottom: '15px', padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', textAlign: 'center' }}>{success}</div>}
 
                         {!success && (
                             <form onSubmit={handleSubmit}>
                                 <div className="form-group">
                                     <label className="form-label" htmlFor="email">Email Address</label>
                                     <input
                                         type="email"
                                         id="email"
                                         className="form-input"
                                         placeholder="your.email@abu.edu.ng"
                                         required
                                         value={email}
                                         onChange={(e) => setEmail(e.target.value)}
                                     />
                                 </div>
                                 <button type="submit" disabled={loading} className="btn btn--primary" style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
                                     {loading ? 'Sending Link...' : 'Send Reset Link'}
                                 </button>
                             </form>
                         )}
                         <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                             Remembered your password? <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Back to Login</Link>
                         </p>
                     </div>
                 </div>
             </div>
         </main>
    );
}
