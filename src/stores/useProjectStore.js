import { create } from 'zustand';

export const useProjectStore = create((set, get) => ({
  projects: [],
  selectedProjectId: null,
  plans: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI?.getProjects) {
        const projects = await window.electronAPI.getProjects();
        set({ projects: projects || [] });

        // Auto-select first project if none selected
        const currentSelectedId = get().selectedProjectId;
        if (projects && projects.length > 0) {
          const exists = projects.some((p) => p.id === currentSelectedId);
          if (!currentSelectedId || !exists) {
            set({ selectedProjectId: projects[0].id });
            get().fetchProjectPlans(projects[0].id);
          }
        } else {
          set({ selectedProjectId: null, plans: [] });
        }
      }
    } catch (err) {
      console.error('Projeler yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  selectProject: (id) => {
    set({ selectedProjectId: id });
    get().fetchProjectPlans(id);
  },

  fetchProjectPlans: async (projectId) => {
    if (!projectId) return;
    try {
      if (window.electronAPI?.getProjectPlans) {
        const plans = await window.electronAPI.getProjectPlans(projectId);
        set({ plans: plans || [] });
      }
    } catch (err) {
      console.error('Proje planları yüklenirken hata:', err);
    }
  },

  addProject: async (data) => {
    if (window.electronAPI?.addProject) {
      const id = await window.electronAPI.addProject(data);
      await get().fetchProjects();
      if (id) get().selectProject(id);
    }
  },

  updateProject: async (id, data) => {
    if (window.electronAPI?.updateProject) {
      await window.electronAPI.updateProject(id, data);
      await get().fetchProjects();
    }
  },

  deleteProject: async (id) => {
    if (window.electronAPI?.deleteProject) {
      await window.electronAPI.deleteProject(id);
      await get().fetchProjects();
    }
  },

  addProjectPlan: async (data) => {
    if (window.electronAPI?.addProjectPlan) {
      await window.electronAPI.addProjectPlan(data);
      if (data.project_id) {
        await get().fetchProjectPlans(data.project_id);
        await get().fetchProjects();
      }
    }
  },

  updateProjectPlan: async (id, projectId, data) => {
    if (window.electronAPI?.updateProjectPlan) {
      await window.electronAPI.updateProjectPlan(id, data);
      if (projectId) {
        await get().fetchProjectPlans(projectId);
        await get().fetchProjects();
      }
    }
  },

  deleteProjectPlan: async (id, projectId) => {
    if (window.electronAPI?.deleteProjectPlan) {
      await window.electronAPI.deleteProjectPlan(id);
      if (projectId) {
        await get().fetchProjectPlans(projectId);
        await get().fetchProjects();
      }
    }
  },

  convertPlanToTask: async (planId, projectId) => {
    if (window.electronAPI?.convertPlanToTask) {
      const taskId = await window.electronAPI.convertPlanToTask(planId);
      if (projectId) {
        await get().fetchProjectPlans(projectId);
      }
      return taskId;
    }
  },

  convertPlanToNote: async (planId, projectId, customCategory, customPhase, customNotes) => {
    if (window.electronAPI?.convertPlanToNote) {
      const noteId = await window.electronAPI.convertPlanToNote(planId, customCategory, customPhase, customNotes);
      if (projectId) {
        await get().fetchProjectPlans(projectId);
      }
      return noteId;
    }
  },
}));
