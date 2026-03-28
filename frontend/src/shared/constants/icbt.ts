import type { IcbtProgram, MyProgram } from '@shared/types';

export const ICBT_PROGRAMS: IcbtProgram[] = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    description: 'Learn to identify anxiety triggers and apply cognitive restructuring. Covers thought records, behavioural experiments, and graded exposure.',
    difficulty_level: 'Beginner',
    duration_days: 21,
    url: 'https://mindbridge.app/programs/anxiety',
  },
  {
    id: '2',
    title: 'Managing Low Mood',
    description: 'Targets negative thought patterns associated with depression. Uses behavioural activation, thought challenging, and self-compassion exercises.',
    difficulty_level: 'Beginner',
    duration_days: 30,
    url: 'https://mindbridge.app/programs/low-mood',
  },
  {
    id: '3',
    title: 'Sleep & Recovery',
    description: 'Addresses sleep disturbances through cognitive and behavioural techniques including sleep restriction, stimulus control, and relaxation training.',
    difficulty_level: 'Intermediate',
    duration_days: 14,
    url: 'https://mindbridge.app/programs/sleep',
  },
  {
    id: '4',
    title: 'Stress & Burnout Reset',
    description: 'Identifies workplace and personal stressors. Builds boundary-setting skills, cognitive flexibility, and sustainable coping routines.',
    difficulty_level: 'Intermediate',
    duration_days: 28,
    url: 'https://mindbridge.app/programs/burnout',
  },
  {
    id: '5',
    title: 'Trauma-Informed Stabilisation',
    description: 'A foundational programme for trauma survivors. Focuses on grounding, safety planning, and emotion regulation before deeper processing.',
    difficulty_level: 'Advanced',
    duration_days: 42,
    url: 'https://mindbridge.app/programs/trauma',
  },
  {
    id: '6',
    title: 'Self-Esteem & Identity',
    description: 'Explores core beliefs and schemas driving low self-worth. Includes values clarification, self-compassion practice, and assertiveness training.',
    difficulty_level: 'Intermediate',
    duration_days: 21,
    url: 'https://mindbridge.app/programs/self-esteem',
  },
];

export const ICBT_MY_PROGRAMS: MyProgram[] = [
  { program_id: '1', status: 'ACTIVE', progress_percent: 45 },
  { program_id: '3', status: 'COMPLETED', progress_percent: 100 },
];

export const ICBT_DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'icbt-badge--green',
  Intermediate: 'icbt-badge--amber',
  Advanced: 'icbt-badge--red',
};
