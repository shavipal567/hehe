import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "active_sessions";

export const activeSessionRepository = {
  async getAll() {
    const json = await AsyncStorage.getItem(KEY);
    return json ? JSON.parse(json) : {};
  },

  async save(subjectId, session) {
    const sessions = await this.getAll();
    sessions[subjectId] = session;
    await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
  },

  async remove(subjectId) {
    const sessions = await this.getAll();
    delete sessions[subjectId];
    await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
  },

  async clear() {
    await AsyncStorage.removeItem(KEY);
  },
};