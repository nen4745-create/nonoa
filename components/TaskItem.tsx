
import React, { useState } from 'react';
import { Task, GroupColor } from '../types';

interface TaskItemProps {
  task: Task;
  color: GroupColor;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateNotif: (id: string, time?: string, interval?: number, count?: number) => void;
}

const colorConfig: Record<string, { bg: string, border: string, text: string, checkBg: string, darkText: string }> = {
  indigo: { bg: 'hover:border-indigo-100 dark:hover:border-indigo-900/50', border: 'border-indigo-600', text: 'text-indigo-600', checkBg: 'bg-indigo-600', darkText: 'dark:text-indigo-400' },
  rose: { bg: 'hover:border-rose-100 dark:hover:border-rose-900/50', border: 'border-rose-500', text: 'text-rose-500', checkBg: 'bg-rose-500', darkText: 'dark:text-rose-400' },
  emerald: { bg: 'hover:border-emerald-100 dark:hover:border-emerald-900/50', border: 'border-emerald-500', text: 'text-emerald-500', checkBg: 'bg-emerald-500', darkText: 'dark:text-emerald-400' },
  amber: { bg: 'hover:border-amber-100 dark:hover:border-amber-900/50', border: 'border-amber-500', text: 'text-amber-500', checkBg: 'bg-amber-500', darkText: 'dark:text-amber-400' },
  violet: { bg: 'hover:border-violet-100 dark:hover:border-violet-900/50', border: 'border-violet-500', text: 'text-violet-500', checkBg: 'bg-violet-500', darkText: 'dark:text-violet-400' },
  slate: { bg: 'hover:border-slate-200 dark:hover:border-slate-700/50', border: 'border-slate-600', text: 'text-slate-600', checkBg: 'bg-slate-600', darkText: 'dark:text-slate-400' },
  cyan: { bg: 'hover:border-cyan-100 dark:hover:border-cyan-900/50', border: 'border-cyan-500', text: 'text-cyan-500', checkBg: 'bg-cyan-500', darkText: 'dark:text-cyan-400' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, color, onToggle, onDelete, onUpdateNotif }) => {
  const cfg = colorConfig[color];
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifTime, setNotifTime] = useState(task.notificationTime || '');
  const [interval, setIntervalVal] = useState(task.repeatInterval || 0);
  const [count, setCount] = useState(task.repeatCount || 0);

  const saveNotif = () => {
    onUpdateNotif(task.id, notifTime || undefined, interval || undefined, count || undefined);
    setIsNotifOpen(false);
  };

  return (
    <div className="relative group">
      <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all animate-slide-in ${
        task.completed 
          ? 'bg-gray-50/80 dark:bg-slate-800/50 border-transparent opacity-70' 
          : `bg-white dark:bg-slate-800 border-gray-50 dark:border-slate-700 ${cfg.bg} shadow-sm hover:shadow-md`
      }`}>
        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => onToggle(task.id)}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
            task.completed ? `${cfg.checkBg} ${cfg.border} text-white` : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 group-hover:border-gray-300 dark:group-hover:border-slate-500'
          }`}>
            {task.completed && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
          </div>
          <div className="relative flex-1">
            <span className={`text-base font-bold transition-all ${
              task.completed 
                ? 'text-gray-400 dark:text-slate-500 line-through decoration-2 decoration-gray-400' 
                : 'text-gray-700 dark:text-slate-200'
            }`}>
              {task.text}
            </span>
            {task.notificationTime && !task.completed && (
              <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 flex items-center gap-1 mt-1">
                <span>⏰ {task.notificationTime}</span>
                {task.repeatInterval && <span>({task.repeatInterval}h 마다 {task.repeatCount}회)</span>}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); }}
            className={`p-2 rounded-xl transition-all ${task.notificationTime ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-300 dark:text-slate-600 hover:text-indigo-500'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-gray-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isNotifOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 animate-fadeIn">
          <h4 className="text-xs font-black uppercase text-gray-400 dark:text-slate-500 mb-3">알림 설정</h4>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black dark:text-slate-400 block mb-1">알림 시간</label>
              <input type="time" value={notifTime} onChange={e => setNotifTime(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-lg text-sm font-bold dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black dark:text-slate-400 block mb-1">반복 간격(h)</label>
                <input type="number" min="0" value={interval} onChange={e => setIntervalVal(parseInt(e.target.value) || 0)} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-lg text-sm font-bold dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black dark:text-slate-400 block mb-1">반복 횟수</label>
                <input type="number" min="0" value={count} onChange={e => setCount(parseInt(e.target.value) || 0)} className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-lg text-sm font-bold dark:text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { onUpdateNotif(task.id); setIsNotifOpen(false); }} className="flex-1 py-2 text-xs font-bold text-gray-400 hover:text-red-500">지우기</button>
              <button onClick={saveNotif} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black shadow-lg">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
