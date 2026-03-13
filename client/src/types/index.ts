export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  xp: number;
  level: number;
  created_at?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: string;
  goal_id?: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  is_active: number;
  completed_today: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  progress: number;
  status: string;
  habit_count?: number;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Analytics {
  dailyStats: Array<{ completed_date: string; count: number }>;
  totalHabits: number;
  totalCompleted: number;
  longestStreak: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
