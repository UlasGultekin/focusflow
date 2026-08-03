import React, { useEffect, useState } from 'react';
import {
  Kanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Plus,
  Flame,
  Lock,
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';

const COLUMNS = [
  { id: 'todo', title: 'Yapılacak (Todo)', color: 'border-blue-500/40 bg-blue-500/5', badgeColor: 'bg-blue-500 text-white' },
  { id: 'in_progress', title: 'Devam Eden (In Progress)', color: 'border-amber-500/40 bg-amber-500/5', badgeColor: 'bg-amber-500 text-white' },
  { id: 'done', title: 'Tamamlanan (Done)', color: 'border-emerald-500/40 bg-emerald-500/5', badgeColor: 'bg-emerald-500 text-white' },
];

export default function BoardView({ onOpenAddModal }) {
  const { tasks, updateTask, activeSession, selectTask } = useTaskStore();
  const [blockedMap, setBlockedMap] = useState({});

  useEffect(() => {
    loadAllBlockedStatuses();
  }, [tasks]);

  const loadAllBlockedStatuses = async () => {
    if (window.electronAPI && window.electronAPI.isTaskBlocked) {
      const map = {};
      for (const t of tasks) {
        const res = await window.electronAPI.isTaskBlocked(t.id);
        if (res && res.isBlocked) {
          map[t.id] = res.blockers;
        }
      }
      setBlockedMap(map);
    }
  };

  const getColumnTasks = (status) => {
    return tasks.filter((t) => (t.status || 'todo') === status);
  };

  const handleMoveStatus = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const totalTasks = tasks.length;
  const completedCount = getColumnTasks('done').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Görev Panosu (Kanban)</h2>
            <p className="text-xs text-app-secondary">
              İşlerinizi Todo → In Progress → Done sütunlarında görsel olarak yönetin
            </p>
          </div>
        </div>

        {/* Global Board Progress Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-app-secondary">Tamamlanma Oranı:</span>
            <span className="text-emerald-500 font-bold text-sm">%{completionPercentage}</span>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Görev Ekle
          </button>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id);

          return (
            <div
              key={col.id}
              className={`border rounded-2xl p-4 flex flex-col min-h-[500px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-app">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${col.badgeColor}`}>
                    {colTasks.length}
                  </span>
                  <h3 className="font-bold text-sm text-app-primary">{col.title}</h3>
                </div>
              </div>

              {/* Task Cards List inside Column */}
              <div className="flex-1 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="h-32 border border-dashed border-app rounded-xl flex items-center justify-center text-xs text-app-muted font-medium">
                    Bu sütunda görev yok
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isTaskActive = activeSession && activeSession.task_id === task.id;
                    const blockers = blockedMap[task.id];

                    return (
                      <div
                        key={task.id}
                        onClick={() => selectTask(task.id)}
                        className={`p-4 rounded-xl border bg-app-surface shadow-xs transition-all space-y-3 relative group cursor-pointer ${
                          isTaskActive ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-app hover:border-app-accent'
                        }`}
                      >
                        {/* Task Color Indicator Bar */}
                        <div
                          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                          style={{ backgroundColor: task.color || '#5B8DEF' }}
                        />

                        <div className="pl-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-app-primary leading-snug">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {blockers && (
                                <span
                                  className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                                  title={`Kilitli: #${blockers[0]?.id} ${blockers[0]?.title}`}
                                >
                                  <Lock className="w-3 h-3" /> #{blockers[0]?.id}
                                </span>
                              )}
                              {isTaskActive && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md animate-pulse">
                                  <Flame className="w-3 h-3 fill-current" /> Aktif
                                </span>
                              )}
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-xs text-app-secondary mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-app text-xs">
                            <span className="text-[10px] font-semibold text-app-muted bg-app-secondary px-2 py-0.5 rounded-md">
                              {task.category || 'Genel'}
                            </span>
                            <div className="flex items-center gap-1 text-app-muted text-[11px] font-medium">
                              <Clock className="w-3 h-3" />
                              <span>{task.estimated_minutes}dk</span>
                            </div>
                          </div>

                          {/* Quick Column Status Transition Buttons */}
                          <div className="flex items-center justify-end gap-1.5 pt-2 mt-2 border-t border-app">
                            {col.id !== 'todo' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(task.id, 'todo');
                                }}
                                className="p-1 rounded-lg border border-app text-app-secondary hover:text-app-primary hover:bg-app-surface-hover text-[11px] font-medium flex items-center gap-1"
                                title="Todo'ya Taşı"
                              >
                                <ArrowLeft className="w-3 h-3" /> Todo
                              </button>
                            )}

                            {col.id !== 'in_progress' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(task.id, 'in_progress');
                                }}
                                className="p-1 rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-[11px] font-medium flex items-center gap-1"
                                title="In Progress'e Taşı"
                              >
                                Devam Et
                              </button>
                            )}

                            {col.id !== 'done' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(task.id, 'done');
                                }}
                                className="p-1 rounded-lg bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1 hover:opacity-90"
                                title="Tamamlandı İşaretle"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Bitir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
