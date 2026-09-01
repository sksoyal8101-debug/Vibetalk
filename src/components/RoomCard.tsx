import { Headphones, Lock, Mic, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ROOM_COVERS } from "../lib/data";
import type { Room } from "../lib/types";
import { useStore } from "../store/StoreProvider";
import { timeAgo } from "../lib/utils";
import { cn } from "../utils/cn";
import { Avatar, Chip, Equalizer, LiveDot } from "./ui";

export function RoomCard({ room, className, style }: { room: Room; className?: string; style?: React.CSSProperties }) {
  const { userById, db, currentRoomId } = useStore();
  const host = userById(room.hostId);
  const speakers = room.speakerIds.map((id) => userById(id)).filter(Boolean).slice(0, 4);
  const inRoom = currentRoomId === room.id;
  const messageCount = db.chats.filter((c) => c.roomId === room.id).length;

  return (
    <Link
      to={`/rooms/${room.id}`}
      style={style}
      className={cn(
        "tap group relative flex flex-col overflow-hidden rounded-3xl border bg-ink-900/60 transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_70px_-32px_rgba(236,72,153,0.75)]",
        inRoom ? "border-mint-400/50" : "border-white/8 hover:border-vibe-400/40",
        className,
      )}
    >
      <div className="relative h-24 w-full overflow-hidden" style={{ backgroundImage: ROOM_COVERS[room.cover % ROOM_COVERS.length] }}>
        <div className="absolute inset-0 opacity-40 mix-blend-soft-light [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.7),transparent_45%),repeating-linear-gradient(115deg,transparent_0_14px,rgba(0,0,0,.25)_14px_15px)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/25 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {room.live ? <LiveDot /> : <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black tracking-[0.14em] text-white/60">SOON</span>}
          {room.createdByUser && <span className="rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold text-white/70">Your room</span>}
          {inRoom && <span className="rounded-full bg-mint-400/20 px-2 py-1 text-[10px] font-black tracking-wider text-mint-400">IN ROOM</span>}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] font-bold text-white/85">
          <Headphones className="size-3" />
          {room.listeners}
        </div>
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <span className="truncate text-xs font-bold text-white/85">@{host?.username ?? "you"}</span>
          <Equalizer active={room.live} bars={5} className="h-4" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <Chip className="pointer-events-none !px-2.5 !py-1 text-[10px]">{room.category || room.topic}</Chip>
          {room.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-200">
              <Lock className="size-2.5" /> Invite
            </span>
          )}
          {room.coHostIds && room.coHostIds.length > 0 && (
            <span className="rounded-full bg-vibe-600/20 px-2 py-0.5 text-[9px] font-bold text-vibe-200">
              Co-host
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 font-display text-[15px] font-bold leading-snug">{room.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-white/45">{room.description}</p>
        {room.tags && room.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {room.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-bold text-vibe-200/80">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2.5">
            {speakers.map((u) => u && <Avatar key={u.id} user={u} size={26} className="ring-2 ring-ink-900" />)}
            {room.listeners > speakers.length && (
              <span className="grid size-[26px] place-items-center rounded-full bg-white/10 text-[9px] font-bold text-white/70 ring-2 ring-ink-900">
                +{Math.max(1, room.listeners - speakers.length)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{room.speakerIds.length}/{room.seats}</span>
            <span className="inline-flex items-center gap-1"><Mic className="size-3.5" />{messageCount}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">started {timeAgo(room.createdAt)} ago</span>
          <span className="vibe-gradient rounded-full px-3 py-1.5 text-[11px] font-bold text-white transition group-hover:shadow-[0_10px_24px_-12px_rgba(236,72,153,0.95)]">
            {room.live ? "Join room" : "Preview"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CreateRoomCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tap group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition hover:border-vibe-400/60 hover:bg-vibe-600/10"
    >
      <span className="grid size-12 place-items-center rounded-2xl vibe-gradient text-white shadow-[0_14px_36px_-16px_rgba(168,85,247,0.9)] transition group-hover:scale-110">
        <Plus className="size-6" />
      </span>
      <span>
        <span className="block font-display text-base font-bold">Create a room</span>
        <span className="mt-1 block text-xs text-white/45">Pick a topic, seats and cover. Demo audio.</span>
      </span>
    </button>
  );
}

export function LockedRoomBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white/60">
      <Lock className="size-3" /> invite only
    </span>
  );
}
