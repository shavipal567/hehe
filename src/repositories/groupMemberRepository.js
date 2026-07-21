import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "group_members";

async function load() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function save(data) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export const groupMemberRepository = {
  async loadAll() {
    return load();
  },

  async create(member) {
    const members = await load();
    members.push(member);
    await save(members);
  },

  async update(id, changes) {
    const members = await load();
    const updated = members.map((m) =>
      m.id === id ? { ...m, ...changes } : m
    );
    await save(updated);
  },

  async hardDelete(id) {
    const members = await load();
    await save(members.filter((m) => m.id !== id));
  },

  async softDelete(id) {
    return this.hardDelete(id);
  },
};