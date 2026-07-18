import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

export function StudyProvider({ children }) {
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

  useEffect(() => {
    (async () => {
      const [s, sess, t, g, p, pomo, onb, n, fr, bg, dm] = await Promise.all([
        loadData(KEYS.SUBJECTS, DEFAULT_SUBJECTS),
        loadData(KEYS.SESSIONS, []),
        loadData(KEYS.TODOS, []),
        loadData(KEYS.GROUP_MEMBERS, []),
        loadData(KEYS.PROFILE, { name: "Dr. Shavi" }),
        loadData(KEYS.POMODORO, DEFAULT_POMODORO),
        loadData(KEYS.ONBOARDED, false),
        loadData(KEYS.NOTES, []),
        loadData(KEYS.FRIENDS, []),
        loadData(KEYS.BG_PALETTE, "pinkDusk"),
        loadData(KEYS.DARK_MODE, false),
      ]);
      setSubjects(s);
      setSessions(sess);
      setTodos(t);
      setGroupMembers(g);
      setProfile(p);
      setPomodoroSettings(pomo);
      setOnboardedState(onb);
      setNotes(n);
      setFriends(fr);
      setBgPaletteState(bg);
      setDarkModeState(dm);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveData(KEYS.SUBJECTS, subjects); }, [subjects, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.SESSIONS, sessions); }, [sessions, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.TODOS, todos); }, [todos, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.GROUP_MEMBERS, groupMembers); }, [groupMembers, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.PROFILE, profile); }, [profile, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.POMODORO, pomodoroSettings); }, [pomodoroSettings, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.ONBOARDED, onboarded); }, [onboarded, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.NOTES, notes); }, [notes, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.FRIENDS, friends); }, [friends, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.BG_PALETTE, bgPalette); }, [bgPalette, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.DARK_MODE, darkMode); }, [darkMode, loaded]);

  const { user } = useAuth();

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

  const addSession = useCallback((subjectId, seconds, mode = "stopwatch") => {
    setSessions((prev) => [
      ...prev,
      { id: Date.now().toString(), subjectId, seconds, mode, date: todayStr() },
    ]);
  }, []);

  const addSubject = useCallback((name, color) => {
    setSubjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name, color: color || SUBJECT_PALETTE[prev.length % SUBJECT_PALETTE.length] },
    ]);
  }, []);

  const removeSubject = useCallback((id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addTodo = useCallback((text, date) => {
    setTodos((prev) => [
      ...prev,
      { id: Date.now().toString(), text, done: false, date: date || todayStr() },
    ]);
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const removeTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

  const completeOnboarding = useCallback((name) => {
    if (name && name.trim()) setProfile((p) => ({ ...p, name: name.trim() }));
    setOnboardedState(true);
  }, []);

  const NOTE_COLORS = ["#FFF3B0", "#FFD6E8", "#D6EAFF", "#E3FFD6", "#F0D6FF"];

  const addNote = useCallback((text) => {
    setNotes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        color: NOTE_COLORS[prev.length % NOTE_COLORS.length],
        rotation: Math.round((Math.random() - 0.5) * 8),
      },
    ]);
  }, []);

  const updateNote = useCallback((id, text) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  }, []);

  const removeNote = useCallback((id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addFriend = useCallback((friendUsername) => {
    const clean = friendUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return;
    setFriends((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, []);

  const removeFriend = useCallback((friendUsername) => {
    setFriends((prev) => prev.filter((f) => f !== friendUsername));
  }, []);

  const setBgPalette = useCallback((id) => {
    setBgPaletteState(id);
  }, []);

  const setDarkMode = useCallback((value) => {
    setDarkModeState(value);
  }, []);

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
