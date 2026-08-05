import { create } from 'zustand';
import { useTaskStore } from './useTaskStore';

export const useBugStore = create((set, get) => ({
  bugs: [],
  isLoading: false,

  fetchBugs: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const bugs = await window.electronAPI.getBugs();
        set({ bugs: bugs || [] });
      }
    } catch (err) {
      console.error('Hatalar yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addBug: async (data) => {
    if (window.electronAPI) {
      const newBug = await window.electronAPI.addBug(data);
      await get().fetchBugs();
      return newBug;
    }
  },

  updateBug: async (id, data) => {
    if (window.electronAPI) {
      await window.electronAPI.updateBug(id, data);
      await get().fetchBugs();
    }
  },

  deleteBug: async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteBug(id);
      await get().fetchBugs();
    }
  },

  convertToTask: async (bug, taskType = 'task', options = {}) => {
    if (window.electronAPI) {
      let typeLabel = 'Geliştirme / Çözüm';
      if (taskType === 'inspection') typeLabel = 'İnceleme & Araştırma';
      if (taskType === 'meeting') typeLabel = 'Toplantı & Görüşme';

      const taskData = {
        title: options.customTitle || `[${typeLabel}] ${bug.title}`,
        description: `**(Bug - ${typeLabel})**\n\n**Önem Derecesi:** ${bug.severity || 'Belirtilmedi'}\n**Ortam:** ${bug.environment || 'Belirtilmedi'}\n**Adımlar:**\n${bug.reproduction_steps || 'Belirtilmedi'}\n\n${bug.description || ''}`,
        priority: bug.priority || 'medium',
        category: 'Hata Çözümü',
        planned_date: options.plannedDate || bug.planned_date || null,
        planned_start_time: options.plannedTime || '10:00',
        task_type: taskType === 'meeting' ? 'event' : 'task',
        status: 'todo'
      };
      
      const newTask = await useTaskStore.getState().addTask(taskData);
      if (newTask && newTask.id) {
        if (options.removeFromList) {
          await window.electronAPI.deleteBug(bug.id);
        } else {
          await window.electronAPI.updateBug(bug.id, { task_id: newTask.id });
        }
        await get().fetchBugs();
      }
      return newTask;
    }
  }
}));
