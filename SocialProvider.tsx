import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clearAllMediaDB, deleteStoryBlob, KEYS, readJson, removeKey, storeStoryBlob, writeJson } from "../lib/storage";
import { createSeedSocialDB, DAILY_MISSIONS, findMission, weekKey, WEEKLY_MISSIONS } from "../lib/content";
import type {
  Group,
  GroupMessage,
  Post,
  PrivacyBook,
  SocialDB,
  Story,
  Video,
  VipPlan,
} from "../lib/types";
import { uid } from "../lib/storage";
import { todayKey, yesterdayKey } from "../lib/utils";
import { useStore } from "./StoreProvider";
import type { Ctx } from "../lib/engine";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export type FriendState = "none" | "pending_out" | "pending_in" | "friends" | "blocked";

interface SocialCtx {
  social: SocialDB;
  ctx: Ctx;
  ready: boolean;
  /* posts */
  createPost: (input: { text: string; tone: number; media: Post["media"]; hashtag: string; roomId?: string }) => void;
  deletePost: (id: string) => void;
  toggleLikePost: (id: string) => void;
  toggleSavePost: (id: string) => void;
  commentPost: (id: string, text: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  sharePost: (id: string) => void;
  /* videos */
  createVideo: (input: { title: string; music: string; tone: number; duration: number }) => void;
  deleteVideo: (id: string) => void;
  toggleLikeVideo: (id: string) => void;
  toggleSaveVideo: (id: string) => void;
  commentVideo: (id: string, text: string) => void;
  shareVideo: (id: string) => void;
  registerView: (id: string) => void;
  /* stories */
  addStory: (input: {
    caption?: string;
    tone?: number;
    kind?: Story["kind"];
    mediaBlob?: Blob;
    mediaUrl?: string;
    mediaKey?: string;
    mediaType?: "image" | "video";
    duration?: number;
    sticker?: string;
  }) => Promise<ActionResult>;
  deleteStory: (id: string) => void;
  toggleLikeStory: (id: string) => void;
  viewStory: (id: string) => void;
  /* friends */
  friendState: (id: string) => FriendState;
  sendFriendRequest: (id: string) => ActionResult;
  cancelFriendRequest: (linkId: string) => void;
  acceptFriendRequest: (linkId: string) => void;
  rejectFriendRequest: (linkId: string) => void;
  removeFriend: (id: string) => void;
  /* groups */
  createGroup: (input: { name: string; about: string; tone: number; memberIds: string[] }) => string;
  updateGroup: (id: string, patch: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  leaveGroup: (id: string) => void;
  addGroupMembers: (id: string, memberIds: string[]) => void;
  removeGroupMember: (id: string, memberId: string) => void;
  toggleGroupAdmin: (id: string, memberId: string) => void;
  sendGroupMessage: (groupId: string, text: string, replyTo?: string) => void;
  deleteGroupMessage: (groupId: string, messageId: string) => void;
  toggleReaction: (groupId: string, messageId: string, emoji: string) => void;
  groupUnread: (id: string) => number;
  markGroupRead: (id: string) => void;
  /* missions & streaks */
  bumpMission: (key: string, by?: number) => void;
  claimMission: (id: string, kind: "daily" | "weekly") => void;
  touchStreak: (kind: "login" | "chat" | "room" | "friend") => void;
  /* vip */
  activateVip: (plan: VipPlan) => void;
  cancelVip: () => void;
  /* privacy + role + admin */
  setPrivacy: (patch: Partial<PrivacyBook>) => void;
  setRole: (role: "member" | "admin") => void;
  adminToggle: (action: "suspend" | "ban" | "restore", id: string) => void;
  reviewReport: (id: string) => void;
  removeContent: (kind: "post" | "video", id: string) => void;
  announce: (text: string) => void;
}

const SocialContext = createContext<SocialCtx | null>(null);

export function useSocial(): SocialCtx {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used inside <SocialProvider>");
  return ctx;
}

function normalize(input: SocialDB): SocialDB {
  const seed = createSeedSocialDB();
  const out: SocialDB = { ...seed, ...input };
  out.posts = Array.isArray(input.posts) ? input.posts : seed.posts;
  out.videos = Array.isArray(input.videos) ? input.videos : seed.videos;
  out.stories = Array.isArray(input.stories) ? input.stories.filter((s) => s.expiresAt > Date.now()) : seed.stories;
  out.friends = Array.isArray(input.friends) ? input.friends : seed.friends;
  out.groups = Array.isArray(input.groups) ? input.groups : seed.groups;
  out.groupMessages = Array.isArray(input.groupMessages) ? input.groupMessages : seed.groupMessages;
  out.streaks = { ...seed.streaks, ...(input.streaks ?? {}) };
  out.privacy = { ...seed.privacy, ...(input.privacy ?? {}) };
  out.vip = { plan: input.vip?.plan ?? null, since: input.vip?.since ?? 0 };
  out.admin = {
    suspended: input.admin?.suspended ?? [],
    banned: input.admin?.banned ?? [],
    reviewed: input.admin?.reviewed ?? [],
    removedContent: input.admin?.removedContent ?? [],
    announcements: input.admin?.announcements ?? [],
  };
  out.role = input.role === "admin" ? "admin" : "member";
  // roll missions over when the day / week changed
  const day = todayKey();
  const week = weekKey();
  const m = { ...seed.missions, ...(input.missions ?? {}) };
  if (m.day !== day) {
    m.day = day;
    m.daily = {};
    m.claimedDaily = [];
  }
  if (m.week !== week) {
    m.week = week;
    m.weekly = { weekXp: 0 };
    m.claimedWeekly = [];
  }
  out.missions = m;
  return out;
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const { db, me, grantXp, addCoins, addNotification, pushToast, updateMe, userById } = useStore();
  const [social, setSocial] = useState<SocialDB>(() => normalize(readJson<SocialDB>(KEYS.social, createSeedSocialDB())));
  const [ready, setReady] = useState(false);
  const seen = useRef({ rooms: me?.stats.roomsJoined ?? 0, chats: me?.stats.roomChats ?? 0, dms: me?.stats.dms ?? 0, follows: db.follows.length, gifts: me?.giftsSent ?? 0, games: me?.stats.gamesPlayed ?? 0, login: "" });
  const viewed = useRef<Set<string>>(new Set());
  const writeTimer = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 240);
    return () => window.clearTimeout(t);
  }, []);

  /* persist — debounced so we never hammer localStorage */
  useEffect(() => {
    if (writeTimer.current) window.clearTimeout(writeTimer.current);
    writeTimer.current = window.setTimeout(() => writeJson(KEYS.social, social), 220);
    return () => {
      if (writeTimer.current) window.clearTimeout(writeTimer.current);
    };
  }, [social]);

  /* a core-store reset also wipes and re-seeds this v2 collection */
  useEffect(() => {
    const onReset = () => {
      clearAllMediaDB();
      setSocial(normalize(createSeedSocialDB()));
      viewed.current = new Set();
    };
    window.addEventListener("vibetalk:reset", onReset);
    return () => window.removeEventListener("vibetalk:reset", onReset);
  }, []);

  /* Clean up expired story media from IndexedDB */
  useEffect(() => {
    const now = Date.now();
    const expiredKeys = social.stories
      .filter((s) => s.expiresAt <= now && s.mediaKey)
      .map((s) => s.mediaKey!);
    expiredKeys.forEach((key) => {
      void deleteStoryBlob(key);
    });
  }, [social.stories]);

  const ctx: Ctx = useMemo(() => ({ core: db, social, me }), [db, social, me]);

  const touchStreak = useCallback((kind: "login" | "chat" | "room" | "friend") => {
    setSocial((prev) => {
      const key = `${kind}Date` as const;
      if (prev.streaks[key] === todayKey()) return prev;
      const continued = prev.streaks[key] === yesterdayKey();
      const next = { ...prev.streaks, [key]: todayKey(), [kind]: (prev.streaks[kind] ?? 0) + (continued ? 1 : 1) };
      return { ...prev, streaks: next };
    });
  }, []);

  const bumpMission = useCallback((key: string, by = 1) => {
    setSocial((prev) => {
      const bucket = key.startsWith("week") ? "weekly" : "daily";
      const current = prev.missions[bucket][key] ?? 0;
      return { ...prev, missions: { ...prev.missions, [bucket]: { ...prev.missions[bucket], [key]: current + by } } };
    });
  }, []);

  /* Activity watch: mirrors core-store actions into missions + streaks without touching those screens. */
  useEffect(() => {
    if (!me) return;
    const s = seen.current;
    const rooms = me.stats.roomsJoined;
    const chats = me.stats.roomChats;
    const dms = me.stats.dms;
    const gifts = me.giftsSent;
    const games = me.stats.gamesPlayed;
    const follows = db.follows.length;

    if (rooms > s.rooms) {
      bumpMission("roomJoin", rooms - s.rooms);
      bumpMission("weekRooms", rooms - s.rooms);
      bumpMission("weekLive", rooms - s.rooms);
      touchStreak("room");
    }
    if (chats + dms > s.chats + s.dms) {
      bumpMission("message", chats + dms - (s.chats + s.dms));
      touchStreak("chat");
    }
    if (follows > s.follows) bumpMission("follow", follows - s.follows);
    if (gifts > s.gifts) bumpMission("gift", gifts - s.gifts);
    if (games > s.games) {
      bumpMission("game", games - s.games);
      bumpMission("weekGames", games - s.games);
    }
    seen.current = { ...s, rooms, chats, dms, follows, gifts, games };
  }, [bumpMission, db.follows.length, me, touchStreak]);

  /* daily login streak */
  useEffect(() => {
    if (!me || seen.current.login === todayKey()) return;
    seen.current.login = todayKey();
    touchStreak("login");
  }, [me, touchStreak]);

  /* ---------------------------------- Posts --------------------------------- */

  const createPost = useCallback<SocialCtx["createPost"]>(
    (input) => {
      if (!me) return;
      const text = input.text.trim();
      if (text.length < 2) {
        pushToast("Write a couple of words first.", "err");
        return;
      }
      const post: Post = {
        id: uid("p"),
        authorId: me.id,
        text,
        tone: input.tone,
        media: input.media,
        hashtag: input.hashtag || "#vibetalk",
        createdAt: Date.now(),
        likes: [],
        saves: [],
        shares: 0,
        comments: [],
        roomId: input.roomId,
      };
      setSocial((prev) => ({ ...prev, posts: [post, ...prev.posts] }));
      grantXp("post");
      bumpMission("post");
      pushToast("Moment posted to your feed.", "ok");
    },
    [bumpMission, grantXp, me, pushToast],
  );

  const mutatePost = useCallback((id: string, fn: (post: Post) => Post) => {
    setSocial((prev) => ({ ...prev, posts: prev.posts.map((p) => (p.id === id ? fn(p) : p)) }));
  }, []);

  const toggleLikePost = useCallback((id: string) => {
    if (!me) return;
    mutatePost(id, (p) => ({ ...p, likes: p.likes.includes(me.id) ? p.likes.filter((l) => l !== me.id) : [...p.likes, me.id] }));
  }, [me, mutatePost]);

  const toggleSavePost = useCallback((id: string) => {
    if (!me) return;
    mutatePost(id, (p) => ({ ...p, saves: p.saves.includes(me.id) ? p.saves.filter((s) => s !== me.id) : [...p.saves, me.id] }));
    pushToast(me ? "Saved to your moments collection." : "", "info");
  }, [me, mutatePost, pushToast]);

  const commentPost = useCallback<SocialCtx["commentPost"]>((id, text) => {
    if (!me || !text.trim()) return;
    mutatePost(id, (p) => ({
      ...p,
      comments: [...p.comments, { id: uid("c"), authorId: me.id, text: text.trim(), at: Date.now(), likes: [] }],
    }));
    grantXp("comment");
  }, [grantXp, me, mutatePost]);

  const toggleCommentLike = useCallback<SocialCtx["toggleCommentLike"]>((postId, commentId) => {
    if (!me) return;
    mutatePost(postId, (p) => ({
      ...p,
      comments: p.comments.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes.includes(me.id) ? c.likes.filter((l) => l !== me.id) : [...c.likes, me.id] } : c,
      ),
    }));
  }, [me, mutatePost]);

  const sharePost = useCallback((id: string) => {
    mutatePost(id, (p) => ({ ...p, shares: p.shares + 1 }));
    grantXp("share");
    pushToast("Share link copied to your clipboard on supported devices.", "ok");
    navigator.clipboard?.writeText(`${window.location.origin}/#/posts?focus=${id}`).catch(() => undefined);
  }, [grantXp, mutatePost, pushToast]);

  const deletePost = useCallback((id: string) => {
    setSocial((prev) => ({ ...prev, posts: prev.posts.filter((p) => p.id !== id) }));
    pushToast("Post deleted.", "info");
  }, [pushToast]);

  /* --------------------------------- Videos -------------------------------- */

  const mutateVideo = useCallback((id: string, fn: (v: Video) => Video) => {
    setSocial((prev) => ({ ...prev, videos: prev.videos.map((v) => (v.id === id ? fn(v) : v)) }));
  }, []);

  const createVideo = useCallback<SocialCtx["createVideo"]>((input) => {
    if (!me || input.title.trim().length < 3) {
      pushToast("Give the clip a title (3+ characters).", "err");
      return;
    }
    const video: Video = {
      id: uid("v"),
      authorId: me.id,
      title: input.title.trim(),
      music: input.music,
      tone: input.tone,
      shape: Math.floor(Math.random() * 8),
      duration: Math.max(8, Math.min(45, input.duration)),
      views: 1,
      likes: [],
      saves: [],
      shares: 0,
      comments: [],
      hashtags: ["#newclip"],
      createdAt: Date.now(),
    };
    setSocial((prev) => ({ ...prev, videos: [video, ...prev.videos] }));
    grantXp("reel");
    pushToast("Clip published — demo render only, no upload needed.", "ok");
  }, [grantXp, me, pushToast]);

  const deleteVideo = useCallback((id: string) => {
    setSocial((prev) => ({ ...prev, videos: prev.videos.filter((v) => v.id !== id) }));
    pushToast("Clip removed.", "info");
  }, [pushToast]);

  const toggleLikeVideo = useCallback((id: string) => {
    if (!me) return;
    mutateVideo(id, (v) => ({ ...v, likes: v.likes.includes(me.id) ? v.likes.filter((l) => l !== me.id) : [...v.likes, me.id] }));
  }, [me, mutateVideo]);

  const toggleSaveVideo = useCallback((id: string) => {
    if (!me) return;
    mutateVideo(id, (v) => ({ ...v, saves: v.saves.includes(me.id) ? v.saves.filter((s) => s !== me.id) : [...v.saves, me.id] }));
  }, [me, mutateVideo]);

  const commentVideo = useCallback<SocialCtx["commentVideo"]>((id, text) => {
    if (!me || !text.trim()) return;
    mutateVideo(id, (v) => ({
      ...v,
      comments: [...v.comments, { id: uid("c"), authorId: me.id, text: text.trim(), at: Date.now(), likes: [] }],
    }));
    grantXp("comment");
  }, [grantXp, me, mutateVideo]);

  const shareVideo = useCallback((id: string) => {
    mutateVideo(id, (v) => ({ ...v, shares: v.shares + 1 }));
    grantXp("share");
    pushToast("Clip link copied — share anywhere.", "ok");
    navigator.clipboard?.writeText(`${window.location.origin}/#/reels?start=${id}`).catch(() => undefined);
  }, [grantXp, mutateVideo, pushToast]);

  const registerView = useCallback((id: string) => {
    if (viewed.current.has(id)) return;
    viewed.current.add(id);
    mutateVideo(id, (v) => ({ ...v, views: v.views + 1 }));
    bumpMission("reel");
  }, [bumpMission, mutateVideo]);

  /* -------------------------------- Stories -------------------------------- */

  const addStory = useCallback<SocialCtx["addStory"]>(async (input) => {
    if (!me) {
      pushToast("Please log in to post a story.", "err");
      return { ok: false, message: "Please log in to post a story." };
    }
    const storyId = uid("s");
    const mediaKey = input.mediaBlob ? `story_${storyId}` : undefined;

    if (input.mediaBlob && mediaKey) {
      const res = await storeStoryBlob(mediaKey, input.mediaBlob);
      if (!res.ok) {
        const errorMsg = res.error || "Device storage error saving media.";
        pushToast(errorMsg, "err");
        return { ok: false, message: errorMsg };
      }
    }

    const story: Story = {
      id: storyId,
      authorId: me.id,
      caption: input.caption?.trim() || "",
      tone: input.tone ?? 0,
      kind: input.kind || (input.mediaType as Story["kind"]) || "gradient",
      mediaKey,
      mediaUrl: mediaKey ? undefined : input.mediaUrl, // Never store ephemeral blob URL when mediaKey exists!
      mediaType: input.mediaType,
      duration: input.duration,
      sticker: input.sticker,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 3_600_000,
      likes: [],
      views: [],
    };
    setSocial((prev) => {
      const next = { ...prev, stories: [story, ...prev.stories] };
      writeJson(KEYS.social, next);
      return next;
    });
    grantXp("story");
    bumpMission("story");
    pushToast("Story published!", "ok");
    return { ok: true };
  }, [bumpMission, grantXp, me, pushToast]);

  const deleteStory = useCallback((id: string) => {
    const target = social.stories.find((s) => s.id === id);
    if (target?.mediaKey) {
      void deleteStoryBlob(target.mediaKey);
    }
    setSocial((prev) => {
      const next = { ...prev, stories: prev.stories.filter((s) => s.id !== id) };
      writeJson(KEYS.social, next);
      return next;
    });
    pushToast("Story deleted.", "info");
  }, [pushToast, social.stories]);

  const toggleLikeStory = useCallback((id: string) => {
    if (!me) return;
    setSocial((prev) => ({
      ...prev,
      stories: prev.stories.map((s) =>
        s.id === id ? { ...s, likes: s.likes.includes(me.id) ? s.likes.filter((l) => l !== me.id) : [...s.likes, me.id] } : s,
      ),
    }));
  }, [me]);

  const viewStory = useCallback((id: string) => {
    if (!me) return;
    setSocial((prev) => {
      const target = prev.stories.find((s) => s.id === id);
      if (!target || target.views.includes(me.id)) return prev;
      return { ...prev, stories: prev.stories.map((s) => (s.id === id ? { ...s, views: [...s.views, me.id] } : s)) };
    });
  }, [me]);

  /* -------------------------------- Friends -------------------------------- */

  const friendLinkFor = useCallback((id: string) => {
    if (!me) return undefined;
    return social.friends.find(
      (f) => (f.fromId === me.id && f.toId === id) || (f.fromId === id && f.toId === me.id),
    );
  }, [me, social.friends]);

  const friendState = useCallback<SocialCtx["friendState"]>((id) => {
    if (db.blocked.includes(id)) return "blocked";
    const link = friendLinkFor(id);
    if (!link) return "none";
    if (link.state === "accepted") return "friends";
    return link.fromId === me?.id ? "pending_out" : "pending_in";
  }, [db.blocked, friendLinkFor, me?.id]);

  const sendFriendRequest = useCallback<SocialCtx["sendFriendRequest"]>((id) => {
    if (!me) return { ok: false, message: "Sign in first." };
    if (id === me.id) return { ok: false, message: "That's you." };
    if (db.blocked.includes(id)) return { ok: false, message: "You blocked this member — unblock to send a request." };
    const existing = social.friends.find((f) => (f.fromId === me.id && f.toId === id) || (f.fromId === id && f.toId === me.id));
    if (existing?.state === "accepted") {
      pushToast("You're already friends with this member.", "info");
      return { ok: false, message: "You're already friends." };
    }
    if (existing?.state === "pending") {
      pushToast("A request is already pending — cancel it first.", "info");
      return { ok: false, message: "A request is already pending." };
    }
    if (social.privacy.friendRequest === "nobody") {
      pushToast("Friend requests are closed while your Privacy Center setting is set to Nobody.", "err");
      return { ok: false, message: "Friend requests are disabled in your Privacy Center." };
    }
    setSocial((prev) => ({
      ...prev,
      friends: [...prev.friends, { id: uid("f"), fromId: me.id, toId: id, state: "pending", at: Date.now() }],
    }));
    addNotification({ type: "follower", title: `Friend request sent to @${userById(id)?.username ?? "member"}`, body: "They'll see it in their pending requests.", actorId: id, link: "/friends" });
    pushToast("Friend request sent (demo).", "ok");
    return { ok: true };
  }, [addNotification, db.blocked, me, pushToast, social.friends, social.privacy.friendRequest, userById]);

  const cancelFriendRequest = useCallback((linkId: string) => {
    setSocial((prev) => ({ ...prev, friends: prev.friends.filter((f) => f.id !== linkId) }));
    pushToast("Request cancelled.", "info");
  }, [pushToast]);

  const acceptFriendRequest = useCallback((linkId: string) => {
    setSocial((prev) => ({ ...prev, friends: prev.friends.map((f) => (f.id === linkId ? { ...f, state: "accepted", at: Date.now() } : f)) }));
    grantXp("friend");
    bumpMission("weekFriends");
    touchStreak("friend");
    pushToast("You're friends now — they'll show in your friends rail.", "ok");
  }, [bumpMission, grantXp, touchStreak]);

  const rejectFriendRequest = useCallback((linkId: string) => {
    setSocial((prev) => ({ ...prev, friends: prev.friends.filter((f) => f.id !== linkId) }));
    pushToast("Request removed.", "info");
  }, [pushToast]);

  const removeFriend = useCallback((id: string) => {
    setSocial((prev) => ({ ...prev, friends: prev.friends.filter((f) => !((f.fromId === me?.id && f.toId === id) || (f.fromId === id && f.toId === me?.id))) }));
    pushToast("Removed from friends.", "info");
  }, [me?.id, pushToast]);

  /* --------------------------------- Groups -------------------------------- */

  const createGroup = useCallback<SocialCtx["createGroup"]>((input) => {
    const id = uid("g");
    const name = input.name.trim() || "New group";
    const members = Array.from(new Set([me?.id, ...input.memberIds].filter(Boolean) as string[]));
    const group: Group = {
      id,
      name,
      about: input.about.trim() || "A group chat for the people who get it.",
      tone: input.tone,
      ownerId: me?.id ?? "u_demo",
      adminIds: me ? [me.id] : [],
      memberIds: members,
      createdAt: Date.now(),
    };
    setSocial((prev) => ({
      ...prev,
      groups: [group, ...prev.groups],
      groupMessages: [
        { id: uid("gm"), groupId: id, fromId: me?.id ?? "u_demo", text: `Group created — say hi 👋 (demo chat, stored locally)`, at: Date.now(), reactions: {} },
        ...prev.groupMessages,
      ],
    }));
    grantXp("group");
    pushToast(`"${name}" created with ${members.length} members.`, "ok");
    return id;
  }, [grantXp, me]);

  const updateGroup = useCallback<SocialCtx["updateGroup"]>((id, patch) => {
    setSocial((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setSocial((prev) => ({ ...prev, groups: prev.groups.filter((g) => g.id !== id), groupMessages: prev.groupMessages.filter((m) => m.groupId !== id) }));
    pushToast("Group deleted.", "info");
  }, [pushToast]);

  const leaveGroup = useCallback((id: string) => {
    setSocial((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, memberIds: g.memberIds.filter((m) => m !== me?.id) } : g)),
    }));
    pushToast("You left the group.", "info");
  }, [me?.id, pushToast]);

  const addGroupMembers = useCallback<SocialCtx["addGroupMembers"]>((id, memberIds) => {
    if (memberIds.length === 0) return;
    setSocial((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, memberIds: Array.from(new Set([...g.memberIds, ...memberIds])) } : g)),
    }));
    pushToast(`${memberIds.length} member${memberIds.length === 1 ? "" : "s"} added.`, "ok");
  }, [pushToast]);

  const removeGroupMember = useCallback<SocialCtx["removeGroupMember"]>((id, memberId) => {
    setSocial((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, memberIds: g.memberIds.filter((m) => m !== memberId), adminIds: g.adminIds.filter((a) => a !== memberId) } : g)),
    }));
    pushToast("Member removed.", "info");
  }, [pushToast]);

  const toggleGroupAdmin = useCallback<SocialCtx["toggleGroupAdmin"]>((id, memberId) => {
    setSocial((prev) => ({
      ...prev,
      groups: prev.groups.map((g) =>
        g.id === id
          ? { ...g, adminIds: g.adminIds.includes(memberId) ? g.adminIds.filter((a) => a !== memberId) : [...g.adminIds, memberId] }
          : g,
      ),
    }));
  }, []);

  const sendGroupMessage = useCallback<SocialCtx["sendGroupMessage"]>((groupId, text, replyTo) => {
    const clean = text.trim();
    if (!me || !clean) return;
    const msg: GroupMessage = { id: uid("gm"), groupId, fromId: me.id, text: clean, at: Date.now(), replyTo, reactions: {} };
    setSocial((prev) => ({ ...prev, groupMessages: [...prev.groupMessages, msg] }));
    grantXp("dm");
    bumpMission("message");
    touchStreak("chat");
  }, [bumpMission, grantXp, me, touchStreak]);

  const deleteGroupMessage = useCallback<SocialCtx["deleteGroupMessage"]>((groupId, messageId) => {
    setSocial((prev) => ({
      ...prev,
      groupMessages: prev.groupMessages.filter((m) => !(m.groupId === groupId && m.id === messageId)),
    }));
    pushToast("Message deleted.", "info");
  }, [pushToast]);

  const toggleReaction = useCallback<SocialCtx["toggleReaction"]>((groupId, messageId, emoji) => {
    if (!me) return;
    setSocial((prev) => ({
      ...prev,
      groupMessages: prev.groupMessages.map((m) => {
        if (m.id !== messageId || m.groupId !== groupId) return m;
        const list = m.reactions[emoji] ?? [];
        const next = list.includes(me.id) ? list.filter((u) => u !== me.id) : [...list, me.id];
        const reactions = { ...m.reactions };
        if (next.length === 0) delete reactions[emoji];
        else reactions[emoji] = next;
        return { ...m, reactions };
      }),
    }));
  }, [me]);

  const readKey = (id: string) => `vibetalk.read.${id}`;
  const [groupRead, setGroupRead] = useState<Record<string, number>>(() => {
    try {
      const raw = window.localStorage.getItem("vibetalk.groupread.v1");
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      return typeof parsed === "object" && parsed ? parsed : {};
    } catch {
      return {};
    }
  });

  const markGroupRead = useCallback((id: string) => {
    setGroupRead((prev) => {
      const next = { ...prev, [id]: Date.now() };
      void writeJson("vibetalk.groupread.v1", next);
      void readKey;
      return next;
    });
  }, []);

  const groupUnread = useCallback((id: string) => {
    const at = groupRead[id] ?? 0;
    return social.groupMessages.filter((m) => m.groupId === id && m.fromId !== me?.id && m.at > at).length;
  }, [groupRead, me?.id, social.groupMessages]);

  /* -------------------------------- Missions -------------------------------- */

  const claimMission = useCallback<SocialCtx["claimMission"]>((id, kind) => {
    const list = kind === "daily" ? DAILY_MISSIONS : WEEKLY_MISSIONS;
    const mission = findMission(list, id);
    if (!mission) return;
    const claimed = kind === "daily" ? social.missions.claimedDaily : social.missions.claimedWeekly;
    if (claimed.includes(id)) {
      pushToast("Already claimed — nice.", "info");
      return;
    }
    setSocial((prev) => {
      const key = kind === "daily" ? "claimedDaily" : "claimedWeekly";
      if (prev.missions[key].includes(id)) return prev;
      return { ...prev, missions: { ...prev.missions, [key]: [...prev.missions[key], id] } };
    });
    if (mission.coins > 0) addCoins(mission.coins, `Mission reward · ${mission.label}`, "reward");
    grantXp("mission", Math.round(mission.xp / 2));
    addNotification({
      type: "reward",
      title: `${mission.emoji} ${mission.label} complete`,
      body: `+${mission.xp} xp${mission.coins ? ` · +${mission.coins.toLocaleString()} demo coins` : ""}${mission.reward ? ` · ${mission.reward}` : ""}. Virtual rewards only.`,
      link: "/missions",
    });
    pushToast(`${mission.emoji} Mission reward claimed — demo only.`, "ok");
  }, [addCoins, addNotification, grantXp, pushToast, social.missions.claimedDaily, social.missions.claimedWeekly]);

  /* ----------------------------------- VIP ---------------------------------- */

  const activateVip = useCallback<SocialCtx["activateVip"]>((plan: VipPlan) => {
    setSocial((prev) => ({ ...prev, vip: { plan, since: Date.now() } }));
    grantXp("vip");
    pushToast(`${plan.toUpperCase()} enabled on this device — premium purchase will be available in a future version.`, "info");
  }, [grantXp, pushToast]);

  const cancelVip = useCallback(() => {
    setSocial((prev) => ({ ...prev, vip: { plan: null, since: 0 } }));
    updateMe({ frame: "pulse", theme: "violet" });
    pushToast("VIP demo status cleared.", "info");
  }, [pushToast, updateMe]);

  /* ---------------------------- Privacy / role / admin ---------------------------- */

  const setPrivacy = useCallback<SocialCtx["setPrivacy"]>((patch) => {
    setSocial((prev) => ({ ...prev, privacy: { ...prev.privacy, ...patch } }));
  }, []);

  const setRole = useCallback<SocialCtx["setRole"]>((role) => {
    setSocial((prev) => ({ ...prev, role }));
    pushToast(role === "admin" ? "Demo admin access enabled." : "Switched back to member view.", "info");
  }, [pushToast]);

  const adminToggle = useCallback<SocialCtx["adminToggle"]>((action, id) => {
    const user = userById(id);
    setSocial((prev) => {
      const admin = { ...prev.admin };
      if (action === "suspend") admin.suspended = Array.from(new Set([...admin.suspended, id]));
      if (action === "suspend") admin.banned = admin.banned.filter((b) => b !== id);
      if (action === "ban") { admin.banned = Array.from(new Set([...admin.banned, id])); admin.suspended = admin.suspended.filter((s) => s !== id); }
      if (action === "restore") { admin.banned = admin.banned.filter((b) => b !== id); admin.suspended = admin.suspended.filter((s) => s !== id); }
      return { ...prev, admin };
    });
    const verb = action === "suspend" ? "suspended" : action === "ban" ? "banned" : "restored";
    pushToast(`@${user?.username ?? "member"} ${verb} (demo only).`, action === "restore" ? "ok" : "info");
  }, [pushToast, userById]);

  const reviewReport = useCallback((id: string) => {
    setSocial((prev) => ({ ...prev, admin: { ...prev.admin, reviewed: Array.from(new Set([...prev.admin.reviewed, id])) } }));
    pushToast("Report marked reviewed.", "ok");
  }, [pushToast]);

  const removeContent = useCallback<SocialCtx["removeContent"]>((kind, id) => {
    setSocial((prev) => ({
      ...prev,
      posts: kind === "post" ? prev.posts.filter((p) => p.id !== id) : prev.posts,
      videos: kind === "video" ? prev.videos.filter((v) => v.id !== id) : prev.videos,
      admin: { ...prev.admin, removedContent: [...prev.admin.removedContent, `${kind}:${id}`] },
    }));
    pushToast("Content removed from the feed (demo).", "info");
  }, [pushToast]);

  const announce = useCallback((text: string) => {
    if (text.trim().length < 4) return;
    setSocial((prev) => ({
      ...prev,
      admin: { ...prev.admin, announcements: [{ id: uid("an"), text: text.trim(), at: Date.now(), by: "admin" }, ...prev.admin.announcements] },
    }));
    addNotification({ type: "system", title: "Community announcement", body: text.trim(), link: "/safety" });
    pushToast("Announcement sent to the community feed.", "ok");
  }, [addNotification, pushToast]);

  const value: SocialCtx = {
    social,
    ctx,
    ready,
    createPost,
    deletePost,
    toggleLikePost,
    toggleSavePost,
    commentPost,
    toggleCommentLike,
    sharePost,
    createVideo,
    deleteVideo,
    toggleLikeVideo,
    toggleSaveVideo,
    commentVideo,
    shareVideo,
    registerView,
    addStory,
    deleteStory,
    toggleLikeStory,
    viewStory,
    friendState,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    createGroup,
    updateGroup,
    deleteGroup,
    leaveGroup,
    addGroupMembers,
    removeGroupMember,
    toggleGroupAdmin,
    sendGroupMessage,
    deleteGroupMessage,
    toggleReaction,
    groupUnread,
    markGroupRead,
    bumpMission,
    claimMission,
    touchStreak,
    activateVip,
    cancelVip,
    setPrivacy,
    setRole,
    adminToggle,
    reviewReport,
    removeContent,
    announce,
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

/** Used by Settings → Danger zone so a reset clears v2 collections too. */
export function clearSocialStorage(): void {
  removeKey(KEYS.social);
  removeKey("vibetalk.groupread.v1");
}
