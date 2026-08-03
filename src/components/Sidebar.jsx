import React from 'react';
import { LayoutList, Kanban, Calendar, GraduationCap, Flame, BookHeart, NotebookPen, BarChart3, Search, Settings, Sparkles, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { theme, setTheme, compactMode } = useSettingsStore();

  const menuItems = [
    { id: 'tasks', label: 'Görevler', icon: LayoutList },
    { id: 'board', label: 'Pano (Kanban)', icon: Kanban },
    { id: 'calendar', label: 'Takvim', icon: Calendar },
    { id: 'courses', label: 'Eğitimler', icon: GraduationCap },
    { id: 'habits', label: 'Alışkanlıklar', icon: Flame },
    { id: 'journal', label: 'Günlük (Journal)', icon: BookHeart },
    { id: 'notes', label: 'Not Defteri', icon: NotebookPen },
    { id: 'search', label: 'Gelişmiş Arama', icon: Search },
    { id: 'analytics', label: 'Analiz & Raporlar', icon: BarChart3 },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <aside className={`flex flex-col border-r border-app bg-app-surface transition-all duration-200 ${compactMode ? 'w-16' : 'w-60'} h-screen select-none`}>
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-4 border-b border-app">
        <div className="w-9 h-9 rounded-xl bg-app-accent flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-5 h-5" />
        </div>
        {!compactMode && (
          <div>
            <h1 className="font-bold text-lg leading-none text-app-primary">FocusFlow</h1>
            <span className="text-xs text-app-muted font-medium">Masaüstü Odaklık</span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-app-accent text-white shadow-sm'
                  : 'text-app-secondary hover:bg-app-surface-hover hover:text-app-primary'
              }`}
              title={compactMode ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!compactMode && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

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
