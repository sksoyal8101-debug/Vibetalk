import { CalendarClock, Flame, History, Info, Lock, Mic, Plus, Radio, Search, SlidersHorizontal, Sparkles, Star, Tag, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CreateRoomCard, RoomCard } from "../components/RoomCard";
import { CategoryChips, EventsStrip } from "../components/discover";
import { Avatar, Button, Card, Chip, EmptyState, Field, Input, Modal, SectionHeader, Select, Skeleton, Textarea, useReady } from "../components/ui";
import { ROOM_COVERS, ROOM_TOPICS } from "../lib/data";
import { ROOM_CATEGORIES, categorizeSafe } from "../lib/rooms";
import { trendingRooms } from "../lib/social";
import { roomsYouMayEnjoy } from "../lib/engine";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";

type Sort = "trending" | "freshest" | "smallest";
type RoomFilter = "all" | "live" | "trending" | "recommended" | "friends" | "recent" | "mine" | "favs";

export function Rooms() {
  const { db, me, myFollows, currentRoomId, favorites } = useStore();
  const { ctx } = useSocial();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [category, setCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("trending");
  const [showSort, setShowSort] = useState(false);
  const [creating, setCreating] = useState(params.get("create") === "1");
  const ready = useReady(240);

  useEffect(() => {
    setCreating(params.get("create") === "1");
  }, [params]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    db.rooms.forEach((r) => r.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [db.rooms]);

  const rooms = useMemo(() => {
    let list = [...db.rooms];
    if (filter === "live") list = list.filter((r) => r.live);
    else if (filter === "trending") {
      const heatMap = new Map(trendingRooms(db, 30).map((tr) => [tr.room.id, tr.score]));
      list.sort((a, b) => (heatMap.get(b.id) ?? 0) - (heatMap.get(a.id) ?? 0));
    } else if (filter === "recommended") {
      const recIds = new Set(roomsYouMayEnjoy(ctx, 30).map((r) => r.item.id));
      list = list.filter((r) => recIds.has(r.id));
    } else if (filter === "friends") {
      list = list.filter((r) => r.speakerIds.some((s) => myFollows.includes(s)));
    } else if (filter === "recent") {
      const recents = db.recentlyJoinedRooms ?? [];
      list = list.filter((r) => recents.includes(r.id)).sort((a, b) => recents.indexOf(a.id) - recents.indexOf(b.id));
    } else if (filter === "mine") {
      list = list.filter((r) => r.hostId === me?.id || r.createdByUser);
    } else if (filter === "favs") {
      list = list.filter((r) => favorites.rooms.includes(r.id));
    }

    if (category !== "All") list = list.filter((r) => (r.category || categorizeSafe(r.topic, r.title)) === category);
    if (selectedTag) list = list.filter((r) => r.tags?.includes(selectedTag));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "trending") list.sort((a, b) => b.listeners - a.listeners);
    if (sort === "freshest") list.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "smallest") list.sort((a, b) => a.listeners - b.listeners);
    return list;
  }, [category, ctx, db, favorites.rooms, filter, me?.id, myFollows, query, selectedTag, sort]);

  const heat = useMemo(() => trendingRooms(db, 3), [db]);
  const myRooms = db.rooms.filter((r) => r.hostId === me?.id);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-start gap-4 border-vibe-400/25 bg-vibe-600/[0.1] p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-vibe-500/25 text-vibe-200 ring-1 ring-vibe-400/30">
          <Info className="size-5" />
        </span>
        <div className="min-w-[220px] flex-1">
          <p className="font-display text-sm font-extrabold">Demo Voice Rooms — real audio ships in version 2</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Seats, mics, host tools, gifts and room chat are simulated so you can feel the flow. Nothing is recorded
            and no microphone permission is requested.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/events">
            <Button size="sm" variant="soft" icon={<CalendarClock className="size-4" />}>Events</Button>
          </Link>
          <Button size="sm" className="shrink-0" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Create room
          </Button>
        </div>
      </Card>

      {heat.length > 0 && (
        <section>
          <SectionHeader title="Hot right now" subtitle="Highest room heat on this device" icon={<Sparkles className="size-4.5 text-blush-400" />} />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {heat.map(({ room, score, reason }, i) => (
              <button key={room.id} onClick={() => navigate(`/rooms/${room.id}`)} className="tap flex items-center gap-3 rounded-3xl border border-white/8 bg-white/[0.03] p-3 text-left hover:border-vibe-400/45">
                <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-ink-950 font-display text-sm font-black text-white/60">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{room.title}</span>
                  <span className="block truncate text-[11px] text-white/45">{reason}</span>
                </span>
                <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-vibe-200">{score}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {myRooms.length > 0 && (
        <section>
          <SectionHeader title="Your rooms" subtitle="Host seats and tools you opened on this device" icon={<Mic className="size-4.5 text-mint-400" />} action={<Link to="/leaderboard" className="text-xs font-bold text-vibe-200 hover:text-white">Host leaderboard →</Link>} />
          <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {myRooms.map((r) => (
              <RoomCard key={r.id} room={r} className="w-[280px] shrink-0" />
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-16 z-30 -mx-4 bg-ink-950/70 px-4 py-2 backdrop-blur-lg sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rooms by title, topic or category…"
              className="w-full rounded-2xl border border-white/12 bg-ink-900/80 py-2.5 pl-10 pr-9 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="tap absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" className="!px-3.5" onClick={() => setShowSort(true)} icon={<SlidersHorizontal className="size-4" />}>
            {sort === "trending" ? "Trending" : sort === "freshest" ? "Freshest" : "Cosy"}
          </Button>
        </div>
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
          {([
            ["all", "All rooms", <Radio className="size-3" />],
            ["live", "Live now", <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />],
            ["trending", "Trending", <Flame className="size-3 text-blush-400" />],
            ["recommended", "For you", <Sparkles className="size-3 text-vibe-200" />],
            ["friends", "Friends' rooms", <Users className="size-3 text-mint-400" />],
            ["recent", "Recent", <History className="size-3 text-sky-300" />],
            ["mine", "My rooms", <Mic className="size-3" />],
            ["favs", "Favourites", <Star className="size-3 text-coin-400" />],
          ] as const).map(([key, label, icon]) => (
            <Chip key={key} active={filter === key} onClick={() => { setFilter(key); setSelectedTag(null); }}>
              <span className="flex items-center gap-1.5">
                {icon}
                {label}
                {key === "favs" && favorites.rooms.length > 0 ? ` (${favorites.rooms.length})` : ""}
                {key === "recent" && (db.recentlyJoinedRooms?.length ?? 0) > 0 ? ` (${db.recentlyJoinedRooms?.length})` : ""}
              </span>
            </Chip>
          ))}
        </div>
        <div className="mt-2">
          <CategoryChips active={category} onPick={setCategory} />
        </div>
        {allTags.length > 0 && (
          <div className="no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
              <Tag className="size-3" /> Tags:
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="tap inline-flex items-center gap-1 rounded-full border border-vibe-400/50 bg-vibe-600/25 px-2 py-0.5 text-[10px] font-bold text-white"
              >
                {selectedTag} <X className="size-2.5" />
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "tap rounded-full border px-2 py-0.5 text-[10px] font-semibold transition",
                  selectedTag === tag
                    ? "border-vibe-400/70 bg-vibe-600/30 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <CreateRoomCard onClick={() => setCreating(true)} />
        {!ready &&
          Array.from({ length: 3 }, (_, i) => <Skeleton key={`sk-${i}`} className="h-[228px] !rounded-3xl" />)}
        {ready &&
          rooms.map((room, i) => (
            <RoomCard
              key={room.id}
              room={room}
              className={cn(
                currentRoomId === room.id && "ring-1 ring-mint-400/40",
                "reveal is-in",
              )}
              style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
            />
          ))}
      </div>

      {rooms.length === 0 && (
        <EmptyState
          icon={<Radio className="size-6" />}
          title="No rooms match that"
          body="Try another category, clear the filters, or open a room yourself — it takes about 20 seconds and earns 40 xp."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setQuery(""); setFilter("all"); setCategory("All"); }}>Clear filters</Button>
              <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>Create room</Button>
            </div>
          }
        />
      )}

      <section>
        <SectionHeader title="Events in rooms" subtitle="RSVP so the host knows to save a seat" icon={<CalendarClock className="size-4.5 text-vibe-200" />} action={<Link to="/events" className="text-xs font-bold text-vibe-200 hover:text-white">All events →</Link>} />
        <EventsStrip limit={3} />
      </section>

      <CreateRoomModal open={creating} onClose={() => { setCreating(false); if (params.get("create")) setParams({}, { replace: true }); }} />

      <Modal open={showSort} onClose={() => setShowSort(false)} title="Sort rooms" subtitle="Pick what matters to you">
        <div className="space-y-2">
          {([
            ["trending", "Trending", "Most listeners and chat heat first"],
            ["freshest", "Freshest", "Newly opened rooms"],
            ["smallest", "Cosy", "Smallest rooms first"],
          ] as [Sort, string, string][]).map(([key, label, hint]) => (
            <button
              key={key}
              onClick={() => { setSort(key); setShowSort(false); }}
              className={cn(
                "tap flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                sort === key ? "border-vibe-400/70 bg-vibe-600/20" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]",
              )}
            >
              <span>
                <span className="block text-sm font-bold">{label}</span>
                <span className="block text-xs text-white/45">{hint}</span>
              </span>
              {sort === key && <Sparkles className="size-4 text-vibe-200" />}
            </button>
          ))}
        </div>
        <Button className="mt-4 w-full" variant="ghost" onClick={() => navigate("/rooms")}>Reset to default</Button>
      </Modal>
    </div>
  );
}

function CreateRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createRoom, joinRoom, me } = useStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState(ROOM_TOPICS[0]);
  const [category, setCategory] = useState<string>(ROOM_CATEGORIES[0]);
  const [cover, setCover] = useState(0);
  const [seats, setSeats] = useState(8);
  const [description, setDescription] = useState("");
  const [roomTags, setRoomTags] = useState<string[]>(["#vibetalk", "#chill"]);
  const [tagInput, setTagInput] = useState("");
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TAG_PRESETS = ["#vibetalk", "#chill", "#music", "#gaming", "#latenight", "#talks", "#friends", "#study"];

  useEffect(() => {
    if (open) {
      setTitle("");
      setTopic(ROOM_TOPICS[0]);
      setCategory(ROOM_CATEGORIES[0]);
      setCover(Math.floor(Math.random() * ROOM_COVERS.length));
      setSeats(8);
      setDescription("");
      setRoomTags(["#vibetalk", "#chill"]);
      setTagInput("");
      setLocked(false);
      setError(null);
    }
  }, [open]);

  function submit() {
    if (title.trim().length < 4) {
      setError("Give your room a title with at least 4 characters so people know what it's about.");
      return;
    }
    const id = createRoom({ title, topic, category, cover, seats, description, tags: roomTags });
    if (locked) joinRoom(id, true);
    else joinRoom(id, true);
    onClose();
    navigate(`/rooms/${id}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Create a voice room"
      subtitle="Demo audio only — seats and mics are simulated in this MVP"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} icon={<Mic className="size-4" />}>Go live as @{me?.username}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Room title">
          <Input value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} maxLength={60} placeholder="Late night music trade & venting" />
        </Field>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Topic">
            <Select value={topic} onChange={(e) => { setTopic(e.target.value); setCategory(categorizeSafe(e.target.value, title)); }}>
              {ROOM_TOPICS.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Category" hint="drives discovery">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {ROOM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Speaker seats" hint={`${seats} total`}>
          <input type="range" min={2} max={16} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-3 w-full accent-[#a855f7]" />
        </Field>

        <Field label="Cover">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {ROOM_COVERS.map((bg, i) => (
              <button
                key={i}
                onClick={() => setCover(i)}
                aria-label={`Cover ${i + 1}`}
                className={cn("tap h-14 rounded-2xl border-2 transition", cover === i ? "scale-[1.04] border-white/80" : "border-transparent opacity-70 hover:opacity-100")}
                style={{ backgroundImage: bg }}
              />
            ))}
          </div>
        </Field>

        <Field label="Description" hint="optional · shown on your room card">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={140} placeholder="Rules, vibe, who should join…" />
        </Field>

        <div>
          <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
            Room tags <span className="text-white/30">{roomTags.length}/5 tags</span>
          </span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {TAG_PRESETS.map((t) => {
              const selected = roomTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (selected) setRoomTags((tags) => tags.filter((x) => x !== t));
                    else if (roomTags.length < 5) setRoomTags((tags) => [...tags, t]);
                  }}
                  className={cn(
                    "tap rounded-full border px-2.5 py-1 text-[10px] font-bold transition",
                    selected ? "border-vibe-400/80 bg-vibe-600/30 text-white" : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add custom tag (e.g. #nightvibes)…"
              className="text-xs !py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const clean = (tagInput.startsWith("#") ? tagInput : `#${tagInput}`).trim().toLowerCase();
                  if (clean.length > 2 && !roomTags.includes(clean) && roomTags.length < 5) {
                    setRoomTags((tags) => [...tags, clean]);
                    setTagInput("");
                  }
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => {
                const clean = (tagInput.startsWith("#") ? tagInput : `#${tagInput}`).trim().toLowerCase();
                if (clean.length > 2 && !roomTags.includes(clean) && roomTags.length < 5) {
                  setRoomTags((tags) => [...tags, clean]);
                  setTagInput("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip active={!locked} onClick={() => setLocked(false)}>Public room</Chip>
          <Chip active={locked} onClick={() => setLocked(true)}>
            <Lock className="mr-1 inline size-3" /> Invite only
          </Chip>
          <span className="ml-auto text-[11px] text-white/35">Host tools unlock once it's live</span>
        </div>

        <Card className="flex items-center gap-3 !rounded-2xl border-white/8 p-3">
          <Avatar user={me ?? undefined} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Preview card</p>
            <p className="truncate text-xs text-white/50">{title || "Your room title"} · {category} · {seats} seats</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1 text-[10px] font-bold text-white/60">
            <Star className="size-3" /> +40 xp
          </span>
        </Card>

        {error && <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-200">{error}</p>}

        <p className="text-[11px] leading-relaxed text-white/35">
          Rooms are stored in localStorage on this device. No audio, no video, no recording. 18+ only — hate speech,
          sexual solicitation and gambling are bannable under the Community Guidelines.
        </p>
      </div>
    </Modal>
  );
}


