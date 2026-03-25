'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'generate' | 'scan';
  qrData?: string;
  pin?: string;
  onScanSuccess?: (decodedText: string) => void;
  onPinSubmit?: (pin: string) => void;
  title: string;
}

export default function QRModal({ isOpen, onClose, mode, qrData, pin, onScanSuccess, onPinSubmit, title }: QRModalProps) {
  const [scannerId] = useState(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);
  const [inputPin, setInputPin] = useState('');

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isOpen && mode === 'scan') {
      setTimeout(() => {
        const scannerElement = document.getElementById(scannerId);
        if (scannerElement) {
          scanner = new Html5QrcodeScanner(
            scannerId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );

          scanner.render(
            (decodedText) => {
              if (onScanSuccess) {
                onScanSuccess(decodedText);
                scanner?.clear();
                onClose();
              }
            },
            () => {}
          );
        }
      }, 500);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [isOpen, mode, scannerId, onScanSuccess, onClose]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onPinSubmit && inputPin.length === 6) {
      onPinSubmit(inputPin);
      setInputPin('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', position: 'relative', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div className="card__body" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <button 
            onClick={onClose} 
            style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748B' }}
          >
            ×
          </button>
          
          <h2 className="section-header__title" style={{ marginBottom: 'var(--space-4)', fontSize: '1.25rem' }}>{title}</h2>
          
          {mode === 'generate' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              {qrData && (
                <div style={{ padding: '16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                  <QRCodeSVG value={qrData} size={200} level="H" />
                </div>
              )}
              
              {pin && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748B' }}>OR USE FALLBACK PIN</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {pin.split('').map((char, index) => (
                      <div key={index} style={{ width: '40px', height: '48px', border: '2px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p style={{ marginTop: 'var(--space-4)', color: '#64748B', fontSize: '14px' }}>
                Ask your tutor to scan this QR code or enter the 6-digit PIN to verify.
              </p>
            </div>
          )}
          
          {mode === 'scan' && (
            <div>
              <div id={scannerId} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
              <p style={{ margin: 'var(--space-4) 0 var(--space-2) 0', color: '#64748B', fontSize: '14px' }}>
                Scan the student's QR code OR enter their PIN below
              </p>
              
              <form onSubmit={handlePinSubmit} style={{ marginTop: 'var(--space-4)' }}>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Enter 6-digit PIN"
                  className="form-input"
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px', fontWeight: 'bold' }}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                />
                <button 
                  type="submit" 
                  className="btn btn--primary btn--block" 
                  style={{ marginTop: 'var(--space-4)' }}
                  disabled={inputPin.length !== 6}
                >
                  Verify via PIN
                </button>
              </form>
            </div>
          )}
          
          <div style={{ marginTop: 'var(--space-6)' }}>
            <button className="btn btn--outline btn--block" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
