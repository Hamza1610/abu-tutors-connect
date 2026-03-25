"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';

export default function Register() {
    const [role, setRole] = useState('tutee');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        registrationNumber: '',
        password: '',
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        setFormData({ ...formData, [e.target.id]: e.target.value });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (role === 'tutee' && file.size > 100 * 1024) {
                setError('Profile picture must be less than 100KB');
                return;
            }
            setProfilePicture(file);
            setError('');
        }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!acceptedTerms) {
            setError("You must read and accept the Terms and Conditions.");
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('registrationNumber', formData.registrationNumber);
            data.append('role', role);
            data.append('acceptedTerms', 'true');
            if (profilePicture) {
                data.append('profilePicture', profilePicture);
            }

            const res = await api.post('/auth/register', data);
            const responseData = res.data;

            localStorage.setItem('token', responseData.token);
            localStorage.setItem('user', JSON.stringify(responseData.user));

            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => {
                if (role === 'tutor') {
                    window.location.href = '/profile';
                } else {
                    window.location.href = '/';
                }
            }, 1500);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-layout">
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%', borderRadius: '16px' }}>
                    <div className="card__body" style={{ padding: 'var(--space-8)' }}>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                            <h1 className="page-header__title" style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>Join ABUTutors</h1>
                            <p style={{ color: '#64748b' }}>Select your role and fill your details</p>
                        </div>

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

                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input type="text" id="name" className="form-input" placeholder="Ahmad Musa" required value={formData.name} onChange={handleChange} />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" id="email" className="form-input" placeholder="ahmad@abu.edu.ng" required value={formData.email} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Registration/Admission Number</label>
                                <input type="text" id="registrationNumber" className="form-input" placeholder="U21CO1015" required value={formData.registrationNumber} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input type="password" id="password" className="form-input" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                            </div>

                            {role === 'tutee' && (
                                <div className="form-group">
                                    <label className="form-label">Profile Picture (Max 100KB)</label>
                                    <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} required />
                                </div>
                            )}

                            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="terms" 
                                        checked={acceptedTerms} 
                                        onChange={(e) => setAcceptedTerms(e.target.checked)} 
                                        required 
                                        style={{ marginTop: '4px' }}
                                    />
                                    <label htmlFor="terms" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        I have read and agree to the <button type="button" onClick={() => setShowTerms(true)} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', padding: 0, fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Terms and Conditions</button>
                                    </label>
                                </div>
                            </div>

                            {showTerms && (
                                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                                    <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
                                        <div className="card__body">
                                            <h2 className="section-header__title">Terms and Conditions</h2>
                                            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
                                                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                                                    <h3>Terms and Conditions</h3>
Welcome to our Tutoring Platform. By registering and using our services, you agree to the following terms and conditions:

<p><strong>1. Eligibility</strong><br />
You must provide accurate and truthful information during registration.<br />
Users must be a registered student (tutee) or verified tutor.<br />
Tutors must pay the registration fee unless waived by Admin.</p>

<p><strong>2. Account Responsibilities</strong><br />
Keep your login credentials secure.<br />
You are responsible for all activity on your account.<br />
Users may register as both tutor and tutee using the same email.</p>

<p><strong>3. Profile Completion & Verification</strong><br />
Tutors must complete their profile and submit required documents.<br />
Admin will review profiles before granting access to the system.<br />
Verified tutors may set their hourly charge.</p>

<p><strong>4. Session Rules</strong><br />
Sessions must start and end using QR codes or secure PINs.<br />
Once started, sessions are tracked using device clock/local timer, even if offline.<br />
Tutors and tutees must follow professional conduct.</p>

<p><strong>5. Payment & Escrow</strong><br />
Session fees are deducted from the tutee’s wallet and held in Escrow.<br />
Escrow is released to the tutor only after a session ends successfully.<br />
Refunds or reschedules are allowed according to No-Show or dispute policies.</p>

<p><strong>6. Ratings and Feedback</strong><br />
Both tutors and tutees must submit honest ratings and reviews.<br />
Ratings contribute to tutor verification and system trust.</p>

<p><strong>7. Disputes</strong><br />
Users may flag disputes if issues arise.<br />
Escrow funds remain frozen until Admin resolves the issue.</p>

<p><strong>8. User Conduct</strong><br />
Users must treat each other professionally and respectfully.<br />
Harassment, abuse, or fraudulent activity may result in account suspension or removal.</p>

<p><strong>9. Admin Authority</strong><br />
Admin may update these terms at any time.<br />
Users are required to agree to the latest terms to continue using the platform.<br />
Admin manages registration fees, session monitoring, disputes, and Escrow resolution.</p>

<p><strong>10. Limitation of Liability</strong><br />
The platform is not liable for personal disputes between tutors and tutees.<br />
The platform is not responsible for technical issues such as internet outages or device failures.</p>

<p><strong>11. Acceptance</strong><br />
By continuing to use the platform, you confirm that you accept these terms and conditions and will abide by them.</p>
                                                </div>
                                            </div>
                                            <button type="button" className="btn btn--primary" style={{ width: '100%' }} onClick={() => setShowTerms(false)}>Close and Continue</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="btn btn--primary" style={{ width: '100%', height: '50px', marginTop: '10px' }}>
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
