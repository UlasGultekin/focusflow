import { create } from 'zustand';
import { useTaskStore } from './useTaskStore';

let sessionTimerInterval = null;

export const useCourseStore = create((set, get) => ({
  courses: [],
  activeCourseSession: null, // { id, course_id, start_time }
  sessionElapsedSeconds: 0,
  isLoading: false,

  fetchCourses: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const courses = await window.electronAPI.getCourses();
        set({ courses: courses || [] });
      }
    } catch (err) {
      console.error('Eğitimler yüklenirken hata:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addCourse: async (courseData) => {
    if (window.electronAPI) {
      const newCourse = await window.electronAPI.addCourse(courseData);
      await get().fetchCourses();
      return newCourse;
    }
  },

  deleteCourse: async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteCourse(id);
      await get().fetchCourses();
    }
  },

  startCourseSession: async (courseId) => {
    if (window.electronAPI) {
      clearInterval(sessionTimerInterval);
      const session = await window.electronAPI.startCourseSession(courseId);
      set({ activeCourseSession: session, sessionElapsedSeconds: 0 });

      // Start live elapsed ticker every second
      sessionTimerInterval = setInterval(() => {
        set((state) => ({ sessionElapsedSeconds: state.sessionElapsedSeconds + 1 }));
      }, 1000);

      return session;
    }
  },

  endCourseSession: async () => {
    clearInterval(sessionTimerInterval);
    const { activeCourseSession } = get();
    if (activeCourseSession && window.electronAPI) {
      await window.electronAPI.endCourseSession(activeCourseSession.id);
      set({ activeCourseSession: null, sessionElapsedSeconds: 0 });
      await get().fetchCourses();
      useTaskStore.getState().fetchTasks();
    }
  },

  openExternalLink: (url) => {
    if (window.electronAPI && url) {
      const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      window.electronAPI.openExternal(validUrl);
    }
  },
}));
