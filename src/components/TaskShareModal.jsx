import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';

export default function TaskShareModal({ task, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !task) return null;

  const shareText = `📌 Görev: ${task.title}\n📁 Kategori: ${task.category || 'Genel'}\n⏱️ Tahmini Süre: ${task.estimated_minutes}dk\n🎯 Öncelik: ${task.priority.toUpperCase()}\n${task.description ? `📝 Açıklama: ${task.description}` : ''}\n\nFocusFlow ile takip ediliyor ✨`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-app-surface border border-app rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-app">
          <h3 className="font-bold text-base text-app-primary flex items-center gap-2">
            <Share2 className="w-4 h-4 text-app-accent" /> Görevi Paylaş
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl border border-app bg-app-primary text-xs font-mono text-app-primary whitespace-pre-wrap leading-relaxed">
            {shareText}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-app text-app-secondary font-medium text-xs hover:bg-app-surface-hover"
            >
              Kapat
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Panoya Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Metin Olarak Kopyala
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
