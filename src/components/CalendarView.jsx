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
  Bug,
  Wrench,
  Trash2,
  Repeat,
  Grid,
  List,
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';
import { useBugStore } from '../stores/useBugStore';
import { useTechDebtStore } from '../stores/useTechDebtStore';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  isBefore,
  isEqual,
  getDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { tr } from 'date-fns/locale';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 07:00 to 23:00

export default function CalendarView() {
  const { tasks, addTask, updateTask, deleteTask, deleteRecurringGroup, allNotes, fetchAllNotes } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month'

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planCategory, setPlanCategory] = useState('Plan');
  const [planTime, setPlanTime] = useState('10:00');
  const [planDuration, setPlanDuration] = useState(60);
  const [planType, setPlanType] = useState('task'); // 'task' | 'event'

  // Recurrence States
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('daily'); // 'daily' | 'weekdays' | 'custom_days'
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // 1: Mon, 2: Tue, ..., 0: Sun
  const [durationPeriod, setDurationPeriod] = useState('1_month'); // '1_month' | '3_months' | '6_months' | '1_year'

  // Item Details / Delete Modal State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const { bugs, fetchBugs } = useBugStore();
  const { techDebts, fetchTechDebts } = useTechDebtStore();

  useEffect(() => {
    if (fetchAllNotes) fetchAllNotes();
    if (fetchBugs) fetchBugs();
    if (fetchTechDebts) fetchTechDebts();
  }, []);

  // Filter items for a given date string
  const getItemsForDate = (dStr) => {
    const dTasks = tasks.filter((t) => t.planned_date && t.planned_date === dStr);
    const dNotes = (allNotes || []).filter((n) => n.planned_date && n.planned_date === dStr);
    const dBugs = bugs.filter((b) => b.planned_date === dStr);
    const dTechDebts = techDebts.filter((td) => td.planned_date === dStr);
    return { dTasks, dNotes, dBugs, dTechDebts };
  };

  const { dayTasks, dayNotes, dayBugs, dayTechDebts } = (() => {
    const res = getItemsForDate(selectedDateStr);
    return {
      dayTasks: res.dTasks,
      dayNotes: res.dNotes,
      dayBugs: res.dBugs,
      dayTechDebts: res.dTechDebts,
    };
  })();

  // Unplanned tasks
  const unplannedTasks = tasks.filter((t) => !t.planned_date && t.status !== 'done');

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') setSelectedDate(subDays(selectedDate, 1));
    else if (viewMode === 'week') setSelectedDate(subWeeks(selectedDate, 1));
    else if (viewMode === 'month') setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setSelectedDate(addDays(selectedDate, 1));
    else if (viewMode === 'week') setSelectedDate(addWeeks(selectedDate, 1));
    else if (viewMode === 'month') setSelectedDate(addMonths(selectedDate, 1));
  };

  const toggleDaySelection = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const calculateTargetDates = () => {
    const dates = [];
    const startDate = parseISO(selectedDateStr);
    let endDate = addMonths(startDate, 1);

    if (durationPeriod === '3_months') endDate = addMonths(startDate, 3);
    else if (durationPeriod === '6_months') endDate = addMonths(startDate, 6);
    else if (durationPeriod === '1_year') endDate = addYears(startDate, 1);

    let curr = startDate;

    while (isBefore(curr, endDate) || isEqual(curr, endDate)) {
      const dayOfWeek = getDay(curr);

      let match = false;
      if (recurrencePattern === 'daily') {
        match = true;
      } else if (recurrencePattern === 'weekdays') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) match = true;
      } else if (recurrencePattern === 'custom_days') {
        if (selectedDays.includes(dayOfWeek)) match = true;
      }

      if (match) {
        dates.push(format(curr, 'yyyy-MM-dd'));
      }
      curr = addDays(curr, 1);
    }
    return dates;
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    if (!isRecurring) {
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
    } else {
      const dates = calculateTargetDates();
      const groupId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const ruleJson = JSON.stringify({
        pattern: recurrencePattern,
        selectedDays,
        durationPeriod,
      });

      for (const dStr of dates) {
        await addTask({
          title: planTitle.trim(),
          category: planCategory.trim() || 'Plan',
          estimated_minutes: parseInt(planDuration, 10) || 60,
          planned_date: dStr,
          planned_start_time: planTime,
          task_type: planType,
          status: 'todo',
          color: planType === 'event' ? '#FB7185' : '#5B8DEF',
          recurrence_group_id: groupId,
          recurrence_rule: ruleJson,
        });
      }
    }

    setIsPlanModalOpen(false);
    setPlanTitle('');
    setIsRecurring(false);
  };

  const handleAssignToDate = async (task, time = '12:00') => {
    await updateTask(task.id, {
      planned_date: selectedDateStr,
      planned_start_time: time,
    });
  };

  const handleDeleteSingleTask = async (taskId) => {
    await deleteTask(taskId);
    setSelectedTaskDetail(null);
  };

  const handleDeleteTaskGroup = async (groupId) => {
    await deleteRecurringGroup(groupId);
    setSelectedTaskDetail(null);
  };

  const daysOfWeekLabels = [
    { label: 'Pzt', value: 1 },
    { label: 'Sal', value: 2 },
    { label: 'Çar', value: 3 },
    { label: 'Per', value: 4 },
    { label: 'Cum', value: 5 },
    { label: 'Cmt', value: 6 },
    { label: 'Paz', value: 0 },
  ];

  // Helper for title text depending on view mode
  const getHeaderTitleText = () => {
    if (viewMode === 'day') {
      return format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale: tr })} - ${format(end, 'd MMM yyyy', { locale: tr })}`;
    }
    if (viewMode === 'month') {
      return format(selectedDate, 'MMMM yyyy', { locale: tr });
    }
    return '';
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Takvim & Planlayıcı</h2>
            <p className="text-xs text-app-secondary">
              Günlük, haftalık ve aylık görünümlerde planlarınızı yönetin
            </p>
          </div>
        </div>

        {/* View Switcher & Date Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Day / Week / Month Mode Tabs */}
          <div className="flex items-center gap-1 bg-app-secondary p-1 rounded-xl">
            {[
              { id: 'day', label: 'Günlük' },
              { id: 'week', label: 'Haftalık' },
              { id: 'month', label: 'Aylık' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === mode.id
                    ? 'bg-app-surface text-app-primary shadow-xs'
                    : 'text-app-muted hover:text-app-primary'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 rounded-xl border border-app text-app-primary font-semibold text-xs hover:bg-app-surface-hover transition-all"
          >
            Bugün
          </button>

          <div className="flex items-center gap-1 bg-app-secondary p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-surface"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-app-primary px-3 capitalize">
              {getHeaderTitleText()}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-surface"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Plan Ekle
          </button>
        </div>
      </div>

      {/* Main View Switch Container */}
      <div className="p-6 flex-1 flex flex-col">
        {/* ========================================================================= */}
        {/* 1. DAY VIEW MODE */}
        {/* ========================================================================= */}
        {viewMode === 'day' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
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
                <span>Saatlik Günlük Çizelge</span>
                <span>{dayTasks.length + dayNotes.length + dayBugs.length + dayTechDebts.length} Planlı Etkinlik</span>
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

                  dayBugs.forEach(b => { if (!b.planned_start_time) b.planned_start_time = '10:00'; });
                  dayTechDebts.forEach(td => { if (!td.planned_start_time) td.planned_start_time = '10:00'; });

                  const finalBugsForHour = dayBugs.filter(b => parseInt(b.planned_start_time.split(':')[0], 10) === hour);
                  const finalTechDebtsForHour = dayTechDebts.filter(td => parseInt(td.planned_start_time.split(':')[0], 10) === hour);

                  const isOverlap = tasksForHour.length + notesForHour.length + finalBugsForHour.length + finalTechDebtsForHour.length > 1;

                  return (
                    <div
                      key={hour}
                      className="flex items-start gap-4 p-2 rounded-xl hover:bg-app-surface-hover border border-transparent hover:border-app transition-all group"
                    >
                      <span className="w-14 text-xs font-mono font-bold text-app-muted pt-1">
                        {hourStr}
                      </span>

                      <div className="flex-1 min-h-[44px] flex flex-wrap items-center gap-2 border-l-2 border-app pl-4">
                        {isOverlap && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Zaman Çakışması!
                          </span>
                        )}

                        {tasksForHour.length === 0 && notesForHour.length === 0 && finalBugsForHour.length === 0 && finalTechDebtsForHour.length === 0 ? (
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
                                onClick={() => setSelectedTaskDetail(task)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-xs flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: task.color || '#5B8DEF' }}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{task.title}</span>
                                {task.recurrence_group_id && (
                                  <Repeat className="w-3 h-3 text-white/80" title="Tekrarlayan Etkinlik" />
                                )}
                                <span className="text-[10px] opacity-80">({task.estimated_minutes}dk)</span>
                              </div>
                            ))}
                            {notesForHour.map((note) => {
                              const noteTitle = (note.content || '').split('\n')[0] || 'Not';
                              return (
                                <div
                                  key={'n-' + note.id}
                                  className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-100 shadow-xs flex items-center gap-2"
                                >
                                  <StickyNote className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[150px]">{noteTitle}</span>
                                </div>
                              );
                            })}
                            {finalBugsForHour.map((bug) => (
                              <div
                                key={'b-' + bug.id}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-800 bg-rose-100 shadow-xs flex items-center gap-2"
                              >
                                <Bug className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[150px]">{bug.title}</span>
                              </div>
                            ))}
                            {finalTechDebtsForHour.map((td) => (
                              <div
                                key={'td-' + td.id}
                                className="px-3 py-2 rounded-xl text-xs font-semibold text-indigo-800 bg-indigo-100 shadow-xs flex items-center gap-2"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[150px]">{td.title}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. WEEK VIEW MODE */}
        {/* ========================================================================= */}
        {viewMode === 'week' && (
          <div className="flex-1 bg-app-surface border border-app rounded-2xl p-5 shadow-xs flex flex-col space-y-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-3 min-w-[800px]">
              {eachDayOfInterval({
                start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
              }).map((day) => {
                const dStr = format(day, 'yyyy-MM-dd');
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const { dTasks, dNotes, dBugs, dTechDebts } = getItemsForDate(dStr);
                const totalCount = dTasks.length + dNotes.length + dBugs.length + dTechDebts.length;

                return (
                  <div
                    key={dStr}
                    onClick={() => setSelectedDate(day)}
                    className={`border rounded-xl p-3 flex flex-col min-h-[450px] transition-all cursor-pointer ${
                      isSelected
                        ? 'border-app-accent bg-app-accent-light/30'
                        : 'border-app bg-app-primary hover:border-app-accent/40'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className="text-center pb-2 border-b border-app mb-2">
                      <div className="text-[10px] font-bold text-app-muted uppercase">
                        {format(day, 'EEEE', { locale: tr })}
                      </div>
                      <div className={`text-sm font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-app-accent text-white' : 'text-app-primary'
                      }`}>
                        {format(day, 'd MMM', { locale: tr })}
                      </div>
                    </div>

                    {/* Day Column Items List */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto">
                      {totalCount === 0 ? (
                        <div className="text-[10px] text-app-muted text-center py-8">Plan yok</div>
                      ) : (
                        <>
                          {dTasks.map((task) => (
                            <div
                              key={'w-t-' + task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskDetail(task);
                              }}
                              className="p-2 rounded-lg text-xs font-semibold text-white shadow-xs space-y-1 cursor-pointer hover:opacity-90"
                              style={{ backgroundColor: task.color || '#5B8DEF' }}
                            >
                              <div className="truncate font-bold text-[11px]">{task.title}</div>
                              <div className="text-[9px] opacity-80 flex items-center justify-between">
                                <span>{task.planned_start_time || '10:00'}</span>
                                <span>{task.estimated_minutes}dk</span>
                              </div>
                            </div>
                          ))}

                          {dNotes.map((note) => {
                            const noteTitle = (note.content || '').split('\n')[0] || 'Not';
                            return (
                              <div
                                key={'w-n-' + note.id}
                                className="p-1.5 rounded-lg text-[10px] font-medium text-amber-800 bg-amber-100 truncate flex items-center gap-1"
                              >
                                <StickyNote className="w-3 h-3 shrink-0" />
                                <span className="truncate">{noteTitle}</span>
                              </div>
                            );
                          })}

                          {dBugs.map((bug) => (
                            <div
                              key={'w-b-' + bug.id}
                              className="p-1.5 rounded-lg text-[10px] font-medium text-rose-800 bg-rose-100 truncate flex items-center gap-1"
                            >
                              <Bug className="w-3 h-3 shrink-0" />
                              <span className="truncate">{bug.title}</span>
                            </div>
                          ))}

                          {dTechDebts.map((td) => (
                            <div
                              key={'w-td-' + td.id}
                              className="p-1.5 rounded-lg text-[10px] font-medium text-indigo-800 bg-indigo-100 truncate flex items-center gap-1"
                            >
                              <Wrench className="w-3 h-3 shrink-0" />
                              <span className="truncate">{td.title}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MONTH VIEW MODE */}
        {/* ========================================================================= */}
        {viewMode === 'month' && (
          <div className="flex-1 bg-app-surface border border-app rounded-2xl p-5 shadow-xs flex flex-col space-y-3">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-app-muted border-b border-app pb-2">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((dayName) => (
                <div key={dayName}>{dayName}</div>
              ))}
            </div>

            {/* Month Days Matrix */}
            <div className="grid grid-cols-7 gap-2 flex-1">
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 }),
                end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 }),
              }).map((day) => {
                const dStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const { dTasks, dNotes, dBugs, dTechDebts } = getItemsForDate(dStr);
                const totalCount = dTasks.length + dNotes.length + dBugs.length + dTechDebts.length;

                return (
                  <div
                    key={dStr}
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode('day'); // Switch to day view on click
                    }}
                    className={`border rounded-xl p-2 min-h-[95px] flex flex-col justify-between transition-all cursor-pointer ${
                      !isCurrentMonth ? 'opacity-30 bg-app-primary/50' : 'bg-app-primary'
                    } ${
                      isSelected
                        ? 'border-app-accent ring-1 ring-app-accent'
                        : 'border-app hover:border-app-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-app-accent text-white' : 'text-app-primary'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {totalCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-app-accent-light text-app-accent">
                          {totalCount} Plan
                        </span>
                      )}
                    </div>

                    {/* Preview Event Badges */}
                    <div className="space-y-1 mt-1 overflow-hidden max-h-[50px]">
                      {dTasks.slice(0, 2).map((t) => (
                        <div
                          key={'m-t-' + t.id}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white truncate"
                          style={{ backgroundColor: t.color || '#5B8DEF' }}
                        >
                          {t.title}
                        </div>
                      ))}
                      {totalCount > 2 && (
                        <div className="text-[9px] text-app-muted font-bold pl-1">
                          +{totalCount - 2} daha...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Item Detail / Delete Modal */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-sm p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-app pb-3">
              <h3 className="font-bold text-sm text-app-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-app-accent" /> {selectedTaskDetail.title}
              </h3>
              {selectedTaskDetail.recurrence_group_id && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-app-accent-light text-app-accent flex items-center gap-1">
                  <Repeat className="w-3 h-3" /> Tekrarlayan
                </span>
              )}
            </div>

            <div className="text-xs text-app-secondary space-y-1">
              <p><strong>Tarih:</strong> {selectedTaskDetail.planned_date}</p>
              <p><strong>Saat:</strong> {selectedTaskDetail.planned_start_time || '10:00'}</p>
              <p><strong>Süre:</strong> {selectedTaskDetail.estimated_minutes} dakika</p>
              <p><strong>Kategori:</strong> {selectedTaskDetail.category}</p>
            </div>

            <div className="pt-3 border-t border-app space-y-2">
              <button
                onClick={() => handleDeleteSingleTask(selectedTaskDetail.id)}
                className="w-full py-2 px-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Sadece Bu Etkinliği Sil
              </button>

              {selectedTaskDetail.recurrence_group_id && (
                <button
                  onClick={() => handleDeleteTaskGroup(selectedTaskDetail.recurrence_group_id)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500 text-white hover:opacity-90 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Repeat className="w-4 h-4" /> Tüm Periyodu (Grubu) Sil
                </button>
              )}

              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="w-full py-2 px-3 rounded-xl border border-app text-app-secondary text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan / Event Creation Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                  placeholder="Örn: Müşteri Görüşmesi veya Daily Standup"
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

              {/* Recurrence Toggle */}
              <div className="pt-2 border-t border-app space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-app-primary flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-app-accent" /> Periyodik / Tekrarlayan Giriş Yap
                  </label>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-app text-app-accent focus:ring-app-accent cursor-pointer"
                  />
                </div>

                {isRecurring && (
                  <div className="p-3 bg-app-secondary rounded-xl space-y-3 border border-app">
                    <div>
                      <label className="block text-[11px] font-semibold text-app-secondary mb-1">Tekrar Düzeni</label>
                      <select
                        value={recurrencePattern}
                        onChange={(e) => setRecurrencePattern(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-app bg-app-primary text-app-primary text-xs focus:outline-none"
                      >
                        <option value="daily">Her Gün (Daily)</option>
                        <option value="weekdays">Hafta İçi Her Gün (Pzt-Cum)</option>
                        <option value="custom_days">Haftanın Belirli Günleri</option>
                      </select>
                    </div>

                    {recurrencePattern === 'custom_days' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-app-secondary mb-1">Günleri Seçin</label>
                        <div className="flex items-center gap-1">
                          {daysOfWeekLabels.map((d) => {
                            const isSelected = selectedDays.includes(d.value);
                            return (
                              <button
                                key={d.value}
                                type="button"
                                onClick={() => toggleDaySelection(d.value)}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-md border transition-all ${
                                  isSelected
                                    ? 'bg-app-accent text-white border-app-accent'
                                    : 'bg-app-primary text-app-muted border-app hover:text-app-primary'
                                }`}
                              >
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-app-secondary mb-1">Ne Kadar Süre Devam Etse?</label>
                      <select
                        value={durationPeriod}
                        onChange={(e) => setDurationPeriod(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-app bg-app-primary text-app-primary text-xs focus:outline-none"
                      >
                        <option value="1_month">1 Ay Süresince</option>
                        <option value="3_months">3 Ay Süresince</option>
                        <option value="6_months">6 Ay Süresince</option>
                        <option value="1_year">1 Yıl Süresince</option>
                      </select>
                    </div>
                  </div>
                )}
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
                  className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 shadow-xs"
                >
                  {isRecurring ? 'Periyodu Planla' : 'Planla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
