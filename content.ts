import type {
  FriendLink,
  Group,
  GroupMessage,
  Post,
  SocialDB,
  Story,
  Video,
} from "./types";
import { todayKey } from "./utils";

const MIN = 60_000;
const HOUR = 3_600_000;

/* ---------------------------------------------------------------------------
 * Procedural art direction. No raster assets, nothing to download: every
 * "clip", post image and story is a layered CSS composition keyed off a tone.
 * ------------------------------------------------------------------------- */
export interface Tone {
  id: number;
  label: string;
  base: string;
  wash: string;
  accent: string;
  motif: "wave" | "rings" | "grid" | "beams" | "orb" | "scan" | "spark" | "arc";
}

export const TONES: Tone[] = [
  { id: 0, label: "Rooftop 3AM", base: "#150a26", wash: "linear-gradient(150deg,#7c3adecd,#ec4899b3,#111827ee)", accent: "#f0abfc", motif: "beams" },
  { id: 1, label: "Neon Alley", base: "#0b1022", wash: "linear-gradient(200deg,#1d4ed8d9,#a855f7bf,#0f172af2)", accent: "#67e8f9", motif: "scan" },
  { id: 2, label: "Studio Booth", base: "#1a0f10", wash: "linear-gradient(160deg,#be123ccc,#f59e0bb3,#1c1917f0)", accent: "#fcd34d", motif: "wave" },
  { id: 3, label: "Karaoke Night", base: "#180a1f", wash: "linear-gradient(135deg,#db2777d9,#8b5cf6c4,#0b0714f2)", accent: "#fda4af", motif: "spark" },
  { id: 4, label: "Late Radio", base: "#08111a", wash: "linear-gradient(170deg,#0e7490d9,#7c3ad0c4,#020617f2)", accent: "#a5f3fc", motif: "rings" },
  { id: 5, label: "Study Room", base: "#0c1512", wash: "linear-gradient(145deg,#059669cf,#c084fcb3,#08110deF)", accent: "#86efac", motif: "grid" },
  { id: 6, label: "Arcade", base: "#120821", wash: "linear-gradient(155deg,#4c1d95e6,#22d3eeb3,#0b0714f2)", accent: "#c4b5fd", motif: "arc" },
  { id: 7, label: "Aurora Bus", base: "#061318", wash: "linear-gradient(165deg,#0f766ee6,#a855f7b3,#020617f2)", accent: "#7dd3fc", motif: "orb" },
];

export function toneById(id: number): Tone {
  return TONES[((id % TONES.length) + TONES.length) % TONES.length];
}

/** CSS background for a group cover, post image or story slide. */
export function clipCover(tone: number): string {
  return toneById(tone).wash;
}

export const clipTonesSafe = clipCover;

/* --------------------------------- Music ---------------------------------- */

export const TRACKS = [
  "midnight interlude — nova.waves",
  "lo-fi for the 4th floor — kai",
  "Bossa in a small room — marco",
  "Aurora (slowed) — lena",
  "vinyl crackle vol. 7 — amara",
  "arcade heartbeat — yuki",
];

export const HASHTAGS = [
  "#nightradio", "#roomtour", "#firstmic", "#lofi", "#speedfriends", "#studysprint",
  "#beatbattle", "#travelstory", "#opmic", "#cozysetup", "#dicegang", "#aurora",
];

/* --------------------------------- VIP ------------------------------------ */

export interface VipTier {
  id: "silver" | "gold" | "diamond";
  name: string;
  price: string;
  colors: [string, string];
  perks: string[];
  frame: string;
  theme: string;
  badgeStyle: string;
  nameEffect: string;
}

export const VIP_TIERS: VipTier[] = [
  {
    id: "silver",
    name: "VIP Silver",
    price: "48,000 VC",
    colors: ["#94a3b8", "#e2e8f0"],
    frame: "rings",
    theme: "midnight",
    badgeStyle: "shimmer",
    nameEffect: "soft-glow",
    perks: [
      "Silver VIP badge beside your name",
      "Voice Rings avatar border",
      "Midnight profile theme",
      "Priority placement in People you may know",
      "3 extra profile themes",
    ],
  },
  {
    id: "gold",
    name: "VIP Gold",
    price: "180,000 VC",
    colors: ["#f59e0b", "#fde68a"],
    frame: "starlit",
    theme: "sunset",
    badgeStyle: "foil",
    nameEffect: "shine",
    perks: [
      "Animated gold name effect",
      "Starlit frame + Sunset theme",
      "Priority profile visibility in Discover",
      "Exclusive weekly badge frames",
      "Room announcement colour styling",
      "Early access to new demo features",
    ],
  },
  {
    id: "diamond",
    name: "VIP Diamond",
    price: "520,000 VC",
    colors: ["#22d3ee", "#a855f7"],
    frame: "mythic",
    theme: "aurora",
    badgeStyle: "prism",
    nameEffect: "prism",
    perks: [
      "Prism frame with reactive glow",
      "All themes, frames and badge styles unlocked",
      "Top billing in Trending Rooms previews",
      "Diamond-only story stickers",
      "Custom room announcement banner",
      "Creator analytics export (demo)",
    ],
  },
];

export function vipTier(id: string | null): VipTier | null {
  return VIP_TIERS.find((t) => t.id === id) ?? null;
}

/* ------------------------------- Missions ---------------------------------- */

export interface Mission {
  id: string;
  label: string;
  hint: string;
  goal: number;
  key: string;
  xp: number;
  coins: number;
  emoji: string;
  reward?: string;
}

export const DAILY_MISSIONS: Mission[] = [
  { id: "d-room", key: "roomJoin", label: "Join a voice room", hint: "Take any seat for 30 seconds", goal: 1, xp: 40, coins: 120, emoji: "🎙️" },
  { id: "d-msg", key: "message", label: "Send 3 messages", hint: "Room chat or DMs both count", goal: 3, xp: 30, coins: 90, emoji: "💬" },
  { id: "d-follow", key: "follow", label: "Follow someone new", hint: "Meet a member you haven't met", goal: 1, xp: 25, coins: 60, emoji: "✨" },
  { id: "d-game", key: "game", label: "Play a casual game", hint: "Tic-tac-toe, RPS, memory or dice", goal: 1, xp: 30, coins: 80, emoji: "🕹️" },
  { id: "d-checkin", key: "checkin", label: "Claim your daily check-in", hint: "Day streak keeps the flame alive", goal: 1, xp: 45, coins: 100, emoji: "📅" },
  { id: "d-gift", key: "gift", label: "Send a virtual gift", hint: "Any gift — hearts count", goal: 1, xp: 35, coins: 0, emoji: "🎁" },
  { id: "d-post", key: "post", label: "Share a moment", hint: "Post to your feed", goal: 1, xp: 30, coins: 75, emoji: "📝" },
  { id: "d-reel", key: "reel", label: "Watch 3 short clips", hint: "Tap through the reel feed", goal: 3, xp: 20, coins: 50, emoji: "🎬" },
];

export const WEEKLY_MISSIONS: Mission[] = [
  { id: "w-rooms", key: "weekRooms", label: "Visit 5 rooms", hint: "Different rooms, same you", goal: 5, xp: 200, coins: 600, emoji: "🛖", reward: "Frame: Voice Rings" },
  { id: "w-friends", key: "weekFriends", label: "Make 10 friends", hint: "Accepted friend requests", goal: 10, xp: 260, coins: 800, emoji: "🤝", reward: "Badge: Connector" },
  { id: "w-games", key: "weekGames", label: "Play 10 games", hint: "Any mode, any result", goal: 10, xp: 180, coins: 500, emoji: "🎲", reward: "1,000 coins" },
  { id: "w-xp", key: "weekXp", label: "Earn 1,200 xp", hint: "Everything counts", goal: 1200, xp: 0, coins: 900, emoji: "⚡", reward: "Theme: Aurora" },
  { id: "w-live", key: "weekLive", label: "Host or speak in 3 live rooms", hint: "Voice or listener seat", goal: 3, xp: 220, coins: 650, emoji: "🔴", reward: "Badge: Week Warrior" },
];

export function findMission(list: Mission[], id: string): Mission | undefined {
  return list.find((m) => m.id === id);
}

/* ------------------------------ Demo content -------------------------------- */

type Author = string;
const NOVA: Author = "u_nova";
const YUKI: Author = "u_yuki";
const DIEGO: Author = "u_diego";
const AMARA: Author = "u_amara";
const MIRA: Author = "u_mira";
const MARCO: Author = "u_marco";
const KAI: Author = "u_kai";
const ANA: Author = "u_ana";
const ZOE: Author = "u_zoe";

const postSeed: [Author, string, number, Post["media"], string, number][] = [
  [NOVA, "3am set list, no talking. Track 4 is one working speaker and a lot of audacity.", 0, "clip", "#nightradio", 42],
  [DIEGO, "Border story #7: the man ate my sunscreen. All of it. While watching. 🧴", 1, "gradient", "#travelstory", 96],
  [ZOE, "Open mic tonight. If you've never been roasted kindly, this is your night.", 3, "quote", "#opmic", 61],
  [MIRA, "Shipped the feature at 11:58pm. Room full of people cheering me through the deploy. This app is strange and good.", 5, "gradient", "#studysprint", 130],
  [AMARA, "Wrote four lines about the L train. Reading them in the poetry room, come judge me gently.", 2, "clip", "#lofi", 38],
  [KAI, "8-bar challenge rules: no presets, one synth, loser sends a rose 🌹", 6, "gradient", "#beatbattle", 74],
  [YUKI, "Beat the host in dice twice in a row. My hands are shaking. Rematch at 21:00.", 4, "quote", "#dicegang", 150],
  [ANA, "Sketching live every night this week. Deadline complaints included free of charge.", 7, "clip", "#cozysetup", 22],
  [MARCO, "Sunday vinyl: side A only, no skipping. Bring one record you'd defend to death.", 2, "gradient", "#roomtour", 118],
];

function buildPosts(now: number): Post[] {
  return postSeed.map(([authorId, text, tone, media, hashtag, minsAgo], i) => ({
    id: `p_seed_${i}`,
    authorId,
    text,
    tone,
    media,
    hashtag,
    createdAt: now - minsAgo * MIN,
    likes: Array.from({ length: 3 + ((i * 5) % 26) }, (_, k) => `u_${["nova", "kai", "mira", "diego", "amara", "yuki", "sofia", "liam", "priya", "omar"][(i + k) % 10]}`),
    saves: i % 3 === 0 ? ["u_demo"] : [],
    shares: (i * 3) % 14,
    comments:
      i % 2 === 0
        ? [
            { id: `pc_${i}_0`, authorId: "u_lena", text: "this is the whole vibe of this app in one post", at: now - (minsAgo - 6) * MIN, likes: ["u_nova"] },
            { id: `pc_${i}_1`, authorId: "u_omar", text: "ok but the room after this was even better", at: now - (minsAgo - 12) * MIN, likes: [] },
          ]
        : [{ id: `pc_${i}_0`, authorId: "u_priya", text: "saving this for the reading room 📚", at: now - (minsAgo - 4) * MIN, likes: [] }],
    roomId: i % 4 === 0 ? "r_1" : undefined,
  }));
}

const videoSeed: [Author, string, string, number, number, number, number][] = [
  [NOVA, "the 3am room when the beat drops", "midnight interlude — nova.waves", 0, 0, 12400, 18],
  [YUKI, "1v1 rhythm clip, hands only", "arcade heartbeat — yuki", 6, 5, 9300, 26],
  [DIEGO, "night market walk, no commentary", "Bossa in a small room — marco", 1, 1, 21500, 41],
  [AMARA, "4 lines about the L train (read aloud)", "vinyl crackle vol. 7 — amara", 2, 2, 7600, 62],
  [KAI, "one synth, eight bars, no presets", "lo-fi for the 4th floor — kai", 4, 6, 15800, 88],
  [ANA, "sketch → sticker pack in 40 seconds", "aurora (slowed) — lena", 7, 3, 5400, 104],
  [ZOE, "open mic: the roast of my own set", "Bossa in a small room — marco", 3, 4, 11200, 126],
  [MIRA, "deploy cheer squad (audio only, promise)", "arcade heartbeat — yuki", 5, 7, 6100, 150],
  [MARCO, "side A only — vinyl unboxing", "vinyl crackle vol. 7 — amara", 2, 2, 8700, 172],
  ["u_lena", "aurora from the bus window, 20 second loop", "aurora (slowed) — lena", 7, 0, 30100, 196],
];

function buildVideos(now: number): Video[] {
  return videoSeed.map(([authorId, title, music, tone, shape, views, minsAgo], i) => ({
    id: `v_seed_${i}`,
    authorId,
    title,
    music,
    tone,
    shape,
    duration: 12 + ((i * 5) % 28),
    views,
    likes: Array.from({ length: 12 + ((i * 9) % 140) }, (_, k) => `u_${["nova", "kai", "mira", "diego", "amara", "yuki", "sofia", "liam", "priya", "omar", "lena", "zoe"][(i + k) % 12]}`),
    saves: i % 4 === 0 ? ["u_demo"] : [],
    shares: (i * 5) % 30,
    hashtags: [HASHTAGS[i % HASHTAGS.length], HASHTAGS[(i * 3 + 1) % HASHTAGS.length]],
    comments: [
      { id: `vc_${i}_0`, authorId: "u_theo", text: "the audio in this room is unreal", at: now - (minsAgo - 9) * MIN, likes: ["u_nova", "u_yuki"] },
      { id: `vc_${i}_1`, authorId: "u_lena", text: "watched this 6 times, no notes", at: now - (minsAgo - 3) * MIN, likes: [] },
      ...(i % 3 === 0
        ? [{ id: `vc_${i}_2`, authorId: "u_ravi", text: "put this in the Sunday room please 🙏", at: now - (minsAgo - 15) * MIN, likes: ["u_marco"] }]
        : []),
    ],
    createdAt: now - minsAgo * MIN,
    roomId: i % 5 === 0 ? "r_1" : undefined,
  }));
}

function buildStories(now: number): Story[] {
  const rows: [Author, string, number, Story["kind"], string, number][] = [
    [NOVA, "soundcheck at 2am — yes the cat is on mic", 4, "clip", "🐈", 40],
    [MARCO, "side A loaded. doors open in 20", 2, "gradient", "🎶", 75],
    [ZOE, "writing set list. ruthless feedback welcome", 3, "quote", "🎤", 120],
    [YUKI, "bracket update: I am still undefeated", 6, "clip", "🕹️", 165],
    [ANA, "40 second sketch warm-up, join the room", 7, "gradient", "🎨", 210],
    [AMARA, "four lines, one breath", 0, "quote", "🌙", 300],
    [DIEGO, "airport lounge, 6h delay, room in progress", 1, "clip", "✈️", 420],
    [MIRA, "on-call but make it cozy", 5, "gradient", "💻", 600],
  ];
  return rows.map(([authorId, caption, tone, kind, sticker, minsAgo], i) => ({
    id: `s_seed_${i}`,
    authorId,
    caption,
    tone,
    kind,
    sticker,
    createdAt: now - minsAgo * MIN,
    expiresAt: now + (24 * HOUR - minsAgo * MIN),
    likes: Array.from({ length: 4 + ((i * 6) % 30) }, (_, k) => `u_${["kai", "mira", "yuki", "lena", "omar", "zoe"][(i + k) % 6]}`),
    views: Array.from({ length: 9 + ((i * 11) % 60) }, (_, k) => `u_${["nova", "diego", "ana", "amara", "marco", "priya"][(i + k) % 6]}`),
  }));
}

function buildFriends(now: number): FriendLink[] {
  const accepted = ["u_nova", "u_mira", "u_yuki"];
  const incoming = ["u_diego", "u_amara"];
  const outgoing = ["u_lena"];
  return [
    ...accepted.map((id, i) => ({
      id: `f_a_${i}`,
      fromId: i % 2 === 0 ? "u_demo" : id,
      toId: i % 2 === 0 ? id : "u_demo",
      state: "accepted" as const,
      at: now - (i + 3) * DAY,
    })),
    ...incoming.map((id, i) => ({
      id: `f_in_${i}`,
      fromId: id,
      toId: "u_demo",
      state: "pending" as const,
      at: now - (i + 1) * 5 * HOUR,
    })),
    ...outgoing.map((id, i) => ({
      id: `f_out_${i}`,
      fromId: "u_demo",
      toId: id,
      state: "pending" as const,
      at: now - 2 * HOUR,
    })),
  ];
}

const DAY = 86_400_000;

function buildGroups(now: number): { groups: Group[]; messages: GroupMessage[] } {
  const groups: Group[] = [
    {
      id: "g_1",
      name: "Night Shift 🌙",
      about: "For the 2am crowd. Voice notes, lo-fi finds, zero advice unless asked.",
      tone: 0,
      ownerId: "u_nova",
      adminIds: ["u_nova", "u_marco"],
      memberIds: ["u_nova", "u_marco", "u_lena", "u_demo", "u_yuki", "u_amara"],
      createdAt: now - 18 * DAY,
    },
    {
      id: "g_2",
      name: "Room Hosts Union",
      about: "Host logistics, raid parties, and complaints about the mute button.",
      tone: 4,
      ownerId: "u_liam",
      adminIds: ["u_liam", "u_kai"],
      memberIds: ["u_liam", "u_kai", "u_ravi", "u_demo", "u_zoe"],
      createdAt: now - 6 * DAY,
    },
    {
      id: "g_3",
      name: "Study Sprint Club",
      about: "25/5 sprints every weekday. Cameras off, mics muted, goals in chat.",
      tone: 5,
      ownerId: "u_priya",
      adminIds: ["u_priya"],
      memberIds: ["u_priya", "u_mira", "u_theo", "u_demo"],
      createdAt: now - 3 * DAY,
    },
  ];

  const script: [string, string, string, number][] = [
    ["g_1", "u_nova", "who else is still awake. the lo-fi room is empty and it's my favourite kind of empty", 180],
    ["g_1", "u_marco", "me. putting on side A, no skipping allowed", 172],
    ["g_1", "u_lena", "clouds are perfect here, 6 min walk from the stop and it's just green light everywhere", 140],
    ["g_1", "u_yuki", "brb finishing this set then joining voice", 60],
    ["g_1", "u_demo", "I'll be there in 5 — making tea first 🍵", 24],
    ["g_2", "u_liam", "reminder: announcements are for the room topic, not for selling protein powder", 400],
    ["g_2", "u_kai", "new cover art sizes are in the guidelines doc, someone tell the movie room", 320],
    ["g_2", "u_zoe", "the mute button still scares my guests lol", 90],
    ["g_3", "u_priya", "sprint 1 in 10. drop your one goal below", 55],
    ["g_3", "u_mira", "finish the parser. no chat. punish me", 50],
    ["g_3", "u_theo", "read 20 pages. that's it. that's the goal", 44],
  ];

  const messages: GroupMessage[] = script.map(([groupId, fromId, text, minsAgo], i) => {
    const reactions: Record<string, string[]> =
      i % 4 === 0 ? { "🔥": ["u_nova", "u_yuki"], "👀": ["u_theo"] } : i % 5 === 0 ? { "💜": ["u_lena"] } : {};
    return { id: `gm_seed_${i}`, groupId, fromId, text, at: now - minsAgo * MIN, reactions };
  });

  return { groups, messages };
}

/* ------------------------------- Seed bundle ------------------------------- */

export function createSeedSocialDB(): SocialDB {
  const now = Date.now();
  const { groups, messages } = buildGroups(now);
  return {
    version: 2,
    posts: buildPosts(now),
    videos: buildVideos(now),
    stories: buildStories(now),
    friends: buildFriends(now),
    groups,
    groupMessages: messages,
    streaks: {
      login: 4,
      chat: 2,
      room: 6,
      friend: 1,
      loginDate: todayKey(now - DAY),
      chatDate: todayKey(now - DAY),
      roomDate: todayKey(now - 2 * DAY),
      friendDate: todayKey(now - 3 * DAY),
    },
    missions: {
      day: todayKey(now),
      week: weekKey(now),
      daily: { message: 2, follow: 1, game: 1 },
      weekly: { weekRooms: 2, weekGames: 4, weekXp: 540 },
      claimedDaily: [],
      claimedWeekly: [],
    },
    privacy: {
      message: "everyone",
      follow: "everyone",
      friendRequest: "follows",
      invite: "everyone",
      profileVisible: true,
      showOnline: true,
      readReceipts: true,
      showActivity: true,
      notifSocial: true,
      notifRooms: true,
      notifRewards: true,
      notifSystem: true,
    },
    vip: { plan: null, since: 0 },
    role: "member",
    admin: {
      suspended: [],
      banned: [],
      reviewed: [],
      removedContent: [],
      announcements: [
        {
          id: "an_seed_0",
          text: "Weekend reminder: rooms are 18+, no money requests, no recording. Have a good one. — the VibeTalk demo team",
          at: now - 9 * HOUR,
          by: "system",
        },
      ],
    },
  };
}

export function weekKey(d: number | Date = new Date()): string {
  const date = new Date(d);
  const first = new Date(date.getFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - first.getTime()) / DAY);
  return `${date.getFullYear()}-W${Math.floor(day / 7) + 1}`;
}
