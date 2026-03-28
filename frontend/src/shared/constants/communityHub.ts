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
}

export interface RecommendedProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: string;
  durationDays: number;
  communityCount: number;
  coverUrl: string;
  tags: string[];
}

export interface CommunityEngagement {
  programId: string;
  programTitle: string;
  memberCount: number;
  members: { id: string; photo?: string; avatar: string }[];
  trending: boolean;
}

export const COMMUNITY_MEMBERS: CommunityMember[] = [
  {
    id: 'm1',
    username: 'anonymous_4821',
    avatar: 'AN',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
    role: 'member',
    status: 'online',
    joinedDaysAgo: 14,
    category: 'ANXIETY',
  },
  {
    id: 'm2',
    username: 'worker_nair',
    avatar: 'WN',
    photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=80&q=80',
    role: 'worker',
    status: 'online',
    joinedDaysAgo: 120,
    category: 'GENERAL',
  },
  {
    id: 'm3',
    username: 'anonymous_2034',
    avatar: 'AK',
    photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&q=80',
    role: 'member',
    status: 'away',
    joinedDaysAgo: 7,
    category: 'STRESS',
  },
  {
    id: 'm4',
    username: 'anonymous_7761',
    avatar: 'AR',
    photo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&q=80',
    role: 'member',
    status: 'offline',
    joinedDaysAgo: 30,
    category: 'DEPRESSION',
  },
  {
    id: 'm5',
    username: 'worker_farouk',
    avatar: 'WF',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&q=80',
    role: 'worker',
    status: 'online',
    joinedDaysAgo: 200,
    category: 'GENERAL',
  },
  {
    id: 'm6',
    username: 'anonymous_9103',
    avatar: 'AM',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
    role: 'member',
    status: 'online',
    joinedDaysAgo: 3,
    category: 'RELATIONSHIPS',
  },
];

export const MOCK_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  m1: [
    {
      id: 'c1',
      senderId: 'm1',
      senderName: 'anonymous_4821',
      senderPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
      content: 'Hey, I saw your post about the anxiety programme. How long did it take before you noticed a change?',
      timestamp: '2026-03-28T10:20:00Z',
      isOwn: false,
    },
    {
      id: 'c2',
      senderId: 'me',
      senderName: 'You',
      content: 'Honestly about two weeks. The thought records were the biggest shift for me.',
      timestamp: '2026-03-28T10:22:00Z',
      isOwn: true,
    },
    {
      id: 'c3',
      senderId: 'm1',
      senderName: 'anonymous_4821',
      senderPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
      content: 'That is helpful, thank you. I am on day 5 and still finding it frustrating but good to know it gets better.',
      timestamp: '2026-03-28T10:24:00Z',
      isOwn: false,
    },
  ],
  m2: [
    {
      id: 'c4',
      senderId: 'm2',
      senderName: 'worker_nair',
      senderPhoto: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=80&q=80',
      content: 'Hi, just checking in after your session last week. How has your sleep been?',
      timestamp: '2026-03-27T09:00:00Z',
      isOwn: false,
    },
    {
      id: 'c5',
      senderId: 'me',
      senderName: 'You',
      content: 'Much better actually. The stimulus control technique really helped.',
      timestamp: '2026-03-27T09:15:00Z',
      isOwn: true,
    },
    {
      id: 'c6',
      senderId: 'm2',
      senderName: 'worker_nair',
      senderPhoto: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=80&q=80',
      content: 'Great to hear. Keep going — the first two weeks are the hardest. See you at our next session.',
      timestamp: '2026-03-27T09:17:00Z',
      isOwn: false,
    },
  ],
  m5: [
    {
      id: 'c7',
      senderId: 'm5',
      senderName: 'worker_farouk',
      senderPhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&q=80',
      content: 'Thank you for your kind words on my post. It means a lot when the community engages.',
      timestamp: '2026-03-26T14:00:00Z',
      isOwn: false,
    },
    {
      id: 'c8',
      senderId: 'me',
      senderName: 'You',
      content: 'Your message about grief really resonated. Would you recommend the trauma programme?',
      timestamp: '2026-03-26T14:10:00Z',
      isOwn: true,
    },
    {
      id: 'c9',
      senderId: 'm5',
      senderName: 'worker_farouk',
      senderPhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&q=80',
      content: 'Yes, especially the Trauma-Informed Stabilisation programme. Start with grounding first before deeper work.',
      timestamp: '2026-03-26T14:12:00Z',
      isOwn: false,
    },
  ],
};

export const COMMUNITY_RECOMMENDED_PROGRAMS: RecommendedProgram[] = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    description: 'The most-enrolled programme in your community right now. Members report reduced panic frequency within 2 weeks.',
    category: 'ANXIETY',
    difficultyLevel: 'Beginner',
    durationDays: 21,
    communityCount: 23,
    coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
    tags: ['Thought records', 'CBT', 'Grounding'],
  },
  {
    id: '3',
    title: 'Sleep & Recovery',
    description: 'Highly recommended by your health worker. 18 community members have completed it with strong results.',
    category: 'SLEEP',
    difficultyLevel: 'Intermediate',
    durationDays: 14,
    communityCount: 18,
    coverUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
    tags: ['Sleep hygiene', 'CBT-I', 'Stimulus control'],
  },
  {
    id: '4',
    title: 'Stress & Burnout Reset',
    description: 'Trending in the STRESS category this week. 11 members from your community started it in the last 7 days.',
    category: 'STRESS',
    difficultyLevel: 'Intermediate',
    durationDays: 28,
    communityCount: 11,
    coverUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&q=80',
    tags: ['Boundaries', 'Resilience', 'Burnout'],
  },
];

export const COMMUNITY_ENGAGEMENTS: CommunityEngagement[] = [
  {
    programId: '1',
    programTitle: 'Understanding Anxiety',
    memberCount: 23,
    trending: true,
    members: [
      { id: 'm1', photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80', avatar: 'AN' },
      { id: 'm3', photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&q=80', avatar: 'AK' },
      { id: 'm6', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80', avatar: 'AM' },
    ],
  },
  {
    programId: '3',
    programTitle: 'Sleep & Recovery',
    memberCount: 18,
    trending: false,
    members: [
      { id: 'm2', photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=80&q=80', avatar: 'WN' },
      { id: 'm4', photo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&q=80', avatar: 'AR' },
    ],
  },
  {
    programId: '4',
    programTitle: 'Stress & Burnout Reset',
    memberCount: 11,
    trending: true,
    members: [
      { id: 'm5', photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&q=80', avatar: 'WF' },
      { id: 'm6', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80', avatar: 'AM' },
      { id: 'm1', photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80', avatar: 'AN' },
    ],
  },
];
