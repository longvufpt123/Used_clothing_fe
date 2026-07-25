import apiClient from './api';
import type { ClassifiedItem } from './classificationService';

export interface WarehouseDashboard {
  pendingReceipt:number; awaitingPutaway:number; storedBatches:number;
  availableQuantity:number; inventorySkuCount:number; availableWeightKg:number; capacityUsedPercent:number;
}
export interface WarehouseLocationLayout {
  id:string; locationCode:string; aisleCode:string; rackCode:string; shelfCode:string; binCode:string;
  preferredGarmentGroup?:string; preferredProcessingDirection?:string; capacityKg:number;
  currentWeightKg:number; status:string; inventoryCount:number; itemQuantity:number;
}
export interface WarehouseAreaLayout {
  id:string; areaName:string; description?:string; capacityKg:number; currentWeightKg:number;
  groups:{id:string;groupName:string;description?:string;capacityKg:number;currentWeightKg:number}[];
  locations:WarehouseLocationLayout[];
}
export interface WarehouseLayout {
  warehouseId:string; warehouseName:string; address:string; capacityKg:number;
  currentWeightKg:number; areas:WarehouseAreaLayout[];
}
export interface WarehouseBatch {
  id:string; batchCode:string; classificationDate:string; fabricType:string; garmentGroup:string;
  clothingType:string; gender:string; targetUser:string; size:string; conditionGrade:'A'|'B'|'C';
  processingDirection:string; expectedItemCount:number; expectedWeightKg:number; status:string;
  sentAt?:string; receivedAt?:string; receivedWeightKg?:number; receivedItemCount?:number;
  receiptNotes?:string; items:ClassifiedItem[];
}
export interface StorageLocation {
  id:string; locationCode:string; areaName:string; aisleCode:string; rackCode:string;
  shelfCode:string; binCode:string; preferredGarmentGroup?:string;
  preferredProcessingDirection?:string; capacityKg:number; currentWeightKg:number;
  availableCapacityKg:number; status:string; matchScore:number;
}
export interface WarehouseInventory {
  id:string; sku:string; classifiedBatchId:string; batchCode:string; locationCode:string; areaName:string;
  fabricType:string; garmentGroup:string; clothingType:string; gender:string; targetUser:string; size:string;
  conditionGrade:'A'|'B'|'C'; processingDirection:string; quantity:number; reservedQuantity:number;
  availableQuantity:number; totalWeightKg:number; reservedWeightKg:number; availableWeightKg:number;
  status:string; storedAt?:string;
}
export interface TransactionItem {
  id:string; inventoryId:string; sku:string; classifiedBatchCode?:string; quantity:number; weightKg:number;
  quantityBefore:number; quantityAfter:number; weightBefore:number; weightAfter:number;
  sourceLocationCode?:string; destinationLocationCode?:string; notes?:string;
}
export interface WarehouseTransaction {
  id:string; transactionCode:string; transactionType:'RECEIPT'|'PUTAWAY'|'MOVE'|'OUT'|string;
  referenceType?:string; referenceId?:string; status:string; notes?:string; performedAt:string;
  performedBy:string; items:TransactionItem[];
}

export const warehouseService = {
  dashboard: () => apiClient.get<unknown,WarehouseDashboard>('/warehouse-operations/dashboard'),
  layout: () => apiClient.get<unknown,WarehouseLayout>('/warehouse-operations/layout'),
  inboundBatches: () => apiClient.get<unknown,WarehouseBatch[]>('/warehouse-operations/inbound-batches'),
  getBatch: (id:string) => apiClient.get<unknown,WarehouseBatch>(`/warehouse-operations/batches/${id}`),
  confirmReceipt: (id:string,data:{actualWeightKg:number;actualItemCount:number;sealIntact:boolean;discrepancyNotes?:string}) =>
    apiClient.post(`/warehouse-operations/batches/${id}/confirm-receipt`,data),
  locations: (id:string) => apiClient.get<unknown,StorageLocation[]>(`/warehouse-operations/batches/${id}/locations`),
  putaway: (id:string,data:{locationId:string;notes?:string}) =>
    apiClient.post(`/warehouse-operations/batches/${id}/putaway`,data),
  inventory: (search?:string) => apiClient.get<unknown,WarehouseInventory[]>('/warehouse-operations/inventory',{params:{search}}),
  transactions: (type?:string) => apiClient.get<unknown,WarehouseTransaction[]>('/warehouse-operations/transactions',{params:{type}}),
  issue: (id:string,data:{quantity:number;weightKg:number;reason:string;referenceType?:string;referenceId?:string;notes?:string}) =>
    apiClient.post(`/warehouse-operations/inventory/${id}/issue`,data),
  move: (id:string,data:{destinationLocationId:string;reason:string;notes?:string}) =>
    apiClient.post(`/warehouse-operations/inventory/${id}/move`,data),
};
