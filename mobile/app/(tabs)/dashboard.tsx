import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { sessionApi, walletApi, userApi } from '../../services/api';
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

export default function TutorDashboardScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Verification Modal State
  const [verifying, setVerifying] = useState({
    isOpen: false,
    mode: 'scan' as 'generate' | 'scan',
    title: '',
    sessionId: '',
    step: 'start' as 'start' | 'complete'
  });
  const [activeTab, setActiveTab] = useState<'sessions' | 'availability'>('sessions');
  const [availability, setAvailability] = useState<any[]>([]);
  const [newDay, setNewDay] = useState('Monday');
  const [newSlot, setNewSlot] = useState('09:00');
  const [saving, setSaving] = useState(false);

  const handleSyncUpdate = (id: string, data: any) => {
    if (data.isComplete) {
      fetchData();
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [sessRes, walletRes, profileRes] = await Promise.all([
        sessionApi.getSessions(),
        walletApi.getWallet(),
        userApi.getProfile()
      ]);
      setSessions(sessRes.data);
      setWallet(walletRes.data);
      setAvailability(profileRes.data.availability || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerification = async (data: string) => {
    setLoading(true);
    try {
      const { sessionId, step } = verifying;
      if (step === 'start') {
        await sessionApi.startSession(sessionId, data);
      } else {
        await sessionApi.completeSession(sessionId, data);
      }
      Alert.alert('Success', `Session ${step === 'start' ? 'started' : 'completed'}!`);
      setVerifying({ ...verifying, isOpen: false });
      fetchData();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid QR Code or PIN.');
    } finally {
      setLoading(false);
    }
  };

  const doAction = async (
    id: string,
    action: 'start' | 'complete' | 'cancel' | 'no-show',
    label: string
  ) => {
    if (action === 'start' || action === 'complete') {
      setVerifying({
        isOpen: true,
        mode: 'scan',
        title: `${action === 'start' ? 'Start' : 'Finish'} Session Verification`,
        sessionId: id,
        step: action
      });
      return;
    }

    Alert.alert(`${label}?`, `Are you sure you want to ${label.toLowerCase()} this session?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, style: action === 'cancel' ? 'destructive' : 'default',
        onPress: async () => {
          setActionId(id);
          try {
            switch (action) {
              case 'cancel': await sessionApi.cancelSession(id); break;
              case 'no-show': await sessionApi.reportNoShow(id); break;
            }
            await fetchData();
          } catch (err: any) {
            Alert.alert('Action Failed', err.response?.data?.message || 'Please try again.');
          } finally {
            setActionId(null);
          }
        }
      }
    ]);
  };
  
  const addSlot = () => {
    const existingDay = availability.find(a => a.day === newDay);
    if (existingDay) {
      if (existingDay.slots.includes(newSlot)) return;
      const updated = availability.map(a => a.day === newDay ? { ...a, slots: [...a.slots, newSlot].sort() } : a);
      setAvailability(updated);
    } else {
      setAvailability([...availability, { day: newDay, slots: [newSlot] }]);
    }
  };

  const removeSlot = (day: string, slot: string) => {
    const updated = availability.map(a => {
      if (a.day === day) {
        return { ...a, slots: a.slots.filter((s: string) => s !== slot) };
      }
      return a;
    }).filter(a => a.slots.length > 0);
    setAvailability(updated);
  };

  const handleUpdateAvailability = async () => {
    setSaving(true);
    try {
      await userApi.updateProfileData({ availability });
      Alert.alert('Success', 'Availability matrix updated!');
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pending = sessions.filter(s => s.status === 'pending');
  const active = sessions.filter(s => s.status === 'active');
  const completed = sessions.filter(s => s.status === 'completed');
  const balance = wallet?.balance ?? 0;

  if (loading && !verifying.isOpen) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tutor Dashboard</Text>
            <Text style={styles.headerSub}>Hello, {user?.name?.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity style={styles.walletChip} onPress={() => router.push('/wallet')}>
            <Ionicons name="wallet-outline" size={16} color={Colors.primary} />
            <Text style={styles.walletBalance}>₦{balance.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sessions' && styles.activeTab]} 
            onPress={() => setActiveTab('sessions')}
          >
            <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'availability' && styles.activeTab]} 
            onPress={() => setActiveTab('availability')}
          >
            <Text style={[styles.tabText, activeTab === 'availability' && styles.activeTabText]}>Availability</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'sessions' ? (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatCard icon="time-outline" label="Pending" value={pending.length} color={Colors.warning} />
              <StatCard icon="play-circle-outline" label="Active" value={active.length} color={Colors.primary} />
              <StatCard icon="checkmark-circle-outline" label="Completed" value={completed.length} color={Colors.success} />
            </View>

            {/* Pending Sessions (require action) */}
            {pending.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏳ Awaiting Action</Text>
                {pending.map(s => (
                  <SessionCard
                    key={s._id}
                    session={s}
                    role="tutor"
                    actionId={actionId}
                    onStart={() => doAction(s._id, 'start', 'Start Session')}
                    onCancel={() => doAction(s._id, 'cancel', 'Cancel Session')}
                  />
                ))}
              </View>
            )}

            {/* Active Sessions */}
            {active.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🟢 Active Sessions</Text>
                {active.map(s => (
                  <SessionCard
                    key={s._id}
                    session={s}
                    role="tutor"
                    actionId={actionId}
                    onComplete={() => doAction(s._id, 'complete', 'Complete Session')}
                    onNoShow={() => doAction(s._id, 'no-show', 'Report No-Show')}
                    onCancel={() => doAction(s._id, 'cancel', 'Cancel Session')}
                  />
                ))}
                {active.map(s => (
                  <View key={`timer-${s._id}`} style={{ paddingHorizontal: 16 }}>
                    <SessionTimer session={s} onSync={handleSyncUpdate} />
                  </View>
                ))}
              </View>
            )}

            {/* Recent Completed */}
            {completed.length > 0 && (active.length < 3) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Completed</Text>
                {completed.slice(0, 3).map(s => (
                  <SessionCard key={s._id} session={s} role="tutor" actionId={actionId} />
                ))}
              </View>
            )}

            {sessions.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No sessions yet</Text>
                <Text style={styles.emptyText}>Students will book sessions with you and they'll appear here.</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.availCard}>
              <Text style={styles.availTitle}>Weekly Availability</Text>
              <Text style={styles.availSub}>Set the days and 1-hour slots you are available to teach.</Text>
              
              <View style={styles.addSlotRow}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.fieldLabel}>Day</Text>
                  <View style={styles.pickerFake}>
                    <Text style={styles.pickerText}>{newDay}</Text>
                    {/* In a real app we'd use a Modal Picker, for now we flip through days or use a simple list */}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <TouchableOpacity 
                        key={d} 
                        style={[styles.dayChip, newDay === d && styles.dayChipActive]}
                        onPress={() => setNewDay(d)}
                      >
                        <Text style={[styles.dayChipText, newDay === d && styles.dayChipTextActive]}>{d.slice(0, 3)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Start Time (HH:MM)</Text>
                  <TextInput 
                    style={styles.timeInput}
                    value={newSlot}
                    onChangeText={setNewSlot}
                    placeholder="09:00"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <TouchableOpacity style={styles.addBtn} onPress={addSlot}>
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.slotsList}>
                {availability.map((avail, idx) => (
                  <View key={idx} style={styles.dayGroup}>
                    <Text style={styles.dayGroupTitle}>{avail.day}</Text>
                    <View style={styles.slotsGrid}>
                      {avail.slots.map((slot: string) => (
                        <View key={slot} style={styles.slotTag}>
                          <Text style={styles.slotTagText}>{slot}</Text>
                          <TouchableOpacity onPress={() => removeSlot(avail.day, slot)}>
                            <Ionicons name="close-circle" size={16} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                {availability.length === 0 && (
                  <Text style={styles.emptySlotsText}>No availability slots added yet.</Text>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleUpdateAvailability}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Availability Matrix</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <VerificationModal
        isOpen={verifying.isOpen}
        onClose={() => setVerifying({ ...verifying, isOpen: false })}
        mode={verifying.mode}
        title={verifying.title}
        onScanSuccess={handleVerification}
        onPinSubmit={handleVerification}
      />
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SessionCard({
  session, role, actionId, onStart, onComplete, onCancel, onNoShow
}: {
  session: any; role: string; actionId: string | null;
  onStart?: () => void; onComplete?: () => void;
  onCancel?: () => void; onNoShow?: () => void;
}) {
  const isActing = actionId === session._id;
  const otherParty = role === 'tutor' ? session.tutee : session.tutor;

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionTopic}>{session.topic || 'Tutoring Session'}</Text>
          <Text style={styles.sessionWith}>{role === 'tutor' ? 'Student: ' : 'Tutor: '}{otherParty?.name || '—'}</Text>
          {session.scheduledDate && (
            <Text style={styles.sessionDate}>
              📅 {new Date(session.scheduledDate).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
              {' · '}{session.durationMinutes || 60} min
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[session.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[session.status] }]}>
            {session.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      {(onStart || onComplete || onCancel || onNoShow) && (
        <View style={styles.actionRow}>
          {isActing && <ActivityIndicator color={Colors.primary} size="small" style={{ marginRight: 8 }} />}
          {onStart && !isActing && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={onStart}>
              <Text style={styles.actionBtnText}>▶ Start</Text>
            </TouchableOpacity>
          )}
          {onComplete && !isActing && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={onComplete}>
              <Text style={styles.actionBtnText}>✓ Complete</Text>
            </TouchableOpacity>
          )}
          {onNoShow && !isActing && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warning }]} onPress={onNoShow}>
              <Text style={styles.actionBtnText}>⚠ No-Show</Text>
            </TouchableOpacity>
          )}
          {onCancel && !isActing && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={onCancel}>
              <Text style={styles.actionBtnText}>✕ Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.primary, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 52, padding: Spacing.lg, paddingBottom: Spacing.xl,
  },
  headerTitle: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: 2 },
  walletChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  walletBalance: { color: Colors.primary, fontWeight: '800', fontSize: FontSize.sm },
  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.md, marginTop: -Spacing.sm,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.sm, alignItems: 'center', gap: 4,
    borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '900' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  section: { padding: Spacing.md, paddingTop: 0 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  sessionCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sessionTopic: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  sessionWith: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  sessionDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 3 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  actionBtn: { borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  actionBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, padding: Spacing.lg },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff', 
    marginHorizontal: Spacing.md, marginTop: -Spacing.lg,
    borderRadius: Radius.lg, padding: 4,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md,
  },
  activeTab: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  activeTabText: { color: Colors.primary, fontWeight: '800' },
  availCard: {
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md,
  },
  availTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  availSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, marginBottom: Spacing.lg },
  addSlotRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  pickerFake: { 
    height: 48, backgroundColor: Colors.inputBg, borderRadius: Radius.md, 
    borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', paddingHorizontal: 12 
  },
  pickerText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  dayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: '#f0f0f0', marginRight: 8 },
  dayChipActive: { backgroundColor: Colors.primary },
  dayChipText: { fontSize: 12, color: Colors.textSecondary },
  dayChipTextActive: { color: '#fff', fontWeight: 'bold' },
  timeInput: {
    height: 48, backgroundColor: Colors.inputBg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  addBtn: {
    width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center', marginTop: 18,
  },
  slotsList: { marginTop: Spacing.md },
  dayGroup: { marginBottom: Spacing.md },
  dayGroupTitle: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '33',
  },
  slotTagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },
  emptySlotsText: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, marginVertical: 20 },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', marginTop: Spacing.lg,
  },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },
});
