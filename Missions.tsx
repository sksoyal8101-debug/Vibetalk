import { Award, CalendarCheck, Check, Coins, Flame, Gift, Sparkles, Star, Target, Trophy, Zap } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, Chip, Progress, Reveal, SectionHeader, StatTile } from "../components/ui";
import { missionProgress, streakRows } from "../lib/engine";
import { levelFromXp } from "../lib/utils";
import { levelTitle } from "../lib/progression";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";

export function Missions() {
  const { me, db } = useStore();
  const { ctx, claimMission, social } = useSocial();
  const { daily, weekly, dailyDone, weeklyDone } = useMemo(() => missionProgress(ctx), [ctx]);
  const streaks = useMemo(() => streakRows(ctx), [ctx]);

  if (!me) return null;

  const curve = levelFromXp(me.xp);
  const dailyPct = Math.round((dailyDone / Math.max(1, daily.length)) * 100);
  const weeklyPct = Math.round((weeklyDone / Math.max(1, weekly.length)) * 100);
  const xpToday = daily.reduce((sum, r) => sum + (r.done ? r.mission.xp : 0), 0);
  const coinsToday = daily.reduce((sum, r) => sum + (r.done ? r.mission.coins : 0), 0);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="vibe-gradient pointer-events-none absolute -right-20 -top-24 size-64 rounded-full opacity-25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-[230px] flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-coin-400">Gamification</p>
            <h1 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">Missions &amp; streaks</h1>
            <p className="mt-2 max-w-lg text-sm text-white/55">
              Small goals that map to things worth doing anyway — showing up, being kind in chat, playing a game.
              Rewards are demo coins, xp, badges and frames.
            </p>
          </div>
          <div className="grid w-full max-w-[340px] grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile label="Daily" value={`${dailyDone}/${daily.length}`} tone="violet" />
            <StatTile label="Weekly" value={`${weeklyDone}/${weekly.length}`} tone="pink" />
            <StatTile label="XP today" value={xpToday} tone="mint" />
            <StatTile label="Coins" value={me.coins} tone="coin" />
          </div>
        </div>

        <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-white/50">
              <span className="inline-flex items-center gap-1.5"><Target className="size-3.5 text-vibe-200" /> Daily progress</span>
              <span>{dailyPct}%</span>
            </div>
            <Progress value={dailyPct} className="mt-2 h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-white/50">
              <span className="inline-flex items-center gap-1.5"><Trophy className="size-3.5 text-coin-400" /> Weekly progress</span>
              <span>{weeklyPct}%</span>
            </div>
            <Progress value={weeklyPct} className="mt-2 h-2" />
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          <Link to="/rewards">
            <Button size="sm" variant="outline" icon={<CalendarCheck className="size-3.5" />}>Daily rewards</Button>
          </Link>
          <Link to="/games">
            <Button size="sm" variant="soft" icon={<Zap className="size-3.5" />}>Play for points</Button>
          </Link>
          <span className="ml-auto self-center text-[11px] text-white/40">
            {coinsToday.toLocaleString()} demo coins claimable today
          </span>
        </div>
      </Card>

      <section>
        <SectionHeader title="Social streaks" subtitle="One action a day keeps each one alive" icon={<Flame className="size-4.5 text-blush-400" />} />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {streaks.map((s, i) => (
            <Reveal key={s.key} delay={i * 60}>
              <Card className={cn("relative h-full overflow-hidden !rounded-3xl p-4", s.activeToday && "border-mint-400/35 bg-mint-400/[0.06]")}>
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-white/6 text-xl">{s.emoji}</span>
                  {s.activeToday && (
                    <span className="rounded-full bg-mint-400/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-mint-400">today ✓</span>
                  )}
                </div>
                <p className="mt-2.5 text-[13px] font-bold">{s.label}</p>
                <p className="text-[11px] text-white/45">{s.blurb}</p>
                <p className="mt-2 font-display text-2xl font-extrabold">
                  {s.days}
                  <span className="ml-1 text-[11px] font-bold text-white/40">day{s.days === 1 ? "" : "s"}</span>
                </p>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 7 }, (_, k) => (
                    <span key={k} className={cn("h-1.5 flex-1 rounded-full", k < Math.min(7, s.days) ? "vibe-gradient" : "bg-white/8")} />
                  ))}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Daily missions" subtitle="Resets at midnight · progress tracked automatically" icon={<Target className="size-4.5 text-coin-400" />} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {daily.map((row, i) => (
            <Reveal key={row.mission.id} delay={Math.min(i, 6) * 45}>
              <Card className={cn("flex h-full items-center gap-3.5 !rounded-3xl p-3.5", row.done && "border-mint-400/30")}>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/6 text-xl">{row.mission.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[13px] font-bold">
                    {row.mission.label}
                    {row.done && <Check className="size-3.5 text-mint-400" />}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-white/45">{row.mission.hint}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={(row.have / row.mission.goal) * 100} className="h-1.5 max-w-[130px]" />
                    <span className="text-[10px] font-bold text-white/45">{row.have}/{row.mission.goal}</span>
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-black text-coin-400">
                      <Coins className="size-3" /> {row.mission.coins} · +{row.mission.xp} xp
                    </span>
                  </div>
                </div>
                <Button size="sm" variant={row.claimed ? "soft" : row.done ? "primary" : "outline"} disabled={!row.done || row.claimed} onClick={() => claimMission(row.mission.id, "daily")}>
                  {row.claimed ? "Claimed" : row.done ? "Claim" : "Locked"}
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Weekly missions" subtitle={`${social.missions.week} · bigger rewards, more time`} icon={<Award className="size-4.5 text-vibe-200" />} />
        <div className="grid gap-2.5 lg:grid-cols-2">
          {weekly.map((row) => (
            <Card key={row.mission.id} className={cn("!rounded-[26px] p-4", row.done && "border-coin-400/30 bg-coin-500/[0.05]")}>
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: "linear-gradient(140deg,rgba(124,58,237,.35),rgba(236,72,153,.28))" }}>
                  {row.mission.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{row.mission.label}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">{row.mission.hint}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={(row.have / row.mission.goal) * 100} className="h-1.5" />
                    <span className="shrink-0 text-[10px] font-bold text-white/50">{row.have}/{row.mission.goal}</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Chip className="pointer-events-none">+{row.mission.xp} xp</Chip>
                    {row.mission.coins > 0 && (
                      <Chip className="pointer-events-none">
                        <Coins className="mr-1 inline size-3" />
                        {row.mission.coins.toLocaleString()}
                      </Chip>
                    )}
                    {row.mission.reward && (
                      <Chip className="pointer-events-none">
                        <Star className="mr-1 inline size-3" />
                        {row.mission.reward}
                      </Chip>
                    )}
                    <Button size="sm" variant={row.claimed ? "soft" : row.done ? "primary" : "outline"} className="ml-auto" disabled={!row.done || row.claimed} onClick={() => claimMission(row.mission.id, "weekly")}>
                      {row.claimed ? "Claimed" : row.done ? "Claim" : "In progress"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="!rounded-[28px] p-5">
          <SectionHeader title="Your level" subtitle="Every action feeds xp" icon={<Sparkles className="size-4.5 text-vibe-200" />} />
          <div className="flex items-center gap-4">
            <Avatar user={me} size={64} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                Level {curve.level} · {levelTitle(curve.level)}
              </p>
              <Progress value={curve.pct} className="mt-2" />
              <p className="mt-1.5 text-[11px] text-white/45">
                {curve.into}/{curve.need} xp · {me.achievements.length} badges · {db.follows.length} follows
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/leaderboard"><Button size="sm" variant="outline">Leaderboard</Button></Link>
            <Link to="/creator"><Button size="sm" variant="soft">Creator center</Button></Link>
            <Link to="/gifts"><Button size="sm" variant="ghost" icon={<Gift className="size-3.5" />}>Spend coins</Button></Link>
          </div>
        </Card>

        <Card className="!rounded-[28px] border-amber-400/20 bg-amber-400/[0.05] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Fair play</p>
          <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-amber-50/80">
            <li>Missions reward actions that make rooms better, not volume for its own sake.</li>
            <li>Coins, xp, badges and frames have no cash value and cannot be sold or withdrawn.</li>
            <li>Streaks are cosmetic — missing a day never locks your account or deletes data.</li>
            <li>No gambling loops: nothing is wagered and the daily spin is free and capped at one per day.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
