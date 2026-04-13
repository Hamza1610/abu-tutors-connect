import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { userApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TutorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const [tutor, setTutor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    userApi.getTutorById(id)
      .then(res => setTutor(res.data))
      .catch(() => Alert.alert('Error', 'Could not load tutor profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!tutor) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textSecondary }}>Tutor not found.</Text>
      </View>
    );
  }

  const canBook = me?.role === 'tutee';

  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tutor.name?.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{tutor.name}</Text>
        <Text style={styles.meta}>{tutor.faculty || 'ABU Tutor'} · Level {tutor.level}</Text>
        <View style={styles.badgeRow}>
          {tutor.isApproved && (
            <View style={[styles.badge, { backgroundColor: Colors.accent }]}>
              <Text style={styles.badgeText}>✓ Verified Tutor</Text>
            </View>
          )}
          {!tutor.isApproved && (
            <View style={[styles.badge, { backgroundColor: Colors.warning }]}>
              <Text style={styles.badgeText}>Newbie Tutor</Text>
            </View>
          )}
        </View>
      </View>

      {/* Book Button */}
      {canBook ? (
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/book-session', params: { tutorId: tutor._id, tutorName: tutor.name } })}
        >
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.bookBtnText}>Book a Session</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.restrictedBanner}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
          <Text style={styles.restrictedText}>Tutors cannot book sessions with other tutors.</Text>
        </View>
      )}

      {/* Profile Summary */}
      {tutor.matchingBio ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About This Tutor</Text>
          <View style={styles.bioBox}>
            <Text style={styles.bioText}>"{tutor.matchingBio}"</Text>
          </View>
        </View>
      ) : null}

      {/* Courses */}
      {tutor.courses?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Courses Taught</Text>
          <View style={styles.courseRow}>
            {tutor.courses.map((c: string) => (
              <View key={c} style={styles.courseBadge}>
                <Text style={styles.courseBadgeText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Area of Strength */}
      {tutor.areaOfStrength ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Area of Strength</Text>
          <Text style={styles.strengthText}>{tutor.areaOfStrength}</Text>
        </View>
      ) : null}

      {/* Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <InfoRow label="Department" value={tutor.department || '—'} />
        <InfoRow label="Level" value={tutor.level || '—'} />
        {tutor.phone && <InfoRow label="Contact" value={tutor.phone} />}
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: Spacing.sm,
  },
  avatarText: { color: '#fff', fontSize: FontSize.xxxl, fontWeight: '900' },
  name: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800' },
  meta: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
  badge: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.accent,
    margin: Spacing.md, borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.lg },
  restrictedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warning + '22', borderRadius: Radius.md,
    margin: Spacing.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.warning + '44',
  },
  restrictedText: { color: Colors.warning, fontSize: FontSize.sm, flex: 1 },
  card: {
    backgroundColor: Colors.card, margin: Spacing.md, marginTop: 0,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  bioBox: {
    backgroundColor: '#F0F9FF', borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: '#BAE6FD',
  },
  bioText: { color: '#0369A1', fontStyle: 'italic', fontSize: FontSize.md, lineHeight: 22 },
  courseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  courseBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  courseBadgeText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  strengthText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border + '66',
  },
  infoLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  infoValue: { color: Colors.textPrimary, fontWeight: '500', fontSize: FontSize.sm },
});
