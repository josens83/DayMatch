import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { jobService } from '../../services/jobService';
import { api } from '../../services/api';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const JobCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(37.5665);
  const [longitude, setLongitude] = useState(126.978);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [estimatedDuration, setEstimatedDuration] = useState('60');
  const [pay, setPay] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      if (response.data.length > 0) {
        setCategoryId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (title.length < 5) {
      newErrors.title = '제목은 5자 이상 입력해주세요';
    }

    if (!description.trim()) {
      newErrors.description = '상세 내용을 입력해주세요';
    } else if (description.length < 10) {
      newErrors.description = '상세 내용은 10자 이상 입력해주세요';
    }

    if (!categoryId) {
      newErrors.category = '카테고리를 선택해주세요';
    }

    if (!address.trim()) {
      newErrors.address = '주소를 입력해주세요';
    }

    if (!pay || parseInt(pay) < 10000) {
      newErrors.pay = '보수는 10,000원 이상 입력해주세요';
    }

    const duration = parseInt(estimatedDuration);
    if (!duration || duration < 30) {
      newErrors.duration = '예상 시간은 30분 이상 입력해주세요';
    }

    if (scheduledDate < new Date()) {
      newErrors.date = '과거 날짜는 선택할 수 없습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await jobService.createJob({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        address: address.trim(),
        latitude,
        longitude,
        scheduledDate: scheduledDate.toISOString(),
        estimatedDuration: parseInt(estimatedDuration),
        pay: parseInt(pay),
      });

      Alert.alert('성공', '일자리가 등록되었습니다', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.message || '일자리 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setScheduledDate(newDate);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(date.getHours(), date.getMinutes());
      setScheduledDate(newDate);
    }
  };

  const formatPay = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일자리 등록</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.label}>카테고리</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryList}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    categoryId === category.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      categoryId === category.id && styles.categoryNameSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Input
              label="제목"
              placeholder="어떤 일이 필요하신가요?"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Input
              label="상세 내용"
              placeholder="일의 내용을 자세히 설명해주세요"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={styles.textArea}
              maxLength={1000}
            />
          </View>

          <View style={styles.section}>
            <Input
              label="주소"
              placeholder="일하는 장소의 주소를 입력해주세요"
              value={address}
              onChangeText={setAddress}
              error={errors.address}
              leftIcon={
                <Ionicons name="location-outline" size={20} color={colors.gray[400]} />
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>날짜 및 시간</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.gray[600]} />
                <Text style={styles.dateTimeText}>
                  {format(scheduledDate, 'M월 d일 (EEE)', { locale: ko })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={colors.gray[600]} />
                <Text style={styles.dateTimeText}>
                  {format(scheduledDate, 'a h:mm', { locale: ko })}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              onChange={handleTimeChange}
            />
          )}

          <View style={styles.section}>
            <Input
              label="예상 소요 시간 (분)"
              placeholder="60"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              error={errors.duration}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <Input
              label="보수"
              placeholder="30000"
              value={pay}
              onChangeText={(text) => setPay(formatPay(text))}
              error={errors.pay}
              keyboardType="number-pad"
              rightIcon={<Text style={styles.currencyText}>원</Text>}
            />
            {pay && !errors.pay && (
              <Text style={styles.payHint}>
                {parseInt(pay).toLocaleString('ko-KR')}원
              </Text>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            title="등록하기"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
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
  closeButton: {
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
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.subtitle2,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  categoryList: {
    flexDirection: 'row',
  },
  categoryItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: spacing.sm,
    minWidth: 80,
  },
  categoryItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.caption,
    color: colors.gray[600],
  },
  categoryNameSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  textArea: {
    height: 120,
    paddingTop: spacing.sm,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.gray[50],
  },
  dateTimeText: {
    ...typography.body1,
    color: colors.gray[700],
    marginLeft: spacing.sm,
  },
  currencyText: {
    ...typography.body1,
    color: colors.gray[500],
  },
  payHint: {
    ...typography.caption,
    color: colors.primary[500],
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error[500],
    marginTop: spacing.xs,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});

export default JobCreateScreen;
