import { BadgeCheck, Crown, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../store/StoreProvider";
import type { User } from "../lib/types";
import { cn } from "../utils/cn";
import { compact, gradientFor, levelProgress, xpForLevel } from "../lib/utils";
import { Avatar, Button, LevelBadge, Progress } from "./ui";

export function UserCard({ user, variant = "grid" }: { user: User; variant?: "grid" | "row" }) {
  const { myFollows, toggleFollow, me } = useStore();
  const following = myFollows.includes(user.id);
  const isYou = me?.id === user.id;

  if (variant === "row") {
    return (
      <Link
        to={`/u/${user.id}`}
        className="tap group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 hover:border-vibe-400/40 hover:bg-white/[0.07]"
      >
        <Avatar user={user} size={46} showStatus />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-bold">
            {user.username}
            {user.verified && <BadgeCheck className="size-3.5 shrink-0 text-sky-300" />}
            {user.level > 30 && <Crown className="size-3.5 shrink-0 text-coin-400" />}
          </p>
          <p className="truncate text-xs text-white/45">{user.country} · {user.followers > 0 ? `${compact(user.followers)} followers` : "new vibe"}</p>
        </div>
        {!isYou && (
          <Button
            size="sm"
            variant={following ? "soft" : "outline"}
            onClick={(e) => {
              e.preventDefault();
              toggleFollow(user.id);
            }}
            icon={following ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
          >
            {following ? "Following" : "Follow"}
          </Button>
        )}
      </Link>
    );
  }

  return (
    <div className="tap group relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-center transition duration-200 hover:-translate-y-1 hover:border-vibe-400/40 hover:shadow-[0_24px_60px_-30px_rgba(168,85,247,0.8)]">
      <div
        className="pointer-events-none absolute -top-14 left-1/2 h-28 w-40 -translate-x-1/2 rounded-full opacity-35 blur-2xl transition group-hover:opacity-60"
        style={{ backgroundImage: gradientFor(user.id) }}
      />
      <Link to={`/u/${user.id}`} className="relative">
        <Avatar user={user} size={64} showStatus className="ring-4 ring-ink-900/80" />
      </Link>
      <Link to={`/u/${user.id}`} className="mt-3 flex items-center gap-1 text-sm font-bold">
        {user.username}
        {user.verified && <BadgeCheck className="size-3.5 text-sky-300" />}
      </Link>
      <p className="mt-0.5 line-clamp-2 min-h-[32px] text-[11px] leading-snug text-white/45">{user.bio}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <LevelBadge level={user.level} />
        <span className="text-[11px] text-white/40">{user.language}</span>
      </div>
      <Progress value={levelProgress(user.xp, user.level)} className="mt-2.5 w-24" />
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/30">{xpForLevel(user.level)} xp / level</p>
      {!isYou && (
        <div className="mt-3 flex w-full items-center gap-2">
          <Button
            size="sm"
            variant={following ? "soft" : "primary"}
            className="flex-1"
            onClick={() => toggleFollow(user.id)}
            icon={following ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
          >
            {following ? "Friends" : "Follow"}
          </Button>
          <Link to={`/messages?with=${user.id}`}>
            <Button size="sm" variant="outline" className="px-3" aria-label={`Message ${user.username}`}>
              <MessageCircle className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}
      {isYou && <span className={cn("mt-3 rounded-full bg-vibe-600/25 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-vibe-200")}>You</span>}
    </div>
  );
}
