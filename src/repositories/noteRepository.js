import { supabase } from "../utils/supabase";

export const noteRepository = {
  async loadAll(userId) {
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at");

    if (error) throw error;

    return (data || []).map((n) => ({
      id: n.id,
      text: n.text,
      color: n.color,
      rotation: n.rotation,
    }));
  },

  async create(userId, note) {
    const { error } = await supabase
      .from("user_notes")
      .insert({
        id: note.id,
        user_id: userId,
        text: note.text,
        color: note.color,
        rotation: note.rotation,
      })
      .select();

    if (error) throw error;
  },

  async update(id, changes) {
    const { error } = await supabase
      .from("user_notes")
      .update({
        text: changes.text,
      })
      .eq("id", id);

    if (error) throw error;
  },

  async hardDelete(id) {
    const { error } = await supabase
      .from("user_notes")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async softDelete(id) {
    return this.hardDelete(id);
  },
};