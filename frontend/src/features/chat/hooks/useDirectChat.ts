import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { directChatApi } from '../api/directChatApi';

export const chatQueryKeys = {
  contacts: () => ['chat', 'contacts'] as const,
  messages: (peerId: string) => ['chat', 'messages', peerId] as const,
};

export function useChatContacts(enabled: boolean) {
  return useQuery({
    queryKey: chatQueryKeys.contacts(),
    queryFn: () => directChatApi.getContacts(),
    enabled,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useChatMessages(peerId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: peerId ? chatQueryKeys.messages(peerId) : ['chat', 'messages', '__none'],
    queryFn: () => directChatApi.getMessages(peerId!),
    enabled: Boolean(enabled && peerId),
    refetchInterval: enabled && peerId ? 5000 : false,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: directChatApi.sendMessage,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(variables.recipient_id) });
    },
  });
}
