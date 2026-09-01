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
