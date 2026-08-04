import React, { useEffect, useState } from 'react';
import {
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  BookOpen,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { useLinkStore } from '../stores/useLinkStore';

export default function LinksView() {
  const {
    links,
    fetchLinks,
    addLink,
    updateLink,
    deleteLink,
    openExternalLink,
  } = useLinkStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Genel');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  // Unique categories from existing links + some defaults
  const categories = ['all', 'Genel', 'Eğitim', 'Araçlar', ...new Set(links.map((c) => c.category).filter(Boolean))];
  const uniqueCategories = [...new Set(categories.filter(c => c !== 'all'))];

  const handleAddNewCategory = () => {
    if (newCatName.trim()) {
      setCategory(newCatName.trim());
    }
    setNewCatName('');
    setShowNewCatInput(false);
  };

  // Filtered links
  const filteredLinks = categoryFilter === 'all'
    ? links
    : links.filter((c) => c.category === categoryFilter);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    if (editingLink) {
      await updateLink(editingLink.id, {
        title: title.trim(),
        url: url.trim(),
        category: category.trim() || 'Genel',
      });
    } else {
      await addLink({
        title: title.trim(),
        url: url.trim(),
        category: category.trim() || 'Genel',
      });
    }

    closeModal();
  };

  const openEditModal = (link) => {
    setEditingLink(link);
    setTitle(link.title || '');
    setUrl(link.url || '');
    setCategory(link.category || 'Genel');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setTitle('');
    setUrl('');
    setCategory('Genel');
    setShowNewCatInput(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Linkler</h2>
            <p className="text-xs text-app-secondary">
              Önemli not almanız gereken ve hızlıca ulaşmak istediğiniz linkler.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Yeni Link Ekle
        </button>
      </div>

      {/* Category Filter Dropdown */}
      {categories.length > 1 && (
        <div className="px-6 py-3 border-b border-app bg-app-primary flex items-center gap-3">
          <span className="text-xs font-semibold text-app-secondary shrink-0">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-app bg-app-surface text-app-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer min-w-[160px]"
          >
            <option value="all">🗂 Tümü ({links.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({links.filter((c) => c.category === cat).length})
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

      {/* Links Grid */}
      <div className="p-6 space-y-4 max-w-5xl">
        {filteredLinks.length === 0 ? (
          <div className="bg-app-surface border border-app rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-indigo-500 mx-auto animate-pulse" />
            <h3 className="font-bold text-base text-app-primary">Henüz Link Eklenmedi</h3>
            <p className="text-xs text-app-secondary">
              Hızlıca not almak veya el altında tutmak istediğiniz linkleri buraya kaydedebilirsiniz.
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => (
            <div
              key={link.id}
              className="bg-app-surface border border-app hover:border-app-accent/50 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative group transition-all"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    {link.category || 'Genel'}
                  </span>
                </div>

                <h3 className="font-bold text-base text-app-primary truncate">
                  {link.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-app-secondary font-medium pt-1">
                  <Link2 className="w-3.5 h-3.5 text-app-accent" />
                  <span className="truncate">{link.url}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-app">
                <button
                  onClick={() => openExternalLink(link.url)}
                  className="px-3.5 py-2 rounded-xl border border-app bg-app-primary text-app-primary font-semibold text-xs hover:border-app-accent hover:text-app-accent transition-all flex items-center gap-1.5 shrink-0"
                  title={link.url}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" /> Tarayıcıda Aç
                </button>

                <button
                  onClick={() => openEditModal(link)}
                  className="p-2 text-app-muted hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Düzenle"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteLink(link.id)}
                  className="p-2 text-app-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Linki Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-app-primary">
              {editingLink ? 'Linki Düzenle' : 'Yeni Link Ekle'}
            </h3>

            <form onSubmit={handleCreateLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Link Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: React Dokümantasyonu"
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Bağlantı (URL) *
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Örn: https://react.dev/"
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Kategori
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === 'add_new') {
                        setShowNewCatInput(true);
                      } else {
                        setCategory(e.target.value);
                        setShowNewCatInput(false);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent cursor-pointer"
                  >
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {!uniqueCategories.includes(category) && category && (
                      <option value={category}>{category}</option>
                    )}
                    <option value="add_new">+ Yeni Kategori Ekle</option>
                  </select>

                  {showNewCatInput && (
                    <div className="absolute right-0 top-6 flex items-center gap-2 bg-app-primary p-1 rounded-lg border border-app-accent z-10 shadow-lg">
                      <input
                        type="text"
                        autoFocus
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                        placeholder="Kategori Adı..."
                        className="px-2 py-1 bg-transparent text-app-primary text-xs focus:outline-none min-w-[120px]"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs"
                >
                  {editingLink ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
