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
  accountActivated: boolean;
  message: string;
}
export interface CurrentUserProfile {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  warehouseAddress: string | null;
  emailConfirmed: boolean;
  createAt: string | null;
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
}): Promise<RegisterResponse> => {
  return apiClient.post<any, RegisterResponse>('/auth/register', data);
};

export const verifyRegistrationApi = (
  userId: string, code: string,
): Promise<VerificationResponse> =>
  apiClient.post<any, VerificationResponse>('/auth/verify-registration', { userId, code });

export const resendVerificationApi = (userId: string): Promise<void> =>
  apiClient.post('/auth/resend-verification', { userId });

export const getCurrentUserProfileApi = (): Promise<CurrentUserProfile> =>
  apiClient.get<unknown, CurrentUserProfile>('/auth/me');
