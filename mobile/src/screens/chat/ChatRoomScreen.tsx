import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { chatService } from '../../services/chatService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type RouteParams = {
  ChatRoom: {
    chatRoomId?: string;
    jobId: string;
    otherUser: {
      id: string;
      nickname: string;
      profileImage?: string;
    };
  };
};

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

const ChatRoomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ChatRoom'>>();
  const { chatRoomId, jobId, otherUser } = route.params;

  const flatListRef = useRef<FlatList>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomId, setRoomId] = useState(chatRoomId);

  useEffect(() => {
    initializeChat();
    return () => {
      chatService.disconnect();
    };
  }, []);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Get or create chat room
      if (!roomId) {
        const room = await chatService.getOrCreateRoom(jobId, otherUser.id);
        setRoomId(room.id);
      }

      // Connect to socket
      await chatService.connect();
      chatService.joinRoom(roomId || '');

      // Load messages
      const messagesData = await chatService.getMessages(roomId || '');
      setMessages(messagesData.reverse());

      // Listen for new messages
      chatService.onMessage((message) => {
        setMessages((prev) => [...prev, message]);
        if (message.senderId !== user?.id) {
          chatService.markAsRead(message.id);
        }
      });
    } catch (error) {
      console.error('Chat initialization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await chatService.sendMessage(roomId || '', content);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputText(content); // Restore message on failure
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), 'a h:mm', { locale: ko });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return '오늘';
    if (isYesterday(date)) return '어제';
    return format(date, 'M월 d일 EEEE', { locale: ko });
  };

  const shouldShowDateHeader = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt);
    const prevDate = new Date(messages[index - 1].createdAt);
    return !isSameDay(currentDate, prevDate);
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMyMessage = item.senderId === user?.id;
      const showDateHeader = shouldShowDateHeader(index);

      return (
        <View>
          {showDateHeader && (
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>
                {formatDateHeader(item.createdAt)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.messageRow,
              isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
            ]}
          >
            {!isMyMessage && (
              <Image
                source={
                  otherUser.profileImage
                    ? { uri: otherUser.profileImage }
                    : require('../../assets/default-avatar.png')
                }
                style={styles.messageAvatar}
              />
            )}
            <View
              style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {item.content}
              </Text>
            </View>
            <Text style={styles.messageTime}>{formatMessageTime(item.createdAt)}</Text>
          </View>
        </View>
      );
    },
    [messages, user]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => navigation.navigate('UserProfile', { userId: otherUser.id })}
        >
          <Image
            source={
              otherUser.profileImage
                ? { uri: otherUser.profileImage }
                : require('../../assets/default-avatar.png')
            }
            style={styles.headerAvatar}
          />
          <Text style={styles.headerTitle}>{otherUser.nickname}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {}}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color={colors.gray[500]} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={colors.gray[400]}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : {},
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.white : colors.gray[400]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.xs,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[200],
  },
  headerTitle: {
    ...typography.subtitle1,
    color: colors.gray[900],
    marginLeft: spacing.sm,
  },
  menuButton: {
    padding: spacing.xs,
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateHeaderText: {
    ...typography.caption,
    color: colors.gray[500],
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    marginRight: spacing.xs,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body1,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.gray[900],
  },
  messageTime: {
    ...typography.caption,
    color: colors.gray[400],
    marginHorizontal: spacing.xs,
    fontSize: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...typography.body1,
    color: colors.gray[900],
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonActive: {
    backgroundColor: colors.primary[500],
  },
});

export default ChatRoomScreen;
