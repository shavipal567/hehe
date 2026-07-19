export function generateSyncId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

export function timestamp() {
  return new Date().toISOString();
}

export function createConflictMetadata(record) {
  return {
    version: 1,
    syncedAt: null,
    localUpdatedAt: record.updated_at || timestamp(),
  };
}
