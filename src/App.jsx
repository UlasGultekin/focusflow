import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import PomodoroWidget from './components/PomodoroWidget';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import TaskModal from './components/TaskModal';
import BoardView from './components/BoardView';
import CalendarView from './components/CalendarView';
import CoursesView from './components/CoursesView';
import HabitsView from './components/HabitsView';
import JournalView from './components/JournalView';
import NotesView from './components/NotesView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import YesterdaySummaryToast from './components/YesterdaySummaryToast';
import TaskShareModal from './components/TaskShareModal';
import { useTaskStore } from './stores/useTaskStore';
import { useSettingsStore } from './stores/useSettingsStore';

export default function App() {
  const [currentTab, setCurrentTab] = useState('tasks');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [shareTask, setShareTask] = useState(null);

  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    fetchSettings();
    fetchTasks();
  }, []);

  const handleOpenAddModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app-primary text-app-primary">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
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

        {currentTab === 'habits' && <HabitsView />}

        {currentTab === 'journal' && <JournalView />}

        {currentTab === 'notes' && <NotesView />}

        {currentTab === 'analytics' && <AnalyticsView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Modals & Toasts */}
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

      <YesterdaySummaryToast />
    </div>
  );
}
