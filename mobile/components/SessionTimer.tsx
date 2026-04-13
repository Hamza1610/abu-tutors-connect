import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../constants/Colors';
import { sessionApi } from '../services/api';

interface SessionTimerProps {
  session: any;
  onSync?: (id: string, data: any) => void;
}

export default function SessionTimer({ session, onSync }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('00:00');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (session.status !== 'active' || !session.actualStartTime) return;

    const updateTimer = () => {
      const startTime = new Date(session.actualStartTime).getTime();
      const durationMs = 60 * 60 * 1000; // 1 hour default
      const endTime = startTime + durationMs;
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        return;
      }

      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    const timerId = setInterval(updateTimer, 1000);
    updateTimer();

    // Background Sync every 30 seconds
    const syncId = setInterval(async () => {
      try {
        const res = await sessionApi.getSessions(); // or specific sync endpoint
        // The backend session sync endpoint: POST /sessions/:id/sync
        // We'll use the sync endpoint if it exists in sessionApi
        if ((sessionApi as any).syncSession) {
           const syncRes = await (sessionApi as any).syncSession(session._id, new Date().toISOString());
           if (onSync) onSync(session._id, syncRes.data);
        }
      } catch (err) {
        console.error("Sync failed", err);
      }
    }, 30000);

    return () => {
      clearInterval(timerId);
      clearInterval(syncId);
    };
  }, [session, onSync]);

  return (
    <View style={[styles.container, isExpired && styles.containerExpired]}>
      <Text style={[styles.statusText, isExpired && styles.statusTextExpired]}>
        {isExpired ? 'SESSION TIME EXPIRED' : 'ACTIVE SESSION'}
      </Text>
      <Text style={[styles.timerText, isExpired && styles.timerTextExpired]}>
        {timeLeft}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    marginVertical: 8,
  },
  containerExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#16A34A',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusTextExpired: {
    color: '#EF4444',
  },
  timerText: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#15803D',
  },
  timerTextExpired: {
    color: '#B91C1C',
  },
});
