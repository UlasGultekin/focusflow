import { create } from 'zustand';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  allNotes: [],
  selectedTaskId: null,
  activeSession: null,
  isLoading: false,
  filterStatus: 'active',
  filterCategory: 'all',
  searchQuery: '',
  subtasksMap: {}, // taskId -> subtasks array

  setFilterStatus: (filterStatus) => {
    set({ filterStatus });
    get().fetchTasks(filterStatus);
  },

  setFilterCategory: (filterCategory) => {
    set({ filterCategory });
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
  },

  fetchTasks: async (filterStatus) => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const currentFilter = filterStatus || get().filterStatus || 'all';
        const tasks = await window.electronAPI.getTasks(currentFilter);
        set({ tasks: tasks || [] });

        // Auto-select first task if none selected or current selected no longer exists
        const currentSelectedId = get().selectedTaskId;
        if (tasks && tasks.length > 0) {
          const exists = tasks.some((t) => t.id === currentSelectedId);
          if (!currentSelectedId || !exists) {
            set({ selectedTaskId: tasks[0].id });
          }
        } else {
          set({ selectedTaskId: null });
        }
      }
    } catch (err) {
      console.error('Görevler yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  selectTask: (id) => {
    set({ selectedTaskId: id });
  },

  addTask: async (taskData) => {
    if (window.electronAPI) {
      const newTask = await window.electronAPI.addTask(taskData);
      set({ filterStatus: 'all', searchQuery: '', filterCategory: 'all' });
      await get().fetchTasks('all');
      if (newTask && newTask.id) {
        set({ selectedTaskId: newTask.id });
      }
      return newTask;
    }
  },

  updateTask: async (id, taskData) => {
    if (window.electronAPI) {
      const updated = await window.electronAPI.updateTask(id, taskData);
      await get().fetchTasks();
      return updated;
    }
  },

  deleteTask: async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteTask(id);
      const { selectedTaskId } = get();
      if (selectedTaskId === id) {
        set({ selectedTaskId: null });
      }
      await get().fetchTasks();
    }
  },

  // SUBTASKS (Görev 18)
  fetchSubtasks: async (taskId) => {
    if (window.electronAPI && window.electronAPI.getSubtasks) {
      const list = await window.electronAPI.getSubtasks(taskId);
      set((state) => ({
        subtasksMap: { ...state.subtasksMap, [taskId]: list || [] },
      }));
    }
  },

  addSubtask: async (taskId, title) => {
    if (window.electronAPI && window.electronAPI.addSubtask) {
      await window.electronAPI.addSubtask(taskId, title);
      await get().fetchSubtasks(taskId);
      await get().fetchTasks();
    }
  },

  updateSubtask: async (id, taskId, data) => {
    if (window.electronAPI && window.electronAPI.updateSubtask) {
      await window.electronAPI.updateSubtask(id, data);
      await get().fetchSubtasks(taskId);
      await get().fetchTasks();
    }
  },

  deleteSubtask: async (id, taskId) => {
    if (window.electronAPI && window.electronAPI.deleteSubtask) {
      await window.electronAPI.deleteSubtask(id);
      await get().fetchSubtasks(taskId);
      await get().fetchTasks();
    }
  },

  reorderSubtasks: async (taskId, orderedIds) => {
    if (window.electronAPI && window.electronAPI.reorderSubtasks) {
      await window.electronAPI.reorderSubtasks(taskId, orderedIds);
      await get().fetchSubtasks(taskId);
    }
  },

  // SESSIONS
  startSession: async (taskId, type = 'manual') => {
    if (window.electronAPI) {
      const session = await window.electronAPI.startSession(taskId, type);
      set({ activeSession: session });
      await get().fetchTasks();
      return session;
    }
  },

  endSession: async () => {
    const { activeSession } = get();
    if (activeSession && window.electronAPI) {
      await window.electronAPI.endSession(activeSession.id);
      set({ activeSession: null });
      await get().fetchTasks();
    }
  },

  // GENEL NOTLAR
  fetchAllNotes: async () => {
    if (window.electronAPI) {
      const notes = await window.electronAPI.getNotes(null);
      set({ allNotes: notes || [] });
    }
  },

  addNote: async (content, taskId, category, images, attachments = [], plannedDate = null, plannedStartTime = null) => {
    if (window.electronAPI) {
      const imagesJson = JSON.stringify(images || []);
      const attachmentsJson = JSON.stringify(attachments || []);
      const newNote = await window.electronAPI.addNote(
        content, taskId || null, category || 'Genel', imagesJson, attachmentsJson, plannedDate, plannedStartTime
      );
      await get().fetchAllNotes();
      return newNote;
    }
  },

  updateNote: async (id, content, taskId, category, images, attachments = [], plannedDate = null, plannedStartTime = null) => {
    if (window.electronAPI) {
      const imagesJson = images !== undefined ? JSON.stringify(images || []) : null;
      const attachmentsJson = attachments !== undefined ? JSON.stringify(attachments || []) : null;
      const updated = await window.electronAPI.updateNote(
        id, content, category, imagesJson, attachmentsJson, plannedDate, plannedStartTime
      );
      await get().fetchAllNotes();
      return updated;
    }
  },

  deleteNote: async (id, taskId) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteNote(id);
      await get().fetchAllNotes();
    }
  },
}));
