
import React from 'react';
import { GroupColor } from '../types';

interface ProgressBarProps {
  progress: number;
  color?: GroupColor;
}

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-600',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-600',
  cyan: 'bg-cyan-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color = 'indigo' }) => {
  return (
    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner transition-colors duration-300">
      <div 
        className={`${colorMap[color]} h-full rounded-full transition-all duration-700 ease-out shadow-sm`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};
