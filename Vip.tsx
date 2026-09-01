import { Check, Crown, Gem, Lock, Palette, ShieldCheck, Sparkles, Star, X, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipArt } from "../components/art";
import { Avatar, Button, Card, CoinPill, Modal, Reveal, SectionHeader } from "../components/ui";
import { VIP_TIERS, type VipTier } from "../lib/content";
import { FRAMES, THEMES, levelTitle } from "../lib/progression";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";
import { levelFromXp } from "../lib/utils";

export function Vip() {
  const { me, updateMe, pushToast } = useStore();
  const { social, activateVip, cancelVip } = useSocial();
  const [confirm, setConfirm] = useState<VipTier | null>(null);
  const current = social.vip.plan;
  const tier = VIP_TIERS.find((t) => t.id === current) ?? null;
  const rank = (id: string | null) => (id === "diamond" ? 3 : id === "gold" ? 2 : id === "silver" ? 1 : 0);

  if (!me) return null;
  const curve = levelFromXp(me.xp);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden !rounded-[34px] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(70% 90% at 12% 0%, rgba(124,58,237,.5), transparent 62%), radial-gradient(60% 80% at 90% 10%, rgba(251,191,36,.28), transparent 60%)" }} />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-[240px] flex-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
              <Gem className="size-3 text-blush-300" /> VibeTalk Pro
            </p>
            <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.03] tracking-tight sm:text-[46px]">
              VIP is a look,
              <br />
              <span className="vibe-text-gradient">not a leaderboard</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
              Three demo tiers unlock frames, themes, badge styles and name effects — plus priority placement in
              Discover. Coins here are virtual; <strong className="text-white/85">premium purchase will be available in a future version.</strong>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CoinPill amount={me.coins} />
              <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60">
                {tier ? `Active: ${tier.name}` : "No tier active"}
              </span>
              <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60">
                LV {curve.level} · {levelTitle(curve.level)}
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-[240px]">
            <ClipArt tone={current === "diamond" ? 4 : current === "gold" ? 2 : 0} shape={current ? 2 : 6} playing className="h-[210px] w-full rounded-[28px]" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4">
              <Avatar user={me} size={72} showStatus />
              <p className={cn("text-sm font-extrabold", current === "diamond" ? "name-prism" : current === "gold" ? "name-shine" : current ? "name-soft-glow" : "")}>
                @{me.username}
              </p>
              {tier && <span className={cn("vip-badge", `vip-${tier.id}`)}>{tier.id}</span>}
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-3.5 lg:grid-cols-3">
        {VIP_TIERS.map((t, i) => {
          const active = current === t.id;
          const lesser = rank(current) > rank(t.id);
          return (
            <Reveal key={t.id} delay={i * 70}>
              <Card className={cn("relative h-full overflow-hidden !rounded-[30px] p-5", active && "border-white/25 ring-1 ring-white/20")}>
                <span className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-40 blur-3xl" style={{ background: `linear-gradient(140deg,${t.colors[0]},${t.colors[1]})` }} />
                <div className="relative flex items-center justify-between">
                  <p className="font-display text-xl font-extrabold">{t.name}</p>
                  <span className="grid size-9 place-items-center rounded-2xl" style={{ background: `linear-gradient(140deg,${t.colors[0]},${t.colors[1]})` }}>
                    {t.id === "diamond" ? <Gem className="size-4.5 text-white" /> : t.id === "gold" ? <Crown className="size-4.5 text-white" /> : <Star className="size-4.5 text-white" />}
                  </span>
                </div>
                <p className="relative mt-1 text-[11px] uppercase tracking-[0.18em] text-white/40">{t.price} · demo</p>
                <ul className="relative mt-4 space-y-2">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[12.5px] leading-snug text-white/70">
                      <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: t.colors[1] }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="relative mt-5 flex gap-2">
                  <Button className="flex-1" variant={active ? "soft" : "primary"} disabled={active || lesser} onClick={() => setConfirm(t)}>
                    {active ? "Current tier" : lesser ? "Higher tier active" : "Enable demo tier"}
                  </Button>
                  <Link to="/coins"><Button variant="outline" aria-label="Coins">+</Button></Link>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="!rounded-[28px] p-5">
          <SectionHeader title="What VIP unlocks right now" subtitle="Applied to your local profile immediately" icon={<Palette className="size-4.5 text-vibe-200" />} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              { icon: Sparkles, label: "Exclusive frames", body: `${FRAMES.length} frames, tier-gated` },
              { icon: Palette, label: "Premium themes", body: `${THEMES.length} profile backgrounds` },
              { icon: ShieldCheck, label: "Badge styles", body: "Shimmer, foil and prism name plates" },
              { icon: Zap, label: "Priority visibility", body: "Boosted placement in Discover" },
            ].map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
                <f.icon className="size-4.5 text-blush-300" />
                <p className="mt-2 text-[13px] font-bold">{f.label}</p>
                <p className="mt-0.5 text-[11px] text-white/45">{f.body}</p>
              </div>
            ))}
          </div>
          <Link to="/profile" className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-vibe-200 hover:text-white">
            Open the look editor <Zap className="size-3" />
          </Link>
        </Card>

        <Card className="!rounded-[28px] border-amber-400/25 bg-amber-400/[0.06] p-5">
          <SectionHeader title="How VIP is sold later" subtitle="Full transparency" icon={<Lock className="size-4.5 text-amber-200" />} />
          <p className="text-sm leading-relaxed text-amber-50/85">
            Version 2 has no payment SDK — no Google Play Billing, no App Store IAP, no card form. Toggling a tier
            here only writes a local flag so you can preview the experience end to end.
          </p>
          <div className="mt-4 space-y-2">
            {[
              "Recurring subscription billing + grace periods",
              "Receipt validation on a server",
              "Refund and cancellation handling",
              "Family-safe purchase limits and spending caps",
            ].map((line) => (
              <p key={line} className="flex items-start gap-2 text-[12.5px] text-white/65">
                <X className="mt-0.5 size-3.5 shrink-0 text-rose-300" /> {line} — version 3
              </p>
            ))}
          </div>
          {tier && (
            <Button variant="danger" className="mt-4 w-full" icon={<X className="size-4" />} onClick={() => { cancelVip(); pushToast("Demo tier cleared.", "info"); }}>
              Cancel {tier.name} (demo)
            </Button>
          )}
        </Card>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? `Enable ${confirm.name}?` : ""}
        subtitle="Demo activation — no payment is taken"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Not now</Button>
            <Button
              onClick={() => {
                if (!confirm) return;
                activateVip(confirm.id);
                updateMe({ frame: confirm.frame, theme: confirm.theme });
                setConfirm(null);
              }}
            >
              Apply tier look
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
            <p className="text-[13px] font-bold">{confirm?.name}</p>
            <p className="mt-1 text-[11px] text-white/50">Frame: {FRAMES.find((f) => f.id === confirm?.frame)?.name} · Theme: {THEMES.find((t) => t.id === confirm?.theme)?.name}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-sm font-bold text-amber-100">
            Premium purchase will be available in a future version.
          </div>
          <p className="text-[11px] leading-relaxed text-white/40">
            VIP never grants moderation powers, never buys reach in someone else's room, and never makes anyone's
            attention payable. Benefits are cosmetic and discovery-order only.
          </p>
        </div>
      </Modal>
    </div>
  );
}
