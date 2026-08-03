import React, { useEffect, useState } from 'react';
import {
  BookHeart,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Laugh,
  Heart,
} from 'lucide-react';
import { useJournalStore } from '../stores/useJournalStore';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

const MOODS = [
  { value: 1, label: 'Kötü', emoji: '😞', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
  { value: 2, label: 'Düşük', emoji: '😐', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { value: 3, label: 'Normal', emoji: '🙂', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { value: 4, label: 'İyi', emoji: '😊', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  { value: 5, label: 'Harika', emoji: '🤩', color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
];

export default function JournalView() {
  const {
    selectedDate,
    currentEntry,
    allEntries,
    saveStatus,
    setSelectedDate,
    fetchEntryForDate,
    fetchAllEntries,
    updateContentLocally,
    setMoodLocally,
    searchJournal,
  } = useJournalStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllEntries();
    fetchEntryForDate(selectedDate);
  }, []);

  const handleDateChange = (newDateStr) => {
    setSelectedDate(newDateStr);
  };

  const handlePrevDay = () => {
    const current = parseISO(selectedDate);
    const prev = subDays(current, 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const current = parseISO(selectedDate);
    const next = addDays(current, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const formattedDateTitle = format(parseISO(selectedDate), 'd MMMM yyyy, EEEE', { locale: tr });

  // Map of dates with entries for dot indicator
  const entriesMap = new Set(allEntries.map((e) => e.entry_date));

  return (
    <div className="flex-1 flex h-screen bg-app-primary overflow-hidden select-none">
      {/* Left Sidebar: Entries List & Search */}
      <div className="w-80 border-r border-app bg-app-surface flex flex-col h-full">
        <div className="p-4 border-b border-app space-y-3">
          <div className="flex items-center gap-2 text-app-accent font-bold text-sm">
            <BookHeart className="w-5 h-5" />
            <span>Günlük & Akış Notları</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-app-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchJournal(e.target.value);
              }}
              placeholder="Günlüklerde ara..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
            />
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {allEntries.length === 0 ? (
            <p className="text-xs text-app-muted text-center py-8">
              Henüz günlük kaydı yok.
            </p>
          ) : (
            allEntries.map((entry) => {
              const isSelected = entry.entry_date === selectedDate;
              const moodObj = MOODS.find((m) => m.value === entry.mood) || MOODS[3];

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedDate(entry.entry_date)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-app-accent bg-app-accent-light'
                      : 'border-app hover:bg-app-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-app-primary">
                      {format(parseISO(entry.entry_date), 'd MMM yyyy', { locale: tr })}
                    </span>
                    <span className="text-base">{moodObj.emoji}</span>
                  </div>
                  <p className="text-xs text-app-secondary line-clamp-2 mt-1 font-normal">
                    {entry.content || '(Boş Not)'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full bg-app-primary overflow-hidden">
        {/* Top Date Header & Controls */}
        <div className="p-5 border-b border-app bg-app-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="px-3 py-1.5 rounded-xl border border-app text-app-primary font-semibold text-xs hover:bg-app-surface-hover transition-all"
            >
              Bugün
            </button>
            <div className="flex items-center gap-1 bg-app-secondary p-1 rounded-xl">
              <button
                onClick={handlePrevDay}
                className="p-1 rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-surface"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-app-primary px-3">
                {formattedDateTitle}
              </span>
              <button
                onClick={handleNextDay}
                className="p-1 rounded-lg text-app-secondary hover:text-app-primary hover:bg-app-surface"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mood Selector & Save Status */}
          <div className="flex items-center gap-4">
            {/* Mood Emojis */}
            <div className="flex items-center gap-1 bg-app-secondary p-1 rounded-xl">
              {MOODS.map((m) => {
                const isActive = (currentEntry.mood || 4) === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMoodLocally(m.value)}
                    className={`px-2 py-1 rounded-lg text-sm transition-all border ${
                      isActive
                        ? m.color + ' font-bold scale-110 shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    title={`Ruh Hali: ${m.label}`}
                  >
                    {m.emoji}
                  </button>
                );
              })}
            </div>

            {/* Save Status Badge */}
            {saveStatus && (
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {saveStatus}
              </span>
            )}
          </div>
        </div>

        {/* Text Area Editor */}
        <div className="flex-1 p-6 flex flex-col">
          <textarea
            value={currentEntry.content || ''}
            onChange={(e) => updateContentLocally(e.target.value)}
            placeholder="Bugün aklından neler geçiyor? Gününü, duygularını ve odaklandığın konuları buraya serbestçe dök..."
            className="flex-1 w-full p-4 rounded-2xl border border-app bg-app-surface text-app-primary text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-app-accent resize-none shadow-xs font-sans"
          />
        </div>
      </div>
    </div>
  );
}
