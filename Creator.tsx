import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Activity, ChartLine, Eye, Gift, Heart, Mic, Sparkles, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, EmptyState, Reveal, SectionHeader, Segmented, Skeleton, StatTile } from "../components/ui";
import { audienceSplit, creatorSeries, creatorStats, topContent } from "../lib/engine";
import { ACHIEVEMENTS, levelTitle } from "../lib/progression";
import { levelFromXp } from "../lib/utils";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const GRID = "rgba(255,255,255,0.07)";
const TICK = "rgba(255,255,255,0.45)";

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(12,7,22,.94)",
      borderColor: "rgba(168,85,247,.35)",
      borderWidth: 1,
      padding: 10,
      titleFont: { family: "Manrope", weight: 700 as const },
      bodyFont: { family: "Manrope" },
      displayColors: false,
    },
  },
  scales: {
    x: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 10 } } },
    y: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 10 }, precision: 0 } },
  },
};

type Tab = "overview" | "rooms" | "audience" | "badges";

export function Creator() {
  const { me, db } = useStore();
  const { ctx, ready } = useSocial();
  const [tab, setTab] = useState<Tab>("overview");

  const stats = useMemo(() => creatorStats(ctx), [ctx]);
  const series = useMemo(() => creatorSeries(ctx), [ctx]);
  const audience = useMemo(() => audienceSplit(ctx), [ctx]);
  const best = useMemo(() => topContent(ctx), [ctx]);

  if (!me) return null;

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 !rounded-[28px]" />
        <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 !rounded-3xl" />)}</div>
        <Skeleton className="h-72 !rounded-[28px]" />
      </div>
    );
  }

  const curve = levelFromXp(me.xp);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="vibe-gradient pointer-events-none absolute -right-24 -top-28 size-72 rounded-full opacity-25 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar user={me} size={70} showStatus />
          <div className="min-w-[220px] flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-vibe-200">Creator Center</p>
            <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight sm:text-[32px]">@{me.username}</h1>
            <p className="mt-1 text-sm text-white/55">
              {levelTitle(curve.level)} · LV {curve.level} · {curve.total.toLocaleString()} xp · {stats.friends} friends
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/profile"><Button size="sm" variant="outline">View profile</Button></Link>
            <Link to="/vip"><Button size="sm" variant="soft" icon={<Sparkles className="size-3.5" />}>Go VIP</Button></Link>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Followers" value={stats.followers} delta={8} icon={<Users className="size-4" />} />
          <StatTile label="Profile views" value={Math.round(stats.profileViews)} delta={12} tone="sky" icon={<Eye className="size-4" />} />
          <StatTile label="Room visits" value={stats.roomVisits} delta={5} tone="mint" icon={<Mic className="size-4" />} />
          <StatTile label="Clip views" value={stats.videoViews} delta={21} tone="pink" icon={<ChartLine className="size-4" />} />
          <StatTile label="Likes" value={stats.likes} delta={9} tone="coin" icon={<Heart className="size-4" />} />
          <StatTile label="Engagement" value={`${stats.engagement}%`} hint="likes+comments per 100 reach" icon={<TrendingUp className="size-4" />} />
        </div>
      </Card>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: "overview", label: "Content overview" },
          { key: "rooms", label: "Room analytics" },
          { key: "audience", label: "Audience" },
          { key: "badges", label: "Achievements" },
        ]}
      />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Reveal>
            <Card className="!rounded-[28px] p-5">
              <SectionHeader title="Last 7 days" subtitle="Followers, clip views and xp earned (demo data)" icon={<Activity className="size-4.5 text-vibe-200" />} />
              <div className="h-[240px]">
                <Line
                  data={{
                    labels: series.days,
                    datasets: [
                      {
                        label: "Clip views",
                        data: series.views,
                        borderColor: "#f472b6",
                        backgroundColor: "rgba(236,72,153,.18)",
                        fill: true,
                        tension: 0.42,
                        pointRadius: 3,
                        pointBackgroundColor: "#f9a8d4",
                      },
                      {
                        label: "Room traffic",
                        data: series.roomTraffic,
                        borderColor: "#a855f7",
                        backgroundColor: "rgba(168,85,247,.14)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: "#d8b4fe",
                      },
                      { label: "XP earned", data: series.xp, borderColor: "#34d399", backgroundColor: "transparent", borderDash: [5, 4], tension: 0.35, pointRadius: 2 },
                    ],
                  }}
                  options={{ ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: true, labels: { color: "rgba(255,255,255,.6)", boxWidth: 10, font: { size: 10 } } } } }}
                />
              </div>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="!rounded-[28px] p-5">
              <SectionHeader title="Top performing content" subtitle="Ranked by local engagement score" icon={<Sparkles className="size-4.5 text-coin-400" />} />
              {best.length === 0 ? (
                <EmptyState icon={<ChartLine className="size-6" />} title="No content yet" body="Post a moment, publish a clip or host a room — analytics start immediately." />
              ) : (
                <div className="space-y-2">
                  {best.map((row, i) => (
                    <div key={row.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/6 font-display text-xs font-black text-white/60">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold">{row.title}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/35">{row.kind} · {row.metric}</p>
                      </div>
                      <span className="shrink-0 font-display text-sm font-extrabold text-vibe-200">{Math.round(row.score)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Posts", value: stats.posts },
                  { label: "Clips", value: stats.clips },
                  { label: "Comments", value: stats.comments },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] py-2.5">
                    <p className="font-display text-lg font-extrabold">{s.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal>
            <Card className="!rounded-[28px] p-5 lg:col-span-2">
              <SectionHeader title="Engagement by format" subtitle="Where your audience actually shows up" icon={<Heart className="size-4.5 text-blush-300" />} />
              <div className="h-[220px]">
                <Bar
                  data={{
                    labels: ["Posts", "Clips", "Rooms", "Stories", "Gifts"],
                    datasets: [
                      {
                        label: "Interactions",
                        data: [
                          stats.posts * 14 + stats.comments,
                          stats.clips * 26 + Math.round(stats.videoViews / 40),
                          stats.roomsHosted * 40 + stats.roomVisits,
                          ctx.social.stories.filter((s) => s.authorId === me.id).length * 18,
                          stats.giftsReceived * 22,
                        ],
                        backgroundColor: ["rgba(168,85,247,.55)", "rgba(236,72,153,.55)", "rgba(52,211,153,.5)", "rgba(34,211,238,.5)", "rgba(251,191,36,.5)"],
                        borderRadius: 10,
                        borderSkipped: false as const,
                      },
                    ],
                  }}
                  options={baseOptions}
                />
              </div>
            </Card>
          </Reveal>
        </div>
      )}

      {tab === "rooms" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="!rounded-[28px] p-5">
            <SectionHeader title="Room analytics" subtitle="Hosted rooms on this device" icon={<Mic className="size-4.5 text-mint-400" />} />
            {db.rooms.filter((r) => r.hostId === me.id).length === 0 ? (
              <EmptyState
                icon={<Mic className="size-6" />}
                title="You haven't hosted yet"
                body="Hosting a room is the fastest way to earn xp and Top Host badges in this demo."
                action={<Link to="/rooms?create=1"><Button>Open a room</Button></Link>}
              />
            ) : (
              <div className="space-y-2">
                {db.rooms.filter((r) => r.hostId === me.id).map((r) => (
                  <div key={r.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold">{r.title}</p>
                      <span className={cn("shrink-0 text-[10px] font-black uppercase tracking-widest", r.live ? "text-mint-400" : "text-white/35")}>{r.live ? "live" : "scheduled"}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                      {[
                        { l: "Seats", v: `${r.speakerIds.length}/${r.seats}` },
                        { l: "Listeners", v: r.listeners },
                        { l: "Chats", v: db.chats.filter((c) => c.roomId === r.id).length },
                        { l: "Heat", v: Math.round(r.listeners * 2.6 + r.speakerIds.length * 9) },
                      ].map((s) => (
                        <div key={s.l}>
                          <p className="font-display text-sm font-extrabold">{s.v}</p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="!rounded-[28px] p-5">
            <SectionHeader title="Room traffic" subtitle="Estimated visits from demo activity" icon={<TrendingUp className="size-4.5 text-vibe-200" />} />
            <div className="h-[240px]">
              <Bar
                data={{
                  labels: series.days,
                  datasets: [{ label: "Visits", data: series.roomTraffic, backgroundColor: "rgba(124,58,237,.6)", borderRadius: 10, borderSkipped: false as const }],
                }}
                options={baseOptions}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === "audience" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="!rounded-[28px] p-5">
            <SectionHeader title="Audience by interest" subtitle="What the community around you cares about" icon={<Users className="size-4.5 text-blush-300" />} />
            <div className="mx-auto h-[240px] max-w-[320px]">
              <Doughnut
                data={{
                  labels: audience.interests.map((i) => i.label),
                  datasets: [
                    {
                      data: audience.interests.map((i) => i.value),
                      backgroundColor: ["#7c3aed", "#ec4899", "#22d3ee", "#34d399", "#fbbf24", "#a855f7"],
                      borderColor: "rgba(8,5,15,.9)",
                      borderWidth: 3,
                      hoverOffset: 8,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" as const, labels: { color: "rgba(255,255,255,.6)", boxWidth: 9, font: { size: 10 } } }, tooltip: baseOptions.plugins.tooltip } }}
              />
            </div>
          </Card>
          <div className="grid gap-4">
            <Card className="!rounded-[28px] p-5">
              <SectionHeader title="Top countries" icon={<Eye className="size-4.5 text-sky-200" />} />
              <div className="space-y-2">
                {audience.countries.map((c) => {
                  const max = Math.max(...audience.countries.map((x) => x.value), 1);
                  return (
                    <div key={c.label}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white/70">{c.label}</span>
                        <span className="text-white/40">{Math.round((c.value / max) * 100)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className="vibe-gradient h-full rounded-full" style={{ width: `${(c.value / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card className="!rounded-[28px] p-5">
              <SectionHeader title="Languages" icon={<Gift className="size-4.5 text-coin-400" />} />
              <div className="flex flex-wrap gap-1.5">
                {audience.languages.map((l) => (
                  <span key={l.label} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/65">
                    {l.label} · {l.value}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-white/40">
                Gifts received: <strong className="text-white/75">{stats.giftsReceived}</strong> · sparkles{" "}
                <strong className="text-white/75">{stats.sparkles.toLocaleString()}</strong> · xp{" "}
                <strong className="text-white/75">{stats.xpEarned.toLocaleString()}</strong>
              </p>
            </Card>
          </div>
        </div>
      )}

      {tab === "badges" && (
        <Card className="!rounded-[28px] p-5">
          <SectionHeader title="Achievement progress" subtitle="Badges and frames you've unlocked with activity" icon={<Sparkles className="size-4.5 text-vibe-200" />} />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const owned = me.achievements.includes(a.id);
              return (
                <div key={a.id} className={cn("flex items-center gap-3 rounded-2xl border p-3", owned ? "border-white/12 bg-white/[0.05]" : "border-white/6 bg-white/[0.02] opacity-60")}>
                  <span className="grid size-10 place-items-center rounded-xl bg-white/6 text-xl">{owned ? a.emoji : "🔒"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold">{a.name}</p>
                    <p className="truncate text-[11px] text-white/45">{a.blurb}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/missions"><Button variant="outline">Daily missions</Button></Link>
            <Link to="/profile"><Button variant="soft">Edit profile look</Button></Link>
          </div>
        </Card>
      )}
    </div>
  );
}
