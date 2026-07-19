import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { KEYS } from "../utils/storage";
import { SUBJECT_PALETTE } from "../theme";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import {
  migrateIfNeeded,
  loadSubjects, loadSessions, loadTasks, loadNotes, loadGroupMembers,
  getSetting, setSetting,
  insertSubject, deleteSubject,
  insertSession,
  insertTask, updateTask, deleteTask,
  insertNote, updateNote as updateNoteDb, deleteNote,
  insertGroupMember, updateGroupMember, deleteGroupMember,
} from "../utils/database";

const StudyContext = createContext(null);

const DEFAULT_SUBJECTS = [];
const DEFAULT_POMODORO = { workMinutes: 25, breakMinutes: 5 };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function StudyProvider({ children }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [sessions, setSessions] = useState([]);
  const [todos, setTodos] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [profile, setProfileState] = useState({ name: "Dr. Shavi" });
  const [pomodoroSettings, setPomodoroSettingsState] = useState(DEFAULT_POMODORO);
  const [notes, setNotes] = useState([]);
  const [friends, setFriends] = useState([]);
  const [bgPalette, setBgPaletteState] = useState("pinkDusk");
  const [darkMode, setDarkModeState] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ------------------------------------------------------------------
  // On mount: init database, run migration (once), load all data
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await migrateIfNeeded();

        if (cancelled) return;

        const [subjRows, sessRows, taskRows, noteRows, gmRows] = await Promise.all([
          loadSubjects(),
          loadSessions(),
          loadTasks(),
          loadNotes(),
          loadGroupMembers(),
        ]);

        const [profileVal, pomoVal, onboardedVal, friendsVal, bgVal, darkVal] = await Promise.all([
          getSetting(KEYS.PROFILE, { name: "Dr. Shavi" }),
          getSetting(KEYS.POMODORO, DEFAULT_POMODORO),
          getSetting(KEYS.ONBOARDED, false),
          getSetting(KEYS.FRIENDS, []),
          getSetting(KEYS.BG_PALETTE, "pinkDusk"),
          getSetting(KEYS.DARK_MODE, false),
        ]);

        if (cancelled) return;

        setSubjects(subjRows);
        setSessions(sessRows);
        setTodos(taskRows);
        setNotes(noteRows);
        setGroupMembers(gmRows);
        setProfileState(profileVal);
        setPomodoroSettingsState(pomoVal);
        setOnboardedState(onboardedVal);
        setFriends(friendsVal);
        setBgPaletteState(bgVal);
        setDarkModeState(darkVal);
      } catch (e) {
        console.warn("Failed to initialize data:", e.message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ------------------------------------------------------------------
  // Sync profile total_seconds to Supabase (preserved from v2)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!loaded || !user) return;
    const totalSeconds = sessions.reduce((sum, s) => sum + s.seconds, 0);
    supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: profile.name,
        total_seconds: totalSeconds,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("Profile sync failed (will retry next change):", error.message);
      });
  }, [sessions, user, loaded, profile.name]);

  // ------------------------------------------------------------------
  // CRUD: Subjects
  // ------------------------------------------------------------------
  const addSubject = useCallback((name, color) => {
    const colorToUse = color || SUBJECT_PALETTE[Math.floor(Math.random() * SUBJECT_PALETTE.length)];
    const id = Date.now().toString();
    const subject = { id, name, color: colorToUse };

    setSubjects((prev) => [...prev, subject]);
    insertSubject(subject).catch((e) => console.warn("Failed to save subject:", e.message));
  }, []);

  const removeSubject = useCallback((id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    deleteSubject(id).catch((e) => console.warn("Failed to delete subject:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // CRUD: Sessions
  // ------------------------------------------------------------------
  const addSession = useCallback((subjectId, seconds, mode = "stopwatch") => {
    const id = Date.now().toString();
    const session = { id, subjectId, seconds, mode, date: todayStr() };

    setSessions((prev) => [...prev, session]);
    insertSession(session).catch((e) => console.warn("Failed to save session:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // CRUD: Todos
  // ------------------------------------------------------------------
  const addTodo = useCallback((text, date) => {
    const id = Date.now().toString();
    const todo = { id, text, done: false, date: date || todayStr() };

    setTodos((prev) => [...prev, todo]);
    insertTask(todo).catch((e) => console.warn("Failed to save task:", e.message));
  }, []);

  const toggleTodo = useCallback((id) => {
    let newDone = false;
    setTodos((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          newDone = !t.done;
          return { ...t, done: newDone };
        }
        return t;
      });
      return next;
    });
    updateTask(id, { done: newDone }).catch((e) => console.warn("Failed to update task:", e.message));
  }, []);

  const removeTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    deleteTask(id).catch((e) => console.warn("Failed to delete task:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // CRUD: Group members (unchanged API)
  // ------------------------------------------------------------------
  const addGroupMember = useCallback((name, color) => {
    const id = Date.now().toString();
    const member = { id, name, color, totalSeconds: 0 };

    setGroupMembers((prev) => [...prev, member]);
    insertGroupMember(member).catch((e) => console.warn("Failed to save group member:", e.message));
  }, []);

  const logGroupMemberTime = useCallback((id, seconds) => {
    setGroupMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, totalSeconds: m.totalSeconds + seconds };
        updateGroupMember(id, { totalSeconds: updated.totalSeconds }).catch(
          (e) => console.warn("Failed to update group member:", e.message)
        );
        return updated;
      })
    );
  }, []);

  const removeGroupMember = useCallback((id) => {
    setGroupMembers((prev) => prev.filter((m) => m.id !== id));
    deleteGroupMember(id).catch((e) => console.warn("Failed to delete group member:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // Onboarding
  // ------------------------------------------------------------------
  const completeOnboarding = useCallback((name) => {
    if (name && name.trim()) {
      const updated = { ...profile, name: name.trim() };
      setProfileState(updated);
      setSetting(KEYS.PROFILE, updated).catch((e) => console.warn("Failed to save profile:", e.message));
    }
    setOnboardedState(true);
    setSetting(KEYS.ONBOARDED, true).catch((e) => console.warn("Failed to save onboarded:", e.message));
  }, [profile]);

  // ------------------------------------------------------------------
  // CRUD: Notes
  // ------------------------------------------------------------------
  const NOTE_COLORS = ["#FFF3B0", "#FFD6E8", "#D6EAFF", "#E3FFD6", "#F0D6FF"];

  const addNote = useCallback((text) => {
    const id = Date.now().toString();
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const rotation = Math.round((Math.random() - 0.5) * 8);
    const note = { id, text, color, rotation };

    setNotes((prev) => [...prev, note]);
    insertNote(note).catch((e) => console.warn("Failed to save note:", e.message));
  }, []);

  const updateNote = useCallback((id, text) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    updateNoteDb(id, text).catch((e) => console.warn("Failed to update note:", e.message));
  }, []);

  const removeNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    deleteNote(id).catch((e) => console.warn("Failed to delete note:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // Friends
  // ------------------------------------------------------------------
  const addFriend = useCallback((friendUsername) => {
    const clean = friendUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return;
    setFriends((prev) => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      setSetting(KEYS.FRIENDS, next).catch((e) => console.warn("Failed to save friends:", e.message));
      return next;
    });
  }, []);

  const removeFriend = useCallback((friendUsername) => {
    setFriends((prev) => {
      const next = prev.filter((f) => f !== friendUsername);
      setSetting(KEYS.FRIENDS, next).catch((e) => console.warn("Failed to save friends:", e.message));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Profile
  // ------------------------------------------------------------------
  const setProfile = useCallback((value) => {
    setProfileState(value);
    setSetting(KEYS.PROFILE, value).catch((e) => console.warn("Failed to save profile:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // Pomodoro settings
  // ------------------------------------------------------------------
  const setPomodoroSettings = useCallback((value) => {
    setPomodoroSettingsState(value);
    setSetting(KEYS.POMODORO, value).catch((e) => console.warn("Failed to save pomodoro settings:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // UI preferences
  // ------------------------------------------------------------------
  const setBgPalette = useCallback((id) => {
    setBgPaletteState(id);
    setSetting(KEYS.BG_PALETTE, id).catch((e) => console.warn("Failed to save bg palette:", e.message));
  }, []);

  const setDarkMode = useCallback((value) => {
    setDarkModeState(value);
    setSetting(KEYS.DARK_MODE, value).catch((e) => console.warn("Failed to save dark mode:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // Context value (identical API to original)
  // ------------------------------------------------------------------
  const value = {
    subjects, sessions, todos, groupMembers, profile, pomodoroSettings, notes, onboarded, loaded,
    friends, bgPalette, darkMode,
    addSession, addSubject, removeSubject,
    addTodo, toggleTodo, removeTodo,
    addGroupMember, logGroupMemberTime, removeGroupMember,
    addNote, updateNote, removeNote,
    addFriend, removeFriend, setBgPalette, setDarkMode,
    setProfile, setPomodoroSettings, completeOnboarding,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
