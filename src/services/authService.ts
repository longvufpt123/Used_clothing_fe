import apiClient from './api';

// Define responses matching backend DTOs
export interface AuthResponse {
  token: string;
  expiredAt: string;
  userId: string;
  fullName: string;
  userName: string;
  avatarUrl: string | null;
  role: string;
}
export interface RegisterResponse { userId: string; message: string; }
export interface VerificationResponse {
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  accountActivated: boolean;
  message: string;
}

export const loginApi = async (data: { userName: string; password: string }): Promise<AuthResponse> => {
  return apiClient.post<any, AuthResponse>('/auth/login', data);
};

export const registerApi = async (data: {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  address: string;
  phoneNumber: string;
  verificationChannel: 'Email' | 'Sms';
}): Promise<RegisterResponse> => {
  return apiClient.post<any, RegisterResponse>('/auth/register', data);
};

export const verifyRegistrationApi = (
  userId: string, channel: 'Email' | 'Sms', code: string,
): Promise<VerificationResponse> =>
  apiClient.post<any, VerificationResponse>('/auth/verify-registration', { userId, channel, code });

export const resendVerificationApi = (userId: string, channel: 'Email' | 'Sms'): Promise<void> =>
  apiClient.post('/auth/resend-verification', { userId, channel });
