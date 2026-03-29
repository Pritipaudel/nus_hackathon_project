import { apiClient } from '@shared/api';

export interface ChatContactDto {
  user_id: string;
  display_name: string;
  anonymous_username: string | null;
  peer_role: string;
}

export interface DirectMessageDto {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}

export const directChatApi = {
  getContacts: async (): Promise<ChatContactDto[]> => {
    const { data } = await apiClient.get<ChatContactDto[]>('/chat/contacts');
    return data;
  },

  getMessages: async (peerId: string): Promise<DirectMessageDto[]> => {
    const { data } = await apiClient.get<DirectMessageDto[]>('/chat/messages', {
      params: { peer: peerId },
    });
    return data;
  },

  sendMessage: async (payload: {
    recipient_id: string;
    body: string;
  }): Promise<DirectMessageDto> => {
    const { data } = await apiClient.post<DirectMessageDto>('/chat/messages', payload);
    return data;
  },
};
