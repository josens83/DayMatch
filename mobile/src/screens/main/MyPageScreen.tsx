import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { colors, spacing, typography, borderRadius } from '../../theme';

type MyPageScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const MENU_ITEMS = [
  { id: 'myJobs', title: '내가 등록한 일', icon: '📝' },
  { id: 'myApplications', title: '내 지원 내역', icon: '📋' },
  { id: 'myMatches', title: '매칭 내역', icon: '🤝' },
  { id: 'reviews', title: '받은 리뷰', icon: '⭐' },
  { id: 'settings', title: '설정', icon: '⚙️' },
];

export const MyPageScreen: React.FC<MyPageScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const handleMenuPress = (menuId: string) => {
    switch (menuId) {
      case 'myJobs':
        navigation.navigate('MyJobs');
        break;
      case 'myApplications':
        navigation.navigate('MyApplications');
        break;
      case 'myMatches':
        navigation.navigate('MyMatches');
        break;
      case 'reviews':
        navigation.navigate('Reviews');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name || '사용자'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.badges}>
                {user?.isRequester && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>의뢰자</Text>
                  </View>
                )}
                {user?.isHelper && (
                  <View style={[styles.badge, styles.helperBadge]}>
                    <Text style={styles.badgeText}>헬퍼</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingValue}>
                {user?.ratingAsRequester?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.ratingLabel}>의뢰자 평점</Text>
            </View>
            <View style={styles.ratingDivider} />
            <View style={styles.ratingItem}>
              <Text style={styles.ratingValue}>
                {user?.ratingAsHelper?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.ratingLabel}>헬퍼 평점</Text>
            </View>
            <View style={styles.ratingDivider} />
            <View style={styles.ratingItem}>
              <Text style={styles.ratingValue}>{user?.reviewCount || 0}</Text>
              <Text style={styles.ratingLabel}>리뷰</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  email: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  helperBadge: {
    backgroundColor: colors.secondary + '20',
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  ratingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ratingDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  editButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  menuSection: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuTitle: {
    flex: 1,
    ...typography.body1,
    color: colors.textPrimary,
  },
  menuArrow: {
    ...typography.h4,
    color: colors.textTertiary,
  },
  logoutButton: {
    backgroundColor: colors.white,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoutText: {
    ...typography.body1,
    color: colors.error,
  },
});

export default MyPageScreen;
