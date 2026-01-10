
import React, { useState, useEffect } from 'react';
import { ChecklistGroup } from '../types';
import { getMotivationalQuote } from '../services/geminiService';

interface WidgetProps {
  groups: ChecklistGroup[];
  activeGroup: ChecklistGroup | undefined;
}

// 1. Stats Widget
const StatsWidget: React.FC<WidgetProps> = ({ groups }) => {
  const allTasks = groups.flatMap(g => g.tasks);
  const completed = allTasks.filter(t => t.completed).length;
  const total = allTasks.length;
  
  return (
    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">전체 통계</h3>
        <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </span>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-800">{completed}/{total}</div>
        <p className="text-xs text-gray-400 mt-1">완료된 항목</p>
      </div>
    </div>
  );
};

// 2. AI Motivator Widget
const AIQuoteWidget: React.FC<WidgetProps> = ({ groups }) => {
  const [quote, setQuote] = useState('생각 중...');
  
  useEffect(() => {
    const fetchQuote = async () => {
      const allTasks = groups.flatMap(g => g.tasks);
      const progress = allTasks.length > 0 ? (allTasks.filter(t => t.completed).length / allTasks.length) * 100 : 0;
      const q = await getMotivationalQuote(Math.round(progress), allTasks.length);
      setQuote(q);
    };
    fetchQuote();
  }, [groups]);

  return (
    <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium opacity-80">AI의 응원</h3>
        <span className="p-1.5 bg-white/20 rounded-lg">✨</span>
      </div>
      <p className="text-lg font-medium leading-tight">"{quote}"</p>
    </div>
  );
};

// 3. Next Focus Widget
const FocusWidget: React.FC<WidgetProps> = ({ activeGroup }) => {
  const nextTask = activeGroup?.tasks.find(t => !t.completed);
  
  return (
    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">다음 목표</h3>
        <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">🎯</span>
      </div>
      <div>
        <p className="text-sm text-gray-700 font-medium truncate">
          {nextTask ? nextTask.text : "모든 일을 마쳤습니다!"}
        </p>
        <p className="text-xs text-gray-400 mt-1">{activeGroup?.title || "선택된 리스트 없음"}</p>
      </div>
    </div>
  );
};

// EXPORT REGISTRY: To add a widget, just add a component above and add it to this array!
export const WIDGET_REGISTRY = [
  { id: 'stats', title: '통계', component: StatsWidget, icon: '📊', defaultEnabled: true },
  { id: 'quote', title: 'AI 동기부여', component: AIQuoteWidget, icon: '✨', defaultEnabled: true },
  { id: 'focus', title: '우선순위', component: FocusWidget, icon: '🎯', defaultEnabled: true },
];
