import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Button from '../../components/Button';
import { api } from '../../services/api';

type RouteParams = {
  Payment: {
    matchId: string;
  };
};

interface PaymentInfo {
  payment: {
    id: string;
    amount: number;
    platformFee: number;
    helperPayout: number;
  };
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
}

interface Match {
  id: string;
  job: {
    title: string;
    address: string;
    scheduledDate: string;
  };
  helper: {
    nickname: string;
    profileImage?: string;
  };
  finalPay: number;
}

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'Payment'>>();
  const { matchId } = route.params;

  const [match, setMatch] = useState<Match | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'transfer'>('card');

  useEffect(() => {
    loadPaymentInfo();
  }, [matchId]);

  const loadPaymentInfo = async () => {
    try {
      setLoading(true);
      const [matchResponse, paymentResponse] = await Promise.all([
        api.get(`/matches/${matchId}`),
        api.post(`/payments/prepare`, { matchId }),
      ]);
      setMatch(matchResponse.data);
      setPaymentInfo(paymentResponse.data);
    } catch (error: any) {
      Alert.alert('오류', error.message || '결제 정보를 불러오는데 실패했습니다');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentInfo) return;

    setProcessing(true);

    try {
      // In production, this would integrate with Toss Payments SDK
      // For now, we'll simulate the payment process

      // Simulated payment key from Toss SDK
      const mockPaymentKey = `toss_${Date.now()}`;

      // Confirm payment with backend
      const response = await api.post(`/payments/${paymentInfo.payment.id}/confirm`, {
        paymentKey: mockPaymentKey,
        orderId: paymentInfo.orderId,
        amount: paymentInfo.amount,
      });

      Alert.alert('결제 완료', '결제가 성공적으로 완료되었습니다', [
        {
          text: '확인',
          onPress: () => navigation.navigate('MatchDetail', { matchId }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('결제 실패', error.message || '결제 처리 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
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

  if (!match || !paymentInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>결제 정보를 찾을 수 없습니다</Text>
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
        <Text style={styles.headerTitle}>결제하기</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 정보</Text>
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>{match.job.title}</Text>
            <View style={styles.orderRow}>
              <Ionicons name="location-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.orderText}>{match.job.address}</Text>
            </View>
            <View style={styles.orderRow}>
              <Ionicons name="person-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.orderText}>헬퍼: {match.helper.nickname}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 수단</Text>
          <TouchableOpacity
            style={[
              styles.methodButton,
              selectedMethod === 'card' && styles.methodButtonSelected,
            ]}
            onPress={() => setSelectedMethod('card')}
          >
            <Ionicons
              name="card-outline"
              size={24}
              color={selectedMethod === 'card' ? colors.primary[500] : colors.gray[500]}
            />
            <Text
              style={[
                styles.methodText,
                selectedMethod === 'card' && styles.methodTextSelected,
              ]}
            >
              카드 결제
            </Text>
            <View style={styles.methodRadio}>
              {selectedMethod === 'card' && <View style={styles.methodRadioInner} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodButton,
              selectedMethod === 'transfer' && styles.methodButtonSelected,
            ]}
            onPress={() => setSelectedMethod('transfer')}
          >
            <Ionicons
              name="wallet-outline"
              size={24}
              color={selectedMethod === 'transfer' ? colors.primary[500] : colors.gray[500]}
            />
            <Text
              style={[
                styles.methodText,
                selectedMethod === 'transfer' && styles.methodTextSelected,
              ]}
            >
              계좌이체
            </Text>
            <View style={styles.methodRadio}>
              {selectedMethod === 'transfer' && <View style={styles.methodRadioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 금액</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>서비스 금액</Text>
              <Text style={styles.priceValue}>{formatCurrency(match.finalPay)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>플랫폼 수수료 (10%)</Text>
              <Text style={styles.priceValue}>
                {formatCurrency(paymentInfo.payment.platformFee)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>총 결제 금액</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(paymentInfo.amount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.noticeSection}>
          <Ionicons name="information-circle-outline" size={20} color={colors.gray[500]} />
          <Text style={styles.noticeText}>
            결제 금액은 작업 완료 후 헬퍼에게 전달됩니다. 에스크로 방식으로 안전하게 보호됩니다.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelBottom}>결제 금액</Text>
          <Text style={styles.totalValueBottom}>
            {formatCurrency(paymentInfo.amount)}
          </Text>
        </View>
        <Button
          title="결제하기"
          onPress={handlePayment}
          loading={processing}
          disabled={processing}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: 8,
  },
  orderTitle: {
    ...typography.subtitle1,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  orderText: {
    ...typography.body2,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
  },
  methodButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  methodText: {
    ...typography.body1,
    color: colors.gray[700],
    marginLeft: spacing.md,
    flex: 1,
  },
  methodTextSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  priceCard: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    ...typography.body2,
    color: colors.gray[600],
  },
  priceValue: {
    ...typography.body2,
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.sm,
  },
  totalLabel: {
    ...typography.subtitle1,
    color: colors.gray[900],
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary[500],
  },
  noticeSection: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.gray[100],
  },
  noticeText: {
    ...typography.body2,
    color: colors.gray[600],
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabelBottom: {
    ...typography.body1,
    color: colors.gray[600],
  },
  totalValueBottom: {
    ...typography.h3,
    color: colors.gray[900],
  },
});

export default PaymentScreen;
