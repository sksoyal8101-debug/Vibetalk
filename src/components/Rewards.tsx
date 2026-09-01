import { CalendarCheck, Check, Flame, Lock, Sparkles, Trophy, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Card } from "./ui";
import { cn } from "../utils/cn";
import { useStore } from "../store/StoreProvider";
import {
  CHECKIN_REWARDS,
  SPIN_SEGMENTS,
  levelTitle,
  type Achievement,
} from "../lib/progression";
import { levelFromXp, todayKey } from "../lib/utils";

/* ------------------------------- Confetti bits ------------------------------ */

function Confetti({ count = 16 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        dx: `${Math.round((Math.random() - 0.5) * 320)}px`,
        rot: `${Math.round(Math.random() * 720 - 360)}deg`,
        delay: `${Math.round(Math.random() * 240)}ms`,
        color: ["#a855f7", "#ec4899", "#fbbf24", "#34d399", "#22d3ee"][i % 5],
      })),
    [count],
  );
  return (
    <span className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
      {bits.map((b) => (
        <span
          key={b.id}
          className="animate-confetti absolute h-2 w-1.5 rounded-sm"
          style={{ background: b.color, animationDelay: b.delay, ["--dx" as string]: b.dx, ["--rot" as string]: b.rot }}
        />
      ))}
    </span>
  );
}

/* --------------------------------- Overlays -------------------------------- */

export function RewardOverlays() {
  const { levelUp, badgeQueue, reward, closeReward, me } = useStore();
  const badge: Achievement | undefined = badgeQueue[0];

  return (
    <>
      {levelUp && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-[96] flex justify-center px-4">
          <div className="animate-levelup vibe-glass relative flex items-center gap-4 overflow-hidden rounded-[28px] px-6 py-5 text-left shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)]">
            <span className="absolute inset-0 vibe-sheen opacity-40" />
            <span className="relative grid size-16 place-items-center rounded-3xl vibe-gradient text-white shadow-[0_18px_40px_-14px_rgba(236,72,153,.9)]">
              <Trophy className="size-8" />
            </span>
            <span className="relative">
              <span className="block text-[10px] font-black uppercase tracking-[0.26em] text-vibe-200">Level up</span>
              <span className="block font-display text-3xl font-extrabold leading-none">
                LV {levelUp.from} → LV {levelUp.to}
              </span>
              <span className="mt-1 block text-xs text-white/60">
                {levelTitle(levelUp.to)} · {me ? levelFromXp(me.xp).total.toLocaleString() : 0} xp total · frames may have unlocked
              </span>
            </span>
            <Confetti />
          </div>
        </div>
      )}

      {badge && !levelUp && (
        <div className="pointer-events-none fixed inset-x-0 top-1/4 z-[96] flex justify-center px-4">
          <div className="animate-badgepop vibe-glass relative flex items-center gap-4 overflow-hidden rounded-[28px] px-6 py-5">
            <span className="animate-pop grid size-16 place-items-center rounded-3xl bg-white/8 text-4xl ring-1 ring-white/20">
              {badge.emoji}
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.26em] text-blush-300">Badge unlocked</span>
              <span className="block font-display text-2xl font-extrabold leading-tight">{badge.name}</span>
              <span className="mt-0.5 block text-xs text-white/60">
                {badge.blurb} · +{badge.xp} xp
              </span>
            </span>
            <Confetti count={12} />
          </div>
        </div>
      )}

      {reward && (
        <div className="fixed inset-0 z-[97] grid place-items-center px-4" onClick={closeReward}>
          <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm" />
          <div className="animate-pop vibe-glass relative w-full max-w-sm overflow-hidden rounded-[30px] p-7 text-center">
            <div className="vibe-gradient pointer-events-none absolute -right-16 -top-20 size-52 rounded-full opacity-40 blur-3xl" />
            <div className="animate-pop relative mx-auto grid size-24 place-items-center rounded-full bg-white/8 text-6xl ring-1 ring-white/20">
              {reward.emoji}
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.26em] text-vibe-200">
              {reward.tone === "badge" ? "Reward & badge" : reward.tone === "coins" ? "Reward claimed" : "Nice"}
            </p>
            <h3 className="mt-1.5 font-display text-2xl font-extrabold">{reward.title}</h3>
            {reward.lines.map((l) => (
              <p key={l} className="mt-1 text-sm text-white/60">
                {l}
              </p>
            ))}
            <Button className="mt-5 w-full" onClick={closeReward}>
              Collect
            </Button>
            <p className="mt-3 text-[10px] uppercase tracking-widest text-white/25">Virtual demo reward · no cash value</p>
            <Confetti count={20} />
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Daily check-in ------------------------------ */

export function CheckInPanel({ compactMode = false }: { compactMode?: boolean }) {
  const { me, canCheckIn, claimCheckin, checkinDay, checkinStreak } = useStore();
  if (!me) return null;
  const claimed = new Set(me.checkinDates ?? []);
  const today = todayKey();

  return (
    <Card className={cn("relative overflow-hidden !rounded-[28px] p-4 sm:p-5", compactMode && "!rounded-3xl")}>
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-coin-500/25 blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-coin-500/18 text-coin-400 ring-1 ring-coin-400/30">
          <CalendarCheck className="size-5.5" />
        </span>
        <div className="min-w-[160px] flex-1">
          <p className="font-display text-base font-extrabold">Daily check-in</p>
          <p className="text-[11px] text-white/45">
            Day {checkinDay} of 7 · {checkinStreak > 0 ? `${checkinStreak} day streak` : "start a streak today"} · one claim per day
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/60">
          {checkinStreak > 0 ? <Flame className="size-3.5 text-blush-400" /> : <Sparkles className="size-3.5 text-vibe-200" />}
          {claimed.has(today) ? "Claimed today" : canCheckIn ? "Ready" : "Locked"}
        </span>
      </div>

      <div className={cn("relative mt-4 grid gap-2", compactMode ? "grid-cols-4 sm:grid-cols-7" : "grid-cols-4 sm:grid-cols-7")}>
        {CHECKIN_REWARDS.map((r) => {
          const isNext = r.day === checkinDay && canCheckIn;
          const isDone = r.day < checkinDay || (claimed.has(today) && r.day === checkinDay - 1);
          return (
            <div
              key={r.day}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition",
                isDone
                  ? "border-mint-400/40 bg-mint-400/[0.09]"
                  : isNext
                    ? "animate-pop border-coin-400/60 bg-coin-500/[0.14] shadow-[0_16px_40px_-22px_rgba(251,191,36,.9)]"
                    : "border-white/8 bg-white/[0.03]",
              )}
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Day {r.day}</span>
              <span className={cn("text-xl", !isDone && !isNext && "opacity-60 grayscale")}>{r.emoji}</span>
              <span className="text-[10px] font-bold leading-tight text-white/75">
                {r.coins.toLocaleString()} <span className="text-white/40">VC</span>
              </span>
              <span className="text-[9px] text-vibe-200">+{r.xp} xp</span>
              {isDone && (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-mint-400 text-ink-950">
                  <Check className="size-2.5" />
                </span>
              )}
              {r.day === 7 && (
                <span className="absolute left-1 top-1 rounded-full bg-blush-500/25 px-1 text-[8px] font-black text-blush-200">
                  BADGE
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={!canCheckIn} onClick={claimCheckin} icon={canCheckIn ? <Zap className="size-3.5" /> : <Lock className="size-3.5" />}>
          {canCheckIn ? `Claim day ${checkinDay}` : "Back tomorrow"}
        </Button>
        <p className="text-[11px] text-white/40">
          {CHECKIN_REWARDS[Math.min(checkinDay, 7) - 1].label} · rewards are virtual and stored on this device
        </p>
      </div>
    </Card>
  );
}

/* -------------------------------- Lucky spin -------------------------------- */

export function LuckySpinPanel() {
  const { me, canSpin, spin, pushToast, db } = useStore();
  const [rot, setRot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [landed, setLanded] = useState<string | null>(null);
  if (!me) return null;

  const segment = 360 / SPIN_SEGMENTS.length;

  function go() {
    if (busy) return;
    if (!canSpin) {
      pushToast("One free spin per day — tomorrow's wheel is already loading.", "info");
      return;
    }
    const res = spin();
    if (!res) return;
    setBusy(true);
    setLanded(null);
    // land the winning segment's centre exactly under the top pointer
    const target = -(res.index * segment + segment / 2);
    const current = ((rot % 360) + 360) % 360;
    const delta = (((target - current) % 360) + 360) % 360;
    setRot(rot + 360 * 5 + delta);
    window.setTimeout(() => {
      setBusy(false);
      setLanded(res.segment.label);
    }, 3300);
  }

  return (
    <Card className="relative overflow-hidden !rounded-[28px] p-5">
      <div className="pointer-events-none absolute -left-16 bottom-[-70px] h-52 w-52 rounded-full bg-blush-500/25 blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-4">
        <div className="relative mx-auto grid size-[248px] shrink-0 place-items-center sm:size-[268px]">
          <span className="absolute inset-0 rounded-full bg-white/5 ring-1 ring-white/10" />
          <span
            className={cn("absolute inset-2 rounded-full transition-transform duration-[3200ms] [transition-timing-function:cubic-bezier(.15,.9,.1,1)]")}
            style={{
              transform: `rotate(${rot}deg)`,
              background: `conic-gradient(${SPIN_SEGMENTS.map((s, i) => `${s.color} ${i * segment}deg ${(i + 1) * segment}deg`).join(",")})`,
            }}
          >
            {SPIN_SEGMENTS.map((s, i) => (
              <span
                key={s.id}
                className="absolute left-1/2 top-1/2 flex w-[46px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-center"
                style={{ transform: `rotate(${i * segment + segment / 2}deg) translateY(-84px) rotate(${-(i * segment + segment / 2)}deg)` }}
              >
                <span className="text-lg leading-none">{s.emoji}</span>
                <span className="text-[8px] font-black uppercase leading-tight tracking-tight text-white/85">{s.label.split(" ")[0]}</span>
              </span>
            ))}
          </span>
          <span className="absolute inset-[86px] grid place-items-center rounded-full bg-ink-900 text-center ring-1 ring-white/12">
            <span>
              <span className="block font-display text-[13px] font-extrabold leading-tight">{canSpin ? "Free spin" : "Spun today"}</span>
              <span className="block text-[10px] text-white/45">{me.spins} total · demo</span>
            </span>
          </span>
          <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2">
            <span className="block size-0 border-x-[9px] border-t-[16px] border-x-transparent border-t-coin-400 drop-shadow-[0_6px_10px_rgba(251,191,36,.6)]" />
          </span>
        </div>

        <div className="min-w-[200px] flex-1">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-blush-300">
            <Sparkles className="size-3" /> Daily lucky spin
          </p>
          <h3 className="mt-1.5 font-display text-xl font-extrabold leading-tight">Spin once a day for coins, xp or a badge</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-white/50">
            Eight segments, all virtual. No wagering, no coins spent, no cash value — it exists so the demo feels
            rewarding.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={go} disabled={busy || !canSpin} icon={<Zap className={cn("size-4", busy && "animate-spin")} />}>
              {busy ? "Spinning…" : canSpin ? "Spin the wheel" : "Come back tomorrow"}
            </Button>
            {landed && (
              <span className="animate-count rounded-full border border-mint-400/40 bg-mint-400/10 px-3 py-1.5 text-[11px] font-bold text-mint-400">
                Landed on {landed}
              </span>
            )}
          </div>
          <p className="mt-2.5 text-[10px] text-white/30">
            Next free spin unlocks at midnight · spins on this device: {db.users.length > 0 ? me.spins : 0}
          </p>
        </div>
      </div>
    </Card>
  );
}
