import { create } from 'zustand';
import { useTaskStore } from './useTaskStore';
import { useSettingsStore } from './useSettingsStore';

let timerInterval = null;

export const useTimerStore = create((set, get) => ({
  mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
  status: 'idle', // 'idle', 'running', 'paused'
  timeLeft: 25 * 60, // in seconds
  totalDuration: 25 * 60,
  completedPomodoros: 0,
  currentSessionId: null,
  lastEndedSession: null, // { session, task } for SessionEndModal (Görev 19)

  closeSessionEndModal: () => set({ lastEndedSession: null }),

  setMode: (mode) => {
    get().pauseTimer();
    const pomodoro = useSettingsStore.getState().pomodoro;
    let minutes = 25;
    if (mode === 'focus') minutes = pomodoro.focus_duration || 25;
    if (mode === 'shortBreak') minutes = pomodoro.short_break || 5;
    if (mode === 'longBreak') minutes = pomodoro.long_break || 15;

    const totalSeconds = minutes * 60;
    set({
      mode,
      status: 'idle',
      timeLeft: totalSeconds,
      totalDuration: totalSeconds,
    });
  },

  startTimer: async () => {
    if (get().status === 'running') return;

    // Start session in DB if in focus mode and starting from idle
    if (get().mode === 'focus' && get().status === 'idle') {
      const selectedTaskId = useTaskStore.getState().selectedTaskId;
      if (window.electronAPI) {
        const session = await window.electronAPI.startSession(selectedTaskId, 'pomodoro');
        set({ currentSessionId: session.id });
      }
    }

    set({ status: 'running' });

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      get().tick();
    }, 1000);
  },

  pauseTimer: () => {
    clearInterval(timerInterval);
    set({ status: 'paused' });
  },

  resetTimer: async () => {
    clearInterval(timerInterval);
    const { mode, currentSessionId } = get();

    if (currentSessionId && window.electronAPI) {
      const endedSession = await window.electronAPI.endSession(currentSessionId);
      const selectedTaskId = useTaskStore.getState().selectedTaskId;
      const task = useTaskStore.getState().tasks.find((t) => t.id === selectedTaskId);
      if (endedSession) {
        set({ lastEndedSession: { session: endedSession, task } });
      }
    }

    const pomodoro = useSettingsStore.getState().pomodoro;
    let minutes = 25;
    if (mode === 'focus') minutes = pomodoro.focus_duration || 25;
    if (mode === 'shortBreak') minutes = pomodoro.short_break || 5;
    if (mode === 'longBreak') minutes = pomodoro.long_break || 15;

    const totalSeconds = minutes * 60;
    set({
      status: 'idle',
      timeLeft: totalSeconds,
      totalDuration: totalSeconds,
      currentSessionId: null,
    });
  },

  skipTimer: () => {
    get().onTimerComplete();
  },

  tick: () => {
    const { timeLeft } = get();
    if (timeLeft <= 1) {
      get().onTimerComplete();
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  onTimerComplete: async () => {
    clearInterval(timerInterval);
    const { mode, completedPomodoros, currentSessionId } = get();
    const pomodoroSettings = useSettingsStore.getState().pomodoro;

    // End active session in database and trigger session notes modal
    if (currentSessionId && window.electronAPI) {
      const endedSession = await window.electronAPI.endSession(currentSessionId);
      const selectedTaskId = useTaskStore.getState().selectedTaskId;
      const task = useTaskStore.getState().tasks.find((t) => t.id === selectedTaskId);

      if (endedSession) {
        set({ lastEndedSession: { session: endedSession, task } });
      }

      if (selectedTaskId) {
        useTaskStore.getState().fetchTaskSessions(selectedTaskId);
        useTaskStore.getState().fetchTasks();
      }
    }

    // Send Notification
    if (window.electronAPI) {
      if (mode === 'focus') {
        window.electronAPI.showNotification('Odaklanma Süresi Bitti! 🎉', 'Tebrikler! Şimdi kısa bir mola verme zamanı.');
      } else {
        window.electronAPI.showNotification('Mola Bitti! 💪', 'Yeni bir odaklanma seansına başlamaya hazır mısın?');
      }
    }

    // Switch modes automatically
    if (mode === 'focus') {
      const nextCompleted = completedPomodoros + 1;
      const isLongBreak = nextCompleted % (pomodoroSettings.long_break_interval || 4) === 0;
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
      const minutes = isLongBreak ? (pomodoroSettings.long_break || 15) : (pomodoroSettings.short_break || 5);
      const totalSeconds = minutes * 60;

      set({
        completedPomodoros: nextCompleted,
        mode: nextMode,
        status: 'idle',
        timeLeft: totalSeconds,
        totalDuration: totalSeconds,
        currentSessionId: null,
      });
    } else {
      const minutes = pomodoroSettings.focus_duration || 25;
      const totalSeconds = minutes * 60;
      set({
        mode: 'focus',
        status: 'idle',
        timeLeft: totalSeconds,
        totalDuration: totalSeconds,
        currentSessionId: null,
      });
    }
  },
}));
