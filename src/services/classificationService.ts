import apiClient from './api';

export interface ClassificationBatchSummary { id:string; batchCode:string; routeName:string; intakeDate:string; totalWeight:number; status:string; donationRequests:number; classifiedItems:number; }
export interface ClassifiedItem { id:string; itemCode:string; fabricType:string; garmentGroup:string; clothingType:string; gender:string; targetUser:string; size:string; conditionGrade:'A'|'B'|'C'; processingDirection:string; imageUrls:string[]; notes?:string; classifiedAt:string; }
export interface ClassificationBatchDetail extends ClassificationBatchSummary { items:ClassifiedItem[]; }
export interface ConditionOption { id:string; text:string; grade:'A'|'B'|'C'; }
export interface ConditionQuestion { id:string; text:string; displayOrder:number; options:ConditionOption[]; }
export interface ClassificationCatalog { fabricTypes:string[]; clothingTypes:Record<string,string[]>; genders:string[]; targetUsers:string[]; sizes:string[]; conditionQuestions:ConditionQuestion[]; }
export interface ClassifyItemPayload { fabricType:string; garmentGroup:string; clothingType:string; gender:string; targetUser:string; size:string; imageUrls:string[]; notes?:string; answers:{questionId:string;answerId:string}[]; }
export interface GroupedClassifiedBatch { id:string; batchCode:string; classificationDate:string; fabricType:string; garmentGroup:string; clothingType:string; gender:string; targetUser:string; size:string; conditionGrade:'A'|'B'|'C'; processingDirection:string; totalItem:number; status:string; }
export interface GroupedClassifiedBatchDetail extends GroupedClassifiedBatch { items:ClassifiedItem[]; }

export const classificationService = {
  getBatches: () => apiClient.get<unknown,ClassificationBatchSummary[]>('/classification-operations/batches'),
  getBatch: (id:string) => apiClient.get<unknown,ClassificationBatchDetail>(`/classification-operations/batches/${id}`),
  getCatalog: () => apiClient.get<unknown,ClassificationCatalog>('/classification-operations/catalog'),
  startBatch: (id:string) => apiClient.post(`/classification-operations/batches/${id}/start`),
  confirmReceipt: (id:string) => apiClient.post(`/classification-operations/batches/${id}/confirm-receipt`),
  classifyItem: (id:string,payload:ClassifyItemPayload) => apiClient.post<unknown,ClassifiedItem>(`/classification-operations/batches/${id}/items`,payload),
  completeBatch: (id:string) => apiClient.post(`/classification-operations/batches/${id}/complete`),
  getGroupedBatches: (date?:string) => apiClient.get<unknown,GroupedClassifiedBatch[]>('/classification-operations/grouped-batches',{params:{date}}),
  getGroupedBatch: (id:string) => apiClient.get<unknown,GroupedClassifiedBatchDetail>(`/classification-operations/grouped-batches/${id}`),
};
