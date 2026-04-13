"use client";
import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ResetPassword() {
    const params = useParams();
    const token = params.token as string;
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            setSuccess('Password updated successfully! Redirecting...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
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
                        <h1 className="page-header__title" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>Reset Password</h1>
                        <p className="page-header__subtitle" style={{ textAlign: 'center', marginBottom: 'var(--space-6)', color: '#64748b' }}>
                            Please enter your new password below.
                        </p>
 
                         {error && <div className="alert alert--error" style={{ marginBottom: '15px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px', textAlign: 'center' }}>{error}</div>}
                         {success && <div className="alert alert--success" style={{ marginBottom: '15px', padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', textAlign: 'center' }}>{success}</div>}
 
                         {!success && (
                             <form onSubmit={handleSubmit}>
                                 <div className="form-group">
                                     <label className="form-label" htmlFor="password">New Password</label>
                                     <input
                                         type="password"
                                         id="password"
                                         className="form-input"
                                         placeholder="At least 8 characters"
                                         required
                                         value={password}
                                         onChange={(e) => setPassword(e.target.value)}
                                     />
                                     <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                         Must contain a letter, a number, and a special character.
                                     </p>
                                 </div>
                                 <div className="form-group">
                                     <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                     <input
                                         type="password"
                                         id="confirmPassword"
                                         className="form-input"
                                         placeholder="Confirm your new password"
                                         required
                                         value={confirmPassword}
                                         onChange={(e) => setConfirmPassword(e.target.value)}
                                     />
                                 </div>
                                 <button type="submit" disabled={loading} className="btn btn--primary" style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
                                     {loading ? 'Resetting Password...' : 'Reset Password'}
                                 </button>
                             </form>
                         )}
                         <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                             <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Back to Login</Link>
                         </p>
                     </div>
                 </div>
             </div>
         </main>
    );
}
