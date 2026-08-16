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

export interface DonationChatConversation {
  requestId: string;
  requestCode: string;
  participantLabel: string;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export const donationChatService = {
  getConversations: () =>
    apiClient.get<unknown, DonationChatConversation[]>('/donation-chat/conversations'),
  getMessages: (requestId: string) =>
    apiClient.get<unknown, DonationChatMessage[]>(`/donation-chat/${requestId}`),
  sendMessage: (requestId: string, message: string) =>
    apiClient.post(`/donation-chat/${requestId}`, { message }),
};
