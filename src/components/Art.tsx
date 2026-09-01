import { cn } from "../utils/cn";
import { toneById } from "../lib/content";
import { gradientFor } from "../lib/utils";

/**
 * Procedural "clip" art. Every reel, post image and story is composed from
 * layered gradients + SVG motifs so the feed looks alive with zero downloads
 * and nothing to upload.
 */
export function ClipArt({
  tone,
  shape = 0,
  playing = false,
  progress = 0,
  seed,
  className,
  overlay = true,
}: {
  tone: number;
  shape?: number;
  playing?: boolean;
  progress?: number;
  seed?: string;
  className?: string;
  overlay?: boolean;
}) {
  const t = toneById(tone);
  const variant = shape % 8;
  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ background: t.base }} aria-hidden>
      <div className="absolute inset-0" style={{ background: t.wash }} />

      {variant === 0 && (
        <div className="absolute inset-0 opacity-70 [background:repeating-linear-gradient(115deg,transparent_0_26px,rgba(255,255,255,.16)_26px_27px)]" />
      )}
      {variant === 1 && (
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute h-[160%] w-[38%] -rotate-12 opacity-40 blur-xl"
              style={{ left: `${i * 26 - 8}%`, top: "-30%", background: `linear-gradient(180deg,transparent,${t.accent}66,transparent)`, animation: playing ? `float ${5 + i}s ease-in-out infinite` : undefined }}
            />
          ))}
        </div>
      )}
      {variant === 2 && (
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-50" style={{ background: `radial-gradient(closest-side,${t.accent}55,transparent 70%)` }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ width: `${28 + i * 16}%`, aspectRatio: "1", borderColor: `${t.accent}55`, opacity: 0.8 - i * 0.13 }} />
          ))}
        </div>
      )}
      {variant === 3 && (
        <div className="absolute inset-0 grid place-items-end justify-items-center pb-[18%]">
          <div className="flex h-24 w-[86%] items-end justify-between gap-1.5 px-2">
            {Array.from({ length: 26 }, (_, i) => (
              <span
                key={i}
                className={cn("w-full rounded-t-sm", playing ? "animate-eq" : "")}
                style={{ background: t.accent, opacity: 0.25 + (i % 5) * 0.12, height: playing ? undefined : `${18 + ((i * 37) % 62)}%`, animationDelay: `${i * 55}ms` }}
              />
            ))}
          </div>
        </div>
      )}
      {variant === 4 && (
        <div className="absolute inset-0">
          <div className="absolute inset-x-0 top-1/3 h-px opacity-60" style={{ background: `linear-gradient(90deg,transparent,${t.accent},transparent)` }} />
          <div className="absolute inset-x-0 top-2/3 h-px opacity-40" style={{ background: `linear-gradient(90deg,transparent,#fff8,transparent)` }} />
          <div className="absolute inset-0 opacity-25 [background:repeating-linear-gradient(0deg,rgba(255,255,255,.12)_0_2px,transparent_2px_5px)]" />
        </div>
      )}
      {variant === 5 && (
        <div className="absolute inset-0">
          <div className="absolute -left-10 top-10 size-52 rounded-full blur-3xl" style={{ background: `${t.accent}55` }} />
          <div className="absolute bottom-6 right-4 size-40 rounded-full blur-3xl" style={{ background: "#ffffff22" }} />
        </div>
      )}
      {variant === 6 && (
        <div className="absolute inset-0 opacity-60 [background:linear-gradient(180deg,transparent_60%,rgba(0,0,0,.6)),repeating-linear-gradient(90deg,rgba(255,255,255,.1)_0_1px,transparent_1px_22px)]" />
      )}
      {variant === 7 && (
        <div className="absolute inset-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full opacity-55">
            <path d="M0 70 Q25 30 50 62 T100 40" fill="none" stroke={t.accent} strokeWidth="1.4" />
            <path d="M0 84 Q30 52 58 76 T100 58" fill="none" stroke="#ffffff" strokeOpacity=".45" strokeWidth="1" />
            <circle cx="72" cy="26" r="12" fill={t.accent} fillOpacity=".28" />
          </svg>
        </div>
      )}

      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />}
      {seed && (
        <span
          className="absolute right-3 top-3 size-9 rounded-full ring-1 ring-white/30"
          style={{ backgroundImage: gradientFor(seed) }}
        />
      )}
      {progress > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
          <div className="h-full bg-white/85 transition-[width] duration-200" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
      )}
      <div className="grain pointer-events-none absolute inset-0" />
    </div>
  );
}

export function ToneWash({ tone, className, soft = false }: { tone: number; className?: string; soft?: boolean }) {
  const t = toneById(tone);
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: t.base }} aria-hidden>
      <div className={cn("absolute inset-0", soft && "opacity-60")} style={{ background: t.wash }} />
      <div className="grain absolute inset-0" />
      <div className="relative">{/* content sits above the wash */}</div>
    </div>
  );
}

export function StoryRing({
  seen,
  size = 64,
  vip,
  children,
}: {
  seen: boolean;
  size?: number;
  vip?: string | null;
  children: React.ReactNode;
}) {
  const ring =
    vip === "diamond"
      ? "conic-gradient(from 0deg,#22d3ee,#a855f7,#f472b6,#fde68a,#22d3ee)"
      : vip === "gold"
        ? "conic-gradient(from 0deg,#f59e0b,#fde68a,#f472b6,#f59e0b)"
        : vip === "silver"
          ? "conic-gradient(from 0deg,#94a3b8,#e2e8f0,#94a3b8)"
          : seen
            ? "conic-gradient(from 0deg,rgba(255,255,255,.22),rgba(255,255,255,.22))"
            : "conic-gradient(from 0deg,#7c3aed,#ec4899,#f59e0b,#7c3aed)";
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full" style={{ background: ring }} />
      <span className="absolute rounded-full bg-ink-950" style={{ inset: 3 }} />
      <span className="relative">{children}</span>
    </span>
  );
}
