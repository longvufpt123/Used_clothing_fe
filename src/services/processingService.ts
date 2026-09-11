import apiClient from './api';

export type ProcessingType = 'Recycling' | 'Disposal';
export interface ProcessingCatalogItem {
  inventoryId: string;
  sku: string;
  batchCode?: string;
  operationType: ProcessingType;
  grade: string;
  quantity: number;
  weight: number;
  locationCode?: string;
  isLocked: boolean;
  lockReason?: string;
}
export interface ProcessingCatalog {
  warehouses: { id: string; warehouseName: string }[];
  organizations: {
    id: string;
    fullName: string;
    operationType: ProcessingType;
  }[];
  items: ProcessingCatalogItem[];
}
export interface ProcessingOperation {
  id: string;
  operationCode: string;
  operationType: ProcessingType;
  status: string;
  warehouseId: string;
  warehouseName: string;
  organizationId: string;
  organizationName: string;
  requestedAt: string;
  inputCount: number;
  totalRequestedQuantity: number;
  totalRequestedWeight: number;
}
export interface ProcessingDetail extends Omit<
  ProcessingOperation,
  'inputCount' | 'totalRequestedQuantity' | 'totalRequestedWeight'
> {
  recyclingReturn?: {
    expectedReturnDate?: string;
    dispatchedAt?: string;
    receivedAt?: string;
    carrierName?: string;
    trackingCode?: string;
    notes?: string;
    batches: RecyclingReturnBatch[];
  };
  shipping?: {
    warehouseAddress: string;
    warehousePhone?: string;
    recipientPhone: string;
    recipientAddress: string;
    ghnOrderCode?: string;
    ghnStatus?: string;
    ghnUpdatedAt?: string;
    history: { status: string; description?: string; occurredAt: string }[];
  };
  organizationRespondedAt?: string;
  managerRespondedAt?: string;
  approvedAt?: string;
  issuedAt?: string;
  organizationReceivedAt?: string;
  processingCompletedAt?: string;
  trackingCode?: string;
  carrierName?: string;
  requestNotes?: string;
  organizationRejectionReason?: string;
  managerRejectionReason?: string;
  completionNotes?: string;
  inputs: {
    id: string;
    inventoryId: string;
    inventorySku: string;
    classifiedBatchCode?: string;
    requestedQuantity: number;
    requestedWeight: number;
    issuedQuantity: number;
    issuedWeight: number;
  }[];
}
export interface CreateProcessingOperation {
  operationType: ProcessingType;
  warehouseId: string;
  organizationId: string;
  requestNotes: string;
  inputs: {
    inventoryId: string;
    requestedQuantity: number;
    requestedWeight: number;
  }[];
}
const base = '/processing-operations';
export interface RecyclingReturnBatch {
  outputId: string;
  description: string;
  quantity: number;
  weight: number;
  receivedQuantity: number;
  receivedWeight: number;
  receiptNotes?: string;
  intakeBatchId?: string;
  batchCode?: string;
  status?: string;
  areaName?: string;
  locationCode?: string;
  classificationTeamName?: string;
}
export interface RecyclingReceiptOptions {
  shifts: { id: string; name: string; date: string }[];
  locations: { id: string; code: string; areaName: string; availableKg: number }[];
}
export const processingService = {
  returnReceiptOptions: (id: string) =>
    apiClient.get<unknown, RecyclingReceiptOptions>(`${base}/${id}/return-receipt-options`),
  scheduleReturn: (id: string, body: { expectedReturnDate: string; notes: string }) =>
    apiClient.post(`${base}/${id}/organization/return-schedule`, body),
  dispatchReturn: (
    id: string,
    body: {
      carrierName: string;
      trackingCode: string;
      completionNotes: string;
      batches: { description: string; quantity: number; weight: number }[];
    },
  ) => apiClient.post(`${base}/${id}/organization/return-dispatch`, body),
  receiveReturn: (
    id: string,
    body: {
      shiftId: string;
      batches: {
        outputId: string;
        storageLocationId: string;
        quantity: number;
        weight: number;
        notes: string;
      }[];
    },
  ) => apiClient.post(`${base}/${id}/return-receive`, body),
  list: () => apiClient.get<unknown, ProcessingOperation[]>(base),
  detail: (id: string) => apiClient.get<unknown, ProcessingDetail>(`${base}/${id}`),
  catalog: (warehouseId?: string, operationType?: ProcessingType) =>
    apiClient.get<unknown, ProcessingCatalog>(`${base}/catalog`, {
      params: { warehouseId, operationType },
    }),
  create: (body: CreateProcessingOperation) => apiClient.post<unknown, { id: string }>(base, body),
  action: (id: string, action: string, body: Record<string, string> = {}) =>
    apiClient.post(`${base}/${id}/${action}`, body),
  createGhn: (id: string, body: Record<string, string | number>) =>
    apiClient.post(`${base}/${id}/ghn`, body),
};
