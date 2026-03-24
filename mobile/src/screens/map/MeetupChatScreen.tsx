import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { meetupApi } from '../../services/api';
import { mapRaidersWs } from '../../services/websocket';
import { useAuthStore } from '../../store/authStore';
import type { MeetupChatScreenProps } from '../../navigation/types';

interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderUsername: string;
  message: string;
  createdAt: string;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - (date ? date.getTime() : now.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MeetupChatScreen({ navigation, route }: MeetupChatScreenProps) {
  const { eventId, eventName } = route.params;
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await meetupApi.getMessages(eventId);
      const msgs: ChatMessage[] = (data.data?.messages ?? data.messages ?? []).map((m: any) => ({
        id: m.id,
        eventId: m.meetup_id ?? m.eventId ?? eventId,
        senderId: m.sender_id ?? m.senderId,
        senderUsername: m.sender_username ?? m.senderUsername,
        message: m.message,
        createdAt: m.created_at ?? m.createdAt,
      }));
      setMessages(msgs);
      setHasMore(msgs.length >= 50);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time meetup_message events
  useEffect(() => {
    const unsubscribe = mapRaidersWs.on('meetup_message', (data: any) => {
      if (data.eventId !== eventId && data.meetupId !== eventId) return;

      const newMsg: ChatMessage = {
        id: data.id,
        eventId: data.eventId ?? data.meetupId ?? eventId,
        senderId: data.senderId,
        senderUsername: data.senderUsername,
        message: data.message,
        createdAt: data.createdAt,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });
    });

    return unsubscribe;
  }, [eventId]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[messages.length - 1];
      const { data } = await meetupApi.getMessages(eventId, oldestMessage.id);
      const olderMsgs: ChatMessage[] = (data.data?.messages ?? data.messages ?? []).map((m: any) => ({
        id: m.id,
        eventId: m.meetup_id ?? m.eventId ?? eventId,
        senderId: m.sender_id ?? m.senderId,
        senderUsername: m.sender_username ?? m.senderUsername,
        message: m.message,
        createdAt: m.created_at ?? m.createdAt,
      }));

      if (olderMsgs.length < 50) {
        setHasMore(false);
      }

      setMessages((prev) => [...prev, ...olderMsgs]);
    } catch {
      // Ignore pagination errors
    } finally {
      setLoadingMore(false);
    }
  }, [eventId, messages, loadingMore, hasMore]);

  // Send a message
  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setInputText('');

    try {
      await meetupApi.sendMessage(eventId, trimmed);
      // The WebSocket broadcast will add the message to the list
    } catch {
      // Restore input text on failure
      setInputText(trimmed);
    } finally {
      setSending(false);
    }
  }, [eventId, inputText, sending]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.senderId === currentUserId;

    return (
      <View style={[styles.messageBubbleRow, isOwn && styles.messageBubbleRowOwn]}>
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          {!isOwn && (
            <Text style={styles.senderName}>{item.senderUsername}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatTimestamp(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color="#2A3450" />
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySubtext}>Start the conversation with other attendees!</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={THEME.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{eventName}</Text>
          <Text style={styles.headerSubtitle}>Event Chat</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadOlderMessages}
            onEndReachedThreshold={0.3}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={THEME.textSecondary}
            maxLength={500}
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color={THEME.text} />
            ) : (
              <Ionicons name="send" size={20} color={THEME.text} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: THEME.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: THEME.textSecondary,
    marginTop: 1,
  },
  headerSpacer: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  messageBubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  messageBubbleOwn: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: THEME.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  senderName: {
    color: THEME.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginBottom: 3,
  },
  messageText: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: THEME.text,
  },
  messageTime: {
    color: THEME.textSecondary,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(0, 212, 255, 0.6)',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    transform: [{ scaleY: -1 }],
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#555E78',
    fontSize: FONT_SIZE.sm,
    marginTop: 4,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  textInput: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
  },
});
