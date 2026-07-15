import apiClient from './api';

export type ReceivingStatus = 'Pending' | 'Received' | 'Rescheduled' | 'Canceled';
export interface ReceivingRequest { id:string; batchId:string; code:string; donorName:string; phoneNumber:string; pickupAddress:string; category:string; weight:string; condition:string; status:ReceivingStatus; date:string; actualWeight?:number|null; actualCategory?:string; actualCondition?:string; actualNotes?:string; imageUrls?:string[]; }
export interface ReceivingBatch { id:string; code:string; route:string; date:string; shiftId:string; shiftName:string; shiftStatus:string; startTime:string; endTime:string; status:'Planned'|'Receiving'|'Completed'|'Transferring'; requests:ReceivingRequest[]; }
interface ApiRequest { id:string; batchId:string; code:string; donorName:string; phoneNumber:string; pickupAddress:string; description:string; estimateWeight:number; actualWeight?:number|null; pickupDate?:string; status:string; notes?:string; imageUrls?:string[]; }
interface ApiBatch { id:string; code:string; route:string; date:string; shiftId:string; shiftName:string; shiftStatus:string; startTime:string; endTime:string; status:ReceivingBatch['status']; requests:ApiRequest[]; }

const mapBatch = (b:ApiBatch):ReceivingBatch => ({...b,date:b.date.slice(0,10),requests:b.requests.map(r=>({...r,category:r.description||'Quần áo hỗn hợp',weight:`${r.estimateWeight} kg`,condition:'Chờ kiểm tra thực tế',status:(r.status==='Cancelled'?'Canceled':r.status==='Received'||r.status==='Rescheduled'?r.status:'Pending') as ReceivingStatus,date:r.pickupDate?.slice(0,10)||b.date.slice(0,10),actualNotes:r.notes}))});

export const receivingService = {
  async getMyBatches(){ const data=await apiClient.get<unknown,ApiBatch[]>('/receiving-operations/my-batches'); return data.map(mapBatch); },
  async getMyBatch(id:string){ const data=await apiClient.get<unknown,ApiBatch>(`/receiving-operations/my-batches/${id}`); return mapBatch(data); },
  async findMyRequest(id:string){ const batches=await this.getMyBatches(); return batches.flatMap(b=>b.requests).find(r=>r.id===id); },
  startBatch:(id:string)=>apiClient.post(`/receiving-operations/my-batches/${id}/start`),
  completeShift:(id:string)=>apiClient.post(`/receiving-operations/my-shifts/${id}/complete`),
  completeBatch:(id:string)=>apiClient.post(`/receiving-operations/my-batches/${id}/complete`),
  confirmPickup:(batchId:string,requestId:string,data:{actualWeight:number;notes?:string;imageUrls?:string[]})=>apiClient.post(`/receiving-operations/my-batches/${batchId}/requests/${requestId}/confirm`,data),
  reschedule:(batchId:string,requestId:string,pickupDate:string,reason?:string)=>apiClient.post(`/receiving-operations/my-batches/${batchId}/requests/${requestId}/reschedule`,{pickupDate,reason}),
  reject:(batchId:string,requestId:string,reason:string)=>apiClient.post(`/receiving-operations/my-batches/${batchId}/requests/${requestId}/reject`,{reason}),
};
