import React, { useState } from 'react';
import { Play, Pause, RotateCcw, X, Flame, Clock, CheckCircle2, Pin, NotebookPen, LayoutList, Layers } from 'lucide-react';
import { useTimerStore } from '../stores/useTimerStore';
import { useTaskStore } from '../stores/useTaskStore';

export default function FloatingWidgetView({ initialData }) {
  const [activeTab, setActiveTab] = useState(initialData?.type || 'pomodoro');
  const [pinnedItems, setPinnedItems] = useState(() => {
    const list = [];
    if (initialData?.data) {
      list.push({ type: initialData.type, data: initialData.data });
    }
    return list;
  });

  const {
    mode,
    status,
    timeLeft,
    startTimer,
    pauseTimer,
    resetTimer,
    completedPomodoros,
  } = useTimerStore();

  const { tasks, selectedTaskId, allNotes } = useTaskStore();
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="w-screen h-screen p-3.5 bg-slate-950/95 text-white rounded-3xl border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden" style={{ WebkitAppRegion: 'drag' }}>
      {/* Widget Drag Handle & Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            <Pin className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-extrabold tracking-tight text-slate-100">
            FocusFlow Masaüstü Hub
          </span>
        </div>
        <button
          onClick={handleClose}
          style={{ WebkitAppRegion: 'no-drag' }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Selector Header */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-2" style={{ WebkitAppRegion: 'no-drag' }}>
        {[
          { id: 'pomodoro', label: '⏱️ Pomodoro', icon: Clock },
          { id: 'task', label: '📋 Görev', icon: LayoutList },
          { id: 'note', label: '📝 Notlar', icon: NotebookPen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Widget Body Content */}
      <div className="flex-1 flex flex-col justify-center space-y-3 overflow-y-auto px-1" style={{ WebkitAppRegion: 'no-drag' }}>
        {activeTab === 'pomodoro' ? (
          <div className="text-center space-y-2.5">
            <div className="text-4xl font-extrabold tracking-tight text-amber-400 font-mono">
              {formatTime(timeLeft)}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {mode === 'focus' ? '🎯 Odaklanma Seansı' : '☕ Mola Seansı'}
            </div>

            {selectedTask ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-left">
                <span className="text-slate-400 font-semibold block text-[10px]">Aktif Görev:</span>
                <strong className="text-white leading-snug line-clamp-2">{selectedTask.title}</strong>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 italic">
                Aktif seçili görev yok
              </div>
            )}

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {status === 'running' ? (
                <button
                  onClick={pauseTimer}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 hover:bg-amber-400 transition-all shadow-md"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" /> Duraklat
                </button>
              ) : (
                <button
                  onClick={startTimer}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 hover:bg-amber-400 transition-all shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Başlat
                </button>
              )}
              <button
                onClick={resetTimer}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : activeTab === 'task' ? (
          <div className="space-y-2 text-left">
            {selectedTask || initialData?.data ? (
              (() => {
                const target = selectedTask || initialData.data;
                return (
                  <div className="space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {target.category || 'Görev'}
                    </span>
                    <h3 className="font-bold text-sm text-white leading-snug">
                      {target.title}
                    </h3>
                    {target.description && (
                      <p className="text-xs text-slate-300 line-clamp-5 leading-relaxed font-medium">
                        {target.description}
                      </p>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Görüntülenecek aktif görev yok.
              </div>
            )}
          </div>
        ) : activeTab === 'note' ? (
          <div className="space-y-2 text-left">
            {initialData?.type === 'note' && initialData?.data ? (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {initialData.data.category || 'Sabitlenmiş Not'}
                </span>
                <div className="text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-medium">
                  {initialData.data.content}
                </div>
              </div>
            ) : allNotes && allNotes.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {allNotes.slice(0, 3).map((note) => (
                  <div key={note.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {note.category || 'Not'}
                    </span>
                    <p className="text-xs text-slate-200 line-clamp-3 font-medium">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Kayıtlı not bulunamadı.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Widget Footer Status */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-semibold" style={{ WebkitAppRegion: 'drag' }}>
        <span className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-500" /> FocusFlow Hub
        </span>
        <span>{completedPomodoros} Seans Bitti</span>
      </div>
    </div>
  );
}
