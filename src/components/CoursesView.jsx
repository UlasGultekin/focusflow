import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  ExternalLink,
  Plus,
  Play,
  Square,
  Clock,
  Trash2,
  BookOpen,
  Link2,
  Flame,
  Hourglass,
} from 'lucide-react';
import { useCourseStore } from '../stores/useCourseStore';

export default function CoursesView() {
  const {
    courses,
    activeCourseSession,
    sessionElapsedSeconds,
    fetchCourses,
    addCourse,
    deleteCourse,
    startCourseSession,
    endCourseSession,
    openExternalLink,
  } = useCourseStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Yazılım');

  useEffect(() => {
    fetchCourses();
  }, []);

  // Format seconds to MM:SS or HH:MM:SS
  const formatElapsed = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addCourse({
      title: title.trim(),
      url: url.trim(),
      category: category.trim() || 'Yazılım',
    });

    setIsModalOpen(false);
    setTitle('');
    setUrl('');
  };

  const handleToggleSession = async (courseId) => {
    if (activeCourseSession && activeCourseSession.course_id === courseId) {
      await endCourseSession();
    } else {
      if (activeCourseSession) {
        await endCourseSession();
      }
      await startCourseSession(courseId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Eğitimler & Kurslar</h2>
            <p className="text-xs text-app-secondary">
              Eğitimlerinize canlı süre ayırın, geçen zamanı anlık izleyip kararlarınızı alın
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Yeni Eğitim Ekle
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="p-6 space-y-4 max-w-5xl">
        {courses.length === 0 ? (
          <div className="bg-app-surface border border-app rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-indigo-500 mx-auto animate-pulse" />
            <h3 className="font-bold text-base text-app-primary">Henüz Eğitim Eklenmedi</h3>
            <p className="text-xs text-app-secondary">
              Udemy, YouTube veya kişisel çalışma konularınızı ve linklerini ekleyerek hemen başlayın.
            </p>
          </div>
        ) : (
          courses.map((course) => {
            const isSessionActive =
              activeCourseSession && activeCourseSession.course_id === course.id;

            return (
              <div
                key={course.id}
                className={`bg-app-surface border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative group transition-all ${
                  isSessionActive ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5' : 'border-app hover:border-app-accent/50'
                }`}
              >
                {/* Left: Title & Live Time Banner */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {course.category || 'Yazılım'}
                    </span>
                    {course.url && (
                      <span className="text-[10px] text-app-muted flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Bağlantı Mevcut
                      </span>
                    )}
                    {isSessionActive && (
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                        <Hourglass className="w-3.5 h-3.5 animate-spin" />
                        Geçen Süre: {formatElapsed(sessionElapsedSeconds)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-app-primary truncate">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-app-secondary font-medium pt-1">
                    <Clock className="w-3.5 h-3.5 text-app-accent" />
                    <span>Toplam Harcanan Süre:</span>
                    <strong className="text-app-primary">
                      {course.total_spent_minutes || 0} Dakika
                    </strong>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-app">
                  {/* External Browser Button */}
                  {course.url ? (
                    <button
                      onClick={() => openExternalLink(course.url)}
                      className="px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary font-semibold text-xs hover:border-app-accent hover:text-app-accent transition-all flex items-center gap-1.5 shrink-0"
                      title={course.url}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-500" /> Tarayıcıda Aç
                    </button>
                  ) : null}

                  {/* Start/Stop Learning Session Button with Live Elapsed Display */}
                  <button
                    onClick={() => handleToggleSession(course.id)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 shrink-0 ${
                      isSessionActive
                        ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse'
                        : 'bg-app-accent text-white hover:opacity-90'
                    }`}
                  >
                    {isSessionActive ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>Seansı Bitir ({formatElapsed(sessionElapsedSeconds)})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Eğitime Başla</span>
                      </>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="p-2 text-app-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eğitimi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-app-primary">Yeni Eğitim Ekle</h3>

            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Eğitim Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: React Native ve Mobil Uygulama Geliştirme"
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Eğitim Linki (İsteğe Bağlı URL)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Örn: https://www.udemy.com/course/..."
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Yazılım, Tasarım, Dil, vb."
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
