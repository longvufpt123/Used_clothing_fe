import { apiClient } from '@/services/api';

export interface DonationPointRule {
  pointsPerKg: number;
  updatedAt?: string;
}

export const donationPointRuleService = {
  get: () => apiClient.get<unknown, DonationPointRule>('/donation-point-rules'),
  update: (pointsPerKg: number) =>
    apiClient.put('/donation-point-rules', { pointsPerKg }),
};
