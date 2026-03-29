export type WorkerDashboardSection =
  | 'community'
  | 'overview'
  | 'patients'
  | 'meetings'
  | 'certifications';

export interface PatientMoodEntry {
  day: string;
  score: number;
}

export interface PatientWeeklyProgress {
  week: string;
  pct: number;
}

export interface PatientPost {
  text: string;
  time: string;
  likes: number;
  comments: number;
  category: string;
}

export interface PatientNote {
  date: string;
  note: string;
}

export interface WorkerPatient {
  id: string;
  name: string;
  initials: string;
  photo: string;
  program: string;
  progress: number;
  lastActive: string;
  status: 'active' | 'inactive';
  joined: string;
  sessions: number;
  modulesCompleted: number;
  totalModules: number;
  streak: number;
  mood: PatientMoodEntry[];
  weeklyProgress: PatientWeeklyProgress[];
  posts: PatientPost[];
  notes: PatientNote[];
}

export interface WorkerOverviewStat {
  label: string;
  value: string;
  sub: string;
  color: string;
}
