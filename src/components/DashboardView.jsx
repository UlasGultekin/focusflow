import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  Clock,
  Bug,
  Wrench,
  Flame,
  NotebookPen,
  Link2,
  GraduationCap,
  Sparkles,
  Search,
  X,
  ChevronRight,
  Folder,
  File,
  StickyNote,
  User,
  Tag,
  CalendarDays,
  ListFilter,
  ArrowUpRight,
  BarChart2,
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';
import { useBugStore } from '../stores/useBugStore';
import { useTechDebtStore } from '../stores/useTechDebtStore';
import { useLinkStore } from '../stores/useLinkStore';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

function parseJsonField(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DashboardView({ onNavigate }) {
  const { tasks, allNotes, fetchAllNotes, selectTask } = useTaskStore();
  const { bugs, fetchBugs } = useBugStore();
  const { techDebts, fetchTechDebts } = useTechDebtStore();
  const { links, fetchLinks } = useLinkStore();

  // Filters State
  const [filterType, setFilterType] = useState('all'); // 'all' | 'tasks' | 'bugs' | 'tech_debts' | 'notes' | 'links'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'completed'
  const [dateRangeType, setDateRangeType] = useState('all'); // 'all' | 'today' | 'this_week' | 'this_month' | 'custom' | 'single'
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    if (fetchAllNotes) fetchAllNotes();
    if (fetchBugs) fetchBugs();
    if (fetchTechDebts) fetchTechDebts();
    if (fetchLinks) fetchLinks();
  }, []);

  // Filter Helper
  const isDateInRange = (itemDateStr) => {
    if (dateRangeType === 'all') return true;
    if (!itemDateStr) return false;

    const targetDate = parseISO(itemDateStr.slice(0, 10));
    const now = new Date();

    if (dateRangeType === 'single') {
      return singleDate ? itemDateStr.slice(0, 10) === singleDate : true;
    }

    if (dateRangeType === 'today') {
      const todayStr = format(now, 'yyyy-MM-dd');
      return itemDateStr.slice(0, 10) === todayStr;
    }

    if (dateRangeType === 'this_week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7));
      return isWithinInterval(targetDate, { start: startOfDay(startOfWeek), end: endOfDay(endOfWeek) });
    }

    if (dateRangeType === 'this_month') {
      const currentMonth = format(now, 'yyyy-MM');
      return itemDateStr.slice(0, 7) === currentMonth;
    }

    if (dateRangeType === 'custom') {
      if (startDate && endDate) {
        return isWithinInterval(targetDate, {
          start: startOfDay(parseISO(startDate)),
          end: endOfDay(parseISO(endDate)),
        });
      }
      if (startDate) return itemDateStr.slice(0, 10) >= startDate;
      if (endDate) return itemDateStr.slice(0, 10) <= endDate;
    }

    return true;
  };

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterType !== 'all' && filterType !== 'tasks') return false;
    if (filterStatus === 'active' && t.status === 'done') return false;
    if (filterStatus === 'completed' && t.status !== 'done') return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Check date (planned_date or created_at)
    const dateToCheck = t.planned_date || (t.created_at ? t.created_at.slice(0, 10) : null);
    return isDateInRange(dateToCheck);
  });

  // Filtered Bugs
  const filteredBugs = bugs.filter((b) => {
    if (filterType !== 'all' && filterType !== 'bugs') return false;
    if (filterStatus === 'active' && b.task_id) return false;
    if (filterStatus === 'completed' && !b.task_id) return false;
    if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedProject !== 'all' && (b.project || 'Genel') !== selectedProject) return false;

    const dateToCheck = b.planned_date || (b.created_at ? b.created_at.slice(0, 10) : null);
    return isDateInRange(dateToCheck);
  });

  // Filtered Tech Debts
  const filteredTechDebts = techDebts.filter((td) => {
    if (filterType !== 'all' && filterType !== 'tech_debts') return false;
    if (filterStatus === 'active' && td.task_id) return false;
    if (filterStatus === 'completed' && !td.task_id) return false;
    if (searchQuery && !td.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedProject !== 'all' && (td.project || 'Genel') !== selectedProject) return false;

    const dateToCheck = td.planned_date || (td.created_at ? td.created_at.slice(0, 10) : null);
    return isDateInRange(dateToCheck);
  });

  // Filtered Notes
  const filteredNotes = (allNotes || []).filter((n) => {
    if (filterType !== 'all' && filterType !== 'notes') return false;
    if (searchQuery && !n.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    const dateToCheck = n.planned_date || (n.created_at ? n.created_at.slice(0, 10) : null);
    return isDateInRange(dateToCheck);
  });

  // Filtered Links
  const filteredLinks = links.filter((l) => {
    if (filterType !== 'all' && filterType !== 'links') return false;
    if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase()) && !l.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    const dateToCheck = l.created_at ? l.created_at.slice(0, 10) : null;
    return isDateInRange(dateToCheck);
  });

  const totalResultsCount =
    filteredTasks.length +
    filteredBugs.length +
    filteredTechDebts.length +
    filteredNotes.length +
    filteredLinks.length;

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface/80 backdrop-blur-md sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-app-accent to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-app-accent/20">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-app-primary tracking-tight flex items-center gap-2">
              Kontrol Paneli (Dashboard)
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </h2>
            <p className="text-xs text-app-secondary font-medium">
              Tüm modüllerdeki verileri tarih aralığı, proje ve duruma göre detaylı filtreleyin
            </p>
          </div>
        </div>

        {/* Global Quick Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-app-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Başlık veya içerikte ara..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-app-accent/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="p-6 space-y-6">
        <div className="bg-app-surface border border-app rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-app pb-3">
            <h3 className="font-extrabold text-sm text-app-primary flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-app-accent" /> Filtreleme & Detaylı Arama Seçenekleri
            </h3>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-app-accent-light text-app-accent border border-app-accent/20">
              {totalResultsCount} İlgili Kayıt Bulundu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Modül Tipi Filtresi */}
            <div>
              <label className="block text-[11px] font-bold text-app-secondary mb-1.5">
                Modül Türü
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">🌐 Tüm Modüller</option>
                <option value="tasks">📋 Görevler</option>
                <option value="bugs">🐛 Açık Hatalar (Bugs)</option>
                <option value="tech_debts">🔧 Teknik Borçlar</option>
                <option value="notes">📝 Not Defteri</option>
                <option value="links">🔗 Bağlantılar (Linkler)</option>
              </select>
            </div>

            {/* 2. Durum Filtresi */}
            <div>
              <label className="block text-[11px] font-bold text-app-secondary mb-1.5">
                Durum (Aktif / Tamamlanan)
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">⚡ Hepsini Göster (Tümü)</option>
                <option value="active">⏳ Sadece Aktif Olanlar</option>
                <option value="completed">✅ Tamamlanan / Göreve Aktarılanlar</option>
              </select>
            </div>

            {/* 3. Tarih Aralığı Seçimi */}
            <div>
              <label className="block text-[11px] font-bold text-app-secondary mb-1.5">
                Tarih Filtresi
              </label>
              <select
                value={dateRangeType}
                onChange={(e) => setDateRangeType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">📅 Tüm Zamanlar</option>
                <option value="single">📌 Belirli Bir Gün Seç</option>
                <option value="today">☀️ Bugün</option>
                <option value="this_week">🗓 Bu Hafta</option>
                <option value="this_month">📆 Bu Ay</option>
                <option value="custom">🔍 Özel Tarih Aralığı</option>
              </select>
            </div>

            {/* 4. Dinamik Tarih Seçim Girdileri */}
            {dateRangeType === 'single' && (
              <div>
                <label className="block text-[11px] font-bold text-app-secondary mb-1.5">
                  Tarih Seçin
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none"
                />
              </div>
            )}

            {dateRangeType === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-app-secondary mb-1">Başlangıç</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-secondary mb-1">Bitiş</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {totalResultsCount === 0 ? (
            <div className="bg-app-surface border border-app rounded-3xl p-12 text-center text-app-muted space-y-3">
              <Search className="w-10 h-10 opacity-40 mx-auto" />
              <p className="text-sm font-bold text-app-primary">Seçilen kriterlere uygun kayıt bulunamadı.</p>
              <p className="text-xs text-app-secondary">Filtre tarih aralığını veya arama kelimenizi değiştirmeyi deneyebilirsiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* TASKS */}
              {filteredTasks.map((t) => (
                <div
                  key={'dash-t-' + t.id}
                  onClick={() => {
                    selectTask(t.id);
                    if (onNavigate) onNavigate('tasks');
                  }}
                  className="bg-app-surface border border-app hover:border-app-accent/60 rounded-3xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: t.color || '#5B8DEF' }}
                      >
                        Görev • {t.category || 'Genel'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${t.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-app-accent-light text-app-accent'}`}>
                        {t.status === 'done' ? '✅ Tamamlandı' : '⏳ Yapılacak'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-app-primary group-hover:text-app-accent transition-colors">
                      {t.title}
                    </h4>

                    {t.description && (
                      <p className="text-xs text-app-secondary line-clamp-2">{t.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-app mt-3 flex items-center justify-between text-[11px] text-app-muted font-mono font-semibold">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-app-accent" /> {t.planned_date || (t.created_at ? t.created_at.slice(0, 10) : 'Tarihsiz')}
                    </span>
                    <span className="text-app-accent font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Detay →
                    </span>
                  </div>
                </div>
              ))}

              {/* BUGS */}
              {filteredBugs.map((b) => (
                <div
                  key={'dash-b-' + b.id}
                  onClick={() => onNavigate && onNavigate('bugs')}
                  className="bg-app-surface border border-rose-500/20 hover:border-rose-500/60 rounded-3xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                        <Bug className="w-3 h-3" /> Bug • {b.severity.toUpperCase()}
                      </span>
                      {b.task_id && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold">
                          Taska Aktarıldı
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-app-primary group-hover:text-rose-500 transition-colors">
                      {b.title}
                    </h4>

                    {b.description && (
                      <p className="text-xs text-app-secondary line-clamp-2">{b.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-app mt-3 flex items-center justify-between text-[11px] text-app-muted font-mono font-semibold">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-rose-500" /> {b.planned_date || (b.created_at ? b.created_at.slice(0, 10) : 'Tarihsiz')}
                    </span>
                    <span className="text-rose-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      İncele →
                    </span>
                  </div>
                </div>
              ))}

              {/* TECH DEBTS */}
              {filteredTechDebts.map((td) => (
                <div
                  key={'dash-td-' + td.id}
                  onClick={() => onNavigate && onNavigate('tech_debts')}
                  className="bg-app-surface border border-amber-500/20 hover:border-amber-500/60 rounded-3xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Teknik Borç • {td.category}
                      </span>
                      {td.task_id && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold">
                          Taska Aktarıldı
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-app-primary group-hover:text-amber-500 transition-colors">
                      {td.title}
                    </h4>

                    {td.description && (
                      <p className="text-xs text-app-secondary line-clamp-2">{td.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-app mt-3 flex items-center justify-between text-[11px] text-app-muted font-mono font-semibold">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-amber-500" /> {td.planned_date || (td.created_at ? td.created_at.slice(0, 10) : 'Tarihsiz')}
                    </span>
                    <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      İncele →
                    </span>
                  </div>
                </div>
              ))}

              {/* NOTES */}
              {filteredNotes.map((n) => (
                <div
                  key={'dash-n-' + n.id}
                  onClick={() => onNavigate && onNavigate('notes')}
                  className="bg-app-surface border border-indigo-500/20 hover:border-indigo-500/60 rounded-3xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1">
                        <NotebookPen className="w-3 h-3" /> Not Defteri • {n.category}
                      </span>
                    </div>

                    <p className="font-bold text-xs text-app-primary group-hover:text-indigo-500 transition-colors line-clamp-3 leading-relaxed">
                      {n.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-app mt-3 flex items-center justify-between text-[11px] text-app-muted font-mono font-semibold">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-500" /> {n.planned_date || (n.created_at ? n.created_at.slice(0, 10) : 'Tarihsiz')}
                    </span>
                    <span className="text-indigo-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Aç →
                    </span>
                  </div>
                </div>
              ))}

              {/* LINKS */}
              {filteredLinks.map((l) => (
                <div
                  key={'dash-l-' + l.id}
                  onClick={() => window.electronAPI?.openPath(l.url)}
                  className="bg-app-surface border border-sky-500/20 hover:border-sky-500/60 rounded-3xl p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Link • {l.category}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-app-primary group-hover:text-sky-500 transition-colors truncate">
                      {l.title}
                    </h4>

                    <p className="text-xs text-app-muted truncate font-mono">{l.url}</p>
                  </div>

                  <div className="pt-3 border-t border-app mt-3 flex items-center justify-between text-[11px] text-app-muted font-mono font-semibold">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-500" /> {l.created_at ? l.created_at.slice(0, 10) : 'Tarihsiz'}
                    </span>
                    <span className="text-sky-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Tarayıcıda Aç ↗
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
