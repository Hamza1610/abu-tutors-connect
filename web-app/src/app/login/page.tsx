"use client";
import React, { useState } from 'react';
import api from '@/services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            const data = res.data;

            // Store token and user
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role or to dashboard
            window.location.href = '/tutor-dashboard';
        } catch (err: any) {
            // Handle Axios errors vs standard errors
            const errorMessage = err.response?.data?.message || err.message || 'Login failed';
            setError(errorMessage);
        }
    };

    return (
        <main className="auth-layout">
            <div className="auth-card">
                <div className="card">
                    <div className="card__body auth-card">
                        <h1 className="page-header__title" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>Login</h1>
                        <p className="page-header__subtitle" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>Welcome back to ABUTutorsConnect</p>

                        {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email or Admission ID</label>
                                <input
                                    type="text"
                                    id="email"
                                    className="form-input"
                                    placeholder="e.g. U21CO1015 or email@abu.edu.ng"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn--primary" style={{ width: '100%', marginBottom: 'var(--space-4)' }}>Login</button>
                        </form>
                        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            Don't have an account? <a href="/register">Sign up</a>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
