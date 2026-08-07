import React, { useEffect, useState } from 'react';
import {
  Link2,
  ExternalLink,
  Plus,
  Trash2,
  BookOpen,
  Edit3,
  Check,
  X,
  FileJson,
  Copy,
  Upload,
  AlertCircle,
  FilePlus,
  FolderPlus,
  Folder,
  File,
} from 'lucide-react';
import { useLinkStore } from '../stores/useLinkStore';

const SAMPLE_JSON = `[
  {
    "title": "React Dokümantasyonu",
    "url": "https://react.dev",
    "category": "Eğitim"
  },
  {
    "title": "TailwindCSS Renk Paleti",
    "url": "https://tailwindcss.com/docs/customizing-colors",
    "category": "Tasarım"
  },
  {
    "title": "GitHub FocusFlow Reposu",
    "url": "https://github.com",
    "category": "Araçlar"
  }
]`;

export default function LinksView() {
  const {
    links,
    fetchLinks,
    addLink,
    addBatchLinks,
    updateLink,
    deleteLink,
    openExternalLink,
  } = useLinkStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Genel');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Batch JSON states
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copiedSample, setCopiedSample] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  // Unique categories from existing links + defaults
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

  const handleImportBatchJson = async (e) => {
    e.preventDefault();
    setJsonError('');

    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setJsonError('JSON formatı bir dizi (array) `[...]` olmalıdır.');
        return;
      }

      const invalidItem = parsed.find(item => !item || typeof item !== 'object' || !item.title || !item.url);
      if (invalidItem) {
        setJsonError('Her bir eleman en az "title" ve "url" alanlarını içermelidir.');
        return;
      }

      await addBatchLinks(parsed);
      setIsBatchModalOpen(false);
      setJsonInput('');
    } catch (err) {
      setJsonError('Geçersiz JSON formatı! Lütfen parantez ve tırnak işaretlerini kontrol edin.');
    }
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_JSON);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
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
              Önemli not almanız gereken ve hızlıca ulaşmak istediğiniz bağlantılar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setJsonInput(SAMPLE_JSON);
              setIsBatchModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-app bg-app-surface text-app-primary font-semibold text-xs hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FileJson className="w-4 h-4 text-indigo-500" /> JSON Toplu Ekle
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Yeni Link Ekle
          </button>
        </div>
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
              Hızlıca not almak veya el altında tutmak istediğiniz linkleri tek tek veya JSON ile topluca ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => {
            const isLocal = link.url && !link.url.startsWith('http://') && !link.url.startsWith('https://') && !link.url.includes('://');
            return (
              <div
                key={link.id}
                className="bg-app-surface border border-app hover:border-app-accent/50 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative group transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {link.category || 'Genel'}
                    </span>
                    {isLocal && (
                      <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        📁 Yerel Dosya / Klasör
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-app-primary truncate">
                    {link.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-app-secondary font-medium pt-1 font-mono">
                    {isLocal ? (
                      <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5 text-app-accent shrink-0" />
                    )}
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
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    {isLocal ? 'Klasör / Dosya Aç' : 'Tarayıcıda Aç'}
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
            );
          })
        )}
      </div>

      {/* JSON Batch Add Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-lg p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-app pb-3">
              <h3 className="font-bold text-base text-app-primary flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-500" /> JSON Formatında Toplu Link Ekle
              </h3>
              <button
                onClick={handleCopySample}
                className="px-2.5 py-1 rounded-lg border border-app bg-app-primary text-app-secondary hover:text-app-primary text-xs flex items-center gap-1 transition-all"
              >
                {copiedSample ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedSample ? 'Şablon Kopyalandı' : 'Örnek Şablonı Kopyala'}
              </button>
            </div>

            <p className="text-xs text-app-secondary leading-relaxed">
              Aşağıdaki kutuya birden fazla link içeren JSON verinizi yapıştırarak tek tıkla ekleyebilirsiniz.
            </p>

            <form onSubmit={handleImportBatchJson} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  JSON Verisi *
                </label>
                <textarea
                  rows={8}
                  required
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError('');
                  }}
                  placeholder="[{ &quot;title&quot;: &quot;...&quot;, &quot;url&quot;: &quot;...&quot;, &quot;category&quot;: &quot;...&quot; }]"
                  className="w-full p-3 rounded-xl border border-app bg-app-primary text-app-primary font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {jsonError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app text-app-secondary text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-4 h-4" /> Toplu Linkleri İçe Aktar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Add/Edit Link Modal */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-app-secondary">
                    Bağlantı (URL veya Dosya / Klasör Yolu) *
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.electronAPI?.selectFile) {
                          const res = await window.electronAPI.selectFile();
                          if (res?.path) {
                            setUrl(res.path);
                            if (!title.trim()) setTitle(res.name);
                          }
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-app-primary hover:bg-app-surface border border-app text-[10px] font-bold text-indigo-500 flex items-center gap-1"
                      title="Bilgisayardan Dosya Seç"
                    >
                      <FilePlus className="w-3 h-3 text-indigo-500" /> Dosya Seç
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.electronAPI?.selectFolder) {
                          const res = await window.electronAPI.selectFolder();
                          if (res?.path) {
                            setUrl(res.path);
                            if (!title.trim()) setTitle(res.name);
                          }
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-app-primary hover:bg-app-surface border border-app text-[10px] font-bold text-amber-500 flex items-center gap-1"
                      title="Bilgisayardan Klasör Seç"
                    >
                      <FolderPlus className="w-3 h-3 text-amber-500" /> Klasör Seç
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://... veya C:\Klasor\Dosya.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent font-mono"
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
