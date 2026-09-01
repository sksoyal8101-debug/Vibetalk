import {
  ArrowRight,
  CalendarClock,
  Dices,
  Flame,
  Gamepad2,
  Headphones,
  Mic,
  Rocket,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, Chip, EmptyState, Field, Input, Modal, SectionHeader, Select, Textarea } from "./ui";
import { categoryMeta, leaderboard, popularGames, recommendFor, risingStars, trendingRooms, eventWhen, upcomingEvents } from "../lib/social";
import { ROOM_CATEGORIES } from "../lib/rooms";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";
import { compact, todayKey } from "../lib/utils";

/* ------------------------------ Trending rooms ------------------------------ */

export function TrendingRooms({ limit = 4 }: { limit?: number }) {
  const { db } = useStore();
  const rows = trendingRooms(db, limit);
  const max = Math.max(1, rows[0]?.score ?? 1);

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {rows.map(({ room, score, reason }, i) => {
        const cat = categoryMeta(room.category);
        const host = db.users.find((u) => u.id === room.hostId);
        return (
          <Link key={room.id} to={`/rooms/${room.id}`}>
            <Card interactive className="flex items-center gap-3 !rounded-3xl p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/6 font-display text-sm font-black text-white/50">
                {i + 1}
              </span>
              <span
                className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-[0_14px_30px_-16px_rgba(0,0,0,.9)]"
                style={{ backgroundImage: cat.hue }}
              >
                <cat.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">{room.title}</span>
                  {room.live && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-rose-400" />}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/45">
                  <TrendingUp className="size-3 text-mint-400" /> {reason}
                </span>
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="h-1 w-full max-w-[110px] overflow-hidden rounded-full bg-white/10">
                    <span className="vibe-gradient block h-full rounded-full" style={{ width: `${Math.max(12, Math.round((score / max) * 100))}%` }} />
                  </span>
                  <span className="text-[10px] font-black text-vibe-200">heat {score}</span>
                </span>
              </span>
              <span className="hidden shrink-0 text-right sm:block">
                <span className="flex items-center gap-1 text-xs font-bold text-white/70">
                  <Headphones className="size-3.5" /> {room.listeners}
                </span>
                <span className="mt-0.5 block text-[10px] text-white/35">@{host?.username}</span>
              </span>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------ Trending users ------------------------------ */

export function RisingStarsRail({ limit = 6 }: { limit?: number }) {
  const { db } = useStore();
  const rows = risingStars(db, limit);
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {rows.map(({ user, score, reason }, i) => (
        <Link key={user.id} to={`/u/${user.id}`}>
          <Card interactive className="relative w-[190px] shrink-0 !rounded-3xl p-4">
            <span className="absolute right-3 top-3 rounded-full bg-coin-500/18 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-coin-400">
              #{i + 1}
            </span>
            <Avatar user={user} size={52} showStatus />
            <p className="mt-2.5 truncate text-sm font-bold">@{user.username}</p>
            <p className="mt-0.5 truncate text-[11px] text-white/45">{reason}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-vibe-200">
                <Rocket className="size-3.5" /> {compact(score)}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/30">LV {user.level}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/* --------------------------- Recommended for you ---------------------------- */

export function RecommendedForYou() {
  const { db, me, myFollows, toggleFollow } = useStore();
  const [tab, setTab] = useState<"people" | "rooms" | "games">("people");
  const rec = recommendFor(db, me);

  return (
    <div className="space-y-3.5">
      <div className="flex gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
        {([
          ["people", "People", Users],
          ["rooms", "Rooms", Mic],
          ["games", "Games", Gamepad2],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "tap flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition",
              tab === key ? "vibe-gradient text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" /> {label}
            <span className="rounded-full bg-black/25 px-1.5 text-[10px] text-white/70">
              {key === "people" ? rec.users.length : key === "rooms" ? rec.rooms.length : rec.games.length}
            </span>
          </button>
        ))}
      </div>

      {tab === "people" &&
        (rec.users.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title="Nothing left to suggest" body="You're connected to everyone on this device. Reset the demo data in Settings to refill the pool." />
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {rec.users.slice(0, 6).map(({ user, why, score }) => (
              <Card key={user.id} interactive className="flex items-center gap-3 !rounded-3xl p-3.5">
                <Avatar user={user} size={46} showStatus />
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${user.id}`} className="truncate text-sm font-bold hover:underline">
                    @{user.username}
                  </Link>
                  <p className="mt-0.5 truncate text-[11px] text-white/50">{why.join(" · ") || "new to VibeTalk"}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-vibe-200/80">match {Math.min(99, 40 + score * 2).toFixed(0)}%</p>
                </div>
                <Button size="sm" variant={myFollows.includes(user.id) ? "soft" : "outline"} onClick={() => toggleFollow(user.id)}>
                  {myFollows.includes(user.id) ? "Following" : "Follow"}
                </Button>
              </Card>
            ))}
          </div>
        ))}

      {tab === "rooms" && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {rec.rooms.slice(0, 6).map(({ room, why, score }) => (
            <Link key={room.id} to={`/rooms/${room.id}`}>
              <Card interactive className="flex items-center gap-3 !rounded-3xl p-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundImage: categoryMeta(room.category).hue }}>
                  <Mic className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{room.title}</p>
                  <p className="truncate text-[11px] text-white/45">{why}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/6 px-2 py-1 text-[10px] font-black text-vibe-200">
                  {Math.round(score)}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === "games" && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {rec.games.map((g) => (
            <Link key={g.key} to="/games">
              <Card interactive className="flex h-full flex-col gap-2 !rounded-3xl p-4">
                <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ backgroundImage: g.hue }}>
                  <Dices className="size-5" />
                </span>
                <p className="text-sm font-bold">{g.name}</p>
                <p className="text-[11px] text-white/45">{g.plays.toLocaleString()} demo sessions today</p>
                <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-coin-400">
                  <Zap className="size-3" /> up to {g.win} pts
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Categories -------------------------------- */

export function CategoryChips({ active, onPick }: { active: string; onPick: (key: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
      <Chip active={active === "All"} onClick={() => onPick("All")}>
        All categories
      </Chip>
      {ROOM_CATEGORIES.map((c) => (
        <Chip key={c} active={active === c} onClick={() => onPick(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

/* ---------------------------------- Events ---------------------------------- */

export function EventCard({ eventId, dense = false }: { eventId: string; dense?: boolean }) {
  const { db, rsvpEvent, me, addNotification, pushToast } = useStore();
  const list = upcomingEvents(db, 40);
  const event = list.find((e) => e.id === eventId);
  if (!event) return null;
  const cat = categoryMeta(event.category);
  return (
    <Card interactive className={cn("relative flex flex-col gap-3 overflow-hidden !rounded-3xl p-4", dense && "!rounded-2xl p-3.5")}>
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundImage: cat.hue }}>
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-bold">
            {event.name}
            {event.soon && <span className="rounded-full bg-rose-500/18 px-1.5 py-0.5 text-[9px] font-black text-rose-200">SOON</span>}
          </p>
          <p className="mt-0.5 text-[11px] text-white/45">
            {event.date} · {event.time} · {eventWhen(event)}
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block font-display text-lg font-extrabold leading-none">{event.rsvps}</span>
          <span className="block text-[9px] font-bold uppercase tracking-widest text-white/35">going</span>
        </span>
      </div>
      {!dense && <p className="text-xs leading-relaxed text-white/55">{event.description}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => rsvpEvent(event.id)}>
          {event.rsvps > 0 && me ? "Save my spot" : "RSVP"}
        </Button>
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            addNotification({
              type: "event",
              title: `Reminder set: ${event.name}`,
              body: `${event.date} at ${event.time} · ${event.category}. Demo reminder only.`,
              link: event.roomId ? `/rooms/${event.roomId}` : "/events",
            });
            pushToast("Reminder saved to your notifications.", "ok");
          }}
        >
          Remind me
        </Button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(`${window.location.origin}/#/events`).catch(() => undefined);
            pushToast("Event link copied.", "ok");
          }}
          className="tap rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
        >
          Share
        </button>
        {event.roomId && (
          <Link to={`/rooms/${event.roomId}`}>
            <Button size="sm" variant="outline" icon={<ArrowRight className="size-3.5" />}>
              {db.rooms.find((r) => r.id === event.roomId)?.title.slice(0, 18) ?? "Open room"}
            </Button>
          </Link>
        )}
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-white/30">
          host @{db.users.find((u) => u.id === event.hostId)?.username ?? "you"}
        </span>
      </div>
    </Card>
  );
}

export function EventsStrip({ limit = 3 }: { limit?: number }) {
  const { db } = useStore();
  const events = upcomingEvents(db, limit);
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock className="size-6" />}
        title="No events scheduled"
        body="Hosts can publish a listening party, trivia night or study sprint — it shows up here and on the Rooms page."
        action={
          <Link to="/events">
            <Button>Open events</Button>
          </Link>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard key={e.id} eventId={e.id} />
      ))}
    </div>
  );
}

export function CreateEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createEvent, db, me } = useStore();
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("20:00");
  const [category, setCategory] = useState<string>("Music");
  const [description, setDescription] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (name.trim().length < 4) {
      setError("Give the event a name people can find (4+ characters).");
      return;
    }
    createEvent({ name: name.trim(), date, time, category, description: description.trim(), roomId: roomId || undefined });
    setName("");
    setDescription("");
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Schedule a room event"
      subtitle={`Publishing as @${me?.username} · demo calendar`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} icon={<Sparkles className="size-4" />}>Publish event</Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Event name">
          <Input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} maxLength={48} placeholder="Vinyl Listening Party" />
        </Field>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {ROOM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Hosted in" hint="optional">
            <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">No room linked</option>
              {db.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Description" hint={`${description.length}/160`}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={160} placeholder="What happens, rules, what to bring…" />
        </Field>
        {error && <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-200">{error}</p>}
        <p className="text-[11px] leading-relaxed text-white/35">
          Events are calendar entries only in this MVP — no reminders, no tickets, no payments. Attendees are counted
          locally so the numbers feel alive.
        </p>
      </div>
    </Modal>
  );
}

/* ------------------------------ Popular games rail ----------------------------- */

export function PopularGamesRail() {
  const { db } = useStore();
  const games = popularGames(db);
  const top = leaderboard(db, "active", db.users[0]?.id);
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {games.map((g, i) => (
          <Link key={g.key} to="/games">
            <Card interactive className="flex items-center gap-3 !rounded-3xl p-3.5">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundImage: g.hue }}>
                <Gamepad2 className="size-5" />
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink-950 text-[9px] font-black text-white/70 ring-1 ring-white/15">
                  {i + 1}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{g.name}</p>
                <p className="truncate text-[11px] text-white/45">{g.blurb}</p>
                <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                  <Flame className="size-3 text-coin-400" /> {g.plays.toLocaleString()} plays
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="!rounded-3xl p-4">
        <SectionHeader title="Momentum board" subtitle="Live activity in this demo" icon={<Star className="size-4 text-coin-400" />} />
        <div className="space-y-2">
          {top.slice(0, 5).map((row) => (
            <Link key={row.user.id} to={`/u/${row.user.id}`} className="flex items-center gap-2.5 rounded-2xl p-1.5 transition hover:bg-white/5">
              <span className="w-4 text-center text-[11px] font-black text-white/40">{row.rank}</span>
              <Avatar user={row.user} size={30} showStatus />
              <span className="min-w-0 flex-1 truncate text-xs font-bold">@{row.user.username}</span>
              <span className="shrink-0 text-[10px] font-bold text-vibe-200">{compact(row.score)}</span>
            </Link>
          ))}
        </div>
        <Link to="/leaderboard" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blush-300 hover:text-white">
          Full leaderboard <ArrowRight className="size-3" />
        </Link>
      </Card>
    </div>
  );
}
