import apiClient from './api';

export interface GenerateShiftsDto {
  startDate: string;
  endDate: string;
}

export interface CreateReceivingTeamDto {
  teamName: string;
  leaderId?: string;
  memberIds?: string[];
}

export interface PlanReceivingShiftDto {
  shiftId: string;
  teamId: string;
  donationRequestIds: string[];
}

export interface ApiProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status?: string;
  createdAt?: string;
}

export interface ApiShift {
  id: string;
  shiftName: string;
  date: string;
  status: string;
}

export const managerService = {
  // Collection Scheduling
  generateStandardShifts: (dto: GenerateShiftsDto) =>
    apiClient.post('/receiving-operations/standard-shifts', dto),

  createTeam: (dto: CreateReceivingTeamDto) =>
    apiClient.post<{ id: string }>('/receiving-operations/teams', dto),

  planShift: (dto: PlanReceivingShiftDto) =>
    apiClient.post<{ plannedRequests: number }>('/receiving-operations/plan', dto),

  getShifts: () =>
    apiClient.get<unknown, ApiShift[]>('/shifts'),

  // Staff & User Management
  getProfiles: () =>
    apiClient.get<unknown, ApiProfile[]>('/profiles'),

  getTeamMembers: () =>
    apiClient.get<unknown, any[]>('/team-members'),

  // Reports & Analytics Data
  getInventoriesSummary: () =>
    apiClient.get<unknown, any[]>('/inventories'),

  getCharityInventory: () =>
    apiClient.get<unknown, any[]>('/inventories'),

  getDetailedClassification: () =>
    apiClient.get<unknown, any[]>('/classification-operations/grouped-batches'),

  getClassificationResults: () =>
    apiClient.get<unknown, any[]>('/classification-results'),
};

export default managerService;
