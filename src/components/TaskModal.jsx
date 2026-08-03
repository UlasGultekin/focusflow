import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Clock, Tag, Flag, Palette } from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';

const COLOR_OPTIONS = ['#5B8DEF', '#A855F7', '#FB7185', '#10B981', '#F59E0B', '#6366F1'];
const PRIORITY_LABELS = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export default function TaskModal({ isOpen, onClose, taskToEdit = null }) {
  const { addTask, updateTask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('İş');
  const [color, setColor] = useState('#5B8DEF');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setEstimatedMinutes(taskToEdit.estimated_minutes || 60);
      setPriority(taskToEdit.priority || 'medium');
      setCategory(taskToEdit.category || 'İş');
      setColor(taskToEdit.color || '#5B8DEF');
    } else {
      setTitle('');
      setDescription('');
      setEstimatedMinutes(60);
      setPriority('medium');
      setCategory('İş');
      setColor('#5B8DEF');
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      estimated_minutes: parseInt(estimatedMinutes, 10) || 30,
      priority,
      category: category.trim() || 'Genel',
      color,
    };

    if (taskToEdit) {
      await updateTask(taskToEdit.id, taskPayload);
    } else {
      await addTask(taskPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-app-surface border border-app rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-app">
          <h2 className="font-bold text-lg text-app-primary">
            {taskToEdit ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-surface-hover transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1.5">
              Görev Başlığı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Sunum slaytlarını hazırla"
              className="w-full px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-secondary mb-1.5">
              Açıklama / Detaylar
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Görev hakkında ek notlar..."
              className="w-full px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Tahmini Süre (dakika)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="İş, Kişisel, Proje..."
                className="w-full px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" /> Öncelik
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent text-sm"
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-secondary mb-1.5 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> Renk Kodu
              </label>
              <div className="flex items-center gap-2 mt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-app-accent' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-app">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-app text-app-secondary font-medium text-sm hover:bg-app-surface-hover transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-app-accent text-white font-semibold text-sm hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5"
            >
              {taskToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {taskToEdit ? 'Kaydet' : 'Görev Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
