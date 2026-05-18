const STALE_MS = 60 * 60 * 1000; // 1 hour

const cache = new Map();

export function getCached(id) {
  return cache.get(String(id)) ?? null;
}

export function setCached(id, data) {
  cache.set(String(id), { data, cachedAt: Date.now() });
}

export function isStale(id) {
  const entry = cache.get(String(id));
  if (!entry) return true;
  return Date.now() - entry.cachedAt > STALE_MS;
}
