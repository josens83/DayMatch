import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { api } from '../../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handlePress = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await api.post('/notifications/read', {
          notificationIds: [notification.id],
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Navigate based on reference
    if (notification.referenceType && notification.referenceId) {
      switch (notification.referenceType) {
        case 'job':
          navigation.navigate('JobDetail', { jobId: notification.referenceId });
          break;
        case 'application':
          navigation.navigate('ApplicationDetail', {
            applicationId: notification.referenceId,
          });
          break;
        case 'match':
          navigation.navigate('MatchDetail', { matchId: notification.referenceId });
          break;
        case 'chat':
          navigation.navigate('ChatRoom', { chatRoomId: notification.referenceId });
          break;
        case 'payment':
          navigation.navigate('PaymentDetail', { paymentId: notification.referenceId });
          break;
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'a h:mm', { locale: ko });
    }
    if (isYesterday(date)) {
      return '어제';
    }
    return format(date, 'M월 d일', { locale: ko });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_received':
        return 'person-add-outline';
      case 'application_accepted':
        return 'checkmark-circle-outline';
      case 'application_rejected':
        return 'close-circle-outline';
      case 'match_created':
        return 'handshake-outline';
      case 'match_completed':
        return 'trophy-outline';
      case 'payment_received':
        return 'wallet-outline';
      case 'new_message':
        return 'chatbubble-outline';
      case 'review_received':
        return 'star-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handlePress(item)}
    >
      <View
        style={[
          styles.iconContainer,
          !item.isRead && styles.iconContainerUnread,
        ]}
      >
        <Ionicons
          name={getNotificationIcon(item.type) as any}
          size={24}
          color={item.isRead ? colors.gray[400] : colors.primary[500]}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>알림이 없습니다</Text>
      <Text style={styles.emptySubtitle}>
        새로운 소식이 있으면 알려드릴게요
      </Text>
    </View>
  );

  const hasUnread = notifications.some((n) => !n.isRead);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>알림</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림</Text>
        {hasUnread && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>모두 읽음</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    ...typography.h2,
    color: colors.gray[900],
  },
  markAllButton: {
    ...typography.body2,
    color: colors.primary[500],
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingVertical: spacing.xs,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  unreadItem: {
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerUnread: {
    backgroundColor: colors.primary[100],
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.subtitle2,
    color: colors.gray[700],
    marginBottom: 2,
  },
  titleUnread: {
    color: colors.gray[900],
    fontWeight: '600',
  },
  body: {
    ...typography.body2,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.gray[400],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginLeft: 76,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.gray[500],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.gray[400],
    textAlign: 'center',
  },
});

export default NotificationsScreen;
