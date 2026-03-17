'use client';

import React, { useState, useEffect } from 'react';
import { walletApi } from '../../services/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await walletApi.getWallet();
      setWallet(response.data);
    } catch (err) {
      console.error('Failed to fetch wallet', err);
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
        // Redirect to Paystack Checkout
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

  if (loading) return <main className="container pt-space-8 text-center">Loading wallet...</main>;

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)' }}>
        <h1 className="page-header__title">Wallet</h1>
        <p className="page-header__subtitle">Manage your balance and transactions</p>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)', color: 'white' }}>
        <div className="card__body">
          <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>Available Balance</p>
          <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', margin: '0 0 var(--space-4)' }}>
            ₦{wallet?.balance?.toLocaleString() || '0'}
          </p>
          <button 
            className="btn" 
            style={{ background: 'white', color: 'var(--color-primary)' }}
            onClick={handleFundWallet}
            disabled={funding}
          >
            {funding ? 'Processing...' : 'Fund Wallet'}
          </button>
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
                            <p style={{ fontWeight: 'var(--font-weight-medium)', margin: 0 }}>{tx.description}</p>
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
    </main>
  );
}
