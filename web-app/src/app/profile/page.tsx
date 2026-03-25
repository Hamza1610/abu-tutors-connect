'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, bankApi, walletApi, adminApi } from '../../services/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Multi-step Wizard State for Tutors
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Personal + Bank Details
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState('100L');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);

  // Transaction PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSet, setPinSet] = useState(false);

  // Step 2: Educational Background
  const [teachingLevel, setTeachingLevel] = useState('');
  const [courses, setCourses] = useState('');
  const [areaOfStrength, setAreaOfStrength] = useState('');
  const [about, setAbout] = useState('');
  
  // Step 3: Documents (Files)
  const [admissionLetter, setAdmissionLetter] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  // Step 4: Payment / Admin Settings
  const [wallet, setWallet] = useState<any>(null);
  const [adminSettings, setAdminSettings] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          userApi.getProfile(),
          adminApi.getSettings()
        ]);
        
        const data = profileRes.data;
        setUser(data);
        setAdminSettings(settingsRes.data);
        
        // Initialize fields if they exist
        setFaculty(data.faculty || '');
        setDepartment(data.department || '');
        setPhone(data.phone || '');
        setLevel(data.level || '100L');
        setTeachingLevel(data.teachingLevel || '');
        setCourses(data.courses?.join(', ') || '');
        setAreaOfStrength(data.areaOfStrength || '');
        setAbout(data.about || '');
        
        if (!data.isProfileComplete && data.role === 'tutor') {
            setCurrentStep((data.profileStep || 0) + 1);
        }
        
        if (data.bankDetails) {
            setBankCode(data.bankDetails.bankCode || '');
            setBankName(data.bankDetails.bankName || '');
            setAccountNumber(data.bankDetails.accountNumber || '');
            setAccountName(data.bankDetails.accountName || '');
        }
        setPinSet(!!data.transactionPin);

        // Fetch wallet if tutor
        if (data.role === 'tutor') {
            const walletRes = await walletApi.getWallet();
            setWallet(walletRes.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Failed to load profile. Please log in again.');
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    const fetchBanks = async () => {
        try {
            const res = await bankApi.getBanks();
            setBanks(res.data);
        } catch (err) {
            console.error('Failed to fetch banks');
        }
    };

    fetchProfileData();
    fetchBanks();
  }, [router]);

  const handleUpdateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const data = new FormData();
      data.append('step', currentStep.toString());

      if (currentStep === 1) {
          data.append('faculty', faculty);
          data.append('department', department);
          data.append('phone', phone);
          data.append('level', level);
          data.append('bankName', bankName);
          data.append('bankCode', bankCode);
          data.append('accountNumber', accountNumber);
          data.append('accountName', accountName);

          // Handle PIN setup
          if (!pinSet && pin) {
              if (pin !== confirmPin) {
                  setError('PINs do not match');
                  setSaving(false);
                  return;
              }
              // We'll set the PIN separately via walletApi since it requires password verification
              // For the wizard, we'll just allow setting it once. 
              // Better: Add a "PIN" step or just call setPin here if provided.
          }
      } else if (currentStep === 2) {
          data.append('teachingLevel', teachingLevel);
          data.append('courses', JSON.stringify(courses.split(',').map(c => c.trim())));
          data.append('areaOfStrength', areaOfStrength);
          data.append('about', about);
      } else if (currentStep === 3) {
          if (admissionLetter) data.append('admissionLetter', admissionLetter);
          if (transcript) data.append('transcript', transcript);
          if (profilePicture) data.append('profilePicture', profilePicture);
      }

      const res = await userApi.updateProfile(data);
      const updatedUser = res.data;
      setUser(updatedUser);
      
      if (currentStep < 4) {
          setCurrentStep(currentStep + 1);
      } else if (currentStep === 4) {
          alert('Profile completed! Awaiting admin approval.');
          window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile step');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyAccount = async () => {
      if (!accountNumber || !bankCode) return;
      setVerifyingAccount(true);
      setError('');
      try {
          const res = await bankApi.verifyAccount(accountNumber, bankCode);
          setAccountName(res.data.account_name);
      } catch (err: any) {
          setError('Could not verify account. Please check details.');
      } finally {
          setVerifyingAccount(false);
      }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
    }
    const currentPassword = prompt('For security, please enter your current password to set your PIN:');
    if (!currentPassword) return;

    setSaving(true);
    try {
        await walletApi.setTransactionPin({ pin, currentPassword });
        setPinSet(true);
        alert('Transaction PIN set successfully!');
    } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to set PIN');
    } finally {
        setSaving(false);
    }
  };

  const handleCapturePayment = async () => {
    setSaving(true);
    try {
        await walletApi.payRegistrationFromWallet();
        alert('Payment successful! Your profile is now submitted for approval.');
        window.location.reload();
    } catch (err: any) {
        setError(err.response?.data?.message || 'Payment failed. Ensure you have funded your wallet.');
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading profile...</div>;

  // Progress Bar for Wizard
  const progressPercent = (currentStep / 4) * 100;

  // If Tutor and Profile Not Complete, Show Wizard
  if (user.role === 'tutor' && !user.isProfileComplete) {
      return (
          <main className="container pb-space-8 pt-space-8">
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <div className="card__body">
                        <h2 className="section-header__title">Complete Your Tutor Profile</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Step {currentStep} of 4</p>
                        
                        {/* Progress Bar */}
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '30px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }}></div>
                        </div>

                        {error && <div className="alert alert--error" style={{ marginBottom: '20px', padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>{error}</div>}

                        <form onSubmit={handleUpdateStep}>
                            {currentStep === 1 && (
                                <>
                                    <h3 style={{ marginBottom: '15px' }}>Personal Details</h3>
                                    <div className="form-group">
                                        <label className="form-label">Faculty</label>
                                        <input type="text" className="form-input" value={faculty} onChange={e => setFaculty(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input type="text" className="form-input" value={department} onChange={e => setDepartment(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Level</label>
                                        <select className="form-input" value={level} onChange={e => setLevel(e.target.value)}>
                                            <option value="100L">100L</option>
                                            <option value="200L">200L</option>
                                            <option value="300L">300L</option>
                                            <option value="400L">400L</option>
                                            <option value="500L">500L</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
                                    </div>

                                    <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Payout Details (Bank Account)</h3>
                                    <div className="form-group">
                                        <label className="form-label">Bank</label>
                                        <select className="form-input" value={bankCode} onChange={e => {
                                            setBankCode(e.target.value);
                                            setBankName(banks.find(b => b.code === e.target.value)?.name || '');
                                        }} required>
                                            <option value="">Select Bank</option>
                                            {banks.map(bank => (
                                                <option key={bank.code} value={bank.code}>{bank.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Account Number</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="text" className="form-input" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required maxLength={10} />
                                            <button type="button" onClick={handleVerifyAccount} className="btn btn--secondary" disabled={verifyingAccount || accountNumber.length < 10}>
                                                {verifyingAccount ? '...' : 'Verify'}
                                            </button>
                                        </div>
                                    </div>
                                    {accountName && (
                                        <div className="form-group">
                                            <label className="form-label">Account Name</label>
                                            <p style={{ padding: '10px', background: '#f0fdf4', color: '#166534', borderRadius: '4px', fontSize: '14px' }}>{accountName}</p>
                                        </div>
                                    )}

                                    {!pinSet && (
                                        <div style={{ marginTop: '30px', padding: '20px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                                            <h3 style={{ marginBottom: '10px' }}>Security (Transaction PIN)</h3>
                                            <p style={{ fontSize: '12px', color: '#92400e', marginBottom: '15px' }}>Set a 4-6 digit numeric PIN for secure withdrawals.</p>
                                            <div className="form-group">
                                                <input type="password" placeholder="Enter PIN" className="form-input" value={pin} onChange={e => setPin(e.target.value)} maxLength={6} />
                                            </div>
                                            <div className="form-group">
                                                <input type="password" placeholder="Confirm PIN" className="form-input" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={6} />
                                            </div>
                                            <button type="button" onClick={handleSetPin} className="btn btn--primary" style={{ width: '100%', padding: '8px' }} disabled={!pin || pin !== confirmPin}>Set PIN</button>
                                        </div>
                                    )}
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <h3 style={{ marginBottom: '15px' }}>Educational / Teaching Background</h3>
                                    <div className="form-group">
                                        <label className="form-label">Level you can teach</label>
                                        <input type="text" className="form-input" value={teachingLevel} onChange={e => setTeachingLevel(e.target.value)} required placeholder="e.g. 100L, 200L" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Course Title & Code (Comma separated)</label>
                                        <input type="text" className="form-input" value={courses} onChange={e => setCourses(e.target.value)} required placeholder="e.g. MATH101, COEN201" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Area of Strength in the course</label>
                                        <input type="text" className="form-input" value={areaOfStrength} onChange={e => setAreaOfStrength(e.target.value)} required placeholder="e.g. Calculus, Logic Design" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">About Me (Bio)</label>
                                        <textarea 
                                            className="form-input" 
                                            value={about} 
                                            onChange={e => setAbout(e.target.value)} 
                                            required 
                                            placeholder="Introduce yourself to potential students..."
                                            style={{ minHeight: '100px', resize: 'vertical' }}
                                        ></textarea>
                                    </div>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <h3 style={{ marginBottom: '15px' }}>Verification Documents</h3>
                                    <div className="form-group">
                                        <label className="form-label">Admission Letter (PDF, Max 500KB)</label>
                                        <input type="file" accept="application/pdf" className="form-input" onChange={e => setAdmissionLetter(e.target.files?.[0] || null)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Result / Transcript (PDF, Max 500KB)</label>
                                        <input type="file" accept="application/pdf" className="form-input" onChange={e => setTranscript(e.target.files?.[0] || null)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Profile Picture (Image, Max 100KB)</label>
                                        <input type="file" accept="image/*" className="form-input" onChange={e => setProfilePicture(e.target.files?.[0] || null)} required />
                                    </div>
                                </>
                            )}

                            {currentStep === 4 && (
                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ marginBottom: '15px' }}>Registration {adminSettings?.isRegistrationFree ? 'Status' : 'Payment'}</h3>
                                    {adminSettings?.isRegistrationFree ? (
                                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                                            <p style={{ color: '#166534', fontWeight: 'bold' }}>Registration is Currently FREE!</p>
                                            <p style={{ fontSize: '13px', marginTop: '8px' }}>The administrative fee has been waived by the system admin.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p style={{ marginBottom: '20px' }}>Tutors must pay a registration fee to start using the system. This fee supports the platform administration.</p>
                                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                                                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>₦ {adminSettings?.registrationFee?.toLocaleString() || '5,000'}</p>
                                                <p style={{ fontSize: '12px', color: '#64748b' }}>One-time registration fee</p>
                                            </div>

                                            {wallet && (
                                                <div style={{ marginBottom: '20px', padding: '15px', background: wallet.balance >= (adminSettings?.registrationFee || 5000) ? '#f0fdf4' : '#fee2e2', borderRadius: '8px' }}>
                                                    <p style={{ fontSize: '14px' }}>Your Wallet Balance: <strong>₦ {wallet.balance.toLocaleString()}</strong></p>
                                                    {wallet.balance < (adminSettings?.registrationFee || 5000) && (
                                                        <button type="button" onClick={() => router.push('/wallet')} className="btn btn--secondary" style={{ marginTop: '10px', fontSize: '12px' }}>Fund Wallet to Pay</button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <button 
                                        type="button" 
                                        onClick={handleCapturePayment} 
                                        className="btn btn--primary" 
                                        style={{ width: '100%' }} 
                                        disabled={saving || (!adminSettings?.isRegistrationFree && wallet && wallet.balance < (adminSettings?.registrationFee || 5000))}
                                    >
                                        {saving ? 'Processing...' : adminSettings?.isRegistrationFree ? 'Complete Registration' : 'Pay Registration Fee'}
                                    </button>
                                </div>
                            )}

                            {currentStep < 4 && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                    {currentStep > 1 && (
                                        <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="btn btn--secondary" style={{ flex: 1 }}>Back</button>
                                    )}
                                    <button type="submit" className="btn btn--primary" style={{ flex: 2 }} disabled={saving}>
                                        {saving ? 'Saving...' : 'Next Step'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                  </div>
              </div>
          </main>
      );
  }

  // Final Profile View (Tutee or Verified Tutor)
  return (
    <main className="container pb-space-8 pt-space-8">
      <div style={{ marginTop: 'var(--space-6)', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="card">
          <div className="card__body" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto var(--space-4)' }}>
              {user.documents?.profilePicture ? (
                <img 
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}${user.documents.profilePicture}`} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ 
                  width: '100%', height: '100%', borderRadius: '50%', 
                  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', fontWeight: 'bold', border: '2px solid var(--color-primary)'
                }}>
                  {user.name.charAt(0)}
                </div>
              )}
              {user.isApproved && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--success-green)', border: '2px solid white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                  </div>
              )}
            </div>
            
            <h1 className="page-header__title" style={{ marginBottom: 'var(--space-1)' }}>{user.name}</h1>
            <p className="tutor-card__subject">{user.role === 'tutee' ? 'Student' : 'Tutor'} Profile · {user.registrationNumber || 'No ID'}</p>
            
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                <span className={`tutor-card__badge ${user.role === 'tutee' ? 'tutor-card__badge--green' : 'tutor-card__badge--orange'}`}>
                  {user.isApproved ? 'Newbie Tutor' : user.role === 'verified_tutor' ? 'Verified Tutor' : user.role === 'tutor' ? 'Tutor' : 'Tutee'}
                </span>
                {!user.isApproved && (user.role === 'tutor' || user.role === 'verified_tutor') && (
                    <span className="tutor-card__badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>Pending Approval</span>
                )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card__body">
            <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Account Information</h2>
            <div className="form-group">
                <label className="form-label">Full Name</label>
                <p className="form-input" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>{user.name}</p>
            </div>
            <div className="form-group">
                <label className="form-label">Email</label>
                <p className="form-input" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>{user.email}</p>
            </div>
            <div className="form-group">
                <label className="form-label">Faculty / Department</label>
                <p className="form-input" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>{user.faculty} / {user.department}</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
          <button onClick={() => router.push('/wallet')} className="btn btn--secondary">Wallet</button>
          <button onClick={() => router.push('/my-sessions')} className="btn btn--secondary">My Sessions</button>
        </div>
      </div>
    </main>
  );
}
