import {
  ArrowLeft,
  CalendarClock,
  Copy,
  Crown,
  FileText,
  Flag,
  Gavel,
  Gift,
  Hand,
  Headphones,
  Heart,
  Lock,
  LogOut,
  Megaphone,
  MessageSquare,
  Mic,
  MicOff,
  Pencil,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GiftSheet } from "../components/GiftSheet";
import { ReportDialog } from "../components/ReportDialog";
import { HostTools } from "../components/HostTools";
import { EventCard } from "../components/discover";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Equalizer,
  Field,
  IconButton,
  Input,
  LiveDot,
  Modal,
  SectionHeader,
  Select,
  Textarea,
  Reveal,
  useReady,
} from "../components/ui";
import { BOT_LINES, EMOJI_PICKS, ROOM_COVERS, ROOM_TOPICS } from "../lib/data";
import { categoryMeta, upcomingEvents } from "../lib/social";
import { ROOM_CATEGORIES } from "../lib/rooms";
import { useStore } from "../store/StoreProvider";
import type { Room } from "../lib/types";
import { clockTime } from "../lib/utils";
import { cn } from "../utils/cn";

export function RoomDetail() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const {
    db,
    me,
    userById,
    currentRoomId,
    joinRoom,
    leaveRoom,
    postRoomChat,
    deleteRoom,
    updateRoom,
    visibleUsers,
    addNotification,
    pushToast,
    myFollows,
    toggleFollow,
    isFavoriteRoom,
    toggleFavoriteRoom,
    roomMutes,
    requestToSpeak,
    cancelSpeakRequest,
    sendRoomReaction,
  } = useStore();
  const room = db.rooms.find((r) => r.id === roomId);

  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [giftTarget, setGiftTarget] = useState<string | null>(null);
  const [panel, setPanel] = useState<"chat" | "people">("chat");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const ready = useReady(300);
  const scroller = useRef<HTMLDivElement>(null);

  const inRoom = currentRoomId === roomId;
  const joined = inRoom && !!me && (room?.speakerIds.includes(me.id) ?? false);

  const triggerReaction = useCallback((emoji: string, broadcast = true) => {
    if (!room) return;
    if (broadcast) sendRoomReaction(room.id, emoji);
    const id = Math.random().toString(36).slice(2, 9);
    const x = Math.round((Math.random() - 0.5) * 220);
    setFloatingReactions((prev) => [...prev.slice(-10), { id, emoji, x }]);
    window.setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  }, [room, sendRoomReaction]);

  const chats = useMemo(() => db.chats.filter((c) => c.roomId === roomId).sort((a, b) => a.at - b.at), [db.chats, roomId]);
  const participants = useMemo(
    () => (room ? (room.speakerIds.map((id) => userById(id)).filter(Boolean) as NonNullable<ReturnType<typeof userById>>[]) : []),
    [room, userById],
  );
  const roomEvents = useMemo(() => (room ? upcomingEvents(db, 40).filter((e) => e.roomId === room.id) : []), [db, room]);

  useEffect(() => {
    if (!inRoom || !room) return;
    const pool = room.speakerIds.filter((id) => id !== me?.id);
    const speak = window.setInterval(() => {
      if (pool.length === 0) return setSpeakingId(null);
      setSpeakingId(pool[Math.floor(Math.random() * pool.length)]);
    }, 2600);
    const chat = window.setInterval(() => {
      const who = pool[Math.floor(Math.random() * pool.length)];
      if (!who) return;
      setTyping(userById(who)?.username ?? null);
      window.setTimeout(() => {
        setTyping(null);
        postRoomChat(roomId, BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]);
      }, 1200);
    }, 9000);
    const reactInterval = window.setInterval(() => {
      const emojis = ["❤️", "🔥", "👏", "👑", "🎉", "✨", "🎧"];
      const pick = emojis[Math.floor(Math.random() * emojis.length)];
      triggerReaction(pick, false);
    }, 8500);
    return () => {
      window.clearInterval(speak);
      window.clearInterval(chat);
      window.clearInterval(reactInterval);
      setTyping(null);
    };
  }, [inRoom, postRoomChat, room, roomId, me?.id, triggerReaction, userById]);

  useEffect(() => {
    if (!inRoom) return;
    const t = window.setTimeout(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }), 70);
    return () => window.clearTimeout(t);
  }, [chats.length, inRoom]);

  useEffect(() => {
    setMicOn(joined);
  }, [joined]);

  if (!room) {
    return (
      <EmptyState
        icon={<Users className="size-6" />}
        title="This room has closed"
        body="It may have been deleted from this device after a demo-data reset. Nothing is lost — hop into another room."
        action={<Button onClick={() => navigate("/rooms")} icon={<ArrowLeft className="size-4" />}>Back to rooms</Button>}
      />
    );
  }

  const host = userById(room.hostId);
  const isHost = me?.id === room.hostId;
  const isCoHost = !!room.coHostIds?.includes(me?.id ?? "");
  const isHostOrCoHost = isHost || isCoHost;
  const isSpeaker = !!room.speakerIds.includes(me?.id ?? "");
  const isListener = inRoom && !isSpeaker && !isHost && !isCoHost;
  const hasRequestedToSpeak = !!room.speakerRequests?.includes(me?.id ?? "");
  const cat = categoryMeta(room.category);
  const mutedList = roomMutes[room.id] ?? [];
  const seatCount = Math.max(room.seats, participants.length);
  const seats = Array.from({ length: seatCount }, (_, i) => participants[i] ?? null);
  const fav = isFavoriteRoom(room.id);

  function tryJoin(asSpeaker = true) {
    const ok = joinRoom(roomId, asSpeaker);
    if (ok) setMicOn(asSpeaker);
  }

  function send() {
    const text = draft.trim();
    if (!text || !inRoom) return;
    postRoomChat(roomId, text);
    setDraft("");
    setShowEmoji(false);
    if (Math.random() > 0.45) {
      const pool = room!.speakerIds.filter((id) => id !== me?.id);
      const who = pool[Math.floor(Math.random() * pool.length)];
      if (who) {
        setTyping(userById(who)?.username ?? null);
        window.setTimeout(() => {
          setTyping(null);
          postRoomChat(roomId, BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]);
        }, 1400);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link to="/rooms" className="tap inline-flex items-center gap-1.5 text-xs font-bold text-white/55 hover:text-white">
          <ArrowLeft className="size-4" /> All rooms
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
            Demo voice room
          </span>
          <IconButton label={fav ? "Remove from favourites" : "Add to favourites"} onClick={() => toggleFavoriteRoom(room.id)} className={cn("size-9", fav && "border-coin-400/40 bg-coin-500/15 text-coin-400")}>
            <Star className={cn("size-4", fav && "fill-current")} />
          </IconButton>
          <IconButton label="Report room" onClick={() => setShowReport(true)} className="size-9">
            <Flag className="size-4" />
          </IconButton>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* --------------------------------- Stage -------------------------------- */}
        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-[28px] border border-white/10">
            <div className="absolute inset-0" style={{ backgroundImage: ROOM_COVERS[room.cover % ROOM_COVERS.length] }} />
            <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(118deg,transparent_0_22px,rgba(255,255,255,.2)_22px_23px)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/78 to-ink-950" />

            <div className="relative p-5">
              <div className="flex flex-wrap items-center gap-2">
                <LiveDot label={room.live ? "LIVE" : "SOON"} />
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/75">
                  <cat.icon className="size-3" /> {room.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/85">
                  <Headphones className="size-3.5" /> {room.listeners}
                </span>
                {room.locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
                    <Lock className="size-3" /> invite only
                  </span>
                )}
                {isHost && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-coin-400/20 px-2.5 py-1 text-[10px] font-black tracking-wider text-coin-400">
                    <Crown className="size-3" /> YOU HOST
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-display text-[26px] font-extrabold leading-tight sm:text-3xl">{room.title}</h1>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/65">{room.description}</p>
                  {room.tags && room.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {room.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-vibe-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <IconButton label="Share room" onClick={() => setShowShare(true)} className="size-9 bg-black/40 text-white/70 hover:text-white">
                    <Share2 className="size-4" />
                  </IconButton>
                  <IconButton label="Room rules" onClick={() => setShowRules(true)} className="size-9 bg-black/40 text-white/70 hover:text-white">
                    <FileText className="size-4" />
                  </IconButton>
                  {isHostOrCoHost && (
                    <IconButton label="Host tools" onClick={() => setShowTools((s) => !s)} className={cn("size-9 bg-black/40", showTools && "text-coin-400")}>
                      <Gavel className="size-4" />
                    </IconButton>
                  )}
                  {isHost && (
                    <>
                      <IconButton label="Edit room" onClick={() => setEditing(true)} className="size-9 bg-black/40">
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label="Close room" className="size-9 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30" onClick={() => { deleteRoom(room.id); navigate("/rooms"); }}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>

              {room.announcement && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-coin-400/30 bg-coin-500/[0.1] p-3">
                  <Megaphone className="mt-0.5 size-4 shrink-0 text-coin-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-coin-400">Host announcement</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/85">{room.announcement}</p>
                  </div>
                </div>
              )}

              {/* host strip */}
              {host && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-black/35 p-3 backdrop-blur-sm">
                  <Link to={`/u/${host.id}`} className="tap flex min-w-0 flex-1 items-center gap-3">
                    <Avatar user={host} size={44} showStatus />
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Host</span>
                      <span className="block truncate text-sm font-extrabold">@{host.username}</span>
                      <span className="block truncate text-[11px] text-white/45">
                        LV {host.level} · {host.followers.toLocaleString()} followers · {host.sparkles.toLocaleString()} sparkles
                      </span>
                    </span>
                  </Link>
                  {host.id !== me?.id && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={myFollows.includes(host.id) ? "soft" : "primary"}
                        icon={myFollows.includes(host.id) ? <Sparkles className="size-3.5" /> : <UserPlus className="size-3.5" />}
                        onClick={() => {
                          toggleFollow(host.id);
                          if (!myFollows.includes(host.id)) {
                            addNotification({ type: "favorite", title: `You follow @${host.username}`, body: "We'll ping you when this host goes live.", actorId: host.id, link: `/rooms/${room.id}` });
                          }
                        }}
                      >
                        {myFollows.includes(host.id) ? "Following host" : "Follow host"}
                      </Button>
                      <Link to={`/messages?with=${host.id}`}>
                        <Button size="sm" variant="outline" icon={<MessageSquare className="size-3.5" />}>DM</Button>
                      </Link>
                      <Button size="sm" variant="ghost" icon={<Gift className="size-3.5" />} onClick={() => { setGiftTarget(host.id); setShowGift(true); }}>
                        Gift
                      </Button>
                    </div>
                  )}
                  {host.id === me?.id && (
                    <span className="shrink-0 rounded-full bg-vibe-600/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-vibe-200">
                      That's you
                    </span>
                  )}
                </div>
              )}

              {/* seats */}
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {!ready &&
                  Array.from({ length: Math.min(6, seatCount) }, (_, i) => (
                    <div key={`sk-${i}`} className="animate-shimmer aspect-[3/3.4] rounded-3xl bg-white/[0.05]" />
                  ))}
                {ready &&
                  seats.map((user, i) => {
                  const isMeSeat = user?.id === me?.id;
                  const speaking = user && speakingId === user.id && inRoom;
                  const seatMuted = user ? mutedList.includes(user.id) : false;
                  if (!user) {
                    return (
                      <button
                        key={`empty-${i}`}
                        onClick={() => (inRoom ? tryJoin(true) : tryJoin(true))}
                        className={cn(
                          "tap flex aspect-[3/3.4] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed transition",
                          inRoom ? "border-white/25 bg-white/[0.05] text-white/60 hover:border-vibe-400/70 hover:text-white" : "border-white/12 bg-black/25 text-white/30",
                        )}
                      >
                        <span className="grid size-9 place-items-center rounded-full bg-white/8"><UserPlus className="size-4" /></span>
                        <span className="text-[10px] font-bold">{inRoom ? "Take seat" : "Join to speak"}</span>
                      </button>
                    );
                  }
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "group relative flex aspect-[3/3.4] flex-col items-center justify-center gap-2 rounded-3xl border bg-black/35 backdrop-blur-sm transition",
                        seatMuted ? "border-rose-400/40" : speaking ? "border-mint-400/60 shadow-[0_0_40px_-12px_rgba(52,211,153,0.55)]" : "border-white/10",
                      )}
                    >
                      {speaking && !seatMuted && <span className="animate-ring absolute inset-0 rounded-3xl border border-mint-400/50" />}
                      <div className="relative">
                        <Avatar user={user} size={52} />
                        {user.id === room.hostId && (
                          <span className="absolute -bottom-1 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-coin-400 text-ink-950">
                            <Crown className="size-3" />
                          </span>
                        )}
                      </div>
                      <p className="w-full truncate px-2 text-center text-[11px] font-bold">@{user.username}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/45">
                        {seatMuted ? <MicOff className="size-3 text-rose-300" /> : speaking ? <Equalizer bars={3} className="h-2.5" /> : <Mic className="size-3" />}
                        <span>LV {user.level}</span>
                      </div>
                      {!isMeSeat && (
                        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button onClick={() => { setGiftTarget(user.id); setShowGift(true); }} aria-label={`Gift ${user.username}`} className="tap grid size-6 place-items-center rounded-full bg-black/60 text-white/70 hover:text-blush-300">
                            <Gift className="size-3" />
                          </button>
                          {isHost && (
                            <button onClick={() => updateRoom(room.id, { hostId: user.id })} aria-label="Make host" className="tap grid size-6 place-items-center rounded-full bg-black/60 text-white/70 hover:text-coin-400">
                              <Crown className="size-3" />
                            </button>
                          )}
                        </div>
                      )}
                      {isMeSeat && <span className="absolute left-1.5 top-1.5 rounded-full bg-vibe-500/30 px-1.5 py-0.5 text-[8px] font-black tracking-wide text-vibe-200">YOU</span>}
                    </div>
                  );
                })}
              </div>

              {/* control bar */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  variant={joined && micOn ? "primary" : "soft"}
                  onClick={() => {
                    if (!joined) { tryJoin(true); return; }
                    setMicOn((v) => !v);
                  }}
                  icon={joined && micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                  className={cn(joined && micOn && "shadow-[0_0_30px_-6px_rgba(52,211,153,0.6)] ring-1 ring-mint-400/50")}
                >
                  {joined ? (micOn ? "Mute mic" : "Unmute mic") : "Join & unmute"}
                </Button>

                {!joined && (
                  <Button variant="outline" onClick={() => tryJoin(false)} icon={<Headphones className="size-4" />}>
                    Join as listener
                  </Button>
                )}

                <IconButton
                  label={speakerOn ? "Mute speaker" : "Unmute speaker"}
                  onClick={() => { setSpeakerOn((s) => !s); pushToast(speakerOn ? "Speaker muted (demo)" : "Speaker on (demo)", "info"); }}
                  className={cn("size-11", speakerOn ? "bg-white/12 text-white" : "bg-rose-500/20 text-rose-200")}
                >
                  {speakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </IconButton>

                <IconButton
                  label={handRaised ? "Lower hand" : "Raise hand"}
                  onClick={() => { setHandRaised((h) => !h); pushToast(handRaised ? "Hand lowered" : "Hand raised — the host can see you", handRaised ? "info" : "ok"); }}
                  className={cn("size-11", handRaised ? "bg-coin-400/25 text-coin-400" : "bg-white/8 text-white/70")}
                >
                  <Hand className="size-5" />
                </IconButton>

                <IconButton label="Send a gift" onClick={() => { setGiftTarget(host?.id ?? room.speakerIds[0] ?? null); setShowGift(true); }} className="size-11 bg-blush-500/18 text-blush-300">
                  <Gift className="size-5" />
                </IconButton>

                <IconButton label="Invite people" onClick={() => setShowInvite(true)} className="size-11 bg-white/8 text-white/75">
                  <UserPlus className="size-5" />
                </IconButton>

                {isHostOrCoHost && (
                  <IconButton label="Host tools" onClick={() => setShowTools((s) => !s)} className={cn("size-11", showTools ? "bg-coin-500/20 text-coin-400" : "bg-white/8 text-white/75")}>
                    <Gavel className="size-5" />
                  </IconButton>
                )}

                {isListener && (
                  <Button
                    variant={hasRequestedToSpeak ? "soft" : "primary"}
                    onClick={() => {
                      if (hasRequestedToSpeak) {
                        cancelSpeakRequest(room.id);
                        setHandRaised(false);
                      } else {
                        requestToSpeak(room.id);
                        setHandRaised(true);
                      }
                    }}
                    icon={<Hand className="size-4" />}
                    className={cn(hasRequestedToSpeak && "border-amber-400/50 text-amber-200")}
                  >
                    {hasRequestedToSpeak ? "Hand raised" : "Request mic"}
                  </Button>
                )}

                {inRoom && (
                  <Button variant="danger" onClick={() => setConfirmLeave(true)} icon={<LogOut className="size-4" />} className="ml-auto">
                    Leave room
                  </Button>
                )}
              </div>

              {/* floating live reactions container */}
              <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center overflow-hidden pb-16">
                {floatingReactions.map((rx) => (
                  <div
                    key={rx.id}
                    className="room-reaction-bubble absolute select-none text-3xl"
                    style={{ ["--rx" as string]: `${rx.x}px` }}
                  >
                    {rx.emoji}
                  </div>
                ))}
              </div>

              {/* Quick reactions bar */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/8 pt-3">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <Sparkles className="size-3 text-vibe-200" /> React:
                </span>
                <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
                  {["❤️", "🔥", "👏", "👑", "🎉", "✨", "🎧", "💯"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => triggerReaction(emoji)}
                      className="tap flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/6 text-sm transition hover:scale-115 hover:bg-white/14"
                      aria-label={`React ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {!inRoom && (
                <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white/60">
                  <ShieldAlert className="size-4 shrink-0 text-vibe-200" />
                  {room.locked && !isHost ? "Locked room — the host only lets invited members on stage." : "You're previewing. Join to take a mic seat and use the room chat — demo only, no microphone is requested."}
                  <button onClick={() => tryJoin(true)} className="tap ml-auto shrink-0 rounded-full vibe-gradient px-3 py-1.5 font-bold text-white">
                    {room.locked && !isHost ? "Request a seat" : "Join room"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {isHost && showTools && <HostTools room={room} />}

          {roomEvents.length > 0 && (
            <section>
              <SectionHeader title="Events in this room" subtitle="Scheduled by hosts" icon={<CalendarClock className="size-4.5 text-vibe-200" />} />
              <div className="grid gap-3 sm:grid-cols-2">
                {roomEvents.slice(0, 2).map((e) => <EventCard key={e.id} eventId={e.id} dense />)}
              </div>
            </section>
          )}

          <Reveal>
            <Card className="flex flex-wrap items-center gap-3 !rounded-3xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Room rules</span>
              <p className="text-xs text-white/55">18+ only · no hate speech · no solicitation · no gambling or money requests · be a decent human.</p>
              <Link to="/safety" className="ml-auto text-xs font-bold text-vibe-200 hover:text-white">Community guidelines →</Link>
            </Card>
          </Reveal>
        </div>

        {/* -------------------------------- Side panel ------------------------------ */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-ink-900/70 lg:h-[calc(100dvh-140px)]">
          <div className="flex items-center gap-1 border-b border-white/8 p-2">
            {([
              ["chat", "Room chat", MessageSquare],
              ["people", `People (${participants.length})`, Users],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setPanel(key)}
                className={cn(
                  "tap flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition",
                  panel === key ? "vibe-gradient text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          {panel === "chat" ? (
            <>
              <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4">
                {chats.length === 0 && (
                  <div className="mt-6 text-center">
                    <p className="text-sm font-bold text-white/70">The chat is quiet</p>
                    <p className="mx-auto mt-1 max-w-[220px] text-xs text-white/40">Say something to break the ice — each message earns 12 xp in this demo.</p>
                  </div>
                )}
                {chats.map((c) => {
                  const author = c.userId === "system" ? null : userById(c.userId);
                  if (!author) {
                    return (
                      <p key={c.id} className={cn("text-center text-[11px] font-semibold uppercase tracking-wider", c.kind === "announce" ? "text-coin-400" : "text-white/30")}>
                        {c.text}
                      </p>
                    );
                  }
                  const mine = author.id === me?.id;
                  return (
                    <div key={c.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                      <Avatar user={author} size={30} />
                      <div className={cn("max-w-[80%]", mine && "text-right")}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">@{author.username} · {clockTime(c.at)}</p>
                        <p
                          className={cn(
                            "mt-1 inline-block rounded-2xl px-3 py-2 text-[13px] leading-snug",
                            c.kind === "gift" ? "border border-blush-400/40 bg-blush-500/15 text-blush-200" : mine ? "vibe-gradient text-white" : "border border-white/10 bg-white/[0.06] text-white/85",
                          )}
                        >
                          {c.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <p className="flex items-center gap-2 text-[11px] text-white/40">
                    <Equalizer bars={3} className="h-2.5" /> @{typing} is typing…
                  </p>
                )}
              </div>

              <div className="border-t border-white/8 p-3">
                {showEmoji && (
                  <div className="mb-2 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                    {EMOJI_PICKS.map((e) => (
                      <button key={e} onClick={() => setDraft((d) => d + e)} className="tap rounded-lg px-1.5 py-1 text-lg hover:bg-white/10">{e}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <IconButton label="Emoji" onClick={() => setShowEmoji((s) => !s)} className="size-11 shrink-0"><Smile className="size-5" /></IconButton>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    maxLength={280}
                    placeholder={inRoom ? "Say something kind…" : "Join the room to chat"}
                    disabled={!inRoom}
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/12 bg-ink-950/70 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70 disabled:opacity-50"
                  />
                  <IconButton label="Send message" onClick={send} disabled={!draft.trim() || !inRoom} className="vibe-gradient size-11 shrink-0 border-0 text-white">
                    <Send className="size-4.5" />
                  </IconButton>
                </div>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-white/25">
                  <Zap className="size-3" /> Demo chat · +12 xp per message · stored locally
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {room.speakerRequests && room.speakerRequests.length > 0 && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-200 mb-1.5 flex items-center gap-1">
                    <Hand className="size-3" /> Speaker Requests ({room.speakerRequests.length})
                  </p>
                  <div className="space-y-1.5">
                    {room.speakerRequests.map((reqId) => {
                      const reqUser = userById(reqId);
                      if (!reqUser) return null;
                      return (
                        <div key={reqId} className="flex items-center gap-2 rounded-xl bg-black/40 p-2">
                          <Avatar user={reqUser} size={28} showStatus />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white">@{reqUser.username}</p>
                            <p className="text-[10px] text-white/40">LV {reqUser.level}</p>
                          </div>
                          {isHostOrCoHost && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => host?.id && userById(reqId) && joinRoom(room.id, true)}
                                className="tap rounded-lg bg-mint-400/20 text-mint-300 px-2 py-1 text-[10px] font-bold"
                              >
                                Accept
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 mb-2">Stage Roles</p>
                <div className="space-y-2">
                  {participants.map((u) => (
                    <PeopleRow
                      key={u.id}
                      userId={u.id}
                      roomId={room.id}
                      isHost={isHostOrCoHost}
                      muted={mutedList.includes(u.id)}
                      onGift={() => { setGiftTarget(u.id); setShowGift(true); }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 mb-2">Audience ({room.listeners})</p>
                <div className="space-y-2">
                  {visibleUsers.filter((u) => !room.speakerIds.includes(u.id)).slice(0, 8).map((u) => (
                    <PeopleRow
                      key={u.id}
                      userId={u.id}
                      roomId={room.id}
                      isHost={isHostOrCoHost}
                      muted={false}
                      onGift={() => { setGiftTarget(u.id); setShowGift(true); }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Card className="!rounded-3xl p-4">
        <SectionHeader title="Also happening" subtitle="Jump into another demo room" icon={<Sparkles className="size-4.5 text-vibe-200" />} />
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {db.rooms
            .filter((r) => r.id !== room.id)
            .slice(0, 6)
            .map((r) => {
              const meta = categoryMeta(r.category);
              return (
                <Link key={r.id} to={`/rooms/${r.id}`} className="tap w-[196px] shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-3 hover:border-vibe-400/40">
                  <span className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/45">
                    <span className="grid size-5 place-items-center rounded-lg text-white" style={{ backgroundImage: meta.hue }}><meta.icon className="size-3" /></span>
                    {r.category}
                  </span>
                  <span className="block truncate text-xs font-bold">{r.title}</span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
                    <Headphones className="size-3" /> {r.listeners} listening
                  </span>
                </Link>
              );
            })}
          <Link to="/rooms" className="tap flex w-[140px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-3 text-xs font-bold text-white/60">
            <Users className="size-4" /> Browse all
          </Link>
        </div>
      </Card>

      <GiftSheet open={showGift} onClose={() => setShowGift(false)} toUser={userById(giftTarget ?? room.hostId) ?? null} roomId={roomId} />
      <ReportDialog open={showReport} onClose={() => setShowReport(false)} targetType="room" targetId={room.id} targetLabel={room.title} />

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite people" subtitle="Sends a demo room-invite notification">
        <button
          onClick={() => {
            navigator.clipboard?.writeText(`${window.location.origin}/#/rooms/${room.id}`).catch(() => undefined);
            pushToast("Room link copied — paste it anywhere", "ok");
          }}
          className="tap mb-3 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.08]"
        >
          <Copy className="size-4 text-vibe-200" />
          <span className="text-sm font-semibold">Copy room link</span>
          {room.locked && <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-amber-200">invite only</span>}
        </button>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {visibleUsers.slice(0, 8).map((u) => {
            const invited = room.speakerIds.includes(u.id);
            return (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
                <Avatar user={u} size={36} showStatus />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">@{u.username}</p>
                  <p className="truncate text-[11px] text-white/45">{u.online ? "Online now" : "Offline"} · {u.country} · LV {u.level}</p>
                </div>
                <Button
                  size="sm"
                  variant={invited ? "soft" : "outline"}
                  disabled={invited}
                  onClick={() => {
                    addNotification({ type: "room", title: `You invited @${u.username}`, body: `They'll see “${room.title}” in their notifications.`, actorId: u.id, link: `/rooms/${room.id}` });
                    postRoomChat(roomId, `invited @${u.username} to the room`);
                    pushToast(`@${u.username} invited to the room`, "ok");
                  }}
                >
                  {invited ? "In room" : "Invite"}
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Leave confirmation modal */}
      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leave voice room?"
        subtitle={room.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
              Stay in room
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmLeave(false);
                leaveRoom();
                navigate("/rooms");
              }}
            >
              Leave room
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-white/70">
          {joined
            ? "You are currently holding a speaker seat on mic. If you leave, your seat will be freed up for other listeners."
            : "You will leave this demo voice room. You can rejoin at any time."}
        </p>
      </Modal>

      {/* Share room modal */}
      <Modal
        open={showShare}
        onClose={() => setShowShare(false)}
        title="Share this room"
        subtitle={room.title}
        footer={<Button onClick={() => setShowShare(false)}>Done</Button>}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="font-display text-base font-bold text-white">{room.title}</p>
            <p className="mt-1 text-xs text-white/50">{room.category} · Hosted by @{host?.username ?? "you"}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-[10px] font-black text-rose-200">
                <LiveDot label={room.live ? "LIVE" : "SOON"} />
              </span>
              <span className="text-xs text-white/60">{room.listeners} listening</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              icon={<Copy className="size-4" />}
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/#/rooms/${room.id}`).catch(() => undefined);
                pushToast("Room link copied to clipboard!", "ok");
              }}
            >
              Copy direct link
            </Button>
            <Link to={`/posts?focus=share_room`}>
              <Button variant="outline" className="w-full" icon={<Share2 className="size-4" />}>
                Share to Moments
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Rules modal */}
      <Modal
        open={showRules}
        onClose={() => setShowRules(false)}
        title="Room Rules & Guidelines"
        subtitle={room.title}
        footer={<Button onClick={() => setShowRules(false)}>Got it</Button>}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 rounded-2xl border border-mint-400/30 bg-mint-400/10 p-3 text-xs text-mint-200">
            <ShieldCheck className="size-4 shrink-0" />
            <span>This room is an 18+ space. Please adhere to community safety standards.</span>
          </div>
          <div className="space-y-2">
            {(room.rules ?? [
              "Adults 18+ only. Respectful banter is welcome, harassment is not.",
              "Take turns when unmuted — no talking over others.",
              "No money solicitation, promo links, or gambling.",
              "Good vibes only! Feel free to send reactions and gifts.",
            ]).map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-xs">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-vibe-600/30 text-[10px] font-bold text-vibe-200">
                  {idx + 1}
                </span>
                <span className="text-white/80">{rule}</span>
              </div>
            ))}
          </div>
          <Link to="/safety" className="mt-2 block text-center text-xs font-bold text-vibe-200 hover:text-white">
            View full Community Guidelines &rarr;
          </Link>
        </div>
      </Modal>

      {isHost && <EditRoomModal open={editing} onClose={() => setEditing(false)} room={room} onSave={(patch) => updateRoom(room.id, patch)} />}
    </div>
  );
}

function PeopleRow({
  userId,
  roomId,
  onGift,
  isHost,
  muted,
}: {
  userId: string;
  roomId: string;
  onGift: () => void;
  isHost: boolean;
  muted: boolean;
}) {
  const { userById, me, myFollows, toggleFollow, toggleBlock, hostPromote, hostDemote, hostKick, hostMute, pushToast } = useStore();
  const user = userById(userId);
  if (!user) return null;
  const isMe = user.id === me?.id;
  const following = myFollows.includes(user.id);

  return (
    <div className={cn("flex items-center gap-2.5 rounded-2xl border p-2.5", muted ? "border-rose-400/30 bg-rose-500/[0.06]" : "border-white/8 bg-white/[0.03]")}>
      <Avatar user={user} size={36} showStatus />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-sm font-bold">
          @{user.username}
          {isMe && <span className="rounded-full bg-vibe-500/25 px-1.5 text-[9px] font-black text-vibe-200">YOU</span>}
          {muted && <span className="rounded-full bg-rose-500/20 px-1.5 text-[9px] font-black text-rose-200">MUTED</span>}
        </p>
        <p className="truncate text-[11px] text-white/45">
          {user.id === (userById(roomId.slice(0, 0))?.id ?? "") ? "" : ""}LV {user.level} · {user.language} · {user.online ? "online" : "idle"}
        </p>
      </div>
      {!isMe && (
        <div className="flex shrink-0 items-center gap-1">
          <IconButton label={`Gift ${user.username}`} onClick={onGift} className="size-8 text-blush-300"><Gift className="size-3.5" /></IconButton>
          <Link to={`/messages?with=${user.id}`} aria-label={`Message ${user.username}`} className="tap grid size-8 place-items-center rounded-full border border-white/10 bg-white/6 text-white/70 hover:bg-white/14 hover:text-white">
            <MessageSquare className="size-3.5" />
          </Link>
          <IconButton label={following ? `Unfollow ${user.username}` : `Follow ${user.username}`} onClick={() => toggleFollow(user.id)} className={cn("size-8", following && "text-mint-400")}>
            <Heart className={cn("size-3.5", following && "fill-current")} />
          </IconButton>
          <IconButton label={`Block ${user.username}`} className="size-8 text-white/40 hover:text-rose-200" onClick={() => { toggleBlock(user.id); pushToast(`@${user.username} blocked — demo action`, "info"); }}>
            <ShieldAlert className="size-3.5" />
          </IconButton>
          {isHost && (
            <>
              <IconButton label={muted ? "Unmute" : "Mute"} onClick={() => hostMute(roomId, user.id, !muted)} className="size-8">
                {muted ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
              </IconButton>
              <IconButton label="Move on stage" onClick={() => hostPromote(roomId, user.id)} className="size-8"><Mic className="size-3.5" /></IconButton>
              <IconButton label="Move to audience" onClick={() => hostDemote(roomId, user.id)} className="size-8"><Users className="size-3.5" /></IconButton>
              <IconButton label="Remove from room" onClick={() => hostKick(roomId, user.id)} className="size-8 text-rose-200"><Trash2 className="size-3.5" /></IconButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EditRoomModal({
  open,
  onClose,
  room,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  room: Room;
  onSave: (patch: Partial<Room>) => void;
}) {
  const [title, setTitle] = useState(room.title);
  const [topic, setTopic] = useState(room.topic);
  const [category, setCategory] = useState(room.category);
  const [description, setDescription] = useState(room.description);
  const [live, setLive] = useState(room.live);

  useEffect(() => {
    if (open) {
      setTitle(room.title);
      setTopic(room.topic);
      setCategory(room.category);
      setDescription(room.description);
      setLive(room.live);
    }
  }, [open, room]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit room"
      subtitle="Changes save to this device"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave({ title: title.trim() || room.title, topic, category, description, live }); onClose(); }}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} /></Field>
        <Field label="Topic"><Select value={topic} onChange={(e) => setTopic(e.target.value)}>{ROOM_TOPICS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {ROOM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={140} /></Field>
        <div className="flex flex-wrap gap-2">
          <Chip active={live} onClick={() => setLive(true)}>Mark as live</Chip>
          <Chip active={!live} onClick={() => setLive(false)}>Schedule for later</Chip>
        </div>
        <p className="text-[11px] leading-relaxed text-white/35">
          {room.locked ? "This room is locked: members can preview but only invited guests can take a seat." : "This room is public — anyone 18+ can join the stage while seats remain."}
        </p>
      </div>
    </Modal>
  );
}
