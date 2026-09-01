import { X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "../utils/cn";
import { gradientFor, initials } from "../lib/utils";
import { frameById } from "../lib/progression";
import type { User } from "../lib/types";
import { useStore } from "../store/StoreProvider";

/* ---------------------------------- Button --------------------------------- */

type Variant = "primary" | "outline" | "ghost" | "danger" | "coin" | "soft";

export function Button({
  variant = "primary",
  size = "md",
  className,
  icon,
  loading,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
}) {
  const base =
    "tap inline-flex items-center justify-center gap-2 font-semibold rounded-full disabled:opacity-50 disabled:pointer-events-none select-none";
  const sizes = { sm: "text-xs px-3.5 py-2", md: "text-sm px-5 py-2.5", lg: "text-[15px] px-7 py-3.5" };
  const variants: Record<Variant, string> = {
    primary: "vibe-gradient text-white shadow-[0_10px_30px_-12px_rgba(168,85,247,0.85)] hover:shadow-[0_16px_40px_-12px_rgba(236,72,153,0.75)]",
    outline: "border border-white/15 text-vibe-50 hover:border-vibe-400/70 hover:bg-white/5",
    ghost: "text-white/70 hover:text-white hover:bg-white/8",
    danger: "bg-rose-500/15 text-rose-200 border border-rose-400/30 hover:bg-rose-500/25",
    coin: "bg-coin-500/18 text-coin-400 border border-coin-400/30 hover:bg-coin-500/28",
    soft: "bg-white/8 text-white hover:bg-white/14 border border-white/10",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "tap grid place-items-center rounded-full border border-white/10 bg-white/6 text-white/75 hover:text-white hover:bg-white/14 size-10",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("animate-spin", className ?? "size-5")} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------- Avatar --------------------------------- */

export function Avatar({
  user,
  size = 44,
  showStatus = false,
  className,
  seed,
  showFrame = true,
}: {
  user?: (Pick<User, "id" | "username" | "online"> & Partial<Pick<User, "frame" | "theme">>) | null;
  size?: number;
  showStatus?: boolean;
  className?: string;
  seed?: string;
  showFrame?: boolean;
}) {
  const key = user?.id ?? seed ?? "vibetalk";
  const label = user ? initials(user.username) : "VT";
  const frame = showFrame && user?.frame && user.frame !== "none" ? frameById(user.frame) : null;
  const pad = frame ? Math.max(2.5, size * 0.075) : 0;
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {frame && (
        <>
          <span
            className="animate-orbit absolute rounded-full"
            style={{ inset: -pad, backgroundImage: frame.ring, boxShadow: frame.glow, animationDuration: size > 60 ? "11s" : "8s" }}
          />
          <span className="absolute rounded-full bg-ink-950" style={{ inset: -pad / 3 }} />
        </>
      )}
      <span
        className={cn(
          "relative grid h-full w-full place-items-center overflow-hidden rounded-full font-display font-bold text-white/95",
          frame ? "" : "ring-1 ring-white/15",
        )}
        style={{ backgroundImage: gradientFor(key), fontSize: Math.max(10, size * 0.36) }}
      >
        {label}
      </span>
      {showStatus && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-ink-950",
            user?.online ? "bg-mint-400" : "bg-white/30",
          )}
          style={{ width: Math.max(9, size * 0.28), height: Math.max(9, size * 0.28) }}
        />
      )}
    </span>
  );
}

/* ---------------------------------- Surfaces -------------------------------- */

export function Card({
  className,
  children,
  interactive,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "vibe-card rounded-3xl",
        interactive && "transition duration-200 hover:-translate-y-0.5 hover:border-vibe-400/40 hover:shadow-[0_20px_50px_-24px_rgba(168,85,247,0.6)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Chip({
  active,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "tap shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
        active
          ? "vibe-gradient border-transparent text-white shadow-[0_8px_22px_-12px_rgba(236,72,153,0.9)]"
          : "border-white/12 bg-white/5 text-white/65 hover:text-white hover:bg-white/10",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Reveal className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight sm:text-xl">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 truncate text-xs text-white/45">{subtitle}</p>}
      </div>
      {action}
    </Reveal>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-vibe-600/20 text-vibe-200 ring-1 ring-vibe-400/25">
        {icon}
      </div>
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-white/50">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-shimmer rounded-2xl bg-white/8", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.11) 45%, rgba(255,255,255,0.03) 90%)",
        backgroundSize: "220% 100%",
      }}
    />
  );
}

/* ----------------------------------- Forms ---------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
          {label}
          {hint && <span className="font-medium normal-case tracking-normal text-white/30">{hint}</span>}
        </span>
      )}
      {children}
      {error && <span className="mt-1.5 block text-xs font-semibold text-rose-300">{error}</span>}
    </label>
  );
}

const controlCls =
  "w-full rounded-2xl border bg-ink-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-vibe-400/70 focus:ring-4 focus:ring-vibe-500/15";

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(controlCls, invalid ? "border-rose-400/60" : "border-white/12", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlCls, "min-h-[92px] resize-y border-white/12", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlCls, "border-white/12 appearance-none pr-10", className)} {...rest}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="mt-0.5 text-xs text-white/45">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "tap relative h-6.5 w-11 shrink-0 rounded-full border transition",
          checked ? "vibe-gradient border-transparent" : "border-white/15 bg-white/10",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white shadow transition-all",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}

/* ----------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/12 bg-ink-850 p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:rounded-3xl sm:p-6",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="size-9 shrink-0">
            <X className="size-4" />
          </IconButton>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------------- Toasts --------------------------------- */

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={cn(
            "animate-pop pointer-events-auto max-w-md rounded-2xl border px-4 py-3 text-left text-sm font-semibold shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md",
            t.tone === "err"
              ? "border-rose-400/35 bg-rose-950/80 text-rose-100"
              : t.tone === "info"
                ? "border-vibe-400/35 bg-ink-800/90 text-vibe-50"
                : "border-mint-400/35 bg-emerald-950/75 text-emerald-100",
          )}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Extras ---------------------------------- */

export function CoinPill({ amount, className }: { amount: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-coin-400/30 bg-coin-500/12 px-3 py-1.5 text-xs font-bold text-coin-400",
        className,
      )}
    >
      <span className="grid size-4 place-items-center rounded-full bg-coin-400 text-[9px] text-ink-950">V</span>
      {amount.toLocaleString()}
    </span>
  );
}

export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/18 px-2.5 py-1 text-[10px] font-black tracking-[0.14em] text-rose-200">
      <span className="relative flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-rose-400" />
        <span className="relative size-1.5 rounded-full bg-rose-400" />
      </span>
      {label}
    </span>
  );
}

export function Equalizer({ active = true, bars = 4, className }: { active?: boolean; bars?: number; className?: string }) {
  return (
    <span className={cn("flex h-3.5 items-end gap-[3px]", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full", active ? "animate-eq bg-mint-400" : "h-[22%] bg-white/25")}
          style={active ? { animationDelay: `${i * 130}ms` } : undefined}
        />
      ))}
    </span>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-vibe-600/35 px-2 py-0.5 text-[10px] font-black tracking-wide text-vibe-200 ring-1 ring-vibe-400/40",
        className,
      )}
    >
      LV {level}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div className="vibe-gradient h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%` }} />
    </div>
  );
}

/* ----------------------------- motion & feedback ---------------------------- */

/** Fades + lifts children into view once. Never leaves content invisible. */
export function Reveal({
  children,
  delay = 0,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );
    io.observe(node);
    // safety net: reveal no matter what
    const fallback = window.setTimeout(() => setShown(true), 1400);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", shown && "is-in", className)}
      style={{ animationDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Tiny staggered reveal for lists — one wrapper, per-item delay. */
export function RevealGroup({
  children,
  className,
  step = 70,
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  max?: number;
}) {
  const items = useMemo(() => children, [children]);
  return (
    <div className={className}>
      {Array.isArray(items)
        ? items.map((child, i) => (
            <Reveal key={i} delay={Math.min(i, max) * step}>
              {child as ReactNode}
            </Reveal>
          ))
        : items}
    </div>
  );
}

/** Brief pending window so data-heavy screens show skeletons instead of popping. */
export function useReady(ms = 320): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return ready;
}

export function TypingDots({ label, className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="dot-typing inline-flex items-end gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 rounded-full bg-vibe-200" />
        ))}
      </span>
      {label && <span className="text-[11px] text-white/45">{label}</span>}
    </span>
  );
}

/* ------------------------------ v2 primitives ------------------------------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: { key: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (next: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.03] p-1.5", className)}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "tap flex shrink-0 items-center justify-center gap-1.5 rounded-xl font-bold transition",
            size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs",
            value === o.key ? "vibe-gradient text-white shadow-[0_10px_26px_-14px_rgba(236,72,153,.9)]" : "text-white/50 hover:bg-white/5 hover:text-white",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet on mobile, centered dialog on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="vibe-glass animate-rise relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] border-white/12 p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-[28px] sm:pb-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-extrabold">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-white/50">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="size-9 shrink-0">
            <X className="size-4" />
          </IconButton>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  delta,
  icon,
  hint,
  tone = "violet",
}: {
  label: string;
  value: number | string;
  delta?: number;
  icon?: ReactNode;
  hint?: string;
  tone?: "violet" | "pink" | "mint" | "coin" | "sky";
}) {
  const tones: Record<string, string> = {
    violet: "from-vibe-600/25 to-vibe-500/[0.05] text-vibe-200 ring-vibe-400/25",
    pink: "from-blush-500/25 to-blush-500/[0.05] text-blush-300 ring-blush-400/25",
    mint: "from-mint-400/20 to-mint-400/[0.04] text-mint-400 ring-mint-400/25",
    coin: "from-coin-500/22 to-coin-500/[0.04] text-coin-400 ring-coin-400/25",
    sky: "from-sky-500/22 to-sky-500/[0.04] text-sky-200 ring-sky-400/25",
  };
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br p-3.5", tones[tone])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">{label}</p>
        {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      </div>
      <p className="mt-1.5 font-display text-2xl font-extrabold leading-none text-white">
        <CountUp value={value} />
      </p>
      {typeof delta === "number" && (
        <p className={cn("mt-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-black", delta >= 0 ? "bg-mint-400/15 text-mint-400" : "bg-rose-500/15 text-rose-200")}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
        </p>
      )}
      {hint && <p className="mt-1 text-[10px] text-white/40">{hint}</p>}
    </div>
  );
}

export function CountUp({ value }: { value: number | string }) {
  const numeric = typeof value === "number" ? value : Number(value.replace(/[^0-9.-]/g, ""));
  const [shown, setShown] = useState(Number.isFinite(numeric) ? 0 : 0);

  useEffect(() => {
    if (!Number.isFinite(numeric)) {
      setShown(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 520;
    let raf = 0;
    const tick = (now: number) => {
      frame = Math.min(1, (now - start) / duration);
      setShown(numeric * (1 - Math.pow(1 - frame, 3)));
      if (frame < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numeric]);

  if (typeof value === "string" && !Number.isFinite(numeric)) return <>{value}</>;
  const suffix = typeof value === "string" ? value.replace(/[0-9.,]/g, "") : "";
  return (
    <>
      {Math.round(shown).toLocaleString()}
      {suffix}
    </>
  );
}

export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-3xl border border-white/6 bg-white/[0.02] p-3.5">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
