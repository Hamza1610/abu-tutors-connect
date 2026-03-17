'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { notificationApi, userApi } from '../services/api';

export default function ClientHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        setIsLoggedIn(true);
        fetchUserAndNotifications();
    }
  }, [pathname]);

  const fetchUserAndNotifications = async () => {
      try {
          const [userRes, notifRes] = await Promise.all([
              userApi.getProfile(),
              notificationApi.getNotifications()
          ]);
          setUser(userRes.data);
          setUnreadCount(notifRes.data.filter((n: any) => !n.read).length);
      } catch (err) {
          console.error('Header fetch error', err);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      router.push('/login');
  };

  return (
    <header className="app-header">
      <div className="app-header__inner container">
        <Link href="/" className="logo">
          <span className="logo__icon">A</span>
          <span>ABUTutors</span>
        </Link>
        <nav className="app-header__nav">
          <Link href="/">Home</Link>
          <Link href="/tutors">Find Tutors</Link>
          <Link href="/ai-match">AI Match</Link>
          {isLoggedIn && user?.role !== 'tutee' && (
              <Link href="/tutor-dashboard">Tutor Dash</Link>
          )}
          {isLoggedIn && (
              <Link href="/my-sessions">Sessions</Link>
          )}
        </nav>
        <div className="app-header__actions">
          {isLoggedIn ? (
            <>
              <Link href="/notifications" className="icon-btn" aria-label="Notifications" style={{ position: 'relative' }}>
                <span>🔔</span>
                {unreadCount > 0 && (
                    <span className="icon-btn__badge" 
                          style={{ 
                              position: 'absolute', 
                              top: '-2px', 
                              right: '-2px', 
                              background: '#DC2626', 
                              borderRadius: '50%', 
                              width: '12px', 
                              height: '12px' 
                          }} 
                    />
                )}
              </Link>
              <Link href="/wallet" className="icon-btn" aria-label="Wallet">💰</Link>
              <Link href="/profile" className="icon-btn" aria-label="Profile">👤</Link>
              <button onClick={handleLogout} className="btn btn--outline btn--sm">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn--outline" style={{ padding: '8px 16px', fontSize: '14px' }}>Login</Link>
              <Link href="/register" className="btn btn--primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
