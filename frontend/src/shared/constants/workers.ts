import type { HealthWorker, Meeting } from '@shared/types';

export const WORKER_SPECIALTIES: Record<string, string[]> = {
  '1': ['Anxiety', 'Trauma', 'CBT'],
  '2': ['Depression', 'Grief', 'Mindfulness'],
  '3': ['Cultural stress', 'Family', 'Relationships'],
  '4': ['Sleep disorders', 'Burnout', 'Stress'],
  '5': ['Youth mental health', 'Adolescence', 'School stress'],
  '6': ['Workplace wellbeing', 'Burnout', 'Resilience'],
};

export const WORKER_LANGUAGES: Record<string, string[]> = {
  '1': ['English', 'Tamil'],
  '2': ['English', 'Malay'],
  '3': ['English', 'Mandarin', 'Cantonese'],
  '4': ['English'],
  '5': ['English', 'Hindi'],
  '6': ['English', 'Bahasa'],
};

export const WORKER_AVATARS: Record<string, string> = {
  '1': 'PN',
  '2': 'AF',
  '3': 'CW',
  '4': 'SK',
  '5': 'MR',
  '6': 'LA',
};

export const WORKER_PHOTOS: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80',
  '2': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
  '3': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
  '4': 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
  '5': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
  '6': 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&q=80',
};

export const WORKER_AVAILABILITY: Record<string, 'available' | 'busy' | 'away'> = {
  '1': 'available',
  '2': 'available',
  '3': 'busy',
  '4': 'available',
  '5': 'away',
  '6': 'available',
};

export const WORKER_BIO: Record<string, string> = {
  '1': 'Registered counsellor with 8 years working in community mental health across Singapore and South India. Specialises in anxiety management and trauma-informed care.',
  '2': 'Community mental health worker trained by SAMH. Focuses on depression recovery and grief counselling with a culturally sensitive approach.',
  '3': 'Bilingual counsellor supporting Mandarin and Cantonese-speaking communities in navigating cultural identity, family dynamics, and relationship difficulties.',
  '4': 'Clinical psychologist with a focus on sleep medicine and occupational burnout. Works with healthcare workers and corporate professionals.',
  '5': 'Youth counsellor supporting students aged 13–25 with academic stress, identity, and mental health challenges in school settings.',
  '6': 'Workplace wellbeing consultant and certified mindfulness trainer. Partners with organisations on resilience and mental fitness programmes.',
};

export const WORKER_STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  busy: 'Busy today',
  away: 'Away',
};

export const WORKER_TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export const MOCK_WORKERS: (HealthWorker & { title: string; sessions: number })[] = [
  { id: '1', username: 'Dr. Priya Nair', organization: 'IMH Singapore', is_verified: true, title: 'Registered Counsellor', sessions: 412 },
  { id: '2', username: 'Ahmad Farouk', organization: 'SAMH', is_verified: true, title: 'Mental Health Worker', sessions: 287 },
  { id: '3', username: 'Chen Wei', organization: 'Fei Yue Community Services', is_verified: true, title: 'Bilingual Counsellor', sessions: 190 },
  { id: '4', username: 'Dr. Sunita Kapoor', organization: 'National Healthcare Group', is_verified: true, title: 'Clinical Psychologist', sessions: 634 },
  { id: '5', username: 'Marcus Raj', organization: 'TOUCH Community Services', is_verified: true, title: 'Youth Counsellor', sessions: 145 },
  { id: '6', username: 'Layla Aziz', organization: 'Mindfulness SG', is_verified: false, title: 'Wellness Consultant', sessions: 88 },
];

export const MOCK_MEETINGS: (Meeting & { worker_name: string; worker_id?: string })[] = [
  { id: 'm1', scheduled_at: '2026-03-30T10:00:00Z', status: 'SCHEDULED', worker_name: 'Dr. Priya Nair', worker_id: '1' },
  { id: 'm2', scheduled_at: '2026-04-02T14:00:00Z', status: 'SCHEDULED', worker_name: 'Ahmad Farouk', worker_id: '2' },
];
