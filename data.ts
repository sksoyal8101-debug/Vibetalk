import type {
  AppNotification,
  CoinTxn,
  DB,
  Gift,
  GiftEvent,
  Message,
  Room,
  RoomChat,
  RoomEvent,
  User,
  UserStats,
} from "./types";
import { levelFromXp, todayKey } from "./utils";

export const GIFTS: Gift[] = [
  { id: "heart", name: "Heart", emoji: "❤️", price: 20, hue: "#f472b6", tier: "common" },
  { id: "rose", name: "Rose", emoji: "🌹", price: 50, hue: "#fb7185", tier: "common" },
  { id: "star", name: "Star", emoji: "⭐", price: 120, hue: "#fbbf24", tier: "rare" },
  { id: "crown", name: "Crown", emoji: "👑", price: 450, hue: "#a855f7", tier: "epic" },
  { id: "diamond", name: "Diamond", emoji: "💎", price: 1200, hue: "#38bdf8", tier: "epic" },
  { id: "rocket", name: "Rocket", emoji: "🚀", price: 3000, hue: "#34d399", tier: "legendary" },
];

export const COIN_PACKAGES = [
  { id: "p1", amount: 10000, bonus: 0, tag: "Starter" },
  { id: "p2", amount: 50000, bonus: 2500, tag: "Popular" },
  { id: "p3", amount: 100000, bonus: 8000, tag: "Best value" },
  { id: "p4", amount: 500000, bonus: 50000, tag: "VIP" },
  { id: "p5", amount: 1000000, bonus: 150000, tag: "Legend" },
];

export const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Italy",
  "Netherlands", "Poland", "Portugal", "Sweden", "Brazil", "Mexico", "India", "Pakistan", "Bangladesh",
  "Nigeria", "Kenya", "South Africa", "Egypt", "Türkiye", "Japan", "South Korea", "Philippines",
  "Indonesia", "Malaysia", "Vietnam", "Thailand", "Singapore", "Argentina", "Ukraine", "Other",
];

export const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Polish", "Turkish",
  "Arabic", "Hindi", "Urdu", "Bengali", "Swahili", "Japanese", "Korean", "Vietnamese", "Thai",
  "Indonesian", "Tagalog", "Ukrainian",
];

/** Ten core discovery categories — used by setup, Discover filters and the recommendation engine. */
export const INTEREST_CATEGORIES = [
  "Music", "Gaming", "Movies", "Sports", "Technology", "Travel", "Education", "Comedy", "Friendship", "Entertainment",
] as const;

export const INTERESTS = [
  ...INTEREST_CATEGORIES,
  "Art", "Anime", "Podcasts", "Coding", "Photography", "Dancing", "Fashion", "Books", "Fitness", "Foodie",
  "Astronomy", "Language swap",
];

/** Maps free-text interests onto the ten canonical buckets for scoring. */
export const INTEREST_ALIASES: Record<string, string> = {
  Tech: "Technology",
  Coding: "Technology",
  "Language swap": "Education",
  Books: "Education",
  Astronomy: "Education",
  Anime: "Entertainment",
  Movies: "Entertainment",
  Comedy: "Entertainment",
  Dancing: "Music",
  Podcasts: "Music",
  Art: "Entertainment",
  Photography: "Travel",
  Fashion: "Entertainment",
  Fitness: "Sports",
  Foodie: "Friendship",
};

export function canonicalInterest(value: string): string {
  return INTEREST_ALIASES[value] ?? value;
}

export const ROOM_TOPICS = [
  "Chill Lounge", "Music Vibes", "Deep Talks", "Gaming Squad", "Language Swap", "Movie Buffs",
  "Late Night", "Comedy Hour", "Study Room", "Creators", "Sports Bar", "Speed Friending",
];

/** Cover gradients used by group chats and demo art pickers. */
export const TONES = [
  "linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)",
  "linear-gradient(135deg,#1d4ed8 0%,#a855f7 100%)",
  "linear-gradient(135deg,#db2777 0%,#fb923c 100%)",
  "linear-gradient(135deg,#059669 0%,#8b5cf6 100%)",
  "linear-gradient(135deg,#4c1d95 0%,#22d3ee 100%)",
];

export const EMOJI_PICKS = [
  "😀", "😂", "🥰", "😎", "🤔", "😳", "🙌", "👀", "🔥", "✨", "💜", "💖", "🎉", "🎧", "🎮",
  "🍿", "☕", "🌙", "⭐", "🚀", "💎", "👑", "❤️", "😴", "🥳", "😇", "🤝", "💬", "🎤",
];

export const ROOM_COVERS = [
  "linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)",
  "linear-gradient(135deg,#1d4ed8 0%,#a855f7 100%)",
  "linear-gradient(135deg,#db2777 0%,#fb923c 100%)",
  "linear-gradient(135deg,#059669 0%,#8b5cf6 100%)",
  "linear-gradient(135deg,#4c1d95 0%,#22d3ee 100%)",
  "linear-gradient(135deg,#be123c 0%,#7c3aed 100%)",
  "linear-gradient(135deg,#f59e0b 0%,#ec4899 100%)",
  "linear-gradient(135deg,#0f766e 0%,#c084fc 100%)",
];

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

type RawUser = [
  string, // id
  string, // username
  string, // email
  string, // country
  string, // language
  string, // gender
  string, // bio
  number, // level
  boolean, // online
  string[], // interests
  string, // frame
  string, // theme
  string[], // achievements
];

const RAW_USERS: RawUser[] = [
  ["u_nova", "nova.waves", "nova@vibetalk.app", "London", "English", "female",
    "Night-owl DJ. I collect synths and bad puns. Room host every Fri 21:00 GMT 🎧", 42, true, ["Music", "Podcasts", "Tech"],
    "mythic", "violet", ["top-host", "social-star", "week-warrior", "chat-butterfly", "vibe-master"]],
  ["u_kai", "kaivibes", "kai@vibetalk.app", "Berlin", "German", "male",
    "Producer & beat maker. Always up for a music-trading session.", 35, true, ["Music", "Coding", "Art"],
    "crown", "midnight", ["top-host", "gift-lover", "rising-star"]],
  ["u_mira", "mira.codes", "mira@vibetalk.app", "Toronto", "English", "female",
    "Software engineer by day, karaoke legend by night. Ask me about rust 🦀", 28, false, ["Coding", "Anime", "Books"],
    "starlit", "aurora", ["daily-visitor", "chat-butterfly", "arcade"]],
  ["u_diego", "diego.travels", "diego@vibetalk.app", "Mexico City", "Spanish", "male",
    "42 countries so far. Storyteller, tequila snob, terrible dancer.", 31, true, ["Travel", "Foodie", "Photography"],
    "crown", "sunset", ["event-host", "social-star", "gift-lover"]],
  ["u_amara", "amara.light", "amara@vibetalk.app", "Lagos", "English", "female",
    "Poetry, Afrobeats and long conversations about nothing at 2am.", 24, false, ["Music", "Books", "Fashion"],
    "rings", "violet", ["newcomer", "daily-visitor", "chat-butterfly"]],
  ["u_yuki", "yuki.playz", "yuki@vibetalk.app", "Osaka", "Japanese", "non-binary",
    "Rhythm game addict. I will absolutely trash you at Tic-Tac-Toe. 🎮", 19, true, ["Gaming", "Anime", "Comedy"],
    "starlit", "mint", ["arcade", "gift-lover", "first-room"]],
  ["u_sofia", "sofia.frames", "sofia@vibetalk.app", "Madrid", "Spanish", "female",
    "Film photographer. Currently shooting a series about night markets.", 27, false, ["Photography", "Travel", "Movies"],
    "pulse", "noir", ["social-star", "daily-visitor"]],
  ["u_liam", "liam.onair", "liam@vibetalk.app", "Dublin", "English", "male",
    "Sports talk, terrible takes, great company. GAA until I die.", 33, true, ["Sports", "Comedy", "Fitness"],
    "crown", "midnight", ["top-host", "rising-star", "week-warrior"]],
  ["u_priya", "priya.chai", "priya@vibetalk.app", "Mumbai", "Hindi", "female",
    "Bookshop owner. Running a slow-and-steady reading room — all welcome.", 22, false, ["Books", "Foodie", "Language swap"],
    "rings", "mint", ["daily-visitor", "newcomer"]],
  ["u_omar", "omar.builds", "omar@vibetalk.app", "Dubai", "English", "male",
    "Startup nerd + rocket-league casualty. Let's talk side projects.", 29, true, ["Tech", "Gaming", "Fitness"],
    "pulse", "aurora", ["arcade", "first-room", "chat-butterfly"]],
  ["u_lena", "lena.dreams", "lena@vibetalk.app", "Stockholm", "English", "female",
    "Aurora chaser. Ambient soundscapes and deep talks are my love language.", 26, false, ["Astronomy", "Art", "Movies"],
    "starlit", "violet", ["gift-lover", "daily-visitor"]],
  ["u_marco", "marco.beats", "marco@vibetalk.app", "São Paulo", "Portuguese", "male",
    "Bossanova + house. I host the Sunday vinyl room.", 30, true, ["Music", "Dancing", "Foodie"],
    "crown", "sunset", ["top-host", "event-host"]],
  ["u_zoe", "zoe.sparks", "zoe@vibetalk.app", "Melbourne", "English", "female",
    "Comedy open-mic survivor. Roast me gently.", 25, false, ["Comedy", "Fashion", "Movies"],
    "rings", "noir", ["social-star", "first-room"]],
  ["u_theo", "theo.quiet", "theo@vibetalk.app", "New York", "English", "male",
    "Shy but curious. Here to practise small talk one room at a time.", 21, false, ["Language swap", "Fitness", "Tech"],
    "pulse", "midnight", ["newcomer", "first-room"]],
  ["u_ana", "ana.paints", "ana@vibetalk.app", "Lisbon", "Spanish", "female",
    "Illustrator. Streaming my sketchbook and complaining about deadlines.", 23, true, ["Art", "Photography", "Anime"],
    "starlit", "aurora", ["daily-visitor", "gift-lover"]],
  ["u_ravi", "ravi.moves", "ravi@vibetalk.app", "Bengaluru", "English", "male",
    "Chess, cricket and conversation. Room host most nights.", 32, false, ["Sports", "Books", "Gaming"],
    "crown", "violet", ["top-host", "arcade", "week-warrior"]],
  ["u_demo", "demo.user", "demo@vibetalk.app", "United States", "English", "undisclosed",
    "That's you! This is the built-in demo account — poke around, everything is local.", 20, true, ["Gaming", "Music", "Travel"],
    "rings", "violet", ["newcomer", "first-room", "daily-visitor", "arcade"]],
];

function seedStats(i: number): UserStats {
  return {
    roomsJoined: 3 + ((i * 7) % 22),
    roomChats: 8 + ((i * 13) % 46),
    dms: 14 + ((i * 19) % 80),
    gamesPlayed: 2 + ((i * 5) % 18),
    eventsHosted: i % 4 === 0 ? 1 + (i % 3) : 0,
    checkins: 1 + ((i * 3) % 12),
    spins: (i % 5) + 1,
    favorites: 1 + (i % 6),
  };
}

function buildUsers(now: number): User[] {
  return RAW_USERS.map(
    ([id, username, email, country, language, gender, bio, level, online, interests, frame, theme, achievements], i) => {
      const xp = 900 + level * 460 + i * 37;
      return {
        id,
        username,
        email,
        password: id === "u_demo" ? "demo1234" : "demo-pass",
        dob: `${1990 + (i % 8)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
        gender: gender as User["gender"],
        country,
        language,
        bio,
        interests,
        level: Math.max(level, levelFromXp(xp).level),
        xp,
        coins: id === "u_demo" ? 12400 : 600 + ((i * 1373) % 9000),
        followers: 40 + ((i * 419) % 2400),
        following: 12 + ((i * 97) % 340),
        online,
        verified: level > 30,
        isDemo: true,
        joinedAt: now - (i + 2) * DAY * 21,
        frame,
        theme,
        achievements,
        checkinDates: Array.from({ length: (i % 4) + 1 }, (_, d) => todayKey(new Date(now - d * DAY))),
        checkinStreak: (i % 4) + 1,
        lastSpin: i % 3 === 0 ? "" : todayKey(now - DAY),
        spins: (i % 6) + 1,
        sparkles: 400 + ((i * 917) % 6200),
        giftsSent: 1 + (i % 9),
        giftsReceived: 2 + ((i * 3) % 14),
        stats: seedStats(i),
      };
    },
  );
}

const RAW_ROOMS: [string, string, string, string, string, number, number, number, string][] = [
  ["r_1", "Late Night Lo-Fi & Venting", "Chill Lounge", "Music", "u_nova", 9, 148, 1, "Phones down, mics warm. Vent kindly — no advice unless asked."],
  ["r_2", "Producers Circle: trade a beat", "Music Vibes", "Music", "u_kai", 8, 96, 2, "8-bar challenge tonight at 22:00. Bring stems."],
  ["r_3", "Ship-it Friday: dev stories", "Tech", "Study", "u_mira", 6, 61, 3, "Production war stories and career chats."],
  ["r_4", "Travel horror stories 🔥", "Travel", "Entertainment", "u_diego", 10, 214, 4, "Worst border story wins. No PII, no booking links."],
  ["r_5", "Afrobeats + poetry open mic", "Music Vibes", "Entertainment", "u_amara", 8, 77, 5, "2 minutes each. Applause mandatory."],
  ["r_6", "Rhythm game grind (rank up)", "Gaming Squad", "Gaming", "u_yuki", 6, 132, 6, "Queue for 1v1s in the chat. Loser sends a rose."],
  ["r_7", "Speed friending — 3 min turns", "Speed Friending", "Friendship", "u_zoe", 12, 188, 0, "Intro + one weird fact. Rotate when the host pings."],
  ["r_8", "Reading room: slow & steady", "Books", "Study", "u_priya", 6, 34, 7, "Silent reading sprints, 25/5. Mic off during sprints."],
];

function buildRooms(now: number): Room[] {
  const roster = RAW_USERS.map(([id]) => id).filter((id) => id !== "u_demo");
  return RAW_ROOMS.map(([id, title, topic, category, hostId, seats, listeners, cover, announcement], idx) => {
    const speakers = [hostId, ...roster.slice(idx * 2, idx * 2 + 3 + (idx % 3))].filter(
      (v, i, arr) => arr.indexOf(v) === i && v !== hostId,
    );
    const sampleTags = [
      ["#lofi", "#chill", "#nightvibes", "#beats"],
      ["#producers", "#beatbattle", "#music", "#collab"],
      ["#tech", "#devstories", "#coding", "#shipit"],
      ["#travel", "#backpacking", "#stories", "#wanderlust"],
      ["#afrobeats", "#openmic", "#poetry", "#creative"],
      ["#gaming", "#rhythm", "#squad", "#arcade"],
      ["#speedfriending", "#meetpeople", "#social", "#vibes"],
      ["#reading", "#books", "#focus", "#study"],
    ];
    return {
      id,
      title,
      topic,
      category,
      tags: sampleTags[idx % sampleTags.length],
      cover,
      seats,
      hostId,
      coHostIds: speakers.slice(0, 1),
      speakerIds: speakers.slice(0, Math.max(2, Math.min(seats - 1, 4))),
      speakerRequests: idx === 0 ? ["u_theo"] : [],
      listeners,
      description:
        "A friendly demo room. Keep it kind, 18+ only, no hate speech or harassment. Mic comms are simulated in this MVP.",
      announcement,
      rules: [
        "Adults 18+ only. Respectful banter is welcome, harassment is not.",
        "Take turns when unmuted — no talking over others.",
        "No money solicitation, promo links, or gambling.",
        "Good vibes only! Feel free to send reactions and gifts.",
      ],
      reactions: [],
      locked: idx === 7,
      live: idx !== 7,
      createdByUser: false,
      createdAt: now - idx * 42 * MIN,
    };
  });
}

function buildChats(now: number): RoomChat[] {
  const lines: [string, string, string][] = [
    ["r_1", "u_nova", "welcome in 🌙 put the thing that annoyed you today into the chat"],
    ["r_1", "u_lena", "joining from stockholm, it's pitch black at 4pm here"],
    ["r_1", "u_theo", "first time in a voice room, hi 👋"],
    ["r_1", "u_marco", "this playlist is criminal, dropping the tracklist after"],
    ["r_2", "u_kai", "8-bar challenge starting in 5, who's in"],
    ["r_2", "u_omar", "I'll go third, bringing a broken 808"],
    ["r_4", "u_diego", "guy at the border ate my sunscreen. ALL of it. ask me for details"],
    ["r_4", "u_sofia", "in lisbon right now, bring travel questions"],
    ["r_6", "u_yuki", "anyone up for a 1v1 after this? loser sends a rose 🌹"],
    ["r_6", "u_ravi", "queue's open, I'm next"],
    ["r_7", "u_zoe", "3 minute turns, intro + one weird fact. go"],
    ["r_7", "u_theo", "weird fact: I can name every capital in Scandinavia but not my neighbours"],
  ];
  return lines.map(([roomId, userId, text], i) => ({
    id: `c_seed_${i}`,
    roomId,
    userId,
    text,
    at: now - (lines.length - i) * 4 * MIN,
    kind: "text" as const,
  }));
}

function buildGiftLog(now: number): GiftEvent[] {
  const rows: [string, string, string, number][] = [
    ["u_yuki", "u_demo", "rocket", 26 * MIN],
    ["u_nova", "u_demo", "star", 2 * HOUR],
    ["u_demo", "u_mira", "rose", 3 * HOUR],
    ["u_kai", "u_nova", "crown", 5 * HOUR],
    ["u_demo", "u_nova", "heart", 2 * DAY],
    ["u_diego", "u_amara", "diamond", 7 * HOUR],
    ["u_zoe", "u_demo", "heart", 9 * HOUR],
    ["u_ravi", "u_yuki", "star", 11 * HOUR],
    ["u_ana", "u_demo", "rose", 20 * HOUR],
    ["u_liam", "u_priya", "crown", 26 * HOUR],
    ["u_amara", "u_demo", "star", 30 * HOUR],
    ["u_mira", "u_demo", "heart", 34 * HOUR],
  ];
  return rows.map(([fromId, toId, giftId, ago], i) => ({
    id: `gl_seed_${i}`,
    fromId,
    toId,
    giftId,
    at: now - ago,
    roomId: i % 3 === 0 ? "r_1" : null,
  }));
}

function buildEvents(now: number): RoomEvent[] {
  const iso = (offsetHours: number) => {
    const d = new Date(now + offsetHours * HOUR);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    };
  };
  const raw: [string, string, string, string, number][] = [
    ["Vinyl Listening Party", "Music", "u_marco", "Side A only, no skipping. Bring one record you'd defend to the death.", 5],
    ["Speed Friending Marathon", "Friendship", "u_zoe", "Twelve 3-minute rounds, then open mic. Cameras off, mics on.", 26],
    ["Bug Bash & Chill", "Study", "u_mira", "Pair-debug your nastiest bug, crowd cheers you through it.", 50],
    ["Midnight Trivia: Cinema Edition", "Entertainment", "u_diego", "Four rounds, silly prizes (virtual, obviously).", 74],
  ];
  return raw.map(([name, category, hostId, description, inHours], i) => {
    const when = iso(inHours);
    return {
      id: `ev_seed_${i}`,
      name,
      category,
      hostId,
      description,
      date: when.date,
      time: when.time,
      roomId: ["r_2", "r_7", "r_3", "r_4"][i],
      rsvps: 24 + i * 37,
      createdAt: now - i * 3 * HOUR,
    };
  });
}

function buildMessages(now: number): Message[] {
  const thread = (peer: string, lines: [boolean, string, number][]): Message[] =>
    lines.map(([fromPeer, text, minsAgo], i) => ({
      id: `m_${peer}_${i}`,
      from: fromPeer ? peer : "u_demo",
      to: fromPeer ? "u_demo" : peer,
      text,
      at: now - minsAgo * MIN,
      read: minsAgo > 30,
    }));

  return [
    ...thread("u_nova", [
      [true, "hey! saw you were in the lo-fi room — you have good taste 🎧", 210],
      [false, "haha guilty. the track at the end was unreal", 205],
      [true, "that's mine, made it at 3am with one working speaker", 120],
      [false, "no way, it sounds better than stuff I pay for", 118],
      [true, "flattery will get you a crown gift 🤍", 12],
    ]),
    ...thread("u_yuki", [
      [true, "dice game. now. i refuse to lose twice in a row", 95],
      [false, "you cheated", 92],
      [true, "I rolled with AUTHORITY. different thing", 90],
    ]),
    ...thread("u_mira", [
      [true, "saw your profile says you're learning rust — how's the borrow checker treating you", 1500],
      [false, "it hates me personally", 1490],
      [true, "correct answer. come to the dev room thursday", 1480],
    ]),
  ];
}

function buildNotifications(now: number): AppNotification[] {
  const raw: [AppNotification["type"], string, string, string, number, string | undefined][] = [
    ["reward", "Daily check-in ready ☕", "Day 4 of your streak is worth 500 Vibe Coins and 130 xp.", "u_demo", 8 * MIN, "/rewards"],
    ["levelup", "Level up — LV 20", "You climbed to LV 20. New profile frame slots unlocked.", "u_demo", 20 * MIN, "/profile"],
    ["gift", "Yuki sent a Rocket 🚀", "+3,000 coins worth of vibes in the Gaming room.", "u_yuki", 26 * MIN, "/gifts"],
    ["message", "Nova: “flattery will get you a crown gift 🤍”", "Tap to reply before the set starts.", "u_nova", 12 * MIN, "/messages?with=u_nova"],
    ["room", "You're invited: Speed friending", "Zoe saved you a speaker seat.", "u_zoe", 2 * HOUR, "/rooms/r_7"],
    ["favorite", "Nova is online and hosting", "Your favourite host just went live in Late Night Lo-Fi.", "u_nova", 3 * HOUR, "/rooms/r_1"],
    ["badge", "Badge unlocked: Daily Visitor 📅", "Three check-ins in a row. +150 xp added.", "u_demo", 4 * HOUR, "/profile"],
    ["event", "Vinyl Listening Party in 5h", "Marco reserved your seat in the Producers Circle room.", "u_marco", 5 * HOUR, "/events"],
    ["system", "Welcome to VibeTalk 👋", "This is an MVP demo. No real audio, no real payments, no real servers.", "u_demo", 9 * HOUR, undefined],
    ["game", "Ravi beat your dice streak", "Final roll: 17 vs 15. Rematch?", "u_ravi", 12 * HOUR, "/games"],
  ];
  return raw.map(([type, title, body, actorId, ago, link], i) => ({
    id: `n_seed_${i}`,
    type,
    title,
    body,
    actorId,
    at: now - ago,
    link,
    read: i > 4,
  }));
}

function buildTxns(now: number): CoinTxn[] {
  const raw: [CoinTxn["kind"], string, number, number][] = [
    ["demo-topup", "New member demo balance", 5000, 1 * DAY],
    ["gift-received", "Rocket from yuki.playz", 3000, 26 * MIN],
    ["checkin", "Daily check-in · day 3", 300, 22 * HOUR],
    ["gift-sent", "Rose to mira.codes", -50, 3 * HOUR],
    ["purchase", "50,000 coin pack (demo)", 50000, 5 * DAY],
    ["spin", "Lucky spin · 600 coins", 600, 2 * DAY],
    ["gift-sent", "Heart to nova.waves", -20, 2 * DAY],
    ["reward", "Game reward · tic tac toe", 30, 20 * HOUR],
  ];
  return raw.map(([kind, label, amount, ago], i) => ({
    id: `t_seed_${i}`,
    kind,
    label,
    amount,
    at: now - ago,
  }));
}

export function createSeedDB(): DB {
  const now = Date.now();
  return {
    version: 2,
    users: buildUsers(now),
    rooms: buildRooms(now),
    chats: buildChats(now),
    messages: buildMessages(now),
    follows: ["u_nova", "u_mira", "u_yuki"],
    blocked: [],
    reports: [],
    txns: buildTxns(now),
    notifications: buildNotifications(now),
    scores: [
      { id: "g0", game: "tic-tac-toe", result: "win", points: 30, at: now - 2 * HOUR },
      { id: "g1", game: "dice", result: "lose", points: 0, at: now - 5 * HOUR },
      { id: "g2", game: "rps", result: "win", points: 30, at: now - 26 * HOUR },
    ],
    events: buildEvents(now),
    favorites: { users: ["u_nova", "u_yuki"], rooms: ["r_1", "r_7"] },
    giftLog: buildGiftLog(now),
    recentlyJoinedRooms: ["r_1", "r_4"],
    lastVisited: [],
  };
}

export const BOT_LINES = [
  "that's such a good take honestly",
  "someone put on the lo-fi one again",
  "I just got here, what did I miss 👀",
  "brb refilling my tea 🍵",
  "ok but who's hosting the movie room tonight",
  "lol no way you actually did that",
  "joining from the other side of the world 🌏",
  "the vibe in here is unmatched",
  "can we do a two truths round? I'll start",
  "sending hearts to everyone on mic ❤️",
  "my neighbours would love me shouting at this room",
  "same energy every single night, that's why I stay",
  "who's coming to the vinyl party after this",
  "add me for the next trivia night 🎟️",
];
