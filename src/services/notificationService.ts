import apiClient from './api';
export interface AppNotification { id:string; type:string; title:string; message:string; targetUrl?:string|null; donationRequestId?:string|null; isRead:boolean; createdAt:string; }
export interface NotificationFeed { unreadCount:number; items:AppNotification[]; }
export const notificationService = {
  getMine:()=>apiClient.get<unknown,NotificationFeed>('/notifications?take=50'),
  markRead:(id:string)=>apiClient.patch(`/notifications/${id}/read`),
  markAllRead:()=>apiClient.patch('/notifications/read-all'),
  clearAll:()=>apiClient.delete('/notifications'),
};
