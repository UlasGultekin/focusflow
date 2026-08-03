import { create } from 'zustand';

let autoSaveTimer = null;

export const useJournalStore = create((set, get) => ({
  selectedDate: new Date().toISOString().slice(0, 10),
  currentEntry: { content: '', mood: 4 },
  allEntries: [],
  isSaving: false,
  saveStatus: '', // 'Kaydedildi ✅'

  setSelectedDate: (dateStr) => {
    set({ selectedDate: dateStr });
    get().fetchEntryForDate(dateStr);
  },

  fetchEntryForDate: async (dateStr) => {
    if (window.electronAPI) {
      const entry = await window.electronAPI.getJournalEntry(dateStr);
      set({
        currentEntry: entry || { content: '', mood: 4 },
        saveStatus: '',
      });
    }
  },

  fetchAllEntries: async () => {
    if (window.electronAPI) {
      const entries = await window.electronAPI.getAllJournalEntries();
      set({ allEntries: entries || [] });
    }
  },

  updateContentLocally: (content) => {
    set((state) => ({
      currentEntry: { ...state.currentEntry, content },
      saveStatus: 'Yazılıyor...',
    }));

    // Auto-save debounce (1.5 seconds)
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      get().saveCurrentEntry();
    }, 1500);
  },

  setMoodLocally: (mood) => {
    set((state) => ({
      currentEntry: { ...state.currentEntry, mood },
    }));
    get().saveCurrentEntry();
  },

  saveCurrentEntry: async () => {
    const { selectedDate, currentEntry } = get();
    if (window.electronAPI) {
      set({ isSaving: true });
      await window.electronAPI.saveJournalEntry(
        selectedDate,
        currentEntry.content || '',
        currentEntry.mood || 4
      );
      set({ isSaving: false, saveStatus: 'Kaydedildi ✅' });
      await get().fetchAllEntries();
    }
  },

  searchJournal: async (query) => {
    if (window.electronAPI) {
      if (!query.trim()) {
        await get().fetchAllEntries();
        return;
      }
      const results = await window.electronAPI.searchJournal(query);
      set({ allEntries: results || [] });
    }
  },
}));
