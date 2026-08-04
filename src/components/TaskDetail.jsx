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
  Sparkles,
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
  } = useTaskStore();

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

  const task = tasks.find((t) => t.id === selectedTaskId);
  const subtasks = task ? subtasksMap[task.id] || [] : [];

  useEffect(() => {
    if (selectedTaskId && window.electronAPI) {
      fetchSubtasks(selectedTaskId);
      loadAttachments();
      loadLinks();
      loadBlockedStatus();
    }
  }, [selectedTaskId]);

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
    </div>
  );
}
