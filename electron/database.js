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
      type TEXT DEFAULT 'manual'
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

  // Güvenli Migrasyon
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
        '#A855F7',
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
  return getLastInserted('tasks');
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

  const updated = db.exec(`SELECT * FROM tasks WHERE id = ${id}`);
  return resultToObjects(updated)[0];
}

export function deleteTask(id) {
  db.run(`DELETE FROM tasks WHERE id = ${id}`);
  db.run(`DELETE FROM subtasks WHERE task_id = ${id}`);
  db.run(`DELETE FROM task_sessions WHERE task_id = ${id}`);
  db.run(`DELETE FROM notes WHERE task_id = ${id}`);
  db.run(`DELETE FROM task_attachments WHERE task_id = ${id}`);
  db.run(`DELETE FROM task_links WHERE source_task_id = ${id} OR target_task_id = ${id}`);
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
  return getLastInserted('subtasks');
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

  // Otomatik geçiş kontrolleri
  const subtaskObj = resultToObjects(db.exec(`SELECT * FROM subtasks WHERE id = ${id}`))[0];
  if (subtaskObj) {
    const taskId = subtaskObj.task_id;
    const taskObj = resultToObjects(db.exec(`SELECT * FROM tasks WHERE id = ${taskId}`))[0];

    if (taskObj) {
      // 1. Alt görev tamamlandığında ana görev 'todo' ise 'in_progress' yap
      if (data.completed === 1 && taskObj.status === 'todo') {
        db.run(`UPDATE tasks SET status = 'in_progress', updated_at = ? WHERE id = ${taskId}`, [nowIso]);
      }

      // 2. auto_complete_subtasks = 1 ise ve TÜM alt görevler tamamlanmışsa 'done' yap
      if (taskObj.auto_complete_subtasks === 1) {
        const uncompletedRes = db.exec(`SELECT COUNT(*) as count FROM subtasks WHERE task_id = ${taskId} AND completed = 0`);
        const uncompletedCount = uncompletedRes[0].values[0][0];

        if (uncompletedCount === 0) {
          db.run(`UPDATE tasks SET status = 'done', updated_at = ? WHERE id = ${taskId}`, [nowIso]);
        }
      }
    }
  }

  saveDb();
  return resultToObjects(db.exec(`SELECT * FROM subtasks WHERE id = ${id}`))[0];
}

export function deleteSubtask(id) {
  db.run(`DELETE FROM subtasks WHERE id = ${id}`);
  saveDb();
  return true;
}

export function reorderSubtasks(taskId, orderedIds) {
  const nowIso = new Date().toISOString();
  orderedIds.forEach((id, index) => {
    db.run(`UPDATE subtasks SET sort_order = ?, updated_at = ? WHERE id = ?`, [index + 1, nowIso, id]);
  });
  saveDb();
  return getSubtasks(taskId);
}

// OTURUM İŞLEMLERİ
export function startSession(taskId, type = 'manual') {
  const startTime = new Date().toISOString();
  db.run(
    `INSERT INTO task_sessions (task_id, start_time, type) VALUES (?, ?, ?)`,
    [taskId || null, startTime, type]
  );

  if (taskId) {
    db.run(`UPDATE tasks SET status = 'in_progress', updated_at = ? WHERE id = ${taskId}`, [startTime]);
  }

  saveDb();
  return getLastInserted('task_sessions');
}

export function endSession(sessionId) {
  const endTime = new Date().toISOString();
  const res = db.exec(`SELECT * FROM task_sessions WHERE id = ${sessionId}`);
  const sessions = resultToObjects(res);
  if (!sessions.length) return null;

  const session = sessions[0];
  const startMs = new Date(session.start_time).getTime();
  const endMs = new Date(endTime).getTime();
  const durationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

  db.run(
    `UPDATE task_sessions SET end_time = ?, duration_seconds = ? WHERE id = ${sessionId}`,
    [endTime, durationSeconds]
  );
  saveDb();

  const updated = db.exec(`SELECT * FROM task_sessions WHERE id = ${sessionId}`);
  return resultToObjects(updated)[0];
}

export function getTaskSessions(taskId) {
  if (taskId) {
    const res = db.exec(`SELECT * FROM task_sessions WHERE task_id = ${taskId} ORDER BY start_time DESC`);
    return resultToObjects(res);
  }
  const res = db.exec('SELECT * FROM task_sessions ORDER BY start_time DESC');
  return resultToObjects(res);
}

export function getAllSessions(startDate, endDate) {
  let res;
  if (startDate && endDate) {
    res = db.exec(`
      SELECT s.*, t.title as task_title, t.color as task_color
      FROM task_sessions s
      LEFT JOIN tasks t ON s.task_id = t.id
      WHERE s.start_time >= '${startDate}' AND s.start_time <= '${endDate}'
      ORDER BY s.start_time DESC
    `);
  } else {
    res = db.exec(`
      SELECT s.*, t.title as task_title, t.color as task_color
      FROM task_sessions s
      LEFT JOIN tasks t ON s.task_id = t.id
      ORDER BY s.start_time DESC
    `);
  }
  return resultToObjects(res);
}

// GÖREV EKLERİ
export function getTaskAttachments(taskId) {
  const res = db.exec(`SELECT * FROM task_attachments WHERE task_id = ${taskId} ORDER BY added_at DESC`);
  return resultToObjects(res);
}

export function addTaskAttachment(taskId, name, pathStr, type = 'file') {
  const nowIso = new Date().toISOString();
  db.run(
    `INSERT INTO task_attachments (task_id, name, path, type, added_at) VALUES (?, ?, ?, ?, ?)`,
    [taskId, name, pathStr, type, nowIso]
  );
  saveDb();
  return getLastInserted('task_attachments');
}

export function deleteTaskAttachment(id) {
  db.run(`DELETE FROM task_attachments WHERE id = ${id}`);
  saveDb();
  return true;
}

// AKIŞ GÜNLÜĞÜ
export function getJournalEntry(dateStr) {
  const res = db.exec(`SELECT * FROM journal_entries WHERE entry_date = '${dateStr}'`);
  return resultToObjects(res)[0] || null;
}

export function saveJournalEntry(dateStr, content, mood = 4) {
  const nowIso = new Date().toISOString();
  const existing = getJournalEntry(dateStr);

  if (existing) {
    db.run(
      `UPDATE journal_entries SET content = ?, mood = ?, updated_at = ? WHERE entry_date = ?`,
      [content, mood, nowIso, dateStr]
    );
  } else {
    db.run(
      `INSERT INTO journal_entries (entry_date, content, mood, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [dateStr, content, mood, nowIso, nowIso]
    );
  }
  saveDb();
  return getJournalEntry(dateStr);
}

export function searchJournal(query) {
  const res = db.exec(`SELECT * FROM journal_entries WHERE content LIKE '%${query}%' ORDER BY entry_date DESC`);
  return resultToObjects(res);
}

export function getAllJournalEntries() {
  const res = db.exec('SELECT * FROM journal_entries ORDER BY entry_date DESC');
  return resultToObjects(res);
}

// GÖREV BAĞLANTILARI
export function getTaskLinks(taskId) {
  const sourceRes = db.exec(`
    SELECT l.*, t.title as target_title, t.status as target_status
    FROM task_links l
    LEFT JOIN tasks t ON l.target_task_id = t.id
    WHERE l.source_task_id = ${taskId}
  `);
  const targetRes = db.exec(`
    SELECT l.*, t.title as source_title, t.status as source_status
    FROM task_links l
    LEFT JOIN tasks t ON l.source_task_id = t.id
    WHERE l.target_task_id = ${taskId}
  `);

  return {
    blockingMe: resultToObjects(sourceRes),
    blockedByMe: resultToObjects(targetRes),
  };
}

export function addTaskLink(sourceTaskId, targetTaskId, linkType = 'blocks') {
  if (sourceTaskId === targetTaskId) return null;
  const nowIso = new Date().toISOString();
  try {
    db.run(
      `INSERT INTO task_links (source_task_id, target_task_id, link_type, created_at) VALUES (?, ?, ?, ?)`,
      [sourceTaskId, targetTaskId, linkType, nowIso]
    );
    saveDb();
  } catch (e) {
    console.error('Task link error:', e);
  }
  return getTaskLinks(sourceTaskId);
}

export function deleteTaskLink(id) {
  db.run(`DELETE FROM task_links WHERE id = ${id}`);
  saveDb();
  return true;
}

export function isTaskBlocked(taskId) {
  const res = db.exec(`
    SELECT l.*, t.title, t.status
    FROM task_links l
    JOIN tasks t ON l.target_task_id = t.id
    WHERE l.source_task_id = ${taskId} AND l.link_type = 'blocks' AND t.status != 'done'
  `);
  const blockers = resultToObjects(res);
  return {
    isBlocked: blockers.length > 0,
    blockers,
  };
}

// NOT İŞLEMLERİ
export function getNotes(taskId = null) {
  let res;
  if (taskId) {
    res = db.exec(`SELECT * FROM notes WHERE task_id = ${taskId} ORDER BY updated_at DESC`);
  } else {
    res = db.exec('SELECT * FROM notes WHERE task_id IS NULL ORDER BY updated_at DESC');
  }
  return resultToObjects(res);
}

export function addNote(content, taskId = null) {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO notes (task_id, content, created_at, updated_at) VALUES (?, ?, ?, ?)`,
    [taskId || null, content, now, now]
  );
  saveDb();
  return getLastInserted('notes');
}

export function updateNote(id, content) {
  const now = new Date().toISOString();
  db.run(`UPDATE notes SET content = ?, updated_at = ? WHERE id = ${id}`, [content, now]);
  saveDb();

  const updated = db.exec(`SELECT * FROM notes WHERE id = ${id}`);
  return resultToObjects(updated)[0];
}

export function deleteNote(id) {
  db.run(`DELETE FROM notes WHERE id = ${id}`);
  saveDb();
  return true;
}

// EĞİTİM İŞLEMLERİ
export function getCourses() {
  const res = db.exec('SELECT * FROM courses ORDER BY created_at DESC');
  return resultToObjects(res);
}

export function addCourse(courseData) {
  const nowIso = new Date().toISOString();
  db.run(
    `INSERT INTO courses (title, url, category, total_spent_minutes, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      courseData.title,
      courseData.url || '',
      courseData.category || 'Yazılım',
      0,
      nowIso,
    ]
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
  const startTime = new Date().toISOString();
  db.run(
    `INSERT INTO course_sessions (course_id, start_time) VALUES (?, ?)`,
    [courseId, startTime]
  );
  saveDb();
  return getLastInserted('course_sessions');
}

export function endCourseSession(sessionId) {
  const endTime = new Date().toISOString();
  const res = db.exec(`SELECT * FROM course_sessions WHERE id = ${sessionId}`);
  const sessions = resultToObjects(res);
  if (!sessions.length) return null;

  const session = sessions[0];
  const startMs = new Date(session.start_time).getTime();
  const endMs = new Date(endTime).getTime();
  const durationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  db.run(
    `UPDATE course_sessions SET end_time = ?, duration_seconds = ? WHERE id = ${sessionId}`,
    [endTime, durationSeconds]
  );

  db.run(
    `UPDATE courses SET total_spent_minutes = total_spent_minutes + ${durationMinutes} WHERE id = ${session.course_id}`
  );

  const courseObj = resultToObjects(db.exec(`SELECT * FROM courses WHERE id = ${session.course_id}`))[0];

  if (courseObj) {
    db.run(
      `INSERT INTO tasks (title, description, estimated_minutes, priority, category, color, created_at, updated_at, status, planned_date, planned_start_time, task_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `[Eğitim] ${courseObj.title} - ${durationMinutes}dk Çalışma`,
        `Eğitim seansı başarıyla tamamlandı. (${courseObj.category})`,
        durationMinutes,
        'medium',
        'Eğitim',
        '#6366F1',
        endTime,
        endTime,
        'done',
        endTime.slice(0, 10),
        endTime.slice(11, 16),
        'task',
      ]
    );
  }

  saveDb();
  return getCourses();
}

// ALIŞKANLIK İŞLEMLERİ
export function getHabits() {
  const res = db.exec('SELECT * FROM habits ORDER BY created_at DESC');
  return resultToObjects(res);
}

export function addHabit(habitData) {
  const nowIso = new Date().toISOString();
  db.run(
    `INSERT INTO habits (name, description, color, frequency, goal_minutes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      habitData.name,
      habitData.description || '',
      habitData.color || '#5B8DEF',
      habitData.frequency || 'daily',
      habitData.goal_minutes || 0,
      nowIso,
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
  const nowIso = new Date().toISOString();
  const existing = db.exec(
    `SELECT * FROM habit_completions WHERE habit_id = ${habitId} AND date = '${dateStr}'`
  );
  const completions = resultToObjects(existing);

  if (completions.length > 0) {
    db.run(`DELETE FROM habit_completions WHERE id = ${completions[0].id}`);
  } else {
    db.run(
      `INSERT INTO habit_completions (habit_id, date, value, completed_at) VALUES (?, ?, ?, ?)`,
      [habitId, dateStr, value, nowIso]
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
