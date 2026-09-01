import type { DB, Session } from "./types";

const DB_KEY = "vibetalk.db.v1";
const SESSION_KEY = "vibetalk.session.v1";
const SETUP_KEY = "vibetalk.setup.v1";

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;
  try {
    const value = JSON.parse(raw);
    if (value === null || value === undefined) return fallback;
    return value as T;
  } catch {
    return fallback;
  }
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function storageAvailable(kind: "local" | "session"): boolean {
  try {
    const store = kind === "local" ? window.localStorage : window.sessionStorage;
    const probe = "__vibe_probe__";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** An in-memory fallback so the app never crashes when storage is blocked. */
let memoryDB: DB | null = null;
let memorySession: Session | null = null;

export function loadDB(fallback: DB): DB {
  if (!storageAvailable("local")) {
    return memoryDB ?? fallback;
  }
  const parsed = safeParse<DB | null>(window.localStorage.getItem(DB_KEY), null);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.users) || !Array.isArray(parsed.rooms)) {
    return fallback;
  }
  // Backfill any keys added in later revisions so nothing is ever undefined.
  const merged: DB = { ...fallback, ...parsed };
  const target = merged as unknown as Record<string, unknown>;
  const source = fallback as unknown as Record<string, unknown>;
  Object.keys(source).forEach((key) => {
    if (target[key] === undefined || target[key] === null) target[key] = source[key];
  });
  return merged;
}

export function saveDB(db: DB): void {
  memoryDB = db;
  if (!storageAvailable("local")) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* quota or privacy mode — keep working in memory */
  }
}

export function loadSession(): Session | null {
  if (!storageAvailable("local")) return memorySession;
  const parsed = safeParse<Session | null>(window.localStorage.getItem(SESSION_KEY), null);
  if (!parsed || typeof parsed.userId !== "string") return null;
  return parsed;
}

export function saveSession(session: Session | null): void {
  memorySession = session;
  if (!storageAvailable("local")) return;
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function loadSetupFlag(): boolean {
  if (!storageAvailable("session")) return false;
  return safeParse<boolean>(window.sessionStorage.getItem(SETUP_KEY), false);
}

export function saveSetupFlag(value: boolean): void {
  if (!storageAvailable("session")) return;
  try {
    if (value) window.sessionStorage.setItem(SETUP_KEY, "true");
    else window.sessionStorage.removeItem(SETUP_KEY);
  } catch {
    /* ignore */
  }
}

export function resetAll(): void {
  memoryDB = null;
  memorySession = null;
  memory.clear();
  clearAllMediaDB();
  if (storageAvailable("local")) {
    window.localStorage.removeItem(DB_KEY);
    window.localStorage.removeItem(SESSION_KEY);
    Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
  }
  if (storageAvailable("session")) window.sessionStorage.removeItem(SETUP_KEY);
}

/**
 * Structured keys so every collection has one obvious home in localStorage.
 * `vibetalk.db.v1`     → profile, rooms, coins, messages, progression
 * `vibetalk.social.v2` → posts, reels, stories, friends, groups, missions, admin
 */
export const KEYS = {
  social: "vibetalk.social.v2",
  prefs: "vibetalk.prefs.v1",
  searches: "vibetalk.searches",
} as const;

const memory = new Map<string, unknown>();

export function readJson<T>(key: string, fallback: T, isValid?: (value: unknown) => boolean): T {
  const available = storageAvailable("local");
  const raw = available ? window.localStorage.getItem(key) : null;
  if (!raw) return (memory.get(key) as T) ?? fallback;
  const parsed = safeParse<T | null>(raw, null);
  if (parsed === null || (isValid && !isValid(parsed))) return fallback;
  return parsed as T;
}

export function writeJson(key: string, value: unknown): boolean {
  memory.set(key, value);
  if (!storageAvailable("local")) return false;
  try {
    let toStore = value;
    // ROOT CAUSE 3 FIX: Always strip heavy media data from stories before saving to localStorage.
    // Only lightweight metadata (id, userId, createdAt, expiresAt, mediaType, caption, mediaKey) is stored.
    if (key === KEYS.social && typeof value === "object" && value !== null) {
      const social = value as Record<string, unknown>;
      if (Array.isArray(social.stories)) {
        const leanStories = (social.stories as Record<string, unknown>[]).map((s) => {
          if (s.mediaUrl) {
            const { mediaUrl: _, ...rest } = s;
            return rest;
          }
          return s;
        });
        toStore = { ...social, stories: leanStories };
      }
    }
    window.localStorage.setItem(key, JSON.stringify(toStore));
    return true;
  } catch (err) {
    console.warn("Storage write error:", err);
    return false;
  }
}

export function removeKey(key: string): void {
  memory.delete(key);
  if (storageAvailable("local")) window.localStorage.removeItem(key);
}

// --------------------------- IndexedDB Media Store ---------------------------
const IDB_NAME = "vibetalk_media_db_v1";
const IDB_STORE = "media";

const memoryBlobStore = new Map<string, Blob>();
const objectUrlCache = new Map<string, string>();

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Store a Blob or File directly in IndexedDB without base64 conversion */
export async function storeStoryBlob(key: string, blob: Blob): Promise<{ ok: boolean; error?: string }> {
  memoryBlobStore.set(key, blob);

  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);

      try {
        const req = store.put(blob, key);
        req.onerror = (e) => {
          const err = (e.target as IDBRequest).error;
          const isQuota = err?.name === "QuotaExceededError";
          resolve({
            ok: false,
            error: isQuota
              ? "Device storage quota exceeded for video. Please select a smaller video or delete older stories."
              : `Storage error: ${err?.message || "Failed to save video to device."}`,
          });
        };
      } catch (err: unknown) {
        const errObj = err as { name?: string; message?: string } | undefined;
        const isQuota = errObj?.name === "QuotaExceededError";
        resolve({
          ok: false,
          error: isQuota
            ? "Device storage quota exceeded for video. Please select a smaller video or delete older stories."
            : `Storage error: ${errObj?.message || "Failed to save video to device."}`,
        });
        return;
      }

      tx.oncomplete = () => resolve({ ok: true });
      tx.onabort = () => {
        const err = tx.error;
        resolve({ ok: false, error: err?.message || "Storage transaction aborted." });
      };
      tx.onerror = () => {
        const err = tx.error;
        resolve({ ok: false, error: err?.message || "Storage transaction failed." });
      };
    });
  } catch (err) {
    console.warn("IndexedDB access warning:", err);
    // If IndexedDB is blocked in sandboxed iframe or private mode, memoryBlobStore still holds it in session
    return { ok: true };
  }
}

/** Retrieve the Blob from in-memory cache or IndexedDB */
export async function getStoryBlob(key: string): Promise<Blob | null> {
  if (memoryBlobStore.has(key)) {
    return memoryBlobStore.get(key)!;
  }
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const res = req.result;
        if (
          res &&
          (res instanceof Blob ||
            res instanceof File ||
            (typeof res === "object" && typeof (res as Blob).slice === "function" && "size" in res))
        ) {
          memoryBlobStore.set(key, res as Blob);
          resolve(res as Blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Resolve an object URL for a story, creating it only when needed */
export async function resolveStoryUrl(mediaKey?: string, fallbackUrl?: string): Promise<string | null> {
  if (!mediaKey) return fallbackUrl || null;
  if (objectUrlCache.has(mediaKey)) {
    return objectUrlCache.get(mediaKey)!;
  }
  const blob = await getStoryBlob(mediaKey);
  if (!blob) return fallbackUrl || null;
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(mediaKey, url);
  return url;
}

/** Revoke an object URL when no longer needed */
export function revokeStoryMediaUrl(mediaKey: string): void {
  const url = objectUrlCache.get(mediaKey);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(mediaKey);
  }
}

/** Delete a media item from memory and IndexedDB */
export async function deleteStoryBlob(key: string): Promise<void> {
  memoryBlobStore.delete(key);
  revokeStoryMediaUrl(key);
  try {
    const db = await openMediaDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(key);
  } catch {
    /* ignore */
  }
}

export function clearAllMediaDB(): void {
  objectUrlCache.forEach((url) => {
    URL.revokeObjectURL(url);
  });
  objectUrlCache.clear();
  memoryBlobStore.clear();
  try {
    if (typeof window !== "undefined" && window.indexedDB) {
      window.indexedDB.deleteDatabase(IDB_NAME);
    }
  } catch {
    /* ignore */
  }
}
