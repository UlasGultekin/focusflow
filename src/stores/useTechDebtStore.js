import { create } from 'zustand';
import { useTaskStore } from './useTaskStore';

export const useTechDebtStore = create((set, get) => ({
  techDebts: [],
  isLoading: false,

  fetchTechDebts: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const items = await window.electronAPI.getTechDebts();
        set({ techDebts: items || [] });
      }
    } catch (err) {
      console.error('Teknik borçlar yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addTechDebt: async (data) => {
    if (window.electronAPI) {
      const newItem = await window.electronAPI.addTechDebt(data);
      await get().fetchTechDebts();
      return newItem;
    }
  },

  updateTechDebt: async (id, data) => {
    if (window.electronAPI) {
      await window.electronAPI.updateTechDebt(id, data);
      await get().fetchTechDebts();
    }
  },

  deleteTechDebt: async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteTechDebt(id);
      await get().fetchTechDebts();
    }
  },

  convertToTask: async (item) => {
    if (window.electronAPI) {
      const taskData = {
        title: item.title,
        description: `**(Teknik Borç'tan Dönüştürüldü)**\n\n**Kategori:** ${item.category || 'Belirtilmedi'}\n\n${item.description || ''}`,
        priority: item.priority || 'medium',
        category: 'Teknik İyileştirme',
        estimated_minutes: item.estimated_minutes || 60,
        planned_date: item.planned_date || null,
        task_type: 'task',
        status: 'todo'
      };
      
      const newTask = await useTaskStore.getState().addTask(taskData);
      if (newTask && newTask.id) {
        await window.electronAPI.updateTechDebt(item.id, { task_id: newTask.id });
        await get().fetchTechDebts();
      }
    }
  }
}));
