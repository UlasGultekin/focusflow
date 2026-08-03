import React, { useEffect, useState } from 'react';
import { Flame, Plus, Check, Trash2, Calendar, Target, Award, Sparkles, Trophy } from 'lucide-react';
import { useHabitStore } from '../stores/useHabitStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function HabitsView() {
  const { habits, completions, fetchHabits, addHabit, deleteHabit, toggleCompletion, getStreak } = useHabitStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10B981');
  const [goalMinutes, setGoalMinutes] = useState(0);

  useEffect(() => {
    fetchHabits();
  }, []);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Generate last 30 days for completion grid
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addHabit({
      name: name.trim(),
      description: description.trim(),
      color,
      goal_minutes: parseInt(goalMinutes, 10) || 0,
    });

    setIsModalOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Alışkanlık Takibi & Zincir (Streak)</h2>
            <p className="text-xs text-app-secondary">
              Günlük alışkanlıklarınızı takip edin, zinciri kırmayın!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Yeni Alışkanlık Ekle
        </button>
      </div>

      {/* Main Habit Cards List */}
      <div className="p-6 space-y-5 max-w-5xl">
        {habits.length === 0 ? (
          <div className="bg-app-surface border border-app rounded-2xl p-12 text-center space-y-3">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
            <h3 className="font-bold text-base text-app-primary">Henüz Alışkanlık Eklenmedi</h3>
            <p className="text-xs text-app-secondary">
              Su içmek, kitap okumak veya egzersiz yapmak gibi günlük hedeflerinizi ekleyin.
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const streak = getStreak(habit.id);
            const isCompletedToday = completions.some(
              (c) => c.habit_id === habit.id && c.date === todayStr
            );

            // Get completion set for grid
            const completedDatesSet = new Set(
              completions.filter((c) => c.habit_id === habit.id).map((c) => c.date)
            );

            return (
              <div
                key={habit.id}
                className="bg-app-surface border border-app rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative group"
              >
                {/* Left Side Details & Streak Badge */}
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white font-bold shadow-xs"
                    style={{ backgroundColor: habit.color || '#10B981' }}
                  >
                    <Flame className="w-5 h-5 fill-current" />
                    <span className="text-[10px] leading-none">{streak} gün</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-app-primary truncate">
                      {habit.name}
                    </h3>
                    {habit.description && (
                      <p className="text-xs text-app-secondary mt-0.5">{habit.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-app-muted">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Flame className="w-3.5 h-3.5 fill-current" /> {streak} Günlük Seri
                      </span>
                      {habit.goal_minutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" /> Hedef: {habit.goal_minutes} dk/gün
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: 30-Day Heatmap Grid & Today Action Button */}
                <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-app">
                  {/* 30 Day Heatmap Grid */}
                  <div className="flex items-center gap-1">
                    {last30Days.map((day) => {
                      const dStr = format(day, 'yyyy-MM-dd');
                      const isDone = completedDatesSet.has(dStr);

                      return (
                        <div
                          key={dStr}
                          title={`${format(day, 'd MMM yyyy', { locale: tr })}: ${
                            isDone ? 'Tamamlandı' : 'Yapılmadı'
                          }`}
                          className={`w-3 h-7 rounded-sm transition-all ${
                            isDone
                              ? 'bg-emerald-500 scale-105'
                              : 'bg-app-secondary opacity-60'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* "Bugün Yaptım" Action Button */}
                  <button
                    onClick={() => toggleCompletion(habit.id, todayStr)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 ${
                      isCompletedToday
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'border border-app text-app-primary hover:border-emerald-500 hover:text-emerald-500'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {isCompletedToday ? 'Bugün Tamamlandı!' : 'Bugün Yaptım'}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 text-app-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Alışkanlığı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-app-primary">Yeni Alışkanlık Ekle</h3>

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">Alışkanlık Adı *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: 2 Litre Su İç"
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">Açıklama</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: Her saat başı bir bardak"
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Günlük Hedef Süre (dk)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={goalMinutes}
                    onChange={(e) => setGoalMinutes(e.target.value)}
                    placeholder="0 = Süresiz"
                    className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Renk</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-9 p-1 rounded-xl border border-app bg-app-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
