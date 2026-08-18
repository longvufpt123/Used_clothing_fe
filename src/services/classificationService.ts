import apiClient from './api';

export interface ClassificationBatchSummary {
  id: string;
  batchCode: string;
  routeName: string;
  intakeDate: string;
  totalWeight: number;
  status: string;
  donationRequests: number;
  classifiedItems: number;
  countedItemCount?: number | null;
  countedTotalWeight?: number | null;
  countedAt?: string | null;
  classificationAreaName?: string | null;
  classifiedAreaPlacedAt?: string | null;
  classificationTeamId?: string | null;
  classificationTeamName?: string | null;
  teamStatus?: string | null;
  currentAreaName?: string | null;
  teamShiftDate?: string | null;
  teamShiftStartTime?: string | null;
  teamShiftEndTime?: string | null;
}
export interface ClassifiedItem {
  id: string;
  itemCode: string;
  fabricType: string;
  garmentGroup: string;
  clothingType: string;
  gender: string;
  targetUser: string;
  size: string;
  conditionGrade: 'A' | 'B' | 'C';
  processingDirection: string;
  imageUrls: string[];
  notes?: string;
  classifiedAt: string;
  fabricTypeId?: string | null;
  garmentGroupId?: string | null;
  clothingTypeId?: string | null;
  genderId?: string | null;
  targetUserId?: string | null;
  sizeId?: string | null;
  answers: { questionId: string; answerId: string }[];
}
export interface ClassificationBatchDetail extends ClassificationBatchSummary {
  countingNotes?: string | null;
  items: ClassifiedItem[];
}
export interface ConditionOption {
  id: string;
  text: string;
  grade: 'A' | 'B' | 'C';
}
export interface ConditionQuestion {
  id: string;
  text: string;
  displayOrder: number;
  options: ConditionOption[];
}
export interface CategoryOption {
  id: string;
  code: string;
  name: string;
  parentId?: string | null;
  sortOrder: number;
}
export interface ClassificationCatalog {
  fabricTypes: CategoryOption[];
  garmentGroups: CategoryOption[];
  clothingTypes: CategoryOption[];
  genders: CategoryOption[];
  targetUsers: CategoryOption[];
  sizes: CategoryOption[];
  conditionGrades: CategoryOption[];
  conditionQuestions: ConditionQuestion[];
}
export interface ClassifyItemPayload {
  fabricTypeId: string;
  garmentGroupId: string;
  clothingTypeId: string;
  genderId: string;
  targetUserId: string;
  sizeId: string;
  imageUrls: string[];
  notes?: string;
  answers: { questionId: string; answerId: string }[];
}
export interface AiClassificationSuggestion {
  fabricTypeId: string;
  garmentGroupId: string;
  clothingTypeId: string;
  genderId: string;
  targetUserId: string;
  sizeId: string;
  answers: { questionId: string; answerId: string }[];
  confidence: number;
  summary: string;
}
export interface GroupedClassifiedBatch {
  id: string;
  batchCode: string;
  classificationDate: string;
  fabricType: string;
  garmentGroup: string;
  clothingType: string;
  gender: string;
  targetUser: string;
  size: string;
  conditionGrade: 'A' | 'B' | 'C';
  processingDirection: string;
  totalItem: number;
  totalWeight: number;
  status: string;
  classificationAreaName?: string | null;
  placedInClassificationAreaAt?: string | null;
  storageLocationId?: string | null;
  donationRequestCodes: string[];
}
export interface GroupedClassifiedBatchDetail extends GroupedClassifiedBatch {
  items: ClassifiedItem[];
}
export interface BulkWarehouseHandoffResult {
  sent: number;
  skipped: number;
}
export interface ClassificationAreaLayout {
  warehouseId: string;
  warehouseName: string;
  areas: {
    id: string; areaName: string; description?: string; capacityKg: number; currentKg: number;
    groups: {
      id: string; groupName: string; description?: string; capacityKg: number; currentKg: number;
      locations: {
        id: string; locationCode: string; aisleCode: string; rackCode: string;
        shelfCode: string; binCode: string; capacityKg: number; currentWeightKg: number; status: string;
      }[];
      batches: GroupedClassifiedBatch[];
    }[];
  }[];
  unassignedBatches: GroupedClassifiedBatch[];
}

export interface ClassificationManagementBoard {
  warehouses: { id: string; name: string; address: string }[];
  staff: {
    id: string;
    fullName: string;
    userName: string;
    phoneNumber: string;
    warehouseId?: string | null;
  }[];
  teams: {
    id: string;
    shiftId: string;
    teamName: string;
    status: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    warehouseId: string;
    warehouseName: string;
    startedAt?: string | null;
    completedAt?: string | null;
    members: { id: string; fullName: string; phoneNumber: string }[];
    assignedBatches: number;
    completedBatches: number;
  }[];
  batches: {
    id: string;
    batchCode: string;
    status: string;
    warehouseId: string;
    warehouseName: string;
    totalWeight: number;
    donationRequests: number;
    teamId?: string | null;
    teamName?: string | null;
    currentAreaName?: string | null;
    sentAt?: string | null;
  }[];
}

export const classificationService = {
  getBatches: () =>
    apiClient.get<unknown, ClassificationBatchSummary[]>('/classification-operations/batches'),
  getBatch: (id: string) =>
    apiClient.get<unknown, ClassificationBatchDetail>(`/classification-operations/batches/${id}`),
  getCatalog: () =>
    apiClient.get<unknown, ClassificationCatalog>('/classification-operations/catalog'),
  analyzeImages: (imageDataUrls: string[]) =>
    apiClient.post<unknown, AiClassificationSuggestion>(
      '/classification-operations/analyze-images',
      { imageDataUrls },
      { timeout: 120000 },
    ),
  startBatch: (id: string) => apiClient.post(`/classification-operations/batches/${id}/start`),
  confirmReceipt: (id: string) =>
    apiClient.post(`/classification-operations/batches/${id}/confirm-receipt`),
  countBatch: (id: string, payload: { itemCount: number; totalWeightKg: number; notes?: string }) =>
    apiClient.put(`/classification-operations/batches/${id}/count`, payload),
  classifyItem: (id: string, payload: ClassifyItemPayload) =>
    apiClient.post<unknown, ClassifiedItem>(
      `/classification-operations/batches/${id}/items`,
      payload,
    ),
  updateItem: (batchId: string, itemId: string, payload: ClassifyItemPayload) =>
    apiClient.put<unknown, ClassifiedItem>(
      `/classification-operations/batches/${batchId}/items/${itemId}`,
      payload,
    ),
  deleteItem: (batchId: string, itemId: string) =>
    apiClient.delete(`/classification-operations/batches/${batchId}/items/${itemId}`),
  completeBatch: (id: string) =>
    apiClient.post(`/classification-operations/batches/${id}/complete`),
  startTeam: (id: string) => apiClient.post(`/classification-operations/teams/${id}/start`),
  completeTeam: (id: string) => apiClient.post(`/classification-operations/teams/${id}/complete`),
  getManagementBoard: (warehouseId?: string, date?: string) =>
    apiClient.get<unknown, ClassificationManagementBoard>('/classification-management/board', {
      params: { warehouseId, date },
    }),
  assignBatch: (batchId: string, teamId: string) =>
    apiClient.post(`/classification-management/batches/${batchId}/assign`, { teamId }),
  getGroupedBatches: (date?: string) =>
    apiClient.get<unknown, GroupedClassifiedBatch[]>('/classification-operations/grouped-batches', {
      params: { date },
    }),
  getClassifiedAreaLayout: (date?: string) =>
    apiClient.get<unknown, ClassificationAreaLayout>(
      '/classification-operations/classified-area-layout', { params: { date } },
    ),
  getGroupedBatch: (id: string) =>
    apiClient.get<unknown, GroupedClassifiedBatchDetail>(
      `/classification-operations/grouped-batches/${id}`,
    ),
  placeGroupedBatch: (id: string, areaId: string, groupId: string, storageLocationId: string, actualWeightKg: number) =>
    apiClient.post(`/classification-operations/grouped-batches/${id}/place`, {
      areaId,
      groupId,
      storageLocationId,
      actualWeightKg,
    }),
  sendGroupedBatchToWarehouse: (id: string) =>
    apiClient.post(`/classification-operations/grouped-batches/${id}/send-to-warehouse`),
  sendGroupedBatchesToWarehouse: (ids: string[]) =>
    apiClient.post<unknown, BulkWarehouseHandoffResult>(
      '/classification-operations/grouped-batches/send-to-warehouse',
      { groupedBatchIds: ids },
    ),
};
