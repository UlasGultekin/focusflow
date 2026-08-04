import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Sparkles,
  Database,
  FileSpreadsheet,
  Keyboard,
  Shield,
  Save,
  Check,
  Trash2,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  EyeOff,
  Eye,
} from 'lucide-react';
import { useSettingsStore, DEFAULT_MENU_LABELS } from '../stores/useSettingsStore';
import { useTaskStore } from '../stores/useTaskStore';
import { useHabitStore } from '../stores/useHabitStore';
import { useSearchStore } from '../stores/useSearchStore';
import {
  playFocusCompleteSound,
  playBreakCompleteSound,
  playEventReminderSound,
  playTimerStartSound,
} from '../utils/sounds';

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
    hiddenTabs,
    toggleHiddenTab,
    menuLabels,
  } = useSettingsStore();

  const { tasks, fetchTasks } = useTaskStore();

  const [focusDur, setFocusDur] = useState(pomodoro.focus_duration || 25);
  const [shortBreak, setShortBreak] = useState(pomodoro.short_break || 5);
  const [longBreak, setLongBreak] = useState(pomodoro.long_break || 15);
  const [longBreakInterval, setLongBreakInterval] = useState(pomodoro.long_break_interval || 4);
  const [hotkeyVal, setHotkeyVal] = useState(hotkeys || 'Ctrl+Shift+Space');

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('ff_sound_enabled');
    return stored === null ? true : stored === 'true';
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const stored = localStorage.getItem('ff_sound_volume');
    return stored === null ? 0.4 : parseFloat(stored);
  });

  const handleToggleSound = (val) => {
    setSoundEnabled(val);
    localStorage.setItem('ff_sound_enabled', String(val));
    // Update sounds utility global flag
    window.__ff_sound_enabled = val;
    window.__ff_sound_volume = soundVolume;
  };

  const handleVolumeChange = (val) => {
    setSoundVolume(val);
    localStorage.setItem('ff_sound_volume', String(val));
    window.__ff_sound_volume = val;
  };

  const [isSavedPomodoro, setIsSavedPomodoro] = useState(false);
  const [isSavedHotkey, setIsSavedHotkey] = useState(false);

  // Date Range Cleanup States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateCleanupSuccess, setIsDateCleanupSuccess] = useState(false);

  // Full Reset Confirmation Modal State
  const [isFullResetModalOpen, setIsFullResetModalOpen] = useState(false);
  const [confirmInputText, setConfirmInputText] = useState('');

  const refreshAllStores = async () => {
    // Re-fetch tasks first
    await fetchTasks();
    // Re-fetch habits
    const habitState = useHabitStore.getState();
    if (habitState?.fetchHabits) await habitState.fetchHabits();
    // Re-fetch search index
    const searchState = useSearchStore.getState();
    if (searchState?.rebuildIndex) await searchState.rebuildIndex();
    // Re-fetch settings (most important - ensures pomodoro values re-populate)
    const { fetchSettings } = useSettingsStore.getState();
    if (fetchSettings) await fetchSettings();
  };

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
        await refreshAllStores();
      }
    }
  };

  const handleExportCSV = async () => {
    if (window.electronAPI && tasks.length > 0) {
      const headers = 'ID,Başlık,Açıklama,Tahmini Süre (dk),Öncelik,Kategori,Durum,Oluşturulma Tarihi\n';
      const rows = tasks.map((t) =>
        `"${t.id}","${(t.title || '').replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}","${t.estimated_minutes}","${t.priority}","${t.category}","${t.status}","${t.created_at}"`
      ).join('\n');
      const csvContent = headers + rows;
      await window.electronAPI.exportCSV(csvContent, 'focusflow-tasks.csv');
    }
  };

  // Tarih Aralığına Göre Silme
  const handleClearByDateRange = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Lütfen geçerli bir başlangıç ve bitiş tarihi seçin.');
      return;
    }

    if (startDate > endDate) {
      alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
      return;
    }

    if (
      confirm(
        `${startDate} - ${endDate} tarihleri arasındaki tüm görevler, seanslar, notlar ve günlükler silinecektir. Emin misiniz?`
      )
    ) {
      if (window.electronAPI && window.electronAPI.clearDataByDateRange) {
        await window.electronAPI.clearDataByDateRange(startDate, endDate);
        // Full page reload to cleanly re-initialize all Zustand stores from empty DB
        window.location.reload();
      }
    }
  };

  // Tüm Verileri Sıfırla (Hard Reset)
  const handleConfirmFullReset = async () => {
    if (confirmInputText.trim().toUpperCase() !== 'TEMİZLE') {
      alert('Lütfen silme işlemini onaylamak için "TEMİZLE" yazın.');
      return;
    }

    if (window.electronAPI && window.electronAPI.clearAllData) {
      await window.electronAPI.clearAllData();
      // Full page reload — the only reliable way to re-initialize all Zustand stores
      // from a completely empty database without stale in-memory state.
      window.location.reload();
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
        {/* 1. Tema & Görünüm Seçenekleri */}
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

        {/* 3. Ses Ayarları */}
        <div className="bg-app-surface border border-app rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-app-primary flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-app-accent" />
            ) : (
              <VolumeX className="w-4 h-4 text-app-muted" />
            )}
            Ses Bildirimleri
          </h3>
          <p className="text-xs text-app-secondary">
            Timer dolduğunda ve etkinlik hatırlatıcılarında ses efektleri çalar.
          </p>

          {/* Ses Aç/Kapat toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-app-primary border border-app">
            <div>
              <span className="text-xs font-semibold text-app-primary block">Ses Efektleri</span>
              <span className="text-[11px] text-app-muted">Timer ve bildirim seslerini etkinleştirir.</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-app-accent' : 'bg-app-secondary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Ses Seviyesi */}
          {soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-app-secondary">Ses Seviyesi</label>
                <span className="text-[11px] font-bold text-app-accent">{Math.round(soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full accent-app-accent cursor-pointer"
              />
            </div>
          )}

          {/* Test Butonları */}
          {soundEnabled && (
            <div className="pt-1 space-y-2">
              <p className="text-[11px] font-semibold text-app-secondary">Önizleme:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => playTimerStartSound(soundVolume)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app text-app-secondary text-xs hover:bg-app-surface-hover transition-all"
                >
                  <Play className="w-3 h-3" /> Timer Başlat
                </button>
                <button
                  type="button"
                  onClick={() => playFocusCompleteSound(soundVolume)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app text-app-secondary text-xs hover:bg-app-surface-hover transition-all"
                >
                  <Play className="w-3 h-3" /> Odak Tamamlandı
                </button>
                <button
                  type="button"
                  onClick={() => playBreakCompleteSound(soundVolume)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app text-app-secondary text-xs hover:bg-app-surface-hover transition-all"
                >
                  <Play className="w-3 h-3" /> Mola Tamamlandı
                </button>
                <button
                  type="button"
                  onClick={() => playEventReminderSound(soundVolume)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app text-app-secondary text-xs hover:bg-app-surface-hover transition-all"
                >
                  <Play className="w-3 h-3" /> Etkinlik Hatırlatıcı
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Global Kısayol Tuşu */}
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

        {/* 4. Veri Yönetimi & Yedekleme */}
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

        {/* 5. Sekme Görünürlüğü (Yeni Özellik) */}
        <div className="bg-app-surface border border-app rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-app-primary flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-app-accent" /> Sekme Görünürlüğü
          </h3>
          <p className="text-xs text-app-secondary">
            Sol menüde görünmesini istemediğiniz sekmeleri buradan gizleyip açabilirsiniz.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(DEFAULT_MENU_LABELS).map(([tabId, defaultLabel]) => {
              if (tabId === 'settings') return null; // Ayarlar gizlenemez
              const label = menuLabels[tabId] || defaultLabel;
              const isHidden = hiddenTabs.includes(tabId);
              
              return (
                <button
                  key={tabId}
                  onClick={() => toggleHiddenTab(tabId)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isHidden
                      ? 'border-app bg-app-surface-hover text-app-muted'
                      : 'border-app-accent bg-app-accent-light/30 text-app-primary'
                  }`}
                >
                  <span className="text-xs font-semibold truncate pr-2">{label}</span>
                  {isHidden ? (
                    <EyeOff className="w-4 h-4 text-app-muted shrink-0" />
                  ) : (
                    <Eye className="w-4 h-4 text-app-accent shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. VERİ TEMİZLEME & SIFIRLAMA (YENİ ÖZELLİK) */}
        <div className="bg-app-surface border border-rose-500/30 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-app pb-3">
            <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Veri Temizleme & Sıfırlama
            </h3>
            {isDateCleanupSuccess && (
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Seçili Veriler Silindi
              </span>
            )}
          </div>

          {/* Tarih Aralığına Göre Silme Formu */}
          <form onSubmit={handleClearByDateRange} className="space-y-3">
            <h4 className="text-xs font-bold text-app-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-app-accent" /> Tarih Aralığına Göre Kayıtları Sil
            </h4>
            <p className="text-[11px] text-app-secondary">
              Belirttiğiniz başlangıç ve bitiş tarihleri arasındaki tüm görevler, seanslar, notlar ve günlükler veritabanından kalıcı olarak temizlenir.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-app-secondary mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-app-secondary mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Seçili Tarih Aralığındaki Verileri Sil
              </button>
            </div>
          </form>

          {/* Tüm Verileri Sıfırla (Hard Reset) */}
          <div className="pt-4 border-t border-app space-y-3">
            <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Tüm Uygulama Verilerini Sıfırla (Fabrika Ayarları)
            </h4>
            <p className="text-[11px] text-app-secondary">
              Uygulamanızdaki tüm görevler, alt görevler, seanslar, notlar, alışkanlıklar, günlükler ve ekler silinir. Sadece varsayılan uygulama ayarlarınız korunur.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsFullResetModalOpen(true)}
                className="px-4 py-2 rounded-xl border border-rose-500 text-rose-500 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tüm Verileri Kalıcı Olarak Sıfırla
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Reset Confirmation Modal */}
      {isFullResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-app-primary">Tüm Verileri Sıfırlamak İstiyor Musunuz?</h3>
            </div>

            <p className="text-xs text-app-secondary leading-relaxed">
              Bu işlem <strong>GERİ ALINAMAZ</strong>. Tüm görevleriniz, notlarınız, alışkanlıklarınız, günlükleriniz ve seans verileriniz tamamen silinecektir.
            </p>

            <div>
              <label className="block text-xs font-semibold text-app-primary mb-1">
                Devam etmek için <strong>"TEMİZLE"</strong> yazın:
              </label>
              <input
                type="text"
                autoFocus
                value={confirmInputText}
                onChange={(e) => setConfirmInputText(e.target.value)}
                placeholder="TEMİZLE"
                className="w-full px-3 py-2 rounded-xl border border-rose-500/40 bg-app-primary text-app-primary text-xs font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
              <button
                type="button"
                onClick={() => {
                  setIsFullResetModalOpen(false);
                  setConfirmInputText('');
                }}
                className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs hover:bg-app-surface-hover"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmFullReset}
                disabled={confirmInputText.trim().toUpperCase() !== 'TEMİZLE'}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Sıfırlamayı Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
