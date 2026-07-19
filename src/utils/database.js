import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "./storage";

const DB_NAME = "grind_v3a.db";

let db = null;

export async function getDb() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initTables();
  return db;
}

async function initTables() {
  const d = await getDb();
  await d.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      subjectId TEXT,
      seconds INTEGER NOT NULL,
      mode TEXT NOT NULL DEFAULT 'stopwatch',
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      text TEXT NOT NULL,
      color TEXT NOT NULL,
      rotation REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      totalSeconds INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

// ------------------------------------------------------------------
// Migration from AsyncStorage → SQLite
// ------------------------------------------------------------------

export async function migrateIfNeeded() {
  const d = await getDb();
  const row = await d.getFirstAsync(
    "SELECT value FROM app_settings WHERE key = ?",
    "_migration_v3a_done"
  );
  if (row) return false;

  // Load all keys from AsyncStorage
  const entries = await AsyncStorage.multiGet(Object.values(KEYS));

  for (const [key, raw] of entries) {
    if (raw === null) continue;

    let parsed;
    try { parsed = JSON.parse(raw); } catch { continue; }

    switch (key) {
      case KEYS.SUBJECTS: {
        if (Array.isArray(parsed)) {
          for (const s of parsed) {
            await d.runAsync(
              "INSERT OR REPLACE INTO subjects (id, name, color) VALUES (?, ?, ?)",
              s.id, s.name, s.color
            );
          }
        }
        break;
      }
      case KEYS.SESSIONS: {
        if (Array.isArray(parsed)) {
          for (const s of parsed) {
            await d.runAsync(
              "INSERT OR REPLACE INTO study_sessions (id, subjectId, seconds, mode, date) VALUES (?, ?, ?, ?, ?)",
              s.id, s.subjectId, s.seconds, s.mode, s.date
            );
          }
        }
        break;
      }
      case KEYS.TODOS: {
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            await d.runAsync(
              "INSERT OR REPLACE INTO tasks (id, text, done, date) VALUES (?, ?, ?, ?)",
              t.id, t.text, t.done ? 1 : 0, t.date
            );
          }
        }
        break;
      }
      case KEYS.NOTES: {
        if (Array.isArray(parsed)) {
          for (const n of parsed) {
            await d.runAsync(
              "INSERT OR REPLACE INTO notes (id, text, color, rotation) VALUES (?, ?, ?, ?)",
              n.id, n.text, n.color, n.rotation
            );
          }
        }
        break;
      }
      case KEYS.GROUP_MEMBERS: {
        if (Array.isArray(parsed)) {
          for (const m of parsed) {
            await d.runAsync(
              "INSERT OR REPLACE INTO group_members (id, name, color, totalSeconds) VALUES (?, ?, ?, ?)",
              m.id, m.name, m.color, m.totalSeconds
            );
          }
        }
        break;
      }
      default: {
        // Store as key-value for profile, pomodoro, onboarded, friends, bg_palette, dark_mode, etc.
        await d.runAsync(
          "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
          key, raw
        );
      }
    }
  }

  // Mark migration done
  await d.runAsync(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
    "_migration_v3a_done", JSON.stringify(true)
  );

  // Clear old AsyncStorage keys
  try {
    const keysToRemove = Object.values(KEYS);
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (e) {
    console.warn("Failed to clear old AsyncStorage keys:", e.message);
  }

  return true;
}

// ------------------------------------------------------------------
// Table load helpers (returns arrays or fallback)
// ------------------------------------------------------------------

export async function loadSubjects() {
  const d = await getDb();
  const rows = await d.getAllAsync("SELECT * FROM subjects");
  return rows || [];
}

export async function loadSessions() {
  const d = await getDb();
  const rows = await d.getAllAsync("SELECT * FROM study_sessions ORDER BY rowid");
  return rows || [];
}

export async function loadTasks() {
  const d = await getDb();
  const rows = await d.getAllAsync("SELECT * FROM tasks ORDER BY rowid");
  return (rows || []).map((r) => ({ ...r, done: !!r.done }));
}

export async function loadNotes() {
  const d = await getDb();
  const rows = await d.getAllAsync("SELECT * FROM notes");
  return rows || [];
}

export async function loadGroupMembers() {
  const d = await getDb();
  const rows = await d.getAllAsync("SELECT * FROM group_members");
  return rows || [];
}

// ------------------------------------------------------------------
// Settings (key-value)
// ------------------------------------------------------------------

export async function getSetting(key, fallback = null) {
  const d = await getDb();
  const row = await d.getFirstAsync("SELECT value FROM app_settings WHERE key = ?", key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export async function setSetting(key, value) {
  const d = await getDb();
  await d.runAsync(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
    key, JSON.stringify(value)
  );
}

export async function getAllSettings() {
  const d = await getDb();
  const rows = await d.getAllAsync("SELECT * FROM app_settings");
  const map = {};
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value); } catch { map[r.key] = r.value; }
  }
  return map;
}

// ------------------------------------------------------------------
// Subject CRUD
// ------------------------------------------------------------------

export async function insertSubject(subject) {
  const d = await getDb();
  await d.runAsync(
    "INSERT INTO subjects (id, name, color) VALUES (?, ?, ?)",
    subject.id, subject.name, subject.color
  );
}

export async function deleteSubject(id) {
  const d = await getDb();
  await d.runAsync("DELETE FROM subjects WHERE id = ?", id);
}

// ------------------------------------------------------------------
// Session CRUD
// ------------------------------------------------------------------

export async function insertSession(session) {
  const d = await getDb();
  await d.runAsync(
    "INSERT INTO study_sessions (id, subjectId, seconds, mode, date) VALUES (?, ?, ?, ?, ?)",
    session.id, session.subjectId, session.seconds, session.mode, session.date
  );
}

// ------------------------------------------------------------------
// Task CRUD
// ------------------------------------------------------------------

export async function insertTask(task) {
  const d = await getDb();
  await d.runAsync(
    "INSERT INTO tasks (id, text, done, date) VALUES (?, ?, ?, ?)",
    task.id, task.text, task.done ? 1 : 0, task.date
  );
}

export async function updateTask(id, changes) {
  const d = await getDb();
  if (changes.done !== undefined) {
    await d.runAsync("UPDATE tasks SET done = ? WHERE id = ?", changes.done ? 1 : 0, id);
  }
}

export async function deleteTask(id) {
  const d = await getDb();
  await d.runAsync("DELETE FROM tasks WHERE id = ?", id);
}

// ------------------------------------------------------------------
// Note CRUD
// ------------------------------------------------------------------

export async function insertNote(note) {
  const d = await getDb();
  await d.runAsync(
    "INSERT INTO notes (id, text, color, rotation) VALUES (?, ?, ?, ?)",
    note.id, note.text, note.color, note.rotation
  );
}

export async function updateNote(id, text) {
  const d = await getDb();
  await d.runAsync("UPDATE notes SET text = ? WHERE id = ?", text, id);
}

export async function deleteNote(id) {
  const d = await getDb();
  await d.runAsync("DELETE FROM notes WHERE id = ?", id);
}

// ------------------------------------------------------------------
// Group member CRUD
// ------------------------------------------------------------------

export async function insertGroupMember(member) {
  const d = await getDb();
  await d.runAsync(
    "INSERT INTO group_members (id, name, color, totalSeconds) VALUES (?, ?, ?, ?)",
    member.id, member.name, member.color, member.totalSeconds || 0
  );
}

export async function updateGroupMember(id, changes) {
  const d = await getDb();
  if (changes.totalSeconds !== undefined) {
    await d.runAsync("UPDATE group_members SET totalSeconds = ? WHERE id = ?", changes.totalSeconds, id);
  }
}

export async function deleteGroupMember(id) {
  const d = await getDb();
  await d.runAsync("DELETE FROM group_members WHERE id = ?", id);
}
