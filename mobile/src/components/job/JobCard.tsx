import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Job } from '../../types';
import { colors, spacing, borderRadius, typography, shadow } from '../../theme';

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const formatPay = (amount: number, type: string) => {
    const formatted = amount.toLocaleString();
    switch (type) {
      case 'hourly':
        return `시급 ${formatted}원`;
      case 'daily':
        return `일급 ${formatted}원`;
      default:
        return `${formatted}원`;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[d.getDay()];
    return `${month}/${day}(${weekday})`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {job.images && job.images[0] && (
        <Image source={{ uri: job.images[0] }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          {job.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{job.category.name}</Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(job.workDate)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {job.title}
        </Text>

        <Text style={styles.location} numberOfLines={1}>
          {job.sido} {job.sigungu}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.pay}>{formatPay(job.payAmount, job.payType)}</Text>
          {job.appliedCount > 0 && (
            <Text style={styles.applicants}>지원 {job.appliedCount}명</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.md,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray100,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pay: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '700',
  },
  applicants: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});

export default JobCard;
