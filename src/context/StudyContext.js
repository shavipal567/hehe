import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS, loadData, saveData } from "../utils/storage";
import { SUBJECT_PALETTE } from "../theme";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";

const StudyContext = createContext(null);

const DEFAULT_SUBJECTS = [];
const DEFAULT_POMODORO = { workMinutes: 25, breakMinutes: 5 };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function mapSessionFromDB(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    seconds: row.seconds,
    mode: row.mode,
    date: row.date,
  };
}

function mapSessionToDB(row) {
  return {
    subject_id: row.subjectId,
    seconds: row.seconds,
    mode: row.mode,
    date: row.date,
  };
}

export function StudyProvider({ children }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [sessions, setSessions] = useState([]);
  const [todos, setTodos] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [profile, setProfile] = useState({ name: "Dr. Shavi" });
  const [pomodoroSettings, setPomodoroSettings] = useState(DEFAULT_POMODORO);
  const [notes, setNotes] = useState([]);
  const [friends, setFriends] = useState([]);
  const [bgPalette, setBgPaletteState] = useState("pinkDusk");
  const [darkMode, setDarkModeState] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const tempIdRef = useRef(0);

  // ------------------------------------------------------------------
  // Phase 1: Load preferences from AsyncStorage (non-migrated keys)
  // These load instantly so the UI can render immediately.
  // ------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const [g, p, onb, fr, bg, dm] = await Promise.all([
        loadData(KEYS.GROUP_MEMBERS, []),
        loadData(KEYS.PROFILE, { name: "Dr. Shavi" }),
        loadData(KEYS.ONBOARDED, false),
        loadData(KEYS.FRIENDS, []),
        loadData(KEYS.BG_PALETTE, "pinkDusk"),
        loadData(KEYS.DARK_MODE, false),
      ]);
      setGroupMembers(g);
      setProfile(p);
      setOnboardedState(onb);
      setFriends(fr);
      setBgPaletteState(bg);
      setDarkModeState(dm);
      setLoaded(true);
    })();
  }, []);

  // ------------------------------------------------------------------
  // Phase 2: When user is known, migrate local data (if needed) and
  // then load business data from Supabase.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!loaded || !user) return;

    (async () => {
      setDataLoading(true);
      const migrated = await loadData(KEYS.MIGRATION_V3, false);

      if (!migrated) {
        const migrationOk = await attemptMigration(user.id);
        if (!migrationOk) {
          // Migration failed — load from AsyncStorage so the app still works
          const [oldSubjects, oldSessions, oldTodos, oldNotes, oldPomo] = await Promise.all([
            loadData(KEYS.SUBJECTS, DEFAULT_SUBJECTS),
            loadData(KEYS.SESSIONS, []),
            loadData(KEYS.TODOS, []),
            loadData(KEYS.NOTES, []),
            loadData(KEYS.POMODORO, DEFAULT_POMODORO),
          ]);
          setSubjects(oldSubjects);
          setSessions(oldSessions);
          setTodos(oldTodos);
          setNotes(oldNotes);
          setPomodoroSettings(oldPomo);
          setDataLoading(false);
          return;
        }
      }

      // Load business data from Supabase
      await loadDataFromSupabase(user.id);
      setDataLoading(false);
    })();
  }, [loaded, user]);

  // ------------------------------------------------------------------
  // Migration helper
  // ------------------------------------------------------------------
  async function attemptMigration(userId) {
    try {
      const [oldSubjects, oldSessions, oldTodos, oldNotes, oldPomo] = await Promise.all([
        loadData(KEYS.SUBJECTS, []),
        loadData(KEYS.SESSIONS, []),
        loadData(KEYS.TODOS, []),
        loadData(KEYS.NOTES, []),
        loadData(KEYS.POMODORO, null),
      ]);

      const hasData = oldSubjects.length > 0 || oldSessions.length > 0 || oldTodos.length > 0 || oldNotes.length > 0 || oldPomo;
      if (!hasData) {
        // Nothing to migrate — just mark as done
        await saveData(KEYS.MIGRATION_V3, true);
        return true;
      }

      const idMap = {};

      // 1. Migrate subjects
      if (oldSubjects.length > 0) {
        const { data, error } = await supabase
          .from("subjects")
          .insert(oldSubjects.map((s) => ({ user_id: userId, name: s.name, color: s.color })))
          .select("id");
        if (error) throw new Error("subjects: " + error.message);
        data.forEach((d, i) => { idMap[oldSubjects[i].id] = d.id; });
        setSubjects(oldSubjects.map((s, i) => ({ id: data[i].id, name: s.name, color: s.color })));
      }

      // 2. Migrate notes
      if (oldNotes.length > 0) {
        const { data, error } = await supabase
          .from("notes")
          .insert(oldNotes.map((n) => ({ user_id: userId, text: n.text, color: n.color, rotation: n.rotation })))
          .select("id");
        if (error) throw new Error("notes: " + error.message);
        setNotes(data.map((d, i) => ({ id: d.id, text: oldNotes[i].text, color: oldNotes[i].color, rotation: oldNotes[i].rotation })));
      }

      // 3. Migrate tasks
      if (oldTodos.length > 0) {
        const { data, error } = await supabase
          .from("tasks")
          .insert(oldTodos.map((t) => ({ user_id: userId, text: t.text, done: t.done, date: t.date })))
          .select("id");
        if (error) throw new Error("tasks: " + error.message);
        setTodos(data.map((d, i) => ({ id: d.id, text: oldTodos[i].text, done: oldTodos[i].done, date: oldTodos[i].date })));
      }

      // 4. Migrate sessions
      if (oldSessions.length > 0) {
        const { error } = await supabase
          .from("study_sessions")
          .insert(oldSessions.map((s) => ({
            user_id: userId,
            subject_id: idMap[s.subjectId] || null,
            seconds: s.seconds,
            mode: s.mode,
            date: s.date,
          })));
        if (error) throw new Error("sessions: " + error.message);
        setSessions(oldSessions.map((s) => ({
          id: s.id,
          subjectId: idMap[s.subjectId] || s.subjectId,
          seconds: s.seconds,
          mode: s.mode,
          date: s.date,
        })));
      }

      // 5. Migrate pomodoro settings
      if (oldPomo) {
        const { error } = await supabase
          .from("profiles")
          .update({
            pomodoro_work_minutes: oldPomo.workMinutes,
            pomodoro_break_minutes: oldPomo.breakMinutes,
          })
          .eq("id", userId);
        if (error) throw new Error("pomodoro: " + error.message);
        setPomodoroSettings(oldPomo);
      }

      // 6. Mark migration complete and clean up old keys
      await Promise.all([
        saveData(KEYS.MIGRATION_V3, true),
        AsyncStorage.removeItem(KEYS.SUBJECTS),
        AsyncStorage.removeItem(KEYS.SESSIONS),
        AsyncStorage.removeItem(KEYS.TODOS),
        AsyncStorage.removeItem(KEYS.NOTES),
        AsyncStorage.removeItem(KEYS.POMODORO),
      ]);

      return true;
    } catch (e) {
      console.warn("Migration failed — will retry on next launch:", e.message);
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Supabase data loader (used after migration or on subsequent launches)
  // ------------------------------------------------------------------
  async function loadDataFromSupabase(userId) {
    try {
      const [subRes, sessRes, tasksRes, notesRes, profileRes] = await Promise.all([
        supabase.from("subjects").select("id, name, color").eq("user_id", userId).order("created_at"),
        supabase.from("study_sessions").select("id, subject_id, seconds, mode, date").eq("user_id", userId).order("created_at"),
        supabase.from("tasks").select("id, text, done, date").eq("user_id", userId).order("created_at"),
        supabase.from("notes").select("id, text, color, rotation").eq("user_id", userId).order("created_at"),
        supabase.from("profiles").select("pomodoro_work_minutes, pomodoro_break_minutes").eq("id", userId).maybeSingle(),
      ]);

      if (!subRes.error) setSubjects(subRes.data || []);
      if (!sessRes.error) setSessions((sessRes.data || []).map(mapSessionFromDB));
      if (!tasksRes.error) setTodos(tasksRes.data || []);
      if (!notesRes.error) setNotes(notesRes.data || []);

      if (!profileRes.error && profileRes.data) {
        setPomodoroSettings({
          workMinutes: profileRes.data.pomodoro_work_minutes,
          breakMinutes: profileRes.data.pomodoro_break_minutes,
        });
      }

      if (subRes.error) console.warn("Failed to load subjects:", subRes.error.message);
      if (sessRes.error) console.warn("Failed to load sessions:", sessRes.error.message);
      if (tasksRes.error) console.warn("Failed to load tasks:", tasksRes.error.message);
      if (notesRes.error) console.warn("Failed to load notes:", notesRes.error.message);
      if (profileRes.error) console.warn("Failed to load pomodoro settings:", profileRes.error.message);
    } catch (e) {
      console.warn("Failed to load data from Supabase:", e.message);
    }
  }

  // ------------------------------------------------------------------
  // Auto-persist effects for NON-MIGRATED keys (keep in AsyncStorage)
  // ------------------------------------------------------------------
  useEffect(() => { if (loaded) saveData(KEYS.GROUP_MEMBERS, groupMembers); }, [groupMembers, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.PROFILE, profile); }, [profile, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.ONBOARDED, onboarded); }, [onboarded, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.FRIENDS, friends); }, [friends, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.BG_PALETTE, bgPalette); }, [bgPalette, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.DARK_MODE, darkMode); }, [darkMode, loaded]);

  // ------------------------------------------------------------------
  // Sync pomodoro settings to Supabase whenever they change
  // ------------------------------------------------------------------
  useEffect(() => {
    if (loaded && user) {
      supabase
        .from("profiles")
        .update({
          pomodoro_work_minutes: pomodoroSettings.workMinutes,
          pomodoro_break_minutes: pomodoroSettings.breakMinutes,
        })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.warn("Failed to sync pomodoro settings:", error.message);
        });
    }
  }, [pomodoroSettings, loaded, user]);

  // ------------------------------------------------------------------
  // Sync profile total_seconds to Supabase (existing logic, preserved)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!loaded || !user) return;
    const totalSeconds = sessions.reduce((sum, s) => sum + s.seconds, 0);
    supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: profile.name, total_seconds: totalSeconds, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.warn("Profile sync failed (will retry next change):", error.message);
      });
  }, [sessions, user, loaded, profile.name]);

  // ------------------------------------------------------------------
  // CRUD: Subjects
  // ------------------------------------------------------------------
  const addSubject = useCallback(async (name, color) => {
    const colorToUse = color || SUBJECT_PALETTE[Math.floor(Math.random() * SUBJECT_PALETTE.length)];
    const tempId = "tmp_" + (++tempIdRef.current);

    // Optimistic local update
    setSubjects((prev) => [...prev, { id: tempId, name, color: colorToUse }]);

    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("subjects")
        .insert({ user_id: user.id, name, color: colorToUse })
        .select("id, name, color")
        .single();
      if (error) throw error;
      setSubjects((prev) => prev.map((s) => (s.id === tempId ? { id: data.id, name: data.name, color: data.color } : s)));
    } catch (e) {
      console.warn("Failed to save subject:", e.message);
    }
  }, [user]);

  const removeSubject = useCallback(async (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));

    if (user && !id.startsWith("tmp_")) {
      try {
        const { error } = await supabase.from("subjects").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
      } catch (e) {
        console.warn("Failed to delete subject:", e.message);
      }
    }
  }, [user]);

  // ------------------------------------------------------------------
  // CRUD: Sessions
  // ------------------------------------------------------------------
  const addSession = useCallback(async (subjectId, seconds, mode = "stopwatch") => {
    const today = todayStr();
    const tempId = "tmp_" + (++tempIdRef.current);

    setSessions((prev) => [...prev, { id: tempId, subjectId, seconds, mode, date: today }]);

    if (!user) return;

    try {
      const subjectRef = subjectId && !subjectId.startsWith("tmp_") ? subjectId : null;
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({ user_id: user.id, subject_id: subjectRef, seconds, mode, date: today })
        .select("id")
        .single();
      if (error) throw error;
      setSessions((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: data.id } : s)));
    } catch (e) {
      console.warn("Failed to save session:", e.message);
    }
  }, [user]);

  // ------------------------------------------------------------------
  // CRUD: Todos
  // ------------------------------------------------------------------
  const addTodo = useCallback(async (text, date) => {
    const todoDate = date || todayStr();
    const tempId = "tmp_" + (++tempIdRef.current);

    setTodos((prev) => [...prev, { id: tempId, text, done: false, date: todoDate }]);

    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ user_id: user.id, text, done: false, date: todoDate })
        .select("id")
        .single();
      if (error) throw error;
      setTodos((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: data.id } : t)));
    } catch (e) {
      console.warn("Failed to save task:", e.message);
    }
  }, [user]);

  const toggleTodo = useCallback(async (id) => {
    const updated = {};
    setTodos((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          updated.done = !t.done;
          return { ...t, done: !t.done };
        }
        return t;
      });
      return next;
    });

    if (user && !id.startsWith("tmp_")) {
      try {
        const { error } = await supabase.from("tasks").update({ done: updated.done }).eq("id", id).eq("user_id", user.id);
        if (error) throw error;
      } catch (e) {
        console.warn("Failed to toggle task:", e.message);
      }
    }
  }, [user]);

  const removeTodo = useCallback(async (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));

    if (user && !id.startsWith("tmp_")) {
      try {
        const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
      } catch (e) {
        console.warn("Failed to delete task:", e.message);
      }
    }
  }, [user]);

  // ------------------------------------------------------------------
  // CRUD: Group members (unchanged — Groups feature not migrated)
  // ------------------------------------------------------------------
  const addGroupMember = useCallback((name, color) => {
    setGroupMembers((prev) => [
      ...prev,
      { id: Date.now().toString(), name, color, totalSeconds: 0 },
    ]);
  }, []);

  const logGroupMemberTime = useCallback((id, seconds) => {
    setGroupMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, totalSeconds: m.totalSeconds + seconds } : m))
    );
  }, []);

  const removeGroupMember = useCallback((id) => {
    setGroupMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ------------------------------------------------------------------
  // Onboarding
  // ------------------------------------------------------------------
  const completeOnboarding = useCallback((name) => {
    if (name && name.trim()) setProfile((p) => ({ ...p, name: name.trim() }));
    setOnboardedState(true);
  }, []);

  // ------------------------------------------------------------------
  // CRUD: Notes
  // ------------------------------------------------------------------
  const NOTE_COLORS = ["#FFF3B0", "#FFD6E8", "#D6EAFF", "#E3FFD6", "#F0D6FF"];

  const addNote = useCallback(async (text) => {
    const tempId = "tmp_" + (++tempIdRef.current);
    const color = NOTE_COLORS[notes.length % NOTE_COLORS.length];
    const rotation = Math.round((Math.random() - 0.5) * 8);

    setNotes((prev) => [...prev, { id: tempId, text, color, rotation }]);

    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({ user_id: user.id, text, color, rotation })
        .select("id")
        .single();
      if (error) throw error;
      setNotes((prev) => prev.map((n) => (n.id === tempId ? { ...n, id: data.id } : n)));
    } catch (e) {
      console.warn("Failed to save note:", e.message);
    }
  }, [user, notes.length]);

  const updateNote = useCallback(async (id, text) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));

    if (user && !id.startsWith("tmp_")) {
      try {
        const { error } = await supabase.from("notes").update({ text }).eq("id", id).eq("user_id", user.id);
        if (error) throw error;
      } catch (e) {
        console.warn("Failed to update note:", e.message);
      }
    }
  }, [user]);

  const removeNote = useCallback(async (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));

    if (user && !id.startsWith("tmp_")) {
      try {
        const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
      } catch (e) {
        console.warn("Failed to delete note:", e.message);
      }
    }
  }, [user]);

  // ------------------------------------------------------------------
  // Friends (unchanged — no UI, not migrated)
  // ------------------------------------------------------------------
  const addFriend = useCallback((friendUsername) => {
    const clean = friendUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return;
    setFriends((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, []);

  const removeFriend = useCallback((friendUsername) => {
    setFriends((prev) => prev.filter((f) => f !== friendUsername));
  }, []);

  // ------------------------------------------------------------------
  // UI preferences
  // ------------------------------------------------------------------
  const setBgPalette = useCallback((id) => { setBgPaletteState(id); }, []);
  const setDarkMode = useCallback((value) => { setDarkModeState(value); }, []);

  // ------------------------------------------------------------------
  // Provided context value
  // ------------------------------------------------------------------
  const value = {
    subjects, sessions, todos, groupMembers, profile, pomodoroSettings, notes, onboarded, loaded,
    friends, bgPalette, darkMode, dataLoading,
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
