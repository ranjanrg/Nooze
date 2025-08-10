export interface Alarm {
  id: string;
  time: Date;
  repeatDays: number[];
  isActive: boolean;
}

export interface Challenge {
  id: string;
  wakeUpTime: Date;
  duration: '90' | '365';
  motivation: string;
  activities: string[];
  startDate: Date;
  isActive: boolean;
}

export interface OnboardingData {
  motivation: string;
  morningActivity: string;
  pastExperience: string;
  obstacle: string;
  routineRating: string;
}

export type DayStatus = 'completed' | 'missed' | 'pending';

export interface ChallengeLogEntry {
  dateKey: string; // YYYY-MM-DD (local)
  status: DayStatus;
  actualWakeTime?: string; // ISO datetime string
  solvedMath?: boolean;
}

export type ScreenType = 
  | 'home' 
  | 'question' 
  | 'morningActivities' 
  | 'pastExperience' 
  | 'obstacles' 
  | 'routineRating' 
  | 'setAlarm' 
  | 'settings' 
  | 'challenges' 
  | 'nameInput'
  | 'timeSelection'
  | 'confirmation';

export interface QuestionScreen {
  id: string;
  title: string;
  options: string[];
  selectedOption?: string;
}
