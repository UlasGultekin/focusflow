import React, { useEffect, useState } from 'react';
import {
  FolderKanban, Plus, Trash2, Edit3, CheckCircle2, Clock,
  ArrowRight, Sparkles, NotebookPen, LayoutList, Check, X,
  AlertCircle, ChevronRight, Layers, FileText, Share2, Image as ImageIcon,
  FolderPlus, FilePlus, Filter, Calendar as CalendarIcon, ExternalLink, Paperclip
} from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { useTaskStore } from '../stores/useTaskStore';

const PHASES = ['Planlama', 'Geliştirme', 'Test & İnceleme', 'Tamamlandı'];
const PROJECT_COLORS = ['#4F46E5', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
const CATEGORIES = ['Tümü', 'İş', 'Kişisel', 'Yazılım', 'Tasarım', 'Eğitim'];

export default function ProjectsView({ onNavigateToTask, onNavigateToNote }) {
  const {
    projects,
    selectedProjectId,
    plans,
    fetchProjects,
    selectProject,
    addProject,
    updateProject,
    deleteProject,
    addProjectPlan,
    updateProjectPlan,
    deleteProjectPlan,
    convertPlanToTask,
    convertPlanToNote,
  } = useProjectStore();

  const { fetchTasks, fetchAllNotes } = useTaskStore();

  // Category & Date Filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Tümü');
  const [dateSortOrder, setDateSortOrder] = useState('newest'); // 'newest', 'oldest'

  // Modals state
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('#4F46E5');
  const [projectCategory, setProjectCategory] = useState('İş');

  // Plan creation state with Media & Files
  const [planTitle, setPlanTitle] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planPhase, setPlanPhase] = useState('Planlama');
  const [planImages, setPlanImages] = useState([]);
  const [planAttachments, setPlanAttachments] = useState([]);

  // Popup Modal for Convert to Note customization
  const [convertNoteModalPlan, setConvertNoteModalPlan] = useState(null);
  const [customNoteCategory, setCustomNoteCategory] = useState('Proje');
  const [customNotePhase, setCustomNotePhase] = useState('Planlama');
  const [customNoteText, setCustomNoteText] = useState('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filter projects by category and sort by date
  const filteredProjects = projects
    .filter((p) => (selectedCategoryFilter === 'Tümü' ? true : p.category === selectedCategoryFilter))
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Calculate project progress
  const totalPlans = plans.length;
  const completedPlans = plans.filter((p) => p.status === 'done').length;
  const progressPercentage = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    if (editingProject) {
      await updateProject(editingProject.id, {
        title: projectTitle.trim(),
        description: projectDesc.trim(),
        color: projectColor,
        category: projectCategory,
      });
      showToast('Proje başarıyla güncellendi!');
    } else {
      await addProject({
        title: projectTitle.trim(),
        description: projectDesc.trim(),
        color: projectColor,
        category: projectCategory,
      });
      showToast('Yeni proje oluşturuldu!');
    }

    setIsAddProjectOpen(false);
    setEditingProject(null);
    setProjectTitle('');
    setProjectDesc('');
  };

  const handleOpenEditProject = (proj) => {
    setEditingProject(proj);
    setProjectTitle(proj.title);
    setProjectDesc(proj.description || '');
    setProjectColor(proj.color || '#4F46E5');
    setProjectCategory(proj.category || 'İş');
    setIsAddProjectOpen(true);
  };

  // Clipboard Paste Support (Ctrl+V Image & Text Paste)
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Check for images in clipboard
    const items = Array.from(clipboardData.items);
    let imagePasted = false;

    items.forEach((item) => {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          imagePasted = true;
          const reader = new FileReader();
          reader.onload = (event) => {
            setPlanImages((prev) => [...prev, event.target.result]);
            showToast('🖼️ Panodan görsel yapıştırıldı!');
          };
          reader.readAsDataURL(file);
        }
      }
    });
  };

  // Native Electron Folder Picker
  const handleSelectFolder = async () => {
    if (window.electronAPI?.selectFolder) {
      const folderObj = await window.electronAPI.selectFolder();
      if (folderObj) {
        const folderPath = typeof folderObj === 'string' ? folderObj : folderObj.path;
        const folderName = typeof folderObj === 'string'
          ? (folderPath.split('\\').pop() || folderPath.split('/').pop() || folderPath)
          : (folderObj.name || folderPath);

        setPlanAttachments((prev) => [
          ...prev,
          {
            name: `📁 ${folderName}`,
            path: folderPath,
            type: 'folder',
          },
        ]);
        showToast(`📁 Klasör bağlandı: ${folderName}`);
      }
    }
  };

  // Native Electron File Picker
  const handleSelectFiles = async () => {
    if (window.electronAPI?.selectFiles) {
      const files = await window.electronAPI.selectFiles();
      if (files && files.length > 0) {
        files.forEach((f) => {
          const filePath = typeof f === 'string' ? f : f.path;
          const fileName = typeof f === 'string' ? (filePath.split('\\').pop() || filePath.split('/').pop() || filePath) : f.name;

          setPlanAttachments((prev) => [
            ...prev,
            {
              name: fileName,
              path: filePath,
              type: 'file',
            },
          ]);
        });
        showToast(`📄 ${files.length} dosya bağlandı!`);
      }
    }
  };

  // Web input fallback for images
  const handleAddImage = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPlanImages((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOpenPath = async (filePath) => {
    if (window.electronAPI?.openExternalLink) {
      await window.electronAPI.openExternalLink(filePath);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!planTitle.trim() || !selectedProjectId) return;

    await addProjectPlan({
      project_id: selectedProjectId,
      title: planTitle.trim(),
      description: planDesc.trim(),
      phase: planPhase,
      images: planImages,
      attachments: planAttachments,
    });

    setPlanTitle('');
    setPlanDesc('');
    setPlanImages([]);
    setPlanAttachments([]);
    showToast('Proje plan maddesi eklendi!');
  };

  const handleTogglePlanStatus = async (plan) => {
    const nextStatus = plan.status === 'done' ? 'todo' : 'done';
    const imgs = plan.images_json ? JSON.parse(plan.images_json) : [];
    const atts = plan.attachments_json ? JSON.parse(plan.attachments_json) : [];

    await updateProjectPlan(plan.id, selectedProjectId, {
      ...plan,
      status: nextStatus,
      images: imgs,
      attachments: atts,
    });
  };

  const handleConvertToTask = async (plan) => {
    const taskId = await convertPlanToTask(plan.id, selectedProjectId);
    if (taskId) {
      await fetchTasks();
      showToast(`"${plan.title}" tüm medya/dosyalarıyla Göreve dönüştürüldü!`);
      if (onNavigateToTask) {
        onNavigateToTask(taskId);
      }
    }
  };

  const handleOpenConvertNoteModal = (plan) => {
    setConvertNoteModalPlan(plan);
    setCustomNoteCategory(selectedProject ? selectedProject.category || 'Proje' : 'Proje');
    setCustomNotePhase(plan.phase || 'Planlama');
    setCustomNoteText('');
  };

  const handleConfirmConvertToNote = async () => {
    if (!convertNoteModalPlan) return;

    const noteId = await convertPlanToNote(
      convertNoteModalPlan.id,
      selectedProjectId,
      customNoteCategory,
      customNotePhase,
      customNoteText
    );

    if (noteId) {
      await fetchAllNotes();
      showToast(`"${convertNoteModalPlan.title}" tüm görselleri ve dosyalarıyla Not Defterine eklendi!`);
      setConvertNoteModalPlan(null);
      if (onNavigateToNote) {
        onNavigateToNote();
      }
    }
  };

  return (
    <div className="flex-1 flex h-screen bg-app-primary overflow-hidden select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-100">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Left Sidebar: Projects List & Filtering ── */}
      <div className="w-84 border-r border-app bg-app-surface flex flex-col h-full">
        {/* Header */}
        <div className="p-5 border-b border-app flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-app-primary leading-none">Projeler</h2>
              <span className="text-[11px] text-app-muted font-medium">Planlama & Yol Haritası</span>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingProject(null);
              setProjectTitle('');
              setProjectDesc('');
              setIsAddProjectOpen(true);
            }}
            className="p-2 rounded-xl bg-app-accent text-white hover:opacity-90 transition-all shadow-xs"
            title="Yeni Proje Ekle"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toolbar: Category & Date Sort */}
        <div className="p-3 border-b border-app space-y-2 bg-app-primary/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-secondary">
              <Filter className="w-3.5 h-3.5 text-app-accent" /> Kategori:
            </div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-secondary">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> Sıralama:
            </div>
            <button
              onClick={() => setDateSortOrder(dateSortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-2.5 py-1 rounded-xl border border-app bg-app-primary text-app-primary text-[11px] font-bold hover:bg-app-surface transition-colors"
            >
              {dateSortOrder === 'newest' ? '📅 En Yeni İlk' : '📅 En Eski İlk'}
            </button>
          </div>
        </div>

        {/* Projects Cards List */}
        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-app rounded-2xl my-4 space-y-3">
              <FolderKanban className="w-8 h-8 text-app-muted mx-auto" />
              <p className="text-xs text-app-secondary font-medium">Bu filtreye uygun proje bulunamadı.</p>
              <button
                onClick={() => {
                  setSelectedCategoryFilter('Tümü');
                  setEditingProject(null);
                  setProjectTitle('');
                  setProjectDesc('');
                  setIsAddProjectOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-app-accent text-white text-xs font-bold"
              >
                + Yeni Proje Ekle
              </button>
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isSelected = selectedProjectId === proj.id;
              const total = proj.total_plans || 0;
              const completed = proj.completed_plans || 0;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div
                  key={proj.id}
                  onClick={() => selectProject(proj.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group space-y-2.5 ${
                    isSelected
                      ? 'bg-app-accent-light/30 border-app-accent shadow-xs'
                      : 'bg-app-primary border-app hover:border-app-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proj.color || '#4F46E5' }} />
                      <h3 className="font-bold text-sm text-app-primary truncate">{proj.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditProject(proj);
                        }}
                        className="p-1 text-app-muted hover:text-indigo-500 rounded-md"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${proj.title}" projesi ve tüm planları silinecektir. Emin misiniz?`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        className="p-1 text-app-muted hover:text-rose-500 rounded-md"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {proj.category || 'Genel'}
                    </span>
                    <span className="text-[10px] font-medium text-app-muted">
                      {new Date(proj.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-app-secondary line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}

                  {/* Mini Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-app-muted">
                      <span>{completed}/{total} Plan Bitti</span>
                      <span className="text-emerald-500 font-bold">%{pct}</span>
                    </div>
                    <div className="w-full h-1.5 bg-app-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Content Area: Project Plans & Media Attachments ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-primary">
        {selectedProject ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
            {/* Project Header Banner */}
            <div className="bg-app-surface border border-app rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 bottom-0 w-2"
                style={{ backgroundColor: selectedProject.color || '#4F46E5' }}
              />

              <div className="space-y-1 pl-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: selectedProject.color || '#4F46E5' }}>
                    {selectedProject.category || 'Proje'}
                  </span>
                  <span className="text-xs font-semibold text-app-muted">
                    Oluşturulma: {new Date(selectedProject.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-app-primary">{selectedProject.title}</h1>
                {selectedProject.description && (
                  <p className="text-xs text-app-secondary max-w-2xl leading-relaxed">
                    {selectedProject.description}
                  </p>
                )}
              </div>

              {/* Progress Summary Card */}
              <div className="bg-app-primary border border-app p-4 rounded-2xl flex items-center gap-4 shrink-0 shadow-inner">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-app-muted block">Genel İlerleme</span>
                  <span className="text-xl font-extrabold text-emerald-500">%{progressPercentage}</span>
                </div>
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-app-secondary stroke-current"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 stroke-current"
                      strokeWidth="3.5"
                      strokeDasharray={`${progressPercentage}, 100`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-app-primary">{completedPlans}/{totalPlans}</span>
                </div>
              </div>
            </div>

            {/* Quick Plan Creation Form with Görsel/Klasör/Dosya Yükleme & Yapıştırma (Ctrl+V) */}
            <form onSubmit={handleAddPlan} onPaste={handlePaste} className="bg-app-surface border border-app rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-app-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-app-accent" /> Yeni Proje Plan Maddesi
                </h3>
                <span className="text-[10px] text-app-muted font-medium bg-app-primary px-2 py-0.5 rounded-md border border-app">
                  💡 İpucu: Görselleri doğrudan yapıştırabilirsiniz (Ctrl+V)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Plan başlığı (Örn: Veritabanı Şeması Tasarımı)..."
                  className="md:col-span-2 px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
                <select
                  value={planPhase}
                  onChange={(e) => setPlanPhase(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {PHASES.map((ph) => (
                    <option key={ph} value={ph}>📍 Aşama: {ph}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-app-accent text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Plan Ekle
                </button>
              </div>

              <textarea
                rows={2}
                value={planDesc}
                onChange={(e) => setPlanDesc(e.target.value)}
                placeholder="Plan açıklaması veya alt detaylar... (Görselleri doğrudan buraya yapıştırabilirsiniz)"
                className="w-full px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-app-accent"
              />

              {/* Media & File Pickers Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-app">
                <label className="px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-secondary hover:text-app-primary text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors">
                  <ImageIcon className="w-4 h-4 text-emerald-500" /> Görsel Ekle
                  <input type="file" accept="image/*" multiple onChange={handleAddImage} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-secondary hover:text-app-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" /> Klasör Bağla
                </button>

                <button
                  type="button"
                  onClick={handleSelectFiles}
                  className="px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-secondary hover:text-app-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FilePlus className="w-4 h-4 text-blue-500" /> Dosya Seç
                </button>
              </div>

              {/* Selected Images & Attachments Preview Chips */}
              {(planImages.length > 0 || planAttachments.length > 0) && (
                <div className="space-y-2 pt-2 border-t border-app/60">
                  {planImages.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {planImages.map((src, idx) => (
                        <div key={idx} className="relative group shrink-0">
                          <img src={src} alt="Önizleme" className="w-14 h-14 rounded-xl object-cover border border-app shadow-xs" />
                          <button
                            type="button"
                            onClick={() => setPlanImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {planAttachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {planAttachments.map((att, idx) => (
                        <span key={idx} className="text-[11px] font-semibold text-app-primary bg-app-primary border border-app px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                          {att.type === 'folder' ? '📁' : '📄'} {att.name}
                          <button
                            type="button"
                            onClick={() => setPlanAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-app-muted hover:text-rose-500 ml-1"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Plans List Organized by Phases */}
            <div className="space-y-6">
              {PHASES.map((phase) => {
                const phasePlans = plans.filter((p) => p.phase === phase);

                return (
                  <div key={phase} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-app pb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-app-accent" />
                      <h3 className="font-bold text-sm text-app-primary">{phase}</h3>
                      <span className="text-xs font-bold text-app-muted bg-app-secondary px-2 py-0.5 rounded-full">
                        {phasePlans.length}
                      </span>
                    </div>

                    {phasePlans.length === 0 ? (
                      <div className="p-4 border border-dashed border-app rounded-xl text-center text-xs text-app-muted font-medium">
                        Bu aşamada henüz plan bulunmuyor.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phasePlans.map((plan) => {
                          const isDone = plan.status === 'done';
                          const hasTask = Boolean(plan.converted_task_id);
                          const hasNote = Boolean(plan.converted_note_id);
                          const imgs = plan.images_json ? JSON.parse(plan.images_json) : [];
                          const atts = plan.attachments_json ? JSON.parse(plan.attachments_json) : [];

                          return (
                            <div
                              key={plan.id}
                              className={`p-4 rounded-2xl border bg-app-surface shadow-xs transition-all space-y-3 relative group ${
                                isDone ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-app hover:border-app-accent'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <button
                                    onClick={() => handleTogglePlanStatus(plan)}
                                    className={`mt-0.5 shrink-0 transition-colors ${
                                      isDone ? 'text-emerald-500' : 'text-app-muted hover:text-app-accent'
                                    }`}
                                  >
                                    <CheckCircle2 className={`w-5 h-5 ${isDone ? 'fill-emerald-500 text-white' : ''}`} />
                                  </button>
                                  <div className="space-y-1 min-w-0">
                                    <h4 className={`font-bold text-sm text-app-primary leading-snug ${isDone ? 'line-through opacity-70' : ''}`}>
                                      {plan.title}
                                    </h4>
                                    {plan.description && (
                                      <p className="text-xs text-app-secondary line-clamp-3 leading-relaxed">
                                        {plan.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => deleteProjectPlan(plan.id, selectedProjectId)}
                                  className="p-1 text-app-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Planı Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Attached Images Thumbnails */}
                              {imgs.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto py-1">
                                  {imgs.map((src, i) => (
                                    <img
                                      key={i}
                                      src={src}
                                      alt="Plan Medya"
                                      className="w-14 h-14 rounded-xl object-cover border border-app shadow-xs hover:scale-105 transition-transform"
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Attached Files & Folders */}
                              {atts.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  {atts.map((att, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => handleOpenPath(att.path)}
                                      className="flex items-center justify-between p-2 rounded-xl bg-app-primary border border-app hover:border-app-accent text-xs font-semibold text-app-primary cursor-pointer transition-colors"
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span className="truncate">{att.name}</span>
                                      </span>
                                      <ExternalLink className="w-3.5 h-3.5 text-app-muted shrink-0" />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Conversion Status Badges & Action Buttons */}
                              <div className="pt-3 border-t border-app flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {hasTask && (
                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <LayoutList className="w-3 h-3" /> Görev Yapıldı #{plan.converted_task_id}
                                    </span>
                                  )}
                                  {hasNote && (
                                    <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <NotebookPen className="w-3 h-3" /> Not Yapıldı
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 ml-auto">
                                  {!hasTask && (
                                    <button
                                      onClick={() => handleConvertToTask(plan)}
                                      className="px-2.5 py-1 rounded-xl border border-app bg-app-primary text-app-secondary hover:text-blue-500 hover:border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs"
                                      title="Tüm medya/dosyalarıyla Göreve Dönüştür"
                                    >
                                      <LayoutList className="w-3 h-3 text-blue-500" /> ⚡ Görev Yap
                                    </button>
                                  )}
                                  {!hasNote && (
                                    <button
                                      onClick={() => handleOpenConvertNoteModal(plan)}
                                      className="px-2.5 py-1 rounded-xl border border-app bg-app-primary text-app-secondary hover:text-purple-500 hover:border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs"
                                      title="Özel not/aşama ekleyip Not Defterine Dönüştür"
                                    >
                                      <NotebookPen className="w-3 h-3 text-purple-500" /> 📝 Not Yap
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-app-surface border border-app flex items-center justify-center text-app-muted mb-4 shadow-xs">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-app-primary">Proje Seçilmedi</h3>
            <p className="text-xs text-app-secondary max-w-sm mt-1">
              Planlarını incelemek, görseller eklemek ve görevlere dönüştürmek için sol taraftan bir proje seçin.
            </p>
          </div>
        )}
      </div>

      {/* ── Create / Edit Project Modal ── */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-app pb-4">
              <h3 className="font-extrabold text-base text-app-primary flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-app-accent" />
                {editingProject ? 'Proje Düzenle' : 'Yeni Proje Oluştur'}
              </h3>
              <button onClick={() => setIsAddProjectOpen(false)} className="p-1.5 rounded-xl text-app-muted hover:text-app-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-app-secondary mb-1.5">Proje Adı *</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Örn: FocusFlow Mobil Uygulama"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-app-accent/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-secondary mb-1.5">Proje Açıklaması & Amacı</label>
                <textarea
                  rows={3}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Projenin hedefleri ve detayları..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-medium focus:outline-none focus:ring-2 focus:ring-app-accent/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-app-secondary mb-1.5">Kategori</label>
                  <select
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="İş">💼 İş</option>
                    <option value="Kişisel">👤 Kişisel</option>
                    <option value="Yazılım">💻 Yazılım</option>
                    <option value="Tasarım">🎨 Tasarım</option>
                    <option value="Eğitim">📚 Eğitim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-app-secondary mb-1.5">Proje Rengi</label>
                  <div className="flex items-center gap-2 pt-1">
                    {PROJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setProjectColor(c)}
                        className={`w-6 h-6 rounded-full border transition-transform ${
                          projectColor === c ? 'scale-125 border-app-primary ring-2 ring-app-accent' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-app-accent text-white font-bold text-xs hover:opacity-90 transition-all shadow-xs"
                >
                  {editingProject ? 'Güncelle' : 'Proje Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Popup Modal for Convert to Note ── */}
      {convertNoteModalPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-app pb-3">
              <h3 className="font-extrabold text-base text-app-primary flex items-center gap-2">
                <NotebookPen className="w-5 h-5 text-purple-500" />
                Not Defterine Aktar (Özel Düzenleme)
              </h3>
              <button onClick={() => setConvertNoteModalPlan(null)} className="p-1 rounded-xl text-app-muted hover:text-app-primary">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-app-primary border border-app text-xs space-y-1">
              <span className="text-app-muted font-semibold block text-[10px]">Aktarılacak Plan:</span>
              <strong className="text-app-primary font-bold text-sm">{convertNoteModalPlan.title}</strong>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-app-secondary mb-1">Not Kategorisi</label>
                <select
                  value={customNoteCategory}
                  onChange={(e) => setCustomNoteCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Proje">📁 Proje</option>
                  <option value="Yazılım">💻 Yazılım</option>
                  <option value="Tasarım">🎨 Tasarım</option>
                  <option value="Genel">📌 Genel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-app-secondary mb-1">Plan Aşaması</label>
                <select
                  value={customNotePhase}
                  onChange={(e) => setCustomNotePhase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {PHASES.map((ph) => (
                    <option key={ph} value={ph}>📍 Aşama: {ph}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-app-secondary mb-1">Ek Notlar & Detaylı Açıklamalar</label>
                <textarea
                  rows={4}
                  value={customNoteText}
                  onChange={(e) => setCustomNoteText(e.target.value)}
                  placeholder="Notunuza eklemek istediğiniz fikirler, yazılar veya açıklamalar..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
              <button
                type="button"
                onClick={() => setConvertNoteModalPlan(null)}
                className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs font-bold"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertToNote}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all shadow-xs flex items-center gap-1.5"
              >
                <NotebookPen className="w-4 h-4" /> Not Olarak Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
