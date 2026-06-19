// In-memory only - acceptable here since a missed reminder after a server
// restart is low-stakes, and this runs as a single instance (no horizontal
// scaling) so there's no need for a shared/persistent store.
const pending = new Map();

function schedule(key, callback, delayMs) {
  cancel(key);
  const timeoutId = setTimeout(async () => {
    pending.delete(key);
    try {
      await callback();
    } catch (err) {
      console.error(`Reminder callback failed for "${key}":`, err.response?.data || err.message);
    }
  }, delayMs);
  pending.set(key, timeoutId);
}

function cancel(key) {
  const existing = pending.get(key);
  if (existing) {
    clearTimeout(existing);
    pending.delete(key);
  }
}

module.exports = { schedule, cancel };
