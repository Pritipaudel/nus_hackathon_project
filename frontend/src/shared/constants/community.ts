import type { CommunityPost, TrendingPost } from '@shared/types';

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
