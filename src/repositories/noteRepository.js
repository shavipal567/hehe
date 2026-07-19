import {
  loadNotes,
  insertNote,
  updateNote,
  deleteNote,
} from "../utils/database";

export const noteRepository = {
  async loadAll() {
    return loadNotes();
  },

  async create(note) {
    return insertNote(note);
  },

  async update(id, changes) {
    return updateNote(id, changes.text);
  },

  async softDelete(id) {
    return deleteNote(id);
  },

  async hardDelete(id) {
    return deleteNote(id);
  },
};
