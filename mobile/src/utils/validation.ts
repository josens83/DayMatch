/**
 * DayMatch Form Validation Utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRule<T = string> {
  validate: (value: T) => boolean;
  message: string;
}

/**
 * Validate a value against multiple rules
 */
export const validate = <T>(
  value: T,
  rules: ValidationRule<T>[],
): ValidationResult => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return { isValid: false, error: rule.message };
    }
  }
  return { isValid: true };
};

// Common validation rules
export const ValidationRules = {
  // Required field
  required: (message = '필수 입력 항목입니다'): ValidationRule => ({
    validate: (value: string) => value.trim().length > 0,
    message,
  }),

  // Minimum length
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: message || `최소 ${min}자 이상 입력해주세요`,
  }),

  // Maximum length
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: message || `최대 ${max}자까지 입력 가능합니다`,
  }),

  // Email format
  email: (message = '올바른 이메일 형식이 아닙니다'): ValidationRule => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  // Korean phone number
  phone: (message = '올바른 휴대폰 번호 형식이 아닙니다'): ValidationRule => ({
    validate: (value: string) => {
      const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
      return phoneRegex.test(value.replace(/-/g, ''));
    },
    message,
  }),

  // Password strength
  password: (message?: string): ValidationRule => ({
    validate: (value: string) => {
      // At least 8 characters, with letters and numbers
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      return passwordRegex.test(value);
    },
    message: message || '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다',
  }),

  // Passwords match
  passwordMatch: (
    password: string,
    message = '비밀번호가 일치하지 않습니다',
  ): ValidationRule => ({
    validate: (value: string) => value === password,
    message,
  }),

  // Numeric only
  numeric: (message = '숫자만 입력 가능합니다'): ValidationRule => ({
    validate: (value: string) => /^\d+$/.test(value),
    message,
  }),

  // Minimum number value
  minValue: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message: message || `최소 ${min} 이상이어야 합니다`,
  }),

  // Maximum number value
  maxValue: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value <= max,
    message: message || `최대 ${max}까지 가능합니다`,
  }),

  // Korean name (2-5 characters, Korean only)
  koreanName: (message = '이름을 올바르게 입력해주세요'): ValidationRule => ({
    validate: (value: string) => {
      const nameRegex = /^[가-힣]{2,5}$/;
      return nameRegex.test(value);
    },
    message,
  }),

  // Nickname (2-10 characters, Korean, English, numbers)
  nickname: (message?: string): ValidationRule => ({
    validate: (value: string) => {
      const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
      return nicknameRegex.test(value);
    },
    message: message || '닉네임은 2-10자의 한글, 영문, 숫자만 가능합니다',
  }),

  // Date in the future
  futureDate: (message = '미래 날짜를 선택해주세요'): ValidationRule<Date> => ({
    validate: (value: Date) => value > new Date(),
    message,
  }),

  // URL format
  url: (message = '올바른 URL 형식이 아닙니다'): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  // Pay amount (Korean won, minimum 10,000)
  payAmount: (min = 10000, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message: message || `최소 ${min.toLocaleString()}원 이상이어야 합니다`,
  }),
};

/**
 * Form validation hook
 */
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormField<T = string> {
  value: T;
  rules: ValidationRule<T>[];
}

export const validateForm = <T extends Record<string, FormField<any>>>(
  fields: T,
): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};
  let isValid = true;

  for (const [fieldName, field] of Object.entries(fields)) {
    const result = validate(field.value, field.rules);
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Format phone number for display (010-1234-5678)
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Format currency (Korean won)
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

/**
 * Sanitize input (remove special characters that could be harmful)
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim();
};
