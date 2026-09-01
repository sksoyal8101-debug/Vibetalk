import {
  Bell,
  CalendarClock,
  ChartLine,
  Coins,
  Compass,
  Film,
  Gamepad2,
  Gift,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Mic,
  Radio,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  User as UserIcon,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreProvider";
import { useSocial } from "../store/SocialProvider";
import { cn } from "../utils/cn";
import { compact, levelFromXp } from "../lib/utils";
import { vipTier } from "../lib/content";
import { Avatar, CoinPill } from "./ui";
import { LogoMark, Wordmark } from "./Logo";
import { RewardOverlays } from "./Rewards";

const PRIMARY = [
  { to: "/", label: "Home", short: "Home", icon: Home, end: true },
  { to: "/discover", label: "Discover", short: "Discover", icon: Compass, end: false },
  { to: "/rooms", label: "Voice Rooms", short: "Rooms", icon: Radio, end: false },
  { to: "/messages", label: "Messages", short: "Inbox", icon: MessageCircle, end: false },
  { to: "/profile", label: "Profile", short: "Profile", icon: UserIcon, end: false },
];

const MOBILE_MORE = [
  { to: "/reels", label: "Reels", icon: Film },
  { to: "/posts", label: "Moments", icon: Sparkles },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/vip", label: "VIP", icon: Star },
];

const GROUPS: { title: string; items: { to: string; label: string; icon: typeof Home; badge?: "msgs" | "notifs" | "reqs" | "groups" }[] }[] = [
  {
    title: "Social",
    items: [
      { to: "/discover", label: "Discover", icon: Compass },
      { to: "/reels", label: "Short videos", icon: Film },
      { to: "/posts", label: "Moments", icon: Sparkles },
      { to: "/friends", label: "Friends", icon: Users, badge: "reqs" },
      { to: "/messages", label: "Messages", icon: MessageCircle, badge: "msgs" },
    ],
  },
  {
    title: "Live",
    items: [
      { to: "/rooms", label: "Voice rooms", icon: Radio },
      { to: "/events", label: "Events", icon: CalendarClock },
      { to: "/groups-tab", label: "Group chats", icon: Heart, badge: "groups" },
    ],
  },
  {
    title: "Play & earn",
    items: [
      { to: "/games", label: "Games", icon: Gamepad2 },
      { to: "/missions", label: "Missions", icon: Target },
      { to: "/rewards", label: "Daily rewards", icon: Zap },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/coins", label: "Vibe Coins", icon: Coins },
      { to: "/gifts", label: "Gifts", icon: Gift },
      { to: "/vip", label: "VIP", icon: Star },
    ],
  },
  {
    title: "You",
    items: [
      { to: "/profile", label: "My profile", icon: UserIcon },
      { to: "/creator", label: "Creator Center", icon: ChartLine },
      { to: "/favorites", label: "Favourites", icon: Heart },
      { to: "/notifications", label: "Notifications", icon: Bell, badge: "notifs" },
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/privacy", label: "Privacy Center", icon: Shield },
      { to: "/safety", label: "Safety & policy", icon: Shield },
      { to: "/admin", label: "Admin (demo)", icon: Sparkles },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/": "Home",
  "/discover": "Discover",
  "/rooms": "Voice Rooms",
  "/reels": "Short videos",
  "/posts": "Moments",
  "/friends": "Friends",
  "/messages": "Messages",
  "/games": "Games",
  "/missions": "Missions & streaks",
  "/rewards": "Daily rewards",
  "/leaderboard": "Leaderboard",
  "/coins": "Vibe Coins",
  "/gifts": "Gifts",
  "/vip": "VIP",
  "/profile": "My profile",
  "/creator": "Creator Center",
  "/favorites": "Favourites",
  "/events": "Events",
  "/notifications": "Notifications",
  "/search": "Search",
  "/settings": "Settings",
  "/privacy": "Privacy Center",
  "/safety": "Safety & policy",
  "/admin": "Admin · demo",
};

export function AppShell() {
  const { me, db, logout, currentRoomId } = useStore();
  const { social, setRole } = useSocial();
  const location = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  const unreadNotifs = db.notifications.filter((n) => !n.read).length;
  const unreadMsgs = useMemo(() => (me ? db.messages.filter((m) => m.to === me.id && !m.read).length : 0), [db.messages, me]);
  const pendingReqs = social.friends.filter((f) => f.state === "pending" && f.toId === me?.id).length;
  const myGroups = social.groups.filter((g) => me && g.memberIds.includes(me.id)).length;
  const liveRooms = db.rooms.filter((r) => r.live).length;
  const listeners = db.rooms.reduce((s, r) => s + r.listeners, 0);
  const activeRoom = db.rooms.find((r) => r.id === currentRoomId);
  const tier = vipTier(social.vip.plan);
  const curve = me ? levelFromXp(me.xp) : null;
  const title =
    TITLES[location.pathname] ??
    (location.pathname.startsWith("/rooms/")
      ? "Demo Voice Room"
      : location.pathname.startsWith("/u/")
        ? "Profile"
        : location.pathname.startsWith("/legal/")
          ? "Policy"
          : "VibeTalk");

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 60 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  const badgeFor = (badge?: string) =>
    badge === "msgs" ? unreadMsgs : badge === "notifs" ? unreadNotifs : badge === "reqs" ? pendingReqs : badge === "groups" ? myGroups : 0;

  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-ink-950" />
      <div className="vibe-aurora animate-drift pointer-events-none fixed inset-0 -z-10 opacity-70" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.55] [background-image:linear-gradient(to_right,rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(75%_60%_at_50%_0%,#000,transparent)]" />
      <div className="grain pointer-events-none fixed inset-0 -z-10" />
      <div className="anim-breathe pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-64 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(124,58,237,.26),transparent_70%)]" />

      <div className="flex">
        {/* --------------------------------- Sidebar -------------------------------- */}
        <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col border-r border-white/8 bg-ink-900/70 px-4 py-5 backdrop-blur-xl lg:flex xl:w-[272px]">
          <div className="flex items-center gap-2.5 px-1">
            <LogoMark size={38} />
            <Wordmark />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 text-center">
            {[
              { label: "live", value: liveRooms },
              { label: "listening", value: compact(listeners) },
              { label: "friends", value: social.friends.filter((f) => f.state === "accepted").length },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-lg font-extrabold leading-none">{s.value}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>

          <nav className="no-scrollbar mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
            {PRIMARY.map((item) => (
              <SideLink key={item.to} {...item} badge={item.to === "/messages" ? unreadMsgs : 0} />
            ))}
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-white/25">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items
                    .filter((i) => i.to !== "/groups-tab")
                    .map((item) => (
                      <SideLink key={item.to + item.label} {...item} badge={badgeFor(item.badge)} />
                    ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => { setRole(social.role === "admin" ? "member" : "admin"); navigate("/admin"); }}
              className="tap mt-2 flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-white/50 hover:text-white"
            >
              <Sparkles className="size-3.5" /> {social.role === "admin" ? "Disable demo admin" : "Enable demo admin"}
            </button>
          </nav>

          <NavLink to="/rooms?create=1" className="vibe-gradient tap mt-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-[0_18px_45px_-20px_rgba(236,72,153,0.95)]">
            <Mic className="size-4" /> Go live
          </NavLink>

          <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
            <Avatar user={me ?? undefined} size={40} showStatus />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                @{me?.username}
                {tier && <span className={cn("vip-badge", `vip-${tier.id}`)}>{tier.id}</span>}
              </p>
              <p className="truncate text-[11px] text-white/45">
                LV {curve?.level} · {me?.coins.toLocaleString()} VC
              </p>
            </div>
            <button
              onClick={() => { logout(); navigate("/welcome", { replace: true }); }}
              aria-label="Log out"
              className="tap grid size-8 place-items-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </aside>

        {/* ---------------------------------- Main ---------------------------------- */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/72 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
              <div className="flex items-center gap-2.5 lg:hidden">
                <LogoMark size={30} />
              </div>
              <h1 className="min-w-0 flex-1 truncate font-display text-lg font-extrabold tracking-tight sm:text-xl">{title}</h1>
              <NavLink to="/search" aria-label="Search" className="tap grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/12 hover:text-white">
                <Search className="size-4.5" />
              </NavLink>
              <div className="hidden sm:block">
                <CoinPill amount={me?.coins ?? 0} />
              </div>
              <NavLink to="/notifications" aria-label={`Notifications, ${unreadNotifs} unread`} className="tap relative grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/12 hover:text-white">
                <Bell className="size-4.5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-blush-500 px-1 text-[10px] font-black text-white">{unreadNotifs}</span>
                )}
              </NavLink>
              <Link to="/profile" className="lg:hidden">
                <Avatar user={me ?? undefined} size={34} showStatus />
              </Link>
            </div>
            <div className="h-[2px] w-full bg-white/[0.04]">
              <div className="vibe-gradient h-full rounded-r-full transition-[width] duration-150 ease-out" style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }} />
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:hidden">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-2.5">
              {MOBILE_MORE.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  className={({ isActive }) =>
                    cn(
                      "tap inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition",
                      isActive ? "vibe-gradient border-transparent text-white" : "border-white/10 bg-white/5 text-white/60",
                    )
                  }
                >
                  <m.icon className="size-3.5" /> {m.label}
                  {m.to === "/friends" && pendingReqs > 0 && (
                    <span className="grid size-4 place-items-center rounded-full bg-blush-500 text-[9px] font-black text-white">{pendingReqs}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <main key={location.pathname} className="animate-rise mx-auto max-w-[1180px] px-4 pb-28 pt-2 sm:px-6 lg:pb-14">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ------------------------------ Active room dock ----------------------------- */}
      {activeRoom && !location.pathname.startsWith("/rooms/") && (
        <button
          onClick={() => navigate(`/rooms/${activeRoom.id}`)}
          className="vibe-card animate-rise fixed bottom-24 left-1/2 z-50 flex w-[min(92vw,440px)] -translate-x-1/2 items-center gap-3 rounded-2xl border-mint-400/35 px-3.5 py-2.5 text-left lg:bottom-6 lg:left-[280px] lg:translate-x-0"
        >
          <span className="relative grid size-9 place-items-center rounded-xl bg-mint-400/15 text-mint-400">
            <Mic className="size-4" />
            <span className="animate-ring absolute inset-0 rounded-xl border border-mint-400/60" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold">{activeRoom.title}</span>
            <span className="block text-[11px] text-white/50">Demo voice room · {activeRoom.listeners} listening</span>
          </span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white/70">Return</span>
        </button>
      )}

      <RewardOverlays />

      {/* -------------------------------- Bottom nav -------------------------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-ink-950/88 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-3 py-1.5">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const badge = item.to === "/messages" ? unreadMsgs : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn("tap relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-bold transition", isActive ? "text-white" : "text-white/45 hover:text-white/75")
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("relative grid size-9 place-items-center rounded-xl transition", isActive ? "vibe-gradient shadow-[0_10px_24px_-12px_rgba(236,72,153,0.9)]" : "bg-transparent")}>
                      <Icon className="size-4.5" />
                    </span>
                    {item.short}
                    {badge > 0 && <span className="absolute right-4 top-1 grid size-4 place-items-center rounded-full bg-blush-500 text-[9px] font-black">{badge > 9 ? "9+" : badge}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SideLink({
  to,
  label,
  icon: Icon,
  end = false,
  badge = 0,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "tap group flex items-center gap-3 rounded-2xl px-3 py-2 text-[13px] font-semibold transition",
          isActive ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(168,85,247,.35)]" : "text-white/55 hover:bg-white/[0.05] hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("transition", isActive ? "text-blush-400" : "text-white/45 group-hover:text-white/80")}>
            <Icon className="size-4.5" />
          </span>
          <span className="flex-1 truncate">{label}</span>
          {badge > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-blush-500 px-1.5 py-0.5 text-[10px] font-black text-white">{badge}</span>}
        </>
      )}
    </NavLink>
  );
}
