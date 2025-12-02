import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Button from '../../components/Button';
import { jobService } from '../../services/jobService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type RouteParams = {
  JobDetail: {
    jobId: string;
  };
};

interface Job {
  id: string;
  title: string;
  description: string;
  address: string;
  pay: number;
  estimatedDuration: number;
  scheduledDate: string;
  status: string;
  images?: string[];
  requester: {
    id: string;
    nickname: string;
    profileImage?: string;
    ratingAsRequester: number;
    reviewCount: number;
  };
  category: {
    name: string;
    icon: string;
  };
}

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'JobDetail'>>();
  const { jobId } = route.params;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const isOwner = user?.id === job?.requester?.id;

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = await jobService.getJob(jobId);
      setJob(data);
    } catch (error) {
      Alert.alert('오류', '일자리 정보를 불러오는데 실패했습니다');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    Alert.alert(
      '지원하기',
      '이 일자리에 지원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '지원',
          onPress: async () => {
            try {
              setApplying(true);
              await jobService.applyToJob(jobId);
              Alert.alert('성공', '지원이 완료되었습니다');
            } catch (error: any) {
              Alert.alert('오류', error.message || '지원에 실패했습니다');
            } finally {
              setApplying(false);
            }
          },
        },
      ],
    );
  };

  const handleChat = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('ChatRoom', {
      jobId: job?.id,
      otherUserId: job?.requester.id,
    });
  };

  const formatPay = (pay: number) => {
    return pay.toLocaleString('ko-KR') + '원';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>일자리를 찾을 수 없습니다</Text>
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
        <Text style={styles.headerTitle}>일자리 상세</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {job.images && job.images.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageSlider}
          >
            {job.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.jobImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.mainInfo}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{job.category?.name || '기타'}</Text>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.pay}>{formatPay(job.pay)}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.gray[500]} />
            <Text style={styles.infoText}>{job.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
            <Text style={styles.infoText}>
              {format(new Date(job.scheduledDate), 'M월 d일 (EEE) a h:mm', { locale: ko })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.gray[500]} />
            <Text style={styles.infoText}>예상 {formatDuration(job.estimatedDuration)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 내용</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.requesterSection}
          onPress={() => navigation.navigate('UserProfile', { userId: job.requester.id })}
        >
          <Image
            source={
              job.requester.profileImage
                ? { uri: job.requester.profileImage }
                : require('../../assets/default-avatar.png')
            }
            style={styles.requesterImage}
          />
          <View style={styles.requesterInfo}>
            <Text style={styles.requesterName}>{job.requester.nickname}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.warning[500]} />
              <Text style={styles.ratingText}>
                {job.requester.ratingAsRequester.toFixed(1)} ({job.requester.reviewCount})
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {!isOwner && job.status === 'open' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
          <Button
            title="지원하기"
            onPress={handleApply}
            loading={applying}
            style={styles.applyButton}
          />
        </View>
      )}

      {isOwner && (
        <View style={styles.bottomBar}>
          <Button
            title="수정하기"
            variant="outline"
            onPress={() => navigation.navigate('JobEdit', { jobId: job.id })}
            style={styles.editButton}
          />
          <Button
            title="지원자 보기"
            onPress={() => navigation.navigate('ApplicationList', { jobId: job.id })}
            style={styles.applyButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  content: {
    flex: 1,
  },
  imageSlider: {
    height: 250,
  },
  jobImage: {
    width: 400,
    height: 250,
  },
  mainInfo: {
    padding: spacing.lg,
  },
  categoryBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary[600],
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  pay: {
    ...typography.h1,
    color: colors.primary[500],
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body1,
    color: colors.gray[700],
    marginLeft: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: colors.gray[700],
    lineHeight: 24,
  },
  divider: {
    height: 8,
    backgroundColor: colors.gray[100],
  },
  requesterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  requesterImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[200],
  },
  requesterInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requesterName: {
    ...typography.subtitle1,
    color: colors.gray[900],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    ...typography.body2,
    color: colors.gray[600],
    marginLeft: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  applyButton: {
    flex: 1,
  },
  editButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});

export default JobDetailScreen;
