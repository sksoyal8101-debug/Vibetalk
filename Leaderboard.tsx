import { Coins, Crown, Flame, Gift, Radio, Sparkles, Star, TrendingUp, Trophy, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeChip } from "../components/badges";
import { Avatar, Button, Card, CoinPill, SectionHeader } from "../components/ui";
import { useStore } from "../store/StoreProvider";
import { BOARD_TABS, leaderboard, type BoardTab } from "../lib/social";
import { achievementById, levelTitle } from "../lib/progression";
import { compact, gradientFor, levelFromXp } from "../lib/utils";
import { cn } from "../utils/cn";

import { BOARD_SCOPES, type BoardScope } from "../lib/social";
import { useSocial } from "../store/SocialProvider";
import { friendIds } from "../lib/engine";

export function Leaderboard() {
  const { db, me, myFollows, toggleFollow } = useStore();
  const { ctx } = useSocial();
  const [tab, setTab] = useState<BoardTab>("xp");
  const [scope, setScope] = useState<BoardScope>("global");

  const myFriends = useMemo(() => friendIds(ctx), [ctx]);
  const rows = useMemo(() => leaderboard(db, tab, me?.id, scope, myFriends), [db, me?.id, myFriends, scope, tab]);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3, 25);
  const myRankIndex = rows.findIndex((r) => r.user.id === me?.id);
  const myRow = myRankIndex >= 0 ? rows[myRankIndex] : null;

  return (
    <div className="space-y-6">
      <Card className="relative flex flex-wrap items-center gap-4 overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="vibe-gradient pointer-events-none absolute -left-20 -top-24 size-64 rounded-full opacity-25 blur-3xl" />
        <span className="relative grid size-14 place-items-center rounded-3xl bg-coin-500/18 text-coin-400 ring-1 ring-coin-400/30">
          <Trophy className="size-7" />
        </span>
        <div className="relative min-w-[220px] flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Community leaderboard</h1>
          <p className="mt-1 text-sm text-white/55">
            Ranked from demo activity on this device — rooms, gifts, chat and xp. No cash prizes, ever.
          </p>
        </div>
        <div className="relative flex gap-2">
          <Link to="/games">
            <Button size="sm" variant="outline" icon={<Sparkles className="size-3.5" />}>Earn points</Button>
          </Link>
          <Link to="/rewards">
            <Button size="sm" variant="soft" icon={<Zap className="size-3.5" />}>Dailies</Button>
          </Link>
        </div>
      </Card>

      {/* Scope Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
          {BOARD_SCOPES.map((s) => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className={cn(
                "tap rounded-xl px-3.5 py-1.5 text-xs font-bold transition",
                scope === s.key ? "vibe-gradient text-white shadow-sm" : "text-white/50 hover:text-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {myRow && (
          <div className="flex items-center gap-2 rounded-2xl border border-vibe-400/40 bg-vibe-600/15 px-3.5 py-1.5">
            <Avatar user={me} size={24} showFrame={false} />
            <span className="text-xs font-bold text-white">Your Rank: #{myRow.rank}</span>
            <span className="text-[10px] font-black text-vibe-200">({compact(myRow.score)} pts)</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
        {BOARD_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "tap flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition",
              tab === t.key ? "vibe-gradient text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            {t.key === "hosts" ? <Crown className="size-3.5" /> : t.key === "gifters" ? <Gift className="size-3.5" /> : t.key === "xp" ? <Zap className="size-3.5" /> : t.key === "coins" ? <Coins className="size-3.5" /> : t.key === "rooms" ? <Radio className="size-3.5" /> : t.key === "active" ? <Users className="size-3.5" /> : <TrendingUp className="size-3.5" />}
            {t.label}
          </button>
        ))}
      </div>
      <p className="-mt-3 text-xs text-white/40">{BOARD_TABS.find((t) => t.key === tab)?.blurb}</p>

      {rows.length === 0 ? (
        <Card className="p-8 text-center !rounded-3xl">
          <Trophy className="size-8 mx-auto text-white/30 mb-2" />
          <p className="font-display text-base font-bold text-white">No members ranked yet</p>
          <p className="text-xs text-white/45 mt-1 max-w-sm mx-auto">
            {scope === "friends"
              ? "Add friends from Discover or rooms to see your friends leaderboard."
              : "Participate in rooms, chat and games to appear on this board."}
          </p>
          {scope === "friends" && (
            <Link to="/friends" className="mt-4 inline-block">
              <Button size="sm">Find friends</Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          {/* podium */}
          <section className="grid gap-3 sm:grid-cols-3">
        {[1, 0, 2].map((idx) => {
          const row = podium[idx];
          if (!row) return <div key={idx} className="hidden sm:block" />;
          const first = row.rank === 1;
          return (
            <Link
              key={row.user.id}
              to={`/u/${row.user.id}`}
              className={cn(
                "tap group relative flex flex-col items-center overflow-hidden rounded-[28px] border p-5 text-center transition hover:-translate-y-1",
                first ? "border-coin-400/50 bg-coin-500/[0.08] sm:-mt-4 sm:pb-8" : "border-white/10 bg-white/[0.03]",
              )}
            >
              <span
                className={cn("pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-40 blur-3xl transition group-hover:opacity-70", first ? "bg-coin-400/40" : "bg-vibe-500/30")}
              />
              <span
                className={cn(
                  "relative grid size-7 place-items-center rounded-full text-[11px] font-black",
                  first ? "bg-coin-400 text-ink-950" : row.rank === 2 ? "bg-white/25 text-ink-950" : "bg-amber-700/60 text-amber-100",
                )}
              >
                {row.rank}
              </span>
              <Avatar user={row.user} size={first ? 84 : 64} showStatus className="relative mt-3" />
              <p className="mt-2.5 truncate text-sm font-extrabold">@{row.user.username}</p>
              <p className="text-[11px] text-white/45">
                LV {levelFromXp(row.user.xp).level} · {levelTitle(row.user.level)}
              </p>
              <p className={cn("mt-2 font-display text-xl font-extrabold", first ? "text-coin-400" : "text-white/85")}>{compact(row.score)}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/35">score</p>
              <p className="mt-1.5 text-[11px] text-white/55">{row.label}</p>
              <div className="mt-2.5 flex flex-wrap justify-center gap-1">
                {row.user.achievements.slice(0, 3).map((id) => {
                  const def = achievementById(id);
                  return def ? <BadgeChip key={id} def={def} unlocked size="sm" /> : null;
                })}
              </div>
              {me && row.user.id !== me.id && (
                <Button
                  size="sm"
                  variant={myFollows.includes(row.user.id) ? "soft" : "outline"}
                  className="mt-3"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFollow(row.user.id);
                  }}
                >
                  {myFollows.includes(row.user.id) ? "Following" : "Follow"}
                </Button>
              )}
              {me && row.user.id === me.id && (
                <span className="mt-3 rounded-full bg-vibe-600/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-vibe-200">
                  You
                </span>
              )}
            </Link>
          );
        })}
      </section>

      <section>
        <SectionHeader title="Ranks 4–20" subtitle="Tap anyone for their profile" icon={<Star className="size-4.5 text-vibe-200" />} />
        <Card className="divide-y divide-white/6 !rounded-3xl p-0">
          {rest.map((row) => (
            <Link key={row.user.id} to={`/u/${row.user.id}`} className="flex items-center gap-3 p-3 transition hover:bg-white/[0.04]">
              <span className="w-7 shrink-0 text-center font-display text-sm font-black text-white/35">{row.rank}</span>
              <Avatar user={row.user} size={40} showStatus />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                  @{row.user.username}
                  {row.user.verified && <span className="size-1.5 rounded-full bg-sky-300" />}
                  {row.badge && (
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider", row.badge === "You" ? "vibe-gradient text-white" : "bg-white/8 text-white/55")}>
                      {row.badge}
                    </span>
                  )}
                </p>
                <p className="truncate text-[11px] text-white/45">
                  {row.label} · {row.sub}
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 text-[11px] font-bold text-white/45 sm:flex">
                <Flame className="size-3.5 text-coin-400" /> {levelFromXp(row.user.xp).total.toLocaleString()} xp
              </span>
              <span className="w-14 shrink-0 text-right font-display text-sm font-extrabold text-vibe-200">{compact(row.score)}</span>
            </Link>
          ))}
        </Card>
      </section>
      </>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {me && (
          <Card className="flex items-center gap-3 !rounded-3xl p-4">
            <span className="grid size-11 place-items-center rounded-2xl" style={{ backgroundImage: gradientFor(me.id) }}>
              <Trophy className="size-5 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Your rank: #{rows.findIndex((r) => r.user.id === me.id) + 1 || "—"}</p>
              <p className="text-[11px] text-white/45">on {BOARD_TABS.find((t) => t.key === tab)?.label}</p>
            </div>
            <CoinPill amount={me.coins} />
          </Card>
        )}
        <Card className="!rounded-3xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">How ranking works</p>
          <p className="mt-2 text-[11px] leading-relaxed text-white/50">
            Scores combine room seats held, messages sent, gifts given, xp earned and online time — all computed from
            local demo data, then re-sorted every render.
          </p>
        </Card>
        <Card className="!rounded-3xl border-amber-400/25 bg-amber-400/[0.06] p-4">
          <p className="text-xs leading-relaxed text-amber-100/85">
            <strong className="text-amber-200">Status, not money.</strong> Leaderboard positions, sparkles and points
            are social signals inside the app only. They are never convertible to cash and never a measure of anyone's
            worth.
          </p>
        </Card>
      </div>
    </div>
  );
}
