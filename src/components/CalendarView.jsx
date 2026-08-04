import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  AlertTriangle,
  Tag,
  CheckCircle2,
  CalendarDays,
  StickyNote,
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from 'date-fns';
import { tr } from 'date-fns/locale';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 to 23:00

export default function CalendarView() {
  const { tasks, addTask, updateTask, allNotes, fetchAllNotes } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planCategory, setPlanCategory] = useState('Plan');
  const [planTime, setPlanTime] = useState('10:00');
  const [planDuration, setPlanDuration] = useState(60);
  const [planType, setPlanType] = useState('task'); // 'task' | 'event'

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Filter tasks for the selected date
  const dayTasks = tasks.filter(
    (t) => t.planned_date && t.planned_date === selectedDateStr
  );

  const dayNotes = (allNotes || []).filter(
    (n) => n.planned_date && n.planned_date === selectedDateStr
  );

  useEffect(() => {
    if (fetchAllNotes) fetchAllNotes();
  }, []);

  // Unplanned tasks
  const unplannedTasks = tasks.filter((t) => !t.planned_date && t.status !== 'done');

  // Check for time overlap
  const timeCounts = {};
  dayTasks.forEach((t) => {
    if (t.planned_start_time) {
      const hour = parseInt(t.planned_start_time.split(':')[0], 10);
      timeCounts[hour] = (timeCounts[hour] || 0) + 1;
    }
  });
  dayNotes.forEach((n) => {
    if (n.planned_start_time) {
      const hour = parseInt(n.planned_start_time.split(':')[0], 10);
      timeCounts[hour] = (timeCounts[hour] || 0) + 1;
    }
  });

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    await addTask({
      title: planTitle.trim(),
      category: planCategory.trim() || 'Plan',
      estimated_minutes: parseInt(planDuration, 10) || 60,
      planned_date: selectedDateStr,
      planned_start_time: planTime,
      task_type: planType,
      status: 'todo',
      color: planType === 'event' ? '#FB7185' : '#5B8DEF',
    });

    setIsPlanModalOpen(false);
    setPlanTitle('');
  };

  const handleAssignToDate = async (task, time = '12:00') => {
    await updateTask(task.id, {
      planned_date: selectedDateStr,
      planned_start_time: time,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Dahili Takvim & Planlayıcı</h2>
            <p className="text-xs text-app-secondary">
              Gününüzü saatlik zaman çizelgesinde planlayın, çakışmaları görün
            </p>
          </div>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 rounded-xl border border-app text-app-primary font-semibold text-xs hover:bg-app-surface-hover transition-all"
          >
            Bugün
          </button>
          <div className="flex items-center gap-1 bg-app-secondary p-1 rounded-xl">
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="p-1 rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-surface"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-app-primary px-3">
              {format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1 rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-surface"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Etkinlik / Plan Ekle
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-6 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Unplanned Tasks Sidebar */}
        <div className="bg-app-surface border border-app rounded-2xl p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-app-primary flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-app-accent" /> Planlanmamış Görevler
          </h3>
          <p className="text-[11px] text-app-muted">Tıklayarak bu güne atayabilirsiniz:</p>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {unplannedTasks.length === 0 ? (
              <p className="text-xs text-app-muted text-center py-6">
                Tüm görevler planlanmış!
              </p>
            ) : (
              unplannedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleAssignToDate(t, '10:00')}
                  className="p-3 rounded-xl border border-app bg-app-primary hover:border-app-accent cursor-pointer transition-all text-xs group"
                >
                  <div className="font-semibold text-app-primary truncate">{t.title}</div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-app-muted">
                    <span>{t.estimated_minutes}dk</span>
                    <span className="text-app-accent font-semibold group-hover:underline">
                      Bu güne ata →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Daily Timeline (07:00 - 23:00) */}
        <div className="lg:col-span-3 bg-app-surface border border-app rounded-2xl p-5 shadow-xs space-y-1">
          <div className="text-xs font-bold text-app-secondary border-b border-app pb-3 mb-2 flex items-center justify-between">
            <span>Saatlik Çizelge</span>
            <span>{dayTasks.length + dayNotes.length} Planlı Etkinlik</span>
          </div>

          <div className="space-y-2">
            {HOURS.map((hour) => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              
              const tasksForHour = dayTasks.filter((t) => {
                if (!t.planned_start_time) return false;
                const h = parseInt(t.planned_start_time.split(':')[0], 10);
                return h === hour;
              });

              const notesForHour = dayNotes.filter((n) => {
                if (!n.planned_start_time) return false;
                const h = parseInt(n.planned_start_time.split(':')[0], 10);
                return h === hour;
              });

              const isOverlap = tasksForHour.length + notesForHour.length > 1;

              return (
                <div
                  key={hour}
                  className="flex items-start gap-4 p-2 rounded-xl hover:bg-app-surface-hover border border-transparent hover:border-app transition-all group"
                >
                  {/* Hour Label */}
                  <span className="w-14 text-xs font-mono font-bold text-app-muted pt-1">
                    {hourStr}
                  </span>

                  {/* Timeline Event Slot */}
                  <div className="flex-1 min-h-[44px] flex flex-wrap items-center gap-2 border-l-2 border-app pl-4">
                    {isOverlap && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Zaman Çakışması!
                      </span>
                    )}

                    {tasksForHour.length === 0 && notesForHour.length === 0 ? (
                      <button 
                        onClick={() => {
                          setPlanTime(hourStr);
                          setIsPlanModalOpen(true);
                        }}
                        className="text-[11px] text-app-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-app-primary cursor-pointer w-full text-left"
                      >
                        + Etkinlik Ekle
                      </button>
                    ) : (
                      <>
                        {tasksForHour.map((task) => (
                          <div
                            key={'t-' + task.id}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-xs flex items-center gap-2"
                            style={{ backgroundColor: task.color || '#5B8DEF' }}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.title}</span>
                            <span className="text-[10px] opacity-80">({task.estimated_minutes}dk)</span>
                          </div>
                        ))}
                        {notesForHour.map((note) => {
                          const noteTitle = (note.content || '').split('\n')[0] || 'Not';
                          return (
                            <div
                              key={'n-' + note.id}
                              className="px-3 py-2 rounded-xl text-xs font-semibold text-app-primary bg-amber-500/10 border border-amber-500/20 shadow-xs flex items-center gap-2"
                            >
                              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                              <span>{noteTitle}</span>
                              <span className="text-[10px] opacity-80 text-app-muted">(Not)</span>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-app-primary">
              Yeni Etkinlik / Plan Ekle ({selectedDateStr})
            </h3>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">Başlık *</label>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Örn: Müşteri Görüşmesi"
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={planTime}
                    onChange={(e) => setPlanTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Süre (dk)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs"
                >
                  Planla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
