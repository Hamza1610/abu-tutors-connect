import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messageApi, userApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { getImageUrl } from '../../utils/image';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, socket } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchPartner = useCallback(async () => {
    try {
      const res = await userApi.getTutorById(id);
      setPartner(res.data);
    } catch {
      // Fallback: If not a tutor, they might be a student or admin
      setPartner({ _id: id, name: 'User' });
    }
  }, [id]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await messageApi.getMessages(id);
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch Messages Error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPartner();
    fetchMessages();

    if (socket) {
      // Listen for incoming messages
      socket.on('new_message', (msg: any) => {
        if (msg.senderId === id) {
          setMessages(prev => [...prev, msg]);
        }
      });

      // Listen for read receipts (Blue Ticks)
      socket.on('msg_read', (data: any) => {
        if (data.partnerId === id) {
          setMessages(prev => prev.map(m => 
            m.senderId === (user._id || user.id) ? { ...m, isRead: true } : m
          ));
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('msg_read');
      };
    }
  }, [id, socket, fetchPartner, fetchMessages]);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await messageApi.sendMessage(id, content.trim());
      setMessages(prev => [...prev, res.data]);
      setContent('');
      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Send Error:', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const userId = user?._id || user?.id;
    if (!userId) return null;
    const isMine = item.senderId === userId;
    return (
      <View style={[styles.msgWrap, isMine ? styles.msgMine : styles.msgTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.msgText, isMine ? styles.textMine : styles.textTheirs]}>{item.content}</Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.msgTime, isMine ? styles.timeMine : styles.timeTheirs]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMine && (
              <Ionicons 
                name="checkmark-done" 
                size={16} 
                color={item.isRead ? Colors.primary : Colors.textMuted} 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  if (!user) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerAvatarContainer}>
          {partner?.documents?.profilePicture ? (
            <Image 
              source={{ uri: getImageUrl(partner.documents.profilePicture) }} 
              style={styles.headerAvatar} 
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarTextSm}>{partner?.name?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerName} numberOfLines={1}>{partner?.name || 'Loading...'}</Text>
          <Text style={styles.headerStatus}>{partner?.role === 'admin' ? 'Support' : partner?.role}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!content.trim() || sending}>
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  headerAvatarContainer: { width: 40, height: 40, borderRadius: 20, marginLeft: 12, overflow: 'hidden' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0' },
  avatarFallback: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTextSm: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  headerStatus: { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },
  
  list: { paddingHorizontal: 15, paddingVertical: 20 },
  msgWrap: { marginBottom: 12, maxWidth: '85%' },
  msgMine: { alignSelf: 'flex-end' },
  msgTheirs: { alignSelf: 'flex-start' },
  bubble: { padding: 12, borderRadius: 20 },
  bubbleMine: { backgroundColor: '#fff', borderBottomRightRadius: 4, borderWidth: 1, borderColor: '#eee' },
  bubbleTheirs: { backgroundColor: Colors.primary, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 20 },
  textMine: { color: Colors.textPrimary },
  textTheirs: { color: '#fff' },
  bubbleFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, alignItems: 'center' },
  msgTime: { fontSize: 10 },
  timeMine: { color: Colors.textMuted },
  timeTheirs: { color: 'rgba(255,255,255,0.7)' },
  
  inputBar: {
    padding: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f0f0f0'
  },
  input: {
    flex: 1, backgroundColor: '#f5f7fa', borderRadius: 25,
    paddingHorizontal: 20, paddingVertical: 10, fontSize: 15,
    maxHeight: 100, color: Colors.textPrimary
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginLeft: 10
  }
});
