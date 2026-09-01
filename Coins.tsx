import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  Coins as CoinsIcon,
  Dices,
  Gift,
  History,
  Info,
  Plus,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GiftSheet } from "../components/GiftSheet";
import { Avatar, Button, Card, Chip, CoinPill, EmptyState, Modal, Progress, SectionHeader } from "../components/ui";
import { COIN_PACKAGES, GIFTS } from "../lib/data";
import { useStore } from "../store/StoreProvider";
import type { CoinTxn } from "../lib/types";
import { cn } from "../utils/cn";
import { timeAgo } from "../lib/utils";

const TXN_META: Record<CoinTxn["kind"], { label: string; tone: string; icon: typeof Zap }> = {
  purchase: { label: "Pack", tone: "text-coin-400 bg-coin-500/15", icon: Zap },
  "gift-sent": { label: "Gift sent", tone: "text-blush-300 bg-blush-500/15", icon: ArrowUpRight },
  "gift-received": { label: "Gift received", tone: "text-mint-400 bg-mint-400/15", icon: ArrowDownLeft },
  reward: { label: "Reward", tone: "text-vibe-200 bg-vibe-600/20", icon: TrendingUp },
  "demo-topup": { label: "Demo credit", tone: "text-white/70 bg-white/10", icon: Plus },
  checkin: { label: "Daily check-in", tone: "text-mint-400 bg-mint-400/15", icon: CalendarCheck },
  spin: { label: "Lucky spin", tone: "text-blush-300 bg-blush-500/15", icon: Dices },
};

export function Coins() {
  const { me, db, buyCoins, addCoins, visibleUsers, userById } = useStore();
  const [confirm, setConfirm] = useState<number | null>(null);
  const [giftTo, setGiftTo] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "received" | "sent" | "packs" | "rewards">("all");

  const allTxns = useMemo(() => [...db.txns].sort((a, b) => b.at - a.at), [db.txns]);
  const txns = useMemo(() => {
    if (historyFilter === "received") return allTxns.filter((t) => t.kind === "gift-received");
    if (historyFilter === "sent") return allTxns.filter((t) => t.kind === "gift-sent");
    if (historyFilter === "packs") return allTxns.filter((t) => t.kind === "purchase" || t.kind === "demo-topup");
    if (historyFilter === "rewards") return allTxns.filter((t) => t.kind === "reward" || t.kind === "checkin" || t.kind === "spin");
    return allTxns;
  }, [allTxns, historyFilter]);

  const spent = db.txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const earned = db.txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const packagePreset = confirm !== null ? COIN_PACKAGES[confirm] : null;
  const giftRecipient = userById(giftTo ?? visibleUsers[0]?.id ?? "");

  if (!me) return null;

  return (
    <div className="space-y-6">
      {/* --------------------------------- Balance -------------------------------- */}
      <Card className="relative overflow-hidden !rounded-[30px] p-5 sm:p-7">
        <div className="vibe-gradient pointer-events-none absolute -left-20 -top-24 size-64 rounded-full opacity-30 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Vibe Coins balance</p>
            <p className="mt-2 flex items-end gap-2 font-display text-[46px] font-extrabold leading-none tracking-tight sm:text-[58px]">
              {me.coins.toLocaleString()}
              <span className="mb-2 text-sm font-black text-coin-400">VC</span>
            </p>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/45">
              Virtual currency for gifts and boosts. It has no cash value and cannot be exchanged for money in this
              MVP — real payments arrive in version 2.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[1000, 10000].map((n) => (
                <Button key={n} size="sm" variant="coin" icon={<Plus className="size-3.5" />} onClick={() => addCoins(n, "Local test top-up", "demo-topup")}>
                  Add {n.toLocaleString()} (demo)
                </Button>
              ))}
              <Link to="/gifts">
                <Button size="sm" variant="outline" icon={<Gift className="size-3.5" />}>Spend on gifts</Button>
              </Link>
            </div>
          </div>

          <div className="flex min-w-[190px] flex-1 flex-col gap-3 sm:max-w-[240px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Level {me.level}</span>
                <span className="font-bold text-white/70">{Math.round(me.xp).toLocaleString()} xp</span>
              </div>
              <Progress value={(me.xp % 1000) / 10} className="mt-2" />
              <p className="mt-1.5 text-[10px] text-white/35">Gifts, games and room time all add xp.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-mint-400/20 bg-mint-400/[0.07] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Earned</p>
                <p className="mt-1 font-display text-lg font-extrabold text-mint-400">{earned.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-blush-400/20 bg-blush-500/[0.07] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Spent</p>
                <p className="mt-1 font-display text-lg font-extrabold text-blush-300">{spent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* -------------------------------- Packages -------------------------------- */}
      <section>
        <SectionHeader title="Coin packs" subtitle="Demo checkout — no card, no payment provider" icon={<CoinsIcon className="size-4.5 text-coin-400" />} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COIN_PACKAGES.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setConfirm(i)}
              className={cn(
                "tap group relative flex flex-col items-start overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60 p-4 text-left transition hover:-translate-y-1 hover:border-coin-400/50",
                i === 2 && "border-coin-400/40 bg-coin-500/[0.07]",
              )}
            >
              {p.tag && (
                <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/70">
                  {p.tag}
                </span>
              )}
              <span className="grid size-11 place-items-center rounded-2xl bg-coin-500/18 text-coin-400 ring-1 ring-coin-400/30 transition group-hover:scale-110">
                <CoinsIcon className="size-6" />
              </span>
              <p className="mt-3 font-display text-2xl font-extrabold leading-none">{p.amount.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-white/45">
                {p.bonus > 0 ? <span className="font-bold text-mint-400">+{p.bonus.toLocaleString()} bonus</span> : "no bonus"}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full vibe-gradient px-3.5 py-1.5 text-[11px] font-bold text-white">
                Buy · demo <Zap className="size-3" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* --------------------------------- Gifts ---------------------------------- */}
      <section>
        <SectionHeader title="Gift with coins" subtitle="Six gifts, all virtual" icon={<Sparkles className="size-4.5 text-blush-300" />} action={<Link to="/gifts" className="text-xs font-bold text-vibe-200 hover:text-white">Gift shop →</Link>} />
        <Card className="flex items-center gap-3 !rounded-3xl p-3">
          <Avatar user={giftRecipient ?? undefined} size={44} showStatus />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{giftRecipient ? `Send to @${giftRecipient.username}` : "No one to gift yet"}</p>
            <p className="truncate text-[11px] text-white/45">{giftRecipient ? `${giftRecipient.country} · LV ${giftRecipient.level}` : "Follow someone or message them first"}</p>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            {GIFTS.slice(0, 4).map((g) => (
              <span key={g.id} className="grid size-9 place-items-center rounded-xl bg-white/5 text-lg ring-1 ring-white/10">{g.emoji}</span>
            ))}
          </div>
          <Button size="sm" onClick={() => setGiftTo(giftRecipient?.id ?? null)} disabled={!giftRecipient}>Send gift</Button>
        </Card>
      </section>

      {/* -------------------------------- History --------------------------------- */}
      <section>
        <SectionHeader title="Coin history" subtitle="Everything persists in localStorage" icon={<History className="size-4.5 text-vibe-200" />} />
        <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {([
            ["all", "All transactions"],
            ["received", `Received gifts (${allTxns.filter((t) => t.kind === "gift-received").length})`],
            ["sent", `Sent gifts (${allTxns.filter((t) => t.kind === "gift-sent").length})`],
            ["packs", "Packs & Credits"],
            ["rewards", "Rewards & Streak"],
          ] as const).map(([key, label]) => (
            <Chip key={key} active={historyFilter === key} onClick={() => setHistoryFilter(key)}>
              {label}
            </Chip>
          ))}
        </div>
        {txns.length === 0 ? (
          <EmptyState icon={<CoinsIcon className="size-6" />} title="No transactions yet" body="Buy a demo pack or send a gift and this ledger fills up instantly." />
        ) : (
          <Card className="divide-y divide-white/6 !rounded-3xl p-0">
            {txns.slice(0, 12).map((t) => {
              const meta = TXN_META[t.kind];
              return (
                <div key={t.id} className="flex items-center gap-3 p-3.5">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", meta.tone)}>
                    <meta.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{t.label}</p>
                    <p className="text-[11px] uppercase tracking-wider text-white/35">{meta.label} · {timeAgo(t.at)} ago</p>
                  </div>
                  <span className={cn("text-sm font-black", t.amount > 0 ? "text-mint-400" : "text-rose-300")}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </section>

      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Version 1 intentionally skips Google Play Billing, Apple IAP and any payment SDK. Balance changes here are
        simulated so you can test gifting flows end to end.
      </p>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Confirm demo purchase"
        subtitle="No card, no payment provider, no receipt"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!packagePreset) return;
                buyCoins(packagePreset.amount, packagePreset.bonus, `${packagePreset.amount.toLocaleString()} coin pack (demo)`);
                setConfirm(null);
              }}
            >
              Add coins locally
            </Button>
          </>
        }
      >
        {packagePreset && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div>
                <p className="font-display text-xl font-extrabold">{packagePreset.amount.toLocaleString()} Vibe Coins</p>
                <p className="text-[11px] text-white/45">{packagePreset.tag} pack{packagePreset.bonus ? ` · +${packagePreset.bonus.toLocaleString()} bonus` : ""}</p>
              </div>
              <CoinPill amount={me.coins + packagePreset.amount + packagePreset.bonus} />
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-sm font-bold text-amber-100">
              Demo purchase only — real payment will be added later.
            </div>
            <p className="text-[11px] leading-relaxed text-white/40">
              We'll wire Google Play Billing / App Store IAP in version 2. For now the coins are written straight to
              your local ledger so you can test gifts, leaderboards and receipts.
            </p>
          </div>
        )}
      </Modal>

      <GiftSheet open={!!giftTo && !!giftRecipient} onClose={() => setGiftTo(null)} toUser={giftRecipient ?? null} />
    </div>
  );
}
