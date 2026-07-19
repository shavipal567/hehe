import {
  loadTasks,
  insertTask,
  updateTask,
  deleteTask,
} from "../utils/database";

export const taskRepository = {
  async loadAll() {
    return loadTasks();
  },

  async loadForDate(date) {
    const all = await loadTasks();
    return all.filter((t) => t.date === date);
  },

  async create(task) {
    return insertTask(task);
  },

  async update(id, changes) {
    return updateTask(id, changes);
  },

  async softDelete(id) {
    return deleteTask(id);
  },

  async hardDelete(id) {
    return deleteTask(id);
  },
};
