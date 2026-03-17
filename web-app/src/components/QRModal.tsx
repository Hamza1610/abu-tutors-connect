'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'generate' | 'scan';
  qrData?: string;
  onScanSuccess?: (decodedText: string) => void;
  title: string;
}

export default function QRModal({ isOpen, onClose, mode, qrData, onScanSuccess, title }: QRModalProps) {
  const [scannerId] = useState(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isOpen && mode === 'scan') {
      // Delay scanner initialization to ensure DOM element is ready
      setTimeout(() => {
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
          (error) => {
            // Silence common scanning errors
          }
        );
      }, 500);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [isOpen, mode, scannerId, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
        <div className="card__body" style={{ textAlign: 'center' }}>
          <button 
            onClick={onClose} 
            style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ×
          </button>
          
          <h2 className="section-header__title" style={{ marginBottom: '20px' }}>{title}</h2>
          
          {mode === 'generate' && qrData && (
            <div style={{ padding: '20px', background: 'white', display: 'inline-block', borderRadius: '10px' }}>
              <QRCodeSVG value={qrData} size={256} level="H" />
              <p style={{ marginTop: '20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Show this QR code to your partner to verify the session.
              </p>
            </div>
          )}
          
          {mode === 'scan' && (
            <div>
              <div id={scannerId} style={{ width: '100%' }}></div>
              <p style={{ marginTop: '20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Please grant camera access and scan your partner's QR code.
              </p>
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <button className="btn btn--outline btn--block" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
