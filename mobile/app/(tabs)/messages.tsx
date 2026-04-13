import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messageApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { getImageUrl } from '../../utils/image';

export default function MessagesScreen() {
  const { user, socket } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await messageApi.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Fetch Conversations Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Listen for real-time message updates to refresh the list
    if (socket) {
      socket.on('new_message', () => {
        fetchConversations();
      });
      return () => {
        socket.off('new_message');
      };
    }
  }, [socket, fetchConversations]);

  const renderItem = ({ item }: { item: any }) => {
    if (!user || !item || !item.partner || !item.lastMessage) return null;
    
    const partner = item.partner;
    const lastMsg = item.lastMessage;
    const isUnread = !lastMsg.isRead && lastMsg.receiverId === (user._id || user.id);

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/chat/${partner._id}`)}
      >
      <View style={styles.avatarContainer}>
        {partner.documents?.profilePicture ? (
          <Image
            source={{ uri: getImageUrl(partner.documents.profilePicture) }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{partner.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{partner.name}</Text>
            <Text style={styles.time}>
              {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.footer}>
            <Text 
              style={[styles.lastMsg, isUnread && styles.unreadText]} 
              numberOfLines={1}
            >
              {lastMsg.senderId === (user._id || user.id) ? 'You: ' : ''}{lastMsg.content}
            </Text>
            {isUnread && <View style={styles.unreadBadge} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) return null;

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.partner._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConversations(); }} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>Start a chat with a tutor or student!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appHeader: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  list: { padding: 15 },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  avatarContainer: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0f0f0' },
  avatarFallback: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, marginLeft: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  time: { fontSize: 11, color: Colors.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  lastMsg: { fontSize: 14, color: Colors.textSecondary, flex: 1, marginRight: 10 },
  unreadText: { color: Colors.textPrimary, fontWeight: '700' },
  unreadBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
});
