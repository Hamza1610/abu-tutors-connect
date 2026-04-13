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

            // Redirect based on role
            const user = data.user;
            if (user.role === 'admin') {
                window.location.href = '/admin';
            } else if (user.role === 'tutor') {
                window.location.href = '/tutor-dashboard';
            } else {
                window.location.href = '/tutors';
            }
        } catch (err: any) {
            // Handle Axios errors vs standard errors
            const errorMessage = err.response?.data?.message || err.message || 'Login failed';
            setError(errorMessage);
        }
    };

    return (
        <main className="auth-layout">
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                <div className="card shadow-lg" style={{ maxWidth: '400px', width: '100%', borderRadius: '16px' }}>
                    <div className="card__body" style={{ padding: 'var(--space-8)' }}>
                        <h1 className="page-header__title" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>Login</h1>
                        <p className="page-header__subtitle" style={{ textAlign: 'center', marginBottom: 'var(--space-6)', color: '#64748b' }}>Welcome back to ABUTutorsConnect</p>
 
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
                                 <div style={{ textAlign: 'right', marginTop: '5px' }}>
                                     <a href="/forgot-password" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', textDecoration: 'none' }}>Forgot Password?</a>
                                 </div>
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
