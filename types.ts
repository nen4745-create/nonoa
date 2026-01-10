
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  createdAt: number;
}

export type GroupColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet' | 'slate' | 'cyan';

export interface ChecklistGroup {
  id: string;
  title: string;
  tasks: Task[];
  color: GroupColor;
  createdAt: number;
}

export interface WidgetConfig {
  id: string;
  enabled: boolean;
  title: string;
  icon: string;
}

export type ThemeType = 'light' | 'dark';
