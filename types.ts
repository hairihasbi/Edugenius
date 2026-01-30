
export enum QuizType {
  PG_4 = 'Pilihan Ganda (4 Opsi)',
  PG_5 = 'Pilihan Ganda (5 Opsi)',
  PG_KOMPLEKS = 'Pilihan Ganda Kompleks',
  BENAR_SALAH = 'Benar/Salah',
  URAIAN_SINGKAT = 'Uraian Singkat',
  ESSAI = 'Essai'
}

export enum CognitiveLevel {
  C1 = 'C1 (Mengingat)',
  C2 = 'C2 (Memahami)',
  C3 = 'C3 (Menerapkan)',
  C4 = 'C4 (Menganalisis)',
  C5 = 'C5 (Mengevaluasi)',
  C6 = 'C6 (Mencipta)'
}

export enum Difficulty {
  MUDAH = 'Mudah',
  SEDANG = 'Sedang',
  SULIT = 'Sulit'
}

export enum SMA_Grade {
  K10 = 'Kelas 10',
  K11 = 'Kelas 11',
  K12 = 'Kelas 12'
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  indicator: string;
  cognitiveLevel: CognitiveLevel;
  hasImage?: boolean;
  imageUrl?: string;
  factCheckStatus?: 'VERIFIED' | 'FLAGGED' | 'UNCERTAIN';
  factCheckComment?: string;
}

export interface QuizJob {
  id: string;
  title: string;
  subject: string;
  grade: SMA_Grade;
  topic: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  results?: QuizQuestion[];
  error?: string;
  createdAt: string;
  published: boolean;
}

export interface ApiKey {
  key: string;
  status: 'ACTIVE' | 'FAILED';
  usageCount: number;
}

export interface SiteSettings {
  siteName: string;
  seoDescription: string;
  timezone: string;
  isMaintenance: boolean;
  autoRotation: boolean;
  aiFactChecker: boolean;
  tasksPerHour: number;
  delayBetweenTasks: number;
  siteIdentity?: string;
  robotsTxt?: string;
  sitemapXml?: string;
  tursoUrl?: string;
  tursoToken?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARNING';
  message: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'GURU';
  active: boolean;
  password?: string;
}
