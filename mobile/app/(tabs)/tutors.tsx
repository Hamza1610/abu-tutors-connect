import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { userApi } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TutorsScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [search, setSearch] = useState(params.q || '');
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.q) setSearch(params.q);
  }, [params.q]);

  const fetchTutors = useCallback(async () => {
    try {
      const res = await userApi.getTutors({ search });
      setTutors(res.data);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchTutors, 350);
    return () => clearTimeout(timer);
  }, [fetchTutors]);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchHeader}>
        <Text style={styles.title}>Find Tutors</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or course code..."
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: Spacing.xxl }} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={tutors}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: Spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTutors(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No tutors found{search ? ` for "${search}"` : ''}.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tutorCard}
              onPress={() => router.push({ pathname: '/tutor/[id]', params: { id: item._id } })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tutorName}>{item.name}</Text>
                <Text style={styles.tutorMeta}>{item.faculty || '—'} · Level {item.level}</Text>
                {item.courses?.length > 0 && (
                  <View style={styles.courseRow}>
                    {item.courses.slice(0, 3).map((c: string) => (
                      <View key={c} style={styles.courseBadge}>
                        <Text style={styles.courseBadgeText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchHeader: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    paddingTop: 52,
    paddingBottom: Spacing.lg,
  },
  title: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  tutorCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: '800', fontSize: FontSize.xl },
  tutorName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  tutorMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  courseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  courseBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  courseBadgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
