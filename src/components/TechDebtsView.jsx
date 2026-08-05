import React, { useEffect, useState, useCallback } from 'react';
import { useTechDebtStore } from '../stores/useTechDebtStore';
import { Wrench, Plus, Trash2, ArrowRight, CheckCircle2, Clock, X, Folder, File, Image as ImageIcon, Paperclip } from 'lucide-react';

function parseJsonField(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[88vh] rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
        alt="Önizleme"
      />
    </div>
  );
}

function ImageStrip({ images, onRemove, onOpen }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap mt-3">
      {images.map((src, i) => (
        <div key={i} className="relative group inline-block">
          <img
            src={src}
            alt={`görsel-${i + 1}`}
            onClick={() => onOpen && onOpen(src)}
            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl cursor-pointer border border-app shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md"
          />
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(i); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TechDebtsView() {
  const { techDebts, fetchTechDebts, addTechDebt, deleteTechDebt, updateTechDebt, convertToTask } = useTechDebtStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTechDebt, setEditingTechDebt] = useState(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('refactor');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [plannedDate, setPlannedDate] = useState('');
  const [images, setImages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Task Conversion Modal State
  const [conversionModal, setConversionModal] = useState({
    isOpen: false,
    item: null,
    taskType: 'task', // 'inspection' | 'meeting' | 'task'
    plannedDate: '',
    plannedTime: '10:00',
    removeFromList: false, // Default: false (opsiyonel)
  });

  const openConversionModal = (item, taskType) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setConversionModal({
      isOpen: true,
      item,
      taskType,
      plannedDate: item.planned_date || todayStr,
      plannedTime: '10:00',
      removeFromList: false,
    });
  };

  const handleConfirmConversion = async (e) => {
    e.preventDefault();
    if (!conversionModal.item) return;

    await convertToTask(conversionModal.item, conversionModal.taskType, {
      plannedDate: conversionModal.plannedDate || null,
      plannedTime: conversionModal.plannedTime || '10:00',
      removeFromList: conversionModal.removeFromList,
    });

    setConversionModal((prev) => ({ ...prev, isOpen: false, item: null }));
  };

  const [project, setProject] = useState('Genel');
  const [projectFilter, setProjectFilter] = useState('all');
  
  // Custom projects
  const [availableProjects, setAvailableProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('focusflow_projects');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Genel', 'Frontend', 'Backend', 'Mobil', 'Diğer'];
  });
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleAddNewProject = () => {
    if (newProjectName.trim() && !availableProjects.includes(newProjectName.trim())) {
      const updated = [...availableProjects, newProjectName.trim()];
      setAvailableProjects(updated);
      localStorage.setItem('focusflow_projects', JSON.stringify(updated));
      setProject(newProjectName.trim());
    }
    setNewProjectName('');
    setShowNewProjectInput(false);
  };

  useEffect(() => {
    fetchTechDebts();
  }, []);

  const readFileAsDataURL = (file) => new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => res(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleImageFiles = useCallback(async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    const dataUrls = await Promise.all(imageFiles.map(readFileAsDataURL));
    setImages(prev => [...prev, ...dataUrls]);
  }, []);

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter(it => it.type.startsWith('image/'));
    if (!imageItems.length) return;
    e.preventDefault();
    const files = imageItems.map(it => it.getAsFile()).filter(Boolean);
    await handleImageFiles(files);
  }, [handleImageFiles]);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    await handleImageFiles(e.dataTransfer.files);
  }, [handleImageFiles]);

  const handleAddAttachment = async (type) => {
    if (!window.electronAPI) return;
    const res = type === 'file' ? await window.electronAPI.selectFile() : await window.electronAPI.selectFolder();
    if (res) {
      setAttachments(prev => [...prev, res]);
    }
  };

  const handleSaveTechDebt = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title,
      description,
      category,
      estimated_minutes: estimatedMinutes,
      planned_date: plannedDate || null,
      images_json: JSON.stringify(images),
      attachments_json: JSON.stringify(attachments),
      project
    };

    if (editingTechDebt) {
      await updateTechDebt(editingTechDebt.id, data);
    } else {
      await addTechDebt(data);
    }

    setIsModalOpen(false);
    setEditingTechDebt(null);
    setTitle('');
    setDescription('');
    setCategory('refactor');
    setEstimatedMinutes(60);
    setPlannedDate('');
    setImages([]);
    setAttachments([]);
    setProject('Genel');
  };

  const openEditModal = (td) => {
    setEditingTechDebt(td);
    setTitle(td.title || '');
    setDescription(td.description || '');
    setCategory(td.category || 'refactor');
    setEstimatedMinutes(td.estimated_minutes || 60);
    setPlannedDate(td.planned_date || '');
    setImages(parseJsonField(td.images_json));
    setAttachments(parseJsonField(td.attachments_json));
    setProject(td.project || 'Genel');
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTechDebt(null);
    setTitle('');
    setDescription('');
    setCategory('refactor');
    setEstimatedMinutes(60);
    setPlannedDate('');
    setImages([]);
    setAttachments([]);
    setProject('Genel');
    setIsModalOpen(true);
  };

  const filteredTechDebts = projectFilter === 'all' 
    ? techDebts 
    : techDebts.filter(td => (td.project || 'Genel') === projectFilter);

  return (
    <div className="h-full flex flex-col bg-app-bg text-app-primary overflow-hidden">
      <header className="px-6 py-4 border-b border-app flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Teknik Borçlar</h1>
            <p className="text-xs text-app-secondary">Yeniden yazım ve iyileştirme bekleyen işler</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer min-w-[140px]"
          >
            <option value="all">🗂 Tüm Projeler</option>
            {availableProjects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button
            onClick={openAddModal}
            className="bg-app-primary text-app-primary border border-app hover:border-app-accent px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Teknik Borç Ekle
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredTechDebts.length === 0 ? (
          <div className="text-center p-10 text-app-secondary">Henüz bir teknik borç eklenmedi.</div>
        ) : (
          filteredTechDebts.map((td) => {
            const parsedImages = parseJsonField(td.images_json);
            const parsedAttachments = parseJsonField(td.attachments_json);
            return (
              <div key={td.id} className={`p-4 rounded-xl border bg-app-surface transition-all ${td.task_id ? 'opacity-60 border-app border-dashed' : 'border-app hover:border-amber-500/50'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-500">
                        {td.category.toUpperCase()}
                      </span>
                      {td.task_id && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Göreve Dönüştürüldü
                        </span>
                      )}
                      {td.planned_date && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-500/10 text-sky-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Takvime Planlandı: {td.planned_date}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-app-bg text-app-secondary">
                        {td.estimated_minutes} dk
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-app-bg border border-app text-app-secondary">
                        {td.project || 'Genel'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold">{td.title}</h3>
                    {td.description && <p className="text-sm text-app-secondary mt-1">{td.description}</p>}
                    
                    {/* Tech Debt Images */}
                    <ImageStrip images={parsedImages} onOpen={setLightboxSrc} />

                    {/* Tech Debt Attachments */}
                    {parsedAttachments.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        {parsedAttachments.map((att, i) => (
                          <div 
                            key={i} 
                            onClick={() => window.electronAPI?.openPath(att.path)}
                            className="flex items-center gap-2 p-2 rounded-xl bg-app-primary border border-app hover:border-app-accent/40 cursor-pointer transition-colors w-max pr-6 group/att"
                          >
                            {att.type === 'folder' ? <Folder size={14} className="text-amber-500" /> : <File size={14} className="text-blue-500" />}
                            <span className="text-xs font-medium text-app-primary truncate group-hover/att:text-app-accent transition-colors">
                              {att.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-1 bg-app-bg p-1 rounded-xl border border-app">
                      <button
                        onClick={() => openConversionModal(td, 'inspection')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-1"
                        title="İnceleme & Araştırma Görevi Planla"
                      >
                        🔍 İnceleme Taskı
                      </button>
                      <button
                        onClick={() => openConversionModal(td, 'meeting')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-all flex items-center gap-1"
                        title="Toplantı & Görüşme Etkinliği Planla"
                      >
                        📅 Meet Taskı
                      </button>
                      <button
                        onClick={() => openConversionModal(td, 'task')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-all flex items-center gap-1 shadow-xs"
                        title="Tam İyileştirme Görevi Planla"
                      >
                        <ArrowRight className="w-3 h-3" /> Görev Oluştur
                      </button>
                    </div>

                    <button onClick={() => openEditModal(td)} className="p-1.5 text-app-muted hover:text-indigo-500 transition-colors" title="Düzenle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-3"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button onClick={() => deleteTechDebt(td.id)} className="p-1.5 text-app-muted hover:text-amber-500 transition-colors" title="Sil (Onayınızla silinir)">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-surface w-full max-w-lg rounded-2xl border border-app shadow-2xl p-6" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
            <h2 className="text-lg font-bold mb-4">{editingTechDebt ? 'Teknik Borç Düzenle' : 'Yeni Teknik Borç Ekle'}</h2>
            <form onSubmit={handleSaveTechDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">Başlık</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-app-bg border border-app rounded-xl px-3 py-2 text-sm outline-hidden focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">Açıklama (Resim kopyala-yapıştır yapabilirsiniz)</label>
                <textarea onPaste={handlePaste} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-app-bg border border-app rounded-xl px-3 py-2 text-sm outline-hidden focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Proje</label>
                  <div className="flex items-center gap-2">
                    {showNewProjectInput ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); handleAddNewProject(); } if(e.key==='Escape') setShowNewProjectInput(false); }} placeholder="Yeni proje adı" className="flex-1 bg-app-bg border border-app rounded-xl px-3 py-2 text-sm outline-hidden focus:border-amber-500" />
                        <button type="button" onClick={handleAddNewProject} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20"><CheckCircle2 size={16} /></button>
                        <button type="button" onClick={() => setShowNewProjectInput(false)} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><X size={16} /></button>
                      </div>
                    ) : (
                      <select value={project} onChange={(e) => { if (e.target.value === 'add_new') setShowNewProjectInput(true); else setProject(e.target.value); }} className="flex-1 bg-app-bg border border-app rounded-xl px-3 py-2 text-sm outline-hidden focus:border-amber-500">
                        {availableProjects.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="add_new">+ Yeni Proje Ekle</option>
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-app-bg border border-app rounded-xl px-3 py-2 text-sm outline-hidden focus:border-amber-500">
                    <option value="refactor">Refactor</option>
                    <option value="performance">Performance</option>
                    <option value="security">Security</option>
                    <option value="cleanup">Cleanup</option>
                    <option value="documentation">Documentation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Tahmini Süre (dk)</label>
                  <input type="number" required value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} className="w-full bg-app-bg border border-app rounded-xl px-3 py-2 text-sm outline-hidden focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-app-secondary mb-1">Takvime Planla (Opsiyonel)</label>
                  <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="w-full bg-app-bg border border-app rounded-xl px-3 py-2 text-sm outline-hidden focus:border-amber-500" />
                </div>
              </div>

              {/* Attachments / Images Preview inside Modal */}
              {images.length > 0 && (
                <div className="p-3 rounded-2xl bg-app-bg border border-app">
                  <span className="text-[11px] font-semibold text-app-muted uppercase">Görseller</span>
                  <ImageStrip images={images} onRemove={i => setImages(prev => prev.filter((_, idx) => idx !== i))} onOpen={setLightboxSrc} />
                </div>
              )}
              {attachments.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-app-bg border border-app">
                      {att.type === 'folder' ? <Folder size={14} className="text-amber-500" /> : <File size={14} className="text-blue-500" />}
                      <span className="text-xs font-medium text-app-primary truncate flex-1">{att.name}</span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-app-muted hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => document.getElementById('td-file-input').click()} className="p-2 rounded-xl border border-app bg-app-bg text-app-secondary hover:text-app-primary hover:border-app-accent flex items-center gap-1.5 transition-all text-xs font-medium" title="Resim Seç">
                    <ImageIcon size={14} /> Resim Seç
                    <input id="td-file-input" type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageFiles(e.target.files)} />
                  </button>
                  <button type="button" onClick={() => handleAddAttachment('file')} className="p-2 rounded-xl border border-app bg-app-bg text-app-secondary hover:text-app-primary hover:border-app-accent flex items-center transition-all text-xs font-medium" title="Dosya Ekle">
                    <Paperclip size={14} />
                  </button>
                  <button type="button" onClick={() => handleAddAttachment('folder')} className="p-2 rounded-xl border border-app bg-app-bg text-app-secondary hover:text-app-primary hover:border-app-accent flex items-center transition-all text-xs font-medium" title="Klasör Ekle">
                    <Folder size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-app-secondary hover:text-app-primary">İptal</button>
                  <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl">Kaydet</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Görev / İnceleme / Meet Takvim Planlama Modalı */}
      {conversionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="font-extrabold text-base text-app-primary flex items-center gap-2 border-b border-app pb-3">
              {conversionModal.taskType === 'inspection' && '🔍 İnceleme Taskı Oluştur & Planla'}
              {conversionModal.taskType === 'meeting' && '📅 Meet / Toplantı Taskı Oluştur & Planla'}
              {conversionModal.taskType === 'task' && '➡️ Görev Oluştur & Takvime Planla'}
            </h3>

            <p className="text-xs text-app-secondary">
              <strong className="text-app-primary">"{conversionModal.item?.title}"</strong> için planlama detaylarını belirleyin:
            </p>

            <form onSubmit={handleConfirmConversion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-app-secondary mb-1">Takvim Tarihi (Opsiyonel)</label>
                  <input
                    type="date"
                    value={conversionModal.plannedDate}
                    onChange={(e) => setConversionModal((prev) => ({ ...prev, plannedDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-app-secondary mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={conversionModal.plannedTime}
                    onChange={(e) => setConversionModal((prev) => ({ ...prev, plannedTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Opsiyonel Listeden Çıkartma Onayı (Default: unchecked) */}
              <div className="p-3 bg-app-primary rounded-2xl border border-app space-y-1">
                <label className="flex items-center gap-2.5 text-xs font-bold text-app-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conversionModal.removeFromList}
                    onChange={(e) => setConversionModal((prev) => ({ ...prev, removeFromList: e.target.checked }))}
                    className="w-4 h-4 rounded text-app-accent focus:ring-app-accent cursor-pointer"
                  />
                  <span>Teknik Borçlar listesinden çıkartılsın mı?</span>
                </label>
                <p className="text-[10px] text-app-muted pl-6 font-medium">
                  İşaretlerseniz göreve aktarıldıktan sonra bu borç listesinden silinir. İşaretlemezseniz listede kalmaya devam eder.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setConversionModal((prev) => ({ ...prev, isOpen: false, item: null }))}
                  className="px-4 py-2.5 rounded-2xl border border-app text-app-secondary font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 shadow-md transition-all"
                >
                  Göreve Aktar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
