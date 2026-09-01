import { canonicalInterest } from "./data";
import { DAILY_MISSIONS, WEEKLY_MISSIONS, type Mission } from "./content";
import { levelFromXp } from "./utils";
import { roomHeat, userHeat } from "./social";
import { todayKey, yesterdayKey } from "./utils";
import type { DB, Post, Room, SocialDB, Story, User, Video } from "./types";

export interface Ctx {
  core: DB;
  social: SocialDB;
  me: User | null;
}

export interface Reco<T> {
  item: T;
  score: number;
  reasons: string[];
}

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic "mutual friends" for the demo graph (no backend to ask). */
export function mutualCount(meId: string, otherId: string, friends: string[]): number {
  const direct = friends.filter((f) => hash(f + otherId) % 3 === 0).length;
  return direct + (hash(meId + otherId) % 4);
}

function myInterests(me: User | null): string[] {
  return (me?.interests ?? []).map(canonicalInterest);
}

function isBlocked(ctx: Ctx, id: string): boolean {
  return ctx.core.blocked.includes(id);
}

/** Members an admin suspended or banned in the demo are pulled from discovery. */
function isRemoved(ctx: Ctx, id: string): boolean {
  return ctx.social.admin.banned.includes(id) || ctx.social.admin.suspended.includes(id);
}

/* --------------------------- Friend graph helpers --------------------------- */

export function friendIds(ctx: Ctx): string[] {
  const me = ctx.me;
  if (!me) return [];
  return ctx.social.friends
    .filter((f) => f.state === "accepted" && (f.fromId === me.id || f.toId === me.id))
    .map((f) => (f.fromId === me.id ? f.toId : f.fromId));
}

export function pendingForMe(ctx: Ctx) {
  if (!ctx.me) return { incoming: [], outgoing: [] };
  const id = ctx.me.id;
  return {
    incoming: ctx.social.friends.filter((f) => f.state === "pending" && f.toId === id),
    outgoing: ctx.social.friends.filter((f) => f.state === "pending" && f.fromId === id),
  };
}

/* ------------------------------ Recommendation ------------------------------ */

export function peopleYouMayKnow(ctx: Ctx, limit = 8): Reco<User>[] {
  const me = ctx.me;
  if (!me) return [];
  const friends = friendIds(ctx);
  const myCanon = myInterests(me);
  const linked = new Set([me.id, ...ctx.core.follows, ...friends]);
  const requests = new Set(ctx.social.friends.map((f) => f.fromId).concat(ctx.social.friends.map((f) => f.toId)));

  return ctx.core.users
    .filter((u) => !linked.has(u.id) && !isBlocked(ctx, u.id) && !isRemoved(ctx, u.id))
    .map((user) => {
      const reasons: string[] = [];
      const mutual = mutualCount(me.id, user.id, friends);
      let score = mutual * 8;
      if (mutual > 0) reasons.push(`${mutual} mutual${mutual === 1 ? "" : "s"}`);
      const shared = user.interests.map(canonicalInterest).filter((i) => myCanon.includes(i));
      if (shared.length) {
        score += shared.length * 6;
        reasons.push(shared.slice(0, 2).join(", "));
      }
      if (user.language === me.language) {
        score += 5;
        reasons.push(`speaks ${user.language}`);
      }
      if (user.country === me.country) {
        score += 4;
        reasons.push(`in ${user.country}`);
      }
      if (user.online) {
        score += 3.5;
        reasons.push("online now");
      }
      if (user.followers > 400) reasons.push(`${user.followers.toLocaleString()} followers`);
      if (requests.has(user.id)) reasons.push("on VibeTalk");
      return { item: user, score: Math.round(score * 10) / 10 + userHeat(ctx.core, user) / 400, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function creatorsYouMayLike(ctx: Ctx, limit = 6): Reco<User>[] {
  if (!ctx.me) return [];
  const me = ctx.me;
  const myCanon = myInterests(me);
  const favHosts = ctx.core.favorites.rooms
    .map((id) => ctx.core.rooms.find((r) => r.id === id)?.hostId)
    .filter(Boolean) as string[];

  return ctx.core.users
    .filter((u) => u.id !== me.id && !isBlocked(ctx, u.id) && !isRemoved(ctx, u.id))
    .map((user) => {
      const reasons: string[] = [];
      const posts = ctx.social.posts.filter((p) => p.authorId === user.id);
      const videos = ctx.social.videos.filter((v) => v.authorId === user.id);
      const likes = posts.reduce((s, p) => s + p.likes.length, 0) + videos.reduce((s, v) => s + v.likes.length, 0);
      const views = videos.reduce((s, v) => s + v.views, 0);
      let score = likes / 6 + views / 900 + user.level * 1.4;
      const shared = user.interests.map(canonicalInterest).filter((i) => myCanon.includes(i));
      if (shared.length) {
        score += shared.length * 5;
        reasons.push(`makes ${shared[0]} content`);
      }
      if (posts.length || videos.length) reasons.push(`${posts.length + videos.length} recent posts`);
      if (views > 10000) reasons.push(`${(views / 1000).toFixed(1)}k clip views`);
      if (favHosts.includes(user.id)) {
        score += 18;
        reasons.push("you favourited their room");
      }
      if (ctx.core.follows.includes(user.id)) reasons.push("you follow them");
      else if (user.online) reasons.push("online now");
      return { item: user, score: Math.round(score), reasons: reasons.slice(0, 3) };
    })
    .filter((r) => r.reasons.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function roomsYouMayEnjoy(ctx: Ctx, limit = 8): Reco<Room>[] {
  if (!ctx.me) return [];
  const me = ctx.me;
  const myCanon = myInterests(me);
  const friendSpeaker = new Set(
    ctx.core.rooms
      .filter((r) => r.speakerIds.some((s) => friendIds(ctx).includes(s) || ctx.core.follows.includes(s)))
      .map((r) => r.id),
  );

  return ctx.core.rooms
    .filter((r) => !isBlocked(ctx, r.hostId) && !isRemoved(ctx, r.hostId))
    .map((room) => {
      const host = ctx.core.users.find((u) => u.id === room.hostId);
      const reasons: string[] = [];
      let score = roomHeat(ctx.core, room) / 60;
      const hostShared = host ? host.interests.map(canonicalInterest).filter((i) => myCanon.includes(i)) : [];
      if (hostShared.length) {
        score += hostShared.length * 7;
        reasons.push(`because you like ${hostShared[0]}`);
      }
      if (friendSpeaker.has(room.id)) {
        score += 25;
        reasons.push("a friend or follow is on mic");
      }
      if (ctx.core.favorites.rooms.includes(room.id)) {
        score += 20;
        reasons.push("you favourited this room");
      }
      if (host?.language === me.language) {
        score += 6;
        reasons.push(`hosts in ${me.language}`);
      }
      if (room.listeners > 90) reasons.push(`${room.listeners} listening`);
      if (room.category === "Trending" || room.live) reasons.push(room.live ? "live right now" : "scheduled");
      return { item: room, score: Math.round(score), reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** "Because you like …" clusters across every content type. */
export function becauseYouLike(ctx: Ctx) {
  const counts = new Map<string, number>();
  myInterests(ctx.me).forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 3));
  ctx.core.rooms.forEach((r) => {
    const host = ctx.core.users.find((u) => u.id === r.hostId);
    host?.interests.map(canonicalInterest).forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1));
  });
  ctx.social.videos.forEach((v) => {
    const author = ctx.core.users.find((u) => u.id === v.authorId);
    author?.interests.map(canonicalInterest).forEach((i) => counts.set(i, (counts.get(i) ?? 0) + 1.5));
  });
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  return sorted.map(([interest, weight]) => ({
    interest,
    weight: Math.round(weight),
    rooms: roomsYouMayEnjoy(ctx, 20).filter((r) => r.reasons.some((x) => x.includes(interest)) || r.item.category === interest).slice(0, 3),
    creators: creatorsYouMayLike(ctx, 20).filter((r) => r.item.interests.map(canonicalInterest).includes(interest)).slice(0, 3),
    videos: trendingVideos(ctx, 20).filter((row) => row.video.hashtags.join(" ").toLowerCase().includes(interest.toLowerCase())).slice(0, 3),
  }));
}

/* --------------------------------- Content --------------------------------- */

export function engagement(post: Post | Video): number {
  const likes = post.likes.length;
  const comments = post.comments.length;
  const shares = post.shares;
  const ageH = Math.max(0.4, (Date.now() - post.createdAt) / 3_600_000);
  return Math.round(((likes * 3 + comments * 8 + shares * 5) / ageH) * 10) / 10;
}

export function trendingPosts(ctx: Ctx, limit = 6) {
  return ctx.social.posts
    .map((post) => ({ post, score: engagement(post) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function trendingVideos(ctx: Ctx, limit = 8) {
  return ctx.social.videos
    .map((video) => ({ video, score: engagement(video) + video.views / 500 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function newUsers(ctx: Ctx, limit = 6) {
  return [...ctx.core.users]
    .filter((u) => u.id !== ctx.me?.id && !isBlocked(ctx, u.id))
    .sort((a, b) => b.joinedAt - a.joinedAt)
    .slice(0, limit);
}

export function risingUsers(ctx: Ctx, limit = 6) {
  return [...ctx.core.users]
    .filter((u) => u.id !== ctx.me?.id && !isBlocked(ctx, u.id))
    .map((user) => {
      const gained = levelFromXp(user.xp).into;
      const momentum = gained + (user.online ? 220 : 0) + ctx.social.videos.filter((v) => v.authorId === user.id).length * 90;
      return { user, momentum: Math.round(momentum) };
    })
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, limit);
}

export function clipsForMe(ctx: Ctx): Reco<Video>[] {
  const canon = myInterests(ctx.me);
  return ctx.social.videos.map((video) => {
    const author = ctx.core.users.find((u) => u.id === video.authorId);
    const reasons: string[] = [];
    let score = engagement(video) + video.views / 900;
    if (author && ctx.core.follows.includes(author.id)) {
      score += 30;
      reasons.push("creator you follow");
    }
    if (author?.interests.map(canonicalInterest).some((i) => canon.includes(i))) {
      score += 14;
      reasons.push("matches your interests");
    }
    if (video.music.includes("— ")) reasons.push(`sound: ${video.music.split(" — ")[1] ?? video.music}`);
    return { item: video, score: Math.round(score), reasons };
  });
}

/* --------------------------------- Stories --------------------------------- */

export interface StoryRing {
  user: User;
  stories: Story[];
  unseen: number;
}

export function storyRings(ctx: Ctx): StoryRing[] {
  const now = Date.now();
  const live = ctx.social.stories.filter((s) => s.expiresAt > now);
  const byUser = new Map<string, typeof live>();
  live.forEach((s) => {
    byUser.set(s.authorId, [...(byUser.get(s.authorId) ?? []), s]);
  });
  const order = (a: string, b: string) => {
    if (a === ctx.me?.id) return -1;
    if (b === ctx.me?.id) return 1;
    const ua = ctx.core.users.find((u) => u.id === a);
    const ub = ctx.core.users.find((u) => u.id === b);
    const fa = ctx.core.favorites.users.includes(a) ? 1 : 0;
    const fb = ctx.core.favorites.users.includes(b) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const on = (ua?.online ? 1 : 0) - (ub?.online ? 1 : 0);
    if (on !== 0) return -on;
    return (ub?.followers ?? 0) - (ua?.followers ?? 0);
  };
  return [...byUser.entries()]
    .sort((a, b) => order(a[0], b[0]))
    .map(([authorId, stories]) => {
      const user = ctx.core.users.find((u) => u.id === authorId) || (ctx.me?.id === authorId ? ctx.me : null);
      if (!user) return null;
      return {
        user,
        stories: stories.sort((x, y) => x.createdAt - y.createdAt),
        unseen: stories.filter((s) => !ctx.me || !s.views.includes(ctx.me.id)).length,
      };
    })
    .filter(Boolean) as StoryRing[];
}

/* --------------------------------- Missions -------------------------------- */

export interface MissionRow {
  mission: Mission;
  have: number;
  done: boolean;
  claimed: boolean;
}

export function missionProgress(ctx: Ctx): { daily: MissionRow[]; weekly: MissionRow[]; dailyDone: number; weeklyDone: number } {
  if (!ctx.me) return { daily: [], weekly: [], dailyDone: 0, weeklyDone: 0 };
  const m = ctx.social.missions;
  const core = ctx.core;
  const me = ctx.me;
  const today = todayKey();

  const counters: Record<string, number> = {
    roomJoin: m.daily.roomJoin ?? 0,
    message:
      core.chats.filter((c) => c.userId === me.id && c.at > startOfToday()).length +
      core.messages.filter((x) => x.from === me.id && x.at > startOfToday()).length +
      ctx.social.groupMessages.filter((g) => g.fromId === me.id && g.at > startOfToday()).length,
    follow: m.daily.follow ?? 0,
    game: m.daily.game ?? 0,
    checkin: (me.checkinDates ?? []).includes(today) ? 1 : 0,
    gift: core.giftLog.filter((g) => g.fromId === me.id && g.at > startOfToday()).length,
    post: ctx.social.posts.filter((p) => p.authorId === me.id && p.createdAt > startOfToday()).length,
    reel: m.daily.reel ?? 0,
    weekRooms: m.weekly.weekRooms ?? 0,
    weekFriends: friendIds(ctx).length,
    weekGames: core.scores.length,
    weekXp: Math.round(me.xp % 4000) + (m.weekly.weekXp ?? 0),
    weekLive: m.weekly.weekLive ?? 0,
  };

  const build = (list: Mission[], claimed: string[]): MissionRow[] =>
    list.map((mission) => {
      const have = Math.min(mission.goal, counters[mission.key] ?? 0);
      return { mission, have, done: have >= mission.goal, claimed: claimed.includes(mission.id) };
    });

  const daily = build(DAILY_MISSIONS, m.claimedDaily);
  const weekly = build(WEEKLY_MISSIONS, m.claimedWeekly);
  return {
    daily,
    weekly,
    dailyDone: daily.filter((r) => r.done).length,
    weeklyDone: weekly.filter((r) => r.done).length,
  };
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/* --------------------------------- Streaks --------------------------------- */

export interface StreakRow {
  key: "login" | "chat" | "room" | "friend";
  label: string;
  days: number;
  activeToday: boolean;
  emoji: string;
  blurb: string;
}

export function streakRows(ctx: Ctx): StreakRow[] {
  const s = ctx.social.streaks;
  const today = todayKey();
  const yest = yesterdayKey();
  const rows: StreakRow[] = [
    { key: "login", label: "Daily login", days: s.login, activeToday: s.loginDate === today, emoji: "🔥", blurb: "Open VibeTalk once a day" },
    { key: "chat", label: "Chat streak", days: s.chat, activeToday: s.chatDate === today, emoji: "💬", blurb: "Send a DM or room message" },
    { key: "room", label: "Room streak", days: s.room, activeToday: s.roomDate === today, emoji: "🎙️", blurb: "Sit in a voice room" },
    { key: "friend", label: "Friend streak", days: s.friend, activeToday: s.friendDate === today, emoji: "🤝", blurb: "Add or catch up with a friend" },
  ];
  return rows.map((r) => ({ ...r, days: r.activeToday ? r.days : r.days && s[`${r.key}Date` as keyof typeof s] === yest ? r.days : 0 }));
}

/* ------------------------------ Creator analytics --------------------------- */

export interface CreatorStats {
  followers: number;
  profileViews: number;
  roomVisits: number;
  videoViews: number;
  likes: number;
  comments: number;
  giftsReceived: number;
  sparkles: number;
  xpEarned: number;
  level: number;
  engagement: number;
  posts: number;
  clips: number;
  friends: number;
  roomsHosted: number;
  seatsFilled: number;
}

export function creatorStats(ctx: Ctx): CreatorStats {
  if (!ctx.me) {
    return {
      followers: 0, profileViews: 0, roomVisits: 0, videoViews: 0, likes: 0, comments: 0, giftsReceived: 0,
      sparkles: 0, xpEarned: 0, level: 1, engagement: 0, posts: 0, clips: 0, friends: 0, roomsHosted: 0, seatsFilled: 0,
    };
  }
  const me = ctx.me;
  const posts = ctx.social.posts.filter((p) => p.authorId === me.id);
  const videos = ctx.social.videos.filter((v) => v.authorId === me.id);
  const likes = posts.reduce((s, p) => s + p.likes.length, 0) + videos.reduce((s, v) => s + v.likes.length, 0);
  const comments = posts.reduce((s, p) => s + p.comments.length, 0) + videos.reduce((s, v) => s + v.comments.length, 0);
  const videoViews = videos.reduce((s, v) => s + v.views, 0);
  const myRooms = ctx.core.rooms.filter((r) => r.hostId === me.id);
  const reach = Math.max(1, me.followers + likes + 1);
  return {
    followers: me.followers,
    profileViews: 180 + me.xp * 0.4 + posts.length * 240 + (hash(me.id) % 320),
    roomVisits: me.stats.roomsJoined * 14 + myRooms.reduce((s, r) => s + r.listeners, 0),
    videoViews,
    likes,
    comments,
    giftsReceived: me.giftsReceived + ctx.core.giftLog.filter((g) => g.toId === me.id).length,
    sparkles: me.sparkles + ctx.core.giftLog.filter((g) => g.toId === me.id).length * 35,
    xpEarned: Math.round(me.xp),
    level: levelFromXp(me.xp).level,
    engagement: Math.round(((likes + comments) / reach) * 1000) / 10,
    posts: posts.length,
    clips: videos.length,
    friends: friendIds(ctx).length,
    roomsHosted: myRooms.length,
    seatsFilled: myRooms.reduce((s, r) => s + r.speakerIds.length, 0),
  };
}

export function creatorSeries(ctx: Ctx) {
  const stats = creatorStats(ctx);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString(undefined, { weekday: "short" });
  });
  const seed = hash(ctx.me?.id ?? "vibetalk");
  const wobble = (base: number, i: number, spread: number) =>
    Math.max(0, Math.round(base + Math.sin((seed % 7) + i * 1.35) * spread + i * (spread / 3.4)));
  const followers: number[] = [];
  let cursor = Math.max(4, Math.round(stats.followers * 0.82));
  for (let i = 0; i < 7; i++) {
    cursor += wobble(0, i, 7);
    followers.push(cursor);
  }
  return {
    days,
    followers,
    views: days.map((_, i) => wobble(Math.round(stats.videoViews / 7) + 40, i, 46)),
    roomTraffic: days.map((_, i) => wobble(Math.round(stats.roomVisits / 7) + 18, i, 22)),
    xp: days.map((_, i) => wobble(Math.round(stats.xpEarned / 24) + 30, i, 26)),
    likes: days.map((_, i) => wobble(Math.round(stats.likes / 7) + 6, i, 9)),
  };
}

export function audienceSplit(ctx: Ctx) {
  const countries = new Map<string, number>();
  const languages = new Map<string, number>();
  const interests = new Map<string, number>();
  ctx.core.users
    .filter((u) => u.id !== ctx.me?.id)
    .forEach((u) => {
      countries.set(u.country, (countries.get(u.country) ?? 0) + 8 + (u.followers % 26));
      languages.set(u.language, (languages.get(u.language) ?? 0) + 6 + (u.level % 14));
      u.interests.map(canonicalInterest).forEach((i) => interests.set(i, (interests.get(i) ?? 0) + 5 + (u.followers % 11)));
    });
  const top = (map: Map<string, number>, n: number) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
  return { countries: top(countries, 5), languages: top(languages, 4), interests: top(interests, 6) };
}

export function topContent(ctx: Ctx) {
  if (!ctx.me) return [];
  const mine = [
    ...ctx.social.posts.filter((p) => p.authorId === ctx.me!.id).map((p) => ({ kind: "post" as const, id: p.id, title: p.text.slice(0, 54), at: p.createdAt, score: engagement(p), metric: `${p.likes.length} likes` })),
    ...ctx.social.videos.filter((v) => v.authorId === ctx.me!.id).map((v) => ({ kind: "clip" as const, id: v.id, title: v.title, at: v.createdAt, score: engagement(v) + v.views / 600, metric: `${v.views.toLocaleString()} views` })),
    ...ctx.core.rooms.filter((r) => r.hostId === ctx.me!.id).map((r) => ({ kind: "room" as const, id: r.id, title: r.title, at: r.createdAt, score: roomHeat(ctx.core, r) / 8, metric: `${r.listeners} listening` })),
  ];
  return mine.sort((a, b) => b.score - a.score).slice(0, 5);
}

/* --------------------------------- Search ---------------------------------- */

export interface DiscoverHit {
  kind: "user" | "room" | "post" | "video" | "story" | "group" | "event";
  id: string;
  title: string;
  sub: string;
  to: string;
}

export function globalSearch(ctx: Ctx, raw: string): DiscoverHit[] {
  const q = raw.trim().toLowerCase();
  if (q.length < 1) return [];
  const hits: DiscoverHit[] = [];
  ctx.core.users.forEach((u) => {
    if (`${u.username} ${u.bio} ${u.country} ${u.interests.join(" ")}`.toLowerCase().includes(q))
      hits.push({ kind: "user", id: u.id, title: `@${u.username}`, sub: `${u.country} · LV ${u.level} · ${u.online ? "online" : "offline"}`, to: `/u/${u.id}` });
  });
  ctx.core.rooms.forEach((r) => {
    if (`${r.title} ${r.topic} ${r.category} ${r.description}`.toLowerCase().includes(q))
      hits.push({ kind: "room", id: r.id, title: r.title, sub: `${r.category} · ${r.listeners} listening`, to: `/rooms/${r.id}` });
  });
  ctx.social.posts.forEach((p) => {
    if (`${p.text} ${p.hashtag}`.toLowerCase().includes(q))
      hits.push({ kind: "post", id: p.id, title: p.text.slice(0, 60), sub: `${ctx.core.users.find((u) => u.id === p.authorId)?.username ?? "member"} · ${p.likes.length} likes`, to: `/posts?focus=${p.id}` });
  });
  ctx.social.videos.forEach((v) => {
    if (`${v.title} ${v.music} ${v.hashtags.join(" ")}`.toLowerCase().includes(q))
      hits.push({ kind: "video", id: v.id, title: v.title, sub: `${v.views.toLocaleString()} views · ${v.music}`, to: `/reels?start=${v.id}` });
  });
  ctx.social.stories.forEach((s) => {
    if (s.caption.toLowerCase().includes(q))
      hits.push({ kind: "story", id: s.id, title: s.caption, sub: `${ctx.core.users.find((u) => u.id === s.authorId)?.username ?? "member"} · story`, to: "/discover" });
  });
  ctx.social.groups.forEach((g) => {
    if (`${g.name} ${g.about}`.toLowerCase().includes(q))
      hits.push({ kind: "group", id: g.id, title: g.name, sub: `${g.memberIds.length} members`, to: `/messages?group=${g.id}` });
  });
  ctx.core.events.forEach((e) => {
    if (`${e.name} ${e.description} ${e.category}`.toLowerCase().includes(q))
      hits.push({ kind: "event", id: e.id, title: e.name, sub: `${e.date} ${e.time} · ${e.category}`, to: "/events" });
  });
  return hits.slice(0, 40);
}
