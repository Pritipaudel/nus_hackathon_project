import type { WorkerPatient, WorkerOverviewStat } from '@shared/types';

export const WORKER_OVERVIEW_STATS: WorkerOverviewStat[] = [
  { label: 'Active patients', value: '24', sub: '+2 this week',      color: 'wd-stat-card--green' },
  { label: 'Sessions today',  value: '4',  sub: '2 remaining',       color: 'wd-stat-card--blue'  },
  { label: 'Pending requests',value: '6',  sub: 'Awaiting response', color: 'wd-stat-card--amber' },
  { label: 'Community posts', value: '12', sub: 'Needs review',      color: 'wd-stat-card--red'   },
];

export const PATIENT_MOOD_LABEL: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export const PATIENT_MOOD_COLOR: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#16a34a',
};

export const PATIENT_CATEGORY_COLOR: Record<string, string> = {
  ANXIETY:       '#dbeafe|#1d4ed8',
  DEPRESSION:    '#ede9fe|#6d28d9',
  STRESS:        '#fee2e2|#dc2626',
  SLEEP:         '#faf5ff|#7c3aed',
  RELATIONSHIPS: '#fce7f3|#be185d',
  CBT:           '#fef3c7|#92400e',
  GENERAL:       '#f3f4f6|#374151',
};

export const MOCK_WORKER_PATIENTS: WorkerPatient[] = [
  {
    id: 'p1',
    name: 'Sarah Tan',
    initials: 'ST',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80',
    program: 'Understanding Anxiety',
    progress: 65,
    lastActive: '2 days ago',
    status: 'active',
    joined: 'Mar 1, 2026',
    sessions: 4,
    modulesCompleted: 6,
    totalModules: 9,
    streak: 12,
    mood: [
      { day: 'Mon', score: 3 }, { day: 'Tue', score: 4 }, { day: 'Wed', score: 2 },
      { day: 'Thu', score: 4 }, { day: 'Fri', score: 5 }, { day: 'Sat', score: 3 }, { day: 'Sun', score: 4 },
    ],
    weeklyProgress: [
      { week: 'W1', pct: 15 }, { week: 'W2', pct: 30 }, { week: 'W3', pct: 45 }, { week: 'W4', pct: 65 },
    ],
    posts: [
      { text: 'Three weeks into the anxiety programme and I finally understand what a thought record actually does.', time: '2h ago', likes: 134, comments: 38, category: 'ANXIETY' },
      { text: 'The breathing exercises in module 4 really helped me before a big presentation.', time: '4d ago', likes: 42, comments: 9, category: 'ANXIETY' },
    ],
    notes: [
      { date: 'Mar 25, 2026', note: 'Patient demonstrating strong engagement. Thought records improving significantly. Recommend progressing to module 7.' },
      { date: 'Mar 18, 2026', note: 'Session focused on breathing techniques. Patient reports difficulty with consistency outside structured exercises.' },
    ],
  },
  {
    id: 'p2',
    name: 'James Lim',
    initials: 'JL',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    program: 'Overcoming Depression',
    progress: 40,
    lastActive: '1 day ago',
    status: 'active',
    joined: 'Mar 8, 2026',
    sessions: 3,
    modulesCompleted: 4,
    totalModules: 10,
    streak: 5,
    mood: [
      { day: 'Mon', score: 2 }, { day: 'Tue', score: 2 }, { day: 'Wed', score: 3 },
      { day: 'Thu', score: 3 }, { day: 'Fri', score: 4 }, { day: 'Sat', score: 3 }, { day: 'Sun', score: 3 },
    ],
    weeklyProgress: [
      { week: 'W1', pct: 10 }, { week: 'W2', pct: 20 }, { week: 'W3', pct: 30 }, { week: 'W4', pct: 40 },
    ],
    posts: [
      { text: 'Anyone else finding the journaling exercises challenging? I struggle with consistency.', time: '5h ago', likes: 28, comments: 7, category: 'DEPRESSION' },
    ],
    notes: [
      { date: 'Mar 26, 2026', note: 'James is progressing steadily. Journaling consistency remains a challenge. Suggested setting a 9pm reminder.' },
    ],
  },
  {
    id: 'p3',
    name: 'Nurul Aisyah',
    initials: 'NA',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80',
    program: 'Mindfulness for Stress',
    progress: 85,
    lastActive: 'Today',
    status: 'active',
    joined: 'Feb 20, 2026',
    sessions: 6,
    modulesCompleted: 8,
    totalModules: 9,
    streak: 21,
    mood: [
      { day: 'Mon', score: 4 }, { day: 'Tue', score: 5 }, { day: 'Wed', score: 4 },
      { day: 'Thu', score: 5 }, { day: 'Fri', score: 5 }, { day: 'Sat', score: 4 }, { day: 'Sun', score: 5 },
    ],
    weeklyProgress: [
      { week: 'W1', pct: 30 }, { week: 'W2', pct: 55 }, { week: 'W3', pct: 70 }, { week: 'W4', pct: 85 },
    ],
    posts: [
      { text: 'Completed week 3 of Mindfulness for Stress. Feeling noticeably calmer in difficult situations.', time: '1d ago', likes: 67, comments: 12, category: 'GENERAL' },
    ],
    notes: [
      { date: 'Mar 27, 2026', note: 'Outstanding progress. Nurul is close to programme completion. Body scan practice has had visible impact on reported stress levels.' },
    ],
  },
  {
    id: 'p4',
    name: 'Ravi Kumar',
    initials: 'RK',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
    program: 'CBT Foundations',
    progress: 20,
    lastActive: '5 days ago',
    status: 'inactive',
    joined: 'Mar 10, 2026',
    sessions: 1,
    modulesCompleted: 2,
    totalModules: 10,
    streak: 0,
    mood: [
      { day: 'Mon', score: 2 }, { day: 'Tue', score: 1 }, { day: 'Wed', score: 2 },
      { day: 'Thu', score: 2 }, { day: 'Fri', score: 3 }, { day: 'Sat', score: 2 }, { day: 'Sun', score: 2 },
    ],
    weeklyProgress: [
      { week: 'W1', pct: 10 }, { week: 'W2', pct: 15 }, { week: 'W3', pct: 18 }, { week: 'W4', pct: 20 },
    ],
    posts: [
      { text: 'Confused about cognitive restructuring worksheets — not sure I am doing them correctly.', time: '2d ago', likes: 14, comments: 4, category: 'CBT' },
    ],
    notes: [
      { date: 'Mar 22, 2026', note: 'Ravi has disengaged from the programme. Reached out via message, no response. Consider a check-in call.' },
    ],
  },
  {
    id: 'p5',
    name: 'Lin Mei',
    initials: 'LM',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
    program: 'Cultural Identity & Wellbeing',
    progress: 55,
    lastActive: '3 days ago',
    status: 'active',
    joined: 'Mar 5, 2026',
    sessions: 3,
    modulesCompleted: 5,
    totalModules: 9,
    streak: 8,
    mood: [
      { day: 'Mon', score: 3 }, { day: 'Tue', score: 4 }, { day: 'Wed', score: 3 },
      { day: 'Thu', score: 3 }, { day: 'Fri', score: 4 }, { day: 'Sat', score: 4 }, { day: 'Sun', score: 3 },
    ],
    weeklyProgress: [
      { week: 'W1', pct: 15 }, { week: 'W2', pct: 28 }, { week: 'W3', pct: 42 }, { week: 'W4', pct: 55 },
    ],
    posts: [
      { text: 'Finding it hard to talk about mental health with family. The module helped me find language for these conversations.', time: '3d ago', likes: 58, comments: 12, category: 'RELATIONSHIPS' },
    ],
    notes: [
      { date: 'Mar 24, 2026', note: 'Lin is engaged and reflective. Family communication remains a key challenge. Suggested the cultural framing exercises from module 6.' },
    ],
  },
];
