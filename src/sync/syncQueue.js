import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "study_sync_queue";

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const syncQueue = {
  async add(operation) {
    const queue = await readQueue();
    queue.push(operation);
    await writeQueue(queue);
  },

  async remove(id) {
    const queue = await readQueue();
    const filtered = queue.filter((op) => op.id !== id);
    await writeQueue(filtered);
  },

  async list() {
    return readQueue();
  },

  async clear() {
    await writeQueue([]);
  },
};
