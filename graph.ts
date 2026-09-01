import { canonicalInterest } from "./data";
import { friendIds, mutualCount } from "./engine";
import type { Ctx } from "./engine";
import type { User } from "./types";

export type FriendZone = "besties" | "regulars" | "new" | "acquaintances";

export const FRIEND_ZONE_LABEL: Record<FriendZone, string> = {
  besties: "Inner circle",
  regulars: "Regulars",
  new: "New friends",
  acquaintances: "Acquaintances",
};

export const FRIEND_ZONE_HINT: Record<FriendZone, string> = {
  besties: "You talk constantly — rooms, DMs and gifts",
  regulars: "Steady mutual energy",
  new: "Added in the last 7 days",
  acquaintances: "Friends of friends, not much chat yet",
};

function interactionsWith(ctx: Ctx, id: string): number {
  const meId = ctx.me?.id;
  if (!meId) return 0;
  const dms = ctx.core.messages.filter((m) => (m.from === meId && m.to === id) || (m.from === id && m.to === meId)).length;
  const groups = ctx.social.groups.filter((g) => g.memberIds.includes(meId) && g.memberIds.includes(id)).length;
  const gifts = ctx.core.giftLog.filter((g) => (g.fromId === meId && g.toId === id) || (g.fromId === id && g.toId === meId)).length;
  const comments = ctx.social.posts.filter((p) => p.authorId === id).reduce((s, p) => s + p.comments.filter((c) => c.authorId === meId).length, 0);
  const sharedRooms = ctx.core.rooms.filter((r) => r.speakerIds.includes(id) && ctx.social.stories.some((s) => s.authorId === id)).length;
  return dms * 3 + groups * 6 + gifts * 5 + comments * 2 + sharedRooms;
}

export interface Zone {
  key: FriendZone;
  label: string;
  hint: string;
  users: User[];
}

export function friendZones(ctx: Ctx): Zone[] {
  const ids = friendIds(ctx);
  const scored = ids
    .map((id) => ctx.core.users.find((u) => u.id === id))
    .filter(Boolean) as User[];

  const withScore = scored.map((user) => ({ user, score: interactionsWith(ctx, user.id) + (user.online ? 4 : 0) + mutualCount(ctx.me?.id ?? "", user.id, ids) }));
  const now = Date.now();
  const buckets: Record<FriendZone, User[]> = { besties: [], regulars: [], new: [], acquaintances: [] };

  withScore.forEach(({ user, score }) => {
    const recentlyAdded = ctx.social.friends.some((f) => f.state === "accepted" && (f.fromId === user.id || f.toId === user.id) && now - f.at < 7 * 86_400_000);
    if (recentlyAdded) buckets.new.push(user);
    else if (score >= 12) buckets.besties.push(user);
    else if (score >= 5) buckets.regulars.push(user);
    else buckets.acquaintances.push(user);
  });

  return (Object.keys(buckets) as FriendZone[]).map((key) => ({
    key,
    label: FRIEND_ZONE_LABEL[key],
    hint: FRIEND_ZONE_HINT[key],
    users: buckets[key].sort((a, b) => b.followers - a.followers),
  }));
}

export function bestMatchInterests(ctx: Ctx, user: User): string[] {
  const me = ctx.me;
  if (!me) return [];
  const mine = me.interests.map(canonicalInterest);
  return user.interests.map(canonicalInterest).filter((i) => mine.includes(i));
}
