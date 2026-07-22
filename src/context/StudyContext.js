import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { KEYS } from "../utils/storage";
import { SUBJECT_PALETTE } from "../theme";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import { subjectRepository } from "../repositories/subjectRepository";
import { sessionRepository } from "../repositories/sessionRepository";
import { taskRepository } from "../repositories/taskRepository";
import { noteRepository } from "../repositories/noteRepository";
import { settingsRepository } from "../repositories/settingsRepository";
import { groupMemberRepository } from "../repositories/groupMemberRepository";

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
  const [weekGoals, setWeekGoalsState] = useState({});
  const [monthGoals, setMonthGoalsState] = useState({});
  const [friends, setFriends] = useState([]);
  const [bgPalette, setBgPaletteState] = useState("pinkDusk");
  const [darkMode, setDarkModeState] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ------------------------------------------------------------------
  // On mount: init database, run migration (once), load all data
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user){
      setLoaded(true);
      return;
  }
    let cancelled = false;

    (async () => {
      try {

        const [subjRows, sessRows, taskRows, noteRows, gmRows] = await Promise.all([
          subjectRepository.loadAll(user?.id),
          sessionRepository.loadAll(user?.id),
          taskRepository.loadAll(user?.id),
          noteRepository.loadAll(user?.id),
          groupMemberRepository.loadAll(),
        ]);

        const [profileVal, pomoVal, onboardedVal, friendsVal, bgVal, darkVal, weekGoalsVal, monthGoalsVal] = await Promise.all([
          settingsRepository.get(KEYS.PROFILE, { name: "Dr. Shavi" }),
          settingsRepository.get(KEYS.POMODORO, DEFAULT_POMODORO),
          settingsRepository.get(KEYS.ONBOARDED, false),
          settingsRepository.get(KEYS.FRIENDS, []),
          settingsRepository.get(KEYS.BG_PALETTE, "pinkDusk"),
          settingsRepository.get(KEYS.DARK_MODE, false),
          settingsRepository.get(KEYS.WEEK_GOALS, {}),
          settingsRepository.get(KEYS.MONTH_GOALS, {}),
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
        setWeekGoalsState(weekGoalsVal);
        setMonthGoalsState(monthGoalsVal);
      } catch (e) {
        console.warn("Failed to initialize data:", e.message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

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
    subjectRepository.create(user.id,subject).catch((e) => console.warn("Failed to save subject:", e.message));
  }, [user]);

  const removeSubject = useCallback((id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    subjectRepository.hardDelete(id).catch((e) => console.warn("Failed to delete subject:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // CRUD: Sessions
  // ------------------------------------------------------------------
  const addSession = useCallback((subjectId, seconds, mode = "stopwatch", startedAt = null) => {
    const id = Date.now().toString();
    const session = {
      id,
      subjectId,
      seconds,
      mode,
      date: todayStr(),
      startedAt: startedAt || new Date(Date.now() - seconds * 1000).toISOString(),
    };

    setSessions((prev) => [...prev, session]);
    sessionRepository.create(user.id, session).catch((e) => console.warn("Failed to save session:", e.message));
  }, [user]);

  // ------------------------------------------------------------------
  // CRUD: Todos
  // ------------------------------------------------------------------
  const addTodo = useCallback((text, date) => {
    const id = Date.now().toString();
    const todo = { id, text, done: false, date: date || todayStr() };

    setTodos((prev) => [...prev, todo]);
    taskRepository.create(user.id,todo).catch((e) => console.warn("Failed to save task:", e.message));
  }, [user]);

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
    taskRepository.update(id, { done: newDone }).catch((e) => console.warn("Failed to update task:", e.message));
  }, []);

  const removeTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    taskRepository.hardDelete(id).catch((e) => console.warn("Failed to delete task:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // CRUD: Group members (unchanged API)
  // ------------------------------------------------------------------
  const addGroupMember = useCallback((name, color) => {
    const id = Date.now().toString();
    const member = { id, name, color, totalSeconds: 0 };

    setGroupMembers((prev) => [...prev, member]);
    groupMemberRepository.create(member).catch((e) => console.warn("Failed to save group member:", e.message));
  }, []);

  const logGroupMemberTime = useCallback((id, seconds) => {
    setGroupMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, totalSeconds: m.totalSeconds + seconds };
        groupMemberRepository.update(id, { totalSeconds: updated.totalSeconds }).catch(
          (e) => console.warn("Failed to update group member:", e.message)
        );
        return updated;
      })
    );
  }, []);

  const removeGroupMember = useCallback((id) => {
    setGroupMembers((prev) => prev.filter((m) => m.id !== id));
    groupMemberRepository.hardDelete(id).catch((e) => console.warn("Failed to delete group member:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // Onboarding
  // ------------------------------------------------------------------
  const completeOnboarding = useCallback((name) => {
    if (name && name.trim()) {
      const updated = { ...profile, name: name.trim() };
      setProfileState(updated);
      settingsRepository.set(KEYS.PROFILE, updated).catch((e) => console.warn("Failed to save profile:", e.message));
    }
    setOnboardedState(true);
    settingsRepository.set(KEYS.ONBOARDED, true).catch((e) => console.warn("Failed to save onboarded:", e.message));
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
    noteRepository.create(user.id,note).catch((e) => console.warn("Failed to save note:", e.message));
  }, [user]);

  const updateNote = useCallback((id, text) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    noteRepository.update(id, { text }).catch((e) => console.warn("Failed to update note:", e.message));
  }, []);

  const removeNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    noteRepository.hardDelete(id).catch((e) => console.warn("Failed to delete note:", e.message));
  }, []);
  // ------------------------------------------------------------------
  // Week goals (cumulative, per calendar week — not tied to daily todos)
  // ------------------------------------------------------------------
  const addWeekGoal = useCallback((weekKey, text) => {
    const id = Date.now().toString();
    setWeekGoalsState((prev) => {
      const list = prev[weekKey] || [];
      const next = { ...prev, [weekKey]: [...list, { id, text, done: false }] };
      settingsRepository.set(KEYS.WEEK_GOALS, next).catch((e) => console.warn("Failed to save week goals:", e.message));
      return next;
    });
  }, []);

  const toggleWeekGoal = useCallback((weekKey, id) => {
    setWeekGoalsState((prev) => {
      const list = (prev[weekKey] || []).map((g) => (g.id === id ? { ...g, done: !g.done } : g));
      const next = { ...prev, [weekKey]: list };
      settingsRepository.set(KEYS.WEEK_GOALS, next).catch((e) => console.warn("Failed to save week goals:", e.message));
      return next;
    });
  }, []);

  const removeWeekGoal = useCallback((weekKey, id) => {
    setWeekGoalsState((prev) => {
      const list = (prev[weekKey] || []).filter((g) => g.id !== id);
      const next = { ...prev, [weekKey]: list };
      settingsRepository.set(KEYS.WEEK_GOALS, next).catch((e) => console.warn("Failed to save week goals:", e.message));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Month goals (cumulative, per calendar month — not tied to daily todos)
  // ------------------------------------------------------------------
  const addMonthGoal = useCallback((monthKey, text) => {
    const id = Date.now().toString();
    setMonthGoalsState((prev) => {
      const list = prev[monthKey] || [];
      const next = { ...prev, [monthKey]: [...list, { id, text, done: false }] };
      settingsRepository.set(KEYS.MONTH_GOALS, next).catch((e) => console.warn("Failed to save month goals:", e.message));
      return next;
    });
  }, []);

  const toggleMonthGoal = useCallback((monthKey, id) => {
    setMonthGoalsState((prev) => {
      const list = (prev[monthKey] || []).map((g) => (g.id === id ? { ...g, done: !g.done } : g));
      const next = { ...prev, [monthKey]: list };
      settingsRepository.set(KEYS.MONTH_GOALS, next).catch((e) => console.warn("Failed to save month goals:", e.message));
      return next;
    });
  }, []);

  const removeMonthGoal = useCallback((monthKey, id) => {
    setMonthGoalsState((prev) => {
      const list = (prev[monthKey] || []).filter((g) => g.id !== id);
      const next = { ...prev, [monthKey]: list };
      settingsRepository.set(KEYS.MONTH_GOALS, next).catch((e) => console.warn("Failed to save month goals:", e.message));
      return next;
    });
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
      settingsRepository.set(KEYS.FRIENDS, next).catch((e) => console.warn("Failed to save friends:", e.message));
      return next;
    });
  }, []);

  const removeFriend = useCallback((friendUsername) => {
    setFriends((prev) => {
      const next = prev.filter((f) => f !== friendUsername);
      settingsRepository.set(KEYS.FRIENDS, next).catch((e) => console.warn("Failed to save friends:", e.message));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------
  // Profile
  // ------------------------------------------------------------------
  const setProfile = useCallback((value) => {
    setProfileState(value);
    settingsRepository.set(KEYS.PROFILE, value).catch((e) => console.warn("Failed to save profile:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // Pomodoro settings
  // ------------------------------------------------------------------
  const setPomodoroSettings = useCallback((value) => {
    setPomodoroSettingsState(value);
    settingsRepository.set(KEYS.POMODORO, value).catch((e) => console.warn("Failed to save pomodoro settings:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // UI preferences
  // ------------------------------------------------------------------
  const setBgPalette = useCallback((id) => {
    setBgPaletteState(id);
    settingsRepository.set(KEYS.BG_PALETTE, id).catch((e) => console.warn("Failed to save bg palette:", e.message));
  }, []);

  const setDarkMode = useCallback((value) => {
    setDarkModeState(value);
    settingsRepository.set(KEYS.DARK_MODE, value).catch((e) => console.warn("Failed to save dark mode:", e.message));
  }, []);

  // ------------------------------------------------------------------
  // Context value (identical API to original)
  // ------------------------------------------------------------------
  const value = {
    subjects, sessions, todos, groupMembers, profile, pomodoroSettings, notes, onboarded, loaded,
    friends, bgPalette, darkMode, weekGoals, monthGoals,
    addSession, addSubject, removeSubject,
    addTodo, toggleTodo, removeTodo,
    addGroupMember, logGroupMemberTime, removeGroupMember,
    addNote, updateNote, removeNote,
    addFriend, removeFriend, setBgPalette, setDarkMode,
    setProfile, setPomodoroSettings, completeOnboarding,
    addWeekGoal, toggleWeekGoal, removeWeekGoal,
    addMonthGoal, toggleMonthGoal, removeMonthGoal,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}