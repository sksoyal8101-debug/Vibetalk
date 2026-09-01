import { CalendarClock, CalendarPlus, Flame, Mic, Sparkles, Trash2, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CreateEventModal, EventCard } from "../components/discover";
import { Button, Card, Chip, EmptyState, SectionHeader, Segmented } from "../components/ui";
import { useStore } from "../store/StoreProvider";
import { ROOM_CATEGORIES } from "../lib/rooms";
import { eventWhen, upcomingEvents } from "../lib/social";
import { cn } from "../utils/cn";

export function Events() {
  const { db, me, deleteEvent } = useStore();
  const [creating, setCreating] = useState(false);
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState<"upcoming" | "live" | "finished">("upcoming");

  const buckets = useMemo(() => {
    const live = new Set<string>();
    upcomingEvents(db, 40).forEach((e) => {
      if ((e.startsIn <= 0 && e.startsIn > -3 * 3_600_000) || (e.roomId ? db.rooms.find((r) => r.id === e.roomId)?.live : false)) live.add(e.id);
    });
    return {
      upcoming: db.events.filter((e) => !live.has(e.id) && new Date(`${e.date}T${e.time}`).getTime() >= Date.now() - 3 * 3_600_000).length,
      live: live.size,
      finished: db.events.filter((e) => !live.has(e.id) && new Date(`${e.date}T${e.time}`).getTime() < Date.now() - 3 * 3_600_000).length,
    };
  }, [db]);

  const events = useMemo(() => {
    const base = upcomingEvents(db, 40).filter((e) => cat === "All" || e.category === cat);
    return base.filter((e) => {
      const linkedRoomLive = e.roomId ? db.rooms.find((r) => r.id === e.roomId)?.live : false;
      if (status === "live") return (e.startsIn <= 0 && e.startsIn > -3 * 3_600_000) || !!linkedRoomLive;
      if (status === "finished") return e.startsIn <= -3 * 3_600_000 && !linkedRoomLive;
      return e.startsIn > 0;
    });
  }, [cat, db, status]);
  const mine = db.events.filter((e) => e.hostId === me?.id);

  return (
    <div className="space-y-6">
      <Card className="relative flex flex-wrap items-center gap-4 overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-vibe-500/25 blur-3xl" />
        <span className="relative grid size-14 place-items-center rounded-3xl bg-vibe-600/25 text-vibe-200 ring-1 ring-vibe-400/30">
          <CalendarClock className="size-7" />
        </span>
        <div className="relative min-w-[220px] flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Community events</h1>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Listening parties, trivia, study sprints and speed-friending nights. RSVP counts are local demo numbers —
            no tickets, no payments.
          </p>
        </div>
        <Button className="relative" onClick={() => setCreating(true)} icon={<CalendarPlus className="size-4" />}>
          Schedule event
        </Button>
      </Card>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        <Chip active={cat === "All"} onClick={() => setCat("All")}>
          All · {db.events.length}
        </Chip>
        {ROOM_CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c} · {db.events.filter((e) => e.category === c).length}
          </Chip>
        ))}
      </div>

      <Segmented
        value={status}
        onChange={setStatus}
        options={[
          { key: "upcoming", label: `Upcoming (${buckets.upcoming})`, icon: <CalendarClock className="size-3.5" /> },
          { key: "live", label: `Live now (${buckets.live})`, icon: <Flame className="size-3.5" /> },
          { key: "finished", label: `Finished (${buckets.finished})` },
        ]}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="size-6" />}
          title="Nothing scheduled in this category"
          body="Publish the first event and it appears on the Home feed, the Rooms page and every host's calendar strip."
          action={<Button onClick={() => setCreating(true)} icon={<Sparkles className="size-4" />}>Create an event</Button>}
        />
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-2">
          {events.map((e) => (
            <div key={e.id} className="relative">
              <EventCard eventId={e.id} />
              {e.startsIn > 0 && e.startsIn < 1000 * 60 * 60 * 8 && (
                <span className="absolute right-3 top-3 rounded-full bg-rose-500/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-rose-200">
                  {eventWhen(e)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <section>
        <SectionHeader title="Events you host" subtitle="Publishing as your demo profile" icon={<Mic className="size-4.5 text-mint-400" />} />
        {mine.length === 0 ? (
          <Card className="!rounded-3xl p-5">
            <p className="text-sm text-white/55">
              You haven't published an event yet. Hosts who run events get the <span className="font-bold text-white/80">Event Host</span> badge and a
              pin on the community leaderboard.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setCreating(true)} icon={<CalendarPlus className="size-3.5" />}>
                Schedule your first event
              </Button>
              <Link to="/rooms">
                <Button size="sm" variant="outline">Open a room first</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {mine.map((e) => (
              <div key={e.id} className={cn("flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5")}>
                <span className="grid size-10 place-items-center rounded-xl vibe-gradient text-white">
                  <Zap className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{e.name}</p>
                  <p className="truncate text-[11px] text-white/45">
                    {e.date} · {e.time} · {e.rsvps} going · {e.category}
                  </p>
                </div>
                <button onClick={() => deleteEvent(e.id)} aria-label="Delete event" className="tap grid size-8 place-items-center rounded-xl text-white/45 hover:bg-rose-500/15 hover:text-rose-200">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Card className="flex flex-wrap items-center gap-4 !rounded-3xl p-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-mint-400/15 text-mint-400 ring-1 ring-mint-400/25">
          <Users className="size-5" />
        </span>
        <p className="min-w-[200px] flex-1 text-xs leading-relaxed text-white/50">
          Events never ask for money, bank details or off-platform meetups. Keep first meet-ups inside a public voice
          room, and report anything that feels off.
        </p>
        <Link to="/safety">
          <Button size="sm" variant="outline">Safety rules</Button>
        </Link>
      </Card>

      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
