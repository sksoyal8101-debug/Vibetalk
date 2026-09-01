import {
  ArrowUpRight,
  Bell,
  BellOff,
  CalendarCheck,
  CheckCheck,
  Gift,
  Heart,
  MessageCircle,
  Radio,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  UserPlus,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Button, Card, Chip, EmptyState } from "../components/ui";
import { useStore } from "../store/StoreProvider";
import { useSocial } from "../store/SocialProvider";
import type { AppNotification, NotifType } from "../lib/types";
import { cn } from "../utils/cn";
import { clockTime, dayLabel, timeAgo } from "../lib/utils";

const TYPE_META: Record<NotifType, { label: string; icon: typeof Bell; tone: string }> = {
  follower: { label: "New follower", icon: UserPlus, tone: "bg-vibe-600/25 text-vibe-200" },
  message: { label: "Message", icon: MessageCircle, tone: "bg-blush-500/18 text-blush-300" },
  gift: { label: "Gift", icon: Gift, tone: "bg-rose-500/18 text-rose-200" },
  room: { label: "Room", icon: Radio, tone: "bg-mint-400/15 text-mint-400" },
  system: { label: "System", icon: Bell, tone: "bg-white/10 text-white/70" },
  game: { label: "Game", icon: Trophy, tone: "bg-coin-500/18 text-coin-400" },
  reward: { label: "Daily reward", icon: CalendarCheck, tone: "bg-coin-500/20 text-coin-400" },
  levelup: { label: "Level up", icon: TrendingUp, tone: "bg-vibe-500/22 text-vibe-200" },
  badge: { label: "Badge", icon: Star, tone: "bg-blush-500/20 text-blush-300" },
  event: { label: "Event", icon: Zap, tone: "bg-sky-500/18 text-sky-200" },
  favorite: { label: "Favourite host", icon: Heart, tone: "bg-mint-400/18 text-mint-400" },
};

const FILTERS: { key: "all" | "unread" | "social" | "rewards" | "rooms"; label: string; types?: NotifType[] }[] = [
  { key: "all", label: "Everything" },
  { key: "unread", label: "Unread" },
  { key: "social", label: "Social", types: ["follower", "message", "favorite"] },
  { key: "rewards", label: "Rewards", types: ["reward", "levelup", "badge", "gift", "game"] },
  { key: "rooms", label: "Rooms & events", types: ["room", "event", "system"] },
];

export function Notifications() {
  const { db, userById, markNotificationRead, markAllNotificationsRead, clearNotifications, deleteNotification, pushToast } = useStore();
  const { social } = useSocial();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  // Privacy Center categories actually mute notification types here.
  const muted = useMemo(() => {
    const off = new Set<NotifType>();
    const p = social.privacy;
    if (!p.notifSocial) (["follower", "message", "favorite"] as NotifType[]).forEach((t) => off.add(t));
    if (!p.notifRooms) (["room", "event"] as NotifType[]).forEach((t) => off.add(t));
    if (!p.notifRewards) (["reward", "levelup", "badge", "gift", "game"] as NotifType[]).forEach((t) => off.add(t));
    if (!p.notifSystem) off.add("system");
    return off;
  }, [social.privacy]);

  const items = useMemo(() => {
    const sorted = [...db.notifications].sort((a, b) => b.at - a.at).filter((n) => !muted.has(n.type));
    const conf = FILTERS.find((f) => f.key === filter);
    if (!conf || conf.key === "all") return sorted;
    if (conf.key === "unread") return sorted.filter((n) => !n.read);
    return sorted.filter((n) => conf.types?.includes(n.type));
  }, [db.notifications, filter, muted]);

  const unread = db.notifications.filter((n) => !n.read).length;
  const grouped = items.reduce<Record<string, AppNotification[]>>((acc, n) => {
    const key = dayLabel(n.at);
    (acc[key] ||= []).push(n);
    return acc;
  }, {});

  function open(n: AppNotification) {
    markNotificationRead(n.id);
    const to = n.link ?? routeFor(n);
    if (to) navigate(to);
  }

  return (
    <div className="space-y-5">
      <Card className="relative flex flex-wrap items-center gap-4 overflow-hidden !rounded-[28px] p-5">
        <div className="vibe-gradient pointer-events-none absolute -right-20 -top-24 size-56 rounded-full opacity-25 blur-3xl" />
        <span className="relative grid size-12 place-items-center rounded-2xl bg-vibe-600/25 text-vibe-200 ring-1 ring-vibe-400/30">
          <Bell className="size-6" />
        </span>
        <div className="relative min-w-[180px] flex-1">
          <h1 className="font-display text-xl font-extrabold">
            Notifications{" "}
            {unread > 0 && <span className="ml-1 rounded-full bg-blush-500 px-2 py-0.5 text-[11px] font-black text-white">{unread} new</span>}
          </h1>
          <p className="mt-1 text-xs text-white/50">Follows, gifts, level-ups, dailies, badges, rooms and events.</p>
        </div>
        <div className="relative flex gap-2">
          <Button size="sm" variant="outline" icon={<CheckCheck className="size-3.5" />} onClick={markAllNotificationsRead} disabled={unread === 0}>
            Mark all read
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={clearNotifications} disabled={db.notifications.length === 0}>
            Clear
          </Button>
        </div>
      </Card>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? db.notifications.length
              : f.key === "unread"
                ? unread
                : db.notifications.filter((n) => f.types?.includes(n.type)).length;
          return (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label} · {count}
            </Chip>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-6" />}
          title={filter === "all" ? "Nothing new" : "Nothing in this filter"}
          body={
            filter === "all"
              ? "Claim your daily check-in, join a room or send a gift and the pings start rolling in."
              : "Switch filters — your other notifications are still safe in local storage."
          }
          action={
            <div className="flex gap-2">
              <Link to="/rewards"><Button icon={<CalendarCheck className="size-4" />}>Daily rewards</Button></Link>
              <Link to="/"><Button variant="outline">Home feed</Button></Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([day, list]) => (
            <section key={day}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">{day}</p>
              <div className="space-y-2.5">
                {list.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.system;
                  const actor = n.actorId ? userById(n.actorId) : null;
                  return (
                    <Card
                      key={n.id}
                      interactive
                      className={cn("flex items-start gap-3 !rounded-2xl p-3.5", !n.read && "border-vibe-400/35 bg-vibe-600/[0.09]")}
                    >
                      <button onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                        {actor ? (
                          <Avatar user={actor} size={40} showStatus />
                        ) : (
                          <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", meta.tone)}>
                            <meta.icon className="size-5" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold">{n.title}</span>
                            {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-blush-400" />}
                            <span className="ml-auto shrink-0 text-[10px] text-white/35">{clockTime(n.at)}</span>
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-white/50">{n.body}</span>
                          <span className="mt-1.5 flex items-center gap-2">
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", meta.tone)}>
                              <meta.icon className="size-3" /> {meta.label}
                            </span>
                            <span className="text-[10px] text-white/30">{timeAgo(n.at)} ago</span>
                            {(n.link || routeFor(n)) && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-vibe-200">
                                Open <ArrowUpRight className="size-3" />
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                      <span className="mt-0.5 flex shrink-0 flex-col items-end gap-1">
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="tap rounded-full px-2 py-1 text-[10px] font-bold text-white/40 hover:bg-white/8 hover:text-white"
                          aria-label="Mark as read"
                        >
                          {n.read ? "read" : "mark read"}
                        </button>
                        <button
                          onClick={() => {
                            deleteNotification(n.id);
                            pushToast("Notification deleted.", "info");
                          }}
                          className="tap inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-white/30 hover:bg-rose-500/15 hover:text-rose-200"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="size-3" /> delete
                        </button>
                      </span>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-[11px] text-white/35">
        <Sparkles className="size-3.5" /> Real push delivery (FCM/APNs) is a version 2 feature — these stay on your device.
      </p>
    </div>
  );
}

function routeFor(n: AppNotification): string | null {
  switch (n.type) {
    case "message":
      return n.actorId ? `/messages?with=${n.actorId}` : "/messages";
    case "room":
      return "/rooms";
    case "gift":
      return "/gifts";
    case "game":
      return "/games";
    case "reward":
      return "/rewards";
    case "levelup":
    case "badge":
      return "/profile";
    case "event":
      return "/events";
    case "favorite":
      return n.actorId ? `/u/${n.actorId}` : "/rooms";
    case "follower":
      return n.actorId ? `/u/${n.actorId}` : null;
    default:
      return null;
  }
}
