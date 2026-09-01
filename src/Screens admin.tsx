import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { AlertTriangle, Ban, Bell, Check, Coins, Eye, Gift, Megaphone, MessageSquare, Radio, RefreshCw, Search, Shield, Trash2, Users, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, EmptyState, Field, IconButton, Input, SectionHeader, Segmented, SkeletonList, StatTile, Textarea } from "../components/ui";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { compact, timeAgo } from "../lib/utils";
import { cn } from "../utils/cn";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Filler);

type Panel = "dashboard" | "users" | "reports" | "rooms" | "content" | "economy" | "events" | "notifications" | "analytics";

export function Admin() {
  const { db, userById, addNotification, pushToast } = useStore();
  const { social, setRole, adminToggle, reviewReport, removeContent, announce } = useSocial();
  const [panel, setPanel] = useState<Panel>("dashboard");
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");

  const stats = useMemo(
    () => ({
      users: db.users.length,
      online: db.users.filter((u) => u.online).length,
      active: db.users.filter((u) => Date.now() - u.joinedAt < 30 * 86_400_000).length,
      rooms: db.rooms.length,
      live: db.rooms.filter((r) => r.live).length,
      messages: db.messages.length + db.chats.length + social.groupMessages.length,
      posts: social.posts.length,
      videos: social.videos.length,
      reports: db.reports.length,
      gifts: db.giftLog.length,
      coins: db.txns.reduce((s, t) => s + Math.abs(t.amount), 0),
      events: db.events.length,
    }),
    [db, social],
  );

  if (social.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="relative overflow-hidden !rounded-[30px] p-6 text-center">
          <div className="vibe-gradient pointer-events-none absolute -right-16 -top-20 size-52 rounded-full opacity-25 blur-3xl" />
          <span className="relative mx-auto grid size-14 place-items-center rounded-3xl bg-vibe-600/25 text-vibe-200 ring-1 ring-vibe-400/30">
            <Shield className="size-7" />
          </span>
          <h1 className="relative mt-4 font-display text-2xl font-extrabold">Admin access is demo-gated</h1>
          <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">
            Version 2 uses local role flags only — there is no server, no real moderation and nothing you do here
            affects anyone else. Enable the demo role to inspect the dashboard.
          </p>
          <Button className="relative mt-5" onClick={() => { setRole("admin"); pushToast("Demo admin enabled.", "ok"); }} icon={<Zap className="size-4" />}>
            Enable demo admin
          </Button>
        </Card>
      </div>
    );
  }

  const users = db.users.filter((u) => !q || `${u.username} ${u.email} ${u.country}`.toLowerCase().includes(q.toLowerCase()));
  const flagged = social.posts.filter((p) => p.text.length > 200 || /pay|cash|crypto|telegram/i.test(p.text));

  return (
    <div className="space-y-5">
      <Card className="relative flex flex-wrap items-center gap-4 overflow-hidden !rounded-[30px] p-5">
        <div className="vibe-gradient pointer-events-none absolute -left-20 -top-24 size-60 rounded-full opacity-25 blur-3xl" />
        <span className="relative grid size-12 place-items-center rounded-2xl bg-coin-500/18 text-coin-400 ring-1 ring-coin-400/30">
          <Shield className="size-6" />
        </span>
        <div className="relative min-w-[200px] flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-coin-400">Admin · local demo</p>
          <h1 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">Community operations</h1>
          <p className="mt-1 text-xs text-white/45">Actions here only mutate localStorage on this device.</p>
        </div>
        <div className="relative flex gap-2">
          <Button size="sm" variant="outline" icon={<Megaphone className="size-3.5" />} onClick={() => { announce(note || "Scheduled maintenance: rooms stay 18+ and kind. Be decent."); setNote(""); }}>
            Broadcast
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setRole("member"); pushToast("Admin mode off.", "info"); }}>
            Exit admin
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        <StatTile label="Total users" value={stats.users} icon={<Users className="size-4" />} />
        <StatTile label="Active 30d" value={stats.active} tone="mint" delta={6} />
        <StatTile label="Online now" value={stats.online} tone="sky" />
        <StatTile label="Live rooms" value={stats.live} tone="pink" icon={<Radio className="size-4" />} />
        <StatTile label="Messages" value={stats.messages} tone="coin" icon={<MessageSquare className="size-4" />} />
        <StatTile label="Open reports" value={db.reports.length - social.admin.reviewed.length} tone="violet" icon={<AlertTriangle className="size-4" />} />
      </div>

      <Segmented
        value={panel}
        onChange={setPanel}
        options={[
          { key: "dashboard", label: "Dashboard" },
          { key: "users", label: "Users" },
          { key: "reports", label: "Reports" },
          { key: "rooms", label: "Rooms" },
          { key: "content", label: "Posts & videos" },
          { key: "economy", label: "Gifts & coins" },
          { key: "events", label: "Events" },
          { key: "notifications", label: "Alerts" },
          { key: "analytics", label: "Analytics" },
        ]}
      />

      {panel === "dashboard" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="!rounded-[28px] p-5">
            <SectionHeader title="Activity last 7 days" subtitle="Messages, posts and clips created on this device" />
            <div className="h-[220px]">
              <Bar
                data={{
                  labels: Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d.toLocaleDateString(undefined, { weekday: "short" });
                  }),
                  datasets: [
                    { label: "Room chats", data: [12, 18, 9, 22, 30, 26, 19], backgroundColor: "rgba(168,85,247,.6)", borderRadius: 8, borderSkipped: false as const },
                    { label: "Posts", data: [3, 5, 2, 6, 8, 7, 4], backgroundColor: "rgba(236,72,153,.6)", borderRadius: 8, borderSkipped: false as const },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true, labels: { color: "rgba(255,255,255,.6)", boxWidth: 9, font: { size: 10 } } } },
                  scales: { x: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "rgba(255,255,255,.45)", font: { size: 10 } } }, y: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "rgba(255,255,255,.45)", font: { size: 10 }, precision: 0 } } },
                }}
              />
            </div>
          </Card>
          <Card className="!rounded-[28px] p-5">
            <SectionHeader title="Queue" subtitle="Needs a human" icon={<AlertTriangle className="size-4.5 text-amber-300" />} />
            <div className="space-y-2">
              {[
                { label: "Reports open", value: db.reports.length - social.admin.reviewed.length, to: "/admin" },
                { label: "Flagged posts", value: flagged.length, to: "/admin" },
                { label: "Suspended", value: social.admin.suspended.length, to: "/admin" },
                { label: "Banned", value: social.admin.banned.length, to: "/admin" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                  <span className="text-[13px] font-bold text-white/70">{row.label}</span>
                  <span className={cn("font-display text-lg font-extrabold", row.value > 0 ? "text-amber-300" : "text-white/35")}>{row.value}</span>
                </div>
              ))}
            </div>
            <Field label="Send community announcement" className="mt-4">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="What should every member see today?" />
            </Field>
            <Button className="mt-2 w-full" icon={<Megaphone className="size-4" />} onClick={() => { announce(note); setNote(""); }} disabled={note.trim().length < 4}>
              Broadcast to feed
            </Button>
          </Card>
        </div>
      )}

      {panel === "users" && (
        <Card className="!rounded-[28px] p-4">
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members…" className="!pl-9 text-sm" />
            </div>
            <span className="self-center text-[11px] text-white/40">{users.length} accounts</span>
          </div>
          <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
            {users.map((u) => {
              const suspended = social.admin.suspended.includes(u.id);
              const banned = social.admin.banned.includes(u.id);
              return (
                <div key={u.id} className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <Avatar user={u} size={38} showStatus />
                  <div className="min-w-[140px] flex-1">
                    <p className="truncate text-[13px] font-bold">@{u.username}</p>
                    <p className="truncate text-[11px] text-white/40">{u.email} · LV {u.level} · {compact(u.coins)} VC · joined {timeAgo(u.joinedAt)} ago</p>
                  </div>
                  {(suspended || banned) && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", banned ? "bg-rose-500/20 text-rose-200" : "bg-amber-400/20 text-amber-200")}>
                      {banned ? "banned" : "suspended"}
                    </span>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    <Link to={`/u/${u.id}`}><IconButton label="View user" className="size-8"><Eye className="size-3.5" /></IconButton></Link>
                    <IconButton label="Suspend" onClick={() => adminToggle("suspend", u.id)} className={cn("size-8", suspended && "text-amber-200")}><Ban className="size-3.5" /></IconButton>
                    <IconButton label="Ban" onClick={() => adminToggle("ban", u.id)} className={cn("size-8", banned && "text-rose-200")}><Trash2 className="size-3.5" /></IconButton>
                    <IconButton label="Restore" onClick={() => adminToggle("restore", u.id)} className="size-8"><RefreshCw className="size-3.5" /></IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {panel === "reports" && (
        <Card className="!rounded-[28px] p-4">
          <SectionHeader title="Report queue" subtitle="Local tickets with reference numbers" icon={<AlertTriangle className="size-4.5 text-rose-300" />} />
          {db.reports.length === 0 ? (
            <EmptyState icon={<Shield className="size-6" />} title="Queue is empty" body="Nothing has been reported on this device. Report a room or member and it lands here for review." action={<Link to="/rooms"><Button>Browse rooms</Button></Link>} />
          ) : (
            <div className="space-y-2.5">
              {db.reports.map((r) => {
                const done = social.admin.reviewed.includes(r.id);
                return (
                  <div key={r.id} className={cn("rounded-2xl border p-3.5", done ? "border-mint-400/25 bg-mint-400/[0.05]" : "border-white/8 bg-white/[0.03]")}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-bold">#{r.id.slice(-6).toUpperCase()} · {r.targetType} {r.targetLabel}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", done ? "bg-mint-400/20 text-mint-400" : "bg-amber-400/20 text-amber-200")}>
                        {done ? "reviewed" : "in review"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/60">{r.reason}</p>
                    {r.details && <p className="mt-1 text-[11px] text-white/35">“{r.details}”</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-white/25">{new Date(r.at).toLocaleString()}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" icon={<Check className="size-3.5" />} onClick={() => reviewReport(r.id)} disabled={done}>Mark reviewed</Button>
                      <Button size="sm" variant="danger" icon={<X className="size-3.5" />} onClick={() => { adminToggle("ban", r.targetId); reviewReport(r.id); }} disabled={done || r.targetType !== "user"}>
                        Ban target
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {panel === "rooms" && (
        <Card className="!rounded-[28px] p-4">
          <SectionHeader title="Rooms" subtitle="Mute, lock or take down a room" icon={<Radio className="size-4.5 text-mint-400" />} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {db.rooms.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-bold">{r.title}</p>
                  <span className={cn("shrink-0 text-[9px] font-black uppercase tracking-widest", r.live ? "text-mint-400" : "text-white/35")}>{r.live ? "live" : "scheduled"}</span>
                </div>
                <p className="mt-1 text-[11px] text-white/45">@{userById(r.hostId)?.username ?? "you"} · {r.category} · {r.listeners} listening · {r.locked ? "locked" : "public"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Link to={`/rooms/${r.id}`}><Button size="sm" variant="outline">Open</Button></Link>
                  <Button size="sm" variant="ghost" onClick={() => { addNotification({ type: "room", title: `Reminder: ${r.title}`, body: "Admin nudge sent to the host (demo).", link: `/rooms/${r.id}` }); pushToast("Host reminded.", "ok"); }}>
                    Nudge host
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {panel === "content" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Posts" subtitle={`${social.posts.length} total · ${flagged.length} keyword-flagged`} />
            <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
              {social.posts.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-start gap-2.5">
                    <Avatar user={userById(p.authorId) ?? undefined} size={30} showFrame={false} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[12.5px] text-white/75">{p.text}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-white/30">{p.hashtag} · {p.likes.length} likes · {timeAgo(p.createdAt)} ago</p>
                    </div>
                    <IconButton label="Remove post" onClick={() => removeContent("post", p.id)} className="size-8 text-rose-200"><Trash2 className="size-3.5" /></IconButton>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Clips" subtitle={`${social.videos.length} reels`} />
            <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
              {social.videos.map((v) => (
                <div key={v.id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-black text-white/70" style={{ background: "linear-gradient(140deg,#7c3aed,#ec4899)" }}>▶</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{v.title}</p>
                    <p className="text-[10px] text-white/35">{compact(v.views)} views · @{userById(v.authorId)?.username}</p>
                  </div>
                  <IconButton label="Remove clip" onClick={() => removeContent("video", v.id)} className="size-8 text-rose-200"><Trash2 className="size-3.5" /></IconButton>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {panel === "economy" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Coin ledger" subtitle={`${db.txns.length} entries · ${compact(stats.coins)} total movement`} icon={<Coins className="size-4.5 text-coin-400" />} />
            <div className="max-h-[46vh] divide-y divide-white/6 overflow-y-auto">
              {db.txns.slice(0, 20).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/6 text-[10px] font-black text-white/55">{t.kind.slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{t.label}</p>
                    <p className="text-[10px] text-white/35">{timeAgo(t.at)} ago</p>
                  </div>
                  <span className={cn("text-[13px] font-black", t.amount > 0 ? "text-mint-400" : "text-rose-300")}>{t.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Gift log" subtitle="Virtual items, no cash value" icon={<Gift className="size-4.5 text-blush-300" />} />
            <div className="max-h-[46vh] space-y-2 overflow-y-auto">
              {db.giftLog.slice(0, 16).map((g) => (
                <div key={g.id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-blush-500/15 text-base">🎁</span>
                  <p className="min-w-0 flex-1 truncate text-[12.5px]">
                    <span className="font-bold">@{userById(g.fromId)?.username ?? "?"}</span> → <span className="font-bold">@{userById(g.toId)?.username ?? "?"}</span>
                    <span className="text-white/40"> · {g.giftId}</span>
    
