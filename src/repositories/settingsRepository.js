import { getSetting, setSetting } from "../utils/database";

export const settingsRepository = {
  async get(key, fallback = null) {
    return getSetting(key, fallback);
  },

  async set(key, value) {
    return setSetting(key, value);
  },
};
