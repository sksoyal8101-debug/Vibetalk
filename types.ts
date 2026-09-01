export type Gender = "female" | "male" | "non-binary" | "undisclosed";

export interface UserStats {
  roomsJoined: number;
  roomChats: number;
  dms: number;
  gamesPlayed: number;
  eventsHosted: number;
  checkins: number;
  spins: number;
  favorites: number;
}

export interface User {
  id: string;
  stats: UserStats;
  username: string;
  email: string;
  password: string;
  dob: string;
  gender: Gender;
  country: string;
  language: string;
  bio: string;
  interests: string[];
  level: number;
  xp: number;
  coins: number;
  followers: number;
  following: number;
  online: boolean;
  verified: boolean;
  isDemo: boolean;
  joinedAt: number;
  /* progression & personalisation */
  frame: string;
  theme: string;
  achievements: string[];
  checkinDates: string[];
  checkinStreak: number;
  lastSpin: string;
  spins: number;
  sparkles: number;
  giftsSent: number;
  giftsReceived: number;
}

export interface RoomReaction {
  id: string;
  emoji: string;
  userId: string;
  at: number;
}

export interface Room {
  id: string;
  title: string;
  topic: string;
  category: string;
  tags?: string[];
  cover: number;
  seats: number;
  hostId: string;
  coHostIds?: string[];
  speakerIds: string[];
  speakerRequests?: string[];
  listeners: number;
  description: string;
  announcement: string;
  rules?: string[];
  reactions?: RoomReaction[];
  locked: boolean;
  live: boolean;
  createdByUser: boolean;
  createdAt: number;
}

export interface RoomEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  description: string;
  category: string;
  hostId: string;
  roomId?: string;
  rsvps: number;
  createdAt: number;
}

export interface GiftEvent {
  id: string;
  fromId: string;
  toId: string;
  giftId: string;
  at: number;
  roomId?: string | null;
}

export interface Favorites {
  users: string[];
  rooms: string[];
}

export type ChatKind = "text" | "gift" | "system" | "announce";

export interface RoomChat {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  at: number;
  kind: ChatKind;
  giftId?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  at: number;
  read: boolean;
  replyTo?: string;
  reactions?: Record<string, string[]>;
}

export interface CoinTxn {
  id: string;
  kind: "purchase" | "gift-sent" | "gift-received" | "reward" | "demo-topup" | "checkin" | "spin";
  label: string;
  amount: number;
  at: number;
}

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  price: number;
  hue: string;
  tier: "common" | "rare" | "epic" | "legendary";
}

export type NotifType =
  | "follower"
  | "message"
  | "gift"
  | "room"
  | "system"
  | "game"
  | "reward"
  | "levelup"
  | "badge"
  | "event"
  | "favorite";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  at: number;
  read: boolean;
  actorId?: string;
  link?: string;
}

export interface Report {
  id: string;
  targetType: "user" | "room";
  targetId: string;
  targetLabel: string;
  reason: string;
  details: string;
  at: number;
}

export interface GameScore {
  id: string;
  game: "tic-tac-toe" | "rps" | "memory" | "dice";
  result: "win" | "lose" | "draw";
  points: number;
  at: number;
}

export interface DB {
  version: number;
  users: User[];
  rooms: Room[];
  chats: RoomChat[];
  messages: Message[];
  follows: string[];
  blocked: string[];
  reports: Report[];
  txns: CoinTxn[];
  notifications: AppNotification[];
  scores: GameScore[];
  events: RoomEvent[];
  favorites: Favorites;
  giftLog: GiftEvent[];
  recentlyJoinedRooms?: string[];
  lastVisited: string[];
}

export interface Session {
  userId: string;
  startedAt: number;
}

/* ============================== VibeTalk Pro v2 ============================== */

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  at: number;
  likes: string[];
  replyTo?: string;
  replies?: Comment[];
}

export interface Post {
  id: string;
  authorId: string;
  text: string;
  tone: number;
  media: "none" | "gradient" | "clip" | "quote" | "image";
  image?: string;
  hashtag: string;
  createdAt: number;
  likes: string[];
  saves: string[];
  shares: number;
  comments: Comment[];
  roomId?: string;
}

export interface Video {
  id: string;
  authorId: string;
  title: string;
  music: string;
  tone: number;
  shape: number;
  duration: number;
  views: number;
  likes: string[];
  saves: string[];
  shares: number;
  comments: Comment[];
  hashtags: string[];
  createdAt: number;
  roomId?: string;
}

export interface Story {
  id: string;
  authorId: string;
  caption: string;
  tone: number;
  kind: "gradient" | "clip" | "quote" | "image" | "video";
  mediaKey?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  duration?: number;
  createdAt: number;
  expiresAt: number;
  likes: string[];
  views: string[];
  sticker?: string;
}

export interface FriendLink {
  id: string;
  fromId: string;
  toId: string;
  state: "pending" | "accepted";
  at: number;
}

export interface Group {
  id: string;
  name: string;
  about: string;
  tone: number;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  fromId: string;
  text: string;
  at: number;
  replyTo?: string;
  reactions: Record<string, string[]>;
}

export interface StreakBook {
  login: number;
  chat: number;
  room: number;
  friend: number;
  loginDate: string;
  chatDate: string;
  roomDate: string;
  friendDate: string;
}

export interface MissionState {
  day: string;
  week: string;
  daily: Record<string, number>;
  weekly: Record<string, number>;
  claimedDaily: string[];
  claimedWeekly: string[];
}

export type PrivacyAudience = "everyone" | "follows" | "friends" | "nobody";

export interface PrivacyBook {
  message: PrivacyAudience;
  follow: PrivacyAudience;
  friendRequest: PrivacyAudience;
  invite: PrivacyAudience;
  profileVisible: boolean;
  showOnline: boolean;
  readReceipts: boolean;
  showActivity: boolean;
  notifSocial: boolean;
  notifRooms: boolean;
  notifRewards: boolean;
  notifSystem: boolean;
}

export type VipPlan = "silver" | "gold" | "diamond";

export interface VipState {
  plan: VipPlan | null;
  since: number;
}

export interface Announcement {
  id: string;
  text: string;
  at: number;
  by: string;
}

export interface SocialDB {
  version: number;
  posts: Post[];
  videos: Video[];
  stories: Story[];
  friends: FriendLink[];
  groups: Group[];
  groupMessages: GroupMessage[];
  streaks: StreakBook;
  missions: MissionState;
  privacy: PrivacyBook;
  vip: VipState;
  role: "member" | "admin";
  admin: {
    suspended: string[];
    banned: string[];
    reviewed: string[];
    removedContent: string[];
    announcements: Announcement[];
  };
}
