import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { KEYS, loadData, saveData } from "../utils/storage";

const StudyContext = createContext(null);

const DEFAULT_SUBJECTS = [
  { id: "math", name: "Math", color: "#7C6CF6" },
  { id: "english", name: "English", color: "#5AC8FA" },
  { id: "science", name: "Science", color: "#4CD787" },
];

// A "session" is one finished study block: { id, subjectId, startedAt, seconds, date }
// A "todo" is one planner item: { id, text, done, date }
// A "group member" is a locally-added friend you track manually since there is
// no server in this build: { id, name, color, totalSeconds }

export function StudyProvider({ children }) {
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [sessions, setSessions] = useState([]);
  const [todos, setTodos] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [profile, setProfile] = useState({ name: "Me" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, sess, t, g, p] = await Promise.all([
        loadData(KEYS.SUBJECTS, DEFAULT_SUBJECTS),
        loadData(KEYS.SESSIONS, []),
        loadData(KEYS.TODOS, []),
        loadData(KEYS.GROUP_MEMBERS, []),
        loadData(KEYS.PROFILE, { name: "Me" }),
      ]);
      setSubjects(s);
      setSessions(sess);
      setTodos(t);
      setGroupMembers(g);
      setProfile(p);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveData(KEYS.SUBJECTS, subjects); }, [subjects, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.SESSIONS, sessions); }, [sessions, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.TODOS, todos); }, [todos, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.GROUP_MEMBERS, groupMembers); }, [groupMembers, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.PROFILE, profile); }, [profile, loaded]);

  const addSession = useCallback((subjectId, seconds) => {
    setSessions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        subjectId,
        seconds,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
  }, []);

  const addSubject = useCallback((name, color) => {
    setSubjects((prev) => [...prev, { id: Date.now().toString(), name, color }]);
  }, []);

  const removeSubject = useCallback((id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addTodo = useCallback((text) => {
    setTodos((prev) => [
      ...prev,
      { id: Date.now().toString(), text, done: false, date: new Date().toISOString().slice(0, 10) },
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

  const value = {
    subjects, sessions, todos, groupMembers, profile, loaded,
    addSession, addSubject, removeSubject,
    addTodo, toggleTodo, removeTodo,
    addGroupMember, logGroupMemberTime, removeGroupMember,
    setProfile,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
