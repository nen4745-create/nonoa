
import React from 'react';
import { Task, GroupColor } from '../types';

interface TaskItemProps {
  task: Task;
  color: GroupColor;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const colorConfig: Record<string, { bg: string, border: string, text: string, checkBg: string }> = {
  indigo: { bg: 'hover:border-indigo-100', border: 'border-indigo-600', text: 'text-indigo-600', checkBg: 'bg-indigo-600' },
  rose: { bg: 'hover:border-rose-100', border: 'border-rose-500', text: 'text-rose-500', checkBg: 'bg-rose-500' },
  emerald: { bg: 'hover:border-emerald-100', border: 'border-emerald-500', text: 'text-emerald-500', checkBg: 'bg-emerald-500' },
  amber: { bg: 'hover:border-amber-100', border: 'border-amber-500', text: 'text-amber-500', checkBg: 'bg-amber-500' },
  violet: { bg: 'hover:border-violet-100', border: 'border-violet-500', text: 'text-violet-500', checkBg: 'bg-violet-500' },
  slate: { bg: 'hover:border-slate-200', border: 'border-slate-600', text: 'text-slate-600', checkBg: 'bg-slate-600' },
  cyan: { bg: 'hover:border-cyan-100', border: 'border-cyan-500', text: 'text-cyan-500', checkBg: 'bg-cyan-500' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, color, onToggle, onDelete }) => {
  const cfg = colorConfig[color];

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group animate-slide-in ${
      task.completed ? 'bg-gray-50/50 border-transparent opacity-60' : `bg-white border-gray-50 ${cfg.bg} shadow-sm hover:shadow-md`
    }`}>
      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => onToggle(task.id)}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
          task.completed ? `${cfg.checkBg} ${cfg.border} text-white` : 'bg-white border-gray-200 group-hover:border-gray-300'
        }`}>
          {task.completed && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className={`text-base font-medium transition-all ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {task.text}
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};
