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
export interface RegisterResponse {
  userId: string;
  message: string;
}
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

export const loginApi = async (data: {
  userName: string;
  password: string;
}): Promise<AuthResponse> => {
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

export interface RegisterOrganizationInput {
  organizationType: 'CharityOrganization' | 'RecyclingOrganization' | 'DisposalOrganization';
  organizationName: string;
  taxCode: string;
  address: string;
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  certificateFile: File;
}

export const registerOrganizationApi = async (
  data: RegisterOrganizationInput,
): Promise<RegisterResponse> => {
  const form = new FormData();
  form.append('organizationType', data.organizationType);
  form.append('organizationName', data.organizationName);
  form.append('taxCode', data.taxCode);
  form.append('address', data.address);
  form.append('userName', data.userName);
  form.append('email', data.email);
  form.append('phoneNumber', data.phoneNumber);
  form.append('password', data.password);
  form.append('certificateFile', data.certificateFile);
  // Raw fetch: the axios instance defaults to application/json, which would break
  // the multipart boundary; the browser sets the correct Content-Type for FormData.
  const response = await fetch(`${apiClient.defaults.baseURL}/auth/register-organization`, {
    method: 'POST',
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(payload?.message || 'Không thể đăng ký tổ chức.'), {
      response: { data: payload },
    });
  }
  return payload as RegisterResponse;
};

export const verifyRegistrationApi = (
  userId: string,
  code: string,
): Promise<VerificationResponse> =>
  apiClient.post<any, VerificationResponse>('/auth/verify-registration', { userId, code });

export const resendVerificationApi = (userId: string): Promise<void> =>
  apiClient.post('/auth/resend-verification', { userId });

export const getCurrentUserProfileApi = (): Promise<CurrentUserProfile> =>
  apiClient.get<unknown, CurrentUserProfile>('/auth/me');

export const forgotPasswordApi = (email: string): Promise<{ message: string }> =>
  apiClient.post('/auth/forgot-password', { email });

export const resetPasswordApi = (data: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ message: string }> => apiClient.post('/auth/reset-password', data);
