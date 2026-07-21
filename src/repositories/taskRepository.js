import { supabase } from "../utils/supabase";

export const taskRepository = {
  async loadAll(userId) {
    const { data, error } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at");

    if (error) throw error;

    return (data || []).map((t) => ({
      id: t.id,
      text: t.text,
      done: t.done,
      priority: t.priority,
      date: t.date,
    }));
  },

  async loadForDate(userId, date) {
    const { data, error } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .is("deleted_at", null)
      .order("created_at");

    if (error) throw error;

    return data || [];
  },

  async create(userId, task) {
    const { error } = await supabase
      .from("user_tasks")
      .insert({
        id: task.id,
        user_id: userId,
        text: task.text,
        done: task.done,
        priority: task.priority ?? null,
        date: task.date,
      })
      .select();

    if (error) throw error;
  },

  async update(id, changes) {
    const { error } = await supabase
      .from("user_tasks")
      .update(changes)
      .eq("id", id);

    if (error) throw error;
  },

  async softDelete(id) {
    const { error } = await supabase
      .from("user_tasks")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  async hardDelete(id) {
    const { error } = await supabase
      .from("user_tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};