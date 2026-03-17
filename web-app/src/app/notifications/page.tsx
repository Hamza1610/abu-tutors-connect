'use client';

import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../services/api';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleDelete = async (id: string) => {
      try {
          await notificationApi.deleteNotification(id);
          setNotifications(notifications.filter(n => n._id !== id));
      } catch (err) {
          console.error('Failed to delete', err);
      }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    return n.type.toLowerCase() === filter.toLowerCase();
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'session': return '✓';
      case 'payment': return '💰';
      case 'message': return '💬';
      default: return '🔔';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'session': return 'var(--color-primary-light)';
      case 'payment': return 'var(--color-accent-green)';
      case 'message': return 'var(--color-secondary-light)';
      default: return 'var(--color-bg)';
    }
  };

  if (loading) return <main className="container pt-space-8 text-center">Loading notifications...</main>;

  return (
    <main className="container pb-space-8 pt-space-8">
      <div className="page-header" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h1 className="page-header__title">Notifications</h1>
        <p className="page-header__subtitle">Stay updated on your sessions and messages</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        {['All', 'Sessions', 'Messages', 'Payments'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`course-tag ${filter === f ? 'course-tag--active' : ''}`}
            style={{ cursor: 'pointer', border: 'none', background: filter === f ? 'var(--color-primary)' : 'var(--color-bg)' }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n: any) => (
            <div key={n._id} className="card" style={{ opacity: n.read ? 0.7 : 1 }}>
              <div className="card__body" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '48px', 
                    height: '48px', 
                    background: getBgColor(n.type), 
                    borderRadius: '50%', 
                    fontSize: '24px' 
                  }}>
                    {getIcon(n.type)}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="tutor-card__name" style={{ margin: '0 0 var(--space-1)' }}>{n.title}</h3>
                  <p className="tutor-card__subject" style={{ margin: 0 }}>{n.message}</p>
                  <p className="tutor-card__subject" style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {!n.read && (
                        <button className="btn btn--secondary btn--sm" onClick={() => handleMarkAsRead(n._id)}>Read</button>
                    )}
                    <button className="btn btn--outline btn--sm" onClick={() => handleDelete(n._id)}>Dismiss</button>
                    {n.link && <Link href={n.link} className="btn btn--primary btn--sm">View</Link>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted">You have no {filter === 'All' ? '' : filter.toLowerCase()} notifications.</p>
        )}
      </div>
    </main>
  );
}
