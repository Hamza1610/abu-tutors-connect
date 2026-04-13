import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { sessionApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import VerificationModal from '../../components/VerificationModal';
import SessionTimer from '../../components/SessionTimer';

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  active: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.danger,
};

export default function SessionsScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const isTutor = user?.role === 'tutor' || user?.role === 'verified_tutor';

  // Verification Modal State
  const [verifying, setVerifying] = useState({
    isOpen: false,
    mode: 'generate' as 'generate' | 'scan',
    qrData: '',
    pin: '',
    title: '',
    sessionId: '',
    step: 'start' as 'start' | 'complete'
  });

  const handleSyncUpdate = (id: string, data: any) => {
    if (data.isComplete) {
      fetchSessions();
    }
  };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await sessionApi.getSessions();
      setSessions(res.data);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Session', 'Are you sure you want to cancel this session?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Session', style: 'destructive',
        onPress: async () => {
          setCancellingId(id);
          try {
            await sessionApi.cancelSession(id);
            await fetchSessions();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Could not cancel session.');
          } finally {
            setCancellingId(null);
          }
        }
      }
    ]);
  };

  const openVerifyModal = (session: any, step: 'start' | 'complete') => {
    setVerifying({
      isOpen: true,
      mode: 'generate', // Tutee always generates on mobile context currently
      qrData: step === 'start' ? session.startQRCodeData : session.completionQRCodeData,
      pin: step === 'start' ? session.startPIN : session.completionPIN,
      title: `${step === 'start' ? 'Start' : 'Finish'} Session Verification`,
      sessionId: session._id,
      step: step
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: Spacing.xxl }} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: Spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyText}>Book a session with a tutor to get started.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const otherParty = isTutor ? item.tutee : item.tutor;
            const canCancel = item.status === 'pending' || item.status === 'active';
            return (
              <View style={styles.sessionCard}>
                <View style={styles.sessionTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionTopic}>{item.topic || 'Tutoring Session'}</Text>
                    <Text style={styles.sessionWith}>
                      {isTutor ? 'Student' : 'Tutor'}: {otherParty?.name || '—'}
                    </Text>
                    {item.scheduledDate && (
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.metaText}>
                          {new Date(item.scheduledDate).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                        </Text>
                        <Ionicons name="time-outline" size={13} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                        <Text style={styles.metaText}>{item.durationMinutes || 60} min</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {item.status === 'active' && (
                  <SessionTimer session={item} onSync={handleSyncUpdate} />
                )}

                {/* Student actions */}
                {!isTutor && (
                  <View style={styles.actionRow}>
                    {item.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => openVerifyModal(item, 'start')}
                      >
                        <Text style={styles.actionBtnText}>Show Start QR</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'active' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                        onPress={() => openVerifyModal(item, 'complete')}
                      >
                        <Text style={styles.actionBtnText}>Show Finish QR</Text>
                      </TouchableOpacity>
                    )}
                    {canCancel && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.danger + '11', borderWidth: 1, borderColor: Colors.danger + '44' }]}
                        onPress={() => handleCancel(item._id)}
                        disabled={cancellingId === item._id}
                      >
                        {cancellingId === item._id
                          ? <ActivityIndicator color={Colors.danger} size="small" />
                          : <Text style={[styles.actionBtnText, { color: Colors.danger }]}>✕ Cancel</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <VerificationModal
        isOpen={verifying.isOpen}
        onClose={() => setVerifying({ ...verifying, isOpen: false })}
        mode={verifying.mode}
        qrData={verifying.qrData}
        pin={verifying.pin}
        title={verifying.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52, padding: Spacing.lg, paddingBottom: Spacing.xl,
  },
  title: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800' },
  sessionCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessionTopic: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  sessionWith: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: FontSize.xs, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.xs },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
