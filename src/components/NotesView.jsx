import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  NotebookPen, Plus, Trash2, Edit3, Calendar, Search,
  Filter, Image as ImageIcon, X, ZoomIn, Clipboard, StickyNote, Sparkles, Check, Paperclip, Folder, File, CalendarClock
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const DEFAULT_CATEGORIES = {
  'Genel':     { bg: 'bg-slate-500/10',   text: 'text-slate-500',   border: 'border-slate-500/20' },
  'İş':        { bg: 'bg-blue-500/10',    text: 'text-blue-500',    border: 'border-blue-500/20' },
  'Kişisel':   { bg: 'bg-purple-500/10',  text: 'text-purple-500',  border: 'border-purple-500/20' },
  'Fikir':     { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20' },
  'Önemli':    { bg: 'bg-rose-500/10',    text: 'text-rose-500',    border: 'border-rose-500/20' },
  'Alışveriş': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
};

function getCat(cat) {
  // If not in default, give it a default styling
  return DEFAULT_CATEGORIES[cat] || { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' };
}

function loadCustomCategories() {
  try {
    const saved = localStorage.getItem('focusflow_note_categories');
    if (saved) return JSON.parse(saved);
  } catch (err) {}
  return Object.keys(DEFAULT_CATEGORIES);
}

function saveCustomCategories(cats) {
  try {
    localStorage.setItem('focusflow_note_categories', JSON.stringify(cats));
  } catch (err) {}
}

function parseJsonField(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseImages(imagesJson) {
  return parseJsonField(imagesJson);
}

function parseAttachments(attachmentsJson) {
  return parseJsonField(attachmentsJson);
}

/* ─── Lightbox ──────────────────────────────────────────────────────── */
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

/* ─── Image strip inside note ───────────────────────────────────────── */
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
              <X size={12} />
            </button>
          )}
          <div
            onClick={() => onOpen && onOpen(src)}
            className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors"
          >
            <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Note Card ──────────────────────────────────────────────────────── */
function NoteCard({ note, onEdit, onDelete, onOpenImage, onPlan }) {
  const catStyle = getCat(note.category || 'Genel');
  const images = parseImages(note.images_json);
  const attachments = parseAttachments(note.attachments_json);

  const dateStr = note.created_at
    ? format(new Date(note.created_at), 'd MMM yyyy, HH:mm', { locale: tr })
    : '';

  const plannedStr = note.planned_date
    ? `${note.planned_date}${note.planned_start_time ? ' ' + note.planned_start_time : ''}`
    : null;

  // First line as pseudo-title
  const lines = (note.content || '').split('\n');
  const title = lines[0] || '';
  const body = lines.slice(1).join('\n');

  return (
    <div className="bg-app-surface border border-app hover:border-app-accent/40 hover:shadow-lg hover:-translate-y-0.5 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 group">
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Header: Category badge & image count */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
            {note.category || 'Genel'}
          </span>
          {images.length > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-app-muted bg-app-primary px-2 py-1 rounded-md border border-app">
              <ImageIcon size={12} /> {images.length}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 mt-1">
          {title && (
            <h4 className="text-[14px] font-semibold text-app-primary mb-1.5 leading-snug">
              {title}
            </h4>
          )}
          {body && (
            <p className="text-[13px] text-app-secondary whitespace-pre-wrap leading-relaxed line-clamp-5">
              {body}
            </p>
          )}
        </div>

        {/* Images */}
        <ImageStrip images={images} onOpen={onOpenImage} />

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {attachments.map((att, i) => (
              <div 
                key={i} 
                onClick={() => window.electronAPI?.openPath(att.path)}
                className="flex items-center gap-2 p-2 rounded-xl bg-app-primary border border-app hover:border-app-accent/40 cursor-pointer transition-colors group/att"
              >
                {att.type === 'folder' ? <Folder size={14} className="text-amber-500" /> : <File size={14} className="text-blue-500" />}
                <span className="text-xs font-medium text-app-primary truncate flex-1 group-hover/att:text-app-accent transition-colors">
                  {att.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Planned Date */}
        {plannedStr && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md self-start">
            <CalendarClock size={12} /> {plannedStr}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-app">
          <span className="text-[11px] text-app-muted flex items-center gap-1.5 font-medium">
            <Calendar size={12} className="text-app-accent opacity-70" />
            {dateStr}
          </span>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(note)}
              className="p-1.5 rounded-lg border border-transparent hover:border-app hover:bg-app-primary text-app-secondary hover:text-app-primary transition-all flex items-center"
              title="Düzenle"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 rounded-lg border border-transparent hover:border-red-500/20 hover:bg-red-500/10 text-app-secondary hover:text-red-500 transition-all flex items-center"
              title="Sil"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function NotesView() {
  const { allNotes, fetchAllNotes, addNote, updateNote, deleteNote } = useTaskStore();

  // New note state
  const [content, setContent] = useState('');
  const [newCategory, setNewCategory] = useState('Genel');
  const [newImages, setNewImages] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [newPlannedDate, setNewPlannedDate] = useState('');
  const [newPlannedTime, setNewPlannedTime] = useState('');
  const newTextareaRef = useRef(null);

  // Categories
  const [availableCategories, setAvailableCategories] = useState(loadCustomCategories());
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const handleAddNewCategory = () => {
    if (newCatName.trim() && !availableCategories.includes(newCatName.trim())) {
      const updated = [...availableCategories, newCatName.trim()];
      setAvailableCategories(updated);
      saveCustomCategories(updated);
      setNewCategory(newCatName.trim());
      setEditCategory(newCatName.trim());
    }
    setNewCatName('');
    setShowNewCatInput(false);
  };

  // Edit state
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('Genel');
  const [editImages, setEditImages] = useState([]);
  const [editAttachments, setEditAttachments] = useState([]);
  const [editPlannedDate, setEditPlannedDate] = useState('');
  const [editPlannedTime, setEditPlannedTime] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Lightbox
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => { fetchAllNotes(); }, []);

  /* ── Image helpers ── */
  const readFileAsDataURL = (file) => new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => res(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleImageFiles = useCallback(async (files, target = 'new') => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    const dataUrls = await Promise.all(imageFiles.map(readFileAsDataURL));
    if (target === 'new') {
      setNewImages(prev => [...prev, ...dataUrls]);
    } else {
      setEditImages(prev => [...prev, ...dataUrls]);
    }
  }, []);

  /* ── Paste handlers ── */
  const handleNewPaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter(it => it.type.startsWith('image/'));
    if (!imageItems.length) return;
    e.preventDefault();
    const files = imageItems.map(it => it.getAsFile()).filter(Boolean);
    await handleImageFiles(files, 'new');
  }, [handleImageFiles]);

  const handleEditPaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter(it => it.type.startsWith('image/'));
    if (!imageItems.length) return;
    e.preventDefault();
    const files = imageItems.map(it => it.getAsFile()).filter(Boolean);
    await handleImageFiles(files, 'edit');
  }, [handleImageFiles]);

  /* ── Drop zone ── */
  const handleDrop = useCallback(async (e, target = 'new') => {
    e.preventDefault();
    setIsDragOver(false);
    await handleImageFiles(e.dataTransfer.files, target);
  }, [handleImageFiles]);

  /* ── Add Attachments ── */
  const handleAddAttachment = async (type, target = 'new') => {
    if (!window.electronAPI) return;
    const res = type === 'file' ? await window.electronAPI.selectFile() : await window.electronAPI.selectFolder();
    if (res) {
      if (target === 'new') setNewAttachments(prev => [...prev, res]);
      else setEditAttachments(prev => [...prev, res]);
    }
  };

  /* ── Create note ── */
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!content.trim() && newImages.length === 0 && newAttachments.length === 0) return;
    await addNote(content.trim(), null, newCategory || 'Genel', newImages, newAttachments, newPlannedDate || null, newPlannedTime || null);
    setContent('');
    setNewCategory('Genel');
    setNewImages([]);
    setNewAttachments([]);
    setNewPlannedDate('');
    setNewPlannedTime('');
  };

  /* ── Update note ── */
  const handleUpdateNote = async () => {
    if (!editContent.trim() && editImages.length === 0 && editAttachments.length === 0) return;
    await updateNote(editingNote.id, editContent.trim(), null, editCategory || 'Genel', editImages, editAttachments, editPlannedDate || null, editPlannedTime || null);
    setEditingNote(null);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setEditContent(note.content || '');
    setEditCategory(note.category || 'Genel');
    setEditImages(parseImages(note.images_json));
    setEditAttachments(parseAttachments(note.attachments_json));
    setEditPlannedDate(note.planned_date || '');
    setEditPlannedTime(note.planned_start_time || '');
  };

  /* ── Filter ── */
  const existingCategories = ['all', ...new Set(allNotes.map(n => n?.category || 'Genel').filter(Boolean))];

  const filteredNotes = allNotes.filter(n => {
    if (!n) return false;
    const matchesSearch = (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || (n.category || 'Genel') === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-hidden">
      {/* ── Header ── */}
      <div className="px-8 py-6 border-b border-app bg-app-surface flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-app-accent-light text-app-accent flex items-center justify-center shadow-inner">
            <NotebookPen size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-app-primary tracking-tight">Not Defteri</h2>
            <p className="text-xs text-app-secondary mt-0.5 font-medium">
              {allNotes.length} not — fikirler, notlar, kopyalananlar
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-app bg-app-primary text-app-primary text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* ── Filters bar ── */}
      {existingCategories.length > 1 && (
        <div className="px-8 py-3.5 border-b border-app bg-app-surface/50 flex items-center gap-3 flex-wrap shrink-0">
          <Filter size={14} className="text-app-muted mr-1" />
          <span className="text-xs font-semibold text-app-secondary shrink-0">Kategori Filtresi:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer min-w-[160px]"
          >
            <option value="all">🗂 Tümü ({allNotes.length})</option>
            {existingCategories.filter(c => c !== 'all').map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({allNotes.filter(n => (n?.category || 'Genel') === cat).length})
              </option>
            ))}
          </select>
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="text-xs text-app-muted hover:text-app-accent transition-colors"
            >
              × Temizle
            </button>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
        {/* Create Note Form */}
        <form
          onSubmit={handleCreateNote}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => handleDrop(e, 'new')}
          className={`bg-app-surface border rounded-3xl p-6 shadow-sm transition-all duration-200
            ${isDragOver ? 'border-app-accent bg-app-accent-light/30 ring-4 ring-app-accent/10' : 'border-app hover:shadow-md'}
          `}
        >
          {/* Paste hint */}
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-app-accent-light text-app-accent p-1.5 rounded-lg">
              <Sparkles size={14} />
            </div>
            <span className="text-xs font-medium text-app-secondary">
              Metin yaz, resim yapıştır (<kbd className="px-1.5 py-0.5 bg-app-primary border border-app rounded text-[10px] font-mono shadow-sm">Ctrl+V</kbd>) veya sürükle-bırak
            </span>
          </div>

          <textarea
            ref={newTextareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onPaste={handleNewPaste}
            placeholder="Yeni bir not yaz... (İlk satır başlık olur)"
            rows={3}
            className="w-full p-4 rounded-2xl border border-app bg-app-primary text-app-primary text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/50 resize-y min-h-[100px] mb-4 shadow-inner"
          />

          {/* New images preview */}
          {newImages.length > 0 && (
            <div className="mb-5 p-3 rounded-2xl bg-app-primary border border-app shadow-inner">
              <span className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-2 block">Eklenen Görseller</span>
              <ImageStrip
                images={newImages}
                onRemove={i => setNewImages(prev => prev.filter((_, idx) => idx !== i))}
                onOpen={setLightboxSrc}
              />
            </div>
          )}

            {/* New attachments preview */}
            {newAttachments.length > 0 && (
              <div className="mb-4 flex flex-col gap-1.5">
                {newAttachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-app-primary border border-app">
                    {att.type === 'folder' ? <Folder size={14} className="text-amber-500" /> : <File size={14} className="text-blue-500" />}
                    <span className="text-xs font-medium text-app-primary truncate flex-1">{att.name}</span>
                    <button type="button" onClick={() => setNewAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-app-muted hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              {/* Category selection */}
              <div className="flex gap-2 flex-col relative">
                <span className="text-[11px] font-semibold text-app-muted">KATEGORİ:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      if (e.target.value === 'add_new') {
                        setShowNewCatInput(true);
                      } else {
                        setNewCategory(e.target.value);
                        setShowNewCatInput(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer min-w-[120px]"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="add_new">+ Yeni Kategori Ekle</option>
                  </select>

                  {showNewCatInput && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                        placeholder="Kategori Adı..."
                        className="px-2 py-1 rounded-lg border border-app-accent bg-app-primary text-app-primary text-xs focus:outline-none"
                      />
                      <button type="button" onClick={handleAddNewCategory} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md">
                        <Check size={14} />
                      </button>
                      <button type="button" onClick={() => setShowNewCatInput(false)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-md">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule / Plan */}
              <div className="flex gap-2 flex-col">
                <span className="text-[11px] font-semibold text-app-muted">TAKVİME PLANLA:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newPlannedDate}
                    onChange={(e) => setNewPlannedDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer"
                  />
                  <input
                    type="time"
                    value={newPlannedTime}
                    onChange={(e) => setNewPlannedTime(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer"
                  />
                  {(newPlannedDate || newPlannedTime) && (
                    <button type="button" onClick={() => { setNewPlannedDate(''); setNewPlannedTime(''); }} className="text-app-muted hover:text-red-500">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1"></div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddAttachment('folder', 'new')}
                  className="p-2.5 rounded-xl border border-app bg-app-primary hover:bg-app-surface-hover text-app-secondary hover:text-amber-500 transition-colors shadow-sm"
                  title="Klasör Ekle"
                >
                  <Folder size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAttachment('file', 'new')}
                  className="p-2.5 rounded-xl border border-app bg-app-primary hover:bg-app-surface-hover text-app-secondary hover:text-blue-500 transition-colors shadow-sm"
                  title="Dosya Ekle"
                >
                  <Paperclip size={16} />
                </button>
                <label className="p-2.5 rounded-xl border border-app bg-app-primary hover:bg-app-surface-hover text-app-secondary hover:text-emerald-500 cursor-pointer transition-colors shadow-sm" title="Görsel Ekle">
                  <ImageIcon size={16} />
                  <input
                    type="file" accept="image/*" multiple hidden
                    onChange={e => handleImageFiles(e.target.files, 'new')}
                  />
                </label>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white text-sm font-bold shadow-md shadow-app-accent/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Plus size={16} /> Notu Kaydet
                </button>
              </div>
            </div>
          </form>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-app-surface border-2 border-dashed border-app flex items-center justify-center mb-6">
              <StickyNote size={40} className="text-app-muted" />
            </div>
            <h3 className="text-lg font-bold text-app-primary mb-2">
              {searchQuery || categoryFilter !== 'all' ? 'Eşleşen not bulunamadı' : 'Henüz not yok'}
            </h3>
            <p className="text-sm text-app-secondary max-w-sm">
              {searchQuery || categoryFilter !== 'all'
                ? 'Arama kriterlerinizi değiştirin veya filtreyi kaldırın.'
                : 'Yukarıdaki formu kullanarak ilk notunuzu ekleyin. Görüntüleri kopyalayıp yapıştırabilirsiniz!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {filteredNotes.map((note, idx) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={openEdit}
                onDelete={(id) => deleteNote(id, null)}
                onOpenImage={setLightboxSrc}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingNote && (
        <div
          onClick={() => setEditingNote(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-app-surface rounded-3xl shadow-2xl border border-app overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 border-b border-app flex items-center justify-between bg-app-primary">
              <h3 className="text-lg font-bold text-app-primary flex items-center gap-2">
                <div className="p-1.5 bg-app-accent-light text-app-accent rounded-lg">
                  <Edit3 size={16} />
                </div>
                Notu Düzenle
              </h3>
              <button onClick={() => setEditingNote(null)} className="p-2 rounded-full hover:bg-app-surface text-app-muted hover:text-app-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <div className="bg-app-accent-light text-app-accent p-1 rounded-md">
                  <Clipboard size={12} />
                </div>
                <span className="text-xs font-medium text-app-secondary">
                  <kbd className="px-1.5 py-0.5 bg-app-primary border border-app rounded text-[10px] font-mono shadow-sm">Ctrl+V</kbd> ile resim yapıştırabilirsiniz
                </span>
              </div>

              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onPaste={handleEditPaste}
                rows={6}
                className="w-full p-4 rounded-2xl border border-app bg-app-primary text-app-primary text-sm focus:outline-none focus:ring-2 focus:ring-app-accent/50 resize-y min-h-[120px] shadow-inner"
              />

              {/* Edit images preview */}
              {editImages.length > 0 && (
                <div className="p-3 rounded-2xl bg-app-primary border border-app shadow-inner">
                  <span className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-2 block">Görseller</span>
                  <ImageStrip
                    images={editImages}
                    onRemove={i => setEditImages(prev => prev.filter((_, idx) => idx !== i))}
                    onOpen={setLightboxSrc}
                  />
                </div>
              )}

              {/* Edit attachments preview */}
              {editAttachments.length > 0 && (
                <div className="p-3 rounded-2xl bg-app-primary border border-app shadow-inner">
                  <span className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-2 block">Ekler</span>
                  <div className="flex flex-col gap-1.5">
                    {editAttachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-app-surface border border-app">
                        {att.type === 'folder' ? <Folder size={14} className="text-amber-500" /> : <File size={14} className="text-blue-500" />}
                        <span className="text-xs font-medium text-app-primary truncate flex-1">{att.name}</span>
                        <button type="button" onClick={() => setEditAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-app-muted hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                {/* Category picks for Edit Modal */}
                <div>
                  <span className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-2 block">Kategori Seçimi</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={editCategory}
                      onChange={(e) => {
                        if (e.target.value === 'add_new') {
                          setShowNewCatInput(true);
                        } else {
                          setEditCategory(e.target.value);
                          setShowNewCatInput(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer min-w-[150px]"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      {!availableCategories.includes(editCategory) && (
                        <option value={editCategory}>{editCategory}</option>
                      )}
                      <option value="add_new">+ Yeni Kategori Ekle</option>
                    </select>

                    {showNewCatInput && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                          placeholder="Kategori Adı..."
                          className="px-2 py-1 rounded-lg border border-app-accent bg-app-primary text-app-primary text-xs focus:outline-none"
                        />
                        <button type="button" onClick={handleAddNewCategory} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md">
                          <Check size={14} />
                        </button>
                        <button type="button" onClick={() => setShowNewCatInput(false)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-md">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Schedule / Plan */}
                <div>
                  <span className="text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-2 block">Takvime Planla</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editPlannedDate}
                      onChange={(e) => setEditPlannedDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer"
                    />
                    <input
                      type="time"
                      value={editPlannedTime}
                      onChange={(e) => setEditPlannedTime(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer"
                    />
                    {(editPlannedDate || editPlannedTime) && (
                      <button type="button" onClick={() => { setEditPlannedDate(''); setEditPlannedTime(''); }} className="text-app-muted hover:text-red-500">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-app bg-app-surface flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddAttachment('folder', 'edit')}
                  className="p-2.5 rounded-xl border border-app bg-app-primary hover:bg-app-surface-hover text-app-secondary hover:text-amber-500 transition-colors shadow-sm"
                  title="Klasör Ekle"
                >
                  <Folder size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAttachment('file', 'edit')}
                  className="p-2.5 rounded-xl border border-app bg-app-primary hover:bg-app-surface-hover text-app-secondary hover:text-blue-500 transition-colors shadow-sm"
                  title="Dosya Ekle"
                >
                  <Paperclip size={16} />
                </button>
                <label className="p-2.5 rounded-xl border border-app bg-app-primary hover:bg-app-surface-hover text-app-secondary hover:text-emerald-500 cursor-pointer transition-colors shadow-sm" title="Görsel Ekle">
                  <ImageIcon size={16} />
                  <input
                    type="file" accept="image/*" multiple hidden
                    onChange={e => handleImageFiles(e.target.files, 'edit')}
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingNote(null)}
                  className="px-5 py-2.5 rounded-xl border border-app hover:bg-app-primary text-app-secondary font-semibold text-sm transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateNote}
                  className="px-5 py-2.5 rounded-xl bg-app-accent hover:bg-app-accent-hover text-white font-bold text-sm shadow-md shadow-app-accent/30 transition-all flex items-center gap-2"
                >
                  <Check size={16} />
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
