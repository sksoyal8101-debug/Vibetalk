import {
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  ChevronRight,
  Copy,
  Crown,
  Flag,
  Gift,
  Info,
  LogOut,
  MessageCircle,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GiftSheet } from "../components/GiftSheet";
import { ReportDialog } from "../components/ReportDialog";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  Reveal,
  Sheet,
  SkeletonList,
  TypingDots,
  useReady,
} from "../components/ui";
import { EMOJI_PICKS, TONES } from "../lib/data";
import { clipTonesSafe } from "../lib/content";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import type { Message, User } from "../lib/types";
import { clockTime, dayLabel } from "../lib/utils";
import { cn } from "../utils/cn";

const REACTION_SET = ["❤️", "😂", "🔥", "👀", "💜", "😮"];
type Thread = { kind: "dm"; id: string } | { kind: "group"; id: string };

interface Convo {
  peer: User;
  last: Message;
  unread: number;
}

export function Messages() {
  const { db, me, visibleUsers, conversationWith, sendMessage, sendDmReaction, markConversationRead, deleteMessage, userById, myFollows, toggleFollow, toggleBlock, pushToast } = useStore();
  const {
    social,
    createGroup,
    sendGroupMessage,
    deleteGroupMessage,
    toggleReaction,
    groupUnread,
    markGroupRead,
    leaveGroup,
    addGroupMembers,
    removeGroupMember,
    toggleGroupAdmin,
    deleteGroup,
    updateGroup,
  } = useSocial();
  const [params, setParams] = useSearchParams();
  const dmId = params.get("with");
  const groupId = params.get("group");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);
  const [picker, setPicker] = useState<string | null>(null);
  const [groupSheet, setGroupSheet] = useState<"create" | "info" | "members" | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupAbout, setGroupAbout] = useState("");
  const [groupTone, setGroupTone] = useState(0);
  const [groupPicks, setGroupPicks] = useState<string[]>([]);
  const [threadQuery, setThreadQuery] = useState("");
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const ready = useReady(260);
  const bottom = useRef<HTMLDivElement>(null);

  const thread: Thread | null = groupId ? { kind: "group", id: groupId } : dmId ? { kind: "dm", id: dmId } : null;

  const conversations = useMemo<Convo[]>(() => {
    if (!me) return [];
    const map = new Map<string, Convo>();
    db.messages
      .filter((m) => (m.from === me.id || m.to === me.id) && !db.blocked.includes(m.from === me.id ? m.to : m.from))
      .forEach((m) => {
        const peerId = m.from === me.id ? m.to : m.from;
        const peer = userById(peerId);
        if (!peer) return;
        const prev = map.get(peerId);
        if (!prev || m.at > prev.last.at) map.set(peerId, { peer, last: m, unread: 0 });
      });
    return [...map.values()]
      .map((c) => ({ ...c, unread: db.messages.filter((m) => m.from === c.peer.id && m.to === me.id && !m.read).length }))
      .sort((a, b) => b.last.at - a.last.at);
  }, [db.blocked, db.messages, me, userById]);

  const groupConvos = useMemo(() => {
    if (!me) return [];
    return social.groups
      .filter((g) => g.memberIds.includes(me.id))
      .map((g) => {
        const msgs = social.groupMessages.filter((m) => m.groupId === g.id);
        return { group: g, last: msgs[msgs.length - 1], unread: groupUnread(g.id) };
      })
      .filter((row) => row.last)
      .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
  }, [groupUnread, me, social.groupMessages, social.groups]);

  const inbox = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows: { key: string; kind: "dm" | "group"; title: string; sub: string; at: number; unread: number; user?: User; group?: (typeof groupConvos)[number]["group"]; typing?: boolean }[] = [
    ...groupConvos.map((row) => ({
      key: `g-${row.group.id}`,
      kind: "group" as const,
      title: row.group.name,
      sub: `@${userById(row.last!.fromId)?.username ?? "member"}: ${row.last!.text}`,
      at: row.last!.at,
      unread: row.unread,
      group: row.group,
    })),
    ...conversations.map((c) => ({
      key: `d-${c.peer.id}`,
      kind: "dm" as const,
      title: `@${c.peer.username}`,
      sub: c.last.text,
      at: c.last.at,
      unread: c.unread,
      user: c.peer,
      typing: dmId === c.peer.id && peerTyping,
    })),
    ].sort((a, b) => b.at - a.at);
    if (!q) return rows;
    return rows.filter((r) => `${r.title} ${r.sub}`.toLowerCase().includes(q));
  }, [conversations, dmId, groupConvos, peerTyping, query, userById]);

  const dmPeer = dmId ? userById(dmId) : null;
  const group = groupId ? social.groups.find((g) => g.id === groupId) ?? null : null;
  const dmThread = dmId ? conversationWith(dmId) : [];
  const groupThread = useMemo(
    () => (groupId ? social.groupMessages.filter((m) => m.groupId === groupId).sort((a, b) => a.at - b.at) : []),
    [groupId, social.groupMessages],
  );

  interface Row {
    id: string;
    fromId: string;
    text: string;
    at: number;
    read?: boolean;
    reactions?: Record<string, string[]>;
    replyTo?: string;
  }

  const allRows: Row[] =
    thread?.kind === "dm"
      ? dmThread.map((m) => ({ id: m.id, fromId: m.from, text: m.text, at: m.at, read: m.read, reactions: m.reactions, replyTo: m.replyTo }))
      : thread?.kind === "group"
        ? groupThread.map((m) => ({ id: m.id, fromId: m.fromId, text: m.text, at: m.at, reactions: m.reactions, replyTo: m.replyTo }))
        : [];

  const rows = threadQuery.trim()
    ? allRows.filter((r) => r.text.toLowerCase().includes(threadQuery.trim().toLowerCase()))
    : allRows;

  useEffect(() => {
    if (dmId) markConversationRead(dmId);
    if (groupId) markGroupRead(groupId);
    setPeerTyping(false);
    setReplyTo(null);
  }, [dmId, groupId, markConversationRead, markGroupRead]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [dmThread.length, groupThread.length, thread?.id]);

  const lastFromPeer = dmThread.length > 0 && dmThread[dmThread.length - 1].from === dmId;
  useEffect(() => {
    if (lastFromPeer) setPeerTyping(false);
  }, [lastFromPeer, dmThread.length]);

  const suggestions = useMemo(
    () => visibleUsers.filter((u) => !conversations.some((c) => c.peer.id === u.id)).slice(0, 6),
    [conversations, visibleUsers],
  );

  function open(kind: "dm" | "group", id: string) {
    const p = new URLSearchParams();
    p.set(kind === "dm" ? "with" : "group", id);
    setParams(p);
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    if (thread?.kind === "dm") {
      sendMessage(thread.id, text, replyTo?.id);
      setReplyTo(null);
      setPeerTyping(true);
      window.setTimeout(() => setPeerTyping(false), 4200);
    } else if (thread?.kind === "group") {
      sendGroupMessage(thread.id, text, replyTo?.id);
      setReplyTo(null);
    }
    setDraft("");
    setShowEmoji(false);
  }

  function submitGroup() {
    if (groupName.trim().length < 3) {
      pushToast("Give the group a name with 3+ characters.", "err");
      return;
    }
    const id = createGroup({ name: groupName, about: groupAbout, tone: groupTone, memberIds: groupPicks });
    setGroupName("");
    setGroupAbout("");
    setGroupPicks([]);
    setGroupSheet(null);
    open("group", id);
  }

  const isAdmin = !!group && !!me && (group.ownerId === me.id || group.adminIds.includes(me.id));

  return (
    <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[370px_minmax(0,1fr)]">
      {/* --------------------------------- Inbox -------------------------------- */}
      <Card className={cn("!rounded-3xl p-3", thread && "hidden lg:block")}>
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <h2 className="font-display text-lg font-extrabold">Inbox</h2>
          <Button size="sm" variant="outline" icon={<Plus className="size-3.5" />} onClick={() => setGroupSheet("create")}>
            Group
          </Button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search DMs and groups…" className="!py-2.5 !pl-9 text-[13px]" />
        </div>

        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1 lg:max-h-[60vh]">
          {!ready && <SkeletonList rows={4} />}
          {ready &&
            inbox.map((row) => (
              <button
                key={row.key}
                onClick={() => open(row.kind, row.kind === "dm" ? row.user!.id : row.group!.id)}
                className={cn(
                  "tap flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition",
                  (row.kind === "dm" && dmId === row.user?.id) || (row.kind === "group" && groupId === row.group?.id)
                    ? "border-vibe-400/60 bg-vibe-600/20"
                    : "border-transparent hover:border-white/10 hover:bg-white/[0.05]",
                )}
              >
                {row.kind === "dm" ? (
                  <Avatar user={row.user} size={44} showStatus />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: clipTonesSafe(row.group?.tone ?? 0) }}>
                    <Users className="size-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{row.title}</span>
                    {row.kind === "group" && <span className="rounded-full bg-white/8 px-1.5 text-[9px] font-black uppercase tracking-widest text-white/50">group</span>}
                    <span className="ml-auto shrink-0 text-[10px] text-white/35">{dayLabel(row.at)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className={cn("truncate text-xs", row.unread ? "font-bold text-white/85" : "text-white/45")}>
                      {row.typing ? <TypingDots label="typing…" /> : row.sub}
                    </span>
                    {row.unread > 0 && <span className="ml-auto grid size-4.5 shrink-0 place-items-center rounded-full bg-blush-500 text-[9px] font-black">{row.unread}</span>}
                  </span>
                </span>
              </button>
            ))}

          {ready && inbox.length === 0 && (
            <div className="px-1 py-6 text-center">
              <p className="text-sm font-bold">{query ? "Nothing found" : "No conversations yet"}</p>
              <p className="mx-auto mt-1 max-w-[230px] text-xs text-white/40">Start a DM, or create a group with the people you follow.</p>
              <div className="mt-4 space-y-1.5 text-left">
                {suggestions.slice(0, 4).map((u) => (
                  <button key={u.id} onClick={() => open("dm", u.id)} className="tap flex w-full items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-left hover:border-vibe-400/40">
                    <Avatar user={u} size={30} showStatus />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">@{u.username}</span>
                    <ChevronRight className="size-4 text-white/30" />
                  </button>
                ))}
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setGroupSheet("create")} icon={<Plus className="size-3.5" />}>
                  Create a group
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* -------------------------------- Thread -------------------------------- */}
      <Card className={cn("flex min-h-[70vh] flex-col !rounded-3xl p-0", thread ? "" : "hidden lg:flex")}>
        {!thread ? (
          <EmptyState
            icon={<MessageCircle className="size-6" />}
            title="Pick a conversation"
            body="Direct messages and group chats share this space. Everything is stored in this browser only — no delivery, no server, no receipts that go anywhere."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 2).map((u) => (
                  <Button key={u.id} size="sm" variant="outline" onClick={() => open("dm", u.id)}>Message @{u.username}</Button>
                ))}
                <Button size="sm" onClick={() => setGroupSheet("create")}>New group</Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-white/8 p-3">
              <button onClick={() => setParams({})} aria-label="Back to inbox" className="tap grid size-9 place-items-center rounded-xl text-white/60 hover:bg-white/10 lg:hidden">
                <ArrowLeft className="size-4.5" />
              </button>
              {thread.kind === "dm" && dmPeer ? (
                <>
                  <Link to={`/u/${dmPeer.id}`}>
                    <Avatar user={dmPeer} size={42} showStatus />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">@{dmPeer.username}</p>
                    <p className="truncate text-[11px] text-white/45">
                      {peerTyping ? "typing…" : dmPeer.online ? "Online now" : "Last seen recently"} · {dmPeer.country} · LV {dmPeer.level}
                    </p>
                  </div>
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <IconButton
                      label="Search messages"
                      onClick={() => {
                        setShowThreadSearch((s) => !s);
                        if (showThreadSearch) setThreadQuery("");
                      }}
                      className={cn("size-9", showThreadSearch && "border-vibe-400/50 bg-vibe-600/20 text-vibe-200")}
                    >
                      <Search className="size-4" />
                    </IconButton>
                    <Button size="sm" variant={myFollows.includes(dmPeer.id) ? "soft" : "outline"} onClick={() => toggleFollow(dmPeer.id)}>
                      {myFollows.includes(dmPeer.id) ? "Following" : "Follow"}
                    </Button>
                    <IconButton label="Send gift" onClick={() => setGiftOpen(true)} className="size-9 text-blush-300"><Gift className="size-4" /></IconButton>
                    <IconButton label="Report or block" onClick={() => setReportOpen(true)} className="size-9"><Flag className="size-4" /></IconButton>
                    <IconButton label="Block" onClick={() => { toggleBlock(dmPeer.id); pushToast(db.blocked.includes(dmPeer.id) ? "Unblocked" : "Blocked (demo)", "info"); }} className="size-9"><Ban className="size-4" /></IconButton>
                  </div>
                </>
              ) : group ? (
                <>
                  <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: clipTonesSafe(group.tone) }}>
                    <Users className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{group.name}</p>
                    <p className="truncate text-[11px] text-white/45">
                      {group.memberIds.length} members · {group.adminIds.length} admin{group.adminIds.length === 1 ? "" : "s"} · demo chat
                    </p>
                  </div>
                  <IconButton
                    label="Search messages"
                    onClick={() => {
                      setShowThreadSearch((s) => !s);
                      if (showThreadSearch) setThreadQuery("");
                    }}
                    className={cn("size-9", showThreadSearch && "border-vibe-400/50 bg-vibe-600/20 text-vibe-200")}
                  >
                    <Search className="size-4" />
                  </IconButton>
                  <IconButton label="Group info" onClick={() => setGroupSheet("info")} className="size-9"><Info className="size-4" /></IconButton>
                  <Button size="sm" variant="outline" onClick={() => { leaveGroup(group.id); setParams({}); }}>Leave</Button>
                </>
              ) : null}
            </div>

            {showThreadSearch && (
              <div className="flex items-center gap-2 border-b border-white/8 bg-ink-900/90 px-3.5 py-2">
                <Search className="size-3.5 shrink-0 text-white/40" />
                <input
                  value={threadQuery}
                  onChange={(e) => setThreadQuery(e.target.value)}
                  placeholder="Filter messages in this conversation…"
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-white/35"
                  autoFocus
                />
                {threadQuery && (
                  <button onClick={() => setThreadQuery("")} className="tap text-white/40 hover:text-white">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto bg-ink-950/25 p-4">
              {thread.kind === "dm" && dmThread.length === 0 && (
                <div className="mx-auto mt-10 max-w-sm text-center">
                  <p className="text-sm font-bold">Say hi to @{dmPeer?.username}</p>
                  <p className="mt-1 text-xs text-white/45">Demo peers reply after a beat. +8 xp per message.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {["hey! love your profile", "wanna hop in a room?", "what are you listening to?"].map((s) => (
                      <button key={s} onClick={() => setDraft(s)} className="tap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {rows.map((m, i) => {
                const mine = m.fromId === me?.id;
                const fromId = m.fromId;
                const author = userById(fromId);
                const prev = rows[i - 1];
                const grouped = prev && prev.fromId === fromId && m.at - prev.at < 5 * 60_000;
                const newDay = !prev || dayLabel(prev.at) !== dayLabel(m.at);
                const reactions = m.reactions;
                const quoted = m.replyTo ? rows.find((r) => r.id === m.replyTo) : undefined;

                return (
                  <Reveal key={m.id} delay={Math.min(i, 5) * 35}>
                    {newDay && <p className="my-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{dayLabel(m.at)}</p>}
                    <div className={cn("group flex items-end gap-2", mine && "flex-row-reverse")}>
                      {thread.kind === "group" && !mine && (grouped ? <span className="w-[26px]" /> : <Avatar user={author ?? undefined} size={26} showFrame={false} />)}
                      {thread.kind === "dm" && !mine && <Avatar user={author ?? undefined} size={26} showFrame={false} />}
                      <div className={cn("max-w-[78%]", mine && "text-right")}>
                        {thread.kind === "group" && !mine && !grouped && (
                          <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                            @{author?.username ?? "member"}
                            {group?.adminIds.includes(fromId) && <span className="rounded-full bg-coin-400/20 px-1 text-[8px] font-black text-coin-400">ADMIN</span>}
                            {group?.ownerId === fromId && <Crown className="size-3 text-coin-400" />}
                          </p>
                        )}
                        <div className={cn("relative inline-block text-left")}>
                          <div
                            className={cn(
                              "rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug",
                              mine ? "vibe-gradient rounded-br-md text-white" : "rounded-bl-md border border-white/10 bg-white/[0.06] text-white/90",
                            )}
                          >
                            {quoted && (
                              <span className="mb-1.5 block rounded-lg bg-black/30 px-2 py-1 text-[11px] text-white/70">
                                ↩ @{userById(quoted.fromId)?.username}: {quoted.text.slice(0, 60)}
                              </span>
                            )}
                            {m.text}
                          </div>
                          <div className={cn("mt-1 flex items-center gap-1.5 text-[10px] text-white/30", mine && "justify-end")}>
                            <span>{clockTime(m.at)}</span>
                            {mine && thread.kind === "dm" && (!social.privacy.readReceipts ? <Check className="size-3" /> : m.read ? <CheckCheck className="size-3 text-mint-400" /> : <Check className="size-3" />)}
                            
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(m.text).catch(() => undefined);
                                pushToast("Message copied to clipboard", "ok");
                              }}
                              aria-label="Copy message"
                              title="Copy"
                              className="tap opacity-0 transition group-hover:opacity-100 hover:text-white"
                            >
                              <Copy className="size-3" />
                            </button>

                            {(mine || (thread.kind === "group" && isAdmin)) && (
                              <button
                                onClick={() => {
                                  if (thread.kind === "dm") deleteMessage(m.id);
                                  else if (thread.kind === "group" && group) deleteGroupMessage(group.id, m.id);
                                }}
                                aria-label="Delete message"
                                title="Delete"
                                className="tap opacity-0 transition group-hover:opacity-100 hover:text-rose-300"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}

                            <button
                              onClick={() => setReplyTo({ id: m.id, text: m.text })}
                              aria-label="Reply"
                              title="Reply"
                              className="tap opacity-0 transition group-hover:opacity-100 hover:text-white"
                            >
                              <Reply className="size-3" />
                            </button>

                            <span className="relative">
                              <button
                                aria-label="React"
                                onClick={() => setPicker((p) => (p === m.id ? null : m.id))}
                                className={cn("tap text-white/45 transition hover:text-white", picker === m.id && "text-vibe-200")}
                              >
                                <Smile className="size-3" />
                              </button>
                              <span
                                className={cn(
                                  "absolute bottom-4 right-0 z-20 rounded-full border border-white/15 bg-ink-900 px-1.5 py-1 shadow-[0_18px_40px_-14px_rgba(0,0,0,.9)] transition",
                                  picker === m.id ? "flex gap-0.5 opacity-100" : "pointer-events-none invisible gap-0.5 opacity-0",
                                )}
                              >
                                {REACTION_SET.map((r) => (
                                  <button
                                    key={r}
                                    onClick={() => {
                                      if (thread.kind === "group") toggleReaction(thread.id, m.id, r);
                                      else if (thread.kind === "dm") sendDmReaction(m.id, r);
                                      setPicker(null);
                                    }}
                                    className="tap px-1 text-[15px]"
                                    aria-label={`React ${r}`}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </span>
                            </span>
                          </div>
                          {reactions && Object.keys(reactions).length > 0 && (
                            <div className={cn("mt-1 flex flex-wrap gap-1", mine && "justify-end")}>
                              {Object.entries(reactions).map(([emoji, list]) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    if (thread.kind === "group") toggleReaction(thread.id, m.id, emoji);
                                    else if (thread.kind === "dm") sendDmReaction(m.id, emoji);
                                  }}
                                  className={cn("tap rounded-full border px-1.5 py-0.5 text-[10px] font-bold", list.includes(me?.id ?? "") ? "border-vibe-400/50 bg-vibe-600/25 text-white" : "border-white/10 bg-white/5 text-white/60")}
                                >
                                  {emoji} {list.length}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}

              {peerTyping && thread.kind === "dm" && (
                <div className="flex items-end gap-2">
                  <Avatar user={dmPeer ?? undefined} size={26} showFrame={false} />
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
                    <TypingDots />
                    <span className="text-[11px] text-white/45">@{dmPeer?.username} is typing…</span>
                  </div>
                </div>
              )}
              <div ref={bottom} />
            </div>

            <div className="border-t border-white/8 p-3">
              {replyTo && (
                <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px]">
                  <Reply className="size-3.5 shrink-0 text-vibe-200" />
                  <span className="min-w-0 flex-1 truncate text-white/60">Replying: “{replyTo.text.slice(0, 60)}”</span>
                  <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="tap text-white/40 hover:text-white"><X className="size-3.5" /></button>
                </div>
              )}
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
                  maxLength={500}
                  placeholder={thread.kind === "group" ? `Message ${group?.name ?? "group"}…` : `Message @${dmPeer?.username ?? "member"}…`}
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/12 bg-ink-950/60 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70"
                />
                <IconButton label="Send" onClick={send} disabled={!draft.trim()} className="vibe-gradient size-11 shrink-0 border-0 text-white"><Send className="size-4.5" /></IconButton>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-white/25">
                <Sparkles className="size-3" /> local demo chat · reactions and replies work in groups
              </p>
            </div>
          </>
        )}
      </Card>

      {/* ------------------------------ Group sheets ------------------------------ */}
      <Sheet
        open={groupSheet === "create"}
        onClose={() => setGroupSheet(null)}
        title="Create a group"
        subtitle="Name, look and members — all local"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGroupSheet(null)}>Cancel</Button>
            <Button onClick={submitGroup}>Create group</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="Group name">
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={36} placeholder="Night Shift 🌙" />
          </Field>
          <Field label="About" hint={`${groupAbout.length}/120`}>
            <Input value={groupAbout} onChange={(e) => setGroupAbout(e.target.value)} maxLength={120} placeholder="What is this group for?" />
          </Field>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">Cover</p>
            <div className="grid grid-cols-5 gap-2">
              {TONES.slice(0, 5).map((t, i) => (
                <button key={t} onClick={() => setGroupTone(i)} className={cn("tap h-11 rounded-xl border-2", groupTone === i ? "border-white/70" : "border-transparent opacity-70")} style={{ background: t }} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">Members ({groupPicks.length})</p>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {visibleUsers.map((u) => {
                const on = groupPicks.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => setGroupPicks((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))}
                    className={cn("tap flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left", on ? "border-vibe-400/60 bg-vibe-600/18" : "border-white/8 bg-white/[0.03]")}
                  >
                    <Avatar user={u} size={30} showStatus />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">@{u.username}</span>
                    {on && <Check className="size-4 text-mint-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet open={groupSheet === "info"} onClose={() => setGroupSheet(null)} title={group?.name ?? "Group"} subtitle={group?.about}>
        {group && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Members", value: group.memberIds.length },
                { label: "Messages", value: social.groupMessages.filter((m) => m.groupId === group.id).length },
                { label: "Admins", value: group.adminIds.length },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
                  <p className="font-display text-lg font-extrabold">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
            <Field label="Rename group">
              <div className="flex gap-2">
                <Input defaultValue={group.name} onBlur={(e) => e.target.value !== group.name && updateGroup(group.id, { name: e.target.value })} />
                <IconButton label="Save" onClick={() => pushToast("Group updated.", "ok")} className="size-11"><Zap className="size-4" /></IconButton>
              </div>
            </Field>
            <Button variant="outline" className="w-full" onClick={() => setGroupSheet("members")}>Manage members</Button>
            {group.ownerId === me?.id && (
              <Button variant="danger" className="w-full" icon={<Trash2 className="size-4" />} onClick={() => { deleteGroup(group.id); setParams({}); setGroupSheet(null); }}>
                Delete group
              </Button>
            )}
            <p className="text-[11px] text-white/35">Groups live in localStorage. No servers, no push, no message history beyond this device.</p>
          </div>
        )}
      </Sheet>

      <Sheet open={groupSheet === "members"} onClose={() => setGroupSheet(null)} title="Members" subtitle="Admins can add, remove and promote">
        {group && (
          <div className="space-y-2">
            {group.memberIds.map((id) => {
              const u = userById(id);
              if (!u) return null;
              const admin = group.adminIds.includes(id);
              return (
                <div key={id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
                  <Avatar user={u} size={36} showStatus />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">@{u.username}{group.ownerId === id && <Crown className="ml-1 inline size-3.5 text-coin-400" />}</p>
                    <p className="text-[10px] text-white/45">{admin ? "admin" : "member"} · LV {u.level}</p>
                  </div>
                  {isAdmin && group.ownerId !== id && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => toggleGroupAdmin(group.id, id)}>{admin ? "Demote" : "Make admin"}</Button>
                      <IconButton label="Remove member" onClick={() => removeGroupMember(group.id, id)} className="size-8 text-rose-200"><Trash2 className="size-3.5" /></IconButton>
                    </>
                  )}
                </div>
              );
            })}
            {isAdmin && (
              <>
                <p className="pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">Add members</p>
                <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {visibleUsers.filter((u) => !group.memberIds.includes(u.id)).slice(0, 8).map((u) => (
                    <div key={u.id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] p-2">
                      <Avatar user={u} size={28} />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">@{u.username}</span>
                      <Button size="sm" variant="outline" onClick={() => addGroupMembers(group.id, [u.id])}>Add</Button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Button variant="outline" className="mt-2 w-full" icon={<LogOut className="size-4" />} onClick={() => { leaveGroup(group.id); setParams({}); setGroupSheet(null); }}>
              Leave group
            </Button>
          </div>
        )}
      </Sheet>

      {dmPeer && <GiftSheet open={giftOpen} onClose={() => setGiftOpen(false)} toUser={dmPeer} />}
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={dmPeer?.id ?? ""} targetLabel={dmPeer ? `@${dmPeer.username}` : "member"} />
    </div>
  );
}
