import { CalendarCheck, Coins, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { CheckInPanel, LuckySpinPanel } from "../components/Rewards";
import { LevelCard } from "../components/badges";
import { Avatar, Button, Card, CoinPill, EmptyState, SectionHeader } from "../components/ui";
import { useStore } from "../store/StoreProvider";
import { CHECKIN_REWARDS, levelTitle } from "../lib/progression";
import { levelFromXp, timeAgo } from "../lib/utils";
import { cn } from "../utils/cn";

export function Rewards() {
  const { me, db } = useStore();
  if (!me) return null;
  const curve = levelFromXp(me.xp);
  const recent = db.txns.filter((t) => ["checkin", "spin", "reward", "gift-received"].includes(t.kind)).slice(0, 8);
  const claimed = new Set(me.checkinDates ?? []);

  return (
    <div className="space-y-6">
      <Card className="relative flex flex-wrap items-center gap-4 overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="vibe-gradient pointer-events-none absolute -right-16 -top-24 size-60 rounded-full opacity-30 blur-3xl" />
        <span className="relative grid size-14 place-items-center rounded-3xl bg-coin-500/18 text-coin-400 ring-1 ring-coin-400/30">
          <Trophy className="size-7" />
        </span>
        <div className="relative min-w-[220px] flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Daily rewards</h1>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Check in, spin the wheel, play a game. Every coin, xp point and badge here is <strong className="text-white/80">virtual</strong> —
            nothing can be bought, sold or cashed out.
          </p>
        </div>
        <div className="relative flex flex-col items-end gap-2">
          <CoinPill amount={me.coins} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-vibe-400/30 bg-vibe-600/15 px-3 py-1.5 text-[11px] font-bold text-vibe-200">
            <Star className="size-3.5" /> LV {curve.level} · {levelTitle(curve.level)}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CheckInPanel />
        <LuckySpinPanel />
      </div>

      <LevelCard user={me} />

      <section>
        <SectionHeader title="How rewards are earned" subtitle="Local demo economy" icon={<Zap className="size-4.5 text-coin-400" />} />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Daily check-in", body: "100 → 1,500 coins across 7 days, badge on day 7.", icon: CalendarCheck, to: "/rewards" },
            { label: "Lucky spin", body: "One free spin a day for coins, xp or a badge.", icon: Sparkles, to: "/rewards" },
            { label: "Join a voice room", body: "40 xp every time you take a seat.", icon: Zap, to: "/rooms" },
            { label: "Chat & message", body: "12 xp per room message, 8 xp per DM.", icon: Coins, to: "/messages" },
            { label: "Follow members", body: "15 xp per new follow.", icon: Star, to: "/search" },
            { label: "Games", body: "25–60 demo points per result, small coin bonus.", icon: Trophy, to: "/games" },
          ].map((r) => (
            <Link key={r.label} to={r.to}>
              <Card interactive className="flex h-full items-start gap-3 !rounded-2xl p-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-vibe-200 ring-1 ring-white/10">
                  <r.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{r.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-white/45">{r.body}</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Reward history" subtitle="Pulled from your coin ledger" icon={<Coins className="size-4.5 text-mint-400" />} />
        {recent.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="size-6" />}
            title="No rewards claimed yet"
            body="Claim today's check-in or spin the wheel — both land in this list instantly."
            action={<Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Claim at the top</Button>}
          />
        ) : (
          <Card className="divide-y divide-white/6 !rounded-3xl p-0">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3.5">
                <span className={cn("grid size-9 place-items-center rounded-xl", t.amount > 0 ? "bg-mint-400/15 text-mint-400" : "bg-rose-500/15 text-rose-200")}>
                  <Coins className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{t.label}</p>
                  <p className="text-[11px] text-white/40">{timeAgo(t.at)} ago · demo ledger</p>
                </div>
                <span className={cn("text-sm font-black", t.amount > 0 ? "text-mint-400" : "text-rose-300")}>
                  {t.amount > 0 ? "+" : ""}
                  {t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>

      <Card className="!rounded-3xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Streak calendar</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const done = claimed.has(key);
            return (
              <span
                key={key}
                title={`${key}${done ? " · claimed" : ""}`}
                className={cn(
                  "grid size-8 place-items-center rounded-xl text-[10px] font-black transition",
                  done ? "vibe-gradient text-white" : "bg-white/5 text-white/30 ring-1 ring-white/8",
                )}
              >
                {d.getDate()}
              </span>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-white/45">
            Day {CHECKIN_REWARDS.length} pays {CHECKIN_REWARDS[CHECKIN_REWARDS.length - 1].coins.toLocaleString()} coins + a badge
          </span>
          <Link to="/coins" className="text-[11px] font-bold text-vibe-200 hover:text-white">
            Coin wallet →
          </Link>
          <span className="ml-auto flex -space-x-2">
            {db.users.filter((u) => u.checkinStreak > 3).slice(0, 5).map((u) => (
              <Avatar key={u.id} user={u} size={24} className="ring-2 ring-ink-900" />
            ))}
          </span>
        </div>
      </Card>
    </div>
  );
}
