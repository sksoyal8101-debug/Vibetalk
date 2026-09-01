import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Compass, Home, Radio } from "lucide-react";
import { AppShell } from "./components/AppShell";
import { LogoMark } from "./components/Logo";
import { Button, Spinner, Toaster } from "./components/ui";
import { StoreProvider, useStore } from "./store/StoreProvider";
import { SocialProvider } from "./store/SocialProvider";
import { Assistant } from "./screens/Assistant";
import { Admin } from "./screens/Admin";
import { Coins } from "./screens/Coins";
import { Creator } from "./screens/Creator";
import { Discover } from "./screens/Discover";
import { Events } from "./screens/Events";
import { Favorites } from "./screens/Favorites";
import { Friends } from "./screens/Friends";
import { Games } from "./screens/Games";
import { Gifts } from "./screens/Gifts";
import { Home as HomeScreen } from "./screens/Home";
import { Leaderboard } from "./screens/Leaderboard";
import { Messages } from "./screens/Messages";
import { Missions } from "./screens/Missions";
import { Notifications } from "./screens/Notifications";
import { Posts } from "./screens/Posts";
import { Privacy } from "./screens/Privacy";
import { Profile } from "./screens/Profile";
import { Reels } from "./screens/Reels";
import { Rewards } from "./screens/Rewards";
import { Rooms } from "./screens/Rooms";
import { RoomDetail } from "./screens/RoomDetail";
import { SafetyCenter, LegalPage } from "./screens/Safety";
import { Search } from "./screens/Search";
import { Settings } from "./screens/Settings";
import { Login, ProfileSetup, Signup, Welcome } from "./screens/Auth";
import { Vip } from "./screens/Vip";

/* --------------------------------- Splash --------------------------------- */

function Splash({ label = "Loading your local demo data…" }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink-950 px-6 text-center">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-3xl vibe-gradient shadow-[0_24px_60px_-20px_rgba(168,85,247,0.8)]">
          <LogoMark size={38} className="rounded-3xl" />
        </div>
        <p className="mt-5 font-display text-xl font-extrabold tracking-tight">VibeTalk Pro</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-xs text-white/45">
          <Spinner className="size-3.5" /> {label}
        </p>
        <div className="mx-auto mt-5 flex h-8 items-end justify-center gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="animate-eq w-1.5 rounded-full bg-vibe-400/70" style={{ animationDelay: `${i * 110}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Guards --------------------------------- */

function RequireAuth({ children }: { children: ReactNode }) {
  const { me, booting, needsSetup } = useStore();
  if (booting) return <Splash />;
  if (!me) return <Navigate to="/welcome" replace />;
  if (needsSetup) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { me, booting } = useStore();
  if (booting) return <Splash label="Checking this device for a session…" />;
  if (me) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SetupRoute() {
  const { me, booting } = useStore();
  if (booting) return <Splash />;
  if (!me) return <Navigate to="/login" replace />;
  return <ProfileSetup />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);
  return null;
}

/* -------------------------------- Not found ------------------------------- */

function NotFound() {
  const { me } = useStore();
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-ink-900/70 p-7 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-vibe-600/25 text-vibe-200">
          <Compass className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">That page drifted off-air</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          The link you followed doesn't exist in this build. Nothing is lost — your session, xp, friends and demo
          data are all still here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to={me ? "/" : "/welcome"}>
            <Button icon={<Home className="size-4" />}>{me ? "Back to home" : "Go to sign in"}</Button>
          </Link>
          <Link to="/rooms"><Button variant="outline" icon={<Radio className="size-4" />}>Browse rooms</Button></Link>
          <Link to="/discover"><Button variant="ghost">Discover</Button></Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Error boundary ----------------------------- */

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("VibeTalk caught an error:", error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-dvh place-items-center bg-ink-950 px-6 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blush-500/20 text-blush-300">
              <Compass className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold">We hit a snag</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Something in this screen couldn't render. Your data is untouched — reload, and if it keeps happening,
              reset the demo data from the sign-in screen.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button onClick={() => window.location.reload()}>Reload VibeTalk</Button>
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    window.localStorage.removeItem("vibetalk.session.v1");
                  } catch {
                    /* storage blocked — reload anyway */
                  }
                  window.location.hash = "#/welcome";
                  window.location.reload();
                }}
              >
                Back to sign in
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------------------------- App ---------------------------------- */

export default function App() {
  return (
    <Boundary>
      <StoreProvider>
        <SocialProvider>
          <HashRouter>
            <ScrollToTop />
            <Toaster />
            <Routes>
              <Route path="/welcome" element={<PublicOnly><Welcome /></PublicOnly>} />
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
              <Route path="/setup" element={<SetupRoute />} />
              <Route path="/legal/:doc" element={<LegalPage />} />

              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<HomeScreen />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/rooms/:roomId" element={<RoomDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/games" element={<Games />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/u/:id" element={<Profile />} />
                <Route path="/creator" element={<Creator />} />
                <Route path="/coins" element={<Coins />} />
                <Route path="/gifts" element={<Gifts />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/vip" element={<Vip />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/search" element={<Search />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/safety" element={<SafetyCenter />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </SocialProvider>
      </StoreProvider>
    </Boundary>
  );
}
