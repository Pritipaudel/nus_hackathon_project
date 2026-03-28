import type { TrainingProgram, Certification } from '@shared/types';

export const TRAINING_COVERS: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  '2': 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&q=80',
  '3': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  '4': 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&q=80',
  '5': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
  '6': 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=600&q=80',
};

export const TRAINING_DURATION: Record<string, string> = {
  '1': '4 weeks',
  '2': '3 weeks',
  '3': '6 weeks',
  '4': '2 weeks',
  '5': '5 weeks',
  '6': '8 weeks',
};

export const TRAINING_MODULES: Record<string, number> = {
  '1': 8,
  '2': 6,
  '3': 12,
  '4': 5,
  '5': 10,
  '6': 16,
};

export const TRAINING_LEVEL: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  '1': 'Beginner',
  '2': 'Beginner',
  '3': 'Intermediate',
  '4': 'Beginner',
  '5': 'Intermediate',
  '6': 'Advanced',
};

export const TRAINING_DESCRIPTION: Record<string, string> = {
  '1': 'A foundational course covering the core concepts of mental health, common conditions, stigma reduction, and how to support others in distress.',
  '2': 'Practical skills for recognising emotional crisis in individuals and providing immediate, compassionate support before professional help is available.',
  '3': 'Deep dive into inference-based cognitive behavioural therapy — from theory to practical session delivery. Designed for aspiring mental health workers.',
  '4': 'Evidence-based techniques for protecting your own mental health while working in high-stress care environments. Essential for frontline workers.',
  '5': 'Learn to navigate cultural beliefs around mental illness, traditional healing practices, and how to deliver care that is both effective and respectful.',
  '6': 'Comprehensive training in trauma recognition, trauma-informed language, grounding techniques, and long-term recovery support frameworks.',
};

export const TRAINING_LEVEL_COLOR: Record<string, string> = {
  Beginner: 'tr-badge--green',
  Intermediate: 'tr-badge--amber',
  Advanced: 'tr-badge--red',
};

export const MOCK_TRAINING_PROGRAMS: TrainingProgram[] = [
  { id: '1', title: 'Mental Health Awareness', organization: 'WHO', is_verified: true },
  { id: '2', title: 'Psychological First Aid', organization: 'Red Cross Singapore', is_verified: true },
  { id: '3', title: 'iCBT Facilitator Certification', organization: 'IMH Singapore', is_verified: true },
  { id: '4', title: 'Self-care for Caregivers', organization: 'SAMH', is_verified: true },
  { id: '5', title: 'Culturally Sensitive Practice', organization: 'Fei Yue Community Services', is_verified: true },
  { id: '6', title: 'Trauma-Informed Care', organization: 'National Healthcare Group', is_verified: false },
];

export const MOCK_CERTIFICATIONS: (Certification & { id: string; program_id: string })[] = [
  {
    id: 'c1',
    program_id: '1',
    program_title: 'Mental Health Awareness',
    issued_at: '2025-11-14T00:00:00Z',
    verified: true,
  },
];
