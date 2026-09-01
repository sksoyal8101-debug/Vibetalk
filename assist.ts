import { HASHTAGS, INTEREST_HINTS } from "./assistData";
import type { User } from "./types";

/**
 * "AI" here is deliberately local and rule-based: template engines + the
 * member's own profile data. No network calls, no external AI API in v2.
 */

const pick = <T,>(list: T[], seed: string): T => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
};

const BIO_OPENERS = [
  "Here for",
  "Currently",
  "Most nights",
  "If you're reading this,",
  "Professional",
];
const BIO_MIDDLES = [
  "long room chats and shorter songs",
  "collecting voices, not followers",
  "the 2am crowd's designated host",
  "good at asking the second question",
  "running a room like a group project I actually like",
  "half DJ, half note-to-self",
];
const BIO_CLOSERS = [
  "Say hi in any room — I answer everything except spoilers.",
  "Mic shy? Listener seats count too.",
  "Bring one song you'd defend.",
  "No pitch decks, please.",
  "18+. Kindness is the whole personality trait.",
];

export function bioIdeas(me: User | null, tone: "warm" | "funny" | "mysterious" = "warm"): string[] {
  const interests = me?.interests.length ? me.interests : ["music", "rooms"];
  const seedBase = `${me?.username ?? "vibe"}-${tone}`;
  const adj: Record<typeof tone, string[]> = {
    warm: ["easygoing", "curious", "unhurried"],
    funny: ["chronically online", "suspiciously cheerful", "mildly chaotic"],
    mysterious: ["nocturnal", "quiet until 1am", "selectively social"],
  };
  return [0, 1, 2].map((i) => {
    const opener = pick(BIO_OPENERS, seedBase + i);
    const middle = pick(BIO_MIDDLES, seedBase + i * 3);
    const closer = pick(BIO_CLOSERS, seedBase + i * 7);
    return `${opener} ${adj[tone][i % adj[tone].length]} about ${interests[i % interests.length]} — ${middle}. ${closer}`;
  });
}

const TITLE_PATTERNS = [
  "{vibe} for people who {habit}",
  "The {vibe} Room — {topic} only",
  "{topic}, but make it 2am",
  "Open mic: {topic} hot takes",
  "{vibe} hour — bring one story",
  "Slow {topic} (no pitching)",
];

const HABITS = ["can't sleep", "over-explain", "keep a playlist per mood", "rate airports out of 10", "work best at night"];
const VIBES = ["Cozy", "Chaotic", "Soft", "Loud", "Candlelit", "Dorm-room", "Rooftop"];

export function roomTitleIdeas(topic: string, vibe = "Cozy"): { title: string; why: string }[] {
  const t = topic || "late night chat";
  return TITLE_PATTERNS.slice(0, 5).map((pattern, i) => ({
    title: pattern
      .replace("{vibe}", i % 2 === 0 ? vibe : pick(VIBES, t + i))
      .replace("{habit}", pick(HABITS, t + i))
      .replace("{topic}", t),
    why: i % 2 === 0 ? "Specific beats generic — people join a scene, not a label." : "Numbered rituals (2am, 3 minutes) lift join rate in this demo.",
  }));
}

const CAPTION_STYLES = [
  { label: "Dry", build: (s: string) => `${s}. That's the post.` },
  { label: "Storyteller", build: (s: string) => `Three things about ${s}: one, it happened at 2am. Two, the room laughed. Three, I'd do it again.` },
  { label: "Question", build: (s: string) => `${s} — and I want the counter-opinion. Go.` },
  { label: "Listicle", build: (s: string) => `${s}\n1. no setup\n2. no advice\n3. one very good ending` },
];

export function captionIdeas(subject: string, tone = "warm"): { caption: string; hashtags: string[] }[] {
  const s = subject.trim() || "the room";
  return CAPTION_STYLES.map((style, i) => ({
    caption: style.build(s),
    hashtags: [pick(HASHTAGS, s + i + tone), pick(HASHTAGS, tone + i * 2)],
  }));
}

export function starters(peer: User | null, me: User | null): string[] {
  const shared = peer && me ? peer.interests.filter((x) => me.interests.includes(x)) : [];
  const base = [
    "What's the last thing that made you laugh out loud in a room?",
    "You have 5 minutes before the room fills up — what are we talking about?",
    "Rate your week so far, out of one very long meeting.",
    "What are you listening to on loop right now?",
  ];
  if (shared[0]) base.unshift(`I saw you're into ${shared[0]} — ${pick(INTEREST_HINTS[shared[0]] ?? ["what's your favourite part?"], shared[0])}`);
  if (peer?.country) base.push(`${peer.country} recommendation, go: food, spot or song?`);
  return base;
}

export function interestSuggestions(likes: string[]): { interest: string; why: string }[] {
  const map: Record<string, string> = {
    Music: "you linger on lo-fi and DJ rooms",
    Gaming: "your arcade results say it all",
    Movies: "you save clip recaps at 1am",
    Sports: "you argue about lineups in chat",
    Technology: "you host or join the dev rooms",
    Travel: "your border stories need a room",
    Education: "study sprints are your comfort zone",
    Comedy: "you react to open-mic clips the most",
    Friendship: "you keep speed-friending rooms full",
    Entertainment: "you're the reason trivia nights happen",
  };
  return Object.entries(map)
    .filter(([key]) => !likes.includes(key))
    .slice(0, 4)
    .map(([interest, why]) => ({ interest, why: `Because ${why}` }));
}

const ROUTES: { test: RegExp; label: string; build: (input: string) => string }[] = [
  { test: /bio|profile/i, label: "Bio help", build: (i) => `Try leading with a specific habit instead of an adjective: "${i || "runs a 2am room for night-shift people"}". Specific gets replies; "funny & kind" gets scrolled past.` },
  { test: /room|title|host/i, label: "Room titles", build: (i) => `For ${i || "that topic"}: "The ${i || "cozy"} Room — 3 minute intros, no pitching". Numbers and rules make a room feel safe to join.` },
  { test: /caption|post/i, label: "Captions", build: (i) => `Caption idea: "${i || "the moment"} — and I want the counter-opinion. Go." Questions double comment rate in this demo.` },
  { test: /opener|starter|message|dm|ice/i, label: "Openers", build: () => `Open with something answerable in one line: "You have 5 minutes before the room fills — what are we talking about?" Avoid "hey".` },
  { test: /friend|awkward/i, label: "Friendships", build: () => `Best flow here: reply to a story → move to a room → send the friend request after one real conversation. Cold requests convert poorly in the demo data.` },
  { test: /gift|coin/i, label: "Gifting", build: () => `Gifts are appreciation, not currency. Send after someone does something kind on mic, and never as a demand for attention. All coins here are virtual.` },
  { test: /safe|report|block|harass/i, label: "Safety", build: () => `Mute first, then report with a timestamp quote from room chat, then block. In this MVP reports stay on your device; v3 sends them to a moderation queue.` },
  { test: /idea|content|video|reel/i, label: "Content", build: () => `Clip formula that works for voice apps: 3s hook (a quote from the room) → 10s context → 5s call to a live room. Title it like a text message, not a headline.` },
];

export function assistantReply(prompt: string, context: string): { text: string; chips: string[]; label: string } {
  const input = prompt.trim();
  const route = ROUTES.find((r) => r.test.test(input)) ?? {
    label: "General",
    build: (v: string) => `Short version: make it easy to say yes. For "${v || "your idea"}" — give one clear promise, one rule and one time. ${context}.`,
  };
  return {
    label: route.label,
    text: route.build(input),
    chips: ["Rewrite it funnier", "Make it shorter", "Give me 3 options", "Is this safe for 18+?"],
  };
}

export function suggestSafetyCheck(text: string): { flag: string | null; note: string } {
  const risky = [
    { re: /\b(pay|cash|venmo|crypto|invest|wire|bank)\b/i, flag: "money request", note: "Asking members for money or investments breaks the rules." },
    { re: /\b(age|underage|17|school kid)\b/i, flag: "age language", note: "Keep this an adults-only space; never invite anyone under 18." },
    { re: /\b(gamble|bet|odds|jackpot)\b/i, flag: "gambling", note: "Games of chance for value aren't allowed — points only." },
    { re: /\b(dm me privately|move to telegram|whatsapp)\b/i, flag: "off-platform funnel", note: "Moving chats off-platform is a common scam pattern." },
  ];
  for (const r of risky) if (r.re.test(text)) return { flag: r.flag, note: r.note };
  return { flag: null, note: "Nothing in this draft trips the local safety patterns. Keep rooms 18+ and respectful." };
}
