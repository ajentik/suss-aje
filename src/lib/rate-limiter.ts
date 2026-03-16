/// <reference types="node" />

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const CLEANUP_INTERVAL_MS = 60_000;

const store = new Map<string, RateLimitEntry>();

let cleanupTimer: NodeJS.Timeout | null = null;

function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
    if (store.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
  // unref lets the Node process exit even if the timer is still scheduled
  cleanupTimer.unref();
}

export function checkRateLimit(ip: string): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    store.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}
