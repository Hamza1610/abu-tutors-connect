'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { walletApi } from '../../../services/api';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (reference) {
      verifyTransaction();
    } else {
      setStatus('error');
      setMessage('No transaction reference found.');
    }
  }, [reference]);

  const verifyTransaction = async () => {
    try {
      const response = await walletApi.verifyPayment(reference as string);
      setStatus('success');
      setMessage(`Successfully credited ₦${response.data.balance.toLocaleString()} to your wallet!`);
      
      // Redirect to wallet after 3 seconds
      setTimeout(() => {
        router.push('/wallet');
      }, 3000);
    } catch (err: any) {
      console.error('Verification error', err);
      setStatus('error');
      setMessage(err.response?.data?.message || 'Payment verification failed.');
    }
  };

  return (
    <main className="container text-center" style={{ padding: '100px 20px' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="card__body">
          {status === 'loading' && (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
              <h2>Verifying Payment</h2>
              <p>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '20px', color: 'var(--color-accent-green)' }}>✅</div>
              <h2 style={{ color: 'var(--color-accent-green)' }}>Payment Successful!</h2>
              <p>{message}</p>
              <p style={{ fontSize: '14px', marginTop: '20px', color: 'var(--color-text-muted)' }}>Redirecting you back to your wallet...</p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '20px', color: '#DC2626' }}>❌</div>
              <h2 style={{ color: '#DC2626' }}>Verification Failed</h2>
              <p>{message}</p>
              <button 
                className="btn btn--primary" 
                style={{ marginTop: '20px' }}
                onClick={() => router.push('/wallet')}
              >
                Go back to Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function WalletVerifyPage() {
  return (
    <Suspense fallback={<div className="container text-center" style={{ padding: '100px' }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
