import { CornerDownLeft, Dices, Gamepad2, Mic, Search as SearchIcon, Sparkles, TrendingUp, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GAMES_LIST } from "../lib/games";
import { RoomCard } from "../components/RoomCard";
import { UserCard } from "../components/UserCard";
import { Avatar, Button, Card, Chip, EmptyState, SectionHeader } from "../components/ui";
import { ROOM_TOPICS } from "../lib/data";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";

type Tab = "all" | "people" | "rooms" | "games";

export function Search() {
  const { db, visibleUsers } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q") ?? "";
  const tab: Tab = (params.get("tab") as Tab) || "all";
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem("vibetalk.searches");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  const q = query.trim().toLowerCase();

  const users = useMemo(() => (q ? visibleUsers.filter((u) => u.username.includes(q) || u.bio.toLowerCase().includes(q) || u.country.toLowerCase().includes(q)) : []), [q, visibleUsers]);
  const rooms = useMemo(
    () => (q ? db.rooms.filter((r) => r.title.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) : []),
    [db.rooms, q],
  );
  const games = useMemo(() => (q ? GAMES_LIST.filter((g) => g.name.toLowerCase().includes(q) || g.blurb.toLowerCase().includes(q)) : []), [q]);
  const total = users.length + rooms.length + games.length;

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!q) return;
      setRecent((prev) => {
        const next = [query.trim(), ...prev.filter((r) => r.toLowerCase() !== q)].slice(0, 6);
        try {
          window.localStorage.setItem("vibetalk.searches", JSON.stringify(next));
        } catch {
          /* storage blocked — search still works */
        }
        return next;
      });
    }, 900);
    return () => window.clearTimeout(id);
  }, [q, query]);

  function setQuery(value: string, nextTab: Tab = tab) {
    const p = new URLSearchParams();
    if (value) p.set("q", value);
    if (nextTab !== "all") p.set("tab", nextTab);
    setParams(p, { replace: true });
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q) setQuery(query);
        }}
        className="relative"
      >
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/40" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, rooms or games…"
          className="w-full rounded-3xl border border-white/12 bg-ink-900/70 py-4 pl-12 pr-24 text-base outline-none transition placeholder:text-white/30 focus:border-vibe-400/70 focus:ring-4 focus:ring-vibe-500/15"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="tap absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/8 p-2 text-white/60 hover:text-white">
            <X className="size-4" />
          </button>
        ) : (
          <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/25 sm:flex">
            <CornerDownLeft className="size-3.5" /> search
          </span>
        )}
      </form>

      <div className="flex gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
        {([
          ["all", "Everything"],
          ["people", `People (${users.length})`],
          ["rooms", `Rooms (${rooms.length})`],
          ["games", `Games (${games.length})`],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setQuery(query, key)}
            className={cn(
              "tap flex-1 rounded-xl px-3 py-2 text-xs font-bold transition",
              tab === key ? "vibe-gradient text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!q && (
        <div className="space-y-5">
          <section>
            <SectionHeader title="Trending topics" subtitle="Tap to search" icon={<TrendingUp className="size-4.5 text-blush-300" />} />
            <div className="flex flex-wrap gap-1.5">
              {ROOM_TOPICS.map((t) => (
                <Chip key={t} onClick={() => setQuery(t, "rooms")}>
                  {t}
                </Chip>
              ))}
            </div>
          </section>

          {recent.length > 0 && (
            <section>
              <SectionHeader title="Recent searches" subtitle="Stored on this device" icon={<Sparkles className="size-4.5 text-vibe-200" />} action={<button onClick={() => { setRecent([]); try { window.localStorage.removeItem("vibetalk.searches"); } catch { /* noop */ } }} className="text-xs font-bold text-white/45 hover:text-white">Clear</button>} />
              <div className="flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <Chip key={r} onClick={() => setQuery(r)}>{r}</Chip>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeader title="People to meet" subtitle="Fresh conversations" icon={<Users className="size-4.5 text-mint-400" />} />
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleUsers.slice(0, 6).map((u) => <UserCard key={u.id} user={u} variant="row" />)}
            </div>
          </section>
        </div>
      )}

      {q && total === 0 && (
        <EmptyState
          icon={<SearchIcon className="size-6" />}
          title={`No matches for “${query.trim()}”`}
          body="Try a username, a room topic like “lo-fi”, or a game name. You can also start the room nobody's made yet."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setQuery("")}>Clear search</Button>
              <Button onClick={() => navigate("/rooms?create=1")} icon={<Mic className="size-4" />}>Create room</Button>
            </div>
          }
        />
      )}

      {q && total > 0 && (
        <div className="space-y-7">
          {(tab === "all" || tab === "people") && users.length > 0 && (
            <section>
              <SectionHeader title={`People · ${users.length}`} icon={<Users className="size-4.5 text-mint-400" />} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {users.slice(0, tab === "all" ? 4 : 12).map((u) => <UserCard key={u.id} user={u} />)}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "rooms") && rooms.length > 0 && (
            <section>
              <SectionHeader title={`Voice rooms · ${rooms.length}`} icon={<Mic className="size-4.5 text-vibe-200" />} />
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {rooms.slice(0, tab === "all" ? 3 : 9).map((r) => <RoomCard key={r.id} room={r} />)}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "games") && games.length > 0 && (
            <section>
              <SectionHeader title={`Games · ${games.length}`} icon={<Gamepad2 className="size-4.5 text-coin-400" />} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {games.map((g) => (
                  <Card key={g.key} interactive className="flex items-center gap-3 !rounded-2xl p-3.5">
                    <span className="grid size-10 place-items-center rounded-xl text-white" style={{ backgroundImage: g.hue }}>
                      <Dices className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{g.name}</p>
                      <p className="truncate text-[11px] text-white/45">{g.blurb}</p>
                    </div>
                    <button onClick={() => navigate("/games")} aria-label={`Open ${g.name}`} className="tap rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold text-white/70 hover:bg-white/14">
                      Play
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <Card className="flex items-center gap-3 !rounded-2xl p-3.5">
            <Avatar seed="tip" size={38} />
            <p className="text-xs text-white/55">
              Pro tip: searching a username like <span className="font-bold text-white/80">nova</span> then tapping{" "}
              <span className="font-bold text-white/80">Invite to room</span> is the fastest way to fill seats.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
