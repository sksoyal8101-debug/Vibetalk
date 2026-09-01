import { ArrowUpRight, Heart, Mic, Star, Trash2, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { RoomCard } from "../components/RoomCard";
import { UserCard } from "../components/UserCard";
import { Avatar, Button, Card, EmptyState, SectionHeader } from "../components/ui";
import { useStore } from "../store/StoreProvider";
import { categoryMeta } from "../lib/social";
import { compact } from "../lib/utils";
import { cn } from "../utils/cn";

export function Favorites() {
  const { db, me, favorites, toggleFavoriteRoom, toggleFavoriteUser, userById } = useStore();
  const navigate = useNavigate();

  const users = favorites.users.map((id) => userById(id)).filter(Boolean) as NonNullable<ReturnType<typeof userById>>[];
  const rooms = db.rooms.filter((r) => favorites.rooms.includes(r.id));
  const online = users.filter((u) => u.online);

  return (
    <div className="space-y-6">
      <Card className="relative flex flex-wrap items-center gap-4 overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-20 size-56 rounded-full bg-blush-500/25 blur-3xl" />
        <span className="relative grid size-14 place-items-center rounded-3xl bg-blush-500/18 text-blush-300 ring-1 ring-blush-400/30">
          <Heart className="size-7" />
        </span>
        <div className="relative min-w-[220px] flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Your favourites</h1>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Star a member to get an alert when they go live in a room. Star a room to keep it one tap away. Saved on
            this device, private to you.
          </p>
        </div>
        <div className="relative flex gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/65">
            {users.length} people
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/65">
            {rooms.length} rooms
          </span>
        </div>
      </Card>

      <section>
        <SectionHeader
          title="Favourite hosts"
          subtitle={online.length > 0 ? `${online.length} online right now` : "Nobody online — they'll ping you when they arrive"}
          icon={<Users className="size-4.5 text-mint-400" />}
          action={
            <Link to="/search" className="inline-flex items-center gap-1 text-xs font-bold text-vibe-200 hover:text-white">
              Find members <ArrowUpRight className="size-3.5" />
            </Link>
          }
        />
        {users.length === 0 ? (
          <EmptyState
            icon={<Star className="size-6" />}
            title="No favourite people yet"
            body="Tap the star on any profile or member card. Favourites get a notification the moment that host opens a live room."
            action={<Button onClick={() => navigate("/search")}>Browse members</Button>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {users.map((u) => {
              const hosting = db.rooms.find((r) => r.hostId === u.id && r.live);
              return (
                <Card key={u.id} className="relative !rounded-3xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={u} size={52} showStatus />
                    <div className="min-w-0 flex-1">
                      <Link to={`/u/${u.id}`} className="truncate text-sm font-bold hover:underline">
                        @{u.username}
                      </Link>
                      <p className="truncate text-[11px] text-white/45">
                        {u.country} · {compact(u.followers)} followers
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavoriteUser(u.id)}
                      aria-label={`Unfavourite ${u.username}`}
                      className="tap grid size-9 place-items-center rounded-xl bg-blush-500/15 text-blush-300 hover:bg-blush-500/25"
                    >
                      <Star className="size-4 fill-current" />
                    </button>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-[11px] leading-relaxed text-white/50">{u.bio}</p>
                  {hosting ? (
                    <Link
                      to={`/rooms/${hosting.id}`}
                      className={cn("tap mt-3 flex items-center gap-2 rounded-2xl border border-mint-400/40 bg-mint-400/10 px-3 py-2 text-xs font-bold text-mint-400")}
                    >
                      <Mic className="size-4" /> Live in “{hosting.title.slice(0, 22)}”
                      <span className="ml-auto text-[10px] uppercase tracking-widest">join</span>
                    </Link>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Link to={`/messages?with=${u.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">Message</Button>
                      </Link>
                      <Link to="/rooms" className="flex-1">
                        <Button size="sm" variant="soft" className="w-full">Find a room</Button>
                      </Link>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Favourite rooms" subtitle="Saved seats and regulars' tables" icon={<Star className="size-4.5 text-coin-400" />} />
        {rooms.length === 0 ? (
          <EmptyState
            icon={<Mic className="size-6" />}
            title="No favourite rooms yet"
            body="Open any room and tap the star in the header. Favourited rooms show their live status right here."
            action={<Button onClick={() => navigate("/rooms")}>Browse rooms</Button>}
          />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((r) => (
                <div key={r.id} className="relative">
                  <RoomCard room={r} />
                  <button
                    onClick={() => toggleFavoriteRoom(r.id)}
                    aria-label="Unfavourite room"
                    className="tap absolute right-3 top-[86px] grid size-9 place-items-center rounded-xl bg-ink-950/80 text-blush-300 ring-1 ring-white/15 hover:bg-ink-900"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <Card className="!rounded-3xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Category mix you like</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...new Set(rooms.map((r) => r.category))].map((c) => {
                  const meta = categoryMeta(c);
                  const n = rooms.filter((r) => r.category === c).length;
                  return (
                    <span key={c} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/70">
                      <span className="grid size-6 place-items-center rounded-lg text-white" style={{ backgroundImage: meta.hue }}>
                        <meta.icon className="size-3.5" />
                      </span>
                      {c} · {n}
                    </span>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </section>

      {users.length > 0 && (
        <section>
          <SectionHeader title="People you might favourite next" subtitle="Chosen from your follows and activity" icon={<Users className="size-4.5 text-vibe-200" />} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {db.users
              .filter((u) => u.id !== me?.id && !favorites.users.includes(u.id) && !db.blocked.includes(u.id))
              .sort((a, b) => b.followers - a.followers)
              .slice(0, 4)
              .map((u) => (
                <UserCard key={u.id} user={u} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
