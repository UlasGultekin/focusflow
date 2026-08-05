import React, { useEffect, useState } from 'react';
import {
  Clock,
  Calendar,
  Tag,
  Play,
  Square,
  CheckCircle2,
  Edit2,
  Trash2,
  Share2,
  Paperclip,
  FolderPlus,
  FilePlus,
  ExternalLink,
  Lock,
  Link,
  Plus,
  AlertCircle,
  CheckSquare,
  Square as SquareOutline,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Sparkles,
  NotebookPen,
} from 'lucide-react';
import { useTaskStore } from '../stores/useTaskStore';

export default function TaskDetail({ onEditTask, onShareTask }) {
  const {
    tasks,
    selectedTaskId,
    activeSession,
    subtasksMap,
    startSession,
    endSession,
    deleteTask,
    updateTask,
    selectTask,
    fetchSubtasks,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
    addNote,
    allNotes,
    fetchAllNotes,
  } = useTaskStore();

  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [quickNoteContent, setQuickNoteContent] = useState('');
  const [quickNoteCategory, setQuickNoteCategory] = useState('İş');
  const [quickNoteImages, setQuickNoteImages] = useState([]);
  const [quickNoteAttachments, setQuickNoteAttachments] = useState([]);

  const [showNoteToast, setShowNoteToast] = useState(false);

  const [showNewNoteCatInput, setShowNewNoteCatInput] = useState(false);
  const [newNoteCatName, setNewNoteCatName] = useState('');

  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState({ blockingMe: [], blockedByMe: [] });
  const [isBlockedInfo, setIsBlockedInfo] = useState({ isBlocked: false, blockers: [] });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetTaskId, setTargetTaskId] = useState('');
  const [linkType, setLinkType] = useState('blocks');

  const [manualMinutes, setManualMinutes] = useState('');

  const [deepWorkEntries, setDeepWorkEntries] = useState([]);
  const [newDeepWorkContent, setNewDeepWorkContent] = useState('');

  const task = tasks.find((t) => t.id === selectedTaskId);
  const subtasks = task ? subtasksMap[task.id] || [] : [];

  useEffect(() => {
    if (fetchAllNotes) fetchAllNotes();
    if (selectedTaskId && window.electronAPI) {
      fetchSubtasks(selectedTaskId);
      loadAttachments();
      loadLinks();
      loadBlockedStatus();
      loadDeepWork();
    }
  }, [selectedTaskId]);

  // Extract all categories from existing notes + defaults + localStorage custom categories
  const getNoteCategories = () => {
    const defaults = ['Genel', 'İş', 'Kişisel', 'Fikir', 'Önemli', 'Alışveriş'];
    let custom = [];
    try {
      const saved = localStorage.getItem('focusflow_note_categories');
      if (saved) custom = JSON.parse(saved);
    } catch (e) {}

    const fromNotes = (allNotes || []).map((n) => n.category).filter(Boolean);

    // Also include current task's category if valid
    const taskCat = task?.category ? [task.category] : [];

    const combined = [...new Set([...defaults, ...custom, ...fromNotes, ...taskCat])];
    return combined;
  };

  const handleAddNewNoteCategory = () => {
    if (newNoteCatName.trim()) {
      const cat = newNoteCatName.trim();
      setQuickNoteCategory(cat);

      // Save to custom note categories localStorage
      try {
        const saved = localStorage.getItem('focusflow_note_categories');
        const existing = saved ? JSON.parse(saved) : ['Genel', 'İş', 'Kişisel', 'Fikir', 'Önemli', 'Alışveriş'];
        if (!existing.includes(cat)) {
          existing.push(cat);
          localStorage.setItem('focusflow_note_categories', JSON.stringify(existing));
        }
      } catch (e) {}
    }
    setNewNoteCatName('');
    setShowNewNoteCatInput(false);
  };

  /* ── Quick Note Attachment & Paste Handlers ── */
  const handleQuickNotePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter((it) => it.type.startsWith('image/'));
    if (!imageItems.length) return;
    e.preventDefault();
    const files = imageItems.map((it) => it.getAsFile()).filter(Boolean);
    
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setQuickNoteImages((prev) => [...prev, evt.target.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddQuickNoteAttachment = async (type) => {
    if (!window.electronAPI) return;
    const res = type === 'file' ? await window.electronAPI.selectFile() : await window.electronAPI.selectFolder();
    if (res) {
      setQuickNoteAttachments((prev) => [...prev, res]);
    }
  };

  const loadAttachments = async () => {
    if (selectedTaskId && window.electronAPI.getTaskAttachments) {
      const list = await window.electronAPI.getTaskAttachments(selectedTaskId);
      setAttachments(list || []);
    }
  };

  const loadLinks = async () => {
    if (selectedTaskId && window.electronAPI.getTaskLinks) {
      const res = await window.electronAPI.getTaskLinks(selectedTaskId);
      setLinks(res || { blockingMe: [], blockedByMe: [] });
    }
  };

  const loadBlockedStatus = async () => {
    if (selectedTaskId && window.electronAPI.isTaskBlocked) {
      const res = await window.electronAPI.isTaskBlocked(selectedTaskId);
      setIsBlockedInfo(res || { isBlocked: false, blockers: [] });
    }
  };

  const loadDeepWork = async () => {
    if (selectedTaskId && window.electronAPI.getDeepWorkEntries) {
      const res = await window.electronAPI.getDeepWorkEntries(selectedTaskId);
      setDeepWorkEntries(res || []);
    }
  };

  const handleAddDeepWorkEntry = async () => {
    if (!newDeepWorkContent.trim()) return;
    const sessionId = activeSession ? activeSession.id : null;
    await window.electronAPI.addDeepWorkEntry(task.id, sessionId, newDeepWorkContent);
    setNewDeepWorkContent('');
    loadDeepWork();
  };

  const handleDeleteDeepWorkEntry = async (id) => {
    if (window.confirm("Bu düşünce akışı silinecek, emin misiniz?")) {
      await window.electronAPI.deleteDeepWorkEntry(id);
      loadDeepWork();
    }
  };

  if (!task) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-app-primary">
        <div className="w-16 h-16 rounded-2xl bg-app-surface flex items-center justify-center text-app-muted mb-4 border border-app">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-base text-app-primary">Görev Seçilmedi</h3>
        <p className="text-xs text-app-secondary max-w-xs mt-1">
          Detayları görmek, oturum başlatmak veya alt görevler eklemek için sol listeden bir görev seçin.
        </p>
      </div>
    );
  }

  const isSessionActive = activeSession && activeSession.task_id === task.id;

  // Subtask progress calculations
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed === 1).length;
  const subtaskPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = async (subtask) => {
    const nextCompleted = subtask.completed === 1 ? 0 : 1;
    await updateSubtask(subtask.id, task.id, { completed: nextCompleted });
  };

  const handleSaveSubtaskTitle = async (subtaskId) => {
    if (!editingSubtaskTitle.trim()) return;
    await updateSubtask(subtaskId, task.id, { title: editingSubtaskTitle.trim() });
    setEditingSubtaskId(null);
  };

  const handleMoveSubtaskOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === subtasks.length - 1) return;

    const newSubtasks = [...subtasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSubtasks[index];
    newSubtasks[index] = newSubtasks[targetIndex];
    newSubtasks[targetIndex] = temp;

    const orderedIds = newSubtasks.map((s) => s.id);
    await reorderSubtasks(task.id, orderedIds);
  };

  const handleToggleAutoComplete = async () => {
    const nextVal = task.auto_complete_subtasks === 1 ? 0 : 1;
    await updateTask(task.id, { auto_complete_subtasks: nextVal });
  };

  const handleToggleSession = async () => {
    if (isSessionActive) {
      await endSession();
    } else {
      if (isBlockedInfo.isBlocked) {
        const blockerTitle = (isBlockedInfo.blockers && isBlockedInfo.blockers[0]?.title) || (isBlockedInfo.blockingTasks && isBlockedInfo.blockingTasks[0]?.title) || 'Ön Koşul';
        alert(
          `Bu görev engelleniyor! Başlamadan önce ön koşul görevin (${blockerTitle}) tamamlanması gerekmektedir.`
        );
        return;
      }
      await startSession(task.id, 'manual');
    }
  };

  const handleAddFileAttachment = async () => {
    if (window.electronAPI.selectFileAttachment) {
      const newAtt = await window.electronAPI.selectFileAttachment(task.id);
      if (newAtt) loadAttachments();
    }
  };

  const handleAddFolderAttachment = async () => {
    if (window.electronAPI.selectFolderAttachment) {
      const newAtt = await window.electronAPI.selectFolderAttachment(task.id);
      if (newAtt) loadAttachments();
    }
  };

  const handleOpenPath = async (filePath) => {
    if (window.electronAPI.openPath) {
      const res = await window.electronAPI.openPath(filePath);
      if (!res.success) {
        alert('Dosya veya klasör açılamadı: ' + (res.error || 'Dosya bulunamadı'));
      }
    }
  };

  const handleDeleteAttachment = async (id) => {
    if (window.electronAPI.deleteTaskAttachment) {
      await window.electronAPI.deleteTaskAttachment(id);
      loadAttachments();
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!targetTaskId || window.electronAPI.addTaskLink === undefined) return;

    await window.electronAPI.addTaskLink(task.id, parseInt(targetTaskId, 10), linkType);
    setIsLinkModalOpen(false);
    setTargetTaskId('');
    loadLinks();
    loadBlockedStatus();
  };

  const handleDeleteLink = async (id) => {
    if (window.electronAPI.deleteTaskLink) {
      await window.electronAPI.deleteTaskLink(id);
      loadLinks();
      loadBlockedStatus();
    }
  };
  const handleManualDeductTime = async (e) => {
    e.preventDefault();
    const mins = parseInt(manualMinutes, 10);
    if (!mins || mins <= 0) return;
    const current = task.estimated_minutes || 0;
    const newMins = Math.max(0, current - mins);
    await updateTask(task.id, { estimated_minutes: newMins });
    setManualMinutes('');
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-app-primary overflow-y-auto p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-4 border-b border-app pb-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: task.color || '#5B8DEF' }}
            >
              {task.category || 'Genel'}
            </span>
            <span className="text-[10px] font-bold text-app-muted uppercase">
              {task.priority || 'medium'} Öncelik
            </span>
            {isBlockedInfo.isBlocked && (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3" /> Engelleniyor
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-app-primary">{task.title}</h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // 1. Template Generation
              let template = `📌 Görev Özet Notu: ${task.title}\n\n`;
              
              if (task.description) {
                template += `📝 Açıklama:\n${task.description}\n\n`;
              }

              // Alt Görevler (Subtasks)
              if (subtasks && subtasks.length > 0) {
                template += `☑️ Alt Görevler (Kontrol Listesi):\n`;
                subtasks.forEach((st) => {
                  template += `${st.completed ? '  [x]' : '  [ ]'} ${st.title}\n`;
                });
                template += `\n`;
              }

              // Düşünce Akışı (Deep Work Entries)
              if (deepWorkEntries && deepWorkEntries.length > 0) {
                template += `💡 Düşünce Akışı & Notlar:\n`;
                deepWorkEntries.forEach((dw) => {
                  template += `- ${dw.content}\n`;
                });
                template += `\n`;
              }

              // Bağlantılı Görevler (Task Links)
              const hasBlockingMe = links.blockingMe && links.blockingMe.length > 0;
              const hasBlockedByMe = links.blockedByMe && links.blockedByMe.length > 0;

              if (hasBlockingMe || hasBlockedByMe) {
                template += `🔗 Bağlantılı Görevler:\n`;
                if (hasBlockingMe) {
                  links.blockingMe.forEach((l) => {
                    template += `- 🔒 Ön Koşul Görev: #${l.source_task_id} ${l.source_title} [${l.source_status}]\n`;
                  });
                }
                if (hasBlockedByMe) {
                  links.blockedByMe.forEach((l) => {
                    template += `- 🚫 Engellenen Görev: #${l.target_task_id} ${l.target_title} [${l.target_status}]\n`;
                  });
                }
                template += `\n`;
              }

              template += `✏️ Notlar & Özel Detaylar:\n`;

              // 2. Pre-populate Task Attachments into Quick Note Attachments
              const taskAttsFormatted = (attachments || []).map((att) => ({
                name: att.name,
                path: att.path,
                type: att.type || 'file',
              }));

              setQuickNoteContent(template);
              setQuickNoteAttachments(taskAttsFormatted);
              setQuickNoteImages([]);
              setIsQuickNoteOpen(true);
            }}
            className="px-3 py-2 rounded-xl border border-app bg-app-accent-light text-app-accent hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            title="Bu Görev İçin Zengin Not Şablonu Oluştur"
          >
            <NotebookPen className="w-4 h-4" /> Hızlı Not Ekle
          </button>
          <button
            onClick={() => onShareTask && onShareTask(task)}
            className="p-2 rounded-xl border border-app text-app-secondary hover:text-app-primary hover:bg-app-surface"
            title="Paylaş"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditTask && onEditTask(task)}
            className="p-2 rounded-xl border border-app text-app-secondary hover:text-app-primary hover:bg-app-surface"
            title="Düzenle"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-2 rounded-xl border border-app text-rose-500 hover:bg-rose-500/10"
            title="Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div className="p-4 rounded-xl bg-app-surface border border-app text-xs text-app-secondary leading-relaxed">
          {task.description}
        </div>
      )}

      {/* Main Action Button: Start / End Session */}
      <div className="space-y-2">
        {isBlockedInfo.isBlocked && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Bu görev engelleniyor: #{ (isBlockedInfo.blockers && isBlockedInfo.blockers[0]?.id) || (isBlockedInfo.blockingTasks && isBlockedInfo.blockingTasks[0]?.id) } { (isBlockedInfo.blockers && isBlockedInfo.blockers[0]?.title) || (isBlockedInfo.blockingTasks && isBlockedInfo.blockingTasks[0]?.title) } tamamlanmalıdır.
            </span>
          </div>
        )}

        <button
          onClick={handleToggleSession}
          disabled={isBlockedInfo.isBlocked && !isSessionActive}
          className={`w-full py-3 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 ${
            isSessionActive
              ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse'
              : isBlockedInfo.isBlocked
              ? 'bg-app-secondary text-app-muted cursor-not-allowed opacity-60'
              : 'bg-app-accent text-white hover:opacity-90'
          }`}
        >
          {isSessionActive ? (
            <>
              <Square className="w-4 h-4 fill-current" /> Oturumu Bitir
            </>
          ) : isBlockedInfo.isBlocked ? (
            <>
              <Lock className="w-4 h-4" /> Görev Kilitli (Ön Koşul Bekliyor)
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Şimdi Göreve Başla
            </>
          )}
        </button>
      </div>

      {/* Manuel Süre Düşme */}
      <form
        onSubmit={handleManualDeductTime}
        className="flex items-center gap-2 p-3 rounded-xl bg-app-surface border border-app"
      >
        <Clock className="w-4 h-4 text-app-accent shrink-0" />
        <span className="text-xs text-app-secondary font-semibold shrink-0">Manuel Süre Düş:</span>
        <input
          type="number"
          min="1"
          value={manualMinutes}
          onChange={(e) => setManualMinutes(e.target.value)}
          placeholder="Dakika"
          className="w-20 px-2 py-1 rounded-lg border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
        />
        <span className="text-xs text-app-muted">dk</span>
        <button
          type="submit"
          className="ml-auto px-3 py-1.5 rounded-lg bg-app-accent text-white font-semibold text-xs hover:opacity-90 transition-all"
        >
          Düş
        </button>
        <span className="text-[11px] text-app-muted">
          Kalan: <strong className="text-app-primary">{task.estimated_minutes || 0} dk</strong>
        </span>
      </form>

      {/* SUBTASKS SECTION (Görev 18) */}
      <div className="p-5 rounded-2xl bg-app-surface border border-app space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-app-primary flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-app-accent" /> Alt Görevler (Checklist)
          </h3>

          {/* Auto Complete Toggle */}
          <label className="flex items-center gap-2 text-[11px] text-app-secondary font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(task.auto_complete_subtasks)}
              onChange={handleToggleAutoComplete}
              className="w-3.5 h-3.5 rounded text-app-accent focus:ring-app-accent cursor-pointer"
            />
            <span>Tüm adımlar bitince otomatik tamamla</span>
          </label>
        </div>

        {/* Subtask Progress Bar */}
        {totalSubtasks > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-app-secondary">İlerleme:</span>
              <span className="text-app-accent font-bold">
                {completedSubtasks} / {totalSubtasks} tamamlandı (%{subtaskPercentage})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-app-secondary overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${subtaskPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Subtasks List */}
        <div className="space-y-2">
          {subtasks.length === 0 ? (
            <p className="text-xs text-app-muted text-center py-4 border border-dashed border-app rounded-xl">
              Bu görev için henüz alt adım eklenmedi. Büyük işleri küçük adımlara bölün!
            </p>
          ) : (
            subtasks.map((sub, index) => {
              const isEditing = editingSubtaskId === sub.id;

              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-app bg-app-primary text-xs group hover:border-app-accent/40 transition-all"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    {/* Order Controls */}
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleMoveSubtaskOrder(index, 'up')}
                        disabled={index === 0}
                        className="text-app-muted hover:text-app-primary disabled:opacity-30"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveSubtaskOrder(index, 'down')}
                        disabled={index === subtasks.length - 1}
                        className="text-app-muted hover:text-app-primary disabled:opacity-30"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleSubtask(sub)}
                      className="shrink-0 text-app-muted hover:text-emerald-500"
                    >
                      {sub.completed === 1 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <SquareOutline className="w-4 h-4" />
                      )}
                    </button>

                    {/* Title or Inline Edit */}
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          autoFocus
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveSubtaskTitle(sub.id);
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-app bg-app-surface text-app-primary text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveSubtaskTitle(sub.id)}
                          className="p-1 text-emerald-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onDoubleClick={() => {
                          setEditingSubtaskId(sub.id);
                          setEditingSubtaskTitle(sub.title);
                        }}
                        className={`truncate font-medium cursor-pointer ${
                          sub.completed === 1
                            ? 'line-through text-app-muted'
                            : 'text-app-primary'
                        }`}
                      >
                        {sub.title}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingSubtaskId(sub.id);
                          setEditingSubtaskTitle(sub.title);
                        }}
                        className="p-1 text-app-muted hover:text-app-primary"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSubtask(sub.id, task.id)}
                        className="p-1 text-app-muted hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Subtask Input Form */}
        <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="+ Yeni adım ekle (Enter'a bas)"
            className="flex-1 px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-app-accent text-white font-semibold text-xs hover:opacity-90"
          >
            Ekle
          </button>
        </form>
      </div>

      {/* Düşünce Akışı (Deep Work) */}
      <div className="p-4 rounded-2xl bg-app-surface border border-app space-y-3 shadow-xs">
        <h3 className="font-bold text-xs text-app-primary flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-500" /> Düşünce Akışı
        </h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newDeepWorkContent}
            onChange={(e) => setNewDeepWorkContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDeepWorkEntry()}
            placeholder="Bu çözüme nasıl ulaştığını, denediğin yöntemleri kaydet..."
            className="flex-1 px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            onClick={handleAddDeepWorkEntry}
            className="px-3 py-2 rounded-xl bg-purple-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1 hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Ekle
          </button>
        </div>

        <div className="space-y-3 mt-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-app before:opacity-30 pt-2">
          {deepWorkEntries.length === 0 ? (
            <p className="text-[11px] text-app-muted text-center py-2 relative z-10 bg-app-surface rounded-lg">
              Bu görev için henüz düşünce akışı girişi yok. Zorlandığın anları, bulduğun çözümleri buraya kaydet.
            </p>
          ) : (
            deepWorkEntries.map(entry => {
              const d = new Date(entry.created_at);
              const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active z-10">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-app bg-app-primary text-purple-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border border-app bg-app-primary shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-app-primary text-xs">{timeStr}</span>
                        {entry.session_id && (
                          <span className="text-[9px] font-semibold bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> Odaklanma Sırasında
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDeleteDeepWorkEntry(entry.id)} className="text-app-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-app-secondary whitespace-pre-wrap">{entry.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Attachments Section (Görev 15) */}
      <div className="p-4 rounded-2xl bg-app-surface border border-app space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-app-primary flex items-center gap-1.5">
            <Paperclip className="w-4 h-4 text-app-accent" /> Dosya ve Klasör Ekleri
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleAddFileAttachment}
              className="px-2.5 py-1 rounded-lg border border-app text-[11px] font-semibold text-app-primary hover:bg-app-surface-hover flex items-center gap-1"
            >
              <FilePlus className="w-3.5 h-3.5 text-indigo-500" /> Dosya Bağla
            </button>
            <button
              onClick={handleAddFolderAttachment}
              className="px-2.5 py-1 rounded-lg border border-app text-[11px] font-semibold text-app-primary hover:bg-app-surface-hover flex items-center gap-1"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" /> Klasör Bağla
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {attachments.length === 0 ? (
            <p className="text-[11px] text-app-muted text-center py-3 border border-dashed border-app rounded-xl">
              Bu göreve henüz dosya veya klasör eklenmedi.
            </p>
          ) : (
            attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-app bg-app-primary text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-base">{att.type === 'folder' ? '📁' : '📄'}</span>
                  <span className="font-semibold text-app-primary truncate">{att.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenPath(att.path)}
                    className="px-2 py-1 rounded-lg bg-app-accent text-white font-semibold text-[11px] flex items-center gap-1 hover:opacity-90"
                  >
                    <ExternalLink className="w-3 h-3" /> Aç
                  </button>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="p-1 text-app-muted hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Links Section (Görev 17) */}
      <div className="p-4 rounded-2xl bg-app-surface border border-app space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-app-primary flex items-center gap-1.5">
            <Link className="w-4 h-4 text-indigo-500" /> Bağlantılı Görevler & Ön Koşullar
          </h3>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="px-2.5 py-1 rounded-lg border border-app text-[11px] font-semibold text-app-primary hover:bg-app-surface-hover flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Bağlantı Ekle
          </button>
        </div>

        {/* Blocking Me List */}
        <div className="space-y-2">
          {(links?.blockingMe || []).length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-rose-500 uppercase block mb-1">
                🔒 Bu Görevi Engelleyen Ön Koşullar:
              </span>
              {(links?.blockingMe || []).map((l) => (
                <div
                  key={l.id}
                  onClick={() => selectTask(l.target_task_id)}
                  className="flex items-center justify-between p-2 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs cursor-pointer hover:border-rose-500"
                >
                  <span className="font-semibold text-app-primary truncate">
                    #{l.target_task_id} {l.target_title || 'Görev'} ({l.target_status || 'bekliyor'})
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLink(l.id);
                    }}
                    className="text-app-muted hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {(links?.blockedByMe || []).length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">
                ➡️ Bu Görevin Tamamlanmasını Bekleyenler:
              </span>
              {(links?.blockedByMe || []).map((l) => (
                <div
                  key={l.id}
                  onClick={() => selectTask(l.source_task_id)}
                  className="flex items-center justify-between p-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-xs cursor-pointer hover:border-indigo-500"
                >
                  <span className="font-semibold text-app-primary truncate">
                    #{l.source_task_id} {l.source_title || 'Görev'} ({l.source_status || 'bekliyor'})
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLink(l.id);
                    }}
                    className="text-app-muted hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {(links?.blockingMe || []).length === 0 && (links?.blockedByMe || []).length === 0 && (
            <p className="text-[11px] text-app-muted text-center py-2">
              Henüz tanımlanmış bir görev bağlantısı yok.
            </p>
          )}
        </div>
      </div>

      {/* Add Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-2xl w-full max-w-sm p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-app-primary">Görev Bağlantısı Ekle</h3>

            <form onSubmit={handleAddLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Hedef Görev Seç *
                </label>
                <select
                  required
                  value={targetTaskId}
                  onChange={(e) => setTargetTaskId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                >
                  <option value="">Görev Seçin...</option>
                  {tasks
                    .filter((t) => t.id !== task.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} {t.title} ({t.status})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-app-secondary mb-1">
                  Bağlantı Tipi
                </label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app bg-app-primary text-app-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                >
                  <option value="blocks">🔒 Bu Görev Hedef Görevi Bekliyor (Blocks)</option>
                  <option value="relates_to">🔗 İlişkili (Relates To)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
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

      {/* Toast Notification Banner */}
      {showNoteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">Not Başarıyla Kaydedildi!</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Notlarım sayfasından düzenleyebilir veya inceleyebilirsiniz.
            </p>
          </div>
          <button
            onClick={() => setShowNoteToast(false)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hızlı Not Ekle Modalı */}
      {isQuickNoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-app pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-app-accent-light text-app-accent flex items-center justify-center font-bold">
                  <NotebookPen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-app-primary flex items-center gap-2">
                    Göreve Özel Hızlı Not Oluştur
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  </h3>
                  <p className="text-xs text-app-secondary">
                    <strong className="text-app-primary">"{task.title}"</strong> ile ilişkili not taslağı otomatik oluşturuldu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickNoteOpen(false)}
                className="p-2 rounded-xl text-app-muted hover:text-app-primary hover:bg-app-primary transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!quickNoteContent.trim()) return;
                await addNote(
                  quickNoteContent.trim(),
                  task.id,
                  quickNoteCategory,
                  quickNoteImages,
                  quickNoteAttachments
                );
                setIsQuickNoteOpen(false);
                setQuickNoteContent('');
                setQuickNoteImages([]);
                setQuickNoteAttachments([]);
                setShowNoteToast(true);
                setTimeout(() => setShowNoteToast(false), 4000);
              }}
              className="space-y-4"
            >
              {/* Category selector */}
              <div className="relative">
                <label className="block text-xs font-bold text-app-secondary mb-1.5">
                  Not Kategorisi
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={quickNoteCategory}
                    onChange={(e) => {
                      if (e.target.value === 'add_new') {
                        setShowNewNoteCatInput(true);
                      } else {
                        setQuickNoteCategory(e.target.value);
                        setShowNewNoteCatInput(false);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-app bg-app-primary text-app-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-app-accent/40 cursor-pointer shadow-xs"
                  >
                    {getNoteCategories().map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} {cat === task?.category ? '(Görev Kategorisi)' : ''}
                      </option>
                    ))}
                    {!getNoteCategories().includes(quickNoteCategory) && quickNoteCategory && (
                      <option value={quickNoteCategory}>{quickNoteCategory}</option>
                    )}
                    <option value="add_new">+ Yeni Kategori Oluştur</option>
                  </select>

                  {showNewNoteCatInput && (
                    <div className="absolute right-0 top-7 flex items-center gap-2 bg-app-surface p-2 rounded-2xl border border-app-accent z-20 shadow-2xl">
                      <input
                        type="text"
                        autoFocus
                        value={newNoteCatName}
                        onChange={(e) => setNewNoteCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewNoteCategory())}
                        placeholder="Kategori Adı..."
                        className="px-3 py-1.5 bg-app-primary text-app-primary text-xs font-bold focus:outline-none min-w-[140px] rounded-xl border border-app"
                      />
                      <button type="button" onClick={handleAddNewNoteCategory} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-xl">
                        <Check size={16} />
                      </button>
                      <button type="button" onClick={() => setShowNewNoteCatInput(false)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Textarea & Attachment Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-app-secondary">
                    Not İçeriği & Şablon * <span className="text-[10px] font-normal text-app-muted">(Resim için CTRL+V yapıştırabilirsiniz)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddQuickNoteAttachment('file')}
                      className="px-2.5 py-1 rounded-xl border border-app bg-app-primary text-app-secondary hover:text-blue-500 hover:border-blue-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Paperclip size={13} /> Dosya Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuickNoteAttachment('folder')}
                      className="px-2.5 py-1 rounded-xl border border-app bg-app-primary text-app-secondary hover:text-amber-500 hover:border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <FolderPlus size={13} /> Klasör Ekle
                    </button>
                  </div>
                </div>
                <textarea
                  rows={8}
                  required
                  value={quickNoteContent}
                  onPaste={handleQuickNotePaste}
                  onChange={(e) => setQuickNoteContent(e.target.value)}
                  placeholder="Not detaylarını yazın..."
                  className="w-full p-4 rounded-2xl border border-app bg-app-primary text-app-primary font-medium text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-app-accent/40 shadow-inner"
                />
              </div>

              {/* Eklenen Görseller */}
              {quickNoteImages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-app-secondary">Yapıştırılan / Eklenen Görseller ({quickNoteImages.length}):</span>
                  <div className="flex gap-2.5 flex-wrap">
                    {quickNoteImages.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img src={src} alt="eklenen-gorsel" className="w-16 h-16 object-cover rounded-2xl border border-app shadow-xs transition-transform group-hover:scale-105" />
                        <button
                          type="button"
                          onClick={() => setQuickNoteImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eklenen Dosyalar & Klasörler */}
              {quickNoteAttachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-app-secondary">Eklenen Dosya & Klasörler ({quickNoteAttachments.length}):</span>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {quickNoteAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-app-primary border border-app text-xs shadow-xs">
                        <div className="flex items-center gap-2 truncate">
                          {att.type === 'folder' ? <FolderPlus size={15} className="text-amber-500" /> : <Paperclip size={15} className="text-blue-500" />}
                          <span className="truncate text-app-primary font-bold">{att.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuickNoteAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 p-1"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsQuickNoteOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-app text-app-secondary font-bold text-xs hover:bg-app-primary transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-app-accent to-indigo-600 text-white font-extrabold text-xs hover:opacity-95 shadow-md shadow-app-accent/20 transition-all flex items-center gap-2"
                >
                  <NotebookPen className="w-4 h-4" /> Notu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
