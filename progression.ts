import { levelFromXp, todayKey, yesterdayKey } from "./utils";
import type { DB, Room, User, UserStats } from "./types";

/* ------------------------------- XP & levels ------------------------------- */

export const XP_RULES = {
  dailyLogin: 60,
  checkin: 90,
  spin: 45,
  roomJoin: 40,
  roomChat: 12,
  dm: 8,
  follow: 15,
  giftSent: 30,
  giftReceived: 45,
  game: 25,
  profileEdit: 35,
  eventRsvp: 20,
  favorite: 10,
  hostTool: 14,
  /* VibeTalk Pro v2 */
  post: 18,
  comment: 6,
  reel: 14,
  story: 15,
  friend: 30,
  group: 22,
  mission: 60,
  share: 8,
  vip: 25,
} as const;

export type XpRule = keyof typeof XP_RULES;

export const LEVEL_TITLES = [
  "New Voice",
  "Room Regular",
  "Chatterbox",
  "Mic Friendly",
  "Vibe Curator",
  "Room Riser",
  "Host in Bloom",
  "Crowd Favourite",
  "Star of the Night",
  "Vibe Master",
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.max(0, Math.floor((level - 1) / 3)))];
}

/* ------------------------------- Achievements -------------------------------- */

export type BadgeTier = "bronze" | "silver" | "gold" | "mythic";

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  tier: BadgeTier;
  xp: number;
  progress: (user: User, db: DB) => { have: number; need: number };
}

export const BADGE_TIER_STYLE: Record<BadgeTier, { ring: string; chip: string }> = {
  bronze: { ring: "rgba(217,119,6,.55)", chip: "bg-amber-900/40 text-amber-200 border-amber-500/30" },
  silver: { ring: "rgba(148,163,184,.55)", chip: "bg-slate-400/15 text-slate-200 border-slate-300/30" },
  gold: { ring: "rgba(251,191,36,.6)", chip: "bg-coin-500/15 text-coin-400 border-coin-400/35" },
  mythic: { ring: "rgba(236,72,153,.65)", chip: "bg-blush-500/15 text-blush-300 border-blush-400/35" },
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "newcomer",
    name: "Newcomer",
    emoji: "🌱",
    blurb: "Finish your profile and say hello",
    tier: "bronze",
    xp: 60,
    progress: (u) => ({ have: u.bio.trim().length > 12 ? 1 : 0, need: 1 }),
  },
  {
    id: "first-room",
    name: "First Voice Room",
    emoji: "🎙️",
    blurb: "Join your first voice room",
    tier: "bronze",
    xp: 80,
    progress: (u) => ({ have: u.stats.roomsJoined, need: 1 }),
  },
  {
    id: "social-star",
    name: "Social Star",
    emoji: "🌟",
    blurb: "Follow 5 members and get noticed",
    tier: "silver",
    xp: 140,
    progress: (u, db) => ({ have: db.follows.length + Math.round(u.followers / 8), need: 5 }),
  },
  {
    id: "top-host",
    name: "Top Host",
    emoji: "🎧",
    blurb: "Host or fill 3 rooms",
    tier: "gold",
    xp: 220,
    progress: (u, db) => ({ have: u.stats.roomsJoined + db.rooms.filter((r) => r.hostId === u.id).length * 2, need: 3 }),
  },
  {
    id: "gift-lover",
    name: "Gift Lover",
    emoji: "🎁",
    blurb: "Send 3 virtual gifts",
    tier: "silver",
    xp: 160,
    progress: (u, db) => ({ have: u.giftsSent || db.giftLog.filter((g) => g.fromId === u.id).length, need: 3 }),
  },
  {
    id: "daily-visitor",
    name: "Daily Visitor",
    emoji: "📅",
    blurb: "Claim the daily check-in 3 days",
    tier: "silver",
    xp: 150,
    progress: (u) => ({ have: u.checkinDates.length, need: 3 }),
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    emoji: "🔥",
    blurb: "Complete a full 7-day check-in cycle",
    tier: "gold",
    xp: 300,
    progress: (u) => ({ have: u.checkinDates.length, need: 7 }),
  },
  {
    id: "rising-star",
    name: "Rising Star",
    emoji: "🚀",
    blurb: "Reach level 8 with xp",
    tier: "gold",
    xp: 240,
    progress: (u) => ({ have: Math.min(8, levelFromXp(u.xp).level), need: 8 }),
  },
  {
    id: "chat-butterfly",
    name: "Chat Butterfly",
    emoji: "🦋",
    blurb: "Send 5 room chat messages",
    tier: "bronze",
    xp: 110,
    progress: (u) => ({ have: u.stats.roomChats, need: 5 }),
  },
  {
    id: "arcade",
    name: "Arcade Regular",
    emoji: "🕹️",
    blurb: "Finish 3 casual games",
    tier: "bronze",
    xp: 90,
    progress: (u, db) => ({ have: u.stats.gamesPlayed || db.scores.length, need: 3 }),
  },
  {
    id: "event-host",
    name: "Event Host",
    emoji: "🎟️",
    blurb: "Publish a room event",
    tier: "gold",
    xp: 200,
    progress: (u, db) => ({ have: u.stats.eventsHosted || db.events.filter((e) => e.hostId === u.id).length, need: 1 }),
  },
  {
    id: "lucky-heart",
    name: "Lucky Heart",
    emoji: "🍀",
    blurb: "Spin the daily wheel",
    tier: "silver",
    xp: 70,
    progress: (u) => ({ have: u.spins, need: 1 }),
  },
  {
    id: "vibe-master",
    name: "Vibe Master",
    emoji: "👑",
    blurb: "Level 15 with 5 badges unlocked",
    tier: "mythic",
    xp: 600,
    progress: (u) => ({ have: Math.min(5, u.achievements.length) + (levelFromXp(u.xp).level >= 15 ? 1 : 0), need: 6 }),
  },
];

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function achievementProgress(user: User, db: DB) {
  return ACHIEVEMENTS.map((a) => {
    const p = a.progress(user, db);
    return {
      def: a,
      have: Math.min(p.have, p.need),
      need: p.need,
      unlocked: user.achievements.includes(a.id) || p.have >= p.need,
    };
  });
}

/** Ids that are newly satisfied compared with what the user already owns. */
export function newlyUnlocked(user: User, db: DB): Achievement[] {
  return achievementProgress(user, db)
    .filter((row) => row.unlocked && !user.achievements.includes(row.def.id))
    .map((row) => row.def);
}

/* ------------------------------ Daily check-in ------------------------------ */

export const CHECKIN_REWARDS: { day: number; coins: number; xp: number; label: string; emoji: string; badge?: string }[] = [
  { day: 1, coins: 100, xp: 60, label: "Warm up", emoji: "☕" },
  { day: 2, coins: 200, xp: 80, label: "Rolling", emoji: "🎧" },
  { day: 3, coins: 300, xp: 100, label: "In the room", emoji: "🎙️" },
  { day: 4, coins: 500, xp: 130, label: "Crowd pulls", emoji: "🪩" },
  { day: 5, coins: 700, xp: 160, label: "Half week", emoji: "⚡" },
  { day: 6, coins: 1000, xp: 200, label: "Almost there", emoji: "💫" },
  { day: 7, coins: 1500, xp: 320, label: "Week Warrior badge", emoji: "🔥", badge: "week-warrior" },
];

/* --------------------------------- Lucky spin -------------------------------- */

export interface SpinSegment {
  id: string;
  label: string;
  emoji: string;
  kind: "coins" | "xp" | "badge" | "boost";
  amount: number;
  color: string;
}

export const SPIN_SEGMENTS: SpinSegment[] = [
  { id: "c250", label: "250 coins", emoji: "🪙", kind: "coins", amount: 250, color: "rgba(124,58,237,.55)" },
  { id: "x80", label: "80 xp", emoji: "✨", kind: "xp", amount: 80, color: "rgba(236,72,153,.42)" },
  { id: "c600", label: "600 coins", emoji: "💰", kind: "coins", amount: 600, color: "rgba(37,99,235,.5)" },
  { id: "boost", label: "Double next reward", emoji: "⚡", kind: "boost", amount: 1, color: "rgba(52,211,153,.42)" },
  { id: "c1200", label: "1,200 coins", emoji: "🎰", kind: "coins", amount: 1200, color: "rgba(168,85,247,.5)" },
  { id: "x150", label: "150 xp", emoji: "🚀", kind: "xp", amount: 150, color: "rgba(245,158,11,.42)" },
  { id: "badge", label: "Lucky Heart badge", emoji: "🍀", kind: "badge", amount: 0, color: "rgba(244,114,182,.48)" },
  { id: "c80", label: "80 coins", emoji: "🌙", kind: "coins", amount: 80, color: "rgba(34,211,238,.38)" },
];

/* ---------------------------- Frames & profile look ---------------------------- */

export interface ProfileFrame {
  id: string;
  name: string;
  ring: string;
  glow: string;
  minLevel: number;
  badge?: string;
}

export const FRAMES: ProfileFrame[] = [
  { id: "none", name: "No frame", ring: "transparent", glow: "none", minLevel: 0 },
  { id: "pulse", name: "Neon Pulse", ring: "conic-gradient(from 210deg,#8b5cf6,#ec4899,#22d3ee,#8b5cf6)", glow: "0 0 26px rgba(139,92,246,.55)", minLevel: 1 },
  { id: "rings", name: "Voice Rings", ring: "conic-gradient(from 0deg,#34d399,#22d3ee,#a855f7,#34d399)", glow: "0 0 30px rgba(52,211,153,.45)", minLevel: 4 },
  { id: "starlit", name: "Starlit", ring: "conic-gradient(from 45deg,#fbbf24,#f472b6,#fde68a,#fbbf24)", glow: "0 0 32px rgba(251,191,36,.5)", minLevel: 7 },
  { id: "crown", name: "Crown", ring: "linear-gradient(140deg,#f59e0b,#fde68a 45%,#b45309)", glow: "0 0 34px rgba(245,158,11,.55)", minLevel: 10, badge: "top-host" },
  { id: "mythic", name: "Mythic Vibe", ring: "conic-gradient(from 120deg,#ec4899,#8b5cf6,#22d3ee,#f472b6)", glow: "0 0 40px rgba(236,72,153,.6)", minLevel: 12, badge: "vibe-master" },
];

export interface ProfileTheme {
  id: string;
  name: string;
  cover: string;
  soft: string;
}

export const THEMES: ProfileTheme[] = [
  { id: "violet", name: "Violet Hour", cover: "linear-gradient(135deg,#7c3aed,#ec4899)", soft: "rgba(124,58,237,.16)" },
  { id: "midnight", name: "Midnight Radio", cover: "linear-gradient(135deg,#1e3a8a,#7c3aed)", soft: "rgba(37,99,235,.16)" },
  { id: "sunset", name: "Sunset Sessions", cover: "linear-gradient(135deg,#db2777,#f59e0b)", soft: "rgba(219,39,119,.16)" },
  { id: "mint", name: "Mint Lounge", cover: "linear-gradient(135deg,#059669,#22d3ee)", soft: "rgba(5,150,105,.16)" },
  { id: "noir", name: "Noir", cover: "linear-gradient(135deg,#334155,#0f172a)", soft: "rgba(148,163,184,.12)" },
  { id: "aurora", name: "Aurora", cover: "linear-gradient(135deg,#22d3ee,#a855f7 55%,#f472b6)", soft: "rgba(34,211,238,.14)" },
];

export function frameById(id: string): ProfileFrame {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0];
}

export function themeById(id: string): ProfileTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function frameUnlocked(frame: ProfileFrame, user: User): { ok: boolean; why: string } {
  const level = Math.max(user.level, levelFromXp(user.xp).level);
  if (level < frame.minLevel) return { ok: false, why: `Unlocks at level ${frame.minLevel}` };
  if (frame.badge && !user.achievements.includes(frame.badge)) {
    return { ok: false, why: `Needs the ${achievementById(frame.badge)?.name ?? frame.badge} badge` };
  }
  return { ok: true, why: "Unlocked" };
}

/* --------------------------------- Date utils -------------------------------- */

export { todayKey, yesterdayKey } from "./utils";

export function nextCheckinDay(dates: string[]): number {
  if (dates.length === 0) return 1;
  const sorted = [...dates].sort();
  const last = sorted[sorted.length - 1];
  const consecutive = last === yesterdayKey() || last === todayKey();
  const streak = consecutive ? streakFrom(dates) : 0;
  return (streak % 7) + 1;
}

export function streakFrom(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(todayKey(cursor)) && !set.has(yesterdayKey())) return 0;
  if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function emptyStats(): UserStats {
  return {
    roomsJoined: 0,
    roomChats: 0,
    dms: 0,
    gamesPlayed: 0,
    eventsHosted: 0,
    checkins: 0,
    spins: 0,
    favorites: 0,
  };
}

/* ------------------------------ Storage migration ----------------------------- */

/** Keeps older localStorage payloads usable: fills every new field with a default. */
export function migrateDb(db: DB): DB {
  const rooms: Room[] = (db.rooms ?? []).map((r) => ({
    ...r,
    category: r.category || "Casual Chat",
    announcement: r.announcement ?? "",
    locked: !!r.locked,
    coHostIds: Array.isArray(r.coHostIds) ? r.coHostIds : [],
    tags: Array.isArray(r.tags) && r.tags.length > 0 ? r.tags : ["#vibetalk", `#${(r.category || "chat").toLowerCase().replace(/\s+/g, "")}`],
    speakerRequests: Array.isArray(r.speakerRequests) ? r.speakerRequests : [],
    reactions: Array.isArray(r.reactions) ? r.reactions : [],
    rules: Array.isArray(r.rules) && r.rules.length > 0 ? r.rules : ["18+ only", "Respect all participants", "No spam, advertising, or solicitation", "Take turns on mic"],
  }));

  const users = (db.users ?? []).map((u) => ({
    ...u,
    level: Math.max(u.level ?? 1, levelFromXp(u.xp ?? 0).level),
    frame: u.frame ?? "none",
    theme: u.theme ?? "violet",
    achievements: Array.isArray(u.achievements) ? u.achievements : [],
    checkinDates: Array.isArray(u.checkinDates) ? u.checkinDates : [],
    checkinStreak: u.checkinStreak ?? 0,
    lastSpin: u.lastSpin ?? "",
    spins: u.spins ?? 0,
    sparkles: u.sparkles ?? 0,
    giftsSent: u.giftsSent ?? 0,
    giftsReceived: u.giftsReceived ?? 0,
    stats: { ...emptyStats(), ...(u.stats ?? {}) },
  }));

  return {
    ...db,
    users,
    rooms,
    events: Array.isArray(db.events) ? db.events : [],
    giftLog: Array.isArray(db.giftLog) ? db.giftLog : [],
    recentlyJoinedRooms: Array.isArray(db.recentlyJoinedRooms) ? db.recentlyJoinedRooms : ["r_1", "r_4"],
    favorites: { users: db.favorites?.users ?? [], rooms: db.favorites?.rooms ?? [] },
    notifications: (db.notifications ?? []).map((n) => ({ ...n })),
  };
}
