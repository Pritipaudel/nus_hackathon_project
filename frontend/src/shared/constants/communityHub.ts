/** Legacy chat UI types — direct chat uses the API; mock message maps are unused. */

export interface CommunityMember {
  id: string;
  username: string;
  avatar: string;
  photo?: string;
  role: 'member' | 'worker';
  status: 'online' | 'away' | 'offline';
  joinedDaysAgo: number;
  category: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  mockMatched?: boolean;
}

/** Exact strings supported by the backend mock Nepali chat API (copy into input). */
export const NEPALI_MOCK_CHAT_SAMPLES: { label: string; text: string }[] = [
  {
    label: 'टाउको दुखाइ र निद्रा',
    text: 'नमस्ते दाइ, केही दिनदेखि मलाई टाउको दुख्ने र निद्रा कम हुने समस्या छ।',
  },
  {
    label: 'समुदायसँग कुरा',
    text: 'आफ्नै समुदायका मानिससँग कुरा गर्दा मलाई धेरै सहज लाग्छ।',
  },
  {
    label: 'खुसी र धन्यवाद',
    text: 'धेरै धन्यवाद, म अहिले पहिले भन्दा धेरै खुसी छु।',
  },
];
