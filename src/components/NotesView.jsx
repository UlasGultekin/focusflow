import React, { useState, useEffect } from 'react';
import { NotebookPen, Plus, Trash2, Edit3, Calendar, Search } from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function NotesView() {
  const { allNotes, fetchAllNotes, addNote, updateNote, deleteNote } = useTaskStore();
  const [content, setContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllNotes();
  }, []);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addNote(content.trim(), null);
    setContent('');
  };

  const handleUpdateNote = async (id) => {
    if (!editContent.trim()) return;
    await updateNote(id, editContent.trim(), null);
    setEditingNoteId(null);
  };

  const filteredNotes = allNotes.filter((n) =>
    (n?.content || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-screen bg-app-primary overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-app bg-app-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
            <NotebookPen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-primary">Genel Not Defteri</h2>
            <p className="text-xs text-app-secondary">Görevlerden bağımsız serbest notlarınız</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-app-muted" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notlarda ara..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Create Note Input Form */}
        <form onSubmit={handleCreateNote} className="space-y-3 bg-app-surface p-4 rounded-2xl border border-app shadow-xs">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Yeni bir not yazın..."
            className="w-full p-3 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent resize-none h-24"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Not Ekle
            </button>
          </div>
        </form>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.length === 0 ? (
            <p className="text-xs text-app-muted col-span-2 text-center py-8">Not bulunamadı.</p>
          ) : (
            filteredNotes.map((note) => {
              const isEditing = editingNoteId === note.id;
              const dateStr = note.created_at
                ? format(new Date(note.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })
                : '';

              return (
                <div key={note.id} className="bg-app-surface border border-app rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 group hover:border-app-accent/40 transition-all">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none h-24 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-3 py-1 rounded-lg border border-app text-app-secondary text-xs"
                        >
                          İptal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateNote(note.id)}
                          className="px-3 py-1 rounded-lg bg-app-accent text-white font-semibold text-xs"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-app-primary whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-app text-[11px] text-app-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-app-accent" /> {dateStr}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditContent(note.content);
                            }}
                            className="p-1 hover:text-app-primary"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id, null)}
                            className="p-1 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
