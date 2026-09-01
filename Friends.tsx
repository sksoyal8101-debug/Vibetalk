import { Check, Clock3, Gift, MessageCircle, Mic, Sparkles, Trash2, UserPlus, Users, X, Zap } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, EmptyState, IconButton, Reveal, SectionHeader, Segmented, SkeletonList, StatTile } from "../components/ui";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { friendZones } from "../lib/graph";
import { peopleYouMayKnow } from "../lib/engine";
import { levelTitle } from "../lib/progression";
import { cn } from "../utils/cn";
import { compact, levelFromXp, timeAgo } from "../lib/utils";
import { useState } from "react";
import { GiftSheet } from "../components/GiftSheet";

type Tab = "friends" | "requests" | "suggested" | "zones";

export function Friends() {
  const { db, me, userById, myFollows, toggleFollow } = useStore();
  const { ctx, social, ready, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend, sendFriendRequest } = useSocial();
  const [tab, setTab] = useState<Tab>("friends");
  const [giftFor, setGiftFor] = useState<string | null>(null);

  const ids = useMemo(() => {
    return social.friends
      .filter((f) => f.state === "accepted" && (f.fromId === me?.id || f.toId === me?.id))
      .map((f) => (f.fromId === me?.id ? f.toId : f.fromId));
  }, [me?.id, social.friends]);

  const incoming = social.friends.filter((f) => f.state === "pending" && f.toId === me?.id);
  const outgoing = social.friends.filter((f) => f.state === "pending" && f.fromId === me?.id);
  const suggested = useMemo(() => peopleYouMayKnow(ctx, 10), [ctx]);
  const zones = useMemo(() => friendZones(ctx), [ctx]);
  const friends = ids.map((id) => userById(id)).filter(Boolean) as NonNullable<ReturnType<typeof userById>>[];

  const chatStreak = social.streaks.chat;
  const friendStreak = social.streaks.friend;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="vibe-gradient pointer-events-none absolute -left-16 -top-24 size-60 rounded-full opacity-25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-[220px] flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blush-300/85">Friends</p>
            <h1 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">
              The people you actually
              <span className="vibe-text-gradient"> talk to</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/55">
              Friend links are separate from following — a friend is someone you've accepted. Requests, accepts and
              removals all live in this browser.
            </p>
          </div>
          <div className="grid w-full max-w-[330px] grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Friends" value={friends.length} tone="violet" />
            <StatTile label="Requests" value={incoming.length} tone="pink" />
            <StatTile label="Sent" value={outgoing.length} tone="sky" />
            <StatTile label="Chat streak" value={`${chatStreak}d`} tone="mint" />
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link to="/messages">
            <Button size="sm" variant="outline" icon={<MessageCircle className="size-3.5" />}>Group chats</Button>
          </Link>
          <Link to="/rooms">
            <Button size="sm" variant="soft" icon={<Mic className="size-3.5" />}>Start a room with friends</Button>
          </Link>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/50">
            <Zap className="size-3.5 text-coin-400" /> +30 xp per accepted friend
          </span>
        </div>
      </Card>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: "friends", label: `Friends (${friends.length})`, icon: <Users className="size-3.5" /> },
          { key: "requests", label: `Requests (${incoming.length})`, icon: <Clock3 className="size-3.5" /> },
          { key: "suggested", label: "Suggested", icon: <Sparkles className="size-3.5" /> },
          { key: "zones", label: "Zones", icon: <Zap className="size-3.5" /> },
        ]}
      />

      {!ready && <SkeletonList rows={4} />}

      {ready && tab === "friends" && (
        <section className="space-y-2.5">
          {friends.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No friends yet"
              body="Send a request from Discover or a profile. Once someone accepts, they land here with your chat streak attached."
              action={<Button onClick={() => setTab("suggested")}>See suggestions</Button>}
            />
          ) : (
            friends.map((u, i) => {
              const shared = db.rooms.filter((r) => r.speakerIds.includes(u.id) && r.speakerIds.includes(me?.id ?? "")).length;
              const dms = db.messages.filter((m) => (m.from === me?.id && m.to === u.id) || (m.from === u.id && m.to === me?.id)).length;
              return (
                <Reveal key={u.id} delay={Math.min(i, 8) * 45}>
                  <Card interactive className="flex items-center gap-3 !rounded-3xl p-3.5">
                    <Link to={`/u/${u.id}`}>
                      <Avatar user={u} size={52} showStatus />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <Link to={`/u/${u.id}`} className="truncate text-sm font-extrabold hover:underline">@{u.username}</Link>
                        <span className="rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/50">
                          {levelTitle(levelFromXp(u.xp).level)}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-white/45">
                        {dms} messages · {shared} shared rooms · LV {u.level} · {u.online ? "online now" : "offline"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link to={`/messages?with=${u.id}`}>
                        <Button size="sm" variant="outline" icon={<MessageCircle className="size-3.5" />}>Chat</Button>
                      </Link>
                      <IconButton label="Send gift" onClick={() => setGiftFor(u.id)} className="size-8 text-blush-300">
                        <Gift className="size-4" />
                      </IconButton>
                      {!myFollows.includes(u.id) && (
                        <IconButton label="Follow" onClick={() => toggleFollow(u.id)} className="size-8">
                          <UserPlus className="size-4" />
                        </IconButton>
                      )}
                      <IconButton label="Remove friend" onClick={() => removeFriend(u.id)} className="size-8 text-white/35 hover:text-rose-200">
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </Card>
                </Reveal>
              );
            })
          )}
        </section>
      )}

      {ready && tab === "requests" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <SectionHeader title="Pending requests" subtitle="People who want to add you" icon={<Clock3 className="size-4.5 text-mint-400" />} />
            {incoming.length === 0 ? (
              <EmptyState icon={<Check className="size-6" />} title="Nothing waiting" body="When someone sends a request it appears here with their mutuals and shared rooms." />
            ) : (
              <div className="space-y-2.5">
                {incoming.map((f) => {
                  const u = userById(f.fromId);
                  if (!u) return null;
                  return (
                    <Card key={f.id} className="flex items-center gap-3 !rounded-3xl p-3.5">
                      <Avatar user={u} size={48} showStatus />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">@{u.username}</p>
                        <p className="truncate text-[11px] text-white/45">{u.country} · LV {u.level} · asked {timeAgo(f.at)} ago</p>
                      </div>
                      <Button size="sm" onClick={() => acceptFriendRequest(f.id)} icon={<Check className="size-3.5" />}>Accept</Button>
                      <IconButton label="Decline" onClick={() => rejectFriendRequest(f.id)} className="size-8 text-white/45">
                        <X className="size-4" />
                      </IconButton>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Requests you sent" subtitle="Cancel any time" icon={<UserPlus className="size-4.5 text-vibe-200" />} />
            {outgoing.length === 0 ? (
              <EmptyState icon={<UserPlus className="size-6" />} title="No outgoing requests" body="Find someone in Suggested — mutuals and shared interests are already ranked for you." />
            ) : (
              <div className="space-y-2.5">
                {outgoing.map((f) => {
                  const u = userById(f.toId);
                  if (!u) return null;
                  return (
                    <Card key={f.id} className="flex items-center gap-3 !rounded-3xl p-3.5">
                      <Avatar user={u} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">@{u.username}</p>
                        <p className="truncate text-[11px] text-white/45">sent {timeAgo(f.at)} ago · demo delivery</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => cancelFriendRequest(f.id)}>Cancel</Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {ready && tab === "suggested" && (
        <section className="grid gap-2.5 sm:grid-cols-2">
          {suggested.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState icon={<Sparkles className="size-6" />} title="No suggestions left" body="You're connected to everyone in this demo dataset. Reset the data in Settings to refill the pool." />
            </div>
          ) : (
            suggested.map(({ item: u, reasons, score }) => (
              <Card key={u.id} interactive className="flex items-center gap-3 !rounded-3xl p-3.5">
                <Link to={`/u/${u.id}`}>
                  <Avatar user={u} size={52} showStatus />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">@{u.username}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/50">{reasons.join(" · ") || "new member"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full bg-vibe-600/25 px-2 py-0.5 text-[10px] font-black text-vibe-200">{compact(Math.round(score))} match</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const res = sendFriendRequest(u.id);
                      if (!res.ok) return;
                    }}
                    icon={<UserPlus className="size-3.5" />}
                  >
                    Add
                  </Button>
                </div>
              </Card>
            ))
          )}
        </section>
      )}

      {ready && tab === "zones" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {zones.map((z) => (
            <Card key={z.key} className="!rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-extrabold">{z.label}</p>
                <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] font-black text-white/55">{z.users.length}</span>
              </div>
              <p className="mt-1 text-[11px] text-white/45">{z.hint}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {z.users.length === 0 && <p className="text-[11px] text-white/30">Empty for now.</p>}
                {z.users.map((u) => (
                  <Link key={u.id} to={`/u/${u.id}`} className={cn("tap inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] py-1.5 pl-1.5 pr-3 text-[11px] font-bold hover:border-vibe-400/40")}>
                    <Avatar user={u} size={24} showFrame={false} /> @{u.username}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
          <Card className="!rounded-3xl border-coin-400/25 bg-coin-500/[0.06] p-4 lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Friend interaction streak</p>
            <p className="mt-2 text-sm text-white/70">
              Current streak: <strong className="text-coin-400">{friendStreak} day{friendStreak === 1 ? "" : "s"}</strong>. Chat, gift or react to a friend once a day to keep
              it — streaks are cosmetic and never expire your data.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className={cn("grid size-8 place-items-center rounded-xl text-[11px] font-black", i < friendStreak ? "vibe-gradient text-white" : "bg-white/5 text-white/30")}>
                  {i + 1}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      <GiftSheet open={!!giftFor} onClose={() => setGiftFor(null)} toUser={giftFor ? userById(giftFor) ?? null : null} />
    </div>
  );
}
