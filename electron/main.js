import electron from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getSubtasks,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks,
  startSession,
  endSession,
  updateSessionNotes,
  getTaskSessions,
  getAllSessions,
  searchAll,
  getSearchSuggestions,
  rebuildSearchIndex,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  getHabits,
  addHabit,
  deleteHabit,
  toggleHabitCompletion,
  getHabitCompletions,
  getCourses,
  addCourse,
  deleteCourse,
  startCourseSession,
  endCourseSession,
  getTaskAttachments,
  addTaskAttachment,
  deleteTaskAttachment,
  getJournalEntry,
  saveJournalEntry,
  searchJournal,
  getAllJournalEntries,
  getTaskLinks,
  addTaskLink,
  deleteTaskLink,
  isTaskBlocked,
  getSettings,
  updateSettings,
  exportDatabase,
  importDatabase,
  getYesterdaySummary
} from './database.js';

const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, Notification, dialog, nativeImage, shell } = electron;

// Disable Chromium GPU Shader & Disk Cache to prevent Windows file lock warnings
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');
app.commandLine.appendSwitch('disable-http-cache');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  const appIconPath = path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 950,
    minHeight: 650,
    frame: true,
    titleBarStyle: 'default',
    title: 'FocusFlow',
    icon: fs.existsSync(appIconPath) ? appIconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.on('did-fail-load', () => {
      console.log('Dev server henüz hazır değil, 1 saniye sonra tekrar deneniyor...');
      setTimeout(() => {
        if (mainWindow) mainWindow.loadURL('http://localhost:5173');
      }, 1000);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    let icon = fs.existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
      : nativeImage.createEmpty();

    if (icon.isEmpty()) {
      icon = nativeImage.createFromBuffer(
        Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAOSURBVDhPY2AYBaACAAAARAAB+Y25bAAAAABJRU5ErkJggg==', 'base64')
      );
    }
    tray = new Tray(icon);
    tray.setToolTip('FocusFlow - Odaklanma ve Görev Yönetimi');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'FocusFlow\'u Göster / Gizle',
        click: () => {
          if (mainWindow?.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow?.show();
            mainWindow?.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
    tray.on('click', () => {
      if (mainWindow?.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow?.show();
        mainWindow?.focus();
      }
    });
  } catch (err) {
    console.error('Tray oluşturma hatası:', err);
  }
}

function registerGlobalShortcuts() {
  try {
    globalShortcut.unregisterAll();
    const settings = getSettings();
    const hotkey = settings.hotkeys || 'Ctrl+Shift+Space';

    globalShortcut.register(hotkey, () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    // Global Search Shortcut (Ctrl+Shift+F)
    globalShortcut.register('Ctrl+Shift+F', () => {
      if (mainWindow) {
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('trigger-global-search', true);
      }
    });
  } catch (err) {
    console.error('Kısayol tuşu kaydedilemedi:', err);
  }
}

// IPC Handlers
function setupIPCHandlers() {
  // Tasks
  ipcMain.handle('tasks:get', (_, filterStatus) => getTasks(filterStatus));
  ipcMain.handle('tasks:add', (_, taskData) => addTask(taskData));
  ipcMain.handle('tasks:update', (_, id, taskData) => updateTask(id, taskData));
  ipcMain.handle('tasks:delete', (_, id) => deleteTask(id));

  // Subtasks (Görev 18)
  ipcMain.handle('subtasks:get', (_, taskId) => getSubtasks(taskId));
  ipcMain.handle('subtasks:add', (_, taskId, title) => addSubtask(taskId, title));
  ipcMain.handle('subtasks:update', (_, id, data) => updateSubtask(id, data));
  ipcMain.handle('subtasks:delete', (_, id) => deleteSubtask(id));
  ipcMain.handle('subtasks:reorder', (_, taskId, orderedIds) => reorderSubtasks(taskId, orderedIds));

  // Sessions (Görev 19)
  ipcMain.handle('sessions:start', (_, taskId, type) => startSession(taskId, type));
  ipcMain.handle('sessions:end', (_, sessionId) => endSession(sessionId));
  ipcMain.handle('sessions:updateNotes', (_, sessionId, notes) => updateSessionNotes(sessionId, notes));
  ipcMain.handle('sessions:getTask', (_, taskId) => getTaskSessions(taskId));
  ipcMain.handle('sessions:getAll', (_, startDate, endDate) => getAllSessions(startDate, endDate));

  // Search & Command Palette (Görev 20)
  ipcMain.handle('search:query', (_, query, filters) => searchAll(query, filters));
  ipcMain.handle('search:suggestions', (_, query) => getSearchSuggestions(query));
  ipcMain.handle('search:rebuild', () => rebuildSearchIndex());

  // Notes
  ipcMain.handle('notes:get', (_, taskId) => getNotes(taskId));
  ipcMain.handle('notes:add', (_, content, taskId) => addNote(content, taskId));
  ipcMain.handle('notes:update', (_, id, content) => updateNote(id, content));
  ipcMain.handle('notes:delete', (_, id) => deleteNote(id));

  // Habits
  ipcMain.handle('habits:get', () => getHabits());
  ipcMain.handle('habits:add', (_, habitData) => addHabit(habitData));
  ipcMain.handle('habits:delete', (_, id) => deleteHabit(id));
  ipcMain.handle('habits:toggle', (_, habitId, dateStr, value) => toggleHabitCompletion(habitId, dateStr, value));
  ipcMain.handle('habits:getCompletions', (_, habitId) => getHabitCompletions(habitId));

  // Courses
  ipcMain.handle('courses:get', () => getCourses());
  ipcMain.handle('courses:add', (_, courseData) => addCourse(courseData));
  ipcMain.handle('courses:delete', (_, id) => deleteCourse(id));
  ipcMain.handle('courses:startSession', (_, courseId) => startCourseSession(courseId));
  ipcMain.handle('courses:endSession', (_, sessionId) => endCourseSession(sessionId));

  // Attachments (Görev 15)
  ipcMain.handle('attachments:get', (_, taskId) => getTaskAttachments(taskId));
  ipcMain.handle('attachments:selectFile', async (_, taskId) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Göreve Dosya Bağla',
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      const fileName = path.basename(selectedPath);
      return addTaskAttachment(taskId, fileName, selectedPath, 'file');
    }
    return null;
  });

  ipcMain.handle('attachments:selectFolder', async (_, taskId) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Göreve Klasör Bağla',
      properties: ['openDirectory'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      const folderName = path.basename(selectedPath);
      return addTaskAttachment(taskId, folderName, selectedPath, 'folder');
    }
    return null;
  });

  ipcMain.handle('attachments:delete', (_, id) => deleteTaskAttachment(id));

  // Journal (Görev 16)
  ipcMain.handle('journal:get', (_, dateStr) => getJournalEntry(dateStr));
  ipcMain.handle('journal:save', (_, dateStr, content, mood) => saveJournalEntry(dateStr, content, mood));
  ipcMain.handle('journal:search', (_, query) => searchJournal(query));
  ipcMain.handle('journal:getAll', () => getAllJournalEntries());

  // Task Links (Görev 17)
  ipcMain.handle('taskLinks:get', (_, taskId) => getTaskLinks(taskId));
  ipcMain.handle('taskLinks:add', (_, sourceTaskId, targetTaskId, linkType) => addTaskLink(sourceTaskId, targetTaskId, linkType));
  ipcMain.handle('taskLinks:delete', (_, id) => deleteTaskLink(id));
  ipcMain.handle('taskLinks:isBlocked', (_, taskId) => isTaskBlocked(taskId));

  // Shell Open External & Open Path
  ipcMain.handle('shell:openExternal', (_, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle('shell:openPath', async (_, targetPath) => {
    if (targetPath) {
      const err = await shell.openPath(targetPath);
      return { success: !err, error: err };
    }
    return { success: false, error: 'Path empty' };
  });

  // Settings
  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:update', (_, newSettings) => {
    const updated = updateSettings(newSettings);
    registerGlobalShortcuts();
    return updated;
  });

  // DB Export & Import
  ipcMain.handle('db:export', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Veritabanı Yedeği Kaydet',
      defaultPath: `focusflow-backup-${new Date().toISOString().slice(0,10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });

    if (!result.canceled && result.filePath) {
      exportDatabase(result.filePath);
      return { success: true, filePath: result.filePath };
    }
    return { success: false };
  });

  ipcMain.handle('db:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Veritabanı Yedeği Seç',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      importDatabase(result.filePaths[0]);
      if (mainWindow) mainWindow.reload();
      return { success: true };
    }
    return { success: false };
  });

  // Export CSV
  ipcMain.handle('db:exportCSV', async (_, csvContent, filename) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'CSV Olarak Dışa Aktar',
      defaultPath: filename || 'focusflow-tasks.csv',
      filters: [{ name: 'CSV File', extensions: ['csv'] }]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, csvContent, 'utf-8');
      return { success: true, filePath: result.filePath };
    }
    return { success: false };
  });

  // Summary & Notification
  ipcMain.handle('summary:yesterday', () => getYesterdaySummary());

  ipcMain.handle('notify', (_, title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
    return true;
  });

  // Window Controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:close', () => mainWindow?.hide());
  ipcMain.on('window:toggle', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

app.whenReady().then(async () => {
  setupIPCHandlers();
  await initDatabase();
  createWindow();
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
