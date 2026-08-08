import { create } from 'zustand';

const DEFAULT_MENU_LABELS = {
  dashboard: 'Kontrol Paneli (Dashboard)',
  tasks: 'Görevler',
  board: 'Pano (Kanban)',
  calendar: 'Takvim',
  courses: 'Eğitimler',
  habits: 'Alışkanlıklar',
  journal: 'Günlük (Journal)',
  notes: 'Not Defteri',
  search: 'Gelişmiş Arama',
  analytics: 'Analiz & Raporlar',
  settings: 'Ayarlar',
  links: 'Linkler',
  projects: 'Projeler',
  bugs: 'Hatalar (Bugs)',
  tech_debts: 'Teknik Borçlar',
};

function loadMenuLabels() {
  try {
    const saved = localStorage.getItem('focusflow_menu_labels');
    if (saved) return { ...DEFAULT_MENU_LABELS, ...JSON.parse(saved) };
  } catch (_) {}
  return { ...DEFAULT_MENU_LABELS };
}

function loadHiddenTabs() {
  try {
    const saved = localStorage.getItem('focusflow_hidden_tabs');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return [];
}

export { DEFAULT_MENU_LABELS };

export const useSettingsStore = create((set, get) => ({
  theme: 'light', // light, dark, pastel
  compactMode: false,
  hotkeys: 'Ctrl+Shift+Space',
  pomodoro: {
    focus_duration: 25,
    short_break: 5,
    long_break: 15,
    long_break_interval: 4,
  },
  menuLabels: loadMenuLabels(),
  hiddenTabs: loadHiddenTabs(),
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getSettings();
        if (settings) {
          const theme = settings.theme || 'light';
          document.body.setAttribute('data-theme', theme);
          set({
            theme,
            compactMode: Boolean(settings.compact_mode),
            hotkeys: settings.hotkeys || 'Ctrl+Shift+Space',
            pomodoro: settings.pomodoro || {
              focus_duration: 25,
              short_break: 5,
              long_break: 15,
              long_break_interval: 4,
            },
          });
        }
      }
    } catch (err) {
      console.error('Ayarlar yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  setTheme: async (theme) => {
    document.body.setAttribute('data-theme', theme);
    set({ theme });
    if (window.electronAPI) {
      await window.electronAPI.updateSettings({ theme });
    }
  },

  setCompactMode: async (compactMode) => {
    set({ compactMode });
    if (window.electronAPI) {
      await window.electronAPI.updateSettings({ compact_mode: compactMode });
    }
  },

  updatePomodoroSettings: async (pomodoro) => {
    set({ pomodoro });
    if (window.electronAPI) {
      await window.electronAPI.updateSettings({ pomodoro });
    }
  },

  updateHotkeys: async (hotkeys) => {
    set({ hotkeys });
    if (window.electronAPI) {
      await window.electronAPI.updateSettings({ hotkeys });
    }
  },

  setMenuLabel: (tabId, label) => {
    const current = get().menuLabels;
    const updated = { ...current, [tabId]: label || DEFAULT_MENU_LABELS[tabId] };
    set({ menuLabels: updated });
    try {
      localStorage.setItem('focusflow_menu_labels', JSON.stringify(updated));
    } catch (_) {}
  },

  resetMenuLabels: () => {
    const reset = { ...DEFAULT_MENU_LABELS };
    set({ menuLabels: reset });
    try {
      localStorage.removeItem('focusflow_menu_labels');
    } catch (_) {}
  },

  toggleHiddenTab: (tabId) => {
    const { hiddenTabs } = get();
    const updated = hiddenTabs.includes(tabId)
      ? hiddenTabs.filter(id => id !== tabId)
      : [...hiddenTabs, tabId];
    
    set({ hiddenTabs: updated });
    try {
      localStorage.setItem('focusflow_hidden_tabs', JSON.stringify(updated));
    } catch (_) {}
  },
}));
