import React, { useState } from 'react';
import {
  LayoutList, Kanban, Calendar, GraduationCap, Flame, BookHeart,
  NotebookPen, BarChart3, Search, Settings, Sparkles, Moon, Sun,
  Pencil, Check, X, RotateCcw, Link2, Bug, Wrench, LayoutDashboard, Pin, FolderKanban,
} from 'lucide-react';
import { useSettingsStore, DEFAULT_MENU_LABELS } from '../stores/useSettingsStore';

export default function Sidebar({ currentTab, setCurrentTab, onOpenStandup }) {
  const { theme, setTheme, compactMode, menuLabels, setMenuLabel, resetMenuLabels, hiddenTabs } = useSettingsStore();

  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  const togglePin = async () => {
    if (window.electronAPI?.toggleAlwaysOnTop) {
      const nextState = !isAlwaysOnTop;
      const res = await window.electronAPI.toggleAlwaysOnTop(nextState);
      setIsAlwaysOnTop(res);
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'tasks', icon: LayoutList },
    { id: 'board', icon: Kanban },
    { id: 'projects', icon: FolderKanban },
    { id: 'calendar', icon: Calendar },
    { id: 'courses', icon: GraduationCap },
    { id: 'links', icon: Link2 },
    { id: 'habits', icon: Flame },
    { id: 'journal', icon: BookHeart },
    { id: 'notes', icon: NotebookPen },
    { id: 'bugs', icon: Bug },
    { id: 'tech_debts', icon: Wrench },
    { id: 'search', icon: Search },
    { id: 'analytics', icon: BarChart3 },
    { id: 'settings', icon: Settings },
  ];

  const handleStartEdit = (id, currentLabel) => {
    setEditingId(id);
    setEditingValue(currentLabel);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      setMenuLabel(editingId, editingValue.trim() || DEFAULT_MENU_LABELS[editingId]);
    }
    setEditingId(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  return (
    <aside className={`flex flex-col border-r border-app bg-app-surface transition-all duration-200 ${compactMode ? 'w-16' : 'w-60'} h-screen select-none`}>
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-app">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-app-accent flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!compactMode && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg leading-none text-app-primary">FocusFlow</h1>
              <span className="text-xs text-app-muted font-medium">Masaüstü Odaklık</span>
            </div>
          )}
        </div>
        <button
          onClick={togglePin}
          className={`p-2 rounded-xl transition-all ${
            isAlwaysOnTop
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-app-muted hover:text-app-primary hover:bg-app-surface-hover'
          }`}
          title={isAlwaysOnTop ? 'Üstte Sabitlemeyi Kaldır (Pin Unfix)' : 'Pencereyi Tüm Ekranların Üstüne Sabitle (Always On Top)'}
        >
          <Pin className={`w-4 h-4 ${isAlwaysOnTop ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Edit Mode Toggle */}
      {!compactMode && (
        <div className="px-3 pt-2">
          <button
            onClick={() => {
              setIsEditMode((v) => !v);
              setEditingId(null);
            }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isEditMode
                ? 'bg-app-accent/10 text-app-accent border border-app-accent/30'
                : 'text-app-muted hover:text-app-primary hover:bg-app-secondary'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            {isEditMode ? 'Düzenleme Modunu Kapat' : 'Sekme İsimlerini Düzenle'}
          </button>

          {isEditMode && (
            <button
              onClick={() => { resetMenuLabels(); setEditingId(null); }}
              className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-app-muted hover:text-rose-500 transition-all mt-1"
            >
              <RotateCcw className="w-3 h-3" />
              Varsayılana Sıfırla
            </button>
          )}
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.filter(item => !hiddenTabs.includes(item.id) || isEditMode).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const label = menuLabels[item.id] || DEFAULT_MENU_LABELS[item.id];
          const isEditing = editingId === item.id;

          return (
            <div key={item.id} className="relative group/item">
              {isEditing ? (
                /* Inline Edit Input */
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <Icon className="w-5 h-5 shrink-0 text-app-accent" />
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 px-2 py-0.5 text-xs rounded-lg border border-app-accent bg-app-primary text-app-primary focus:outline-none"
                    placeholder={DEFAULT_MENU_LABELS[item.id]}
                  />
                  <button onClick={handleSaveEdit} className="text-emerald-500 hover:text-emerald-600 p-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleCancelEdit} className="text-rose-400 hover:text-rose-600 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => !isEditMode && setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive && !isEditMode
                      ? 'bg-app-accent text-white shadow-sm'
                      : isEditMode
                      ? 'text-app-secondary hover:bg-app-surface-hover cursor-default'
                      : 'text-app-secondary hover:bg-app-surface-hover hover:text-app-primary'
                  }`}
                  title={compactMode ? label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!compactMode && <span className="flex-1 text-left truncate">{label}</span>}
                  {/* Edit pen icon on hover in edit mode */}
                  {isEditMode && !compactMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(item.id, label); }}
                      className="opacity-0 group-hover/item:opacity-100 p-1 rounded-md hover:bg-app-accent/10 text-app-accent transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </nav>

      {/* Tools Section */}
      <div className="p-3 border-t border-app">
        <button
          onClick={onOpenStandup}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm`}
          title="Günlük Stand-up"
        >
          <LayoutList className="w-4 h-4" />
          {!compactMode && <span>Stand-up Raporu</span>}
        </button>
      </div>

      {/* Quick Theme Switcher at bottom */}
      <div className="p-3 border-t border-app">
        <div className={`flex items-center justify-between p-2 rounded-xl bg-app-secondary ${compactMode ? 'flex-col gap-2' : ''}`}>
          {!compactMode && <span className="text-xs font-semibold text-app-secondary">Tema</span>}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light' ? 'bg-app-surface text-app-accent shadow-sm' : 'text-app-muted hover:text-app-primary'
              }`}
              title="Açık (Soft Light)"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'dark' ? 'bg-app-surface text-app-accent shadow-sm' : 'text-app-muted hover:text-app-primary'
              }`}
              title="Koyu (Deep Dark)"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('pastel')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'pastel' ? 'bg-app-surface text-app-accent shadow-sm' : 'text-app-muted hover:text-app-primary'
              }`}
              title="Pastel (Calm)"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
