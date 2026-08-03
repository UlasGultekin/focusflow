import React, { useState } from 'react';
import { Settings, Sun, Moon, Sparkles, Database, FileSpreadsheet, Keyboard, Shield, Save, Check } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTaskStore } from '../stores/useTaskStore';

export default function SettingsView() {
  const {
    theme,
    setTheme,
    compactMode,
    setCompactMode,
    hotkeys,
    updateHotkeys,
    pomodoro,
    updatePomodoroSettings,
  } = useSettingsStore();

  const { tasks } = useTaskStore();

  const [focusDur, setFocusDur] = useState(pomodoro.focus_duration || 25);
  const [shortBreak, setShortBreak] = useState(pomodoro.short_break || 5);
  const [longBreak, setLongBreak] = useState(pomodoro.long_break || 15);
  const [longBreakInterval, setLongBreakInterval] = useState(pomodoro.long_break_interval || 4);
  const [hotkeyVal, setHotkeyVal] = useState(hotkeys || 'Ctrl+Shift+Space');

  const [isSavedPomodoro, setIsSavedPomodoro] = useState(false);
  const [isSavedHotkey, setIsSavedHotkey] = useState(false);

  const handleSavePomodoro = async (e) => {
    e.preventDefault();
    await updatePomodoroSettings({
      focus_duration: parseInt(focusDur, 10),
      short_break: parseInt(shortBreak, 10),
      long_break: parseInt(longBreak, 10),
      long_break_interval: parseInt(longBreakInterval, 10),
    });
    setIsSavedPomodoro(true);
    setTimeout(() => setIsSavedPomodoro(false), 2000);
  };

  const handleSaveHotkey = async (e) => {
    e.preventDefault();
    await updateHotkeys(hotkeyVal);
    setIsSavedHotkey(true);
    setTimeout(() => setIsSavedHotkey(false), 2000);
  };

  const handleExportDB = async () => {
    if (window.electronAPI) {
      await window.electronAPI.exportDatabase();
    }
  };

  const handleImportDB = async () => {
    if (window.electronAPI) {
      if (confirm('Veritabanı yedeğini içe aktarmak mevcut verileri değiştirecektir. Devam etmek istiyor musunuz?')) {
        await window.electronAPI.importDatabase();
      }
    }
  };

  const handleExportCSV = async () => {
    if (window.electronAPI && tasks.length > 0) {
      const headers = 'ID,Başlık,Açıklama,Tahmini Süre (dk),Öncelik,Kategori,Durum,Oluşturulma Tarihi\n';
      const rows = tasks.map((t) =>
        `"${t.id}","${t.title.replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}","${t.estimated_minutes}","${t.priority}","${t.category}","${t.status}","${t.created_at}"`
      ).join('\n');
      const csvContent = headers + rows;
      await window.electronAPI.exportCSV(csvContent, 'focusflow-tasks.csv');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-app-primary">Ayarlar & Özelleştirme</h2>
          <p className="text-xs text-app-secondary">Tema, Pomodoro zamanlayıcı, kısayollar ve veri yönetimi</p>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-3xl">
        {/* 1. Tema & Görünüm Seçenekleri (Görev 8) */}
        <div className="bg-app-surface border border-app rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-app-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-app-accent" /> Tema & Görünüm Modları
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {/* Soft Light */}
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === 'light'
                  ? 'border-app-accent bg-app-accent-light/40 shadow-xs'
                  : 'border-app hover:bg-app-surface-hover'
              }`}
            >
              <Sun className="w-6 h-6 text-blue-500" />
              <span className="text-xs font-bold text-app-primary">Açık (Soft Light)</span>
              <span className="text-[10px] text-app-muted text-center">Yumuşak beyaz/mavi tonlar</span>
            </button>

            {/* Deep Dark */}
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'border-app-accent bg-app-accent-light/40 shadow-xs'
                  : 'border-app hover:bg-app-surface-hover'
              }`}
            >
              <Moon className="w-6 h-6 text-purple-500" />
              <span className="text-xs font-bold text-app-primary">Koyu (Deep Dark)</span>
              <span className="text-[10px] text-app-muted text-center">Gece mavisi & neon mor</span>
            </button>

            {/* Pastel Calm */}
            <button
              onClick={() => setTheme('pastel')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === 'pastel'
                  ? 'border-app-accent bg-app-accent-light/40 shadow-xs'
                  : 'border-app hover:bg-app-surface-hover'
              }`}
            >
              <Sparkles className="w-6 h-6 text-rose-500" />
              <span className="text-xs font-bold text-app-primary">Pastel (Calm)</span>
              <span className="text-[10px] text-app-muted text-center">Nane yeşili & mercan</span>
            </button>
          </div>

          <div className="pt-3 border-t border-app flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-app-primary block">Kompakt Görünüm Modu</span>
              <span className="text-[11px] text-app-muted">Kartları ve kenar çubuğunu daraltır.</span>
            </div>
            <input
              type="checkbox"
              checked={compactMode}
              onChange={(e) => setCompactMode(e.target.checked)}
              className="w-4 h-4 accent-app-accent rounded cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Pomodoro Zamanlayıcı Ayarları */}
        <form onSubmit={handleSavePomodoro} className="bg-app-surface border border-app rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-app-primary flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" /> Pomodoro Varsayılan Süreleri (Dakika)
            </h3>
            {isSavedPomodoro && (
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Kaydedildi
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-app-secondary mb-1">Odaklanma (dk)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={focusDur}
                onChange={(e) => setFocusDur(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-app-secondary mb-1">Kısa Mola (dk)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={shortBreak}
                onChange={(e) => setShortBreak(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-app-secondary mb-1">Uzun Mola (dk)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={longBreak}
                onChange={(e) => setLongBreak(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-app-secondary mb-1">Mola Aralığı (Seans)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={longBreakInterval}
                onChange={(e) => setLongBreakInterval(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" /> Ayarları Kaydet
            </button>
          </div>
        </form>

        {/* 3. Global Kısayol Tuşu (Görev 9) */}
        <form onSubmit={handleSaveHotkey} className="bg-app-surface border border-app rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-app-primary flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-app-accent" /> Genel Kısayol Tuşu
            </h3>
            {isSavedHotkey && (
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Güncellendi
              </span>
            )}
          </div>
          <p className="text-xs text-app-secondary">
            Uygulama arka plandayken pencereyi anında açıp kapatmak için tuş kombinasyonu.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={hotkeyVal}
              onChange={(e) => setHotkeyVal(e.target.value)}
              placeholder="Örn: Ctrl+Shift+Space"
              className="flex-1 px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-mono focus:outline-none focus:ring-1 focus:ring-app-accent"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all"
            >
              Kaydet
            </button>
          </div>
        </form>

        {/* 4. Veri Yönetimi & Yedekleme (Görev 10) */}
        <div className="bg-app-surface border border-app rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-app-primary flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" /> Veri Kalıcılığı, İçe/Dışa Aktarma
          </h3>
          <p className="text-xs text-app-secondary">
            Tüm verileriniz yerel SQLite veritabanında saklanır. Dilediğiniz zaman yedeğinizi alabilir veya dışa aktarabilirsiniz.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExportDB}
              className="px-4 py-2.5 rounded-xl border border-app bg-app-primary text-app-primary font-semibold text-xs hover:bg-app-surface-hover transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-app-accent" /> Veritabanını Dışa Aktar (.db)
            </button>

            <button
              onClick={handleImportDB}
              className="px-4 py-2.5 rounded-xl border border-app bg-app-primary text-app-primary font-semibold text-xs hover:bg-app-surface-hover transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-500" /> Yedeği İçe Aktar (.db)
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl border border-app bg-app-primary text-app-primary font-semibold text-xs hover:bg-app-surface-hover transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> CSV Olarak Dışa Aktar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
