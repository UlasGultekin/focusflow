const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Tasks
  getTasks: (filterStatus) => ipcRenderer.invoke('tasks:get', filterStatus),
  addTask: (taskData) => ipcRenderer.invoke('tasks:add', taskData),
  updateTask: (id, taskData) => ipcRenderer.invoke('tasks:update', id, taskData),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),

  // Subtasks (Görev 18)
  getSubtasks: (taskId) => ipcRenderer.invoke('subtasks:get', taskId),
  addSubtask: (taskId, title) => ipcRenderer.invoke('subtasks:add', taskId, title),
  updateSubtask: (id, data) => ipcRenderer.invoke('subtasks:update', id, data),
  deleteSubtask: (id) => ipcRenderer.invoke('subtasks:delete', id),
  reorderSubtasks: (taskId, orderedIds) => ipcRenderer.invoke('subtasks:reorder', taskId, orderedIds),

  // Sessions (Görev 19)
  startSession: (taskId, type) => ipcRenderer.invoke('sessions:start', taskId, type),
  endSession: (sessionId) => ipcRenderer.invoke('sessions:end', sessionId),
  updateSessionNotes: (sessionId, notes) => ipcRenderer.invoke('sessions:updateNotes', sessionId, notes),
  getTaskSessions: (taskId) => ipcRenderer.invoke('sessions:getTask', taskId),
  getAllSessions: (startDate, endDate) => ipcRenderer.invoke('sessions:getAll', startDate, endDate),

  // Search & Command Palette (Görev 20)
  searchAll: (query, filters) => ipcRenderer.invoke('search:query', query, filters),
  getSearchSuggestions: (query) => ipcRenderer.invoke('search:suggestions', query),
  rebuildSearchIndex: () => ipcRenderer.invoke('search:rebuild'),
  onTriggerGlobalSearch: (callback) => ipcRenderer.on('trigger-global-search', (_, data) => callback(data)),

  // Notes
  getNotes: (taskId) => ipcRenderer.invoke('notes:get', taskId),
  addNote: (content, taskId) => ipcRenderer.invoke('notes:add', content, taskId),
  updateNote: (id, content) => ipcRenderer.invoke('notes:update', id, content),
  deleteNote: (id) => ipcRenderer.invoke('notes:delete', id),

  // Habits
  getHabits: () => ipcRenderer.invoke('habits:get'),
  addHabit: (habitData) => ipcRenderer.invoke('habits:add', habitData),
  deleteHabit: (id) => ipcRenderer.invoke('habits:delete', id),
  toggleHabitCompletion: (habitId, dateStr, value) => ipcRenderer.invoke('habits:toggle', habitId, dateStr, value),
  getHabitCompletions: (habitId) => ipcRenderer.invoke('habits:getCompletions', habitId),

  // Courses / Education
  getCourses: () => ipcRenderer.invoke('courses:get'),
  addCourse: (courseData) => ipcRenderer.invoke('courses:add', courseData),
  deleteCourse: (id) => ipcRenderer.invoke('courses:delete', id),
  startCourseSession: (courseId) => ipcRenderer.invoke('courses:startSession', courseId),
  endCourseSession: (sessionId) => ipcRenderer.invoke('courses:endSession', sessionId),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Attachments (Görev 15)
  getTaskAttachments: (taskId) => ipcRenderer.invoke('attachments:get', taskId),
  selectFileAttachment: (taskId) => ipcRenderer.invoke('attachments:selectFile', taskId),
  selectFolderAttachment: (taskId) => ipcRenderer.invoke('attachments:selectFolder', taskId),
  deleteTaskAttachment: (id) => ipcRenderer.invoke('attachments:delete', id),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),

  // Journal (Görev 16)
  getJournalEntry: (dateStr) => ipcRenderer.invoke('journal:get', dateStr),
  saveJournalEntry: (dateStr, content, mood) => ipcRenderer.invoke('journal:save', dateStr, content, mood),
  searchJournal: (query) => ipcRenderer.invoke('journal:search', query),
  getAllJournalEntries: () => ipcRenderer.invoke('journal:getAll'),

  // Task Links (Görev 17)
  getTaskLinks: (taskId) => ipcRenderer.invoke('taskLinks:get', taskId),
  addTaskLink: (sourceTaskId, targetTaskId, linkType) => ipcRenderer.invoke('taskLinks:add', sourceTaskId, targetTaskId, linkType),
  deleteTaskLink: (id) => ipcRenderer.invoke('taskLinks:delete', id),
  isTaskBlocked: (taskId) => ipcRenderer.invoke('taskLinks:isBlocked', taskId),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),

  // Export / Import
  exportDatabase: () => ipcRenderer.invoke('db:export'),
  importDatabase: () => ipcRenderer.invoke('db:import'),
  exportCSV: (data, filename) => ipcRenderer.invoke('db:exportCSV', data, filename),

  // Summary & Notifications
  getYesterdaySummary: () => ipcRenderer.invoke('summary:yesterday'),
  showNotification: (title, body) => ipcRenderer.invoke('notify', title, body),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  toggleWindow: () => ipcRenderer.send('window:toggle'),
});
