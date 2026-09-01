import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Gift,
  Heart,
  Lock,
  Mic,
  Radio,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoMark, Wordmark } from "../components/Logo";
import { Avatar, Button, Card, Chip, Field, Input, Select, Spinner } from "../components/ui";
import { COUNTRIES, INTERESTS, LANGUAGES } from "../lib/data";
import { useStore, type SignupInput } from "../store/StoreProvider";
import type { User } from "../lib/types";
import { cn } from "../utils/cn";
import { ageFromDob, gradientFor } from "../lib/utils";

/* --------------------------------- Auth shell -------------------------------- */

function AuthShell({ title, kicker, children, aside }: { title: string; kicker: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="vibe-aurora animate-drift pointer-events-none absolute inset-0 -z-10 opacity-80" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:100%_44px] opacity-40" />

      {/* Brand rail */}
      <div className="relative hidden flex-col justify-between border-r border-white/8 bg-ink-900/40 p-10 backdrop-blur-sm lg:flex">
        <Link to="/welcome" className="flex items-center gap-3">
          <LogoMark size={40} />
          <Wordmark />
        </Link>

        <div className="max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blush-400/30 bg-blush-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blush-300">
            <Sparkles className="size-3" /> MVP prototype
          </p>
          <h2 className="font-display text-[38px] font-extrabold leading-[1.05] tracking-tight">
            Voice rooms where the
            <span className="vibe-text-gradient"> vibe actually matches</span>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Drop into a room, talk it out, send a gift, then settle the argument with dice. Everything in this build
            runs locally in your browser — demo audio, demo coins, zero servers.
          </p>

          <div className="mt-8 space-y-2.5">
            {LIVE_TICKER.map((row, i) => (
              <div
                key={row.title}
                className="animate-rise flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="grid size-9 place-items-center rounded-xl text-white" style={{ backgroundImage: row.cover }}>
                  <Mic className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{row.title}</p>
                  <p className="text-[11px] text-white/45">{row.topic} · {row.listeners} listening</p>
                </div>
                <span className="rounded-full bg-mint-400/15 px-2 py-1 text-[10px] font-black tracking-wider text-mint-400">LIVE</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-white/40">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-mint-400" /> 18+ only</span>
          <span className="inline-flex items-center gap-1.5"><Lock className="size-4 text-vibe-200" /> Local data only</span>
          <span className="inline-flex items-center gap-1.5"><Gift className="size-4 text-blush-300" /> Demo economy</span>
        </div>
      </div>

      {/* Form rail */}
      <div className="relative flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/welcome" className="flex items-center gap-2.5">
              <LogoMark size={34} />
              <Wordmark sub={false} />
            </Link>
            <span className="rounded-full border border-blush-400/30 bg-blush-500/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-blush-300">
              18+
            </span>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blush-300/80">{kicker}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-[34px]">{title}</h1>
          <div className="mt-7">{children}</div>
          {aside}
        </div>
      </div>
    </div>
  );
}

const LIVE_TICKER = [
  { title: "Late Night Lo-Fi & Venting", topic: "Chill Lounge", listeners: 148, cover: "linear-gradient(135deg,#7c3aed,#ec4899)" },
  { title: "Travel horror stories 🔥", topic: "Travel", listeners: 214, cover: "linear-gradient(135deg,#db2777,#fb923c)" },
  { title: "Speed friending — 3 min turns", topic: "Making friends", listeners: 188, cover: "linear-gradient(135deg,#4c1d95,#22d3ee)" },
];

/* ---------------------------------- Welcome --------------------------------- */

export function Welcome() {
  const { me } = useStore();
  const navigate = useNavigate();

  return (
    <AuthShell
      kicker="Welcome"
      title="Your night, your rooms, your people."
      aside={
        <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
          {[
            { icon: Radio, title: "Voice rooms", body: "Host or lurk. Demo mic UI with seats, gifts and live chat." },
            { icon: UserPlus, title: "Meet adults", body: "Browse online and popular members, follow the ones you click with." },
            { icon: Gift, title: "Gifts & coins", body: "Send hearts, crowns, rockets — all virtual, no real money." },
            { icon: Zap, title: "Casual games", body: "Tic-tac-toe, RPS, memory and dice with demo point rewards." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
              <f.icon className="size-4 text-vibe-200" />
              <p className="mt-2 text-sm font-bold">{f.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/45">{f.body}</p>
            </div>
          ))}
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-white/60">
        VibeTalk is a social voice-chat app for adults 18 and over. This first MVP keeps every account, message and
        coin balance inside your own browser so you can feel the product without a backend.
      </p>

      {me && (
        <Card className="mt-5 flex items-center gap-3 border-mint-400/30 bg-mint-400/[0.07] p-3.5">
          <Avatar user={me} size={40} showStatus />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">You're already signed in as @{me.username}</p>
            <p className="text-[11px] text-white/50">Session restored from this device.</p>
          </div>
          <Button size="sm" onClick={() => navigate("/")}>
            Continue
          </Button>
        </Card>
      )}

      <div className="mt-6 space-y-2.5">
        <Button size="lg" className="w-full" onClick={() => navigate("/signup")} icon={<UserPlus className="size-4.5" />}>
          Create account
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => navigate("/login")} icon={<ArrowRight className="size-4.5" />}>
          I already have an account
        </Button>
      </div>

      <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-mint-400/70" />
        No sexual services, exploitation, illegal activity, gambling or real-money rewards. Be kind — reports are
        reviewed and rooms are moderated.
      </p>
    </AuthShell>
  );
}

/* ----------------------------------- Signup --------------------------------- */

const EMPTY_SIGNUP: SignupInput = {
  username: "",
  email: "",
  password: "",
  dob: "",
  gender: "undisclosed",
  country: "",
  language: "English",
  agree: false,
};

export function Signup() {
  const { signup, db } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<SignupInput>(EMPTY_SIGNUP);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const age = ageFromDob(form.dob);
  const set = <K extends keyof SignupInput>(key: K, value: SignupInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError((e) => (e?.field === key ? null : e));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signup(form);
    setBusy(false);
    if (!res.ok) {
      setError({ message: res.error ?? "Something went wrong. Please try again.", field: res.field });
      return;
    }
    navigate("/setup", { replace: true });
  }

  return (
    <AuthShell kicker="Step 1 of 2" title="Create your VibeTalk account">
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Username" error={error?.field === "username" ? error.message : undefined} hint="3–20 chars">
            <Input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="midnight.echo"
              autoComplete="username"
              invalid={error?.field === "username"}
            />
          </Field>
          <Field label="Email" error={error?.field === "email" ? error.message : undefined}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              invalid={error?.field === "email"}
            />
          </Field>
        </div>

        <Field label="Password" error={error?.field === "password" ? error.message : undefined} hint="min 6 characters">
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-12"
              invalid={error?.field === "password"}
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="tap absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
            >
              {showPass ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          </div>
        </Field>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field
            label="Date of birth"
            error={error?.field === "dob" ? error.message : undefined}
            hint={age !== null ? (age >= 18 ? `Age ${age} ✓` : "Must be 18+") : undefined}
          >
            <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} invalid={error?.field === "dob"} />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(e) => set("gender", e.target.value as User["gender"])}>
              <option value="female">Woman</option>
              <option value="male">Man</option>
              <option value="non-binary">Non-binary</option>
              <option value="undisclosed">Prefer not to say</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Country" error={error?.field === "country" ? error.message : undefined}>
            <Select value={form.country} onChange={(e) => set("country", e.target.value)}>
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Language" error={error?.field === "language" ? error.message : undefined}>
            <Select value={form.language} onChange={(e) => set("language", e.target.value)}>
              <option value="">Select language…</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
        </div>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition",
            error?.field === "agree"
              ? "border-rose-400/50 bg-rose-500/10"
              : form.agree
                ? "border-mint-400/40 bg-mint-400/[0.07]"
                : "border-white/10 bg-white/[0.03] hover:border-white/20",
          )}
        >
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => set("agree", e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[#a855f7]"
          />
          <span className="text-xs leading-relaxed text-white/65">
            I confirm I am <strong className="text-white">18 or older</strong>, and I agree to the{" "}
            <Link to="/legal/terms" className="underline decoration-white/30 underline-offset-2 hover:text-white">Terms</Link>,{" "}
            <Link to="/legal/privacy" className="underline decoration-white/30 underline-offset-2 hover:text-white">Privacy Policy</Link> and{" "}
            <Link to="/legal/guidelines" className="underline decoration-white/30 underline-offset-2 hover:text-white">Community Guidelines</Link>.
          </span>
        </label>

        {error && !error.field && (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-200">
            {error.message}
          </p>
        )}
        {error?.field === "agree" && (
          <p className="text-xs font-semibold text-rose-300">{error.message}</p>
        )}

        <Button size="lg" className="w-full" type="submit" disabled={busy} loading={busy}>
          {busy ? "Creating your account…" : "Continue to profile setup"}
        </Button>

        <p className="text-center text-xs text-white/45">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-vibe-200 hover:text-white">Log in</Link>
        </p>
        <p className="text-center text-[11px] leading-relaxed text-white/30">
          Demo credentials are stored in your browser's localStorage. Nothing is uploaded. This app already has{" "}
          {db.users.length} local demo members.
        </p>
      </form>
    </AuthShell>
  );
}

/* ------------------------------------ Login --------------------------------- */

export function Login() {
  const { login, db } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const localAccounts = db.users.filter((u) => !u.isDemo || u.id === "u_demo");

  const canUseSaved = useMemo(() => localAccounts.some((u) => u.id === "u_demo"), [localAccounts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "We couldn't sign you in. Please try again.");
      return;
    }
    navigate("/", { replace: true });
  }

  function useDemo() {
    setEmail("demo@vibetalk.app");
    setPassword("demo1234");
    setError(null);
  }

  return (
    <AuthShell
      kicker="Welcome back"
      title="Log in to your VibeTalk"
      aside={
        canUseSaved && (
          <div className="mt-7 rounded-2xl border border-vibe-400/25 bg-vibe-600/10 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-vibe-200">Demo account</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/60">
              Prefilled and fully populated with rooms, DMs and coins:{" "}
              <span className="font-mono text-white/85">demo@vibetalk.app</span> /{" "}
              <span className="font-mono text-white/85">demo1234</span>
            </p>
            <Button size="sm" variant="soft" className="mt-3" onClick={useDemo} icon={<Zap className="size-3.5" />}>
              Fill demo credentials
            </Button>
          </div>
        )
      }
    >
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-200">
            {error}
          </p>
        )}

        <Button size="lg" className="w-full" type="submit" disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="size-4" /> Checking this device…
            </span>
          ) : (
            "Log in"
          )}
        </Button>

        <div className="flex items-center justify-between text-xs">
          <Link to="/signup" className="font-bold text-vibe-200 hover:text-white">
            Create an account instead
          </Link>
          <Link to="/welcome" className="inline-flex items-center gap-1 text-white/45 hover:text-white">
            <ArrowLeft className="size-3.5" /> Back
          </Link>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-white/30">
          Passwords never leave this device. Version 2 replaces local auth with Firebase Auth — this MVP
          deliberately calls no external API.
        </p>
      </form>
    </AuthShell>
  );
}

/* -------------------------------- Profile setup ------------------------------- */

export function ProfileSetup() {
  const { me, updateMe, finishSetup, visibleUsers } = useStore();
  const navigate = useNavigate();
  const onlineCount = visibleUsers.filter((u) => u.online).length;
  const [bio, setBio] = useState(me?.bio ?? "");
  const [country, setCountry] = useState(me?.country ?? "");
  const [language, setLanguage] = useState(me?.language ?? "English");
  const [gender, setGender] = useState<User["gender"]>(me?.gender ?? "undisclosed");
  const [interests, setInterests] = useState<string[]>(me?.interests ?? []);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!me) navigate("/login", { replace: true });
  }, [me, navigate]);

  if (!me) return null;

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= 5 ? prev : [...prev, i]));
  }

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    updateMe({ bio: bio.trim() || "New here. Say hi 👋", country, language, gender, interests });
    setSaving(false);
    setDone(true);
    window.setTimeout(() => {
      finishSetup();
      navigate("/", { replace: true });
    }, 900);
  }

  return (
    <AuthShell kicker="Step 2 of 2" title="Set up your profile">
      <div className="mb-5 flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div className="relative">
          <span
            className="grid size-20 place-items-center rounded-full font-display text-2xl font-extrabold text-white ring-2 ring-white/20"
            style={{ backgroundImage: gradientFor(me.id) }}
          >
            {me.username.slice(0, 2).toUpperCase()}
          </span>
          <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-mint-400 text-ink-950">
            <Check className="size-4" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold">@{me.username}</p>
          <p className="text-xs text-white/50">Your avatar is generated from your username — no uploads in the MVP.</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-white/60">Level {me.level}</span>
            <span className="rounded-full bg-coin-500/15 px-2 py-0.5 text-[10px] font-bold text-coin-400">
              {me.coins.toLocaleString()} Vibe Coins
            </span>
          </div>
        </div>
      </div>

      {done ? (
        <Card className="flex items-center gap-3 border-mint-400/40 bg-mint-400/[0.08] p-4">
          <Heart className="size-5 text-mint-400" />
          <p className="text-sm font-bold">Profile saved — loading your home feed…</p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          <Field label="Bio" hint={`${bio.length}/160`}>
            <textarea
              value={bio}
              maxLength={160}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What should people know before they hop on mic with you?"
              className="min-h-[86px] w-full resize-y rounded-2xl border border-white/12 bg-ink-900/70 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70 focus:ring-4 focus:ring-vibe-500/15"
            />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Country">
              <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Select…</option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Language">
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Gender">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["female", "male", "non-binary", "undisclosed"] as User["gender"][]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={cn(
                    "tap rounded-2xl border px-3 py-2.5 text-xs font-bold capitalize",
                    gender === g ? "vibe-gradient border-transparent text-white" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white",
                  )}
                >
                  {g === "female" ? "Woman" : g === "male" ? "Man" : g === "non-binary" ? "Non-binary" : "Private"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Interests" hint={`${interests.length}/5 · powers your recommendations`}>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((i) => (
                <Chip key={i} active={interests.includes(i)} onClick={() => toggleInterest(i)}>
                  {i}
                </Chip>
              ))}
            </div>
          </Field>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => { finishSetup(); navigate("/", { replace: true }); }}>
              Skip for now
            </Button>
            <Button className="flex-[2]" onClick={save} disabled={saving || !country}>
              {saving ? "Saving…" : !country ? "Choose a country first" : "Enter VibeTalk"}
            </Button>
          </div>
          <p className="text-center text-[11px] text-white/30">
            {onlineCount} demo members are online right now and waiting for a room.
          </p>
        </div>
      )}
    </AuthShell>
  );
}
