
import React, { useState, useEffect } from 'react';
import { Task, ChecklistGroup, WidgetConfig, GroupColor } from './types';
import { generateChecklist } from './services/geminiService';
import { ProgressBar } from './components/ProgressBar';
import { TaskItem } from './components/TaskItem';
import { WIDGET_REGISTRY } from './components/WidgetRegistry';

const COLORS: GroupColor[] = ['indigo', 'rose', 'emerald', 'amber', 'violet', 'slate', 'cyan'];

const colorClassMap: Record<GroupColor, string> = {
  indigo: 'bg-indigo-600',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-600',
  cyan: 'bg-cyan-500',
};

const App: React.FC = () => {
  const [groups, setGroups] = useState<ChecklistGroup[]>(() => {
    const saved = localStorage.getItem('zencheck_groups');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('zencheck_widgets');
    return saved ? JSON.parse(saved) : WIDGET_REGISTRY.map(w => ({ id: w.id, enabled: w.defaultEnabled, title: w.title, icon: w.icon }));
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [editingTitle, setEditingTitle] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('zencheck_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('zencheck_widgets', JSON.stringify(widgets));
  }, [widgets]);

  const activeGroup = groups.find(g => g.id === (activeGroupId || (groups.length > 0 ? groups[0].id : null)));

  const handleCreateGroup = (title: string, initialTasks: Task[] = [], color: GroupColor = 'indigo') => {
    const newGroup: ChecklistGroup = {
      id: crypto.randomUUID(),
      title,
      tasks: initialTasks,
      color,
      createdAt: Date.now(),
    };
    setGroups(prev => [newGroup, ...prev]);
    setActiveGroupId(newGroup.id);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateChecklist(aiPrompt);
      const tasks: Task[] = [];
      result.categories.forEach((cat: any) => {
        cat.items.forEach((itemText: string) => {
          tasks.push({
            id: crypto.randomUUID(),
            text: itemText,
            completed: false,
            category: cat.categoryName,
            createdAt: Date.now(),
          });
        });
      });
      // AI 생성 시 무작위 색상 배정
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      handleCreateGroup(result.title, tasks, randomColor);
      setAiPrompt('');
    } catch (error) {
      console.error(error);
      alert("생성 실패");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateGroupColor = (id: string, color: GroupColor) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, color } : g));
  };

  const updateGroupTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTitle) return;
    setGroups(prev => prev.map(g => g.id === editingTitle.id ? { ...g, title: editingTitle.title } : g));
    setEditingTitle(null);
  };

  const deleteGroup = (id: string) => {
    if (confirm('이 리스트를 삭제할까요?')) {
      setGroups(prev => prev.filter(g => g.id !== id));
      if (activeGroupId === id) setActiveGroupId(null);
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeGroup) return;
    const newTask: Task = { id: crypto.randomUUID(), text: newTaskText, completed: false, category: 'General', createdAt: Date.now() };
    setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, tasks: [newTask, ...g.tasks] } : g));
    setNewTaskText('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 pb-20">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <span className="font-bold text-lg">Z</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">ZenCheck AI</h1>
          </div>
          <button 
            onClick={() => setShowWidgetSettings(!showWidgetSettings)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Widget Settings Panel */}
        {showWidgetSettings && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-slide-in">
            <h2 className="font-bold text-lg mb-4">위젯 설정</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {widgets.map(w => (
                <button
                  key={w.id}
                  onClick={() => setWidgets(prev => prev.map(item => item.id === w.id ? { ...item, enabled: !item.enabled } : item))}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${w.enabled ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'}`}
                >
                  <span>{w.icon}</span>
                  <span className="font-medium">{w.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bento Grid Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WIDGET_REGISTRY.filter(w => widgets.find(config => config.id === w.id)?.enabled).map(w => (
            <div key={w.id} className="h-full">
              <w.component groups={groups} activeGroup={activeGroup} />
            </div>
          ))}
        </div>

        {/* AI Generator Card */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">AI 스마트 체크리스트</h2>
              <p className="text-sm text-gray-500">목표만 입력하면 완벽한 파일이 생성됩니다.</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="예: 유럽 한 달 여행 짐 싸기, 개발 포트폴리오 만들기..."
              className="flex-1 px-5 py-4 rounded-2xl border-2 border-gray-50 focus:border-indigo-500 focus:outline-none bg-gray-50/50 transition-all font-medium"
              onKeyPress={(e) => e.key === 'Enter' && handleAiGenerate()}
            />
            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? 'AI가 분석 중...' : '마법처럼 생성'}
            </button>
          </div>
        </section>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar: Group List as "Files" */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">파일 보관함</h3>
              <button 
                onClick={() => handleCreateGroup('제목 없는 리스트', [], COLORS[Math.floor(Math.random() * COLORS.length)])} 
                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg text-gray-600 hover:bg-indigo-600 hover:text-white transition-all font-bold"
              >
                +
              </button>
            </div>
            <div className="space-y-1.5">
              {groups.map(g => (
                <div key={g.id} className="relative group">
                  <button
                    onClick={() => setActiveGroupId(g.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all font-semibold flex items-center gap-3 group ${activeGroupId === g.id ? 'bg-white shadow-xl text-gray-900 scale-[1.02]' : 'text-gray-500 hover:bg-white/50'}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${colorClassMap[g.color]} ring-4 ring-transparent group-hover:ring-gray-100 transition-all shadow-sm`}></div>
                    <span className="truncate flex-1">{g.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeGroupId === g.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-100/50 text-gray-400'}`}>
                      {g.tasks.length}
                    </span>
                  </button>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="px-4 py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-xs">
                  리스트가 비어있습니다.
                </div>
              )}
            </div>
          </div>

          {/* Active Checklist View */}
          <div className="lg:col-span-9 bg-white rounded-[32px] p-6 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/20 min-h-[650px] relative overflow-hidden">
            {activeGroup ? (
              <div className="animate-slide-in">
                {/* File Header with Color Settings */}
                <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    {editingTitle?.id === activeGroup.id ? (
                      <form onSubmit={updateGroupTitle} className="mb-2">
                        <input
                          autoFocus
                          value={editingTitle.title}
                          onChange={(e) => setEditingTitle({ ...editingTitle, title: e.target.value })}
                          onBlur={updateGroupTitle}
                          className="text-3xl font-black text-gray-900 bg-gray-50 px-2 py-1 rounded-lg w-full outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </form>
                    ) : (
                      <h2 
                        className="text-3xl md:text-4xl font-black text-gray-900 mb-2 cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => setEditingTitle({ id: activeGroup.id, title: activeGroup.title })}
                      >
                        {activeGroup.title}
                      </h2>
                    )}
                    <p className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colorClassMap[activeGroup.color]}`}></span>
                      {activeGroup.tasks.length}개의 항목이 담겨있습니다.
                    </p>
                  </div>
                  
                  {/* Color Picker & Actions */}
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <div className="flex gap-1 px-2 border-r border-gray-200">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => updateGroupColor(activeGroup.id, c)}
                          className={`w-6 h-6 rounded-full ${colorClassMap[c]} transition-transform hover:scale-125 shadow-sm ${activeGroup.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => deleteGroup(activeGroup.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex justify-between items-end mb-3">
                    <span className={`text-sm font-black uppercase tracking-widest ${activeGroup.color === 'slate' ? 'text-slate-600' : `text-${activeGroup.color}-600`}`}>
                      Progress
                    </span>
                    <span className="text-2xl font-black tabular-nums">
                      {Math.round((activeGroup.tasks.filter(t => t.completed).length / (activeGroup.tasks.length || 1)) * 100)}%
                    </span>
                  </div>
                  <ProgressBar 
                    progress={(activeGroup.tasks.filter(t => t.completed).length / (activeGroup.tasks.length || 1)) * 100} 
                    color={activeGroup.color}
                  />
                </div>

                <form onSubmit={addTask} className="mb-10 relative group">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="새로운 할 일을 추가하세요..."
                    className="w-full pl-6 pr-16 py-5 bg-gray-50 rounded-[24px] border-2 border-transparent focus:border-gray-200 focus:bg-white focus:outline-none transition-all font-semibold text-lg shadow-inner"
                  />
                  <button 
                    type="submit" 
                    className={`absolute right-3 top-3 bottom-3 px-4 ${colorClassMap[activeGroup.color]} text-white rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </form>

                <div className="space-y-3">
                  {activeGroup.tasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      color={activeGroup.color}
                      onToggle={(id) => setGroups(prev => prev.map(g => ({ ...g, tasks: g.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) })))}
                      onDelete={(id) => setGroups(prev => prev.map(g => ({ ...g, tasks: g.tasks.filter(t => t.id !== id) })))}
                    />
                  ))}
                  {activeGroup.tasks.length === 0 && (
                    <div className="py-20 text-center opacity-20 flex flex-col items-center">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      <p className="font-bold">목록이 비어있습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-pulse">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-gray-300">리스트(파일)를 선택하거나<br/>새로 생성해주세요</h3>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
