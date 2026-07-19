import {
  loadSubjects,
  insertSubject,
  deleteSubject,
} from "../utils/database";

export const subjectRepository = {
  async loadAll() {
    return loadSubjects();
  },

  async create(subject) {
    return insertSubject(subject);
  },

  async hardDelete(id) {
    return deleteSubject(id);
  },
};
