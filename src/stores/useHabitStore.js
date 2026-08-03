import { create } from 'zustand';

export const useHabitStore = create((set, get) => ({
  habits: [],
  completions: [],
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const habits = await window.electronAPI.getHabits();
        const completions = await window.electronAPI.getHabitCompletions();
        set({ habits: habits || [], completions: completions || [] });
      }
    } catch (err) {
      console.error('Alışkanlıklar yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addHabit: async (habitData) => {
    if (window.electronAPI) {
      const newHabit = await window.electronAPI.addHabit(habitData);
      await get().fetchHabits();
      return newHabit;
    }
  },

  deleteHabit: async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteHabit(id);
      await get().fetchHabits();
    }
  },

  toggleCompletion: async (habitId, dateStr, value = 1) => {
    if (window.electronAPI) {
      await window.electronAPI.toggleHabitCompletion(habitId, dateStr, value);
      await get().fetchHabits();
    }
  },

  // Calculate current streak for a given habit
  getStreak: (habitId) => {
    const completions = get().completions.filter((c) => c.habit_id === habitId);
    if (!completions.length) return 0;

    const dates = new Set(completions.map((c) => c.date));
    let streak = 0;
    let checkDate = new Date();

    // Check today first, if not completed today check yesterday
    const todayStr = checkDate.toISOString().slice(0, 10);
    if (!dates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      if (dates.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  },
}));
