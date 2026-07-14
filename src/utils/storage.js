import AsyncStorage from "@react-native-async-storage/async-storage";

// Simple wrapper so the rest of the app never touches AsyncStorage directly.
// Everything is stored as JSON under one namespaced key per data type.

const KEYS = {
  SUBJECTS: "study_app_subjects",
  SESSIONS: "study_app_sessions",
  TODOS: "study_app_todos",
  GROUP_MEMBERS: "study_app_group_members",
  PROFILE: "study_app_profile",
  POMODORO: "study_app_pomodoro",
  ONBOARDED: "study_app_onboarded",
  NOTES: "study_app_notes",
  USERNAME: "study_app_username",
  FRIENDS: "study_app_friends",
};

export async function loadData(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load", key, e);
    return fallback;
  }
}

export async function saveData(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to save", key, e);
  }
}

export { KEYS };
