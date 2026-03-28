import type { CommunityPost, TrendingPost } from '@shared/types';

export interface MockComment {
  id: string;
  author: string;
  initials: string;
  isVerified: boolean;
  text: string;
  time: string;
  likes: number;
}

export const COMMUNITY_MOCK_COMMENTS: Record<string, MockComment[]> = {
  '1': [
    { id: 'c1a', author: 'anonymous_7102', initials: 'A', isVerified: false, text: 'This is exactly where I was at week 2. Keep going — week 4 has a reframing exercise that really clicked for me.', time: '1h ago', likes: 12 },
    { id: 'c1b', author: 'worker_nair', initials: 'WN', isVerified: true, text: 'Catching the spiral early is one of the most valuable skills in CBT. You are building exactly the right habit.', time: '45m ago', likes: 34 },
    { id: 'c1c', author: 'anonymous_3390', initials: 'A', isVerified: false, text: 'I felt the same way in week 1. The thought records started making sense when I stopped trying to do them perfectly.', time: '20m ago', likes: 7 },
  ],
  '2': [
    { id: 'c2a', author: 'anonymous_4821', initials: 'A', isVerified: false, text: 'This tip changed my sleep quality within a week. I also removed my phone charger from the bedroom.', time: '5h ago', likes: 21 },
    { id: 'c2b', author: 'anonymous_8814', initials: 'A', isVerified: false, text: 'How long did it take before you noticed a difference? I am on day 3 and still struggling.', time: '3h ago', likes: 4 },
    { id: 'c2c', author: 'worker_nair', initials: 'WN', isVerified: true, text: 'Give it 10–14 days consistently. Sleep hygiene changes are gradual. Pair it with a fixed wake time even on weekends.', time: '2h ago', likes: 18 },
  ],
  '3': [
    { id: 'c3a', author: 'anonymous_5577', initials: 'A', isVerified: false, text: 'We are not alone in this. I had to reframe it as "I am making my own choices, not rejecting yours."', time: '20h ago', likes: 15 },
    { id: 'c3b', author: 'worker_farouk', initials: 'WF', isVerified: true, text: 'Cultural identity stress is real and valid. The programme module on this covers some practical language for these conversations.', time: '18h ago', likes: 29 },
  ],
  '4': [
    { id: 'c4a', author: 'anonymous_2034', initials: 'A', isVerified: false, text: 'I had the same pattern. For me it was a meeting I dread every Monday and skipping lunch on Thursdays.', time: '16h ago', likes: 9 },
    { id: 'c4b', author: 'anonymous_6612', initials: 'A', isVerified: false, text: 'Tracking really helps. Once you see the pattern you can at least prepare for those days.', time: '10h ago', likes: 6 },
  ],
  '5': [
    { id: 'c5a', author: 'anonymous_9103', initials: 'A', isVerified: false, text: 'Thank you for this. I needed to read it today.', time: '1d ago', likes: 41 },
    { id: 'c5b', author: 'anonymous_1145', initials: 'A', isVerified: false, text: 'I keep coming back to this post. It is rare to see grief described without the usual platitudes.', time: '22h ago', likes: 33 },
    { id: 'c5c', author: 'anonymous_7761', initials: 'A', isVerified: false, text: 'Six months since my loss and I still feel guilty when I have a good day. This helped.', time: '20h ago', likes: 28 },
  ],
  '6': [
    { id: 'c6a', author: 'worker_nair', initials: 'WN', isVerified: true, text: 'Opening up is genuinely one of the bravest things you can do. Well done.', time: '10h ago', likes: 19 },
    { id: 'c6b', author: 'anonymous_4821', initials: 'A', isVerified: false, text: 'The community here helped me find words too. Glad you are feeling less alone.', time: '8h ago', likes: 11 },
  ],
};

export const COMMUNITY_CATEGORIES = [
  'ALL',
  'ANXIETY',
  'DEPRESSION',
  'STRESS',
  'SLEEP',
  'RELATIONSHIPS',
  'TRAUMA',
  'GENERAL',
];

export const COMMUNITY_CATEGORY_COLORS: Record<string, string> = {
  ANXIETY: 'cp-cat--amber',
  DEPRESSION: 'cp-cat--blue',
  STRESS: 'cp-cat--red',
  SLEEP: 'cp-cat--purple',
  RELATIONSHIPS: 'cp-cat--pink',
  TRAUMA: 'cp-cat--orange',
  GENERAL: 'cp-cat--gray',
};

export const COMMUNITY_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&q=80',
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
];

export const COMMUNITY_MOCK_POSTS: (CommunityPost & { upvotes: number; comments: number })[] = [
  {
    id: '1',
    username: 'anonymous_4821',
    content:
      'Three weeks into the anxiety programme and I finally understand what a thought record actually does. The first week I thought it was pointless. Now I can catch the spiral before it takes over. Small win but it matters.',
    media_urls: [COMMUNITY_MOCK_IMAGES[0]],
    category: 'ANXIETY',
    is_verified: false,
    created_at: '2026-03-28T08:14:00Z',
    upvotes: 134,
    comments: 38,
  },
  {
    id: '2',
    username: 'worker_nair',
    content:
      'A reminder for anyone struggling with sleep: your bed should only be for sleep and rest. Working, scrolling, or worrying in bed trains your brain to stay alert there. Start with just this one change — it compounds.',
    media_urls: [],
    category: 'SLEEP',
    is_verified: true,
    created_at: '2026-03-28T07:40:00Z',
    upvotes: 89,
    comments: 14,
  },
  {
    id: '3',
    username: 'anonymous_2034',
    content:
      'The cultural pressure around career choices hits different when your parents see your choices as a reflection of the whole family. Anyone else navigating this? Would appreciate hearing how others have approached the conversation.',
    media_urls: [COMMUNITY_MOCK_IMAGES[1]],
    category: 'STRESS',
    is_verified: false,
    created_at: '2026-03-27T22:10:00Z',
    upvotes: 67,
    comments: 23,
  },
  {
    id: '4',
    username: 'anonymous_7761',
    content:
      'I have been using the mood tracker for two weeks. Noticing that my low days cluster around Monday and Thursday. No idea why yet but at least I can see a pattern now instead of feeling like it is random.',
    media_urls: [],
    category: 'DEPRESSION',
    is_verified: false,
    created_at: '2026-03-27T18:55:00Z',
    upvotes: 41,
    comments: 9,
  },
  {
    id: '5',
    username: 'worker_farouk',
    content:
      'Grief does not follow a timeline and it does not follow stages in order. If you are somewhere in a loss right now, whatever you are feeling today is valid — even if it contradicts what you felt yesterday.',
    media_urls: [COMMUNITY_MOCK_IMAGES[2]],
    category: 'GENERAL',
    is_verified: true,
    created_at: '2026-03-27T15:30:00Z',
    upvotes: 203,
    comments: 47,
  },
  {
    id: '6',
    username: 'anonymous_9103',
    content:
      'Started opening up to my partner about what I go through. It is uncomfortable but it is also the first time in years I do not feel completely alone with it. The community posts here helped me find words for things I could not name before.',
    media_urls: [],
    category: 'RELATIONSHIPS',
    is_verified: false,
    created_at: '2026-03-27T12:20:00Z',
    upvotes: 58,
    comments: 12,
  },
];

export const COMMUNITY_MOCK_TRENDING: TrendingPost[] = [
  {
    id: '5',
    content: 'Grief does not follow a timeline and it does not follow stages in order...',
    trend_score: 203,
  },
  {
    id: '1',
    content: 'Three weeks into the anxiety programme and I finally understand...',
    trend_score: 134,
  },
  {
    id: '3',
    content: 'The cultural pressure around career choices hits different...',
    trend_score: 67,
  },
];
