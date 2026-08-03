import React, { useEffect, useState } from 'react';
import { Sparkles, X, Clock, CheckCircle2 } from 'lucide-react';

export default function YesterdaySummaryToast() {
  const [summary, setSummary] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function loadSummary() {
      if (window.electronAPI) {
        try {
          const res = await window.electronAPI.getYesterdaySummary();
          if (res && (res.totalSeconds > 0 || res.completedTasksCount > 0)) {
            setSummary(res);
            setIsVisible(true);
          }
        } catch (err) {
          console.error('Dünkü özet alınamadı:', err);
        }
      }
    }
    loadSummary();
  }, []);

  if (!isVisible || !summary) return null;

  const minutesSpent = Math.round(summary.totalSeconds / 60);

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-app-surface border border-app rounded-2xl p-4 shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-2.5 rounded-xl bg-app-accent text-white shrink-0">
        <Sparkles className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-app-primary">Dünkü Özetiniz 📊</h4>
          <button
            onClick={() => setIsVisible(false)}
            className="text-app-muted hover:text-app-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-app-secondary mt-1">
          Harika iş çıkardınız! Dün toplamda:
        </p>

        <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-app-primary">
          <span className="flex items-center gap-1 text-app-accent">
            <Clock className="w-3.5 h-3.5" /> {minutesSpent} dakika odak
          </span>
          <span className="flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" /> {summary.completedTasksCount} tamamlanan görev
          </span>
        </div>
      </div>
    </div>
  );
}
