import React from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';

export default function TaskList({ onOpenAddModal }) {
  const {
    tasks,
    selectedTaskId,
    selectTask,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    updateTask,
  } = useTaskStore();

  // Extract unique categories safely
  const categories = ['all', ...new Set(tasks.map((t) => t?.category).filter(Boolean))];

  // Filter tasks safely by search and category
  const filteredTasks = tasks.filter((task) => {
    if (!task) return false;
    const titleStr = (task.title || '').toLowerCase();
    const descStr = (task.description || '').toLowerCase();
    const queryStr = (searchQuery || '').toLowerCase();

    const matchesSearch = titleStr.includes(queryStr) || descStr.includes(queryStr);
    const matchesCategory =
      !filterCategory || filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleComplete = async (e, task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' || task.status === 'completed' ? 'todo' : 'done';
    await updateTask(task.id, { status: newStatus });
  };

  return (
    <div className="w-80 border-r border-app bg-app-surface flex flex-col h-screen select-none">
      {/* Task List Header */}
      <div className="p-4 border-b border-app space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-app-primary">Görevlerim</h2>
          <button
            onClick={onOpenAddModal}
            className="p-2 rounded-xl bg-app-accent text-white hover:opacity-90 shadow-xs transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Yeni Görev
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-app-muted" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Görevlerde ara..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent placeholder:text-app-muted"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-app-secondary p-1 rounded-xl">
          {[
            { id: 'active', label: 'Aktif' },
            { id: 'completed', label: 'Tamamlanan' },
            { id: 'all', label: 'Tümü' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === tab.id
                  ? 'bg-app-surface text-app-primary shadow-xs'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-app-muted" />
            <select
              value={filterCategory || 'all'}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-2 py-1 rounded-lg border border-app bg-app-primary text-app-primary text-xs focus:outline-none"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Task List Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 px-4 text-app-muted text-xs">
            Görev bulunamadı.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            const isCompleted = task.status === 'completed' || task.status === 'done';

            return (
              <div
                key={task.id}
                onClick={() => selectTask(task.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-app-accent bg-app-accent-light shadow-xs'
                    : 'border-app hover:border-app-accent/50 hover:bg-app-surface-hover'
                }`}
              >
                {/* Priority Color Bar */}
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                  style={{ backgroundColor: task.color || '#5B8DEF' }}
                />

                <div className="pl-2 flex items-start gap-2.5">
                  <button
                    onClick={(e) => handleToggleComplete(e, task)}
                    className="mt-0.5 shrink-0 text-app-muted hover:text-emerald-500 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-xs leading-snug truncate ${
                        isCompleted ? 'line-through text-app-muted' : 'text-app-primary'
                      }`}
                    >
                      {task.title || 'Başlıksız Görev'}
                    </h3>

                    <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-app-muted">
                      <span className="bg-app-secondary px-1.5 py-0.5 rounded-md text-app-secondary">
                        {task.category || 'Genel'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimated_minutes || 25}dk
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
