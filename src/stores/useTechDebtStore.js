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

  convertToTask: async (item, taskType = 'task', options = {}) => {
    if (window.electronAPI) {
      let typeLabel = 'Geliştirme / Refactor';
      if (taskType === 'inspection') typeLabel = 'İnceleme & Araştırma';
      if (taskType === 'meeting') typeLabel = 'Toplantı & Görüşme';

      const taskData = {
        title: options.customTitle || `[${typeLabel}] ${item.title}`,
        description: `**(Teknik Borç - ${typeLabel})**\n\n**Kategori:** ${item.category || 'Belirtilmedi'}\n\n${item.description || ''}`,
        priority: item.priority || 'medium',
        category: 'Teknik İyileştirme',
        estimated_minutes: item.estimated_minutes || 60,
        planned_date: options.plannedDate || item.planned_date || null,
        planned_start_time: options.plannedTime || '10:00',
        task_type: taskType === 'meeting' ? 'event' : 'task',
        status: 'todo'
      };
      
      const newTask = await useTaskStore.getState().addTask(taskData);
      if (newTask && newTask.id) {
        if (options.removeFromList) {
          await window.electronAPI.deleteTechDebt(item.id);
        } else {
          await window.electronAPI.updateTechDebt(item.id, { task_id: newTask.id });
        }
        await get().fetchTechDebts();
      }
      return newTask;
    }
  }
}));
