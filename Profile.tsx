import {
  Ban,
  BadgeCheck,
  CalendarDays,
  Clock,
  Coins,
  Crown,
  Film,
  Flag,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  MessageCircle,
  MessageSquare,
  Mic,
  Palette,
  Pencil,
  Play,
  Plus,
  Settings,
  Share2,
  Sparkles,
  Star,
  UserPlus,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSocial } from "../store/SocialProvider";
import { GiftSheet } from "../components/GiftSheet";
import { FriendActions } from "../components/friends";
import { ReportDialog } from "../components/ReportDialog";
import { RoomCard } from "../components/RoomCard";
import { BadgeGrid, LevelCard } from "../components/badges";
import { PostCard } from "../components/PostCard";
import { ClipArt } from "../components/art";
import { AddStorySheet, StoryViewer, timeLeft, useStoryMediaUrl } from "../components/Stories";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  LevelBadge,
  Modal,
  SectionHeader,
  Select,
  Spinner,
  Textarea,
} from "../components/ui";
import { COUNTRIES, INTERESTS, LANGUAGES } from "../lib/data";
import { FRAMES, THEMES, frameById, frameUnlocked, levelTitle, themeById } from "../lib/progression";
import { useStore } from "../store/StoreProvider";
import type { Story, User } from "../lib/types";
import { cn } from "../utils/cn";
import { ageFromDob, compact, levelFromXp, timeAgo, xpForLevel } from "../lib/utils";

export function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me, db, userById, myFollows, toggleFollow, updateMe, addNotification, pushToast, isFavoriteUser, toggleFavoriteUser } = useStore();
  const { social } = useSocial();
  const [tab, setTab] = useState<"about" | "posts" | "reels" | "stories" | "rooms" | "badges" | "gifts" | "games">("about");
  const [editing, setEditing] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addStoryOpen, setAddStoryOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);

  const profile = id ? userById(id) : me;
  const isMe = !!profile && profile.id === me?.id;

  const roomsOf = useMemo(
    () => (profile ? db.rooms.filter((r) => r.hostId === profile.id || r.speakerIds.includes(profile.id)) : []),
    [db.rooms, profile],
  );
  const postsOf = useMemo(
    () => (profile ? social.posts.filter((p) => p.authorId === profile.id) : []),
    [profile, social.posts],
  );
  const reelsOf = useMemo(
    () => (profile ? social.videos.filter((v) => v.authorId === profile.id) : []),
    [profile, social.videos],
  );
  const storiesOf = useMemo(
    () => (profile ? social.stories.filter((s) => s.authorId === profile.id && s.expiresAt > Date.now()) : []),
    [profile, social.stories],
  );
  const hostedRooms = useMemo(() => (me ? db.rooms.filter((r) => r.hostId === me.id) : []), [db.rooms, me]);
  const points = db.scores.reduce((s, x) => s + x.points, 0);
  const giftsForMe = profile ? db.giftLog.filter((g) => g.toId === profile.id) : [];

  if (!profile) {
    return (
      <EmptyState
        icon={<Users className="size-6" />}
        title="Profile not found"
        body="This member isn't in your local demo data — they may have been removed by a data reset."
        action={<Button onClick={() => navigate("/", { replace: true })}>Back to home</Button>}
      />
    );
  }

  const following = myFollows.includes(profile.id);
  const blocked = db.blocked.includes(profile.id);
  const age = ageFromDob(profile.dob);
  const theme = themeById(profile.theme);
  const curve = levelFromXp(profile.xp);
  const fav = isFavoriteUser(profile.id);
  const received = giftsForMe.length;

  return (
    <div className="space-y-5">
      {/* ---------------------------------- Header --------------------------------- */}
      <Card className="relative overflow-hidden !rounded-[30px] p-0">
        <div className="relative h-36 sm:h-44" style={{ backgroundImage: theme.cover }}>
          <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(122deg,transparent_0_20px,rgba(0,0,0,.35)_20px_21px)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/45 to-transparent" />
          <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
            {profile.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-sky-200">
                <BadgeCheck className="size-3" /> verified
              </span>
            )}
            {curve.level >= 25 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-coin-400">
                <Crown className="size-3" /> top voice
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white/75">
              <Sparkles className="size-3 text-vibe-200" /> {theme.name}
            </span>
            {isMe && (
              <button
                onClick={() => setLookOpen(true)}
                className="tap inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-black/75 backdrop-blur"
              >
                <Palette className="size-3 text-vibe-300" /> Edit Cover &amp; Look
              </button>
            )}
          </div>
        </div>

        <div className="relative -mt-14 px-5 pb-5 sm:-mt-16 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative rounded-full bg-ink-900 p-1.5">
                <Avatar user={profile} size={98} showStatus={!isMe || social.privacy.showOnline} />
                {!isMe && (
                  <button
                    onClick={() => toggleFavoriteUser(profile.id)}
                    aria-label={fav ? "Remove from favourites" : "Add to favourites"}
                    title={fav ? "Remove from favourites" : "Add to favourites"}
                    className={cn(
                      "tap absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border text-[11px] transition",
                      fav
                        ? "border-coin-400/60 bg-coin-400 text-ink-950"
                        : "border-white/15 bg-ink-900/90 text-white/55 hover:text-white",
                    )}
                  >
                    <Star className={cn("size-3.5", fav && "fill-current")} />
                  </button>
                )}
              </div>
              <div className="pb-1">
                <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  @{profile.username}
                  {fav && <Star className="size-4 fill-coin-400 text-coin-400" />}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                  <LevelBadge level={curve.level} />
                  <span className="font-bold text-vibe-200">{levelTitle(curve.level)}</span>
                  <span className={cn("inline-flex items-center gap-1", isMe && !social.privacy.showOnline ? "text-white/35" : profile.online ? "text-mint-400" : "text-white/40")}>
                    <span className={cn("size-1.5 rounded-full", isMe && !social.privacy.showOnline ? "bg-white/25" : profile.online ? "bg-mint-400" : "bg-white/40")} />
                    {isMe && !social.privacy.showOnline ? "Status hidden (Privacy Center)" : profile.online ? "Online now" : "Offline"}
                  </span>
                  <span>· {profile.country}</span>
                  <span>· joined {timeAgo(profile.joinedAt)} ago</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isMe ? (
                <>
                  <Button size="sm" variant="soft" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(true)}>Edit profile</Button>
                  <Button size="sm" variant="outline" icon={<Palette className="size-3.5" />} onClick={() => setLookOpen(true)}>Look & badges</Button>
                  <Link to="/coins"><Button size="sm" variant="coin" icon={<Coins className="size-3.5" />}>{compact(profile.coins)} coins</Button></Link>
                  <Link to="/settings">
                    <Button size="sm" variant="ghost" aria-label="Settings" className="!px-3" icon={<Settings className="size-4" />} />
                  </Link>
                </>
              ) : (
                <>
                  <FriendActions userId={profile.id} size="sm" withMessage={false} />
                  <Button
                    size="sm"
                    variant={following ? "soft" : "primary"}
                    icon={following ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
                    onClick={() => toggleFollow(profile.id)}
                    disabled={blocked}
                  >
                    {following ? "Following" : "Follow"}
                  </Button>
                  <Link to={`/messages?with=${profile.id}`}>
                    <Button size="sm" variant="outline" icon={<MessageCircle className="size-3.5" />}>Message</Button>
                  </Link>
                  <Button size="sm" variant="soft" icon={<Gift className="size-3.5" />} onClick={() => setGiftOpen(true)}>Send gift</Button>
                  <Button size="sm" variant="soft" icon={<Mic className="size-3.5" />} onClick={() => setInviteOpen(true)}>Invite to room</Button>
                  <IconButton label={fav ? "Remove favourite" : "Add favourite"} onClick={() => toggleFavoriteUser(profile.id)} tone={fav ? "fav" : "plain"} icon={<Heart className="size-4" />} />
                  <IconButton label="Report or block" onClick={() => setReportOpen(true)} tone="plain" icon={<Flag className="size-4" />} />
                </>
              )}
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{profile.bio}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <Chip key={i} className="pointer-events-none">{i}</Chip>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {[
              { label: "Followers", value: compact(profile.followers) },
              { label: "Following", value: compact(profile.following) },
              { label: "Rooms", value: String(roomsOf.length) },
              { label: "Sparkles", value: compact(profile.sparkles) },
              { label: isMe ? "Game points" : "Gifts sent", value: isMe ? compact(points) : String(received) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                <p className="font-display text-lg font-extrabold leading-none">{s.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {isMe && <LevelCard user={profile} />}

      {/* ----------------------------------- Tabs ---------------------------------- */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
        {([
          ["about", "About", Sparkles],
          ["posts", `Posts (${postsOf.length})`, MessageSquare],
          ["reels", `Reels (${reelsOf.length})`, Film],
          ["stories", `Stories (${storiesOf.length})`, Clock],
          ["rooms", `Rooms (${roomsOf.length})`, Mic],
          ["badges", `Badges (${profile.achievements.length})`, Star],
          ["gifts", "Gifts", Gift],
          ...(isMe ? [["games", "Games", Gamepad2] as const] : []),
        ] as [typeof tab, string, typeof Sparkles][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "tap flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition",
              tab === key ? "vibe-gradient text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "about" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="!rounded-3xl p-5">
            <h2 className="font-display text-base font-extrabold">Member details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Country", profile.country],
                ["Language", profile.language],
                ["Gender", profile.gender === "undisclosed" ? "Private" : profile.gender.replace("-", " ")],
                ["Age", age ? `${age} (18+ confirmed at signup)` : "Not shared"],
                ["Email", isMe ? profile.email : "Hidden for privacy"],
                ["Wallet", `${profile.coins.toLocaleString()} Vibe Coins`],
                ["Total xp", `${curve.total.toLocaleString()} · ${xpForLevel(curve.level)} per level`],
                ["Frame", frameById(profile.frame).name],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 border-b border-white/6 pb-2.5 last:border-0">
                  <dt className="text-[11px] uppercase tracking-widest text-white/35">{k}</dt>
                  <dd className="truncate text-right text-[13px] font-semibold capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="space-y-4">
            <Card className="!rounded-3xl p-5">
              <h2 className="font-display text-base font-extrabold">Recent activity</h2>
              <div className="mt-3 space-y-2">
                {[
                  { icon: Mic, label: `${profile.stats.roomsJoined} rooms joined`, sub: "xp earned from showing up" },
                  { icon: MessageCircle, label: `${profile.stats.roomChats + profile.stats.dms} messages`, sub: "room chat + DMs" },
                  { icon: Gift, label: `${profile.giftsSent} gifts sent`, sub: `${compact(profile.sparkles)} sparkles received` },
                  { icon: Gamepad2, label: `${profile.stats.gamesPlayed} games played`, sub: "demo points only" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                    <span className="grid size-8 place-items-center rounded-xl bg-white/6 text-vibe-200">
                      <row.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{row.label}</p>
                      <p className="truncate text-[11px] text-white/40">{row.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="!rounded-3xl p-5">
              <h2 className="font-display text-base font-extrabold">Safety</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                VibeTalk is 18+. If this member makes you uncomfortable, report or block them — reports stay on this
                device in the MVP and route to moderators in version 2.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!isMe && (
                  <>
                    <Button size="sm" variant="danger" icon={<Flag className="size-3.5" />} onClick={() => setReportOpen(true)}>Report user</Button>
                    <Button size="sm" variant="outline" icon={<Ban className="size-3.5" />} onClick={() => toggleFollow(profile.id)}>
                      {blocked ? "Unblock" : "Block"}
                    </Button>
                  </>
                )}
                <Link to="/safety"><Button size="sm" variant="ghost" icon={<Globe className="size-3.5" />}>Guidelines</Button></Link>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`${window.location.origin}/#/u/${profile.id}`).catch(() => undefined);
                    pushToast("Profile link copied", "ok");
                  }}
                  className="tap inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/8 hover:text-white"
                >
                  <Share2 className="size-3.5" /> Share
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-4">
          <SectionHeader
            title={`${isMe ? "Your" : `@${profile.username}'s`} Posts`}
            subtitle={`${postsOf.length} moment${postsOf.length === 1 ? "" : "s"} shared`}
            icon={<MessageSquare className="size-4.5 text-blush-300" />}
            action={
              isMe ? (
                <Link to="/posts">
                  <Button size="sm" icon={<Pencil className="size-3" />}>New post</Button>
                </Link>
              ) : undefined
            }
          />
          {postsOf.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="size-6" />}
              title="No posts yet"
              body={isMe ? "Share what you're up to, what room you're in or what you're listening to." : `@${profile.username} hasn't published any moments yet.`}
              action={isMe ? <Link to="/posts"><Button>Write a post</Button></Link> : undefined}
            />
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {postsOf.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reels" && (
        <div className="space-y-4">
          <SectionHeader
            title={`${isMe ? "Your" : `@${profile.username}'s`} Reels`}
            subtitle={`${reelsOf.length} short video clip${reelsOf.length === 1 ? "" : "s"}`}
            icon={<Film className="size-4.5 text-sky-200" />}
            action={
              isMe ? (
                <Link to="/reels">
                  <Button size="sm" icon={<Play className="size-3" />}>Open Reels</Button>
                </Link>
              ) : undefined
            }
          />
          {reelsOf.length === 0 ? (
            <EmptyState
              icon={<Film className="size-6" />}
              title="No reels published"
              body={isMe ? "Create a demo clip from the Reels page — rendered locally, no upload needed." : `@${profile.username} hasn't posted any short videos.`}
              action={<Link to="/reels"><Button>Browse Reels</Button></Link>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {reelsOf.map((v) => (
                <Link
                  key={v.id}
                  to={`/reels?start=${v.id}`}
                  className="tap group relative block aspect-[9/14] overflow-hidden rounded-3xl border border-white/10"
                >
                  <ClipArt tone={v.tone} shape={v.shape} seed={v.authorId} className="absolute inset-0 size-full" />
                  <span className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/90 to-transparent p-3">
                    <span className="block truncate text-xs font-bold leading-snug text-white">{v.title}</span>
                    <span className="block text-[10px] text-white/60">{compact(v.views)} views</span>
                  </span>
                  <span className="absolute left-2.5 top-2.5 z-[2] inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-black uppercase text-white backdrop-blur">
                    <Play className="size-2.5 fill-current" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "stories" && (
        <div className="space-y-4">
          <SectionHeader
            title={`${isMe ? "Your" : `@${profile.username}'s`} Stories`}
            subtitle={`${storiesOf.length} active story · expires 24h after posting`}
            icon={<Clock className="size-4.5 text-vibe-200" />}
            action={
              isMe ? (
                <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => setAddStoryOpen(true)}>
                  Add story
                </Button>
              ) : undefined
            }
          />
          {storiesOf.length === 0 ? (
            <EmptyState
              icon={<Clock className="size-6" />}
              title="No active stories"
              body={isMe ? "Share a photo or video story with the community. It will be live for 24 hours." : `@${profile.username} has no active stories right now.`}
              action={
                isMe ? (
                  <Button onClick={() => setAddStoryOpen(true)} icon={<Plus className="size-4" />}>
                    Share a Story
                  </Button>
                ) : (
                  <Link to="/"><Button>Go to Home</Button></Link>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {storiesOf.map((s) => (
                <ProfileStoryCard
                  key={s.id}
                  story={s}
                  onClick={() => setViewingStory(s)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "badges" && (
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Achievements" subtitle="Unlocked by playing, hosting, gifting and showing up daily" icon={<Star className="size-4.5 text-coin-400" />} />
          <BadgeGrid user={profile} />
        </Card>
      )}

      {tab === "rooms" &&
        (roomsOf.length === 0 ? (
          <EmptyState
            icon={<Mic className="size-6" />}
            title={isMe ? "You haven't hosted a room yet" : "No rooms yet"}
            body={isMe ? "Go live for five minutes — the demo rooms need hosts too, and each one earns 40 xp." : `${profile.username} hasn't joined or hosted a room on this device.`}
            action={isMe ? <Link to="/rooms?create=1"><Button>Open a room</Button></Link> : undefined}
          />
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {roomsOf.map((r) => <RoomCard key={r.id} room={r} />)}
          </div>
        ))}

      {tab === "games" && isMe && (
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Game record" subtitle="Demo points only — never cash" icon={<Gamepad2 className="size-4.5 text-vibe-200" />} />
          {db.scores.length === 0 ? (
            <EmptyState icon={<Gamepad2 className="size-6" />} title="No matches played" body="Tic-tac-toe, RPS, memory and dice are a tap away." action={<Link to="/games"><Button>Open games</Button></Link>} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {db.scores.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm">
                  <span className="capitalize text-white/70">{s.game.replace("-", " ")}</span>
                  <span className={cn("text-[11px] font-black uppercase tracking-wider", s.result === "win" ? "text-mint-400" : s.result === "draw" ? "text-white/50" : "text-rose-300")}>
                    {s.result} · +{s.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "gifts" && (
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Gift ledger" subtitle="Virtual gifts, zero cash value" icon={<Gift className="size-4.5 text-blush-300" />} />
          {giftsForMe.length === 0 && db.txns.filter((t) => t.kind.startsWith("gift")).length === 0 ? (
            <EmptyState icon={<Gift className="size-6" />} title="No gifts yet" body="Hearts, roses, crowns and rockets all show up here." action={<Link to="/gifts"><Button>Browse gifts</Button></Link>} />
          ) : (
            <div className="space-y-2">
              {(giftsForMe.length ? giftsForMe : db.txns.filter((t) => t.kind.startsWith("gift")).slice(0, 8)).slice(0, 10).map((g) => {
                const gift = "giftId" in g ? g.giftId : undefined;
                const def = gift ? { emoji: "🎁", name: "Gift" } : null;
                const from = "fromId" in g ? db.users.find((u) => u.id === (g as { fromId: string }).fromId) : null;
                return (
                  <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-blush-500/15 text-lg">{def?.emoji ?? "🎁"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">
                        {"label" in g ? (g as { label: string }).label : `${from ? `@${from.username}` : "Someone"} sent a gift`}
                      </p>
                      <p className="text-[11px] text-white/40">{timeAgo(g.at)} ago</p>
                    </div>
                    {"amount" in g && (
                      <span className="text-sm font-black text-blush-300">{(g as { amount: number }).amount?.toLocaleString()}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* --------------------------------- Modals --------------------------------- */}
      {viewingStory && (
        <StoryViewer
          rings={[{ user: profile, stories: storiesOf, unseen: 0 }]}
          initial={{ user: profile, stories: storiesOf, unseen: 0 }}
          initialStoryId={viewingStory.id}
          onClose={() => setViewingStory(null)}
          onAdd={isMe ? () => setAddStoryOpen(true) : undefined}
        />
      )}

      {isMe && (
        <AddStorySheet
          open={addStoryOpen}
          onClose={() => setAddStoryOpen(false)}
          mine={storiesOf}
        />
      )}

      <EditProfileModal open={editing} onClose={() => setEditing(false)} me={profile} onSave={updateMe} allUsers={db.users} />
      <LookModal open={lookOpen} onClose={() => setLookOpen(false)} me={profile} onSave={updateMe} />
      <GiftSheet open={giftOpen} onClose={() => setGiftOpen(false)} toUser={profile} />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={profile.id} targetLabel={`@${profile.username}`} />

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite to a room" subtitle="Sends a demo notification and a chat ping">
        {hostedRooms.length === 0 ? (
          <EmptyState
            icon={<Mic className="size-6" />}
            title="You have no live room"
            body="Open a room first, then invite anyone from here — hosting a room earns 40 xp."
            action={<Link to="/rooms?create=1"><Button onClick={() => setInviteOpen(false)}>Create room</Button></Link>}
          />
        ) : (
          <div className="space-y-2">
            {hostedRooms.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  addNotification({ type: "room", title: `@${me?.username} invited you to ${r.title}`, body: "A speaker seat is saved for you.", actorId: me?.id, link: `/rooms/${r.id}` });
                  pushToast(`Invite sent to @${profile.username} for “${r.title}”`, "ok");
                  setInviteOpen(false);
                }}
                className="tap flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-left hover:border-vibe-400/50"
              >
                <span className="grid size-10 place-items-center rounded-xl vibe-gradient text-white"><Mic className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{r.title}</span>
                  <span className="block text-[11px] text-white/45">{r.category} · {r.listeners} listening · {r.live ? "live" : "scheduled"}</span>
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70">Invite</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProfileStoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const { url, loading } = useStoryMediaUrl(story);
  const isVid = story.mediaType === "video" || story.kind === "video";
  return (
    <div
      onClick={onClick}
      className="tap relative aspect-[9/14] overflow-hidden rounded-3xl border border-white/10 bg-black cursor-pointer group hover:border-vibe-400/60 shadow-md flex items-center justify-center"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center p-4">
          <Spinner className="size-6 text-vibe-300" />
        </div>
      ) : url ? (
        isVid ? (
          <>
            <video src={url} className="size-full object-cover" muted playsInline />
            <span className="absolute top-2.5 left-2.5 z-10 grid size-6 place-items-center rounded-full bg-black/65 text-white backdrop-blur">
              <Play className="size-3 fill-current" />
            </span>
          </>
        ) : (
          <>
            <img src={url} alt="" className="absolute inset-0 size-full object-cover blur-md opacity-30 scale-105" />
            <img src={url} alt={story.caption || "Story"} className="size-full object-contain relative z-[1]" />
          </>
        )
      ) : (
        <ClipArt tone={story.tone} shape={story.tone} className="absolute inset-0 size-full" />
      )}
      <div className="absolute inset-x-0 bottom-0 z-10 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        {story.sticker && <span className="text-2xl mb-1 block drop-shadow">{story.sticker}</span>}
        <p className="line-clamp-2 text-xs font-bold text-white">{story.caption || "Story"}</p>
        <p className="text-[10px] text-white/50 mt-1">{story.views.length} views · {timeLeft(story.expiresAt)}</p>
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  tone = "plain",
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "plain" | "fav";
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "tap grid size-10 place-items-center rounded-full border transition",
        tone === "fav" ? "border-coin-400/40 bg-coin-500/15 text-coin-400" : "border-white/10 bg-white/5 text-white/60 hover:text-white",
      )}
    >
      {icon}
    </button>
  );
}

/* -------------------------------- Edit profile ------------------------------- */

function EditProfileModal({
  open,
  onClose,
  me,
  onSave,
  allUsers,
}: {
  open: boolean;
  onClose: () => void;
  me: User;
  onSave: (patch: Partial<User>) => void;
  allUsers: User[];
}) {
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [country, setCountry] = useState(me.country);
  const [language, setLanguage] = useState(me.language);
  const [gender, setGender] = useState<User["gender"]>(me.gender);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUsername(me.username);
      setBio(me.bio);
      setCountry(me.country);
      setLanguage(me.language);
      setGender(me.gender);
      setInterests(me.interests);
      setError(null);
    }
  }, [open, me]);

  function save() {
    const clean = username.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24);
    if (clean.length < 3) return setError("Username needs at least 3 characters (letters, numbers, dots).");
    if (allUsers.some((u) => u.id !== me.id && u.username.toLowerCase() === clean)) return setError("That username is already taken on this device.");
    setError(null);
    onSave({ username: clean, bio: bio.trim() || "New here. Say hi 👋", country, language, gender, interests });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Edit profile"
      subtitle="Saved to localStorage · editing your bio earns 35 xp"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <Avatar user={{ ...me, username }} size={46} />
          <div className="min-w-0">
            <p className="text-[11px] text-white/45">Avatar art is generated from your username</p>
            <p className="truncate text-sm font-bold">@{username || me.username}</p>
          </div>
        </div>
        <Field label="Username">
          <Input value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }} maxLength={20} />
        </Field>
        <Field label="Short bio" hint={`${bio.length}/160`}>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} placeholder="Two lines people read before they hop on mic with you." />
        </Field>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Country">
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Language">
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value as User["gender"])}>
            <option value="female">Woman</option>
            <option value="male">Man</option>
            <option value="non-binary">Non-binary</option>
            <option value="undisclosed">Prefer not to say</option>
          </Select>
        </Field>
        <Field label="Interests" hint={`${interests.length}/5`}>
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((i) => (
              <Chip key={i} active={interests.includes(i)} onClick={() => setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= 5 ? prev : [...prev, i]))}>
                {i}
              </Chip>
            ))}
          </div>
        </Field>
        {error && <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-200">{error}</p>}
        <p className="flex items-center gap-2 text-[11px] text-white/35">
          <CalendarDays className="size-3.5" /> Date of birth and email are locked — age is confirmed at signup only.
        </p>
      </div>
    </Modal>
  );
}

/* ------------------------------- Look customizer ------------------------------ */

function LookModal({ open, onClose, me, onSave }: { open: boolean; onClose: () => void; me: User; onSave: (patch: Partial<User>) => void }) {
  const [frame, setFrame] = useState(me.frame);
  const [theme, setTheme] = useState(me.theme);
  const { db } = useStore();
  const preview = { ...me, frame, theme };

  useEffect(() => {
    if (open) {
      setFrame(me.frame);
      setTheme(me.theme);
    }
  }, [open, me]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Profile look"
      subtitle="Frames unlock with levels and badges · saved locally"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave({ frame, theme }); onClose(); }}>Apply look</Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-4 rounded-3xl border border-white/8 p-4" style={{ backgroundImage: themeById(theme).soft }}>
        <Avatar user={preview} size={78} showStatus />
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold">@{me.username}</p>
          <p className="text-xs text-white/55">
            {frameById(frame).name} · {themeById(theme).name}
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            {db.users.length} members can see this on this device
          </p>
        </div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Frames</p>
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {FRAMES.map((f) => {
          const state = frameUnlocked(f, me);
          const active = frame === f.id;
          return (
            <button
              key={f.id}
              disabled={!state.ok}
              onClick={() => setFrame(f.id)}
              className={cn(
                "tap flex items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-45",
                active ? "border-vibe-400/70 bg-vibe-600/20" : "border-white/8 bg-white/[0.03] hover:border-white/25",
              )}
            >
              <span className="relative grid size-11 shrink-0 place-items-center">
                {f.id !== "none" && <span className="absolute inset-0 rounded-full" style={{ backgroundImage: f.ring, boxShadow: f.glow }} />}
                <span className="absolute inset-[3px] rounded-full bg-ink-900" />
                <Sparkles className="relative size-4 text-white/70" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold">{f.name}</span>
                <span className={cn("block truncate text-[10px]", state.ok ? "text-mint-400" : "text-white/40")}>{state.ok ? "Unlocked" : state.why}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Profile theme</p>
      <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "tap relative h-16 overflow-hidden rounded-2xl border-2 text-left transition",
              theme === t.id ? "border-white/70" : "border-transparent opacity-80 hover:opacity-100",
            )}
            style={{ backgroundImage: t.cover }}
          >
            <span className="absolute inset-x-0 bottom-0 bg-ink-950/70 px-2.5 py-1 text-[11px] font-bold">{t.name}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-white/35">
        Frames and themes are decoration only — they never grant moderation powers, and they can't be bought. Level
        and badges unlock them.
      </p>
    </Modal>
  );
}
