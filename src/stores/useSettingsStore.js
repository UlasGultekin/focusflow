import { create } from 'zustand';

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
}));
