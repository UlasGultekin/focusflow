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
  Search,
  Filter,
  X,
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';

const COLUMNS = [
  { id: 'todo', title: 'Yapılacak (Todo)', color: 'border-blue-500/40 bg-blue-500/5', badgeColor: 'bg-blue-500 text-white' },
  { id: 'in_progress', title: 'Devam Eden (In Progress)', color: 'border-amber-500/40 bg-amber-500/5', badgeColor: 'bg-amber-500 text-white' },
  { id: 'done', title: 'Tamamlanan (Done)', color: 'border-emerald-500/40 bg-emerald-500/5', badgeColor: 'bg-emerald-500 text-white' },
];

export default function BoardView({ onOpenAddModal }) {
  const {
    tasks,
    updateTask,
    activeSession,
    selectTask,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    fetchTasks,
  } = useTaskStore();

  const [blockedMap, setBlockedMap] = useState({});
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  useEffect(() => {
    fetchTasks(filterStatus);
  }, [filterStatus]);

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

  const todayStr = new Date().toISOString().slice(0, 10);

  // Extract unique categories safely
  const categories = ['all', ...new Set(tasks.map((t) => t?.category).filter(Boolean))];

  const getColumnTasks = (status) => {
    return tasks.filter((t) => {
      if (!t) return false;
      const matchStatus = (t.status || 'todo') === status;

      // Category filter check
      const matchesCategory =
        !filterCategory || filterCategory === 'all' || t.category === filterCategory;

      // Search query check
      const queryStr = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !queryStr ||
        (t.title || '').toLowerCase().includes(queryStr) ||
        (t.description || '').toLowerCase().includes(queryStr);

      // Hide future planned tasks (planned_date > todayStr) when viewing active view to prevent clutter
      const isFutureTask =
        filterStatus !== 'all' &&
        filterStatus !== 'completed' &&
        t.planned_date &&
        t.planned_date > todayStr;

      return matchStatus && matchesCategory && matchesSearch && !isFutureTask;
    });
  };

  const handleMoveStatus = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e, taskId) => {
    e.stopPropagation();
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    e.preventDefault();
    if (dragOverColumnId === colId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e, colId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskIdStr = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskIdStr) {
      const taskId = parseInt(taskIdStr, 10) || taskIdStr;
      await handleMoveStatus(taskId, colId);
    }
    setDraggedTaskId(null);
  };

  const totalTasks = tasks.length;
  const completedCount = getColumnTasks('done').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Görev Panosu (Kanban)</h2>
            <p className="text-xs text-app-secondary">
              İşlerinizi Sürükle & Bırak ile Yapılacak → Devam Eden → Tamamlanan sütunlarına taşıyın
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

      {/* Filter Toolbar inside Board */}
      <div className="px-6 py-3 border-b border-app bg-app-surface/60 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-app-primary p-1 rounded-xl border border-app shadow-inner">
          {[
            { id: 'active', label: '⏳ Aktif Görevler' },
            { id: 'completed', label: '✅ Tamamlananlar' },
            { id: 'all', label: '🌐 Tümü' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                filterStatus === tab.id
                  ? 'bg-app-surface text-app-accent shadow-xs border border-app'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Panoda hızlı ara..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent placeholder:text-app-muted shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-app-accent shrink-0" />
              <select
                value={filterCategory || 'all'}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">📁 Tüm Kategoriler</option>
                {categories.filter((c) => c !== 'all').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id);
          const isTargetOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`border rounded-2xl p-4 flex flex-col min-h-[550px] transition-all duration-200 ${col.color} ${
                isTargetOver ? 'ring-2 ring-app-accent bg-app-accent-light/20 scale-[1.01] shadow-lg' : ''
              }`}
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
                  <div
                    className={`h-36 border border-dashed rounded-2xl flex flex-col items-center justify-center text-xs font-semibold transition-colors ${
                      isTargetOver
                        ? 'border-app-accent text-app-accent bg-app-accent-light/40'
                        : 'border-app text-app-muted'
                    }`}
                  >
                    {isTargetOver ? '🎯 Görevi Buraya Bırakın' : 'Bu sütunda görev yok'}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isTaskActive = activeSession && activeSession.task_id === task.id;
                    const isBeingDragged = draggedTaskId === task.id;
                    const blockers = blockedMap[task.id];

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => selectTask(task.id)}
                        className={`p-4 rounded-xl border bg-app-surface shadow-xs transition-all space-y-3 relative group cursor-grab active:cursor-grabbing hover:shadow-md ${
                          isBeingDragged ? 'opacity-40 scale-95 border-dashed border-app-accent' : ''
                        } ${
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
                              {blockers && Array.isArray(blockers) && blockers.length > 0 && (
                                <span
                                  className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                                  title={`Kilitli: #${blockers[0]?.id || ''} ${blockers[0]?.title || ''}`}
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
                            <div className="flex items-center gap-1 text-app-muted text-[11px] font-medium font-mono">
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
