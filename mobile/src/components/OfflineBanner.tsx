import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineBannerProps {
  /** Custom message to display when offline */
  offlineMessage?: string;
  /** Custom message to display when back online */
  onlineMessage?: string;
  /** Duration to show the "back online" message (ms) */
  onlineDuration?: number;
}

/**
 * Banner component that shows when the device is offline
 */
const OfflineBanner: React.FC<OfflineBannerProps> = ({
  offlineMessage = '인터넷 연결이 끊어졌습니다',
  onlineMessage = '다시 연결되었습니다',
  onlineDuration = 3000,
}) => {
  const { isConnected, wasOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isConnected || wasOffline) {
      // Show banner
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide banner
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isConnected, wasOffline, slideAnim, opacityAnim]);

  // Don't render if connected and not recently reconnected
  if (isConnected && !wasOffline) {
    return null;
  }

  const backgroundColor = isConnected ? colors.success : colors.error;
  const message = isConnected ? onlineMessage : offlineMessage;
  const icon = isConnected ? '✓' : '⚠';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
});

export default OfflineBanner;

/**
 * Full screen offline placeholder
 */
export const OfflineScreen: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => {
  return (
    <View style={offlineStyles.container}>
      <Text style={offlineStyles.emoji}>📡</Text>
      <Text style={offlineStyles.title}>오프라인 상태입니다</Text>
      <Text style={offlineStyles.message}>
        인터넷 연결을 확인해주세요.{'\n'}
        일부 기능이 제한될 수 있습니다.
      </Text>
      {onRetry && (
        <TouchableOpacity style={offlineStyles.retryButton} onPress={onRetry}>
          <Text style={offlineStyles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const offlineStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
});
