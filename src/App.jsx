import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import PomodoroWidget from './components/PomodoroWidget';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import TaskModal from './components/TaskModal';
import BoardView from './components/BoardView';
import CalendarView from './components/CalendarView';
import CoursesView from './components/CoursesView';
import LinksView from './components/LinksView';
import HabitsView from './components/HabitsView';
import JournalView from './components/JournalView';
import NotesView from './components/NotesView';
import SearchView from './components/SearchView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import DashboardView from './components/DashboardView';
import BugsView from './components/BugsView';
import TechDebtsView from './components/TechDebtsView';
import StandupModal from './components/StandupModal';
import CommandPaletteModal from './components/CommandPaletteModal';
import SessionEndModal from './components/SessionEndModal';
import YesterdaySummaryToast from './components/YesterdaySummaryToast';
import TaskShareModal from './components/TaskShareModal';
import FloatingWidgetView from './components/FloatingWidgetView';
import { useTaskStore } from './stores/useTaskStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useSearchStore } from './stores/useSearchStore';
import { useTimerStore } from './stores/useTimerStore';

export default function App() {
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [widgetData, setWidgetData] = useState(null);

  useEffect(() => {
    // Check if loaded in floating widget mode (#widget?data=...)
    if (window.location.hash.startsWith('#widget')) {
      setIsWidgetMode(true);
      try {
        const hashQuery = window.location.hash.split('?data=')[1];
        if (hashQuery) {
          const parsed = JSON.parse(decodeURIComponent(hashQuery));
          setWidgetData(parsed);
        }
      } catch (err) {
        console.error('Widget verisi okunamadı:', err);
      }
    }
  }, []);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isStandupModalOpen, setIsStandupModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [shareTask, setShareTask] = useState(null);

  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const selectTask = useTaskStore((s) => s.selectTask);

  const { openCommandPalette, toggleCommandPalette } = useSearchStore();
  const { lastEndedSession, closeSessionEndModal } = useTimerStore();

  useEffect(() => {
    fetchSettings();
    fetchTasks();

    // Listen for Ctrl+Shift+F global shortcut from Electron IPC
    if (window.electronAPI && window.electronAPI.onTriggerGlobalSearch) {
      window.electronAPI.onTriggerGlobalSearch(() => {
        openCommandPalette();
      });
    }

    // Keyboard shortcut for Ctrl+Shift+F or Ctrl+P inside browser
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    
    const handleGlobalShortcuts = (e) => {
      // Ctrl + Shift + U for Stand-up Modal
      if (e.ctrlKey && e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        setIsStandupModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, []);

  if (isWidgetMode) {
    return <FloatingWidgetView initialData={widgetData} />;
  }

  const handleOpenAddModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSearchResultNavigation = (sourceType, sourceId, taskId, dateInfo) => {
    if (sourceType === 'search-page') {
      setCurrentTab('search');
      return;
    }

    if (taskId || sourceType === 'task' || sourceType === 'subtask' || sourceType === 'task_note' || sourceType === 'attachment') {
      const targetId = taskId || sourceId;
      selectTask(targetId);
      setCurrentTab('tasks');
    } else if (sourceType === 'journal') {
      setCurrentTab('journal');
    } else if (sourceType === 'general_note') {
      setCurrentTab('notes');
    } else if (sourceType === 'session_note') {
      if (taskId) {
        selectTask(taskId);
        setCurrentTab('tasks');
      } else {
        setCurrentTab('tasks');
      }
    } else {
      setCurrentTab('search');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app-primary text-app-primary">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onOpenStandup={() => setIsStandupModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentTab === 'dashboard' && (
          <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />
        )}

        {currentTab === 'tasks' && (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Left Panel: Task List */}
            <TaskList
              onOpenAddModal={handleOpenAddModal}
              onEditTask={handleOpenEditModal}
            />

            {/* Right Panel: Pomodoro Top Widget + Task Detail */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-primary">
              <div className="p-4 border-b border-app bg-app-primary">
                <PomodoroWidget />
              </div>
              <div className="flex-1 overflow-hidden">
                <TaskDetail
                  onEditTask={handleOpenEditModal}
                  onShareTask={(task) => setShareTask(task)}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'board' && (
          <BoardView onOpenAddModal={handleOpenAddModal} />
        )}

        {currentTab === 'calendar' && <CalendarView />}

        {currentTab === 'courses' && <CoursesView />}

        {currentTab === 'links' && <LinksView />}

        {currentTab === 'habits' && <HabitsView />}

        {currentTab === 'journal' && <JournalView />}

        {currentTab === 'notes' && <NotesView />}

        {currentTab === 'bugs' && <BugsView />}

        {currentTab === 'tech_debts' && <TechDebtsView />}

        {currentTab === 'search' && (
          <SearchView onNavigate={handleSearchResultNavigation} />
        )}

        {currentTab === 'analytics' && <AnalyticsView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Modals & Overlays */}
      <CommandPaletteModal onNavigate={handleSearchResultNavigation} />

      {lastEndedSession && (
        <SessionEndModal
          session={lastEndedSession.session}
          task={lastEndedSession.task}
          onClose={closeSessionEndModal}
          onSave={() => {
            fetchTasks();
          }}
        />
      )}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      <TaskShareModal
        task={shareTask}
        isOpen={Boolean(shareTask)}
        onClose={() => setShareTask(null)}
      />

      <StandupModal
        isOpen={isStandupModalOpen}
        onClose={() => setIsStandupModalOpen(false)}
      />

      <YesterdaySummaryToast />
    </div>
  );
}
