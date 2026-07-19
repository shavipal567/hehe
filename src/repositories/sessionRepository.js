import {
  loadSessions,
  insertSession,
} from "../utils/database";

export const sessionRepository = {
  async loadAll() {
    return loadSessions();
  },

  async loadForDate(date) {
    const all = await loadSessions();
    return all.filter((s) => s.date === date);
  },

  async loadForSubject(subjectId) {
    const all = await loadSessions();
    return all.filter((s) => s.subjectId === subjectId);
  },

  async create(session) {
    return insertSession(session);
  },
};
