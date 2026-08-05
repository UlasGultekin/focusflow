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
  Sparkles,
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
  const { tasks, addTask, updateTask, updateRecurringGroup, deleteTask, deleteRecurringGroup, allNotes, fetchAllNotes } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month'

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Edit Mode Target
  const [planTitle, setPlanTitle] = useState('');
  const [planCategory, setPlanCategory] = useState('Plan');
  const [planTime, setPlanTime] = useState('10:00');
  const [planDuration, setPlanDuration] = useState(60);
  const [planType, setPlanType] = useState('task'); // 'task' | 'event'
  const [editDate, setEditDate] = useState('');
  const [updateScope, setUpdateScope] = useState('single'); // 'single' | 'group'

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

  const openAddModal = () => {
    setEditingTask(null);
    setPlanTitle('');
    setPlanCategory('Plan');
    setPlanTime('10:00');
    setPlanDuration(60);
    setPlanType('task');
    setEditDate(selectedDateStr);
    setIsRecurring(false);
    setUpdateScope('single');
    setIsPlanModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setPlanTitle(task.title || '');
    setPlanCategory(task.category || 'Plan');
    setPlanTime(task.planned_start_time || '10:00');
    setPlanDuration(task.estimated_minutes || 60);
    setPlanType(task.task_type || 'task');
    setEditDate(task.planned_date || selectedDateStr);
    setIsRecurring(Boolean(task.recurrence_group_id));
    setUpdateScope('single');
    setSelectedTaskDetail(null);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    if (editingTask) {
      // Editing existing task
      const updatedData = {
        title: planTitle.trim(),
        category: planCategory.trim() || 'Plan',
        estimated_minutes: parseInt(planDuration, 10) || 60,
        planned_start_time: planTime,
        task_type: planType,
        color: planType === 'event' ? '#FB7185' : '#5B8DEF',
      };

      if (editingTask.recurrence_group_id && updateScope === 'group') {
        // Update all items in this recurring group
        await updateRecurringGroup(editingTask.recurrence_group_id, updatedData);
      } else {
        // Update only this specific single instance / date
        await updateTask(editingTask.id, {
          ...updatedData,
          planned_date: editDate || editingTask.planned_date,
        });
      }
    } else {
      // Creating new task
      if (!isRecurring) {
        await addTask({
          title: planTitle.trim(),
          category: planCategory.trim() || 'Plan',
          estimated_minutes: parseInt(planDuration, 10) || 60,
          planned_date: editDate || selectedDateStr,
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
    }

    setIsPlanModalOpen(false);
    setEditingTask(null);
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
      {/* Premium Glassmorphic Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface/80 backdrop-blur-md sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-app-accent to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-app-accent/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-app-primary tracking-tight flex items-center gap-2">
              Takvim & Zaman Çizelgesi
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </h2>
            <p className="text-xs text-app-secondary font-medium">
              Gününüzü ve haftanızı üst düzey akıcı arayüz ile planlayın
            </p>
          </div>
        </div>

        {/* View Switcher & Date Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Glass View Mode Switcher */}
          <div className="flex items-center gap-1 bg-app-secondary/80 p-1 rounded-2xl border border-app shadow-inner">
            {[
              { id: 'day', label: 'Günlük' },
              { id: 'week', label: 'Haftalık' },
              { id: 'month', label: 'Aylık' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  viewMode === mode.id
                    ? 'bg-app-surface text-app-accent shadow-sm border border-app'
                    : 'text-app-muted hover:text-app-primary'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3.5 py-1.5 rounded-2xl border border-app bg-app-surface text-app-primary font-bold text-xs hover:border-app-accent/50 hover:bg-app-surface-hover transition-all shadow-xs"
          >
            Bugün
          </button>

          <div className="flex items-center gap-1 bg-app-surface border border-app p-1 rounded-2xl shadow-xs">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl text-app-secondary hover:text-app-primary hover:bg-app-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-app-primary px-3 capitalize">
              {getHeaderTitleText()}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl text-app-secondary hover:text-app-primary hover:bg-app-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-app-accent to-indigo-600 text-white font-bold text-xs hover:opacity-95 transition-all flex items-center gap-2 shadow-md shadow-app-accent/25 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Yeni Plan Ekle
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
            <div className="bg-app-surface border border-app rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-app pb-3">
                <h3 className="font-extrabold text-sm text-app-primary flex items-center gap-2">
                  <CalendarDays className="w-4.5 h-4.5 text-app-accent" /> Planlanmamış
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-app-accent-light text-app-accent">
                  {unplannedTasks.length}
                </span>
              </div>
              <p className="text-[11px] text-app-muted font-medium leading-relaxed">
                Aşağıdaki sürükleyebilir veya tıklayarak bu güne saat 10:00 olarak atayabilirsiniz:
              </p>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {unplannedTasks.length === 0 ? (
                  <div className="text-center py-10 text-app-muted space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
                    <p className="text-xs font-semibold">Tüm görevler planlanmış!</p>
                  </div>
                ) : (
                  unplannedTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleAssignToDate(t, '10:00')}
                      className="p-3.5 rounded-2xl border border-app bg-app-primary hover:border-app-accent/60 hover:shadow-md transition-all cursor-pointer text-xs group relative overflow-hidden"
                    >
                      <div className="w-1 h-full bg-app-accent absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="font-bold text-app-primary truncate pl-1">{t.title}</div>
                      <div className="flex items-center justify-between mt-2.5 text-[10px] text-app-muted font-semibold pl-1">
                        <span className="flex items-center gap-1 bg-app-secondary px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-app-accent" /> {t.estimated_minutes}dk
                        </span>
                        <span className="text-app-accent font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Ata →
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Daily Timeline (07:00 - 23:00) */}
            <div className="lg:col-span-3 bg-app-surface border border-app rounded-3xl p-6 shadow-sm space-y-2">
              <div className="text-xs font-extrabold text-app-secondary border-b border-app pb-4 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-app-accent" /> Saatlik Zaman Çizelgesi
                </span>
                <span className="bg-app-secondary px-3 py-1 rounded-full text-app-primary font-bold">
                  {dayTasks.length + dayNotes.length + dayBugs.length + dayTechDebts.length} Etkinlik
                </span>
              </div>

              <div className="space-y-3">
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
                      className="flex items-start gap-4 p-2.5 rounded-2xl hover:bg-app-surface-hover/80 border border-transparent hover:border-app/60 transition-all duration-200 group"
                    >
                      <span className="w-14 text-xs font-mono font-extrabold text-app-muted pt-1 shrink-0">
                        {hourStr}
                      </span>

                      <div className="flex-1 min-h-[48px] flex flex-wrap items-center gap-2.5 border-l-2 border-app/60 pl-4 transition-colors group-hover:border-app-accent/40">
                        {isOverlap && (
                          <span className="text-[10px] font-extrabold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> Zaman Çakışması!
                          </span>
                        )}

                        {tasksForHour.length === 0 && notesForHour.length === 0 && finalBugsForHour.length === 0 && finalTechDebtsForHour.length === 0 ? (
                          <button 
                            onClick={() => {
                              setPlanTime(hourStr);
                              setIsPlanModalOpen(true);
                            }}
                            className="text-[11px] font-semibold text-app-muted/60 opacity-0 group-hover:opacity-100 transition-opacity hover:text-app-accent cursor-pointer w-full text-left py-1"
                          >
                            + Yeni Plan / Etkinlik Ekle
                          </button>
                        ) : (
                          <>
                            {tasksForHour.map((task) => (
                              <div
                                key={'t-' + task.id}
                                onClick={() => setSelectedTaskDetail(task)}
                                className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.01] hover:shadow-md transition-all border border-white/10"
                                style={{ backgroundColor: task.color || '#5B8DEF' }}
                              >
                                <Clock className="w-3.5 h-3.5 opacity-80" />
                                <span>{task.title}</span>
                                {task.recurrence_group_id && (
                                  <Repeat className="w-3.5 h-3.5 text-white/80" title="Tekrarlayan Periyot" />
                                )}
                                <span className="text-[10px] opacity-75 font-mono">({task.estimated_minutes}dk)</span>
                              </div>
                            ))}
                            {notesForHour.map((note) => {
                              const noteTitle = (note.content || '').split('\n')[0] || 'Not';
                              return (
                                <div
                                  key={'n-' + note.id}
                                  className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-300 shadow-xs flex items-center gap-2"
                                >
                                  <StickyNote className="w-3.5 h-3.5 text-amber-700" />
                                  <span className="truncate max-w-[160px]">{noteTitle}</span>
                                </div>
                              );
                            })}
                            {finalBugsForHour.map((bug) => (
                              <div
                                key={'b-' + bug.id}
                                className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-900 bg-rose-100/90 border border-rose-300 shadow-xs flex items-center gap-2"
                              >
                                <Bug className="w-3.5 h-3.5 text-rose-700" />
                                <span className="truncate max-w-[160px]">{bug.title}</span>
                              </div>
                            ))}
                            {finalTechDebtsForHour.map((td) => (
                              <div
                                key={'td-' + td.id}
                                className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-indigo-900 bg-indigo-100/90 border border-indigo-300 shadow-xs flex items-center gap-2"
                              >
                                <Wrench className="w-3.5 h-3.5 text-indigo-700" />
                                <span className="truncate max-w-[160px]">{td.title}</span>
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
          <div className="flex-1 bg-app-surface border border-app rounded-3xl p-6 shadow-sm flex flex-col space-y-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-3.5 min-w-[850px]">
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
                    className={`border rounded-2xl p-3.5 flex flex-col min-h-[480px] transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-app-accent bg-app-accent-light/40 shadow-sm ring-1 ring-app-accent/30'
                        : 'border-app bg-app-primary hover:border-app-accent/40 hover:shadow-xs'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className="text-center pb-3 border-b border-app mb-3">
                      <div className="text-[10px] font-extrabold text-app-muted uppercase tracking-wider">
                        {format(day, 'EEEE', { locale: tr })}
                      </div>
                      <div className={`text-sm font-extrabold mt-1 inline-block px-3 py-1 rounded-full ${
                        isToday ? 'bg-gradient-to-r from-app-accent to-indigo-600 text-white shadow-xs' : 'text-app-primary'
                      }`}>
                        {format(day, 'd MMM', { locale: tr })}
                      </div>
                    </div>

                    {/* Day Column Items List */}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                      {totalCount === 0 ? (
                        <div className="text-[11px] font-medium text-app-muted/50 text-center py-12">Plan yok</div>
                      ) : (
                        <>
                          {dTasks.map((task) => (
                            <div
                              key={'w-t-' + task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskDetail(task);
                              }}
                              className="p-2.5 rounded-xl text-xs font-bold text-white shadow-xs space-y-1 cursor-pointer hover:scale-[1.02] transition-transform border border-white/10"
                              style={{ backgroundColor: task.color || '#5B8DEF' }}
                            >
                              <div className="truncate font-extrabold text-[11px] leading-tight">{task.title}</div>
                              <div className="text-[9px] opacity-80 flex items-center justify-between font-mono pt-0.5">
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
                                className="p-2 rounded-xl text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-200 truncate flex items-center gap-1.5"
                              >
                                <StickyNote className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span className="truncate">{noteTitle}</span>
                              </div>
                            );
                          })}

                          {dBugs.map((bug) => (
                            <div
                              key={'w-b-' + bug.id}
                              className="p-2 rounded-xl text-[10px] font-bold text-rose-900 bg-rose-100/90 border border-rose-200 truncate flex items-center gap-1.5"
                            >
                              <Bug className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                              <span className="truncate">{bug.title}</span>
                            </div>
                          ))}

                          {dTechDebts.map((td) => (
                            <div
                              key={'w-td-' + td.id}
                              className="p-2 rounded-xl text-[10px] font-bold text-indigo-900 bg-indigo-100/90 border border-indigo-200 truncate flex items-center gap-1.5"
                            >
                              <Wrench className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
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
          <div className="flex-1 bg-app-surface border border-app rounded-3xl p-6 shadow-sm flex flex-col space-y-3">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-3 text-center text-xs font-extrabold text-app-muted border-b border-app pb-3">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((dayName) => (
                <div key={dayName} className="tracking-wide uppercase text-[10px]">{dayName}</div>
              ))}
            </div>

            {/* Month Days Matrix */}
            <div className="grid grid-cols-7 gap-3 flex-1">
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
                      setViewMode('day');
                    }}
                    className={`border rounded-2xl p-2.5 min-h-[105px] flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                      !isCurrentMonth ? 'opacity-35 bg-app-primary/40' : 'bg-app-primary hover:border-app-accent/60 hover:shadow-xs'
                    } ${
                      isSelected
                        ? 'border-app-accent ring-2 ring-app-accent/30 shadow-sm'
                        : 'border-app'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-gradient-to-r from-app-accent to-indigo-600 text-white shadow-xs' : 'text-app-primary'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {totalCount > 0 && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-app-accent-light text-app-accent border border-app-accent/20">
                          {totalCount} Plan
                        </span>
                      )}
                    </div>

                    {/* Preview Event Badges */}
                    <div className="space-y-1 mt-1 overflow-hidden max-h-[55px]">
                      {dTasks.slice(0, 2).map((t) => (
                        <div
                          key={'m-t-' + t.id}
                          className="text-[9px] font-extrabold px-2 py-0.5 rounded-lg text-white truncate shadow-2xs"
                          style={{ backgroundColor: t.color || '#5B8DEF' }}
                        >
                          {t.title}
                        </div>
                      ))}
                      {totalCount > 2 && (
                        <div className="text-[9px] text-app-accent font-extrabold pl-1">
                          +{totalCount - 2} plan daha...
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

      {/* Premium Item Detail / Delete Modal */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-app pb-3">
              <h3 className="font-extrabold text-base text-app-primary flex items-center gap-2 truncate pr-2">
                <Clock className="w-4 h-4 text-app-accent shrink-0" /> {selectedTaskDetail.title}
              </h3>
              {selectedTaskDetail.recurrence_group_id && (
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-app-accent-light text-app-accent border border-app-accent/20 flex items-center gap-1 shrink-0">
                  <Repeat className="w-3 h-3" /> Tekrarlayan
                </span>
              )}
            </div>

            <div className="text-xs text-app-secondary space-y-2 bg-app-primary p-3 rounded-2xl border border-app">
              <p className="flex items-center justify-between">
                <span className="font-semibold text-app-muted">Tarih:</span>
                <span className="font-bold text-app-primary">{selectedTaskDetail.planned_date}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-semibold text-app-muted">Saat:</span>
                <span className="font-bold text-app-primary">{selectedTaskDetail.planned_start_time || '10:00'}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-semibold text-app-muted">Süre:</span>
                <span className="font-bold text-app-primary">{selectedTaskDetail.estimated_minutes} dakika</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-semibold text-app-muted">Kategori:</span>
                <span className="font-bold text-app-accent bg-app-accent-light px-2 py-0.5 rounded-md">{selectedTaskDetail.category}</span>
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => openEditModal(selectedTaskDetail)}
                className="w-full py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" /> Etkinliği / Planı Düzenle & Ertele
              </button>

              <button
                onClick={() => handleDeleteSingleTask(selectedTaskDetail.id)}
                className="w-full py-2.5 px-3 rounded-2xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Sadece Bu Etkinliği Sil
              </button>

              {selectedTaskDetail.recurrence_group_id && (
                <button
                  onClick={() => handleDeleteTaskGroup(selectedTaskDetail.recurrence_group_id)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Repeat className="w-4 h-4" /> Tüm Periyodu (Grubu) Sil
                </button>
              )}

              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="w-full py-2.5 px-3 rounded-2xl border border-app text-app-secondary font-bold text-xs hover:bg-app-secondary transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan / Event Creation & Edit Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-base text-app-primary flex items-center gap-2 border-b border-app pb-3">
              <Sparkles className="w-5 h-5 text-app-accent" />
              {editingTask ? 'Plan Düzenle & Tarih Değiştir' : `Yeni Etkinlik / Plan Ekle (${selectedDateStr})`}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-app-secondary mb-1">Başlık *</label>
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Örn: Müşteri Görüşmesi veya Daily Standup"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-app-accent/50"
                />
              </div>

              {/* Erteleme / Tarih Değiştirme Girdisi */}
              <div>
                <label className="block text-xs font-bold text-app-secondary mb-1">Planlanan Tarih (Ertele / Değiştir)</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-app-accent/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-app-secondary mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={planTime}
                    onChange={(e) => setPlanTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-app-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-app-secondary mb-1">Süre (dk)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-app-accent/50"
                  />
                </div>
              </div>

              {/* Periyodik Düzenleme Seçeneği (Eğer Düzenlenen Görev Tekrarlayan İse) */}
              {editingTask && editingTask.recurrence_group_id ? (
                <div className="p-3.5 bg-app-primary rounded-2xl border border-app space-y-2">
                  <label className="block text-xs font-bold text-app-primary">
                    Düzenleme Kapsamı Seçin:
                  </label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 font-semibold text-app-primary cursor-pointer">
                      <input
                        type="radio"
                        name="updateScope"
                        value="single"
                        checked={updateScope === 'single'}
                        onChange={() => setUpdateScope('single')}
                        className="text-app-accent cursor-pointer"
                      />
                      <span>Sadece Bu Günlük Etkinliği Güncelle ({editDate})</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-app-primary cursor-pointer">
                      <input
                        type="radio"
                        name="updateScope"
                        value="group"
                        checked={updateScope === 'group'}
                        onChange={() => setUpdateScope('group')}
                        className="text-app-accent cursor-pointer"
                      />
                      <span>Tüm Periyoddaki (Gruptaki) Etkinlikleri Güncelle</span>
                    </label>
                  </div>
                </div>
              ) : (
                /* Yeni Oluşturma Recurrence Toggle */
                !editingTask && (
                  <div className="pt-3 border-t border-app space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-app-primary border border-app">
                      <label className="text-xs font-bold text-app-primary flex items-center gap-2 cursor-pointer">
                        <Repeat className="w-4 h-4 text-app-accent" /> Periyodik / Tekrarlayan Giriş
                      </label>
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 rounded border-app text-app-accent focus:ring-app-accent cursor-pointer"
                      />
                    </div>

                    {isRecurring && (
                      <div className="p-3.5 bg-app-primary rounded-2xl space-y-3.5 border border-app shadow-inner">
                        <div>
                          <label className="block text-[11px] font-bold text-app-secondary mb-1">Tekrar Düzeni</label>
                          <select
                            value={recurrencePattern}
                            onChange={(e) => setRecurrencePattern(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none"
                          >
                            <option value="daily">Her Gün (Daily)</option>
                            <option value="weekdays">Hafta İçi Her Gün (Pzt-Cum)</option>
                            <option value="custom_days">Haftanın Belirli Günleri</option>
                          </select>
                        </div>

                        {recurrencePattern === 'custom_days' && (
                          <div>
                            <label className="block text-[11px] font-bold text-app-secondary mb-1">Günleri Seçin</label>
                            <div className="flex items-center gap-1">
                              {daysOfWeekLabels.map((d) => {
                                const isSelected = selectedDays.includes(d.value);
                                return (
                                  <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => toggleDaySelection(d.value)}
                                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg border transition-all ${
                                      isSelected
                                        ? 'bg-app-accent text-white border-app-accent shadow-xs'
                                        : 'bg-app-surface text-app-muted border-app hover:text-app-primary'
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
                          <label className="block text-[11px] font-bold text-app-secondary mb-1">Ne Kadar Süre Devam Etse?</label>
                          <select
                            value={durationPeriod}
                            onChange={(e) => setDurationPeriod(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none"
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
                )
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlanModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl border border-app text-app-secondary font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-app-accent to-indigo-600 text-white font-extrabold text-xs hover:opacity-95 shadow-md shadow-app-accent/20"
                >
                  {editingTask ? 'Değişiklikleri Kaydet' : isRecurring ? 'Periyodu Planla' : 'Planla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
