import { cn } from "../utils/cn";

/** Original VibeTalk mark: a rounded chat bubble carrying a voice waveform. */
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="VibeTalk logo"
    >
      <defs>
        <linearGradient id="vt-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="15" fill="url(#vt-g)" />
      <path d="M13 21c0-2 1.4-3.5 3.4-3.5S20 19 20 21s-1.6 3.5-3.6 3.5S13 23 13 21Z" fill="#fff" opacity=".95" />
      <g stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".95">
        <path d="M25.5 15.5v17" />
        <path d="M31 11.5v25" />
        <path d="M36.5 17.5v13" />
      </g>
    </svg>
  );
}

export function Wordmark({ className, sub = true }: { className?: string; sub?: boolean }) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="font-display text-[19px] font-extrabold tracking-tight">
        Vibe<span className="vibe-text-gradient">Talk</span>
      </span>
      {sub && (
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.28em] text-white/35">18+ social audio</span>
      )}
    </span>
  );
}
