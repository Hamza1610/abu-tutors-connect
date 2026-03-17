"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { userApi } from '@/services/api';

export default function Register() {
    const [role, setRole] = useState('tutee');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        admissionId: '',
        faculty: '',
        department: '',
        level: '100L',
        gender: 'Male',
        password: '',
        about: '',
        courses: '',
        availability: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        setFormData({ ...formData, [e.target.id]: e.target.value });

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Admission ID Validation
        if (formData.admissionId) {
            const admissionIdRegex = /^U\d{2}[A-Z]{2}\d{4}$/;
            if (!admissionIdRegex.test(formData.admissionId)) {
                setError("Invalid ABU Admission ID. Format: U21CO1015");
                setLoading(false);
                return;
            }
        }

        try {
            const coursesArray = formData.courses ? formData.courses.split(',').map(s => s.trim()) : [];
            const res = await api.post('/auth/register', { 
                ...formData, 
                role,
                courses: coursesArray 
            });
            const data = res.data;

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => window.location.href = '/', 1500);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-layout">
            <div className="auth-card" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="card">
                    <div className="card__body auth-card">
                        <h1 className="page-header__title" style={{ textAlign: 'center' }}>Join ABUTutors</h1>
                        <p className="page-header__subtitle" style={{ textAlign: 'center', marginBottom: '30px' }}>Select your role and fill your details</p>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                            <button
                                type="button"
                                className={`btn ${role === 'tutee' ? 'btn--primary' : 'btn--secondary'}`}
                                style={{ flex: 1 }}
                                onClick={() => setRole('tutee')}
                            >
                                Student (Tutee)
                            </button>
                            <button
                                type="button"
                                className={`btn ${role === 'tutor' ? 'btn--primary' : 'btn--secondary'}`}
                                style={{ flex: 1 }}
                                onClick={() => setRole('tutor')}
                            >
                                Peer Tutor
                            </button>
                        </div>

                        {error && <div className="alert alert--error" style={{ marginBottom: '20px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px', textAlign: 'center' }}>{error}</div>}
                        {success && <div className="alert alert--success" style={{ marginBottom: '20px', padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', textAlign: 'center' }}>{success}</div>}

                        <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Full Name</label>
                                <input type="text" id="name" className="form-input" placeholder="Ahmad Musa" required value={formData.name} onChange={handleChange} />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" id="email" className="form-input" placeholder="ahmad@abu.edu.ng" required value={formData.email} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Admission ID</label>
                                <input type="text" id="admissionId" className="form-input" placeholder="U21CO1015" required value={formData.admissionId} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select id="gender" className="form-input" value={formData.gender} onChange={handleChange}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Level</label>
                                <select id="level" className="form-input" value={formData.level} onChange={handleChange}>
                                    <option value="100L">100L</option>
                                    <option value="200L">200L</option>
                                    <option value="300L">300L</option>
                                    <option value="400L">400L</option>
                                    <option value="500L">500L</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Faculty</label>
                                <input type="text" id="faculty" className="form-input" placeholder="Engineering" required value={formData.faculty} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <input type="text" id="department" className="form-input" placeholder="Computer Eng" required value={formData.department} onChange={handleChange} />
                            </div>

                            {role === 'tutor' && (
                                <>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Courses You Can Tutor (comma separated)</label>
                                        <input type="text" id="courses" className="form-input" placeholder="COEN453, CCSN411, Math 101" required value={formData.courses} onChange={handleChange} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">About You / Experience</label>
                                        <textarea id="about" className="form-input" style={{ height: '80px' }} placeholder="I excel at software design..." value={formData.about} onChange={handleChange} />
                                    </div>
                                </>
                            )}

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Password</label>
                                <input type="password" id="password" className="form-input" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                            </div>

                            <button type="submit" disabled={loading} className="btn btn--primary" style={{ gridColumn: 'span 2', height: '50px' }}>
                                {loading ? 'Creating Account...' : 'Register Now'}
                            </button>
                        </form>
                        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                            Already have an account? <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
