import apiClient from './api';

export interface Voucher {
  id: string; name: string; partnerName: string; voucherUrl?: string; imageUrl?: string;
  description?: string; termsAndConditions?: string; value: number; requiredPoints: number;
  startDate: string; expireDate: string; status: string | number; availableQuantity: number;
}
export interface MyVoucher { voucherCodeId: string; voucherId: string; voucherName: string;
  partnerName: string; code: string; redeemedAt: string; expireDate: string; }
export interface PointSummary { donationPoint: number; pointsPerKg: number; transactions: {
  id: string; type: string; points: number; balanceAfter: number; weightKg?: number;
  description: string; donationRequestCode?: string; occurredAt: string;
}[]; }
export interface DonorLeaderboardEntry {
  rank: number; userId: string; fullName: string; userName: string; avatarUrl?: string;
  totalWeightKg: number; donationCount: number;
}

export const voucherService = {
  available: () => apiClient.get<unknown, Voucher[]>('/vouchers'),
  manager: () => apiClient.get<unknown, Voucher[]>('/vouchers/manager'),
  myVouchers: () => apiClient.get<unknown, MyVoucher[]>('/vouchers/my-vouchers'),
  pointSummary: () => apiClient.get<unknown, PointSummary>('/vouchers/my-points/summary'),
  donorLeaderboard: (limit = 50) =>
    apiClient.get<unknown, DonorLeaderboardEntry[]>(`/vouchers/leaderboard?limit=${limit}`),
  redeem: (id: string) => apiClient.post<unknown, { code: string; remainingPoints: number }>(`/vouchers/${id}/redeem`),
  create: (data: unknown) => apiClient.post('/vouchers', data),
  updateStatus: (id: string, status: string | number) => apiClient.patch(`/vouchers/${id}/status`, { status }),
  addCodes: (id: string, codes: { code: string; expireDate: string }[]) => apiClient.post(`/vouchers/${id}/codes`, { codes }),
};
