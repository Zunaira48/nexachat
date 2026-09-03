// Maps userId -> count of active socket connections. A user is
// "online" if their count is > 0. Using a count (not a boolean)
// is what makes multi-device presence correct: closing one of two
// open tabs shouldn't mark the user offline.
const connectionCounts = new Map<string, number>();

export function addConnection(userId: string): number {
  const next = (connectionCounts.get(userId) ?? 0) + 1;
  connectionCounts.set(userId, next);
  return next; // returns the new count — 1 means "just came online"
}

export function removeConnection(userId: string): number {
  const current = connectionCounts.get(userId) ?? 0;
  const next = Math.max(0, current - 1);
  if (next === 0) {
    connectionCounts.delete(userId);
  } else {
    connectionCounts.set(userId, next);
  }
  return next; // returns the new count — 0 means "just went offline"
}

export function isOnline(userId: string): boolean {
  return (connectionCounts.get(userId) ?? 0) > 0;
}