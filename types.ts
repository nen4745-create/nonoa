
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  createdAt: number;
  date?: string; // YYYY-MM-DD for calendar tasks
  // Notification features
  notificationTime?: string; // ISO String or HH:mm
  repeatInterval?: number;   // In hours
  repeatCount?: number;      // Total number of repeats
  remindersSent?: number;    // Counter for sent notifications
}

export type GroupColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet' | 'slate' | 'cyan';

export interface ChecklistGroup {
  id: string;
  title: string;
  tasks: Task[];
  color: GroupColor;
  createdAt: number;
  type?: 'standard' | 'daily' | 'calendar' | 'sketch';
  notes?: string; // For free-form sketching
}

export interface WidgetConfig {
  id: string;
  enabled: boolean;
  title: string;
  icon: string;
}

export interface DailyHistory {
  [date: string]: {
    [taskId: string]: boolean;
  };
}

export type ViewMode = 'dashboard' | 'daily' | 'calendar' | 'group' | 'sketch';
