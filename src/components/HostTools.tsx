import { AlertTriangle, Crown, Gavel, Lock, Megaphone, Mic, Trash2, UserPlus, VolumeX } from "lucide-react";
import { useState } from "react";
import { Avatar, Button, Card, Field, Input, Toggle } from "./ui";
import { useStore } from "../store/StoreProvider";
import type { Room } from "../lib/types";
import { cn } from "../utils/cn";

export function HostTools({ room }: { room: Room }) {
  const {
    db,
    me,
    roomMutes,
    hostMute,
    hostKick,
    hostPromote,
    hostDemote,
    hostLock,
    hostEnd,
    hostAnnounce,
    hostApproveSpeaker,
    hostRejectSpeaker,
    hostPromoteCoHost,
    hostDemoteCoHost,
    userById,
    pushToast,
  } = useStore();
  const [note, setNote] = useState(room.announcement ?? "");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const isHost = me?.id === room.hostId;
  const isCoHost = !!room.coHostIds?.includes(me?.id ?? "");
  const isHostOrCoHost = isHost || isCoHost;
  const muted = roomMutes[room.id] ?? [];

  const listeners = db.users
    .filter((u) => u.id !== me?.id && !room.speakerIds.includes(u.id) && !db.blocked.includes(u.id))
    .slice(0, 5);

  const requests = (room.speakerRequests ?? []).map((id) => userById(id)).filter(Boolean);

  if (!isHostOrCoHost) {
    return (
      <Card className="flex items-center gap-3 !rounded-3xl border-white/8 p-4">
        <span className="grid size-10 place-items-center rounded-2xl bg-white/6 text-white/50">
          <Crown className="size-5" />
        </span>
        <p className="text-xs leading-relaxed text-white/50">
          Host & Co-host tools are available to room leaders. You can mute, manage speaker requests, lock, announce,
          and manage speakers — all demo controls, nothing is recorded.
        </p>
      </Card>
    );
  }

  return (
    <Card className="!rounded-3xl border-coin-400/25 bg-coin-500/[0.05] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-coin-500/18 text-coin-400 ring-1 ring-coin-400/30">
          <Gavel className="size-5" />
        </span>
        <div className="min-w-[180px] flex-1">
          <p className="font-display text-base font-extrabold">Host tools</p>
          <p className="text-[11px] text-white/45">Demo moderation · applies to this device only</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/55">
          {room.speakerIds.length}/{room.seats} seats
        </span>
      </div>

      <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
        <div className="space-y-2">
          {requests.length > 0 && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.08] p-3 mb-3">
              <p className="flex items-center justify-between text-[11px] font-bold text-amber-200 uppercase tracking-wider mb-2">
                <span>Raised Hands / Speaker Requests ({requests.length})</span>
              </p>
              <div className="space-y-1.5">
                {requests.map((u) => u && (
                  <div key={u.id} className="flex items-center gap-2 rounded-xl bg-black/40 p-2">
                    <Avatar user={u} size={28} showStatus />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">@{u.username}</p>
                      <p className="text-[10px] text-white/40">LV {u.level}</p>
                    </div>
                    <Button size="sm" onClick={() => hostApproveSpeaker(room.id, u.id)} className="!px-2.5 !py-1 text-xs">
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => hostRejectSpeaker(room.id, u.id)} className="!px-2 !py-1 text-xs text-white/40">
                      Decline
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">On mic</p>
          {room.speakerIds.map((id) => {
            const user = userById(id);
            if (!user) return null;
            const isMe = user.id === me?.id;
            const isMuted = muted.includes(user.id);
            const userIsCoHost = !!room.coHostIds?.includes(user.id);
            const userIsHost = user.id === room.hostId;
            return (
              <div key={id} className={cn("flex items-center gap-2.5 rounded-2xl border p-2.5", isMuted ? "border-rose-400/30 bg-rose-500/[0.07]" : "border-white/8 bg-white/[0.03]")}>
                <Avatar user={user} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-xs font-bold">
                    @{user.username}
                    {userIsHost && <span className="rounded-full bg-coin-400/20 px-1.5 py-0.2 text-[8px] font-black text-coin-400">HOST</span>}
                    {userIsCoHost && <span className="rounded-full bg-vibe-600/30 px-1.5 py-0.2 text-[8px] font-black text-vibe-200">CO-HOST</span>}
                    {isMe && <span className="text-white/40">(you)</span>}
                  </p>
                  <p className="text-[10px] text-white/40">{isMuted ? "muted by host" : "speaker"} · LV {user.level}</p>
                </div>
                {!isMe && !userIsHost && (
                  <div className="flex shrink-0 items-center gap-1">
                    {isHost && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="!px-2 text-[10px]"
                        onClick={() => userIsCoHost ? hostDemoteCoHost(room.id, user.id) : hostPromoteCoHost(room.id, user.id)}
                        title={userIsCoHost ? "Demote from Co-Host" : "Promote to Co-Host"}
                      >
                        <Crown className={cn("size-3.5", userIsCoHost ? "text-vibe-300" : "text-white/40")} />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="!px-2" onClick={() => hostMute(room.id, user.id, !isMuted)} aria-label={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <Mic className="size-3.5" /> : <VolumeX className="size-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="!px-2" onClick={() => hostDemote(room.id, user.id)} aria-label="Move to audience">
                      <UserPlus className="size-3.5 rotate-180" />
                    </Button>
                    <Button size="sm" variant="danger" className="!px-2" onClick={() => hostKick(room.id, user.id)} aria-label="Remove from room">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          <p className="pt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Audience · invite to mic</p>
          {listeners.map((user) => (
            <div key={user.id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
              <Avatar user={user} size={30} showStatus />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">@{user.username}</p>
                <p className="text-[10px] text-white/40">listening · {user.online ? "online" : "idle"}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => hostPromote(room.id, user.id)} icon={<Mic className="size-3.5" />}>
                Give mic
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <Field label="Room announcement" hint="pinned to the stage + chat">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={140}
              placeholder="Tonight: 2-minute intros, then open mic"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { hostAnnounce(room.id, note); pushToast("Announcement pinned", "ok"); }} disabled={!note.trim()} icon={<Megaphone className="size-3.5" />}>
              Pin announcement
            </Button>
            <Button
              size="sm"
              variant="soft"
              onClick={() => {
                hostAnnounce(room.id, "");
                setNote("");
              }}
              disabled={!room.announcement}
            >
              Clear
            </Button>
          </div>

          <div className="grid gap-2 pt-1">
            <Toggle
              checked={!!room.locked}
              onChange={(v) => hostLock(room.id, v)}
              label="Lock room (invite only)"
              description="New members can preview but can't join the stage"
            />
            <div className={cn("rounded-2xl border p-3.5", confirmEnd ? "border-rose-400/50 bg-rose-500/10" : "border-white/8 bg-white/[0.03]")}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("size-4", confirmEnd ? "text-rose-300" : "text-white/40")} />
                <p className="text-xs font-bold">{confirmEnd ? "End this room for everyone?" : "End room"}</p>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                The room stays listed as scheduled so people can see what they missed. You can relaunch it any time.
              </p>
              <div className="mt-2.5 flex gap-2">
                {confirmEnd ? (
                  <>
                    <Button size="sm" variant="danger" icon={<Lock className="size-3.5" />} onClick={() => { hostEnd(room.id); setConfirmEnd(false); }}>
                      Yes, end it
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmEnd(false)}>
                      Keep live
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setConfirmEnd(true)}>
                    End room
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
