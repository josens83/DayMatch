import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { register, clearError } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/common';
import { colors, spacing, typography } from '../../theme';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    nickname: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!form.phone) {
      newErrors.phone = '전화번호를 입력해주세요';
    } else if (!/^01[0-9]{8,9}$/.test(form.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }

    if (!form.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (form.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!form.name) {
      newErrors.name = '이름을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    dispatch(clearError());
    dispatch(
      register({
        email: form.email,
        phone: form.phone,
        password: form.password,
        name: form.name,
        nickname: form.nickname || undefined,
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>
              DayMatch에 오신 것을 환영합니다
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="이메일"
              placeholder="이메일을 입력하세요"
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="전화번호"
              placeholder="01012345678"
              value={form.phone}
              onChangeText={(v) => updateForm('phone', v)}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Input
              label="비밀번호"
              placeholder="8자 이상 입력하세요"
              value={form.password}
              onChangeText={(v) => updateForm('password', v)}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="비밀번호 확인"
              placeholder="비밀번호를 다시 입력하세요"
              value={form.confirmPassword}
              onChangeText={(v) => updateForm('confirmPassword', v)}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Input
              label="이름"
              placeholder="실명을 입력하세요"
              value={form.name}
              onChangeText={(v) => updateForm('name', v)}
              error={errors.name}
            />

            <Input
              label="닉네임 (선택)"
              placeholder="닉네임을 입력하세요"
              value={form.nickname}
              onChangeText={(v) => updateForm('nickname', v)}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Button
              title="회원가입"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={styles.registerButton}
            />

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.loginText}>
                이미 계정이 있으신가요?{' '}
                <Text style={styles.loginTextBold}>로그인</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  error: {
    ...typography.body2,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
