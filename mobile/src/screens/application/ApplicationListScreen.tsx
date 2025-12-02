import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Button from '../../components/Button';
import { api } from '../../services/api';

type RouteParams = {
  ApplicationList: {
    jobId: string;
  };
};

interface Application {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
  applicant: {
    id: string;
    nickname: string;
    profileImage?: string;
    ratingAsHelper: number;
    reviewCount: number;
    skills?: string[];
  };
}

const ApplicationListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ApplicationList'>>();
  const { jobId } = route.params;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [])
  );

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${jobId}/applications`);
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const handleAccept = async (applicationId: string) => {
    Alert.alert(
      '지원 수락',
      '이 지원자를 수락하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: async () => {
            try {
              setActionLoading(applicationId);
              await api.post(`/applications/${applicationId}/accept`);
              Alert.alert('성공', '지원을 수락했습니다', [
                {
                  text: '확인',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('오류', error.message || '처리에 실패했습니다');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = async (applicationId: string) => {
    Alert.alert(
      '지원 거절',
      '이 지원을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(applicationId);
              await api.post(`/applications/${applicationId}/reject`);
              loadApplications();
            } catch (error: any) {
              Alert.alert('오류', error.message || '처리에 실패했습니다');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '대기중', color: colors.warning[500], bg: colors.warning[50] };
      case 'accepted':
        return { label: '수락됨', color: colors.success[500], bg: colors.success[50] };
      case 'rejected':
        return { label: '거절됨', color: colors.error[500], bg: colors.error[50] };
      case 'cancelled':
        return { label: '취소됨', color: colors.gray[500], bg: colors.gray[100] };
      default:
        return { label: status, color: colors.gray[500], bg: colors.gray[100] };
    }
  };

  const renderApplication = ({ item }: { item: Application }) => {
    const statusBadge = getStatusBadge(item.status);
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity
        style={styles.applicationCard}
        onPress={() =>
          navigation.navigate('UserProfile', { userId: item.applicant.id })
        }
      >
        <View style={styles.cardHeader}>
          <Image
            source={
              item.applicant.profileImage
                ? { uri: item.applicant.profileImage }
                : require('../../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
          <View style={styles.applicantInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{item.applicant.nickname}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusText, { color: statusBadge.color }]}>
                  {statusBadge.label}
                </Text>
              </View>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.warning[500]} />
              <Text style={styles.ratingText}>
                {item.applicant.ratingAsHelper.toFixed(1)} ({item.applicant.reviewCount}개 리뷰)
              </Text>
            </View>
          </View>
        </View>

        {item.applicant.skills && item.applicant.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.applicant.skills.slice(0, 4).map((skill) => (
              <View key={skill} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.applicant.skills.length > 4 && (
              <Text style={styles.moreSkills}>+{item.applicant.skills.length - 4}</Text>
            )}
          </View>
        )}

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>지원 메시지</Text>
            <Text style={styles.messageText} numberOfLines={3}>
              {item.message}
            </Text>
          </View>
        )}

        <Text style={styles.appliedAt}>
          {format(new Date(item.createdAt), 'M월 d일 a h:mm', { locale: ko })} 지원
        </Text>

        {isPending && (
          <View style={styles.actionButtons}>
            <Button
              title="거절"
              variant="outline"
              onPress={() => handleReject(item.id)}
              loading={actionLoading === item.id}
              style={styles.rejectButton}
            />
            <Button
              title="수락"
              onPress={() => handleAccept(item.id)}
              loading={actionLoading === item.id}
              style={styles.acceptButton}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>아직 지원자가 없습니다</Text>
      <Text style={styles.emptySubtitle}>
        조금만 기다려 주세요, 곧 지원자가 나타날 거예요
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>지원자 목록</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          지원자 목록 {pendingCount > 0 && `(${pendingCount})`}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        contentContainerStyle={
          applications.length === 0 ? styles.emptyList : styles.list
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
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.gray[900],
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicationCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[200],
  },
  applicantInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nickname: {
    ...typography.subtitle1,
    color: colors.gray[900],
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.body2,
    color: colors.gray[600],
    marginLeft: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  skillTag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  skillText: {
    ...typography.caption,
    color: colors.gray[600],
  },
  moreSkills: {
    ...typography.caption,
    color: colors.gray[400],
    alignSelf: 'center',
  },
  messageContainer: {
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  messageLabel: {
    ...typography.caption,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.body2,
    color: colors.gray[700],
  },
  appliedAt: {
    ...typography.caption,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
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

export default ApplicationListScreen;
