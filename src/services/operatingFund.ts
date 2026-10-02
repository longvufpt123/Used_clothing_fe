import { apiClient } from './api';
export interface FundSummary {
  totalReceived: number;
  totalSpent: number;
  balance: number;
  contributions: number;
  paymentEnabled: boolean;
}
export interface Contribution {
  id: string;
  orderCode: number;
  amount: number;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  checkoutUrl?: string;
}
export interface Expense {
  id: string;
  amount: number;
  title: string;
  description: string;
  spentOn: string;
  publishedAt: string;
  publishedBy: string;
  voidedAt?: string;
  voidReason?: string;
}
export interface FundPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface FundStatement {
  id: string;
  month: string;
  closingBalance: number;
  note: string;
  publishedBy: string;
  publishedAt: string;
}
export interface StatementStatus {
  startMonth: string;
  latestClosedMonth: string;
  missingMonths: string[];
}
export const operatingFund = {
  statements: (page = 1) =>
    apiClient.get<unknown, FundPage<FundStatement>>('/operating-fund/statements', {
      params: { page },
    }),
  statementStatus: () =>
    apiClient.get<unknown, StatementStatus>('/operating-fund/statements/status'),
  publishStatement: (data: FormData) =>
    apiClient.post('/operating-fund/statements', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  statementDocument: (id: string) =>
    apiClient.get<unknown, Blob>(`/operating-fund/statements/${id}/document`, {
      responseType: 'blob',
    }),
  contributions: (page = 1) =>
    apiClient.get<unknown, FundPage<Contribution>>('/operating-fund/contributions', {
      params: { page },
    }),
  summary: () => apiClient.get<unknown, FundSummary>('/operating-fund/summary'),
  mine: (page = 1) =>
    apiClient.get<unknown, FundPage<Contribution>>('/operating-fund/mine', { params: { page } }),
  expenses: (page = 1) =>
    apiClient.get<unknown, FundPage<Expense>>('/operating-fund/expenses', { params: { page } }),
  checkout: (requestKey: string, amount: number) =>
    apiClient.post<unknown, Contribution>('/operating-fund/checkout', { requestKey, amount }),
  refresh: (id: string) =>
    apiClient.post<unknown, Contribution>(`/operating-fund/contributions/${id}/refresh`),
  publish: (data: FormData) =>
    apiClient.post('/operating-fund/expenses', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  void: (id: string, reason: string) =>
    apiClient.post(`/operating-fund/expenses/${id}/void`, { reason }),
  receipt: (id: string) =>
    apiClient.get<unknown, Blob>(`/operating-fund/expenses/${id}/receipt`, {
      responseType: 'blob',
    }),
};
