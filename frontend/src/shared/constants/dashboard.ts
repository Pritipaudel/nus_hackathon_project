import type { IcbtProgram } from '@shared/types';

export const DASHBOARD_RECOMMENDED_PROGRAMS: IcbtProgram[] = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    description: 'A structured iCBT programme to identify anxiety triggers and build coping strategies using cognitive restructuring techniques.',
    difficulty_level: 'Beginner',
    duration_days: 21,
    url: 'https://mindbridge.app/programs/anxiety',
  },
  {
    id: '2',
    title: 'Managing Low Mood',
    description: 'Evidence-based modules targeting negative thought patterns associated with depression and persistent low mood.',
    difficulty_level: 'Beginner',
    duration_days: 30,
    url: 'https://mindbridge.app/programs/low-mood',
  },
  {
    id: '3',
    title: 'Sleep & Recovery',
    description: 'Cognitive and behavioural techniques specifically designed to address sleep disturbances and restore healthy sleep patterns.',
    difficulty_level: 'Intermediate',
    duration_days: 14,
    url: 'https://mindbridge.app/programs/sleep',
  },
  {
    id: '4',
    title: 'Stress & Burnout Reset',
    description: 'A focused programme on identifying workplace and personal stressors, setting boundaries, and building resilience.',
    difficulty_level: 'Intermediate',
    duration_days: 28,
    url: 'https://mindbridge.app/programs/burnout',
  },
];

export const DASHBOARD_UPCOMING_MEETINGS = [
  { id: '1', worker: 'Dr. Priya Nair', scheduled_at: '2026-03-30T10:00:00Z', status: 'SCHEDULED' },
  { id: '2', worker: 'Ahmad Farouk', scheduled_at: '2026-04-02T14:00:00Z', status: 'SCHEDULED' },
];
