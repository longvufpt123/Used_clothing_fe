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
}): Promise<void> => {
  return apiClient.post('/auth/register', data);
};
