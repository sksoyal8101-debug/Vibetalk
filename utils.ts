export function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today.getTime() - 86400000).toDateString() === d.toDateString();
  if (isToday) return "Today";
  if (yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatCoins(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function initials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9 ._-]/g, " ").trim();
  const parts = clean.split(/[ ._@-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const GRADIENTS = [
  ["#7c3aed", "#ec4899"],
  ["#2563eb", "#a855f7"],
  ["#db2777", "#f59e0b"],
  ["#059669", "#8b5cf6"],
  ["#4c1d95", "#22d3ee"],
  ["#be123c", "#f97316"],
  ["#0f766e", "#c084fc"],
  ["#9333ea", "#f472b6"],
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const [a, b] = GRADIENTS[hash % GRADIENTS.length];
  return `linear-gradient(140deg, ${a}, ${b})`;
}

/** Cumulative xp curve: every level costs a little more than the last. */
export function levelFromXp(total: number): { level: number; into: number; need: number; pct: number; total: number } {
  let level = 1;
  let remaining = Math.max(0, Math.round(total || 0));
  while (level < 99) {
    const need = xpForLevel(level);
    if (remaining >= need) {
      remaining -= need;
      level += 1;
    } else break;
  }
  const need = xpForLevel(level);
  return { level, into: remaining, need, pct: Math.max(2, Math.min(100, Math.round((remaining / need) * 100))), total: Math.round(total || 0) };
}

export function xpForLevel(level: number): number {
  return 320 + Math.max(1, level) * 190;
}

export function levelProgress(xp: number, _level?: number): number {
  return levelFromXp(xp).pct;
}

export function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function todayKey(d: Date | number = new Date()): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function yesterdayKey(): string {
  return todayKey(new Date(Date.now() - 86_400_000));
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24);
}

export async function simulateLatency(ms = 650): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}
