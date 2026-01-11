
import React, { useState } from 'react';
import { ChecklistGroup, GroupColor, DailyHistory } from '../types';

interface WidgetProps {
  groups: ChecklistGroup[];
  activeGroup: ChecklistGroup | undefined;
  onToggleTask: (groupId: string, taskId: string) => void;
  history: DailyHistory;
}

// 1. Enhanced Stats Widget with Tabs
const StatsWidget: React.FC<WidgetProps> = ({ groups, history }) => {
  const [tab, setTab] = useState<'day' | 'month' | 'year'>('day');
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Logic to calculate stats based on tab
  const getStats = () => {
    const allTasks = groups.flatMap(g => g.tasks);
    if (tab === 'day') {
      const completed = allTasks.filter(t => t.completed).length;
      return { val: completed, total: allTasks.length };
    } else if (tab === 'month') {
      const monthPrefix = todayStr.substring(0, 7);
      const monthDays = Object.keys(history).filter(d => d.startsWith(monthPrefix));
      let totalCompleted = 0;
      monthDays.forEach(d => {
        totalCompleted += Object.values(history[d]).filter(v => v).length;
      });
      return { val: totalCompleted, label: '이번 달 누적' };
    } else {
      const yearPrefix = todayStr.substring(0, 4);
      const yearDays = Object.keys(history).filter(d => d.startsWith(yearPrefix));
      return { val: yearDays.length, label: '실천한 일수' };
    }
  };

  const stats = getStats();
  const percentage = (stats as any).total ? Math.round(((stats as any).val / (stats as any).total) * 100) : 0;

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm h-full flex flex-col hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {['day', 'month', 'year'].map((t) => (
            <button 
              key={t}
              onClick={() => setTab(t as any)}
              className={`text-[10px] font-black uppercase px-2 py-1 rounded-md transition-all ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-gray-900 dark:text-white">{(stats as any).val}</span>
          <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
            {(stats as any).total ? `/ ${(stats as any).total}` : (stats as any).label}
          </span>
        </div>
        {tab === 'day' && (
          <div className="w-full bg-gray-50 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div className={`bg-indigo-500 h-full transition-all duration-700`} style={{ width: `${percentage}%` }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Quick Checklist Widget
const QuickCheckWidget: React.FC<WidgetProps> = ({ activeGroup, onToggleTask }) => {
  const pendingTasks = activeGroup?.tasks.filter(t => !t.completed).slice(0, 3) || [];
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm h-full flex flex-col transition-all">
      <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">빠른 체크</h3>
      <div className="space-y-2">
        {pendingTasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => activeGroup && onToggleTask(activeGroup.id, task.id)}>
            <div className="w-5 h-5 rounded border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"></div>
            <span className="text-sm font-bold text-gray-700 dark:text-slate-300 truncate">{task.text}</span>
          </div>
        ))}
        {pendingTasks.length === 0 && <p className="text-xs text-gray-300 dark:text-slate-600 py-4">모든 할 일을 마쳤습니다!</p>}
      </div>
    </div>
  );
};

export const WIDGET_REGISTRY = [
  { id: 'stats', title: '성과 분석', component: StatsWidget, icon: '📊', defaultEnabled: true },
  { id: 'focus', title: '빠른 할일', component: QuickCheckWidget, icon: '✅', defaultEnabled: true },
];
