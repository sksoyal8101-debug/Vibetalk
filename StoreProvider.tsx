import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSeedDB, GIFTS } from "../lib/data";
import type {
  AppNotification,
  CoinTxn,
  DB,
  Favorites,
  GameScore,
  Gift,
  Message,
  NotifType,
  Report,
  Room,
  RoomChat,
  RoomEvent,
  User,
  UserStats,
} from "../lib/types";
import { KEYS, loadDB, loadSession, removeKey, resetAll, saveDB, saveSession, uid } from "../lib/storage";
import { ageFromDob, levelFromXp, slug, todayKey, validEmail } from "../lib/utils";
import {
  achievementById,
  CHECKIN_REWARDS,
  emptyStats,
  migrateDb,
  newlyUnlocked,
  nextCheckinDay,
  SPIN_SEGMENTS,
  streakFrom,
  XP_RULES,
  type Achievement,
  type SpinSegment,
  type XpRule,
} from "../lib/progression";
import { categorizeSafe } from "../lib/rooms";

export interface Toast {
  id: string;
  text: string;
  tone: "ok" | "err" | "info";
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  dob: string;
  gender: User["gender"];
  country: string;
  language: string;
  agree: boolean;
}

export type ActionResult = { ok: boolean; error?: string; field?: string };

export interface RewardPop {
  emoji: string;
  title: string;
  lines: string[];
  tone: "coins" | "badge" | "mixed";
}

interface Ctx {
  db: DB;
  me: User | null;
  booting: boolean;
  toasts: Toast[];
  needsSetup: boolean;
  currentRoomId: string | null;
  roomMutes: Record<string, string[]>;
  levelUp: { from: number; to: number } | null;
  badgeQueue: Achievement[];
  reward: RewardPop | null;
  closeReward: () => void;
  pushToast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  userById: (id: string) => User | undefined;
  visibleUsers: User[];
  myFollows: string[];
  favorites: Favorites;
  isFavoriteUser: (id: string) => boolean;
  isFavoriteRoom: (id: string) => boolean;
  toggleFavoriteUser: (id: string) => void;
  toggleFavoriteRoom: (id: string) => void;
  canCheckIn: boolean;
  canSpin: boolean;
  checkinDay: number;
  checkinStreak: number;
  signup: (input: SignupInput) => Promise<ActionResult>;
  login: (email: string, password: string) => Promise<ActionResult>;
  logout: () => void;
  resetDemoData: () => void;
  finishSetup: () => void;
  updateMe: (patch: Partial<User>) => void;
  grantXp: (rule: XpRule, extra?: number) => void;
  claimCheckin: () => void;
  spin: () => { index: number; segment: SpinSegment } | null;
  toggleFollow: (id: string) => void;
  toggleBlock: (id: string) => void;
  submitReport: (r: Omit<Report, "id" | "at">) => void;
  sendMessage: (to: string, text: string, replyTo?: string) => void;
  sendDmReaction: (messageId: string, emoji: string) => void;
  markConversationRead: (peerId: string) => void;
  deleteMessage: (id: string) => void;
  conversationWith: (peerId: string) => Message[];
  createRoom: (input: { title: string; topic: string; category?: string; cover: number; seats: number; description: string; tags?: string[] }) => string;
  updateRoom: (roomId: string, patch: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  joinRoom: (roomId: string, asSpeaker?: boolean) => boolean;
  leaveRoom: () => void;
  requestToSpeak: (roomId: string) => void;
  cancelSpeakRequest: (roomId: string) => void;
  hostApproveSpeaker: (roomId: string, userId: string) => void;
  hostRejectSpeaker: (roomId: string, userId: string) => void;
  hostPromoteCoHost: (roomId: string, userId: string) => void;
  hostDemoteCoHost: (roomId: string, userId: string) => void;
  sendRoomReaction: (roomId: string, emoji: string) => void;
  postRoomChat: (roomId: string, text: string, kind?: RoomChat["kind"], giftId?: string) => void;
  sendGift: (toUserId: string, gift: Gift, roomId?: string | null, count?: number) => ActionResult;
  addCoins: (amount: number, label: string, kind: CoinTxn["kind"]) => void;
  buyCoins: (amount: number, bonus: number, label: string) => ActionResult;
  hostMute: (roomId: string, userId: string, mode: boolean) => void;
  hostKick: (roomId: string, userId: string) => void;
  hostPromote: (roomId: string, userId: string) => void;
  hostDemote: (roomId: string, userId: string) => void;
  hostLock: (roomId: string, locked: boolean) => void;
  hostEnd: (roomId: string) => void;
  hostAnnounce: (roomId: string, text: string) => void;
  createEvent: (input: Omit<RoomEvent, "id" | "createdAt" | "hostId" | "rsvps">) => void;
  rsvpEvent: (eventId: string) => void;
  deleteEvent: (eventId: string) => void;
  addNotification: (n: { type: NotifType; title: string; body: string; actorId?: string; link?: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  recordGame: (game: GameScore["game"], result: GameScore["result"], points: number) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

const REPLY_BANK = [
  "haha love that energy ✨",
  "ok you're officially on my 'talk to daily' list",
  "I'm in the lo-fi room if you want to hop in",
  "that made my whole night honestly",
  "same. every single time.",
  "give me 10 min, then I'm all ears 🎧",
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => migrateDb(loadDB(createSeedDB())));
  const [sessionId, setSessionId] = useState<string | null>(() => loadSession()?.userId ?? null);
  const [booting, setBooting] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [roomMutes, setRoomMutes] = useState<Record<string, string[]>>({});
  const [levelUp, setLevelUp] = useState<{ from: number; to: number } | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<Achievement[]>([]);
  const [reward, setReward] = useState<RewardPop | null>(null);
  const timers = useRef<number[]>([]);
  const pinged = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = window.setTimeout(() => setBooting(false), 520);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const me = useMemo(() => db.users.find((u) => u.id === sessionId) ?? null, [db.users, sessionId]);

  useEffect(() => {
    if (sessionId && !booting && !me) {
      setSessionId(null);
      saveSession(null);
    }
  }, [sessionId, me, booting]);

  useEffect(() => {
    if (sessionId) saveSession({ userId: sessionId, startedAt: Date.now() });
    else saveSession(null);
  }, [sessionId]);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = uid("toast");
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3800);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const userById = useCallback((id: string) => db.users.find((u) => u.id === id), [db.users]);

  const visibleUsers = useMemo(
    () => db.users.filter((u) => u.id !== me?.id && !db.blocked.includes(u.id)),
    [db.users, db.blocked, me?.id],
  );

  /* ------------------------------- XP & badges ------------------------------- */

  const patchMe = useCallback(
    (fn: (user: User) => User) => {
      setDb((prev) => {
        if (!sessionId) return prev;
        const idx = prev.users.findIndex((u) => u.id === sessionId);
        if (idx < 0) return prev;
        const next = [...prev.users];
        next[idx] = fn(next[idx]);
        return { ...prev, users: next };
      });
    },
    [sessionId],
  );

  const bumpStat = useCallback(
    (key: keyof UserStats, by = 1) => {
      patchMe((u) => ({ ...u, stats: { ...emptyStats(), ...u.stats, [key]: (u.stats?.[key] ?? 0) + by } }));
    },
    [patchMe],
  );

  const grantXp = useCallback(
    (rule: XpRule, extra = 0) => {
      const amount = (XP_RULES[rule] ?? 0) + extra;
      if (!amount || !sessionId) return;
      setDb((prev) => {
        const idx = prev.users.findIndex((u) => u.id === sessionId);
        if (idx < 0) return prev;
        const user = prev.users[idx];
        const before = levelFromXp(user.xp).level;
        const nextXp = Math.max(0, user.xp + amount);
        const after = levelFromXp(nextXp).level;
        const next = [...prev.users];
        next[idx] = { ...user, xp: nextXp, level: Math.max(user.level, after) };
        if (after > before) {
          later(() => setLevelUp({ from: before, to: after }), 260);
        }
        return {
          ...prev,
          users: next,
          notifications: after > before
            ? [
                {
                  id: uid("n"),
                  type: "levelup" as NotifType,
                  title: `Level up — LV ${after}`,
                  body: `${amount} xp earned. Your profile glow got stronger.`,
                  at: Date.now(),
                  read: false,
                  link: "/profile",
                },
                ...prev.notifications,
              ]
            : prev.notifications,
        };
      });
    },
    [later, sessionId],
  );

  const awardBadge = useCallback(
    (id: string) => {
      const def = achievementById(id);
      if (!def) return;
      patchMe((u) => (u.achievements.includes(id) ? u : { ...u, achievements: [...u.achievements, id] }));
      setBadgeQueue((prev) => (prev.some((b) => b.id === id) ? prev : [...prev, def]));
      setDb((prev) => ({
        ...prev,
        notifications: [
          {
            id: uid("n"),
            type: "badge" as NotifType,
            title: `Badge unlocked: ${def.name} ${def.emoji}`,
            body: def.blurb,
            at: Date.now(),
            read: false,
            link: "/profile",
          },
          ...prev.notifications,
        ],
      }));
    },
    [patchMe],
  );

  // Badge queue drains one at a time so animations never stack.
  useEffect(() => {
    if (badgeQueue.length === 0) return;
    const t = window.setTimeout(() => setBadgeQueue((prev) => prev.slice(1)), 2900);
    return () => window.clearTimeout(t);
  }, [badgeQueue]);

  useEffect(() => {
    if (levelUp === null) return;
    const t = window.setTimeout(() => setLevelUp(null), 3000);
    return () => window.clearTimeout(t);
  }, [levelUp]);

  useEffect(() => {
    if (reward === null) return;
    const t = window.setTimeout(() => setReward(null), 3400);
    return () => window.clearTimeout(t);
  }, [reward]);

  // Achievement evaluation for the signed-in profile.
  useEffect(() => {
    if (!me) return;
    const fresh = newlyUnlocked(me, db);
    if (fresh.length === 0) return;
    fresh.forEach((a) => awardBadge(a.id));
    pushToast(`${fresh[0].emoji} ${fresh[0].name} unlocked${fresh.length > 1 ? ` +${fresh.length - 1} more` : ""}`, "ok");
  }, [awardBadge, db, me, pushToast]);

  /* ------------------------------- Presence loop ------------------------------ */

  useEffect(() => {
    const loop = window.setInterval(() => {
      setDb((prev) => {
        const pool = prev.users.filter((u) => u.isDemo);
        if (pool.length === 0) return prev;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const nowOnline = !pick.online;
        const isFavourite = prev.favorites.users.includes(pick.id);
        const hosted = prev.rooms.find((r) => r.hostId === pick.id && r.live);
        const key = `${pick.id}-${todayKey()}-${nowOnline ? "on" : "off"}`;
        const shouldPing = isFavourite && nowOnline && !!hosted && !pinged.current.has(key);
        if (shouldPing) pinged.current.add(key);
        return {
          ...prev,
          users: prev.users.map((u) => (u.id === pick.id ? { ...u, online: nowOnline } : u)),
          notifications: shouldPing
            ? [
                {
                  id: uid("n"),
                  type: "favorite" as NotifType,
                  title: `${pick.username} is online and hosting`,
                  body: `"${hosted?.title}" has a seat open for you.`,
                  at: Date.now(),
                  read: false,
                  actorId: pick.id,
                  link: hosted ? `/rooms/${hosted.id}` : undefined,
                },
                ...prev.notifications,
              ]
            : prev.notifications,
        };
      });
    }, 9000);
    return () => window.clearInterval(loop);
  }, []);

  /* ---------------------------------- Auth ----------------------------------- */

  const signup = useCallback(
    async (input: SignupInput): Promise<ActionResult> => {
      const username = slug(input.username);
      const email = input.email.trim().toLowerCase();
      if (username.length < 3) return { ok: false, error: "Pick a username with at least 3 characters.", field: "username" };
      if (username.length > 20) return { ok: false, error: "Usernames max out at 20 characters.", field: "username" };
      if (!validEmail(email)) return { ok: false, error: "That email address doesn't look right.", field: "email" };
      if (input.password.length < 6) return { ok: false, error: "Use at least 6 characters for your password.", field: "password" };
      const age = ageFromDob(input.dob);
      if (age === null) return { ok: false, error: "Add your date of birth so we can verify your age.", field: "dob" };
      if (age < 18) return { ok: false, error: "VibeTalk is for adults 18 and over.", field: "dob" };
      if (age > 110) return { ok: false, error: "Please double-check your date of birth.", field: "dob" };
      if (!input.country) return { ok: false, error: "Choose your country.", field: "country" };
      if (!input.language) return { ok: false, error: "Choose your main language.", field: "language" };
      if (!input.agree) return { ok: false, error: "You must confirm you are 18+ to continue.", field: "agree" };
      if (db.users.some((u) => u.email === email)) {
        return { ok: false, error: "An account with this email already exists. Try logging in.", field: "email" };
      }
      if (db.users.some((u) => u.username.toLowerCase() === username)) {
        return { ok: false, error: "That username is taken.", field: "username" };
      }

      await new Promise((r) => setTimeout(r, 520));

      const id = uid("u");
      const now = Date.now();
      const user: User = {
        id,
        username,
        email,
        password: input.password,
        dob: input.dob,
        gender: input.gender,
        country: input.country,
        language: input.language,
        bio: "",
        interests: ["Music", "Gaming", "Travel"],
        level: 3,
        xp: 780,
        coins: 5000,
        followers: 1,
        following: 3,
        online: true,
        verified: false,
        isDemo: false,
        joinedAt: now,
        frame: "pulse",
        theme: "violet",
        achievements: [],
        checkinDates: [],
        checkinStreak: 0,
        lastSpin: "",
        spins: 0,
        sparkles: 0,
        giftsSent: 0,
        giftsReceived: 0,
        stats: emptyStats(),
      };

      const welcomeMsg: Message = {
        id: uid("m"),
        from: "u_nova",
        to: id,
        text: `welcome to vibetalk, @${username} 🎧 I host the late-night lo-fi room — come say hi whenever.`,
        at: now,
        read: false,
      };

      setDb((prev) => ({
        ...prev,
        users: [...prev.users, user],
        messages: [...prev.messages, welcomeMsg],
        follows: ["u_nova", "u_mira", "u_yuki"],
        favorites: { users: ["u_nova"], rooms: ["r_1"] },
        txns: [{ id: uid("t"), kind: "demo-topup", label: "New member demo balance", amount: 5000, at: now }],
        notifications: [
          {
            id: uid("n"),
            type: "reward",
            title: "Daily check-in is waiting ☕",
            body: "Claim day 1 for 100 Vibe Coins and 60 xp. Come back tomorrow to keep the streak.",
            at: now,
            read: false,
            link: "/rewards",
          },
          {
            id: uid("n"),
            type: "system",
            title: "Welcome to VibeTalk 👋",
            body: "You're signed in locally — this MVP stores everything in your browser.",
            at: now - 1000,
            read: false,
            actorId: "u_nova",
          },
          {
            id: uid("n"),
            type: "room",
            title: "3 rooms near you are live",
            body: "Late Night Lo-Fi, Speed Friending and the Producers Circle.",
            at: now - 2000,
            read: false,
            actorId: "u_zoe",
            link: "/rooms",
          },
          ...prev.notifications,
        ],
      }));
      setSessionId(id);
      setNeedsSetup(true);
      pushToast(`Account created — welcome, @${username}!`, "ok");
      return { ok: true };
    },
    [db.users, pushToast],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      const clean = email.trim().toLowerCase();
      if (!clean || !password) return { ok: false, error: "Enter both your email and password.", field: "email" };
      if (!validEmail(clean)) return { ok: false, error: "That email address doesn't look right.", field: "email" };
      await new Promise((r) => setTimeout(r, 420));
      const user = db.users.find((u) => u.email.toLowerCase() === clean);
      if (!user) return { ok: false, error: "No local demo account with that email. Create one first — it takes 20 seconds.", field: "email" };
      if (user.password !== password) return { ok: false, error: "Wrong password for that account.", field: "password" };

      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? { ...u, online: true } : u)),
      }));
      setSessionId(user.id);
      setNeedsSetup(user.bio === "" ? true : false);
      pushToast(`Welcome back, @${user.username}!`, "ok");
      if (user.lastSpin !== todayKey() || !(user.checkinDates ?? []).includes(todayKey())) {
        later(
          () =>
            setReward({
              emoji: "🎁",
              title: "Daily rewards available",
              lines: ["Check-in and the lucky wheel are both ready.", "Virtual rewards only — no real money."],
              tone: "mixed",
            }),
          1100,
        );
      }
      return { ok: true };
    },
    [db.users, later, pushToast],
  );

  const logout = useCallback(() => {
    setSessionId(null);
    saveSession(null);
    setCurrentRoomId(null);
    setNeedsSetup(false);
    pushToast("Signed out. Your demo data stays on this device.", "info");
  }, [pushToast]);

  const resetDemoData = useCallback(() => {
    resetAll();
    removeKey(KEYS.social);
    removeKey("vibetalk.groupread.v1");
    removeKey(KEYS.prefs);
    removeKey(KEYS.searches);
    setSessionId(null);
    setCurrentRoomId(null);
    setNeedsSetup(false);
    setDb(migrateDb(loadDB(createSeedDB())));
    window.dispatchEvent(new CustomEvent("vibetalk:reset"));
    pushToast("Demo data reset. Fresh world loaded.", "ok");
  }, [pushToast]);

  const updateMe = useCallback(
    (patch: Partial<User>) => {
      if (!me) return;
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === me.id ? { ...u, ...patch } : u)),
      }));
      if (Object.keys(patch).some((k) => ["bio", "interests", "username", "country", "language", "gender"].includes(k))) {
        grantXp("profileEdit");
      }
    },
    [grantXp, me],
  );

  /* ------------------------------- Social graph ------------------------------ */

  const myFollows = db.follows;

  const toggleFollow = useCallback(
    (id: string) => {
      if (!me) return;
      const following = db.follows.includes(id);
      setDb((prev) => ({
        ...prev,
        follows: following ? prev.follows.filter((f) => f !== id) : [...prev.follows, id],
        users: prev.users.map((u) =>
          u.id === id
            ? { ...u, followers: Math.max(0, u.followers + (following ? -1 : 1)) }
            : u.id === me.id
              ? { ...u, following: Math.max(0, u.following + (following ? -1 : 1)) }
              : u,
        ),
      }));
      const target = db.users.find((u) => u.id === id);
      if (!following) grantXp("follow");
      pushToast(
        following ? `Unfollowed @${target?.username ?? "user"}` : `Following @${target?.username ?? "user"} — they'll see you online`,
        "info",
      );
    },
    [db.follows, db.users, grantXp, me, pushToast],
  );

  const toggleBlock = useCallback(
    (id: string) => {
      const blocked = db.blocked.includes(id);
      setDb((prev) => ({
        ...prev,
        blocked: blocked ? prev.blocked.filter((b) => b !== id) : [...prev.blocked, id],
        follows: blocked ? prev.follows : prev.follows.filter((f) => f !== id),
        favorites: blocked ? prev.favorites : { users: prev.favorites.users.filter((f) => f !== id), rooms: prev.favorites.rooms },
      }));
      const target = db.users.find((u) => u.id === id);
      pushToast(blocked ? `@${target?.username} unblocked` : `@${target?.username} blocked — they can't see your rooms`, blocked ? "ok" : "info");
    },
    [db.blocked, db.users, pushToast],
  );

  const favorites = db.favorites;
  const isFavoriteUser = useCallback((id: string) => favorites.users.includes(id), [favorites.users]);
  const isFavoriteRoom = useCallback((id: string) => favorites.rooms.includes(id), [favorites.rooms]);

  const toggleFavoriteUser = useCallback(
    (id: string) => {
      setDb((prev) => {
        const has = prev.favorites.users.includes(id);
        return { ...prev, favorites: { ...prev.favorites, users: has ? prev.favorites.users.filter((f) => f !== id) : [...prev.favorites.users, id] } };
      });
      const target = db.users.find((u) => u.id === id);
      pushToast(favorites.users.includes(id) ? `@${target?.username} removed from favourites` : `@${target?.username} added to favourites ⭐`, "ok");
      if (!favorites.users.includes(id)) bumpStat("favorites");
    },
    [bumpStat, db.users, favorites.users, pushToast],
  );

  const toggleFavoriteRoom = useCallback(
    (id: string) => {
      setDb((prev) => {
        const has = prev.favorites.rooms.includes(id);
        return { ...prev, favorites: { ...prev.favorites, rooms: has ? prev.favorites.rooms.filter((f) => f !== id) : [...prev.favorites.rooms, id] } };
      });
      const room = db.rooms.find((r) => r.id === id);
      pushToast(favorites.rooms.includes(id) ? `Removed "${room?.title ?? "room"}" from favourites` : `"${room?.title ?? "Room"}" favourited — you'll get host alerts ⭐`, "ok");
      if (!favorites.rooms.includes(id)) bumpStat("favorites");
    },
    [bumpStat, db.rooms, favorites.rooms, pushToast],
  );

  const submitReport = useCallback(
    (r: Omit<Report, "id" | "at">) => {
      const report: Report = { ...r, id: uid("rep"), at: Date.now() };
      setDb((prev) => ({
        ...prev,
        reports: [report, ...prev.reports],
        notifications: [
          {
            id: uid("n"),
            type: "system",
            title: "Report received",
            body: `Thanks for helping keep VibeTalk safe. Reference #${report.id.slice(-6).toUpperCase()}.`,
            at: Date.now(),
            read: false,
            link: "/settings",
          },
          ...prev.notifications,
        ],
      }));
      pushToast("Report sent to the safety team (demo).", "ok");
    },
    [pushToast],
  );

  /* --------------------------------- Messages -------------------------------- */

  const sendMessage = useCallback(
    (to: string, text: string, replyTo?: string) => {
      const clean = text.trim();
      if (!me || !clean) return;
      const msg: Message = { id: uid("m"), from: me.id, to, text: clean, at: Date.now(), read: true, replyTo, reactions: {} };
      setDb((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
      bumpStat("dms");
      grantXp("dm");
      const peer = db.users.find((u) => u.id === to);
      if (peer && peer.isDemo) {
        later(() => {
          setDb((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: uid("m"),
                from: to,
                to: me.id,
                text: REPLY_BANK[Math.floor(Math.random() * REPLY_BANK.length)],
                at: Date.now(),
                read: false,
                reactions: {},
              },
            ],
          }));
        }, 1400 + Math.random() * 2200);
      }
    },
    [bumpStat, db.users, grantXp, later, me],
  );

  const sendDmReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!me) return;
      setDb((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id !== messageId) return m;
          const current = m.reactions?.[emoji] ?? [];
          const next = current.includes(me.id) ? current.filter((u) => u !== me.id) : [...current, me.id];
          const reactions = { ...(m.reactions ?? {}) };
          if (next.length === 0) delete reactions[emoji];
          else reactions[emoji] = next;
          return { ...m, reactions };
        }),
      }));
    },
    [me],
  );

  const markConversationRead = useCallback(
    (peerId: string) => {
      if (!me) return;
      setDb((prev) => {
        const needs = prev.messages.some((m) => m.from === peerId && m.to === me.id && !m.read);
        if (!needs) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) => (m.from === peerId && m.to === me.id ? { ...m, read: true } : m)),
        };
      });
    },
    [me],
  );

  const deleteMessage = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, messages: prev.messages.filter((m) => m.id !== id) }));
  }, []);

  const conversationWith = useCallback(
    (peerId: string) => {
      if (!me) return [];
      return db.messages
        .filter((m) => (m.from === me.id && m.to === peerId) || (m.from === peerId && m.to === me.id))
        .sort((a, b) => a.at - b.at);
    },
    [db.messages, me],
  );

  /* ---------------------------------- Rooms ---------------------------------- */

  const createRoom = useCallback(
    (input: { title: string; topic: string; category?: string; cover: number; seats: number; description: string; tags?: string[] }) => {
      const id = uid("r");
      const now = Date.now();
      const cat = input.category || categorizeSafe(input.topic, input.title);
      const room: Room = {
        id,
        title: input.title.trim(),
        topic: input.topic,
        category: cat,
        tags: input.tags && input.tags.length ? input.tags : ["#vibetalk", `#${cat.toLowerCase().replace(/\s+/g, "")}`],
        cover: input.cover,
        seats: input.seats,
        hostId: me?.id ?? "u_demo",
        coHostIds: [],
        speakerIds: me ? [me.id] : [],
        speakerRequests: [],
        listeners: 1,
        description: input.description.trim() || "A fresh room. Good vibes only — 18+.",
        announcement: "",
        rules: [
          "Adults 18+ only. Respectful banter is welcome, harassment is not.",
          "Take turns when unmuted — no talking over others.",
          "No money solicitation, promo links, or gambling.",
          "Good vibes only! Feel free to send reactions and gifts.",
        ],
        reactions: [],
        locked: false,
        live: true,
        createdByUser: true,
        createdAt: now,
      };
      setDb((prev) => ({
        ...prev,
        rooms: [room, ...prev.rooms],
        recentlyJoinedRooms: [id, ...(prev.recentlyJoinedRooms ?? []).filter((r) => r !== id)].slice(0, 12),
        chats: [
          ...prev.chats,
          { id: uid("c"), roomId: id, userId: "system", text: "Room created — demo audio only. Be kind, 18+.", at: now, kind: "system" },
        ],
      }));
      if (me) grantXp("roomJoin", 30);
      pushToast("Room is live (demo audio).", "ok");
      return id;
    },
    [grantXp, me, pushToast],
  );

  const updateRoom = useCallback(
    (roomId: string, patch: Partial<Room>) => {
      setDb((prev) => ({ ...prev, rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)) }));
      pushToast("Room updated.", "ok");
    },
    [pushToast],
  );

  const deleteRoom = useCallback(
    (roomId: string) => {
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((r) => r.id !== roomId),
        chats: prev.chats.filter((c) => c.roomId !== roomId),
        favorites: { users: prev.favorites.users, rooms: prev.favorites.rooms.filter((f) => f !== roomId) },
      }));
      setCurrentRoomId((cur) => (cur === roomId ? null : cur));
      pushToast("Room closed.", "info");
    },
    [pushToast],
  );

  const postRoomChat = useCallback(
    (roomId: string, text: string, kind: RoomChat["kind"] = "text", giftId?: string) => {
      const clean = text.trim();
      if (!me || !clean) return;
      setDb((prev) => ({
        ...prev,
        chats: [...prev.chats, { id: uid("c"), roomId, userId: me.id, text: clean, at: Date.now(), kind, giftId }],
      }));
      if (kind === "text") {
        bumpStat("roomChats");
        grantXp("roomChat");
      }
    },
    [bumpStat, grantXp, me],
  );

  const joinRoom = useCallback(
    (roomId: string, asSpeaker = true): boolean => {
      if (!me) return false;
      const room = db.rooms.find((r) => r.id === roomId);
      if (!room) return false;
      if (room.locked && room.hostId !== me.id) {
        pushToast("This room is locked — the host is only letting invited members in.", "err");
        return false;
      }
      setDb((prev) => {
        const target = prev.rooms.find((r) => r.id === roomId);
        if (!target) return prev;
        const already = target.speakerIds.includes(me.id);
        const nextRoom: Room = {
          ...target,
          speakerIds: asSpeaker && !already ? [...target.speakerIds, me.id] : target.speakerIds,
          listeners: target.listeners + 1,
        };
        const recent = [roomId, ...(prev.recentlyJoinedRooms ?? []).filter((r) => r !== roomId)].slice(0, 12);
        return {
          ...prev,
          recentlyJoinedRooms: recent,
          rooms: prev.rooms.map((r) => (r.id === roomId ? nextRoom : r)),
          chats: [
            ...prev.chats,
            {
              id: uid("c"),
              roomId,
              userId: "system",
              text: `@${me.username} joined the room`,
              at: Date.now(),
              kind: "system" as const,
            },
          ],
        };
      });
      setCurrentRoomId(roomId);
      bumpStat("roomsJoined");
      grantXp("roomJoin");
      return true;
    },
    [bumpStat, db.rooms, grantXp, me, pushToast],
  );

  const leaveRoom = useCallback(() => {
    const roomId = currentRoomId;
    if (!me || !roomId) return;
    setDb((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              speakerIds: r.speakerIds.filter((s) => s !== me.id),
              speakerRequests: (r.speakerRequests ?? []).filter((u) => u !== me.id),
              listeners: Math.max(0, r.listeners - 1),
            }
          : r,
      ),
      chats: [
        ...prev.chats,
        { id: uid("c"), roomId, userId: "system", text: `@${me.username} left the room`, at: Date.now(), kind: "system" as const },
      ],
    }));
    setCurrentRoomId(null);
  }, [currentRoomId, me]);

  const requestToSpeak = useCallback(
    (roomId: string) => {
      if (!me) return;
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, speakerRequests: Array.from(new Set([...(r.speakerRequests ?? []), me.id])) }
            : r,
        ),
      }));
      pushToast("Hand raised — speaker request sent to the host.", "ok");
    },
    [me, pushToast],
  );

  const cancelSpeakRequest = useCallback(
    (roomId: string) => {
      if (!me) return;
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, speakerRequests: (r.speakerRequests ?? []).filter((u) => u !== me.id) }
            : r,
        ),
      }));
      pushToast("Hand lowered.", "info");
    },
    [me, pushToast],
  );

  const hostApproveSpeaker = useCallback(
    (roomId: string, userId: string) => {
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                speakerIds: Array.from(new Set([...r.speakerIds, userId])).slice(0, r.seats),
                speakerRequests: (r.speakerRequests ?? []).filter((u) => u !== userId),
              }
            : r,
        ),
        chats: [
          ...prev.chats,
          { id: uid("c"), roomId, userId: "system", text: `@${prev.users.find((u) => u.id === userId)?.username ?? "Member"} was invited to speak 🎤`, at: Date.now(), kind: "system" as const },
        ],
      }));
      pushToast("Speaker request approved.", "ok");
      grantXp("hostTool");
    },
    [grantXp, pushToast],
  );

  const hostRejectSpeaker = useCallback(
    (roomId: string, userId: string) => {
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, speakerRequests: (r.speakerRequests ?? []).filter((u) => u !== userId) }
            : r,
        ),
      }));
      pushToast("Speaker request declined.", "info");
    },
    [pushToast],
  );

  const hostPromoteCoHost = useCallback(
    (roomId: string, userId: string) => {
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, coHostIds: Array.from(new Set([...(r.coHostIds ?? []), userId])) }
            : r,
        ),
        chats: [
          ...prev.chats,
          { id: uid("c"), roomId, userId: "system", text: `@${prev.users.find((u) => u.id === userId)?.username ?? "Member"} is now a Co-Host 👑`, at: Date.now(), kind: "system" as const },
        ],
      }));
      pushToast("Promoted to Co-Host.", "ok");
      grantXp("hostTool");
    },
    [grantXp, pushToast],
  );

  const hostDemoteCoHost = useCallback(
    (roomId: string, userId: string) => {
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, coHostIds: (r.coHostIds ?? []).filter((u) => u !== userId) }
            : r,
        ),
      }));
      pushToast("Co-Host role removed.", "info");
      grantXp("hostTool");
    },
    [grantXp, pushToast],
  );

  const sendRoomReaction = useCallback(
    (roomId: string, emoji: string) => {
      if (!me) return;
      const reaction = { id: uid("rx"), emoji, userId: me.id, at: Date.now() };
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, reactions: [...(r.reactions ?? []).slice(-24), reaction] }
            : r,
        ),
      }));
    },
    [me],
  );

  /* -------------------------------- Host tools ------------------------------- */

  const hostMute = useCallback(
    (roomId: string, userId: string, mode: boolean) => {
      setRoomMutes((prev) => {
        const list = prev[roomId] ?? [];
        const next = mode ? [...new Set([...list, userId])] : list.filter((id) => id !== userId);
        return { ...prev, [roomId]: next };
      });
      const target = db.users.find((u) => u.id === userId);
      pushToast(mode ? `@${target?.username} muted (demo)` : `@${target?.username} unmuted`, "info");
      grantXp("hostTool");
    },
    [db.users, grantXp, pushToast],
  );

  const hostKick = useCallback(
    (roomId: string, userId: string) => {
      const target = db.users.find((u) => u.id === userId);
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, speakerIds: r.speakerIds.filter((s) => s !== userId), listeners: Math.max(0, r.listeners - 1) }
            : r,
        ),
        chats: [
          ...prev.chats,
          { id: uid("c"), roomId, userId: "system", text: `@${target?.username ?? "member"} was removed by the host`, at: Date.now(), kind: "system" as const },
        ],
      }));
      if (userId === me?.id) setCurrentRoomId(null);
      pushToast(`@${target?.username ?? "member"} removed from the stage`, "info");
      grantXp("hostTool");
    },
    [db.users, grantXp, me?.id, pushToast],
  );

  const hostPromote = useCallback(
    (roomId: string, userId: string) => {
      const target = db.users.find((u) => u.id === userId);
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId && !r.speakerIds.includes(userId)
            ? { ...r, speakerIds: [...r.speakerIds, userId].slice(0, r.seats) }
            : r,
        ),
        chats: [
          ...prev.chats,
          { id: uid("c"), roomId, userId: "system", text: `@${target?.username ?? "member"} is now a speaker 🎤`, at: Date.now(), kind: "system" as const },
        ],
      }));
      pushToast(`@${target?.username ?? "member"} got a mic seat`, "ok");
      grantXp("hostTool");
    },
    [db.users, grantXp, pushToast],
  );

  const hostDemote = useCallback(
    (roomId: string, userId: string) => {
      const target = db.users.find((u) => u.id === userId);
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, speakerIds: r.speakerIds.filter((s) => s !== userId) } : r)),
        chats: [
          ...prev.chats,
          { id: uid("c"), roomId, userId: "system", text: `@${target?.username ?? "member"} moved back to the audience`, at: Date.now(), kind: "system" as const },
        ],
      }));
      pushToast(`@${target?.username ?? "member"} is listening now`, "info");
      grantXp("hostTool");
    },
    [db.users, grantXp, pushToast],
  );

  const hostLock = useCallback(
    (roomId: string, locked: boolean) => {
      setDb((prev) => ({ ...prev, rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, locked } : r)) }));
      pushToast(locked ? "Room locked — invite-only" : "Room unlocked for everyone", "info");
      grantXp("hostTool");
    },
    [grantXp, pushToast],
  );

  const hostEnd = useCallback(
    (roomId: string) => {
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, live: false } : r)),
        chats: [...prev.chats, { id: uid("c"), roomId, userId: "system", text: "The host ended this room. Thanks for hanging out 🌙", at: Date.now(), kind: "system" as const }],
      }));
      setCurrentRoomId((cur) => (cur === roomId ? null : cur));
      pushToast("Room ended — it stays on the list as a scheduled room.", "info");
      grantXp("hostTool");
    },
    [grantXp, pushToast],
  );

  const hostAnnounce = useCallback(
    (roomId: string, text: string) => {
      const clean = text.trim();
      if (!clean) return;
      setDb((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, announcement: clean } : r)),
        chats: [...prev.chats, { id: uid("c"), roomId, userId: "system", text: `📣 ${clean}`, at: Date.now(), kind: "announce" as const }],
      }));
      pushToast("Announcement pinned to the room.", "ok");
      grantXp("hostTool");
    },
    [grantXp, pushToast],
  );

  /* ---------------------------------- Events --------------------------------- */

  const createEvent = useCallback(
    (input: Omit<RoomEvent, "id" | "createdAt" | "hostId" | "rsvps">) => {
      const event: RoomEvent = { ...input, id: uid("ev"), hostId: me?.id ?? "u_demo", rsvps: 1, createdAt: Date.now() };
      setDb((prev) => ({
        ...prev,
        events: [event, ...prev.events],
        notifications: [
          {
            id: uid("n"),
            type: "event",
            title: `Event scheduled: ${event.name}`,
            body: `${event.date} at ${event.time} · ${event.category}`,
            at: Date.now(),
            read: false,
            link: "/events",
          },
          ...prev.notifications,
        ],
      }));
      bumpStat("eventsHosted");
      grantXp("eventRsvp", 20);
      pushToast("Event published to the community calendar (demo).", "ok");
    },
    [bumpStat, grantXp, me, pushToast],
  );

  const rsvpEvent = useCallback(
    (eventId: string) => {
      setDb((prev) => ({
        ...prev,
        events: prev.events.map((e) => (e.id === eventId ? { ...e, rsvps: e.rsvps + 1 } : e)),
        notifications: [
          {
            id: uid("n"),
            type: "event",
            title: "You're going 🎟️",
            body: `We'll ping you an hour before it starts. Demo notification only.`,
            at: Date.now(),
            read: false,
            link: "/events",
          },
          ...prev.notifications,
        ],
      }));
      grantXp("eventRsvp");
      pushToast("Saved to your events — see you there.", "ok");
    },
    [grantXp, pushToast],
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      setDb((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== eventId) }));
      pushToast("Event removed.", "info");
    },
    [pushToast],
  );

  /* ------------------------------ Coins & gifts ------------------------------ */

  const addCoins = useCallback(
    (amount: number, label: string, kind: CoinTxn["kind"]) => {
      if (!amount) return;
      const txn: CoinTxn = { id: uid("t"), kind, label, amount, at: Date.now() };
      setDb((prev) => ({
        ...prev,
        txns: [txn, ...prev.txns],
        users: prev.users.map((u) =>
          me && u.id === me.id
            ? { ...u, coins: Math.max(0, u.coins + amount), xp: Math.max(0, u.xp + Math.round(Math.abs(amount) / 12)) }
            : u,
        ),
      }));
    },
    [me],
  );

  const sendGift = useCallback(
    (toUserId: string, gift: Gift, roomId: string | null = null, count = 1): ActionResult => {
      if (!me) return { ok: false, error: "Sign in to send gifts." };
      const total = gift.price * count;
      if (me.coins < total) {
        pushToast(`Not enough Vibe Coins for ${count > 1 ? `${count}× ` : ""}${gift.name}. Top up in Coins.`, "err");
        return { ok: false, error: `You need ${(total - me.coins).toLocaleString()} more coins.` };
      }
      const target = db.users.find((u) => u.id === toUserId);
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => {
          if (u.id === me.id) return { ...u, coins: u.coins - total, giftsSent: u.giftsSent + count };
          if (u.id === toUserId)
            return { ...u, coins: u.coins + Math.round(total * 0.7), sparkles: u.sparkles + Math.round(total * 0.7), giftsReceived: u.giftsReceived + count };
          return u;
        }),
        giftLog: [
          ...Array.from({ length: Math.min(count, 5) }, () => ({
            id: uid("gl"),
            fromId: me.id,
            toId: toUserId,
            giftId: gift.id,
            at: Date.now(),
            roomId,
          })),
          ...prev.giftLog,
        ].slice(0, 200),
        txns: [
          { id: uid("t"), kind: "gift-sent", label: `${count > 1 ? `${count}× ` : ""}${gift.name} to @${target?.username ?? "user"}`, amount: -total, at: Date.now() },
          ...prev.txns,
        ],
        notifications: [
          {
            id: uid("n"),
            type: "gift",
            title: `${gift.emoji} ${count > 1 ? `${count}× ` : ""}${gift.name} sent`,
            body: `${total.toLocaleString()} coins of good vibes for @${target?.username ?? "someone"}.`,
            at: Date.now(),
            read: false,
            actorId: toUserId,
            link: roomId ? `/rooms/${roomId}` : "/gifts",
          },
          ...prev.notifications,
        ],
        chats: roomId
          ? [
              ...prev.chats,
              {
                id: uid("c"),
                roomId,
                userId: me.id,
                text: `sent ${count > 1 ? `${count}× ` : ""}${gift.name} ${gift.emoji} to @${target?.username ?? "guest"}`,
                at: Date.now(),
                kind: "gift" as const,
                giftId: gift.id,
              },
            ]
          : prev.chats,
      }));
      if (GIFTS.every((g) => g.id !== "none")) grantXp("giftSent");
      pushToast(`${gift.emoji} ${gift.name} sent — ${total.toLocaleString()} coins used`, "ok");
      return { ok: true };
    },
    [db.users, grantXp, me, pushToast],
  );

  const buyCoins = useCallback(
    (amount: number, bonus: number, label: string): ActionResult => {
      addCoins(amount + bonus, label, "purchase");
      pushToast("Demo purchase only — real payment will be added later.", "info");
      return { ok: true };
    },
    [addCoins, pushToast],
  );

  /* ------------------------------ Check-in & spin ----------------------------- */

  const checkinDay = me ? nextCheckinDay(me.checkinDates ?? []) : 1;
  const checkinStreak = me ? streakFrom(me.checkinDates ?? []) : 0;
  const canCheckIn = !!me && !(me.checkinDates ?? []).includes(todayKey());
  const canSpin = !!me && me.lastSpin !== todayKey();

  const claimCheckin = useCallback(() => {
    if (!me) return;
    if ((me.checkinDates ?? []).includes(todayKey())) {
      pushToast("Already claimed today — come back tomorrow.", "info");
      return;
    }
    const day = nextCheckinDay(me.checkinDates ?? []);
    const prize = CHECKIN_REWARDS[Math.min(day, CHECKIN_REWARDS.length) - 1];
    const dates = [...new Set([...(me.checkinDates ?? []), todayKey()])].slice(-14);
    const txn: CoinTxn = { id: uid("t"), kind: "checkin", label: `Daily check-in · day ${prize.day}`, amount: prize.coins, at: Date.now() };
    setDb((prev) => ({
      ...prev,
      txns: [txn, ...prev.txns],
      users: prev.users.map((u) =>
        u.id === me.id
          ? {
              ...u,
              coins: u.coins + prize.coins,
              xp: u.xp + prize.xp,
              level: Math.max(u.level, levelFromXp(u.xp + prize.xp).level),
              checkinDates: dates,
              checkinStreak: streakFrom(dates),
              stats: { ...emptyStats(), ...u.stats, checkins: (u.stats?.checkins ?? 0) + 1 },
              achievements: prize.badge && !u.achievements.includes(prize.badge) ? [...u.achievements, prize.badge] : u.achievements,
            }
          : u,
      ),
      notifications: [
        {
          id: uid("n"),
          type: "reward",
          title: `Day ${prize.day} claimed ${prize.emoji}`,
          body: `+${prize.coins.toLocaleString()} coins and ${prize.xp} xp. Streak: ${streakFrom(dates)} days.`,
          at: Date.now(),
          read: false,
          link: "/rewards",
        },
        ...prev.notifications,
      ],
    }));
    setReward({
      emoji: prize.emoji,
      title: `Day ${prize.day} · +${prize.coins.toLocaleString()} coins`,
      lines: [`+${prize.xp} xp added`, prize.badge ? `${achievementById(prize.badge)?.name ?? "Badge"} unlocked!` : "Come back tomorrow to keep the streak."],
      tone: prize.badge ? "badge" : "coins",
    });
    if (prize.badge) awardBadge(prize.badge);
    pushToast(`Check-in claimed — ${prize.coins.toLocaleString()} demo coins`, "ok");
  }, [awardBadge, me, pushToast]);

  const spin = useCallback((): { index: number; segment: SpinSegment } | null => {
    if (!me) return null;
    if (me.lastSpin === todayKey()) {
      pushToast("One free spin per day — back tomorrow.", "info");
      return null;
    }
    const index = Math.floor(Math.random() * SPIN_SEGMENTS.length);
    const segment = SPIN_SEGMENTS[index];
    const coins = segment.kind === "coins" || segment.kind === "boost" ? segment.amount * (segment.kind === "boost" ? 150 : 1) : 0;
    const xp = segment.kind === "xp" ? segment.amount : 40;
    setDb((prev) => ({
      ...prev,
      txns: coins > 0 ? [{ id: uid("t"), kind: "spin", label: `Lucky spin · ${segment.label}`, amount: coins, at: Date.now() }, ...prev.txns] : prev.txns,
      users: prev.users.map((u) =>
        u.id === me.id
          ? {
              ...u,
              coins: u.coins + coins,
              xp: u.xp + xp,
              level: Math.max(u.level, levelFromXp(u.xp + xp).level),
              lastSpin: todayKey(),
              spins: u.spins + 1,
              achievements: segment.kind === "badge" && !u.achievements.includes("lucky-heart") ? [...u.achievements, "lucky-heart"] : u.achievements,
              stats: { ...emptyStats(), ...u.stats, spins: (u.stats?.spins ?? 0) + 1 },
            }
          : u,
      ),
      notifications: [
        {
          id: uid("n"),
          type: "reward",
          title: `Lucky spin: ${segment.emoji} ${segment.label}`,
          body: "Virtual demo reward — no cash value, no wagering.",
          at: Date.now(),
          read: false,
          link: "/rewards",
        },
        ...prev.notifications,
      ],
    }));
    grantXp("spin");
    if (segment.kind === "badge") awardBadge("lucky-heart");
    setReward({
      emoji: segment.emoji,
      title: segment.label,
      lines: [
        coins > 0 ? `+${coins.toLocaleString()} Vibe Coins` : `+${xp} xp`,
        segment.kind === "boost" ? "Next reward today gets a small demo boost" : "Demo reward · no real-money value",
      ],
      tone: segment.kind === "badge" ? "badge" : "coins",
    });
    return { index, segment };
  }, [awardBadge, grantXp, me, pushToast]);

  /* ------------------------------ Notifications ------------------------------ */

  const addNotification = useCallback((n: { type: NotifType; title: string; body: string; actorId?: string; link?: string }) => {
    setDb((prev) => ({
      ...prev,
      notifications: [{ id: uid("n"), ...n, at: Date.now(), read: false }, ...prev.notifications],
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setDb((prev) => ({ ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
  }, []);

  const clearNotifications = useCallback(() => {
    setDb((prev) => ({ ...prev, notifications: [] }));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, notifications: prev.notifications.filter((n) => n.id !== id) }));
  }, []);

  const recordGame = useCallback(
    (game: GameScore["game"], result: GameScore["result"], points: number) => {
      const score: GameScore = { id: uid("g"), game, result, points, at: Date.now() };
      setDb((prev) => ({
        ...prev,
        scores: [score, ...prev.scores].slice(0, 60),
        users: prev.users.map((u) =>
          me && u.id === me.id
            ? { ...u, xp: u.xp + points * 3, stats: { ...emptyStats(), ...u.stats, gamesPlayed: (u.stats?.gamesPlayed ?? 0) + 1 } }
            : u,
        ),
      }));
      if (points > 0) addCoins(points, `Game reward · ${game.replace("-", " ")}`, "reward");
      grantXp("game");
    },
    [addCoins, grantXp, me],
  );

  const value: Ctx = {
    db,
    me,
    booting,
    toasts,
    needsSetup,
    currentRoomId,
    roomMutes,
    levelUp,
    badgeQueue,
    reward,
    closeReward: () => setReward(null),
    pushToast,
    dismissToast,
    userById,
    visibleUsers,
    myFollows,
    favorites,
    isFavoriteUser,
    isFavoriteRoom,
    toggleFavoriteUser,
    toggleFavoriteRoom,
    canCheckIn,
    canSpin,
    checkinDay,
    checkinStreak,
    signup,
    login,
    logout,
    resetDemoData,
    finishSetup: () => setNeedsSetup(false),
    updateMe,
    grantXp,
    claimCheckin,
    spin,
    toggleFollow,
    toggleBlock,
    submitReport,
    sendMessage,
    sendDmReaction,
    markConversationRead,
    deleteMessage,
    conversationWith,
    createRoom,
    updateRoom,
    deleteRoom,
    joinRoom,
    leaveRoom,
    requestToSpeak,
    cancelSpeakRequest,
    hostApproveSpeaker,
    hostRejectSpeaker,
    hostPromoteCoHost,
    hostDemoteCoHost,
    sendRoomReaction,
    postRoomChat,
    sendGift,
    addCoins,
    buyCoins,
    hostMute,
    hostKick,
    hostPromote,
    hostDemote,
    hostLock,
    hostEnd,
    hostAnnounce,
    createEvent,
    rsvpEvent,
    deleteEvent,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    deleteNotification,
    recordGame,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export type { AppNotification };
