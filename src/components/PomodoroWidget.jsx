import React, { useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Flame, MoonStar, Pin } from 'lucide-react';
import { useTimerStore } from '../stores/useTimerStore';
import { useTaskStore } from '../stores/useTaskStore';

export default function PomodoroWidget() {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  const togglePin = async () => {
    if (window.electronAPI?.openWidget) {
      await window.electronAPI.openWidget('pomodoro', null);
    } else if (window.electronAPI?.toggleAlwaysOnTop) {
      const nextState = !isAlwaysOnTop;
      const res = await window.electronAPI.toggleAlwaysOnTop(nextState);
      setIsAlwaysOnTop(res);
    }
  };
  const {
    mode,
    status,
    timeLeft,
    totalDuration,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    completedPomodoros,
  } = useTimerStore();

  const { tasks, selectedTaskId } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circular progress calculation
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="bg-app-surface border border-app rounded-2xl p-4 shadow-sm flex items-center gap-5">
      {/* Circular Progress Bar */}
      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          {/* Background Ring */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            className="stroke-app border-app"
            strokeWidth="5"
            fill="transparent"
            style={{ stroke: 'var(--border-color)' }}
          />
          {/* Animated Progress Ring */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            strokeWidth="5"
            strokeLinecap="round"
            fill="transparent"
            style={{
              stroke: 'var(--accent-color)',
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>

        {/* Center Time Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-base tracking-tight text-app-primary">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] text-app-muted font-semibold uppercase">
            {mode === 'focus' ? 'Odak' : mode === 'shortBreak' ? 'Kısa Mola' : 'Uzun Mola'}
          </span>
        </div>
      </div>

      {/* Details & Controls */}
      <div className="flex-1 min-w-0">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 mb-2 bg-app-secondary p-1 rounded-lg w-fit">
          <button
            onClick={() => setMode('focus')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              mode === 'focus'
                ? 'bg-app-surface text-app-accent shadow-sm'
                : 'text-app-muted hover:text-app-primary'
            }`}
          >
            Odak (25dk)
          </button>
          <button
            onClick={() => setMode('shortBreak')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              mode === 'shortBreak'
                ? 'bg-app-surface text-app-accent shadow-sm'
                : 'text-app-muted hover:text-app-primary'
            }`}
          >
            Kısa Mola (5dk)
          </button>
          <button
            onClick={() => setMode('longBreak')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              mode === 'longBreak'
                ? 'bg-app-surface text-app-accent shadow-sm'
                : 'text-app-muted hover:text-app-primary'
            }`}
          >
            Uzun Mola (15dk)
          </button>
        </div>

        {/* Selected Task Target */}
        <div className="text-xs text-app-secondary truncate mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-app-accent inline-block"></span>
          {selectedTask ? (
            <span className="truncate font-medium">Bağlı Görev: <strong className="text-app-primary">{selectedTask.title}</strong></span>
          ) : (
            <span className="text-app-muted">Genel Odaklanma Seansı</span>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {status === 'running' ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-accent text-white font-semibold text-xs shadow-sm hover:opacity-90 transition-all"
            >
              <Pause className="w-3.5 h-3.5" /> Duraklat
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-accent text-white font-semibold text-xs shadow-sm hover:opacity-90 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {status === 'paused' ? 'Devam Et' : 'Başlat'}
            </button>
          )}

          <button
            onClick={resetTimer}
            className="p-1.5 rounded-lg border border-app text-app-secondary hover:bg-app-surface-hover hover:text-app-primary transition-all"
            title="Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={skipTimer}
            className="p-1.5 rounded-lg border border-app text-app-secondary hover:bg-app-surface-hover hover:text-app-primary transition-all"
            title="Sonraki Aşamaya Atla"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePin}
            className={`p-1.5 rounded-lg border transition-all ${
              isAlwaysOnTop
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'border-app text-app-secondary hover:bg-app-surface-hover hover:text-app-primary'
            }`}
            title={isAlwaysOnTop ? 'Üstte Sabitlemeyi Kaldır' : 'Pencereyi Her Zaman Üstte Tut (Always On Top)'}
          >
            <Pin className={`w-3.5 h-3.5 ${isAlwaysOnTop ? 'fill-current' : ''}`} />
          </button>

          <div className="ml-auto text-xs font-semibold text-app-muted flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{completedPomodoros} Seans</span>
          </div>
        </div>
      </div>
    </div>
  );
}
