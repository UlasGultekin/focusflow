import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, PieChart as PieChartIcon, TrendingUp, Clock, Filter } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';

const PIE_COLORS = ['#5B8DEF', '#A855F7', '#FB7185', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

export default function AnalyticsView() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'weekly', 'monthly', 'distribution'
  const [sessions, setSessions] = useState([]);
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchAnalyticsData = async () => {
    if (window.electronAPI) {
      const data = await window.electronAPI.getAllSessions(
        new Date(startDate).toISOString(),
        new Date(`${endDate}T23:59:59`).toISOString()
      );
      setSessions(data || []);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate]);

  // 1. Günlük Veri (Task kırılımlı dakika)
  const dailyData = React.useMemo(() => {
    const taskMap = {};
    sessions.forEach((s) => {
      const name = s.task_title || 'Genel Odak';
      const minutes = Math.round((s.duration_seconds || 0) / 60);
      taskMap[name] = (taskMap[name] || 0) + minutes;
    });
    return Object.entries(taskMap).map(([name, minutes]) => ({ name, minutes }));
  }, [sessions]);

  // 2. Haftalık Veri (Son 7 günün günlük toplamları)
  const weeklyData = React.useMemo(() => {
    const intervalDays = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return intervalDays.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLabel = format(day, 'EEE', { locale: tr });
      const daySessions = sessions.filter((s) => s.start_time.startsWith(dayStr));
      const totalMinutes = daySessions.reduce(
        (acc, s) => acc + Math.round((s.duration_seconds || 0) / 60),
        0
      );
      return { day: dayLabel, minutes: totalMinutes };
    });
  }, [sessions]);

  // 3. Görev Dağılımı (Pie Chart)
  const pieData = React.useMemo(() => {
    const map = {};
    let totalSec = 0;
    sessions.forEach((s) => {
      const name = s.task_title || 'Genel Odak';
      const sec = s.duration_seconds || 0;
      map[name] = (map[name] || 0) + sec;
      totalSec += sec;
    });

    if (totalSec === 0) return [];

    return Object.entries(map).map(([name, sec]) => ({
      name,
      value: Math.round(sec / 60),
      percentage: Math.round((sec / totalSec) * 100),
    }));
  }, [sessions]);

  const totalMinutesAll = sessions.reduce(
    (acc, s) => acc + Math.round((s.duration_seconds || 0) / 60),
    0
  );

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Analiz & Raporlar</h2>
            <p className="text-xs text-app-secondary">Odaklanma süreleriniz ve görev dağılım istatistikleri</p>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-2 bg-app-primary p-1.5 rounded-xl border border-app text-xs font-semibold">
          <Calendar className="w-4 h-4 text-app-muted ml-1" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-app-primary focus:outline-none"
          />
          <span className="text-app-muted">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-app-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Metric Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-app-surface border border-app rounded-2xl p-4 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-app-accent-light text-app-accent">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-app-muted font-medium">Toplam Odak Süresi</span>
              <h3 className="text-xl font-bold text-app-primary">{totalMinutesAll} Dakika</h3>
            </div>
          </div>

          <div className="bg-app-surface border border-app rounded-2xl p-4 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-app-muted font-medium">Toplam Oturum</span>
              <h3 className="text-xl font-bold text-app-primary">{sessions.length} Seans</h3>
            </div>
          </div>

          <div className="bg-app-surface border border-app rounded-2xl p-4 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-app-muted font-medium">Farklı Görev Sayısı</span>
              <h3 className="text-xl font-bold text-app-primary">{pieData.length} Görev</h3>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-app pb-2">
          {[
            { id: 'daily', label: 'Günlük Kırılım' },
            { id: 'weekly', label: 'Haftalık Eğilim' },
            { id: 'distribution', label: 'Görev Dağılımı (%)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-app-accent text-white shadow-xs'
                  : 'bg-app-surface border border-app text-app-secondary hover:text-app-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart Render Area */}
        <div className="bg-app-surface border border-app rounded-2xl p-6 shadow-xs h-80 flex flex-col justify-center">
          {activeTab === 'daily' && (
            dailyData.length === 0 ? (
              <p className="text-xs text-app-muted text-center">Seçili dönemde veri bulunamadı.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} unit="dk" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="minutes" fill="var(--accent-color)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          )}

          {activeTab === 'weekly' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} unit="dk" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--accent-color)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--accent-color)', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'distribution' && (
            pieData.length === 0 ? (
              <p className="text-xs text-app-muted text-center">Seçili dönemde veri bulunamadı.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={4}
                    label={({ name, percentage }) => `${name}: %${percentage}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )
          )}
        </div>
      </div>
    </div>
  );
}
