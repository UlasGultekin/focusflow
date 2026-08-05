import React, { useEffect, useState } from 'react';
import { X, Copy, BookOpen, RefreshCw } from 'lucide-react';

export default function StandupModal({ isOpen, onClose }) {
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [reportText, setReportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen, dateStr]);

  const generateReport = async () => {
    if (!window.electronAPI || !window.electronAPI.generateStandupReport) return;
    setIsLoading(true);
    try {
      const report = await window.electronAPI.generateStandupReport(dateStr);
      setReportText(report.suggested_text);
    } catch (err) {
      console.error('Standup raporu oluşturulamadı:', err);
      setReportText('Rapor oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToJournal = async () => {
    if (!window.electronAPI || !window.electronAPI.getJournalEntry) return;
    
    // Varolan günlüğü al, sonuna ekle
    const existing = await window.electronAPI.getJournalEntry(dateStr);
    let newContent = reportText;
    let mood = 'neutral';
    
    if (existing) {
      newContent = existing.content + '\n\n---\n\n' + reportText;
      mood = existing.mood || 'neutral';
    }
    
    await window.electronAPI.saveJournalEntry(dateStr, newContent, mood);
    alert('Günlüğe başarıyla kaydedildi!');
  };

  const setToday = () => setDateStr(new Date().toISOString().split('T')[0]);
  
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDateStr(d.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-app-surface w-full max-w-2xl rounded-2xl border border-app shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app">
          <div>
            <h2 className="text-lg font-bold text-app-primary">Günlük Stand-up Raporu</h2>
            <p className="text-xs text-app-secondary">Dün ne yaptın? Bugün ne yapacaksın? Engellerin neler?</p>
          </div>
          <button onClick={onClose} className="p-2 text-app-muted hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="px-3 py-2 rounded-xl border border-app bg-app-bg text-app-primary text-sm focus:outline-none focus:border-indigo-500"
            />
            <button onClick={setYesterday} className="px-3 py-1.5 rounded-lg border border-app text-xs font-semibold hover:bg-app-surface-hover">Dün</button>
            <button onClick={setToday} className="px-3 py-1.5 rounded-lg border border-app text-xs font-semibold hover:bg-app-surface-hover">Bugün</button>
          </div>

          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            disabled={isLoading}
            className="flex-1 w-full min-h-[300px] bg-app-bg border border-app rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Rapor oluşturuluyor..."
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-app flex items-center justify-between bg-app-bg/50 rounded-b-2xl">
          <button 
            onClick={generateReport}
            className="px-4 py-2 rounded-xl border border-app text-sm font-semibold flex items-center gap-2 hover:bg-app-surface-hover"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveToJournal}
              className="px-4 py-2 rounded-xl border border-app text-indigo-500 font-semibold text-sm flex items-center gap-2 hover:bg-indigo-500/10"
            >
              <BookOpen className="w-4 h-4" /> Günlüğe Kaydet
            </button>
            <button 
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 hover:bg-indigo-600"
            >
              <Copy className="w-4 h-4" /> {copied ? 'Kopyalandı!' : 'Panoya Kopyala'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
