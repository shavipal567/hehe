import AsyncStorage from "@react-native-async-storage/async-storage";

export const settingsRepository = {
  async get(key, fallback = null) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },

  async set(key, value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};