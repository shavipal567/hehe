export async function syncSubjects(userId) {
  return { synced: 0, failed: 0, errors: [] };
}

export async function syncSessions(userId) {
  return { synced: 0, failed: 0, errors: [] };
}

export async function syncTasks(userId) {
  return { synced: 0, failed: 0, errors: [] };
}

export async function syncNotes(userId) {
  return { synced: 0, failed: 0, errors: [] };
}

export async function syncAll(userId) {
  const results = await Promise.all([
    syncSubjects(userId),
    syncSessions(userId),
    syncTasks(userId),
    syncNotes(userId),
  ]);

  return {
    synced: results.reduce((sum, r) => sum + r.synced, 0),
    failed: results.reduce((sum, r) => sum + r.failed, 0),
    errors: results.flatMap((r) => r.errors),
  };
}
