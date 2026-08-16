import apiClient from './api';

export interface DonationChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'Donor' | 'ReceivingStaff';
  message: string;
  sentAt: string;
  isMine: boolean;
}

export const donationChatService = {
  getMessages: (requestId: string) =>
    apiClient.get<unknown, DonationChatMessage[]>(`/donation-chat/${requestId}`),
  sendMessage: (requestId: string, message: string) =>
    apiClient.post(`/donation-chat/${requestId}`, { message }),
};
