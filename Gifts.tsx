import { BadgeCheck, Coins, Crown, Gift, Search, Send, Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GiftSheet } from "../components/GiftSheet";
import { Avatar, Button, Card, Chip, CoinPill, EmptyState, Input, SectionHeader } from "../components/ui";
import { GIFTS } from "../lib/data";
import { useStore } from "../store/StoreProvider";
import type { Gift as GiftType } from "../lib/types";
import { cn } from "../utils/cn";
import { compact, timeAgo } from "../lib/utils";

export function Gifts() {
  const { me, db, visibleUsers, myFollows, userById } = useStore();
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState<string | null>(myFollows[0] ?? visibleUsers[0]?.id ?? null);
  const [sending, setSending] = useState<GiftType | null>(null);
  const [tier, setTier] = useState<"all" | GiftType["tier"]>("all");

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ranked = [...visibleUsers].sort((a, b) => {
      const af = myFollows.includes(a.id) ? 1 : 0;
      const bf = myFollows.includes(b.id) ? 1 : 0;
      if (af !== bf) return bf - af;
      if (a.online !== b.online) return Number(b.online) - Number(a.online);
      return b.followers - a.followers;
    });
    return q ? ranked.filter((u) => u.username.includes(q) || u.country.toLowerCase().includes(q)) : ranked;
  }, [myFollows, query, visibleUsers]);

  const target = recipient ? userById(recipient) ?? candidates[0] ?? null : candidates[0] ?? null;
  const giftsLedger = db.txns.filter((t) => t.kind.startsWith("gift"));
  const catalog = tier === "all" ? GIFTS : GIFTS.filter((g) => g.tier === tier);
  const leaderboard = useMemo(
    () =>
      [...visibleUsers]
        .map((u) => ({ user: u, sparkles: Math.round(u.followers * 2.4 + u.level * 40) }))
        .sort((a, b) => b.sparkles - a.sparkles)
        .slice(0, 5),
    [visibleUsers],
  );

  return (
    <div className="space-y-6">
      <Card className="relative flex flex-wrap items-center gap-5 overflow-hidden !rounded-[30px] p-5">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-blush-500/25 blur-3xl" />
        <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-blush-500/18 text-2xl ring-1 ring-blush-400/30">
          🎁
        </span>
        <div className="min-w-[220px] flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Gift shop</h1>
          <p className="mt-1 max-w-xl text-sm text-white/55">
            Send appreciation across the app — from a chat thread or straight from a room. Recipients keep 70% as
            sparkles. Gifts are decorative and hold no cash value.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CoinPill amount={me?.coins ?? 0} />
          <Link to="/coins">
            <Button size="sm" variant="outline" icon={<Coins className="size-3.5" />}>Top up</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {/* recipient picker */}
          <section>
            <SectionHeader title="Who are you gifting?" subtitle="Follows and online members first" icon={<Sparkles className="size-4.5 text-blush-300" />} />
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…" className="!py-2.5 !pl-10 text-sm" />
            </div>
            {candidates.length === 0 ? (
              <EmptyState icon={<Gift className="size-6" />} title="Nobody here to gift" body="Follow a member or reset the demo data to get the seeded crowd back." />
            ) : (
              <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {candidates.slice(0, 10).map((u) => {
                  const activeUser = target?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setRecipient(u.id)}
                      className={cn(
                        "tap flex w-[124px] shrink-0 flex-col items-center gap-1.5 rounded-3xl border p-3 transition",
                        activeUser ? "border-blush-400/70 bg-blush-500/12" : "border-white/8 bg-white/[0.03] hover:border-white/25",
                      )}
                    >
                      <Avatar user={u} size={46} showStatus />
                      <span className="flex w-full items-center justify-center gap-1 truncate text-[11px] font-bold">
                        @{u.username}
                        {u.verified && <BadgeCheck className="size-3 shrink-0 text-sky-300" />}
                      </span>
                      <span className="text-[10px] text-white/40">LV {u.level}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* catalog */}
          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <SectionHeader title="Catalog" subtitle="Tap a gift to send it" icon={<Gift className="size-4.5 text-vibe-200" />} />
              <div className="mb-3 flex gap-1.5">
                {(["all", "common", "rare", "epic", "legendary"] as const).map((t) => (
                  <Chip key={t} active={tier === t} onClick={() => setTier(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {catalog.map((g) => {
                const affordable = (me?.coins ?? 0) >= g.price;
                return (
                  <div
                    key={g.id}
                    className="tap group relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60 p-4 text-center transition hover:-translate-y-1"
                    style={{ boxShadow: `inset 0 -60px 60px -60px ${g.hue}55` }}
                  >
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/55">
                      {g.tier}
                    </span>
                    <span className="grid size-16 place-items-center rounded-full text-4xl transition group-hover:scale-110" style={{ background: `${g.hue}22`, boxShadow: `0 14px 40px -18px ${g.hue}` }}>
                      {g.emoji}
                    </span>
                    <p className="mt-3 text-sm font-bold">{g.name}</p>
                    <p className="mt-0.5 text-xs font-black text-coin-400">{g.price.toLocaleString()} VC</p>
                    <Button
                      size="sm"
                      variant={affordable ? "primary" : "soft"}
                      className="mt-3 w-full"
                      disabled={!target}
                      onClick={() => setSending(g)}
                      icon={<Send className="size-3.5" />}
                    >
                      {target ? (affordable ? "Send" : "Need coins") : "Pick a member"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <SectionHeader title="Your gift activity" subtitle="Pulled from the local coin ledger" icon={<Trophy className="size-4.5 text-coin-400" />} />
            {giftsLedger.length === 0 ? (
              <EmptyState icon={<Gift className="size-6" />} title="No gifts yet" body="Send your first gift and it lands here with the coin movement attached." />
            ) : (
              <Card className="divide-y divide-white/6 !rounded-3xl p-0">
                {giftsLedger.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3.5">
                    <span className={cn("grid size-9 place-items-center rounded-xl", t.amount > 0 ? "bg-mint-400/15 text-mint-400" : "bg-blush-500/15 text-blush-300")}>
                      <Gift className="size-4" />
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
        </div>

        <div className="space-y-4">
          <Card className="!rounded-3xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Top gifters</p>
            <div className="mt-3 space-y-2.5">
              {leaderboard.map((row, i) => (
                <Link to={`/u/${row.user.id}`} key={row.user.id} className="tap flex items-center gap-2.5 rounded-2xl p-1.5 transition hover:bg-white/5">
                  <span className={cn("w-4 text-center text-[11px] font-black", i === 0 ? "text-coin-400" : "text-white/35")}>{i + 1}</span>
                  <Avatar user={row.user} size={32} showStatus />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">@{row.user.username}</span>
                    <span className="block text-[10px] text-white/40">{compact(row.sparkles)} sparkles</span>
                  </span>
                  {i === 0 && <Crown className="size-4 shrink-0 text-coin-400" />}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="!rounded-3xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">How gifting works</p>
            <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-white/55">
              {[
                "Pick a member — from a profile, a room seat or a chat.",
                "Coins are deducted from your local balance instantly.",
                "The recipient receives 70% as sparkles in this demo.",
                "A gift entry is added to room chat and your coin history.",
              ].map((line, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-vibe-600/30 text-[10px] font-black text-vibe-200">{i + 1}</span>
                  {line}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="!rounded-3xl border-amber-400/25 bg-amber-400/[0.06] p-4">
            <p className="text-xs leading-relaxed text-amber-100/85">
              <strong className="text-amber-200">No cash-out.</strong> Gifts, sparkles and Vibe Coins are virtual
              items with zero monetary value. Gifting someone is not a purchase of their time or attention.
            </p>
          </Card>
        </div>
      </div>

      <GiftSheet open={!!sending} onClose={() => setSending(null)} toUser={target ?? null} initial={sending ?? undefined} />
    </div>
  );
}
