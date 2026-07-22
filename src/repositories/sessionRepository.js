import { supabase } from "../utils/supabase";

export const sessionRepository = {
  async loadAll(userId) {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("date", { ascending: true });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id,
      subjectId: s.subject_id,
      seconds: s.seconds,
      mode: s.mode,
      date: s.date,
      startedAt: s.started_at,
    }));
  },

  async loadForDate(userId, date) {
    const all = await this.loadAll(userId);
    return all.filter((s) => s.date === date);
  },

  async loadForSubject(userId, subjectId) {
    const all = await this.loadAll(userId);
    return all.filter((s) => s.subjectId === subjectId);
  },

  async create(userId, session) {
    const { error } = await supabase
      .from("user_sessions")
      .insert({
        id: session.id,
        user_id: userId,
        subject_id: session.subjectId,
        seconds: session.seconds,
        mode: session.mode,
        date: session.date,
        started_at: session.startedAt,
      })
      .select();

    if (error) throw error;
  },
};