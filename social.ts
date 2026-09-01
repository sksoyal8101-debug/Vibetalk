import { Clapperboard, Flame, Gamepad2, GraduationCap, Heart, MessageSquareText, Music2 } from "lucide-react";
import { GAMES_LIST } from "./games";
import { GIFTS } from "./data";
import { levelFromXp } from "./utils";
import { levelTitle } from "./progression";
import type { DB, Room, RoomEvent, User } from "./types";

/* --------------------------------- Categories -------------------------------- */

export const ROOM_CATEGORIES = [
  { key: "Friendship", icon: Heart, hue: "linear-gradient(135deg,#ec4899,#f472b6)" },
  { key: "Music", icon: Music2, hue: "linear-gradient(135deg,#7c3aed,#22d3ee)" },
  { key: "Gaming", icon: Gamepad2, hue: "linear-gradient(135deg,#2563eb,#a855f7)" },
  { key: "Casual Chat", icon: MessageSquareText, hue: "linear-gradient(135deg,#059669,#a855f7)" },
  { key: "Study", icon: GraduationCap, hue: "linear-gradient(135deg,#0f766e,#c084fc)" },
  { key: "Entertainment", icon: Clapperboard, hue: "linear-gradient(135deg,#db2777,#fb923c)" },
  { key: "Trending", icon: Flame, hue: "linear-gradient(135deg,#be123c,#7c3aed)" },
] as const;

export type CategoryKey = (typeof ROOM_CATEGORIES)[number]["key"];

export function categoryMeta(key: string) {
  return ROOM_CATEGORIES.find((c) => c.key === key) ?? ROOM_CATEGORIES[3];
}

export function categorize(topic: string, title: string): CategoryKey {
  const hay = `${topic} ${title}`.toLowerCase();
  if (/music|lo-fi|beat|vinyl|dj|karaoke|playlist/.test(hay)) return "Music";
  if (/game|gaming|rhythm|rank|arcade|dice|puzzle/.test(hay)) return "Gaming";
  if (/study|book|read|learn|exam|code|coding|dev|language/.test(hay)) return "Study";
  if (/movie|film|comedy|show|entertain|anime|story/.test(hay)) return "Entertainment";
  if (/friend|meet|speed|icebreak|sing/.test(hay)) return "Friendship";
  if (/trend|hot|viral|top/.test(hay)) return "Trending";
  return "Casual Chat";
}

/* ---------------------------------- Scoring ---------------------------------- */

function chatCount(db: DB, roomId: string): number {
  let n = 0;
  for (const c of db.chats) if (c.roomId === roomId) n += 1;
  return n;
}

export function roomHeat(db: DB, room: Room): number {
  const freshness = Math.max(0, 1 - (Date.now() - room.createdAt) / (1000 * 60 * 60 * 18));
  const fill = room.seats > 0 ? room.speakerIds.length / room.seats : 0;
  return Math.round(
    room.listeners * 2.6 + room.speakerIds.length * 9 + fill * 60 + chatCount(db, room.id) * 14 + (room.live ? 120 : 0) + freshness * 70,
  );
}

export interface TrendingRoom {
  room: Room;
  score: number;
  reason: string;
}

export function trendingRooms(db: DB, limit = 6): TrendingRoom[] {
  return db.rooms
    .map((room) => {
      const score = roomHeat(db, room);
      const reason =
        room.listeners > 120
          ? `${room.listeners} listening right now`
          : chatCount(db, room.id) > 3
            ? `${chatCount(db, room.id)} messages in the last hour`
            : room.speakerIds.length >= 4
              ? `${room.speakerIds.length} people on mic`
              : `${room.topic} is picking up steam`;
      return { room, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function userHeat(db: DB, user: User): number {
  const received = db.giftLog.filter((g) => g.toId === user.id).reduce((sum, g) => {
    const gift = GIFTS.find((x) => x.id === g.giftId);
    return sum + (gift?.price ?? 50);
  }, 0);
  const chats = chatCount(db, "");
  void chats;
  const activity =
    db.messages.filter((m) => m.from === user.id).length + db.chats.filter((c) => c.userId === user.id).length;
  return Math.round(
    user.followers * 1.4 + (user.online ? 180 : 0) + user.level * 12 + received / 6 + activity * 8 + (user.verified ? 90 : 0),
  );
}

export interface TrendingUser {
  user: User;
  score: number;
  reason: string;
}

export function trendingUsers(db: DB, excludeId?: string, limit = 8): TrendingUser[] {
  return db.users
    .filter((u) => u.id !== excludeId && !db.blocked.includes(u.id))
    .map((user) => {
      const score = userHeat(db, user);
      const reason = user.online
        ? `Online · ${user.followers.toLocaleString()} followers`
        : `${user.level > 25 ? "Top-tier host" : "Rising"} · LV ${user.level}`;
      return { user, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function risingStars(db: DB, limit = 4): TrendingUser[] {
  return db.users
    .filter((u) => u.id !== db.users[0]?.id && !db.blocked.includes(u.id))
    .map((user) => {
      const gained = Math.round(user.xp / Math.max(1, levelFromXp(user.xp).level));
      const momentum = gained + (user.online ? 120 : 0) + (1000 / Math.max(1, Math.log2(user.followers + 2)));
      return { user, score: Math.round(momentum), reason: `+${gained} xp this week · ${user.followers} followers` };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface GameStat {
  key: string;
  name: string;
  plays: number;
  points: number;
  hue: string;
  icon: typeof Gamepad2;
  blurb: string;
  win: number;
}

export function popularGames(db: DB): GameStat[] {
  const plays = db.scores.reduce<Record<string, number>>((acc, s) => {
    acc[s.game] = (acc[s.game] ?? 0) + 1;
    return acc;
  }, {});
  const base = db.users.length * 6;
  return GAMES_LIST.map((g, i) => {
    const points = db.scores.filter((s) => s.game === g.key).reduce((sum, s) => sum + s.points, 0);
    const sessions = (plays[g.key] ?? 0) + base - i * 7;
    return {
      key: g.key,
      name: g.name,
      blurb: g.blurb,
      win: g.win,
      hue: g.hue,
      icon: g.icon,
      plays: Math.max(1, sessions),
      points,
    };
  }).sort((a, b) => b.plays - a.plays);
}

/* ------------------------------ Recommendations ------------------------------ */

export interface ScoredUser {
  user: User;
  why: string[];
  score: number;
}
export interface ScoredRoom {
  room: Room;
  why: string;
  score: number;
}

export function recommendFor(db: DB, me: User | null) {
  if (!me) return { users: [] as ScoredUser[], rooms: [] as ScoredRoom[], games: [] as GameStat[] };

  const users: ScoredUser[] = db.users
    .filter((u) => u.id !== me.id && !db.blocked.includes(u.id) && !db.follows.includes(u.id))
    .map((u) => {
      const shared = u.interests.filter((i) => me.interests.includes(i));
      const why: string[] = [];
      let score = u.followers / 500;
      if (shared.length) {
        score += shared.length * 3.4;
        why.push(`${shared.slice(0, 2).join(" + ")}`);
      }
      if (u.language === me.language) {
        score += 4.5;
        why.push(`speaks ${u.language}`);
      }
      if (u.country === me.country) {
        score += 3.2;
        why.push(`in ${u.country}`);
      }
      if (u.online) {
        score += 2.4;
        why.push("online now");
      }
      if (u.level >= 25) why.push(`LV ${u.level} host`);
      return { user: u, why, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score);

  const speakerRooms = new Set(db.rooms.filter((r) => r.speakerIds.some((s) => db.follows.includes(s))).map((r) => r.id));
  const rooms: ScoredRoom[] = db.rooms
    .filter((r) => !db.blocked.includes(r.hostId))
    .map((r) => {
      const host = db.users.find((u) => u.id === r.hostId);
      const shared = host ? host.interests.filter((i) => me.interests.includes(i)) : [];
      let score = roomHeat(db, r) / 90 + shared.length * 2.6;
      const why: string[] = [];
      if (speakerRooms.has(r.id)) {
        score += 22;
        why.push("a friend is on mic");
      }
      if (host?.language === me.language) {
        score += 5;
        why.push(`hosts in ${me.language}`);
      }
      if (shared[0]) why.push(shared[0]);
      if (r.listeners > 100) why.push(`${r.listeners} listening`);
      return { room: r, why: why.join(" · ") || `${r.topic} near you`, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score);

  const myInterests = me.interests.join(" ").toLowerCase();
  const games = popularGames(db)
    .map((g) => ({ ...g, plays: g.plays + (/game|music/.test(myInterests) && g.name.includes("Dice") ? 6 : 0) }))
    .slice(0, 4);

  return { users, rooms, games };
}

/* --------------------------------- Leaderboard -------------------------------- */

export type BoardTab = "xp" | "coins" | "rooms" | "hosts" | "gifters" | "active" | "rising";
export type BoardScope = "global" | "weekly" | "monthly" | "friends";

export const BOARD_TABS: { key: BoardTab; label: string; blurb: string }[] = [
  { key: "xp", label: "XP Ranking", blurb: "Highest total experience earned from all social activities" },
  { key: "coins", label: "Coins Balance", blurb: "Top Vibe Coins collectors and gift wealth" },
  { key: "rooms", label: "Room Activity", blurb: "Active stage presence, seats kept and hosted listener heat" },
  { key: "hosts", label: "Top Hosts", blurb: "Rooms filled, stage moderated, community kept kind" },
  { key: "gifters", label: "Top Gifters", blurb: "Virtual coins gifted — pure positive vibes, no cash value" },
  { key: "active", label: "Most Active", blurb: "Chat, DMs, groups and room time combined" },
];

export const BOARD_SCOPES: { key: BoardScope; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "friends", label: "Friends" },
];

export interface BoardRow {
  rank: number;
  user: User;
  score: number;
  label: string;
  sub: string;
  badge?: string;
}

export function leaderboard(
  db: DB,
  tab: BoardTab,
  meId?: string,
  scope: BoardScope = "global",
  friendIdsList: string[] = []
): BoardRow[] {
  let userPool = db.users.filter((u) => !db.blocked.includes(u.id));

  if (scope === "friends") {
    const friendSet = new Set(friendIdsList);
    if (meId) friendSet.add(meId);
    userPool = userPool.filter((u) => friendSet.has(u.id));
  }

  const rows = userPool
    .map((user) => {
      const hosted = db.rooms.filter((r) => r.hostId === user.id);
      const seats = hosted.reduce((s, r) => s + r.speakerIds.length, 0);
      const giftIn = db.giftLog
        .filter((g) => g.toId === user.id)
        .reduce((s, g) => s + (GIFTS.find((x) => x.id === g.giftId)?.price ?? 50), 0);
      const giftOut = db.giftLog.filter((g) => g.fromId === user.id).length + user.giftsSent;
      const chatter = db.chats.filter((c) => c.userId === user.id).length + db.messages.filter((m) => m.from === user.id).length;
      const level = Math.max(user.level, levelFromXp(user.xp).level);

      // Scope multiplier to simulate time frames realistically in the local demo
      const timeFactor = scope === "weekly" ? 0.32 : scope === "monthly" ? 0.65 : 1;

      let score = 0;
      let label = "";
      let sub = "";
      let badge: string | undefined;

      if (tab === "xp") {
        score = Math.round(user.xp * timeFactor);
        label = `Level ${level} · ${score.toLocaleString()} XP`;
        sub = `${user.country} · ${levelTitle(level)}`;
        if (score > 10000) badge = "⚡ Elite";
      } else if (tab === "coins") {
        score = Math.round(user.coins * (scope === "weekly" ? 0.25 : scope === "monthly" ? 0.6 : 1));
        label = `${score.toLocaleString()} Vibe Coins`;
        sub = `${user.sparkles.toLocaleString()} sparkles received`;
        if (user.coins >= 50000) badge = "💎 VIP";
      } else if (tab === "rooms") {
        const roomHeatTotal = hosted.reduce((sum, r) => sum + (r.listeners * 2 + r.speakerIds.length * 5), 0);
        score = Math.round((hosted.length * 300 + roomHeatTotal + user.stats.roomsJoined * 40) * timeFactor);
        label = `${hosted.length} hosted · ${user.stats.roomsJoined} joined`;
        sub = `${hosted.reduce((s, r) => s + r.listeners, 0)} total listeners`;
        if (score > 500) badge = "🎙️ Live Star";
      } else if (tab === "hosts") {
        score = Math.round((hosted.length * 420 + seats * 90 + user.followers / 3 + level * 25) * timeFactor);
        label = `${hosted.length} room${hosted.length === 1 ? "" : "s"} hosted`;
        sub = `${user.followers.toLocaleString()} followers · ${user.country}`;
        if (hosted.length >= 2) badge = "🎧 Top host";
      } else if (tab === "gifters") {
        score = Math.round((giftOut * 240 + user.giftsSent * 180 + level * 12) * timeFactor);
        label = `${giftOut + user.giftsSent} gifts sent`;
        sub = `${(giftIn + user.sparkles).toLocaleString()} sparkles received`;
        if (giftOut + user.giftsSent >= 3) badge = "🎁 Gift lover";
      } else if (tab === "active") {
        score = Math.round((chatter * 55 + level * 30 + (user.online ? 150 : 0) + user.stats.roomChats * 40) * timeFactor);
        label = `${chatter + user.stats.roomChats} messages`;
        sub = `${user.online ? "Online now" : "Offline"} · LV ${level}`;
        if (chatter > 4) badge = "🦋 Chat butterfly";
      } else {
        score = Math.round((levelFromXp(user.xp).into + (level < 22 ? 260 - level * 6 : 0) + user.xp / 40) * timeFactor);
        label = `${Math.round(levelFromXp(user.xp).into)} xp to level ${level + 1}`;
        sub = `${level}% into LV ${level + 1} · ${user.interests[0] ?? "social"}`;
        if (levelFromXp(user.xp).pct > 55) badge = "🚀 Rising";
      }
      return { user, score: Math.round(score), label, sub, badge };
    })
    .sort((a, b) => b.score - a.score);

  return rows.map((r, i) => ({
    rank: i + 1,
    ...r,
    badge: r.user.id === meId ? "You" : r.badge,
  }));
}

/* ----------------------------------- Events ---------------------------------- */

export interface UpcomingEvent extends RoomEvent {
  host?: User;
  startsIn: number;
  soon: boolean;
}

export function upcomingEvents(db: DB, limit = 4): UpcomingEvent[] {
  const now = Date.now();
  return db.events
    .map((e) => {
      const at = new Date(`${e.date}T${e.time || "20:00"}`).getTime();
      const startsIn = Number.isNaN(at) ? 86_400_000 : at - now;
      return {
        ...e,
        host: db.users.find((u) => u.id === e.hostId),
        startsIn,
        soon: startsIn > 0 && startsIn < 1000 * 60 * 60 * 24,
      };
    })
    .sort((a, b) => a.startsIn - b.startsIn)
    .slice(0, limit);
}

export function eventWhen(e: UpcomingEvent): string {
  if (e.startsIn <= 0) return "Starting now";
  const hours = Math.floor(e.startsIn / 3_600_000);
  if (hours < 1) return `In ${Math.max(1, Math.round(e.startsIn / 60000))} min`;
  if (hours < 24) return `In ${hours}h`;
  const days = Math.round(hours / 24);
  return `In ${days} day${days === 1 ? "" : "s"}`;
}
