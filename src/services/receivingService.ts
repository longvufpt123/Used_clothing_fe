import apiClient from './api';

export type ReceivingStatus = 'Pending' | 'Received' | 'Rescheduled' | 'Canceled';
export interface TeamMember {
  id: string;
  fullName: string;
  phoneNumber: string;
}
export interface ReceivingRequest {
  id: string;
  batchId: string;
  code: string;
  donorName: string;
  phoneNumber: string;
  pickupAddress: string;
  deliveryMethod: string;
  category: string;
  weight: string;
  condition: string;
  status: ReceivingStatus;
  date: string;
  actualWeight?: number | null;
  actualCategory?: string;
  actualCondition?: string;
  actualNotes?: string;
  imageUrls?: string[];
}
export interface ReceivingBatch {
  id: string;
  code: string;
  route: string;
  date: string;
  shiftId: string;
  shiftName: string;
  shiftStatus: string;
  startTime: string;
  endTime: string;
  teamName: string;
  warehouseAddress: string;
  teamMembers: TeamMember[];
  status: 'Planned' | 'Receiving' | 'Completed' | 'SentToClassification';
  requests: ReceivingRequest[];
}
interface ApiRequest {
  id: string;
  batchId: string;
  code: string;
  donorName: string;
  phoneNumber: string;
  pickupAddress: string;
  deliveryMethod: string;
  description: string;
  estimateWeight: number;
  actualWeight?: number | null;
  pickupDate?: string;
  status: string;
  notes?: string;
  imageUrls?: string[];
}
interface ApiBatch {
  id: string;
  code: string;
  route: string;
  date: string;
  shiftId: string;
  shiftName: string;
  shiftStatus: string;
  startTime: string;
  endTime: string;
  teamName: string;
  warehouseAddress: string;
  teamMembers: TeamMember[];
  status: ReceivingBatch['status'];
  requests: ApiRequest[];
}
export interface DispatchRequest {
  id: string;
  code: string;
  contactName: string;
  phoneNumber: string;
  deliveryMethod: string;
  address: string;
  scheduledDate?: string;
  warehouseId: string;
  warehouseName: string;
  createdAt?: string;
}
export interface DispatchTeam {
  id: string;
  teamName: string;
  teamType: string;
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  shiftTime: string;
  warehouseId: string;
  members: TeamMember[];
}
export interface DispatchBoard {
  requests: DispatchRequest[];
  teams: DispatchTeam[];
}
export interface WarehouseDutyContext {
  teamId: string;
  teamName: string;
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftStatus: string;
  warehouseId: string;
  warehouseName: string;
  warehouseAddress: string;
  intakeBatchId?: string | null;
}
export interface WarehouseDropOffItem {
  id: string;
  warehouseId: string;
  code: string;
  contactName: string;
  phoneNumber: string;
  address: string;
  expectedDate: string;
  description: string;
  estimateWeight: number;
  status: string;
  imageUrls?: string[];
}
export interface WarehouseDropOffBoard {
  dutyContexts: WarehouseDutyContext[];
  requests: WarehouseDropOffItem[];
}
export interface ManagerWarehouseOption {
  id: string;
  name: string;
  address: string;
}
export interface ManagerStaffOption {
  id: string;
  fullName: string;
  userName: string;
  phoneNumber: string;
  warehouseId?: string | null;
}
export interface ManagerAssignedRequest {
  id: string;
  code: string;
  contactName: string;
  phoneNumber: string;
  address: string;
  pickupDate?: string | null;
  deliveryMethod: string;
  status: string;
  routeOrder: number;
}
export interface ManagerTeamOverview {
  id: string;
  teamName: string;
  teamType: string;
  status: string;
  startedAt?: string | null;
  startedByStaffId?: string | null;
  completedAt?: string | null;
  completedByStaffId?: string | null;
  members: TeamMember[];
  intakeBatchId?: string | null;
  intakeBatchCode?: string | null;
  intakeBatchStatus?: string | null;
  intakeBatchRoute?: string | null;
  intakeBatchWeight: number;
  requests: ManagerAssignedRequest[];
}
export interface ManagerShiftOverview {
  id: string;
  warehouseId: string;
  warehouseName: string;
  shiftName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  status: string;
  teams: ManagerTeamOverview[];
  assignedRequests: number;
  pendingDropOffRequests: number;
  /** @deprecated Legacy single-team fields; use teams. */
  team?: ManagerTeamOverview | null;
  intakeBatchId?: string | null;
  intakeBatchCode?: string | null;
  intakeBatchStatus?: string | null;
  intakeBatchRoute?: string | null;
  intakeBatchWeight?: number;
}
export interface ManagerReceivingSetup {
  warehouses: ManagerWarehouseOption[];
  receivingStaff: ManagerStaffOption[];
  shifts: ManagerShiftOverview[];
}
export interface ManagerShiftQuery {
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
}
export interface GenerateYearShiftsResult {
  workingDays: number;
  createdShifts: number;
  skippedExisting: number;
}
export interface GenerateMonthShiftsResult {
  workingDays: number;
  createdShifts: number;
  skippedExisting: number;
}
export interface ShiftDefinitionInput {
  name: string;
  startTime: string;
  endTime: string;
}
export interface GenerateShiftsParams {
  warehouseId: string;
  startDate: string;
  periodUnit: number; // 0: Day, 1: Week, 2: Month, 3: Quarter, 4: Year, 5: Custom
  periodValue: number;
  customEndDate?: string | null;
  workingDays?: number[];
  excludedDates?: string[];
  shiftDefinitions?: ShiftDefinitionInput[];
}
export interface GenerateShiftsResult {
  startDate: string;
  endDate: string;
  workingDays: number;
  createdShifts: number;
  skippedExisting: number;
}

const mapBatch = (b: ApiBatch): ReceivingBatch => ({
  ...b,
  date: b.date.slice(0, 10),
  requests: b.requests.map((r) => ({
    ...r,
    category: r.description || 'Quần áo hỗn hợp',
    weight: `${r.estimateWeight} kg`,
    condition: 'Chờ kiểm tra thực tế',
    status: (r.status === 'Cancelled'
      ? 'Canceled'
      : r.status === 'Received' || r.status === 'Rescheduled'
        ? r.status
        : 'Pending') as ReceivingStatus,
    date: r.pickupDate?.slice(0, 10) || b.date.slice(0, 10),
    actualNotes: r.notes,
  })),
});

export const receivingService = {
  async getMyBatches() {
    const data = await apiClient.get<unknown, ApiBatch[]>('/receiving-operations/my-batches');
    return data.map(mapBatch);
  },
  async getMyBatch(id: string) {
    const data = await apiClient.get<unknown, ApiBatch>(`/receiving-operations/my-batches/${id}`);
    return mapBatch(data);
  },
  async findMyRequest(id: string) {
    const batches = await this.getMyBatches();
    return batches.flatMap((b) => b.requests).find((r) => r.id === id);
  },
  startBatch: (id: string) => apiClient.post(`/receiving-operations/my-batches/${id}/start`),
  completeShift: (id: string) => apiClient.post(`/receiving-operations/my-shifts/${id}/complete`),
  completeBatch: (id: string) => apiClient.post(`/receiving-operations/my-batches/${id}/complete`),
  sendToClassification: (id: string) =>
    apiClient.post(`/receiving-operations/my-batches/${id}/send-to-classification`),
  confirmPickup: (
    batchId: string,
    requestId: string,
    data: { actualWeight: number; notes?: string; imageUrls?: string[] },
  ) =>
    apiClient.post(
      `/receiving-operations/my-batches/${batchId}/requests/${requestId}/confirm`,
      data,
    ),
  getMyWarehouseDropOffs: () =>
    apiClient.get<unknown, WarehouseDropOffBoard>('/receiving-operations/my-warehouse-dropoffs'),
  confirmWarehouseDropOff: (
    requestId: string,
    data: { actualWeight: number; notes?: string; imageUrls?: string[] },
  ) => apiClient.post(`/receiving-operations/my-warehouse-dropoffs/${requestId}/confirm`, data),
  reschedule: (batchId: string, requestId: string, pickupDate: string, reason?: string) =>
    apiClient.post(`/receiving-operations/my-batches/${batchId}/requests/${requestId}/reschedule`, {
      pickupDate,
      reason,
    }),
  reject: (batchId: string, requestId: string, reason: string) =>
    apiClient.post(`/receiving-operations/my-batches/${batchId}/requests/${requestId}/reject`, {
      reason,
    }),
  getDispatchBoard: () =>
    apiClient.get<unknown, DispatchBoard>('/receiving-operations/dispatch-board'),
  assignRequest: (requestId: string, teamId: string) =>
    apiClient.post('/receiving-operations/assign-request', { requestId, teamId }),
  getManagerSetup: () =>
    apiClient.get<unknown, ManagerReceivingSetup>('/receiving-operations/manager-setup'),
  getManagerWarehouses: () =>
    apiClient.get<unknown, ManagerWarehouseOption[]>('/receiving-operations/manager/warehouses'),
  getManagerReceivingStaff: (warehouseId?: string) =>
    apiClient.get<unknown, ManagerStaffOption[]>(
      `/receiving-operations/manager/receiving-staff${warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : ''}`,
    ),
  getManagerShifts: (query: ManagerShiftQuery = {}) => {
    const params = new URLSearchParams();
    if (query.warehouseId) params.set('warehouseId', query.warehouseId);
    if (query.fromDate) params.set('fromDate', query.fromDate);
    if (query.toDate) params.set('toDate', query.toDate);
    return apiClient.get<unknown, ManagerShiftOverview[]>(
      `/receiving-operations/manager/shifts${params.size ? `?${params.toString()}` : ''}`,
    );
  },
  generateShifts: (data: GenerateShiftsParams) =>
    apiClient.post<unknown, GenerateShiftsResult>('/receiving-operations/shifts/generate', data),
  generateStandardShifts: (warehouseId: string, date: string) =>
    apiClient.post('/receiving-operations/standard-shifts', { warehouseId, date }),
  generateYearShifts: (
    warehouseId: string,
    year: number,
    holidayDates: string[],
    workingDays: number[] = [1, 2, 3, 4, 5],
    times = {
      morningStartTime: '08:00:00',
      morningEndTime: '11:00:00',
      afternoonStartTime: '13:00:00',
      afternoonEndTime: '17:00:00',
    },
  ) =>
    apiClient.post<unknown, GenerateYearShiftsResult>('/receiving-operations/year-shifts', {
      warehouseId,
      year,
      holidayDates,
      workingDays,
      ...times,
    }),
  generateMonthShifts: (
    warehouseId: string,
    year: number,
    month: number,
    holidayDates: string[],
    workingDays: number[] = [1, 2, 3, 4, 5],
    times = {
      morningStartTime: '08:00:00',
      morningEndTime: '11:00:00',
      afternoonStartTime: '13:00:00',
      afternoonEndTime: '17:00:00',
    },
  ) =>
    apiClient.post<unknown, GenerateMonthShiftsResult>('/receiving-operations/month-shifts', {
      warehouseId,
      year,
      month,
      holidayDates,
      workingDays,
      ...times,
    }),
  deleteYearShifts: (warehouseId: string, year: number) =>
    apiClient.delete<unknown, { deletedShifts: number; skippedOperationalShifts: number }>(
      `/receiving-operations/year-shifts?warehouseId=${warehouseId}&year=${year}`,
    ),
  updateShift: (
    shiftId: string,
    data: {
      warehouseId: string;
      shiftName: string;
      shiftDate: string;
      startTime: string;
      endTime: string;
    },
  ) => apiClient.put(`/receiving-operations/manager-shifts/${shiftId}`, data),
  deleteShift: (shiftId: string) =>
    apiClient.delete(`/receiving-operations/manager-shifts/${shiftId}`),
  createTeam: (
    shiftId: string,
    teamName: string,
    staffIds: string[],
    teamType = 'ReceivingPickup',
  ) => apiClient.post('/receiving-operations/teams', { shiftId, teamName, staffIds, teamType }),
  updateTeam: (teamId: string, teamName: string, staffIds: string[]) =>
    apiClient.put(`/receiving-operations/teams/${teamId}`, { teamName, staffIds }),
  deleteTeam: (teamId: string) => apiClient.delete(`/receiving-operations/teams/${teamId}`),
  planShift: (shiftId: string, teamId: string) =>
    apiClient.post<unknown, { plannedRequests: number }>('/receiving-operations/plan', {
      shiftId,
      teamId,
    }),
  autoBalanceShift: (shiftId: string) =>
    apiClient.post<
      unknown,
      { teamCount: number; requestCount: number; requestsPerTeam: Record<string, number> }
    >(`/receiving-operations/auto-balance/${shiftId}`),
};
