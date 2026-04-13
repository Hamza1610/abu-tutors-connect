'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { walletApi, userApi } from '../../services/api';

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchWalletAndUser();
  }, []);

  const fetchWalletAndUser = async () => {
    try {
      const [walletRes, userRes] = await Promise.all([
        walletApi.getWallet(),
        userApi.getProfile()
      ]);
      setWallet(walletRes.data);
      setUser(userRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async () => {
    const amountStr = prompt('Enter amount to fund (₦):', '1000');
    if (!amountStr || isNaN(Number(amountStr))) return;
    const amount = Number(amountStr);
    if (amount < 100) {
      alert('Minimum funding amount is ₦100');
      return;
    }

    setFunding(true);
    try {
      const response = await walletApi.initializePayment(amount);
      const { authorization_url } = response.data;
      
      if (authorization_url) {
        window.location.href = authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err: any) {
      console.error('Funding failed', err);
      alert(err.response?.data?.message || 'Funding failed. Please try again.');
    } finally {
      setFunding(false);
    }
  };

  const handleWithdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }
    
    if (amount > wallet.balance) {
      setFormError('Insufficient available balance (Escrow funds are locked)');
      return;
    }

    if (!withdrawPin) {
      setFormError('Transaction PIN is required');
      return;
    }
    
    if (!user.bankDetails?.accountNumber) {
      setFormError('Please update your bank details in your profile first');
      return;
    }

    setWithdrawing(true);
    try {
      await walletApi.withdrawFunds({ amount, pin: withdrawPin });
      alert('Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawPin('');
      fetchWalletAndUser(); // Refresh balance
    } catch (err: any) {
      console.error('Withdrawal failed', err);
      setFormError(err.response?.data?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <main className="container pt-space-8 text-center text-white">Loading wallet...</main>;

  const userRole = user?.role || 'tutee';

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <h1 className="page-header__title">Wallet</h1>
        <p className="page-header__subtitle">Manage your balance and transactions</p>
      </div>

      {!user?.transactionPin && (user?.role === 'tutor' || user?.role === 'admin') && (
        <div className="alert alert--warning" style={{ marginBottom: 'var(--space-4)', padding: '15px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px' }}><strong>Security Action Required:</strong> Please set your transaction PIN in your profile to enable withdrawals.</p>
          <button onClick={() => router.push('/profile')} className="btn btn--secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>Go to Profile</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)', color: 'white' }}>
        <div className="card__body">
          <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>Available Balance</p>
          <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', margin: '0 0 var(--space-4)' }}>
            ₦{wallet?.balance?.toLocaleString() || '0'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn" 
              style={{ background: 'white', color: 'var(--color-primary)' }}
              onClick={handleFundWallet}
              disabled={funding}
            >
              {funding ? 'Processing...' : 'Fund Wallet'}
            </button>
            {wallet?.balance > 0 && (userRole === 'tutor' || userRole === 'admin' || userRole === 'verified_tutor') && (
              <button 
                className="btn btn--outline" 
                style={{ borderColor: 'white', color: 'white', background: 'transparent' }}
                onClick={() => setShowWithdrawModal(true)}
              >
                Withdraw Funds
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)' }}>Transaction History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {wallet?.transactions?.length > 0 ? (
                wallet.transactions.slice().reverse().map((tx: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 'var(--font-weight-medium)', margin: 0, color: 'var(--color-text)' }}>{tx.description}</p>
                            <p className="tutor-card__subject" style={{ margin: 'var(--space-1) 0 0' }}>
                                {new Date(tx.date).toLocaleDateString()} · {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <span className="tutor-card__price" style={{ color: tx.type === 'credit' ? 'var(--color-accent-green)' : '#DC2626' }}>
                            {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                        </span>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', position: 'relative', borderRadius: '16px' }}>
            <div className="card__body" style={{ padding: 'var(--space-6)' }}>
              <button 
                onClick={() => setShowWithdrawModal(false)} 
                style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748B' }}
              >
                ×
              </button>
              
              <h2 className="section-header__title" style={{ marginBottom: 'var(--space-6)' }}>Withdraw Funds</h2>
              
              <form onSubmit={handleWithdrawFunds} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {user?.bankDetails ? (
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px' }}>Withdraw to:</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{user.bankDetails.bankName}</p>
                    <p style={{ fontSize: '14px', margin: 0 }}>{user.bankDetails.accountNumber}</p>
                    <button type="button" onClick={() => router.push('/profile')} style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: 'none', padding: 0, marginTop: '8px', cursor: 'pointer' }}>Change Bank Details</button>
                  </div>
                ) : (
                  <div className="alert alert--error" style={{ fontSize: '13px' }}>
                    No bank details found. Please update your profile first.
                  </div>
                )}
                
                <div>
                  <label className="form-label" style={{ color: 'var(--color-text)' }}>Amount (₦)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={wallet?.balance}
                    required
                  />
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Available: ₦{wallet?.balance?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="form-label" style={{ color: 'var(--color-text)' }}>Transaction PIN</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter 4-6 digit PIN"
                    maxLength={6}
                    value={withdrawPin}
                    onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                
                {formError && (
                  <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{formError}</p>
                )}
                
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    type="submit" 
                    className="btn btn--primary btn--block"
                    disabled={withdrawing}
                  >
                    {withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn--outline btn--block" 
                    onClick={() => setShowWithdrawModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
