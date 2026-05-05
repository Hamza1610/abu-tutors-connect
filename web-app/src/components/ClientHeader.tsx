'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { notificationApi, userApi } from '../services/api';
import { getImageUrl } from '../utils/image';
import { getSocket, disconnectSocket } from '../utils/socket';

export default function ClientHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        setIsLoggedIn(true);
        fetchUserAndNotifications();
    }

    // Listen for profile updates from other components
    const handleProfileUpdate = () => {
        console.log('Header detected profile update, refreshing...');
        fetchUserAndNotifications();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
        window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [pathname]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const fetchUserAndNotifications = async () => {
      try {
          const [userRes, notifRes] = await Promise.all([
              userApi.getProfile(),
              notificationApi.getNotifications()
          ]);
          setUser(userRes.data);
          setUnreadCount(notifRes.data.filter((n: any) => !n.read).length);
          
          // NEW: Initialize Socket
          getSocket(userRes.data._id);
      } catch (err) {
          console.error('Header fetch error', err);
      }
  };

  const handleLogout = () => {
      disconnectSocket(); // NEW
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      router.push('/login');
  };

  const NavLinks = () => (
    <>
      {(!isLoggedIn || user?.role !== 'admin') && (
        <>
          <Link href="/" className={pathname === '/' ? 'nav-link--active' : ''}>Home</Link>
          <Link href="/tutors" className={pathname === '/tutors' ? 'nav-link--active' : ''}>Find Tutors</Link>
          <Link href="/ai-match" className={pathname === '/ai-match' ? 'nav-link--active' : ''}>AI Match</Link>
        </>
      )}
      {isLoggedIn && user?.role === 'admin' && (
          <Link href="/admin" className={pathname === '/admin' ? 'nav-link--active' : ''}>Admin Panel</Link>
      )}
      {isLoggedIn && user?.role !== 'tutee' && user?.role !== 'admin' && (
          <Link href="/tutor-dashboard" className={pathname === '/tutor-dashboard' ? 'nav-link--active' : ''}>Tutor Dash</Link>
      )}
      {isLoggedIn && user?.role !== 'admin' && (
          <Link href="/my-sessions" className={pathname === '/my-sessions' ? 'nav-link--active' : ''}>Sessions</Link>
      )}
    </>
  );

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner container">
          <Link href="/" className="logo">
            <img src="/logo.png" alt="ABUTutors" style={{ height: '32px', width: 'auto' }} />
          </Link>

          <nav className="app-header__nav">
            <NavLinks />
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
                                width: '10px', 
                                height: '10px' 
                            }} 
                      />
                  )}
                </Link>
                <Link href="/wallet" className="icon-btn hidden-mobile" aria-label="Wallet">💰</Link>
                <Link href="/profile" className={`icon-btn ${pathname === '/profile' ? 'nav-link--active' : ''}`} aria-label="Profile" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                  {user?.documents?.profilePicture ? (
                      <img 
                          src={getImageUrl(user.documents.profilePicture)} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                  ) : (
                      <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                  )}
                </Link>
                <button onClick={handleLogout} className="btn btn--outline btn--sm hidden-mobile" style={{ padding: '4px 10px', fontSize: '12px' }}>Logout</button>
                <button onClick={() => setIsMenuOpen(true)} className="menu-toggle" aria-label="Open Menu">
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn--outline btn--sm" style={{ padding: '6px 12px', fontSize: '13px' }}>Login</Link>
                <Link href="/register" className="btn btn--primary btn--sm" style={{ padding: '6px 12px', fontSize: '13px' }}>Sign Up</Link>
                <button onClick={() => setIsMenuOpen(true)} className="menu-toggle" aria-label="Open Menu">
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${isMenuOpen ? 'mobile-menu-overlay--open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Mobile Menu Side Panel */}
      <div className={`mobile-menu ${isMenuOpen ? 'mobile-menu--open' : ''}`}>
        <button className="mobile-menu__close" onClick={() => setIsMenuOpen(false)}>✕</button>
        <nav className="mobile-menu__nav">
          <NavLinks />
          {isLoggedIn && (
            <>
              <Link href="/wallet">Wallet</Link>
              <Link href="/profile">My Profile</Link>
              <Link href="/notifications">Notifications ({unreadCount})</Link>
            </>
          )}
        </nav>
        <div className="mobile-menu__footer">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="btn btn--outline btn--block">Logout</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/login" className="btn btn--outline btn--block">Login</Link>
              <Link href="/register" className="btn btn--primary btn--block">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
