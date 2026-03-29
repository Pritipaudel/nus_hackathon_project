import { apiClient } from '@shared/api';

export type MockChatReply = {
  question: string;
  reply: string;
  matched: boolean;
};

export const chatMockApi = {
  postReply: async (question: string): Promise<MockChatReply> => {
    const { data } = await apiClient.post<MockChatReply>('/chat/mock/reply', { question });
    return data;
  },
};
