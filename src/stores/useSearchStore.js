import { create } from 'zustand';

export const useSearchStore = create((set, get) => ({
  isCommandPaletteOpen: false,
  query: '',
  suggestions: [],
  results: [],
  isLoading: false,
  filters: {
    sourceTypes: [],
    status: 'all',
    dateFrom: '',
    dateTo: '',
    taskId: null,
  },

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: (override) =>
    set((state) => ({
      isCommandPaletteOpen: typeof override === 'boolean' ? override : !state.isCommandPaletteOpen,
    })),

  setQuery: (query) => {
    set({ query });
    get().fetchSuggestions(query);
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().performSearch();
  },

  fetchSuggestions: async (partialQuery) => {
    if (!partialQuery || !partialQuery.trim()) {
      set({ suggestions: [] });
      return;
    }
    try {
      if (window.electronAPI && window.electronAPI.getSearchSuggestions) {
        const suggestions = await window.electronAPI.getSearchSuggestions(partialQuery);
        set({ suggestions: suggestions || [] });
      }
    } catch (err) {
      console.error('Arama önerileri yüklenirken hata:', err);
    }
  },

  performSearch: async (queryOverride) => {
    const q = typeof queryOverride === 'string' ? queryOverride : get().query;
    const { filters } = get();

    set({ isLoading: true });
    try {
      if (window.electronAPI && window.electronAPI.searchAll) {
        const results = await window.electronAPI.searchAll(q, filters);
        set({ results: results || [], query: q });
      }
    } catch (err) {
      console.error('Arama gerçekleştirilirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  rebuildIndex: async () => {
    try {
      if (window.electronAPI && window.electronAPI.rebuildSearchIndex) {
        await window.electronAPI.rebuildSearchIndex();
        await get().performSearch();
      }
    } catch (err) {
      console.error('İndeks yenilenirken hata:', err);
    }
  },
}));
