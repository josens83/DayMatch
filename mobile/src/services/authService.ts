import api, { saveTokens, clearTokens } from './api';
import {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  ApiResponse,
} from '../types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/register', data);
    const tokens = response.data.data;
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  },

  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/login', data);
    const tokens = response.data.data;
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      await clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  },

  async sendVerificationCode(phone: string): Promise<void> {
    await api.post('/auth/verify-phone/send', { phone });
  },

  async confirmVerificationCode(phone: string, code: string): Promise<boolean> {
    const response = await api.post<ApiResponse<{ verified: boolean }>>(
      '/auth/verify-phone/confirm',
      { phone, code }
    );
    return response.data.data.verified;
  },
};

export default authService;
