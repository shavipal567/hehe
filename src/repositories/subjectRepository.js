import { supabase } from "../utils/supabase";

export const subjectRepository = {
  async loadAll(userId) {
    const { data, error } = await supabase
      .from("user_subjects")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at");

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
    }));
  },

  async create(userId, subject) {
    console.log("Saving subject:", userId, subject);
    const { error } = await supabase
      .from("user_subjects")
      .insert({
        id: subject.id,
        user_id: userId,
        name: subject.name,
        color: subject.color,
      });
    console.log("Insert error:", error);

    if (error) throw error;
  },

  async hardDelete(id) {
    const { error } = await supabase
      .from("user_subjects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};