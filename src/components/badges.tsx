import { Lock, Sparkles, Star } from "lucide-react";
import { Avatar, Card, Progress } from "./ui";
import { cn } from "../utils/cn";
import { useStore } from "../store/StoreProvider";
import {
  ACHIEVEMENTS,
  achievementProgress,
  BADGE_TIER_STYLE,
  levelTitle,
  type Achievement,
} from "../lib/progression";
import { levelFromXp } from "../lib/utils";
import type { User } from "../lib/types";

export function BadgeChip({
  def,
  unlocked,
  size = "md",
  onClick,
}: {
  def: Achievement;
  unlocked: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
}) {
  const style = BADGE_TIER_STYLE[def.tier];
  return (
    <button
      onClick={onClick}
      title={unlocked ? `${def.name} — ${def.blurb}` : `Locked — ${def.blurb}`}
      className={cn(
        "tap group inline-flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 transition",
        unlocked ? style.chip : "border-white/8 bg-white/[0.02] text-white/35",
        !unlocked && "grayscale",
      )}
    >
      <span className={cn("leading-none", unlocked && "transition group-hover:scale-110")}>{unlocked ? def.emoji : <Lock className="size-3.5" />}</span>
      <span className={cn("font-bold", size === "sm" ? "text-[10px]" : "text-[11px]")}>{def.name}</span>
    </button>
  );
}

export function BadgeGrid({ user, dense = false }: { user: User; dense?: boolean }) {
  const { db } = useStore();
  const rows = achievementProgress(user, db);
  const unlocked = rows.filter((r) => r.unlocked).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/65">
          <Star className="size-3.5 text-coin-400" /> {unlocked}/{ACHIEVEMENTS.length} unlocked
        </span>
        <span className="text-[11px] text-white/40">
          {unlocked > 0 ? `${(unlocked * 2).toLocaleString()} bonus sparkles from badges` : "Send a gift, join a room or check in to earn your first badge"}
        </span>
      </div>
      <div className={cn("grid gap-2.5", dense ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {rows.map((row) => (
          <div
            key={row.def.id}
            className={cn(
              "relative flex items-start gap-3 overflow-hidden rounded-3xl border p-3.5 transition",
              row.unlocked
                ? "border-white/12 bg-white/[0.05]"
                : "border-white/6 bg-white/[0.02]",
            )}
          >
            {row.unlocked && (
              <span
                className="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full opacity-30 blur-2xl"
                style={{ background: BADGE_TIER_STYLE[row.def.tier].ring }}
              />
            )}
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ring-1",
                row.unlocked ? "ring-white/15" : "bg-white/[0.03] opacity-50 ring-white/5 grayscale",
              )}
              style={row.unlocked ? { background: `${BADGE_TIER_STYLE[row.def.tier].ring}`, boxShadow: `0 14px 34px -18px ${BADGE_TIER_STYLE[row.def.tier].ring}` } : undefined}
            >
              {row.unlocked ? row.def.emoji : "🔒"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-bold">
                {row.def.name}
                <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest", BADGE_TIER_STYLE[row.def.tier].chip)}>
                  {row.def.tier}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/45">{row.def.blurb}</p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={Math.round((row.have / row.need) * 100)} className="h-1 max-w-[120px]" />
                <span className="text-[10px] font-bold text-white/40">
                  {row.have}/{row.need}
                </span>
                {row.unlocked ? (
                  <span className="ml-auto text-[10px] font-black text-mint-400">+{row.def.xp} xp</span>
                ) : (
                  <span className="ml-auto text-[10px] text-white/30">locked</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LevelCard({ user, className }: { user: User; className?: string }) {
  const curve = levelFromXp(user.xp);
  const unlocked = user.achievements.length;
  return (
    <Card className={cn("relative overflow-hidden !rounded-[28px] p-5", className)}>
      <div className="vibe-gradient pointer-events-none absolute -left-14 -top-16 size-48 rounded-full opacity-30 blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-4">
        <div className="relative">
          <Avatar user={user} size={64} />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-ink-950 px-2 py-0.5 text-[9px] font-black tracking-widest text-vibe-200 ring-1 ring-vibe-400/40">
            LV {curve.level}
          </span>
        </div>
        <div className="min-w-[180px] flex-1">
          <p className="font-display text-lg font-extrabold">
            {levelTitle(curve.level)} <span className="text-white/35">·</span>{" "}
            <span className="text-vibe-200">{curve.total.toLocaleString()} xp</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Progress value={curve.pct} className="h-2 flex-1" />
            <span className="text-[11px] font-bold text-white/55">
              {curve.into}/{curve.need}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-white/40">
            {curve.need - curve.into > 0 ? `${(curve.need - curve.into).toLocaleString()} xp to level ${curve.level + 1}` : "Level complete — keep going"} · {unlocked}/{ACHIEVEMENTS.length} badges
          </p>
        </div>
        <div className="flex gap-1.5">
          {ACHIEVEMENTS.filter((a) => user.achievements.includes(a.id))
            .slice(-4)
            .map((a) => (
              <span key={a.id} className="grid size-9 place-items-center rounded-xl bg-white/6 text-lg ring-1 ring-white/10" title={a.name}>
                {a.emoji}
              </span>
            ))}
          {unlocked === 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-2 text-[11px] font-bold text-white/45">
              <Sparkles className="size-3.5" /> no badges yet
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
