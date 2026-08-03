import React, { useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  CheckSquare,
  FileText,
  BookOpen,
  Clock,
  Paperclip,
  ArrowRight,
  Inbox,
  Calendar,
} from 'lucide-react';
import { useSearchStore } from '../stores/useSearchStore';

export default function SearchView({ onNavigate }) {
  const {
    query,
    setQuery,
    results,
    isLoading,
    filters,
    setFilters,
    performSearch,
    rebuildIndex,
  } = useSearchStore();

  useEffect(() => {
    performSearch();
  }, []);

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

  const handleToggleSourceType = (type) => {
    const currentTypes = filters.sourceTypes || [];
    const exists = currentTypes.includes(type);
    const newTypes = exists
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    setFilters({ sourceTypes: newTypes });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-hidden">
      {/* Search Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-app-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tüm uygulama genelinde ara... (Enter ile ara)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') performSearch();
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-sm focus:outline-none focus:ring-1 focus:ring-app-accent"
            />
          </div>
          <button
            onClick={() => performSearch()}
            className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all shrink-0"
          >
            Ara
          </button>
        </div>

        <button
          onClick={rebuildIndex}
          className="px-3 py-2 rounded-xl border border-app text-app-secondary hover:text-app-primary hover:bg-app-surface-hover text-xs font-semibold flex items-center gap-1.5 shrink-0"
          title="Tüm veritabanı arama indeksini yeniden oluşturur"
        >
          <RefreshCw className="w-3.5 h-3.5" /> İndeksi Yenile
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Filter Panel */}
        <div className="w-64 border-r border-app bg-app-surface p-5 space-y-6 overflow-y-auto">
          <div>
            <h3 className="font-bold text-xs text-app-primary flex items-center gap-1.5 mb-3">
              <Filter className="w-3.5 h-3.5 text-app-accent" /> Kaynak Türü
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { id: 'task', label: 'Görevler' },
                { id: 'subtask', label: 'Alt Görevler' },
                { id: 'general_note', label: 'Genel Notlar' },
                { id: 'task_note', label: 'Görev Notları' },
                { id: 'journal', label: 'Günlük Girişleri' },
                { id: 'session_note', label: 'Oturum Notları' },
                { id: 'attachment', label: 'Dosya Ekleri' },
              ].map((item) => {
                const checked = (filters.sourceTypes || []).includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 cursor-pointer text-app-secondary hover:text-app-primary font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleSourceType(item.id)}
                      className="rounded accent-app-accent"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="border-t border-app pt-4">
            <h3 className="font-bold text-xs text-app-primary mb-2">Görev Durumu</h3>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="todo">Yapılacak (Todo)</option>
              <option value="in_progress">Devam Eden (In Progress)</option>
              <option value="done">Tamamlanan (Done)</option>
            </select>
          </div>
        </div>

        {/* Right Search Results Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-app-primary">
              {query ? `"${query}" için Arama Sonuçları` : 'Tüm Kayıtlar'}
            </h2>
            <span className="text-xs font-semibold text-app-muted">
              {results.length} sonuç bulundu
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-app-muted text-xs">Aranıyor...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 px-4 bg-app-surface border border-app rounded-2xl max-w-md mx-auto space-y-3">
              <Inbox className="w-10 h-10 text-app-muted mx-auto" />
              <h3 className="font-bold text-sm text-app-primary">Aramanızla eşleşen sonuç bulunamadı</h3>
              <p className="text-xs text-app-secondary">
                Filtrelerinizi temizlemeyi veya farklı bir anahtar kelime aramayı deneyin.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {results.map((item) => (
                <div
                  key={`${item.source_type}-${item.source_id}`}
                  onClick={() =>
                    onNavigate &&
                    onNavigate(item.source_type, item.source_id, item.task_id, item.date_info)
                  }
                  className="p-4 rounded-2xl bg-app-surface border border-app hover:border-app-accent/40 shadow-xs transition-all cursor-pointer group flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-app-secondary shrink-0 mt-0.5">
                      {getSourceIcon(item.source_type)}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-app-primary truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-app-secondary text-app-muted shrink-0">
                          {getSourceLabel(item.source_type)}
                        </span>
                        {item.status && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-app-accent-light text-app-accent uppercase shrink-0">
                            {item.status}
                          </span>
                        )}
                      </div>

                      {item.snippet && (
                        <p
                          className="text-xs text-app-secondary leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: item.snippet }}
                        />
                      )}

                      {item.date_info && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-app-muted pt-1">
                          <Calendar className="w-3 h-3 text-app-accent" />
                          <span>{item.date_info}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-app-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
