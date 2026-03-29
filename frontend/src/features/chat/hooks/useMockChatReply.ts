import { useMutation } from '@tanstack/react-query';

import { chatMockApi } from '../api/chatMockApi';

export const useMockChatReply = () =>
  useMutation({
    mutationFn: (question: string) => chatMockApi.postReply(question),
  });
