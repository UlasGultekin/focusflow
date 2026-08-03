import React, { useEffect, useRef } from 'react';
import { Search, X, CheckSquare, FileText, BookOpen, Clock, Paperclip, ArrowRight } from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';

export default function CommandPaletteModal({ onNavigate }) {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    query,
    setQuery,
    suggestions,
    performSearch,
    filters,
    setFilters,
  } = useSearchStore();

  const inputRef = useRef(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const handleSelectSuggestion = (item) => {
    closeCommandPalette();
    if (onNavigate) {
      onNavigate(item.source_type, item.source_id, item.task_id, item.date_info);
    }
  };

  const handleSeeAllResults = () => {
    closeCommandPalette();
    performSearch(query);
    if (onNavigate) {
      onNavigate('search-page');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeCommandPalette();
    } else if (e.key === 'Enter') {
      handleSeeAllResults();
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-sky-500" />;
      case 'subtask':
        return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'task_note':
      case 'general_note':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'journal':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'session_note':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'attachment':
        return <Paperclip className="w-4 h-4 text-rose-500" />;
      default:
        return <Search className="w-4 h-4 text-app-muted" />;
    }
  };

  const getSourceLabel = (type) => {
    switch (type) {
      case 'task':
        return 'Görev';
      case 'subtask':
        return 'Alt Görev';
      case 'task_note':
        return 'Görev Notu';
      case 'general_note':
        return 'Genel Not';
      case 'journal':
        return 'Günlük';
      case 'session_note':
        return 'Oturum Notu';
      case 'attachment':
        return 'Dosya Eki';
      default:
        return 'Kayıt';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 transition-all"
      onClick={closeCommandPalette}
    >
      <div
        className="bg-app-surface border border-app rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-app flex items-center gap-3">
          <Search className="w-5 h-5 text-app-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="FocusFlow'da her şeyi ara... (Görev, Not, Günlük, Dosya)"
            className="w-full bg-transparent text-app-primary text-sm font-medium focus:outline-none placeholder:text-app-muted"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-app-muted bg-app-secondary border border-app rounded-md shrink-0">
            ESC
          </kbd>
          <button
            onClick={closeCommandPalette}
            className="p-1 rounded-lg text-app-muted hover:text-app-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Filter Chips */}
        <div className="px-4 py-2 bg-app-secondary border-b border-app flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] font-semibold text-app-muted mr-1">Filtre:</span>
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'task', label: 'Görevler' },
            { id: 'journal', label: 'Günlük' },
            { id: 'general_note', label: 'Notlar' },
            { id: 'session_note', label: 'Oturumlar' },
          ].map((chip) => {
            const isActive =
              chip.id === 'all'
                ? (filters.sourceTypes || []).length === 0
                : (filters.sourceTypes || []).includes(chip.id);

            return (
              <button
                key={chip.id}
                onClick={() => {
                  if (chip.id === 'all') {
                    setFilters({ sourceTypes: [] });
                  } else {
                    setFilters({ sourceTypes: [chip.id] });
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-app-accent text-white shadow-xs'
                    : 'bg-app-surface border border-app text-app-secondary hover:text-app-primary'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Suggestions & Search Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-app-muted text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Aramak istediğiniz anahtar kelimeyi yazın.</p>
              <p className="text-[10px] text-app-muted mt-1">İpucu: `Ctrl + Shift + F` ile her yerden ulaşabilirsiniz.</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-6 text-center text-app-muted text-xs">
              Eşleşen sonuç bulunamadı.
            </div>
          ) : (
            suggestions.map((item) => (
              <div
                key={`${item.source_type}-${item.source_id}`}
                onClick={() => handleSelectSuggestion(item)}
                className="p-3 rounded-xl hover:bg-app-accent-light border border-transparent hover:border-app-accent/30 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-app-secondary shrink-0">
                    {getSourceIcon(item.source_type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-app-primary truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-app-secondary text-app-muted shrink-0">
                        {getSourceLabel(item.source_type)}
                      </span>
                    </div>
                    {item.snippet && (
                      <p
                        className="text-[11px] text-app-secondary truncate mt-0.5"
                        dangerouslySetInnerHTML={{ __html: item.snippet }}
                      />
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-app-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer Bar */}
        {query.trim() !== '' && (
          <div className="p-3 border-t border-app bg-app-surface flex items-center justify-between">
            <span className="text-xs text-app-muted">
              {suggestions.length} eşleşme bulundu
            </span>
            <button
              onClick={handleSeeAllResults}
              className="px-3 py-1.5 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
            >
              Tüm Sonuçları Gör <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
