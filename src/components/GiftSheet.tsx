import { Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GIFTS } from "../lib/data";
import type { Gift, User } from "../lib/types";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";
import { Avatar, Button, Modal } from "./ui";

const TIER_LABEL: Record<Gift["tier"], string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export function GiftSheet({
  open,
  onClose,
  toUser,
  roomId = null,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  toUser: User | null;
  roomId?: string | null;
  initial?: Gift;
}) {
  const { me, sendGift } = useStore();
  const [selected, setSelected] = useState<Gift>(GIFTS[1]);
  const [count, setCount] = useState(1);
  const [flying, setFlying] = useState<Gift | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(initial ?? GIFTS[1]);
      setCount(1);
    }
  }, [open, initial]);

  const total = useMemo(() => selected.price * count, [selected, count]);
  const balance = me?.coins ?? 0;
  const affordable = balance >= total;

  function fire() {
    if (!toUser || !affordable || count < 1) return;
    const res = sendGift(toUser.id, selected, roomId, count);
    if (!res.ok) return;
    setFlying(selected);
    window.setTimeout(() => {
      setFlying(null);
      onClose();
    }, 1700);
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Send a gift"
        subtitle={toUser ? `To @${toUser.username} · demo coins only` : "Pick something fun"}
        wide
      >
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <Avatar user={toUser ?? undefined} size={42} showStatus />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{toUser ? `@${toUser.username}` : "Guest"}</p>
            <p className="truncate text-xs text-white/45">Level {toUser?.level ?? 1} · {toUser?.country ?? "—"} · they keep 70% as sparkles</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-coin-400/30 bg-coin-500/12 px-3 py-1.5 text-xs font-bold text-coin-400">
            <Zap className="size-3.5" />
            {balance.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {GIFTS.map((g) => {
            const active = g.id === selected.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelected(g)}
                className={cn(
                  "tap relative flex flex-col items-center gap-1 rounded-2xl border p-3 transition",
                  active
                    ? "border-vibe-400/70 bg-vibe-600/25 shadow-[0_16px_40px_-20px_rgba(168,85,247,0.9)]"
                    : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]",
                )}
              >
                <span className={cn("text-[26px] leading-none transition", active && "scale-110")}>{g.emoji}</span>
                <span className="text-[11px] font-bold">{g.name}</span>
                <span className="text-[10px] font-semibold text-coin-400">{g.price.toLocaleString()}</span>
                {active && <Sparkles className="absolute -right-1 -top-1 size-4 text-vibe-200" />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Quantity</p>
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 5, 10, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    "tap rounded-xl px-3 py-1.5 text-xs font-bold",
                    count === n ? "vibe-gradient text-white" : "bg-white/6 text-white/60 hover:bg-white/12",
                  )}
                >
                  ×{n}
                </button>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Total</p>
            <p className={cn("font-display text-xl font-extrabold", affordable ? "text-white" : "text-rose-300")}>
              {total.toLocaleString()} <span className="text-xs font-semibold text-coin-400">VC</span>
            </p>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-white/35">
          Tier: {TIER_LABEL[selected.tier]} · Gifts are virtual items with no cash value. Vibe Coins cannot be
          exchanged for money.
        </p>

        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-[2]" onClick={fire} disabled={!affordable}>
            {affordable ? `Send ${selected.emoji} ${selected.name}` : "Not enough Vibe Coins"}
          </Button>
        </div>
      </Modal>

      {flying && (
        <div className="pointer-events-none fixed inset-0 z-[95] grid place-items-center">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]" />
          <div className="relative text-center">
            <div className="animate-gift-fly text-[110px] leading-none drop-shadow-[0_20px_60px_rgba(236,72,153,0.55)]">
              {flying.emoji}
            </div>
            <p className="animate-pop mt-2 font-display text-2xl font-extrabold">
              {count > 1 ? `${count}× ` : ""}
              {flying.name} for @{toUser?.username}
            </p>
            <p className="mt-1 text-sm text-white/60">+{Math.round(total * 0.7).toLocaleString()} sparkles · demo gift</p>
          </div>
        </div>
      )}
    </>
  );
}
