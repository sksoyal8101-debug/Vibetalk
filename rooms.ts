import type { Room } from "./types";

/** Room categories used by discovery, the create-room flow and host tools. */
export const ROOM_CATEGORIES = [
  "Friendship",
  "Music",
  "Gaming",
  "Casual Chat",
  "Study",
  "Entertainment",
  "Trending",
] as const;

export type CategoryKey = (typeof ROOM_CATEGORIES)[number];

const PATTERN: [RegExp, CategoryKey][] = [
  [/music|lo-?fi|beat|vinyl|dj|karaoke|playlist|producer/, "Music"],
  [/game|gaming|rhythm|rank|arcade|dice|puzzle|speedrun/, "Gaming"],
  [/study|book|read|learn|exam|code|coding|dev|language|skill/, "Study"],
  [/movie|film|comedy|show|entertain|anime|story|trivia/, "Entertainment"],
  [/friend|meet|speed|icebreak|sing|new here/, "Friendship"],
  [/trend|hot|viral|top/, "Trending"],
];

export function categorizeSafe(topic: string, title = ""): CategoryKey {
  const hay = `${topic} ${title}`.toLowerCase();
  for (const [re, key] of PATTERN) if (re.test(hay)) return key;
  return "Casual Chat";
}

export function isLocked(room: Room): boolean {
  return !!room.locked;
}
