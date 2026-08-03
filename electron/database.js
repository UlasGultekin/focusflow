import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import electron from 'electron';

const { app } = electron;

let db;
let dbPath;

function saveDb() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export async function initDatabase() {
  const userDataPath = app ? app.getPath('userData') : process.cwd();
  dbPath = path.join(userDataPath, 'focusflow.db');
  console.log('Veritabanı yolu:', dbPath);

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // Tabloları Oluştur
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      estimated_minutes INTEGER DEFAULT 25,
      priority TEXT DEFAULT 'medium',
      category TEXT DEFAULT 'Genel',
      color TEXT DEFAULT '#5B8DEF',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      planned_date TEXT,
      planned_start_time TEXT,
      task_type TEXT DEFAULT 'task',
      auto_complete_subtasks INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_seconds INTEGER,
      type TEXT DEFAULT 'manual',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#5B8DEF',
      frequency TEXT DEFAULT 'daily',
      goal_minutes INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      value INTEGER DEFAULT 1,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT,
      category TEXT DEFAULT 'Yazılım',
      total_spent_minutes INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_seconds INTEGER,
      FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      type TEXT DEFAULT 'file',
      added_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL UNIQUE,
      content TEXT DEFAULT '',
      mood INTEGER DEFAULT 4,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_task_id INTEGER NOT NULL,
      target_task_id INTEGER NOT NULL,
      link_type TEXT DEFAULT 'blocks',
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_task_id) REFERENCES tasks (id) ON DELETE CASCADE,
      FOREIGN KEY (target_task_id) REFERENCES tasks (id) ON DELETE CASCADE,
      UNIQUE(source_task_id, target_task_id)
    );

    CREATE TABLE IF NOT EXISTS search_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      title TEXT,
      content TEXT,
      task_id INTEGER,
      date_info TEXT,
      status TEXT,
      extra_json TEXT
    );

    CREATE TABLE IF NOT EXISTS pomodoro_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      focus_duration INTEGER DEFAULT 25,
      short_break INTEGER DEFAULT 5,
      long_break INTEGER DEFAULT 15,
      long_break_interval INTEGER DEFAULT 4
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme TEXT DEFAULT 'light',
      compact_mode INTEGER DEFAULT 0,
      hotkeys TEXT DEFAULT 'Ctrl+Shift+Space',
      backup_path TEXT DEFAULT ''
    );
  `);

  // Güvenli Migrasyonlar
  try {
    const tableInfo = db.exec("PRAGMA table_info(tasks)");
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map((col) => col[1]);
      if (!columns.includes('planned_date')) {
        db.run("ALTER TABLE tasks ADD COLUMN planned_date TEXT");
      }
      if (!columns.includes('planned_start_time')) {
        db.run("ALTER TABLE tasks ADD COLUMN planned_start_time TEXT");
      }
      if (!columns.includes('task_type')) {
        db.run("ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT 'task'");
      }
      if (!columns.includes('auto_complete_subtasks')) {
        db.run("ALTER TABLE tasks ADD COLUMN auto_complete_subtasks INTEGER DEFAULT 0");
      }
    }

    const sessionInfo = db.exec("PRAGMA table_info(task_sessions)");
    if (sessionInfo.length > 0) {
      const sessionCols = sessionInfo[0].values.map((col) => col[1]);
      if (!sessionCols.includes('notes')) {
        db.run("ALTER TABLE task_sessions ADD COLUMN notes TEXT DEFAULT ''");
      }
    }

    db.run("UPDATE tasks SET status = 'todo' WHERE status = 'active'");
    db.run("UPDATE tasks SET status = 'done' WHERE status = 'completed'");
  } catch (err) {
    console.error('Migrasyon hatası:', err);
  }

  // Varsayılan Ayarları Ekle
  const pomodoroRes = db.exec('SELECT COUNT(*) as count FROM pomodoro_settings');
  if (!pomodoroRes.length || pomodoroRes[0].values[0][0] === 0) {
    db.run(`
      INSERT INTO pomodoro_settings (id, focus_duration, short_break, long_break, long_break_interval)
      VALUES (1, 25, 5, 15, 4)
    `);
  }

  const settingsRes = db.exec('SELECT COUNT(*) as count FROM settings');
  if (!settingsRes.length || settingsRes[0].values[0][0] === 0) {
    db.run(`
      INSERT INTO settings (id, theme, compact_mode, hotkeys, backup_path)
      VALUES (1, 'light', 0, 'Ctrl+Shift+Space', '')
    `);
  }

  // Seed tasks if empty
  const taskRes = db.exec('SELECT COUNT(*) as count FROM tasks');
  if (!taskRes.length || taskRes[0].values[0][0] < 3) {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = nowIso.slice(0, 10);

    db.run(
      `INSERT INTO tasks (title, description, estimated_minutes, priority, category, color, created_at, updated_at, status, planned_date, planned_start_time, task_type, auto_complete_subtasks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'FocusFlow Uygulamasını Keşfet',
        'İlk göreviniz hazır! Pomodoro zamanlayıcısını başlatabilir veya not ekleyebilirsiniz.',
        60,
        'high',
        'Kişisel',
        '#5B8DEF',
        nowIso,
        nowIso,
        'in_progress',
        todayStr,
        '10:00',
        'task',
        1,
      ]
    );

    db.run(
      `INSERT INTO tasks (title, description, estimated_minutes, priority, category, color, created_at, updated_at, status, planned_date, planned_start_time, task_type, auto_complete_subtasks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Haftalık Proje Raporunu Hazırla',
        'Müşteri sunumu için grafikler ve metrik özetleri eklenmeli.',
        120,
        'medium',
        'İş',
        '#10B981',
        nowIso,
        nowIso,
        'todo',
        todayStr,
        '14:00',
        'task',
        0,
      ]
    );

    db.run(
      `INSERT INTO tasks (title, description, estimated_minutes, priority, category, color, created_at, updated_at, status, planned_date, planned_start_time, task_type, auto_complete_subtasks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Takım Senkronizasyon Toplantısı',
        'Sprint değerlendirmesi ve yeni hedeflerin belirlenmesi.',
        45,
        'high',
        'Toplantı',
        '#FB7185',
        nowIso,
        nowIso,
        'done',
        todayStr,
        '11:30',
        'event',
        0,
      ]
    );
  }

  // Seed Subtasks if empty
  const subtaskRes = db.exec('SELECT COUNT(*) as count FROM subtasks');
  if (!subtaskRes.length || subtaskRes[0].values[0][0] === 0) {
    const nowIso = new Date().toISOString();

    db.run(
      `INSERT INTO subtasks (task_id, title, completed, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'Pomodoro widgetını incele', 1, 1, nowIso, nowIso]
    );

    db.run(
      `INSERT INTO subtasks (task_id, title, completed, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'Kanban panosunu test et', 1, 2, nowIso, nowIso]
    );

    db.run(
      `INSERT INTO subtasks (task_id, title, completed, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'Alt görev ekleme özelliğini dene', 0, 3, nowIso, nowIso]
    );
  }

  // Arama İndeksini Yeniden Oluştur
  rebuildSearchIndex();

  saveDb();
  return db;
}

// Helper to convert query result to objects array
function resultToObjects(result) {
  if (!result || !result.length) return [];
  const columns = result[0].columns;
  const values = result[0].values;
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

function getLastInserted(tableName) {
  const res = db.exec(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 1`);
  return resultToObjects(res)[0];
}

// ARAMA İNDEKSLEME İŞLEMLERİ (GÖREV 20)
export function indexRecord(source_type, source_id, title, content, task_id = null, date_info = '', status = '', extra_json = '') {
  db.run("DELETE FROM search_index WHERE source_type = ? AND source_id = ?", [source_type, source_id]);
  db.run(
    `INSERT INTO search_index (source_type, source_id, title, content, task_id, date_info, status, extra_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [source_type, source_id, title || '', content || '', task_id, date_info || '', status || '', extra_json || '']
  );
  saveDb();
}

export function removeIndexRecord(source_type, source_id) {
  db.run("DELETE FROM search_index WHERE source_type = ? AND source_id = ?", [source_type, source_id]);
  saveDb();
}

export function rebuildSearchIndex() {
  if (!db) return;
  db.run("DELETE FROM search_index");

  // 1. Tasks
  const tasks = getTasks('all');
  tasks.forEach((t) => {
    indexRecord('task', t.id, t.title, t.description || '', t.id, t.planned_date || (t.created_at ? t.created_at.slice(0, 10) : ''), t.status);
  });

  // 2. Subtasks
  const subtasks = resultToObjects(db.exec("SELECT * FROM subtasks"));
  subtasks.forEach((st) => {
    indexRecord('subtask', st.id, st.title, st.title, st.task_id, st.created_at ? st.created_at.slice(0, 10) : '', st.completed ? 'done' : 'todo');
  });

  // 3. Notes
  const notes = resultToObjects(db.exec("SELECT * FROM notes"));
  notes.forEach((n) => {
    const type = n.task_id ? 'task_note' : 'general_note';
    indexRecord(type, n.id, n.task_id ? `Görev Notu #${n.id}` : 'Genel Not', n.content, n.task_id, n.created_at ? n.created_at.slice(0, 10) : '');
  });

  // 4. Journal entries
  const journalEntries = getAllJournalEntries();
  journalEntries.forEach((j) => {
    indexRecord('journal', j.id, `Günlük - ${j.entry_date}`, j.content || '', null, j.entry_date);
  });

  // 5. Session notes
  const sessions = resultToObjects(db.exec("SELECT * FROM task_sessions WHERE notes IS NOT NULL AND notes != ''"));
  sessions.forEach((s) => {
    indexRecord('session_note', s.id, `Oturum Notu #${s.id}`, s.notes, s.task_id, s.start_time ? s.start_time.slice(0, 10) : '');
  });

  // 6. Attachments
  const attachments = resultToObjects(db.exec("SELECT * FROM task_attachments"));
  attachments.forEach((a) => {
    indexRecord('attachment', a.id, a.name, `${a.name} (${a.path})`, a.task_id, a.added_at ? a.added_at.slice(0, 10) : '');
  });

  saveDb();
  return true;
}

export function searchAll(queryStr = '', filters = {}) {
  const query = (queryStr || '').trim().toLowerCase();
  let records = resultToObjects(db.exec("SELECT * FROM search_index ORDER BY id DESC"));

  if (query) {
    const tokens = query.split(/\s+/);
    records = records.filter((rec) => {
      const fullText = `${rec.title} ${rec.content} ${rec.date_info} ${rec.status}`.toLowerCase();
      return tokens.every((token) => fullText.includes(token));
    });
  }

  // Apply filters
  if (filters.sourceTypes && filters.sourceTypes.length > 0) {
    records = records.filter((r) => filters.sourceTypes.includes(r.source_type));
  }
  if (filters.status && filters.status !== 'all') {
    records = records.filter((r) => r.status === filters.status);
  }
  if (filters.dateFrom) {
    records = records.filter((r) => r.date_info >= filters.dateFrom);
  }
  if (filters.dateTo) {
    records = records.filter((r) => r.date_info <= filters.dateTo);
  }
  if (filters.taskId) {
    records = records.filter((r) => r.task_id === Number(filters.taskId));
  }

  return records.map((rec) => {
    let snippet = rec.content || rec.title || '';
    if (query && snippet) {
      const idx = snippet.toLowerCase().indexOf(query);
      if (idx !== -1) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(snippet.length, idx + query.length + 40);
        let excerpt = snippet.slice(start, end);
        const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
        excerpt = excerpt.replace(regex, '<mark class="bg-amber-300 text-slate-900 rounded px-1 font-semibold">$1</mark>');
        snippet = (start > 0 ? '...' : '') + excerpt + (end < snippet.length ? '...' : '');
      } else {
        snippet = snippet.slice(0, 80);
      }
    } else {
      snippet = snippet.slice(0, 80);
    }

    return {
      ...rec,
      snippet,
    };
  });
}

export function getSearchSuggestions(partialQueryStr = '') {
  const query = (partialQueryStr || '').trim().toLowerCase();
  if (!query) return [];

  const results = searchAll(query);
  return results.slice(0, 8);
}

// GÖREV İŞLEMLERİ
export function getTasks(filterStatus = 'all') {
  let res;
  if (filterStatus === 'all') {
    res = db.exec('SELECT * FROM tasks ORDER BY updated_at DESC');
  } else if (filterStatus === 'active') {
    res = db.exec("SELECT * FROM tasks WHERE status IN ('todo', 'in_progress') ORDER BY updated_at DESC");
  } else if (filterStatus === 'completed') {
    res = db.exec("SELECT * FROM tasks WHERE status = 'done' ORDER BY updated_at DESC");
  } else {
    res = db.exec(`SELECT * FROM tasks WHERE status = '${filterStatus}' ORDER BY updated_at DESC`);
  }
  return resultToObjects(res);
}

export function addTask(taskData) {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO tasks (title, description, estimated_minutes, priority, category, color, created_at, updated_at, status, planned_date, planned_start_time, task_type, auto_complete_subtasks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      taskData.title,
      taskData.description || '',
      taskData.estimated_minutes || 25,
      taskData.priority || 'medium',
      taskData.category || 'Genel',
      taskData.color || '#5B8DEF',
      now,
      now,
      taskData.status || 'todo',
      taskData.planned_date || null,
      taskData.planned_start_time || null,
      taskData.task_type || 'task',
      taskData.auto_complete_subtasks || 0,
    ]
  );
  saveDb();
  const newTask = getLastInserted('tasks');
  if (newTask) {
    indexRecord('task', newTask.id, newTask.title, newTask.description || '', newTask.id, newTask.planned_date || now.slice(0, 10), newTask.status);
  }
  return newTask;
}

export function updateTask(id, taskData) {
  const now = new Date().toISOString();
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(taskData)) {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  fields.push('updated_at = ?');
  values.push(now);

  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ${id}`;
  db.run(sql, values);
  saveDb();

  const updatedRes = db.exec(`SELECT * FROM tasks WHERE id = ${id}`);
  const updated = resultToObjects(updatedRes)[0];
  if (updated) {
    indexRecord('task', updated.id, updated.title, updated.description || '', updated.id, updated.planned_date || now.slice(0, 10), updated.status);
  }
  return updated;
}

export function deleteTask(id) {
  db.run(`DELETE FROM tasks WHERE id = ${id}`);
  db.run(`DELETE FROM subtasks WHERE task_id = ${id}`);
  db.run(`DELETE FROM task_sessions WHERE task_id = ${id}`);
  db.run(`DELETE FROM notes WHERE task_id = ${id}`);
  db.run(`DELETE FROM task_attachments WHERE task_id = ${id}`);
  db.run(`DELETE FROM task_links WHERE source_task_id = ${id} OR target_task_id = ${id}`);
  removeIndexRecord('task', id);
  saveDb();
  return true;
}

// ALT GÖREV İŞLEMLERİ (SUBTASKS - Görev 18)
export function getSubtasks(taskId) {
  const res = db.exec(`SELECT * FROM subtasks WHERE task_id = ${taskId} ORDER BY sort_order ASC, id ASC`);
  return resultToObjects(res);
}

export function addSubtask(taskId, title) {
  const nowIso = new Date().toISOString();
  const maxRes = db.exec(`SELECT MAX(sort_order) as max_order FROM subtasks WHERE task_id = ${taskId}`);
  const maxObj = resultToObjects(maxRes)[0];
  const nextOrder = (maxObj && maxObj.max_order ? maxObj.max_order : 0) + 1;

  db.run(
    `INSERT INTO subtasks (task_id, title, completed, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [taskId, title, 0, nextOrder, nowIso, nowIso]
  );
  saveDb();
  const newSubtask = getLastInserted('subtasks');
  if (newSubtask) {
    indexRecord('subtask', newSubtask.id, newSubtask.title, newSubtask.title, newSubtask.task_id, nowIso.slice(0, 10), 'todo');
  }
  return newSubtask;
}

export function updateSubtask(id, data) {
  const nowIso = new Date().toISOString();
  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(data)) {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  fields.push('updated_at = ?');
  values.push(nowIso);

  const sql = `UPDATE subtasks SET ${fields.join(', ')} WHERE id = ${id}`;
  db.run(sql, values);

  const updatedRes = db.exec(`SELECT * FROM subtasks WHERE id = ${id}`);
  const updated = resultToObjects(updatedRes)[0];

  if (updated) {
    indexRecord('subtask', updated.id, updated.title, updated.title, updated.task_id, nowIso.slice(0, 10), updated.completed ? 'done' : 'todo');

    // Otomatik Ana Görev Durum Geçişleri
    const mainTaskRes = db.exec(`SELECT * FROM tasks WHERE id = ${updated.task_id}`);
    const mainTask = resultToObjects(mainTaskRes)[0];

    if (mainTask) {
      if (updated.completed && mainTask.status === 'todo') {
        updateTask(mainTask.id, { status: 'in_progress' });
      }

      if (mainTask.auto_complete_subtasks === 1) {
        const allSubs = getSubtasks(mainTask.id);
        const allDone = allSubs.length > 0 && allSubs.every((s) => s.completed === 1);
        if (allDone && mainTask.status !== 'done') {
          updateTask(mainTask.id, { status: 'done' });
        }
      }
    }
  }

  saveDb();
  return updated;
}

export function deleteSubtask(id) {
  db.run(`DELETE FROM subtasks WHERE id = ${id}`);
  removeIndexRecord('subtask', id);
  saveDb();
  return true;
}

export function reorderSubtasks(taskId, orderedIds) {
  const nowIso = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    db.run(`UPDATE subtasks SET sort_order = ?, updated_at = ? WHERE id = ?`, [index + 1, nowIso, id]);
  });
  saveDb();
  return true;
}

// SEANS İŞLEMLERİ & OTURUM NOTLARI (GÖREV 19)
export function startSession(taskId, type = 'manual') {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO task_sessions (task_id, start_time, type, notes) VALUES (?, ?, ?, ?)`,
    [taskId, now, type, '']
  );
  saveDb();

  if (taskId) {
    db.run(`UPDATE tasks SET status = 'in_progress', updated_at = '${now}' WHERE id = ${taskId} AND status = 'todo'`);
    saveDb();
  }

  return getLastInserted('task_sessions');
}

export function endSession(sessionId) {
  const now = new Date().toISOString();
  const sessionRes = db.exec(`SELECT * FROM task_sessions WHERE id = ${sessionId}`);
  const session = resultToObjects(sessionRes)[0];

  if (session && session.start_time) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(now);
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    db.run(
      `UPDATE task_sessions SET end_time = ?, duration_seconds = ? WHERE id = ?`,
      [now, durationSeconds, sessionId]
    );
    saveDb();
  }

  const updatedRes = db.exec(`SELECT * FROM task_sessions WHERE id = ${sessionId}`);
  return resultToObjects(updatedRes)[0];
}

export function updateSessionNotes(sessionId, notes) {
  db.run("UPDATE task_sessions SET notes = ? WHERE id = ?", [notes || '', sessionId]);
  saveDb();

  const updatedRes = db.exec(`SELECT * FROM task_sessions WHERE id = ${sessionId}`);
  const updated = resultToObjects(updatedRes)[0];
  if (updated) {
    if (notes && notes.trim()) {
      indexRecord('session_note', updated.id, `Oturum Notu #${updated.id}`, notes, updated.task_id, updated.start_time ? updated.start_time.slice(0, 10) : '');
    } else {
      removeIndexRecord('session_note', updated.id);
    }
  }
  return updated;
}

export function getTaskSessions(taskId) {
  const res = db.exec(`SELECT * FROM task_sessions WHERE task_id = ${taskId} ORDER BY start_time DESC`);
  return resultToObjects(res);
}

export function getAllSessions(startDate, endDate) {
  let query = 'SELECT * FROM task_sessions WHERE duration_seconds IS NOT NULL';
  if (startDate) query += ` AND start_time >= '${startDate}'`;
  if (endDate) query += ` AND start_time <= '${endDate}'`;
  query += ' ORDER BY start_time DESC';

  const res = db.exec(query);
  return resultToObjects(res);
}

// NOT İŞLEMLERİ
export function getNotes(taskId = null) {
  let query = 'SELECT * FROM notes';
  if (taskId) {
    query += ` WHERE task_id = ${taskId}`;
  }
  query += ' ORDER BY updated_at DESC';
  const res = db.exec(query);
  return resultToObjects(res);
}

export function addNote(content, taskId = null) {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO notes (task_id, content, created_at, updated_at) VALUES (?, ?, ?, ?)`,
    [taskId, content, now, now]
  );
  saveDb();
  const newNote = getLastInserted('notes');
  if (newNote) {
    const type = taskId ? 'task_note' : 'general_note';
    indexRecord(type, newNote.id, taskId ? `Görev Notu #${newNote.id}` : 'Genel Not', newNote.content, taskId, now.slice(0, 10));
  }
  return newNote;
}

export function updateNote(id, content, taskId = null) {
  const now = new Date().toISOString();
  db.run(
    `UPDATE notes SET content = ?, updated_at = ? WHERE id = ${id}`,
    [content, now]
  );
  saveDb();
  const updatedRes = db.exec(`SELECT * FROM notes WHERE id = ${id}`);
  const updated = resultToObjects(updatedRes)[0];
  if (updated) {
    const type = updated.task_id ? 'task_note' : 'general_note';
    indexRecord(type, updated.id, updated.task_id ? `Görev Notu #${updated.id}` : 'Genel Not', updated.content, updated.task_id, now.slice(0, 10));
  }
  return updated;
}

export function deleteNote(id) {
  const noteRes = db.exec(`SELECT * FROM notes WHERE id = ${id}`);
  const note = resultToObjects(noteRes)[0];
  if (note) {
    const type = note.task_id ? 'task_note' : 'general_note';
    removeIndexRecord(type, id);
  }
  db.run(`DELETE FROM notes WHERE id = ${id}`);
  saveDb();
  return true;
}

// ALIŞKANLIK İŞLEMLERİ
export function getHabits() {
  const res = db.exec('SELECT * FROM habits ORDER BY created_at DESC');
  return resultToObjects(res);
}

export function addHabit(habitData) {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO habits (name, description, color, frequency, goal_minutes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      habitData.name,
      habitData.description || '',
      habitData.color || '#5B8DEF',
      habitData.frequency || 'daily',
      habitData.goal_minutes || 0,
      now,
    ]
  );
  saveDb();
  return getLastInserted('habits');
}

export function deleteHabit(id) {
  db.run(`DELETE FROM habits WHERE id = ${id}`);
  db.run(`DELETE FROM habit_completions WHERE habit_id = ${id}`);
  saveDb();
  return true;
}

export function toggleHabitCompletion(habitId, dateStr, value = 1) {
  const now = new Date().toISOString();
  const check = db.exec(
    `SELECT * FROM habit_completions WHERE habit_id = ${habitId} AND date = '${dateStr}'`
  );
  const existing = resultToObjects(check);

  if (existing.length > 0) {
    db.run(`DELETE FROM habit_completions WHERE habit_id = ${habitId} AND date = '${dateStr}'`);
  } else {
    db.run(
      `INSERT INTO habit_completions (habit_id, date, value, completed_at) VALUES (?, ?, ?, ?)`,
      [habitId, dateStr, value, now]
    );
  }
  saveDb();
  return getHabitCompletions(habitId);
}

export function getHabitCompletions(habitId = null) {
  let res;
  if (habitId) {
    res = db.exec(`SELECT * FROM habit_completions WHERE habit_id = ${habitId} ORDER BY date DESC`);
  } else {
    res = db.exec('SELECT * FROM habit_completions ORDER BY date DESC');
  }
  return resultToObjects(res);
}

// EĞİTİMLER & KURSLAR
export function getCourses() {
  const res = db.exec('SELECT * FROM courses ORDER BY created_at DESC');
  return resultToObjects(res);
}

export function addCourse(courseData) {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO courses (title, url, category, total_spent_minutes, created_at) VALUES (?, ?, ?, ?, ?)`,
    [courseData.title, courseData.url || '', courseData.category || 'Yazılım', 0, now]
  );
  saveDb();
  return getLastInserted('courses');
}

export function deleteCourse(id) {
  db.run(`DELETE FROM courses WHERE id = ${id}`);
  db.run(`DELETE FROM course_sessions WHERE course_id = ${id}`);
  saveDb();
  return true;
}

export function startCourseSession(courseId) {
  const now = new Date().toISOString();
  db.run(`INSERT INTO course_sessions (course_id, start_time) VALUES (?, ?)`, [courseId, now]);
  saveDb();
  return getLastInserted('course_sessions');
}

export function endCourseSession(sessionId) {
  const now = new Date().toISOString();
  const sessionRes = db.exec(`SELECT * FROM course_sessions WHERE id = ${sessionId}`);
  const session = resultToObjects(sessionRes)[0];

  if (session && session.start_time) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(now);
    const durationSeconds = Math.round((endTime - startTime) / 1000);
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    db.run(`UPDATE course_sessions SET end_time = ?, duration_seconds = ? WHERE id = ?`, [now, durationSeconds, sessionId]);
    db.run(`UPDATE courses SET total_spent_minutes = total_spent_minutes + ? WHERE id = ?`, [durationMinutes, session.course_id]);

    const courseRes = db.exec(`SELECT * FROM courses WHERE id = ${session.course_id}`);
    const course = resultToObjects(courseRes)[0];

    if (course) {
      addTask({
        title: `[Eğitim] ${course.title} (${durationMinutes} dk Çalışıldı)`,
        description: `Eğitim Linki: ${course.url || 'Yok'}\nToplam Tamamlanan Çalışma Oturumu.`,
        estimated_minutes: durationMinutes,
        category: course.category || 'Eğitim',
        priority: 'medium',
        status: 'done',
      });
    }

    saveDb();
  }

  const updatedRes = db.exec(`SELECT * FROM course_sessions WHERE id = ${sessionId}`);
  return resultToObjects(updatedRes)[0];
}

// DOSYA EKLERİ (ATTACHMENTS - Görev 15)
export function getTaskAttachments(taskId) {
  const res = db.exec(`SELECT * FROM task_attachments WHERE task_id = ${taskId} ORDER BY added_at DESC`);
  return resultToObjects(res);
}

export function addTaskAttachment(taskId, name, filePath, type = 'file') {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO task_attachments (task_id, name, path, type, added_at) VALUES (?, ?, ?, ?, ?)`,
    [taskId, name, filePath, type, now]
  );
  saveDb();
  const newAtt = getLastInserted('task_attachments');
  if (newAtt) {
    indexRecord('attachment', newAtt.id, newAtt.name, `${newAtt.name} (${newAtt.path})`, taskId, now.slice(0, 10));
  }
  return newAtt;
}

export function deleteTaskAttachment(id) {
  removeIndexRecord('attachment', id);
  db.run(`DELETE FROM task_attachments WHERE id = ${id}`);
  saveDb();
  return true;
}

// GÜNLÜK (JOURNAL - Görev 16)
export function getJournalEntry(dateStr) {
  const res = db.exec(`SELECT * FROM journal_entries WHERE entry_date = '${dateStr}'`);
  return resultToObjects(res)[0] || null;
}

export function saveJournalEntry(dateStr, content, mood = 4) {
  const now = new Date().toISOString();
  const existing = getJournalEntry(dateStr);

  if (existing) {
    db.run(
      `UPDATE journal_entries SET content = ?, mood = ?, updated_at = ? WHERE entry_date = '${dateStr}'`,
      [content, mood, now]
    );
  } else {
    db.run(
      `INSERT INTO journal_entries (entry_date, content, mood, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [dateStr, content, mood, now, now]
    );
  }
  saveDb();
  const updated = getJournalEntry(dateStr);
  if (updated) {
    indexRecord('journal', updated.id, `Günlük - ${dateStr}`, updated.content || '', null, dateStr);
  }
  return updated;
}

export function searchJournal(queryStr) {
  const query = (queryStr || '').toLowerCase();
  const res = db.exec(`SELECT * FROM journal_entries WHERE LOWER(content) LIKE '%${query}%' ORDER BY entry_date DESC`);
  return resultToObjects(res);
}

export function getAllJournalEntries() {
  const res = db.exec('SELECT * FROM journal_entries ORDER BY entry_date DESC');
  return resultToObjects(res);
}

// GÖREV BAĞLANTILARI & KİLİT (TASK LINKS - Görev 17)
export function getTaskLinks(taskId) {
  const res = db.exec(
    `SELECT tl.*, 
            st.title as source_title, st.status as source_status,
            tt.title as target_title, tt.status as target_status
     FROM task_links tl
     LEFT JOIN tasks st ON st.id = tl.source_task_id
     LEFT JOIN tasks tt ON tt.id = tl.target_task_id
     WHERE tl.source_task_id = ${taskId} OR tl.target_task_id = ${taskId}`
  );
  const rows = resultToObjects(res);

  const blockingMe = rows.filter((r) => r.target_task_id === Number(taskId) && r.link_type === 'blocks');
  const blockedByMe = rows.filter((r) => r.source_task_id === Number(taskId) && r.link_type === 'blocks');

  return {
    blockingMe: blockingMe || [],
    blockedByMe: blockedByMe || [],
  };
}

export function addTaskLink(sourceTaskId, targetTaskId, linkType = 'blocks') {
  const now = new Date().toISOString();
  db.run(
    `INSERT OR IGNORE INTO task_links (source_task_id, target_task_id, link_type, created_at) VALUES (?, ?, ?, ?)`,
    [sourceTaskId, targetTaskId, linkType, now]
  );
  saveDb();
  return getLastInserted('task_links');
}

export function deleteTaskLink(id) {
  db.run(`DELETE FROM task_links WHERE id = ${id}`);
  saveDb();
  return true;
}

export function isTaskBlocked(taskId) {
  const res = db.exec(
    `SELECT tl.*, t.status, t.title FROM task_links tl
     JOIN tasks t ON t.id = tl.source_task_id
     WHERE tl.target_task_id = ${taskId} AND tl.link_type = 'blocks' AND t.status != 'done'`
  );
  const blockingTasks = resultToObjects(res) || [];
  return {
    isBlocked: blockingTasks.length > 0,
    blockingTasks: blockingTasks,
    blockers: blockingTasks,
  };
}

// AYAR İŞLEMLERİ
export function getSettings() {
  const sRes = db.exec('SELECT * FROM settings WHERE id = 1');
  const pRes = db.exec('SELECT * FROM pomodoro_settings WHERE id = 1');

  const settings = resultToObjects(sRes)[0] || {};
  const pomodoro = resultToObjects(pRes)[0] || {};
  return { ...settings, pomodoro };
}

export function updateSettings(newSettings) {
  if (newSettings.theme !== undefined) {
    db.run(`UPDATE settings SET theme = ? WHERE id = 1`, [newSettings.theme]);
  }
  if (newSettings.compact_mode !== undefined) {
    db.run(`UPDATE settings SET compact_mode = ? WHERE id = 1`, [newSettings.compact_mode ? 1 : 0]);
  }
  if (newSettings.hotkeys !== undefined) {
    db.run(`UPDATE settings SET hotkeys = ? WHERE id = 1`, [newSettings.hotkeys]);
  }

  if (newSettings.pomodoro) {
    const p = newSettings.pomodoro;
    db.run(
      `UPDATE pomodoro_settings SET focus_duration = ?, short_break = ?, long_break = ?, long_break_interval = ? WHERE id = 1`,
      [p.focus_duration, p.short_break, p.long_break, p.long_break_interval]
    );
  }

  saveDb();
  return getSettings();
}

// YEDEKLEME VE VERİ YÖNETİMİ
export function exportDatabase(targetPath) {
  saveDb();
  fs.copyFileSync(dbPath, targetPath);
  return true;
}

export function importDatabase(sourcePath) {
  fs.copyFileSync(sourcePath, dbPath);
  return true;
}

export function getYesterdaySummary() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

  const sessionsRes = db.exec(`
    SELECT SUM(duration_seconds) as total_seconds, COUNT(*) as session_count
    FROM task_sessions
    WHERE start_time >= '${startOfDay}' AND start_time <= '${endOfDay}' AND duration_seconds IS NOT NULL
  `);

  const completedRes = db.exec(`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE status = 'done' AND updated_at >= '${startOfDay}' AND updated_at <= '${endOfDay}'
  `);

  const sessObj = resultToObjects(sessionsRes)[0] || {};
  const compObj = resultToObjects(completedRes)[0] || {};

  return {
    totalSeconds: sessObj.total_seconds || 0,
    sessionCount: sessObj.session_count || 0,
    completedTasksCount: compObj.count || 0,
  };
}
