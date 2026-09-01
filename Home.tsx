import {
  ArrowRight,
  Bell,
  Coins,
  Gamepad2,
  Gift,
  Headphones,
  Heart,
  Mic,
  Radio,
  Search,
  Play,
  Sparkles,
  Star,
  Target,
  TriangleAlert,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCard } from "../components/UserCard";
import { CheckInPanel } from "../components/Rewards";
import { LevelCard } from "../components/badges";
import { EventsStrip, PopularGamesRail, RecommendedForYou, RisingStarsRail, TrendingRooms } from "../components/discover";
import { Avatar, Button, Card, Chip, CoinPill, EmptyState, Equalizer, LiveDot, Progress, RevealGroup, SectionHeader, Skeleton } from "../components/ui";
import { useStore } from "../store/StoreProvider";
import { useSocial } from "../store/SocialProvider";
import { StoriesRail } from "../components/Stories";
import { PostCard } from "../components/PostCard";
import { ClipArt } from "../components/art";
import { missionProgress, trendingPosts, trendingVideos } from "../lib/engine";
import { trendingRooms } from "../lib/social";
import { categoryMeta } from "../lib/social";
import { cn } from "../utils/cn";
import { compact, levelFromXp, timeAgo } from "../lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const { me, db, visibleUsers, currentRoomId, canCheckIn, canSpin, checkinStreak, checkinDay } = useStore();
  const { social } = useSocial();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 340);
    return () => window.clearTimeout(t);
  }, []);

  const featured = useMemo(() => trendingRooms(db, 1)[0], [db]);
  const online = useMemo(() => visibleUsers.filter((u) => u.online), [visibleUsers]);
  const unreadNotifs = db.notifications.filter((n) => !n.read).length;
  const totalListeners = db.rooms.reduce((s, r) => s + r.listeners, 0);
  const curve = me ? levelFromXp(me.xp) : null;
  const favOnline = db.favorites.users.map((id) => db.users.find((u) => u.id === id)).filter((u) => u?.online).length;

  if (loading) {
    return (
      <div className="space-y-7">
        <Skeleton className="h-[210px] rounded-[28px]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-64 !rounded-[28px]" />
          <Skeleton className="h-64 !rounded-[28px]" />
        </div>
        <Skeleton className="h-44 !rounded-[28px]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-40 !rounded-3xl" />
          <Skeleton className="h-40 !rounded-3xl" />
          <Skeleton className="h-40 !rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ------------------------------- Live console ------------------------------- */}
      <section className="animate-rise grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="grain relative overflow-hidden rounded-[28px] border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <div className="vibe-gradient pointer-events-none absolute -right-24 -top-28 size-72 rounded-full opacity-30 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blush-400/50 to-transparent" />

          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              <Sparkles className="size-3 text-blush-300" /> {greeting()}, @{me?.username}
            </span>
            <div className="flex items-center gap-2">
              <Link to="/notifications" className="relative">
                <span className="tap grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/12 hover:text-white">
                  <Bell className="size-4.5" />
                </span>
                {unreadNotifs > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-blush-500 text-[10px] font-black">{unreadNotifs}</span>
                )}
              </Link>
              <CoinPill amount={me?.coins ?? 0} />
            </div>
          </div>

          <h1 className="relative mt-3 font-display text-[30px] font-extrabold leading-[1.04] tracking-tight sm:text-[40px]">
            {db.rooms.filter((r) => r.live).length} rooms are warm,
            <br className="hidden sm:block" /> <span className="vibe-text-gradient">{compact(totalListeners)} people are listening.</span>
          </h1>
          <p className="relative mt-2.5 max-w-lg text-sm leading-relaxed text-white/55">
            {online.length} members you could click with are online · {favOnline > 0 ? `${favOnline} of your favourites right now` : "no favourites online yet"}.
          </p>

          {/* search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
            }}
            className="relative mt-5"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, rooms, games or events…"
              className="w-full rounded-2xl border border-white/12 bg-ink-950/60 py-3.5 pl-12 pr-28 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70 focus:ring-4 focus:ring-vibe-500/15"
            />
            <Button size="sm" type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 !px-4 !py-2">
              Search
            </Button>
          </form>

          <div className="no-scrollbar relative mt-3.5 flex gap-2 overflow-x-auto pb-0.5">
            {[
              { label: "Go live", icon: Mic, to: "/rooms?create=1", tone: "vibe-gradient text-white" },
              { label: "Browse rooms", icon: Radio, to: "/rooms", tone: "bg-white/8 text-white/80" },
              { label: "Rejoin room", icon: Headphones, to: currentRoomId ? `/rooms/${currentRoomId}` : "/rooms", tone: "bg-white/8 text-white/80" },
              { label: "Games", icon: Gamepad2, to: "/games", tone: "bg-white/8 text-white/80" },
              { label: "Send gift", icon: Gift, to: "/gifts", tone: "bg-white/8 text-white/80" },
              { label: "Favourites", icon: Star, to: "/favorites", tone: "bg-white/8 text-white/80" },
              { label: "Top up", icon: Coins, to: "/coins", tone: "bg-coin-500/18 text-coin-400" },
            ].map((q) => (
              <Link key={q.label} to={q.to} className={cn("tap inline-flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition hover:brightness-125", q.tone)}>
                <q.icon className="size-4" /> {q.label}
              </Link>
            ))}
          </div>
        </div>

        {/* daily duo */}
        <div className="space-y-4">
          {canCheckIn || canSpin ? (
            <Card className="relative flex items-center gap-3 overflow-hidden !rounded-[28px] border-coin-400/30 bg-coin-500/[0.07] p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-coin-500/20 text-coin-400">
                <Zap className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{canCheckIn ? "Daily rewards are ready" : "Streak going 🔥"}</p>
                <p className="text-[11px] text-white/50">
                  {canCheckIn ? `Day ${checkinDay} on the calendar${canSpin ? " + a free spin" : ""} waiting.` : `Claimed today · ${checkinStreak} day streak`}
                </p>
              </div>
              <Link to="/rewards">
                <Button size="sm">Claim</Button>
              </Link>
            </Card>
          ) : (
            <Card className="flex items-center gap-3 !rounded-[28px] p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint-400/15 text-mint-400">
                <Trophy className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">Dailies done ✅</p>
                <p className="text-[11px] text-white/50">{checkinStreak} day streak · next reward tomorrow at midnight</p>
              </div>
              <Link to="/leaderboard" className="shrink-0">
                <Button size="sm" variant="outline">Ranks</Button>
              </Link>
            </Card>
          )}
          {curve && me && (
            <Card className="!rounded-[28px] p-4">
              <div className="flex items-center gap-3">
                <Avatar user={me} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center justify-between text-xs font-bold">
                    <span>Level {curve.level}</span>
                    <span className="text-white/45">{curve.into}/{curve.need} xp</span>
                  </p>
                  <Progress value={curve.pct} className="mt-2" />
                  <p className="mt-1.5 text-[11px] text-white/45">
                    {me.achievements.length} badge{me.achievements.length === 1 ? "" : "s"} · {db.follows.length} follows · {db.favorites.users.length} favourites
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* ------------------------------ Admin notice ------------------------------- */}
      {(() => {
        const note = social.admin.announcements[0];
        if (!note || Date.now() - note.at > 48 * 3_600_000) return null;
        return (
          <Card className="flex flex-wrap items-center gap-3 !rounded-3xl border-vibe-400/25 bg-vibe-600/[0.09] p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-vibe-500/25 text-vibe-200 ring-1 ring-vibe-400/30">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-[200px] flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-vibe-200">Community notice</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/70">{note.text}</p>
            </div>
            <Link to="/safety"><Button size="sm" variant="outline">Safety center</Button></Link>
          </Card>
        );
      })()}

      {/* --------------------------------- Stories --------------------------------- */}
      <section>
        <SectionHeader
          title="Stories"
          subtitle="24-hour moments from hosts, friends and people you follow"
          icon={<Heart className="size-4.5 text-blush-300" />}
          action={
            <Link to="/discover" className="inline-flex items-center gap-1 text-xs font-bold text-vibe-200 hover:text-white">
              Discover <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <StoriesRail />
      </section>

      {/* --------------------------- Moments + reel previews -------------------------- */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <SectionHeader title="Fresh moments" subtitle="Latest from the community feed" icon={<Zap className="size-4.5 text-coin-400" />} action={<Link to="/posts" className="text-xs font-bold text-vibe-200 hover:text-white">All posts <ArrowRight className="inline size-3" /></Link>} />
          {trendingPosts({ core: db, social, me }, 2).map(({ post }) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="space-y-3">
          <SectionHeader title="Trending reels" subtitle="Vertical demo clips" icon={<Play className="size-4.5 text-sky-200" />} action={<Link to="/reels" className="text-xs font-bold text-vibe-200 hover:text-white">Open reels <ArrowRight className="inline size-3" /></Link>} />
          <div className="grid grid-cols-2 gap-2.5">
            {trendingVideos({ core: db, social, me }, 4).map(({ video }) => (
              <Link key={video.id} to={`/reels?start=${video.id}`} className="tap group relative block aspect-[9/14] overflow-hidden rounded-3xl border border-white/10">
                <ClipArt tone={video.tone} shape={video.shape} seed={video.authorId} className="absolute inset-0 size-full" />
                <span className="absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/90 to-transparent p-2.5">
                  <span className="block truncate text-[11.5px] font-bold leading-snug">{video.title}</span>
                  <span className="block text-[10px] text-white/55">{compact(video.views)} views</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- Mission strip ------------------------------ */}
      {(() => {
        const m = missionProgress({ core: db, social, me });
        const claimable = [...m.daily, ...m.weekly].filter((r) => r.done && !r.claimed).length;
        return (
          <Card className="flex flex-wrap items-center gap-4 !rounded-[28px] p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-vibe-600/25 text-vibe-200 ring-1 ring-vibe-400/30">
              <Target className="size-5" />
            </span>
            <div className="min-w-[200px] flex-1">
              <p className="text-sm font-extrabold">
                Daily missions {m.dailyDone}/{m.daily.length} · weekly {m.weeklyDone}/{m.weekly.length}
              </p>
              <div className="mt-2 flex gap-1.5">
                {m.daily.map((r) => (
                  <span key={r.mission.id} title={r.mission.label} className={cn("h-1.5 flex-1 rounded-full", r.done ? "vibe-gradient" : "bg-white/8")} />
                ))}
              </div>
            </div>
            <Link to="/missions">
              <Button size="sm" variant={claimable > 0 ? "primary" : "outline"}>
                {claimable > 0 ? `Claim ${claimable} reward${claimable === 1 ? "" : "s"}` : "Open missions"}
              </Button>
            </Link>
            <Link to="/assistant">
              <Button size="sm" variant="ghost" icon={<Sparkles className="size-3.5" />}>Assistant</Button>
            </Link>
          </Card>
        );
      })()}

      {/* ------------------------------ Daily check-in ----------------------------- */}
      <section>
        <SectionHeader title="Daily check-in" subtitle="7-day reward calendar · virtual coins only" icon={<Trophy className="size-4.5 text-coin-400" />} action={<Link to="/rewards" className="inline-flex items-center gap-1 text-xs font-bold text-vibe-200 hover:text-white">Rewards & spin <ArrowRight className="size-3.5" /></Link>} />
        <CheckInPanel compactMode />
      </section>

      {/* -------------------------------- Trending --------------------------------- */}
      <section className="space-y-3.5">
        <SectionHeader
          title="Trending voice rooms"
          subtitle="Ranked by seats filled, chat heat and listeners · demo audio"
          icon={<Sparkles className="size-4.5 text-blush-400" />}
          action={
            <Link to="/rooms" className="inline-flex items-center gap-1 text-xs font-bold text-vibe-200 hover:text-white">
              All rooms <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {featured ? (
            <Link
              to={`/rooms/${featured.room.id}`}
              className="tap group relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-[28px] border border-white/10 p-5 sm:min-h-[260px]"
              style={{ backgroundImage: "linear-gradient(150deg, rgba(124,58,237,.6), rgba(236,72,153,.45))" }}
            >
              <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(120deg,transparent_0_18px,rgba(255,255,255,.18)_18px_19px)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <LiveDot />
                  <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/75">
                    #1 · {categoryMeta(featured.room.category).key}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/85">
                    <Headphones className="size-3" /> {featured.room.listeners}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[26px] font-extrabold leading-tight sm:text-[32px]">{featured.room.title}</h3>
                <p className="mt-2 line-clamp-2 max-w-lg text-sm text-white/70">{featured.reason}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-2.5">
                      {featured.room.speakerIds.slice(0, 4).map((id) => {
                        const u = db.users.find((x) => x.id === id);
                        return u ? <Avatar key={id} user={u} size={30} className="ring-2 ring-ink-950" showFrame={false} /> : null;
                      })}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold">Hosted by @{db.users.find((u) => u.id === featured.room.hostId)?.username ?? "you"}</p>
                      <p className="text-white/50">heat {featured.score} · started {timeAgo(featured.room.createdAt)} ago</p>
                    </div>
                  </div>
                  <span className="vibe-gradient flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-white transition group-hover:scale-105">
                    Join now <Equalizer bars={3} className="h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <EmptyState icon={<Radio className="size-6" />} title="No rooms are live" body="Create the first room and it lands here instantly." action={<Button onClick={() => navigate("/rooms?create=1")}>Create a room</Button>} />
          )}
          <TrendingRooms limit={4} />
        </div>
      </section>

      {/* ------------------------------ Online friends ----------------------------- */}
      <section>
        <SectionHeader
          title="Online friends"
          subtitle={`${online.length} members ready to talk`}
          icon={<span className="relative flex size-2.5"><span className="absolute inset-0 animate-ping rounded-full bg-mint-400/70" /><span className="relative size-2.5 rounded-full bg-mint-400" /></span>}
          action={<Link to="/favorites" className="inline-flex items-center gap-1 text-xs font-bold text-vibe-200 hover:text-white"><Heart className="size-3.5" /> Favourites</Link>}
        />
        {online.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title="Everyone's offline" body="Presence is simulated and refreshes every few seconds — go start a room and they'll come back." />
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {online.map((u) => (
              <Link key={u.id} to={`/u/${u.id}`} className="tap group flex w-[108px] shrink-0 flex-col items-center gap-2 rounded-3xl border border-white/8 bg-white/[0.03] p-3 transition hover:-translate-y-1 hover:border-vibe-400/40">
                <Avatar user={u} size={56} showStatus />
                <p className="w-full truncate text-center text-[11px] font-bold">@{u.username}</p>
                <p className="w-full truncate text-center text-[10px] text-white/40">{db.rooms.find((r) => r.hostId === u.id && r.live) ? "hosting now" : u.country}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --------------------------- Recommended for you ---------------------------- */}
      <section className="space-y-3.5">
        <SectionHeader title="Recommended for you" subtitle="Language, country, interests and room activity — computed locally" icon={<Sparkles className="size-4.5 text-vibe-200" />} />
        <RecommendedForYou />
      </section>

      {/* -------------------------------- Level & badges ------------------------------ */}
      {me && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <LevelCard user={me} />
          <Card className="!rounded-[28px] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Rising stars</p>
            <p className="mt-1 text-xs text-white/45">Fastest climbers around you this week</p>
            <div className="mt-3">
              <RisingStarsRail limit={3} />
            </div>
          </Card>
        </section>
      )}

      {/* ---------------------------------- Events ---------------------------------- */}
      <section className="space-y-3.5">
        <SectionHeader
          title="Upcoming events"
          subtitle="Hosted by the community · demo calendar"
          icon={<Mic className="size-4.5 text-mint-400" />}
          action={<Link to="/events" className="inline-flex items-center gap-1 text-xs font-bold text-vibe-200 hover:text-white">All events <ArrowRight className="size-3.5" /></Link>}
        />
        <EventsStrip limit={3} />
      </section>

      {/* -------------------------------- Popular games ------------------------------ */}
      <section className="space-y-3.5">
        <SectionHeader title="Popular games" subtitle="Demo points only — no wagering, no cash" icon={<Gamepad2 className="size-4.5 text-coin-400" />} />
        <PopularGamesRail />
      </section>

      {/* ------------------------------- Popular people ----------------------------- */}
      <section>
        <SectionHeader title="Popular on VibeTalk" subtitle="Most-followed members on this device" icon={<Zap className="size-4.5 text-coin-400" />} />
        <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...visibleUsers]
            .sort((a, b) => b.followers - a.followers)
            .slice(0, 4)
            .map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
        </RevealGroup>
      </section>

      {/* ---------------------------------- Strips ---------------------------------- */}
      <section className="grid gap-3.5 lg:grid-cols-3">
        <Card className="flex items-center gap-4 !rounded-3xl p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-coin-500/18 text-coin-400 ring-1 ring-coin-400/25">
            <Coins className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{(me?.coins ?? 0).toLocaleString()} Vibe Coins</p>
            <p className="text-xs text-white/45">Demo economy · no real payments</p>
          </div>
          <Link to="/coins"><Button size="sm" variant="coin">Top up</Button></Link>
        </Card>

        <Card className="flex items-center gap-4 !rounded-3xl p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blush-500/18 text-blush-300 ring-1 ring-blush-400/25">
            <Gift className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Gift someone tonight</p>
            <p className="text-xs text-white/45">{db.giftLog.length} gifts in the local ledger</p>
          </div>
          <Link to="/gifts"><Button size="sm" variant="outline">Gift shop</Button></Link>
        </Card>

        <Card className="flex items-center gap-4 !rounded-3xl border-amber-400/20 bg-amber-400/[0.06] p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25">
            <TriangleAlert className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">18+ and respectful</p>
            <p className="text-xs text-white/45">Report or block anyone in two taps</p>
          </div>
          <Link to="/safety"><Button size="sm" variant="outline">Guidelines</Button></Link>
        </Card>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">Jump to</span>
        <Chip onClick={() => navigate("/leaderboard")}>Leaderboard</Chip>
        <Chip onClick={() => navigate("/rewards")}>Daily rewards</Chip>
        <Chip onClick={() => navigate("/favorites")}>Favourites</Chip>
        <Chip onClick={() => navigate("/events")}>Events</Chip>
        <Chip onClick={() => navigate("/settings")}>Settings</Chip>
      </div>
    </div>
  );
}
