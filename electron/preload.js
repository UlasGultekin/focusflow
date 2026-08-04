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
  addNote: (content, taskId, category, imagesJson, attachmentsJson, plannedDate, plannedStartTime) => 
    ipcRenderer.invoke('notes:add', content, taskId, category, imagesJson, attachmentsJson, plannedDate, plannedStartTime),
  updateNote: (id, content, category, imagesJson, attachmentsJson, plannedDate, plannedStartTime) => 
    ipcRenderer.invoke('notes:update', id, content, category, imagesJson, attachmentsJson, plannedDate, plannedStartTime),
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

  // Links
  getLinks: () => ipcRenderer.invoke('links:get'),
  addLink: (linkData) => ipcRenderer.invoke('links:add', linkData),
  updateLink: (id, linkData) => ipcRenderer.invoke('links:update', id, linkData),
  deleteLink: (id) => ipcRenderer.invoke('links:delete', id),

  // Tech Debts (Görev 27)
  getTechDebts: () => ipcRenderer.invoke('techDebts:get'),
  addTechDebt: (data) => ipcRenderer.invoke('techDebts:add', data),
  updateTechDebt: (id, data) => ipcRenderer.invoke('techDebts:update', id, data),
  deleteTechDebt: (id) => ipcRenderer.invoke('techDebts:delete', id),

  // Bugs (Görev 27)
  getBugs: () => ipcRenderer.invoke('bugs:get'),
  addBug: (data) => ipcRenderer.invoke('bugs:add', data),
  updateBug: (id, data) => ipcRenderer.invoke('bugs:update', id, data),
  deleteBug: (id) => ipcRenderer.invoke('bugs:delete', id),

  // Attachments (Görev 15)
  getTaskAttachments: (taskId) => ipcRenderer.invoke('attachments:get', taskId),
  selectFileAttachment: (taskId) => ipcRenderer.invoke('attachments:selectFile', taskId),
  selectFolderAttachment: (taskId) => ipcRenderer.invoke('attachments:selectFolder', taskId),
  deleteTaskAttachment: (id) => ipcRenderer.invoke('attachments:delete', id),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),

  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

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

  // Export / Import & Cleanup
  exportDatabase: () => ipcRenderer.invoke('db:export'),
  importDatabase: () => ipcRenderer.invoke('db:import'),
  exportCSV: (data, filename) => ipcRenderer.invoke('db:exportCSV', data, filename),
  clearDataByDateRange: (startDate, endDate) => ipcRenderer.invoke('db:clearByDate', startDate, endDate),
  clearAllData: () => ipcRenderer.invoke('db:clearAll'),

  // Summary & Notifications
  getYesterdaySummary: () => ipcRenderer.invoke('summary:yesterday'),
  showNotification: (title, body) => ipcRenderer.invoke('notify', title, body),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  toggleWindow: () => ipcRenderer.send('window:toggle'),
});
