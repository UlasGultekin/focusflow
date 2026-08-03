import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, X, Save, MessageSquare } from 'lucide-react';

export default function SessionEndModal({ session, task, onClose, onSave }) {
  const [notes, setNotes] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!session) return;

    setTimeLeft(15);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose(); // 15 saniye dolunca otomatik kapat
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  const handleSave = async () => {
    if (window.electronAPI && window.electronAPI.updateSessionNotes) {
      await window.electronAPI.updateSessionNotes(session.id, notes.trim());
    }
    if (onSave) onSave(session.id, notes.trim());
    onClose();
  };

  const progressPercent = (timeLeft / 15) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-app-surface border border-app rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5">
      {/* 15 saniyelik zaman çubuğu */}
      <div className="w-full bg-app-secondary h-1">
        <div
          className="bg-app-accent h-1 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-app-primary">
                {task ? `Oturum Tamamlandı: ${task.title}` : 'Odaklanma Oturumu Tamamlandı'}
              </h3>
              <p className="text-[11px] text-app-muted flex items-center gap-1">
                <Clock className="w-3 h-3 text-app-accent" />
                {session.duration_seconds ? Math.round(session.duration_seconds / 60) : 25} dk seans tamamlandı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-secondary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Bu seansta aklına gelen fikirler, notlar..."
            className="w-full p-2.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent resize-none h-20 placeholder:text-app-muted"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-medium text-app-muted">
            {timeLeft}s sonra otomatik kapanacak
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-app text-app-secondary hover:text-app-primary text-xs transition-all"
            >
              Şimdilik Geç
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" /> Kaydet ve Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
