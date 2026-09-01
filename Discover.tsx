import {
  ArrowUpRight,
  Clapperboard,
  Dices,
  Flame,
  Gamepad2,
  Heart,
  Mic,
  Play,
  Search,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipArt } from "../components/art";
import { PostCard } from "../components/PostCard";
import { Avatar, Button, Card, EmptyState, Reveal, SectionHeader, Segmented, SkeletonList, StatTile } from "../components/ui";
import { UserCard } from "../components/UserCard";
import { RoomCard } from "../components/RoomCard";
import { FRIEND_ZONE_LABEL, friendZones } from "../lib/graph";
import { becauseYouLike, newUsers, peopleYouMayKnow, risingUsers, roomsYouMayEnjoy, trendingPosts, trendingVideos } from "../lib/engine";
import { popularGames, trendingUsers } from "../lib/social";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { compact, timeAgo } from "../lib/utils";
import { cn } from "../utils/cn";

type Filter = "all" | "people" | "rooms" | "videos" | "posts" | "games";

export function Discover() {
  const { db, me, visibleUsers } = useStore();
  const { ctx, ready } = useSocial();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const filter = (params.get("filter") as Filter) ?? "all";

  const set = (next: Partial<{ q: string; filter: string }>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  const trendingMembers = useMemo(() => trendingUsers(db, me?.id, 6), [db, me?.id]);
  const recRooms = useMemo(() => roomsYouMayEnjoy(ctx, 6), [ctx]);
  const people = useMemo(() => peopleYouMayKnow(ctx, 8), [ctx]);
  const clusters = useMemo(() => becauseYouLike(ctx), [ctx]);
  const posts = useMemo(() => trendingPosts(ctx, 6), [ctx]);
  const clips = useMemo(() => trendingVideos(ctx, 8), [ctx]);
  const stars = useMemo(() => risingUsers(ctx, 6), [ctx]);
  const fresh = useMemo(() => newUsers(ctx, 6), [ctx]);
  const games = useMemo(() => popularGames(db), [db]);
  const zones = useMemo(() => friendZones(ctx), [ctx]);

  const query = q.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!query) return null;
    return {
      users: visibleUsers.filter((u) => `${u.username} ${u.bio} ${u.interests.join(" ")} ${u.country}`.toLowerCase().includes(query)),
      rooms: db.rooms.filter((r) => `${r.title} ${r.topic} ${r.category}`.toLowerCase().includes(query)),
      posts: ctx.social.posts.filter((p) => `${p.text} ${p.hashtag}`.toLowerCase().includes(query)),
      videos: ctx.social.videos.filter((v) => `${v.title} ${v.music} ${v.hashtags.join(" ")}`.toLowerCase().includes(query)),
      games: games.filter((g) => g.name.toLowerCase().includes(query)),
    };
  }, [ctx.social.posts, ctx.social.videos, db.rooms, games, query, visibleUsers]);

  const show = (key: Filter) => filter === "all" || filter === key;

  return (
    <div className="space-y-7">
      {/* search console */}
      <Card className="relative overflow-hidden !rounded-[30px] p-5">
        <div className="vibe-gradient pointer-events-none absolute -right-20 -top-24 size-64 rounded-full opacity-25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[220px] flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blush-300/80">Discover</p>
            <h1 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight sm:text-[36px]">
              Find the rooms, people and clips
              <span className="vibe-text-gradient"> your feed hasn't shown you yet</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              One search across members, rooms, posts, reels, stories, groups and events — scored locally from your
              interests, language, country and activity.
            </p>
          </div>
          <div className="relative grid w-full max-w-[220px] grid-cols-3 gap-2">
            <StatTile label="Live rooms" value={db.rooms.filter((r) => r.live).length} tone="pink" />
            <StatTile label="Online" value={visibleUsers.filter((u) => u.online).length} tone="mint" />
            <StatTile label="Clips" value={ctx.social.videos.length} tone="sky" />
          </div>
        </div>

        <div className="relative mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-white/40" />
            <input
              value={q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search @username, #lofi, “trivia”, “study sprint”…"
              className="w-full rounded-2xl border border-white/12 bg-ink-950/60 py-3.5 pl-12 pr-11 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70 focus:ring-4 focus:ring-vibe-500/15"
            />
            {q && (
              <button onClick={() => set({ q: "" })} aria-label="Clear search" className="tap absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
        <div className="relative mt-3">
          <Segmented
            value={filter}
            onChange={(next) => set({ filter: next })}
            options={[
              { key: "all", label: "All" },
              { key: "people", label: "People", icon: <Users className="size-3.5" /> },
              { key: "rooms", label: "Rooms", icon: <Mic className="size-3.5" /> },
              { key: "videos", label: "Videos", icon: <Clapperboard className="size-3.5" /> },
              { key: "posts", label: "Posts", icon: <Heart className="size-3.5" /> },
              { key: "games", label: "Games", icon: <Gamepad2 className="size-3.5" /> },
            ]}
          />
        </div>
      </Card>

      {!ready && <SkeletonList rows={3} />}

      {hits && (
        <section className="space-y-3">
          <SectionHeader title={`Results for “${q}”`} subtitle={`${hits.users.length + hits.rooms.length + hits.posts.length + hits.videos.length + hits.games.length} matches`} icon={<Search className="size-4.5 text-vibe-200" />} />
          {hits.users.length + hits.rooms.length + hits.posts.length + hits.videos.length + hits.games.length === 0 ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="Nothing matched"
              body="Try a username, a hashtag, a room topic, or a game name. You can also start the room nobody's made yet."
              action={<Link to="/rooms?create=1"><Button>Start a room</Button></Link>}
            />
          ) : (
            <div className="space-y-5">
              {hits.users.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {hits.users.slice(0, 8).map((u) => <UserCard key={u.id} user={u} />)}
                </div>
              )}
              {hits.rooms.length > 0 && (
                <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {hits.rooms.slice(0, 6).map((r) => <RoomCard key={r.id} room={r} />)}
                </div>
              )}
              {hits.posts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} focused />)}
              {hits.videos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {hits.videos.slice(0, 4).map((v) => <ClipThumb key={v.id} video={v} />)}
                </div>
              )}
              {hits.games.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hits.games.map((g) => (
                    <Link key={g.key} to="/games"><Button variant="outline" icon={<Dices className="size-4" />}>{g.name}</Button></Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {!hits && (
        <>
          {show("people") && (
            <Reveal>
              <section>
                <SectionHeader title="Trending users" subtitle="Highest combined heat on this device" icon={<Flame className="size-4.5 text-blush-400" />} />
                <div className="no-scrollbar -mx-4 mb-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  {trendingMembers.map(({ user: u, score, reason }, i) => (
                    <Link key={u.id} to={`/u/${u.id}`} className="tap group w-[152px] shrink-0 rounded-3xl border border-white/8 bg-white/[0.03] p-3 transition hover:-translate-y-1 hover:border-vibe-400/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">#{i + 1}</span>
                        <span className="rounded-full bg-vibe-600/25 px-1.5 py-0.5 text-[9px] font-black text-vibe-200">{compact(score)}</span>
                      </div>
                      <Avatar user={u} size={54} showStatus className="mx-auto mt-1" />
                      <p className="mt-1.5 truncate text-center text-[11px] font-bold">@{u.username}</p>
                      <p className="truncate text-center text-[10px] text-white/40">{reason}</p>
                    </Link>
                  ))}
                </div>
                <SectionHeader title="People you may know" subtitle="Mutuals, shared interests and language — all local" icon={<Users className="size-4.5 text-mint-400" />} action={<Link to="/friends" className="text-xs font-bold text-vibe-200 hover:text-white">Friends <ArrowUpRight className="inline size-3" /></Link>} />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {people.map(({ item: user, reasons, score }) => (
                    <Card key={user.id} interactive className="flex items-center gap-3 !rounded-3xl p-3.5">
                      <Avatar user={user} size={48} showStatus />
                      <div className="min-w-0 flex-1">
                        <Link to={`/u/${user.id}`} className="truncate text-sm font-bold hover:underline">@{user.username}</Link>
                        <p className="mt-0.5 truncate text-[11px] text-white/50">{reasons.slice(0, 3).join(" · ") || "new member"}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/6 px-2 py-1 text-[10px] font-black text-vibe-200">{Math.min(99, 46 + Math.round(score))}%</span>
                    </Card>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          {show("rooms") && (
            <Reveal>
              <section>
                <SectionHeader title="Trending rooms" subtitle="Live heat from seats, chat and listeners" icon={<Flame className="size-4.5 text-blush-400" />} action={<Link to="/rooms" className="text-xs font-bold text-vibe-200 hover:text-white">All rooms <ArrowUpRight className="inline size-3" /></Link>} />
                <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {recRooms.slice(0, 3).map(({ item }) => <RoomCard key={item.id} room={item} />)}
                </div>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {recRooms.slice(3, 6).map(({ item, reasons }) => (
                    <Link key={item.id} to={`/rooms/${item.id}`}>
                      <Card interactive className="flex items-center gap-3 !rounded-2xl p-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl vibe-gradient text-white"><Mic className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold">{item.title}</span>
                          <span className="block truncate text-[11px] text-white/45">{reasons.join(" · ")}</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-mint-400">{item.listeners} in</span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          {show("videos") && (
            <Reveal>
              <section>
                <SectionHeader title="Popular short videos" subtitle="Procedural demo clips · tap to open the reel feed" icon={<Play className="size-4.5 text-sky-200" />} action={<Link to="/reels" className="text-xs font-bold text-vibe-200 hover:text-white">Open reels <ArrowUpRight className="inline size-3" /></Link>} />
                <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                  {clips.map(({ video }) => <ClipThumb key={video.id} video={video} wide />)}
                </div>
              </section>
            </Reveal>
          )}

          {show("posts") && (
            <Reveal>
              <section>
                <SectionHeader title="Popular posts" subtitle="Moments the community is replying to" icon={<Heart className="size-4.5 text-blush-300" />} action={<Link to="/posts" className="text-xs font-bold text-vibe-200 hover:text-white">All posts <ArrowUpRight className="inline size-3" /></Link>} />
                <div className="grid gap-3 lg:grid-cols-2">
                  {posts.slice(0, 4).map(({ post }) => <PostCard key={post.id} post={post} />)}
                </div>
              </section>
            </Reveal>
          )}

          {show("games") && (
            <Reveal>
              <section>
                <SectionHeader title="Popular games" subtitle="Demo points only" icon={<Gamepad2 className="size-4.5 text-coin-400" />} />
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {games.map((g) => (
                    <Link key={g.key} to="/games">
                      <Card interactive className="flex h-full items-center gap-3 !rounded-2xl p-3.5">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundImage: g.hue }}><g.icon className="size-5" /></span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{g.name}</span>
                          <span className="block text-[11px] text-white/45">{g.plays.toLocaleString()} plays</span>
                        </span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          <Reveal>
            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="!rounded-[28px] p-4 lg:col-span-2">
                <SectionHeader title="Because you like…" subtitle="Interest clusters driving your recommendations" icon={<Sparkles className="size-4.5 text-vibe-200" />} />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {clusters.map((c) => (
                    <div key={c.interest} className="rounded-3xl border border-white/8 bg-white/[0.03] p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-sm font-extrabold">{c.interest}</p>
                        <span className="rounded-full bg-vibe-600/25 px-2 py-0.5 text-[10px] font-black text-vibe-200">weight {c.weight}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-white/45">
                        {c.rooms.length} rooms · {c.creators.length} creators · {c.videos.length} clips matched
                      </p>
                      <div className="mt-2.5 flex -space-x-2">
                        {c.creators.slice(0, 5).map((r) => <Avatar key={r.item.id} user={r.item} size={28} showFrame={false} className="ring-2 ring-ink-900" />)}
                        {c.creators.length === 0 && <span className="text-[11px] text-white/30">no creators yet</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="!rounded-[28px] p-4">
                <SectionHeader title="Your friend zones" subtitle="Who you actually talk to" icon={<Star className="size-4.5 text-coin-400" />} />
                <div className="space-y-2.5">
                  {zones.slice(0, 3).map((z) => (
                    <div key={z.key} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-white/45">
                        {FRIEND_ZONE_LABEL[z.key]}
                        <span className="text-vibe-200">{z.users.length}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {z.users.length === 0 && <span className="text-[11px] text-white/35">nobody yet — send a request</span>}
                        {z.users.slice(0, 6).map((u) => (
                          <Link key={u.id} to={`/u/${u.id}`} className="tap inline-flex items-center gap-1.5 rounded-full bg-white/6 py-1 pl-1 pr-2.5 text-[11px] font-bold hover:bg-white/12">
                            <Avatar user={u} size={20} showFrame={false} /> @{u.username}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </Reveal>

          <Reveal>
            <section className="grid gap-4 lg:grid-cols-2">
              <div>
                <SectionHeader title="New members" subtitle="Fresh on this device" icon={<Users className="size-4.5 text-mint-400" />} />
                <div className="grid gap-2.5">
                  {fresh.slice(0, 4).map((u) => <UserCard key={u.id} user={u} variant="row" />)}
                </div>
              </div>
              <div>
                <SectionHeader title="Rising stars" subtitle="Fastest xp climb" icon={<Flame className="size-4.5 text-coin-400" />} />
                <Card className="divide-y divide-white/6 !rounded-3xl p-0">
                  {stars.map((s, i) => (
                    <Link key={s.user.id} to={`/u/${s.user.id}`} className="flex items-center gap-3 p-3 transition hover:bg-white/[0.04]">
                      <span className="w-5 text-center font-display text-sm font-black text-white/35">{i + 1}</span>
                      <Avatar user={s.user} size={36} showStatus />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold">@{s.user.username}</span>
                        <span className="block truncate text-[11px] text-white/45">
                          {s.user.online ? "online now" : "recently active"} · {s.user.followers.toLocaleString()} followers · LV {s.user.level}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-black text-vibe-200">{compact(s.momentum)}</span>
                      <span className="shrink-0 text-[10px] text-white/25">{timeAgo(s.user.joinedAt)}</span>
                    </Link>
                  ))}
                </Card>
              </div>
            </section>
          </Reveal>

          {me && (
            <Reveal>
              <Card className="flex flex-wrap items-center gap-4 !rounded-[28px] p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-vibe-600/25 text-vibe-200"><Sparkles className="size-6" /></span>
                <div className="min-w-[220px] flex-1">
                  <p className="font-display text-base font-extrabold">Tune your interests to sharpen Discover</p>
                  <p className="mt-1 text-xs text-white/50">You currently follow {db.follows.length} members and have {(me.interests ?? []).length} interests. More signal, better rooms.</p>
                </div>
                <Link to="/profile"><Button variant="outline">Edit interests</Button></Link>
                <Link to="/missions"><Button>Today's missions</Button></Link>
              </Card>
            </Reveal>
          )}
        </>
      )}
    </div>
  );
}



function ClipThumb({ video, wide = false }: { video: import("../lib/types").Video; wide?: boolean }) {
  const { userById } = useStore();
  const author = userById(video.authorId);
  return (
    <Link
      to={`/reels?start=${video.id}`}
      className={cn("tap group relative block shrink-0 overflow-hidden rounded-3xl border border-white/10", wide ? "h-[300px] w-[190px]" : "aspect-[9/14] w-full")}
    >
      <ClipArt tone={video.tone} shape={video.shape} seed={video.authorId} className="absolute inset-0 size-full" />
      <span className="absolute inset-x-0 bottom-0 z-[2] space-y-1 bg-gradient-to-t from-black/90 to-transparent p-3">
        <span className="block truncate text-[12.5px] font-bold leading-snug">{video.title}</span>
        <span className="block truncate text-[10px] text-white/60">@{author?.username ?? "member"} · {compact(video.views)} views</span>
      </span>
      <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/80 backdrop-blur">
        <Play className="size-2.5 fill-current" /> reel
      </span>
    </Link>
  );
}
