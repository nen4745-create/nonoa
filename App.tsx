
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, ChecklistGroup, WidgetConfig, GroupColor, DailyHistory, ViewMode } from './types';
import { generateChecklist } from './services/geminiService';
import { ProgressBar } from './components/ProgressBar';
import { TaskItem } from './components/TaskItem';
import { WIDGET_REGISTRY } from './components/WidgetRegistry';

const COLORS: GroupColor[] = ['indigo', 'rose', 'emerald', 'amber', 'violet', 'slate', 'cyan'];

const colorClassMap: Record<GroupColor, string> = {
  indigo: 'bg-indigo-600', rose: 'bg-rose-500', emerald: 'bg-emerald-500',
  amber: 'bg-amber-500', violet: 'bg-violet-500', slate: 'bg-slate-600', cyan: 'bg-cyan-500',
};

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const App: React.FC = () => {
  const [groups, setGroups] = useState<ChecklistGroup[]>(() => {
    const saved = localStorage.getItem('zencheck_groups');
    return saved ? JSON.parse(saved) : [
      { id: 'daily-habits', title: '매일 습관', tasks: [], color: 'rose', createdAt: Date.now(), type: 'daily' }
    ];
  });
  const [history, setHistory] = useState<DailyHistory>(() => {
    const saved = localStorage.getItem('zencheck_history');
    return saved ? JSON.parse(saved) : {};
  });
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('zencheck_theme');
    return saved === 'dark';
  });

  const [activeGroupId, setActiveGroupId] = useState<string>('daily-habits');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoadmapExpanded, setIsRoadmapExpanded] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Persistence and Theme
  useEffect(() => localStorage.setItem('zencheck_groups', JSON.stringify(groups)), [groups]);
  useEffect(() => localStorage.setItem('zencheck_history', JSON.stringify(history)), [history]);
  useEffect(() => {
    localStorage.setItem('zencheck_theme', isDark ? 'dark' : 'light');
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // --- Notification Engine ---
  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      let updated = false;
      const newGroups = groups.map(group => {
        let groupUpdated = false;
        const newTasks = group.tasks.map(task => {
          if (!task.completed && task.notificationTime === nowStr) {
            // Trigger Notification
            new Notification("ZenCheck 알림", {
              body: `할 일: ${task.text}`,
              icon: "https://cdn-icons-png.flaticon.com/512/3119/3119338.png"
            });

            // Handle Repetition
            if (task.repeatInterval && task.repeatInterval > 0 && (task.remindersSent || 0) < (task.repeatCount || 0)) {
              groupUpdated = true;
              updated = true;
              const nextTime = new Date();
              nextTime.setHours(nextTime.getHours() + task.repeatInterval);
              const nextTimeStr = nextTime.getHours().toString().padStart(2, '0') + ':' + nextTime.getMinutes().toString().padStart(2, '0');
              
              return {
                ...task,
                notificationTime: nextTimeStr,
                remindersSent: (task.remindersSent || 0) + 1
              };
            } else {
              // Clear notification if no more repeats
              groupUpdated = true;
              updated = true;
              return { ...task, notificationTime: undefined };
            }
          }
          return task;
        });
        return groupUpdated ? { ...group, tasks: newTasks } : group;
      });

      if (updated) setGroups(newGroups);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [groups]);

  // Derived State
  const activeGroup = useMemo(() => {
    if (viewMode === 'calendar') {
      const calendarGroup = groups.find(g => g.type === 'calendar');
      const tasks = calendarGroup ? calendarGroup.tasks.filter(t => t.date === selectedDate) : [];
      return { 
        id: calendarGroup?.id || 'calendar-group', 
        title: `${selectedDate} 할 일`, 
        tasks, 
        color: 'indigo' as GroupColor, 
        type: 'calendar' as const 
      };
    }
    return groups.find(g => g.id === activeGroupId);
  }, [activeGroupId, groups, viewMode, selectedDate]);

  const handleCreateSketch = () => {
    const name = prompt("스케치 제목을 입력하세요");
    if (!name) return;
    const newId = generateId();
    setGroups(prev => [...prev, { id: newId, title: name, tasks: [], color: 'amber', createdAt: Date.now(), type: 'sketch', notes: '' }]);
    switchView('sketch', newId);
  };

  const handleCreateGroup = () => {
    const name = prompt("리스트 이름을 입력하세요");
    if (!name) return;
    const newId = generateId();
    setGroups(prev => [...prev, { id: newId, title: name, tasks: [], color: COLORS[Math.floor(Math.random() * COLORS.length)], createdAt: Date.now(), type: 'standard' }]);
    switchView('group', newId);
  };

  const handleToggleTask = (groupId: string, taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setGroups(prev => prev.map(g => {
      if (g.id === groupId || (g.type === 'calendar' && groupId === 'calendar-group')) {
        return { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) };
      }
      return g;
    }));
    if (groupId === 'daily-habits') {
      setHistory(prev => {
        const dayHistory = prev[today] || {};
        return { ...prev, [today]: { ...dayHistory, [taskId]: !dayHistory[taskId] } };
      });
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeGroup) return;
    const newTask: Task = { 
      id: generateId(), text: newTaskText, completed: false, category: 'General', createdAt: Date.now(),
      date: viewMode === 'calendar' ? selectedDate : undefined
    };
    if (viewMode === 'calendar') {
      let calendarGroup = groups.find(g => g.type === 'calendar');
      if (!calendarGroup) {
        setGroups(prev => [...prev, { id: 'calendar-group', title: '캘린더 일정', tasks: [newTask], color: 'indigo', createdAt: Date.now(), type: 'calendar' }]);
      } else {
        setGroups(prev => prev.map(g => g.type === 'calendar' ? { ...g, tasks: [newTask, ...g.tasks] } : g));
      }
    } else {
      setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, tasks: [newTask, ...g.tasks] } : g));
    }
    setNewTaskText('');
  };

  const handleDeleteTask = (groupId: string, taskId: string) => {
    setGroups(prev => prev.map(g => (g.id === groupId || (g.type === 'calendar' && groupId === 'calendar-group')) ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g));
  };

  const updateTaskNotification = (groupId: string, taskId: string, time?: string, interval?: number, count?: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId || (g.type === 'calendar' && groupId === 'calendar-group')) {
        return { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, notificationTime: time, repeatInterval: interval, repeatCount: count, remindersSent: 0 } : t) };
      }
      return g;
    }));
  };

  // Fix: Added updateSketchNotes function
  const updateSketchNotes = (notes: string) => {
    if (!activeGroupId) return;
    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, notes } : g));
  };

  const handleAiGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || aiPrompt;
    if (!targetPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateChecklist(targetPrompt);
      const tasks = result.categories.flatMap((cat: any) => 
        cat.items.map((itemText: string) => ({
          id: generateId(), text: itemText, completed: false, category: cat.categoryName, createdAt: Date.now()
        }))
      );
      if (viewMode === 'sketch' && activeGroupId) {
        setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, tasks: [...tasks, ...g.tasks] } : g));
        setIsRoadmapExpanded(true);
      } else {
        const newId = generateId();
        setGroups(prev => [{ id: newId, title: result.title, tasks, color: COLORS[Math.floor(Math.random() * COLORS.length)], createdAt: Date.now(), type: 'standard' }, ...prev]);
        setActiveGroupId(newId);
        setViewMode('group');
      }
      setAiPrompt('');
      setIsSidebarOpen(false);
    } catch (error) { alert("AI 생성에 실패했습니다."); } finally { setIsGenerating(false); }
  };

  const switchView = (mode: ViewMode, gid?: string) => {
    setViewMode(mode);
    if (gid) setActiveGroupId(gid);
    setIsSidebarOpen(false);
  };

  const navigateMonth = (direction: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + direction);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const daysInMonth = useMemo(() => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    return { firstDay, lastDate, year, month };
  }, [selectedDate]);

  return (
    <div className="flex h-screen w-screen bg-[#F9FAFB] dark:bg-[#0F172A] text-gray-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 w-72 h-full bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-slate-800 flex flex-col z-50 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">Z</div>
            <h1 className="font-black text-xl tracking-tighter dark:text-white">ZenCheck</h1>
          </div>
          <button className="lg:hidden p-2 text-gray-400" onClick={() => setIsSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar pb-10">
          {/* Menu Sections (Same as previous but with handleCreate functions) */}
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2">메뉴</h3>
            <button onClick={() => switchView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${viewMode === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>📊 대시보드</button>
            <button onClick={() => switchView('daily', 'daily-habits')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${viewMode === 'daily' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>🔥 매일 습관</button>
            <button onClick={() => switchView('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${viewMode === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>📅 캘린더</button>
          </div>

          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2">아이디어 스케치</h3>
            {groups.filter(g => g.type === 'sketch').map(g => (
              <button key={g.id} onClick={() => switchView('sketch', g.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${viewMode === 'sketch' && activeGroupId === g.id ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>📝 <span className="truncate">{g.title}</span></button>
            ))}
            <button onClick={handleCreateSketch} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 mt-2">+ 스케치 만들기</button>
          </div>

          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2">체크리스트</h3>
            {groups.filter(g => !g.type || g.type === 'standard').map(g => (
              <button key={g.id} onClick={() => switchView('group', g.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${viewMode === 'group' && activeGroupId === g.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}><div className={`w-2 h-2 rounded-full ${colorClassMap[g.color]}`}></div> <span className="truncate">{g.title}</span></button>
            ))}
            <button onClick={handleCreateGroup} className="w-full text-center py-2 text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-indigo-600 transition-colors">+ 리스트 추가</button>
          </div>
        </nav>

        <div className="p-6 border-t border-gray-100 dark:border-slate-800 space-y-3">
           {notifPermission !== 'granted' && (
             <button onClick={requestNotificationPermission} className="w-full flex items-center justify-between px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black transition-all hover:bg-rose-100">
               <span>알림 권한 필요</span>
               <span>🔔</span>
             </button>
           )}
           <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl transition-all">
             <span className="text-sm font-bold dark:text-slate-300">{isDark ? '나이트 모드' : '데이 모드'}</span>
             <div className="text-xl">{isDark ? '🌙' : '☀️'}</div>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden w-full transition-colors duration-300">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex-shrink-0 z-10">
          <button className="lg:hidden p-2" onClick={() => setIsSidebarOpen(true)}>
            <svg className="w-6 h-6 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1 mx-4 sm:mx-8 max-w-xl">
             <div className="relative">
                <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()} placeholder="목표를 입력하면 AI가 로드맵을 짜줍니다..." className="w-full h-10 px-4 pr-10 rounded-xl bg-gray-100/50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-indigo-100 text-sm font-semibold transition-all dark:text-white" />
                <button onClick={() => handleAiGenerate()} className="absolute right-3 top-2.5 text-indigo-500 hover:scale-110 transition-transform">✨</button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          <div className="max-w-5xl mx-auto h-full">
            
            {viewMode === 'dashboard' && (
              <div className="view-transition space-y-6 lg:space-y-8">
                <h2 className="text-3xl lg:text-4xl font-black tracking-tighter text-gray-900 dark:text-white">대시보드</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {WIDGET_REGISTRY.map(w => <div key={w.id} className="h-44 lg:h-48"><w.component groups={groups} activeGroup={activeGroup as any} onToggleTask={handleToggleTask} history={history} /></div>)}
                </div>
              </div>
            )}

            {viewMode === 'calendar' && activeGroup && (
              <div className="view-transition flex flex-col lg:flex-row gap-6 lg:gap-8 h-full min-h-[500px]">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm lg:w-80 h-fit">
                   {/* Calendar UI (Same as previous) */}
                   <div className="flex justify-between items-center mb-6 px-2">
                    <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 transition-colors">◀</button>
                    <h4 className="font-black text-lg dark:text-white">{daysInMonth.year}년 {daysInMonth.month + 1}월</h4>
                    <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 transition-colors">▶</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-300 dark:text-slate-600 uppercase mb-4">
                    {['s','m','t','w','t','f','s'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: daysInMonth.firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth.lastDate }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${daysInMonth.year}-${String(daysInMonth.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button key={day} onClick={() => setSelectedDate(dateStr)} className={`aspect-square rounded-xl text-sm font-bold transition-all flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'}`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col">
                   <h2 className="text-2xl lg:text-3xl font-black mb-6 tracking-tight dark:text-white">{selectedDate} <span className="text-gray-300 dark:text-slate-600 font-bold">할 일</span></h2>
                   <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 pr-2">
                      <div className="space-y-3">
                        {activeGroup.tasks.map(t => (
                          <TaskItem key={t.id} task={t} color="indigo" 
                            onToggle={(tid) => handleToggleTask(activeGroup.id, tid)} 
                            onDelete={(tid) => handleDeleteTask(activeGroup.id, tid)} 
                            onUpdateNotif={(tid, time, interval, count) => updateTaskNotification(activeGroup.id, tid, time, interval, count)}
                          />
                        ))}
                      </div>
                   </div>
                   <form onSubmit={addTask} className="relative mt-auto">
                      <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="일정 추가..." className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-sm outline-none dark:text-white" />
                      <button className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl font-black text-xs">추가</button>
                   </form>
                </div>
              </div>
            )}

            {(viewMode === 'daily' || viewMode === 'group' || viewMode === 'sketch') && activeGroup && (
              <div className="view-transition bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[500px]">
                <div className="mb-8">
                  <h2 className="text-3xl lg:text-5xl font-black tracking-tighter mb-4 dark:text-white">{activeGroup.title}</h2>
                  <ProgressBar progress={(activeGroup.tasks.filter(t => t.completed).length / (activeGroup.tasks.length || 1)) * 100} color={activeGroup.color} />
                </div>
                {viewMode === 'sketch' && (
                   <textarea 
                    value={activeGroup.notes || ''} 
                    onChange={(e) => updateSketchNotes(e.target.value)}
                    placeholder="생각나는 대로 브레인스토밍 하세요..."
                    className="w-full min-h-[150px] p-6 bg-amber-50/20 dark:bg-amber-900/10 rounded-2xl border-none focus:ring-4 focus:ring-amber-100 outline-none font-medium text-lg text-gray-700 dark:text-slate-300 mb-6"
                  />
                )}
                <form onSubmit={addTask} className="mb-6 relative">
                  <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="새 항목 추가..." className="w-full p-5 bg-gray-50 dark:bg-slate-800 rounded-[24px] border-none font-bold text-lg outline-none dark:text-white" />
                  <button type="submit" className={`absolute right-3 top-3 bottom-3 px-6 ${colorClassMap[activeGroup.color]} text-white rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all`}>추가</button>
                </form>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-10">
                  {activeGroup.tasks.map(t => (
                    <TaskItem key={t.id} task={t} color={activeGroup.color} 
                      onToggle={(tid) => handleToggleTask(activeGroup.id, tid)} 
                      onDelete={(tid) => handleDeleteTask(activeGroup.id, tid)} 
                      onUpdateNotif={(tid, time, interval, count) => updateTaskNotification(activeGroup.id, tid, time, interval, count)}
                    />
                  ))}
                  {activeGroup.tasks.length === 0 && <div className="py-20 text-center text-gray-300 dark:text-slate-700 font-bold">목록이 비어있습니다.</div>}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
