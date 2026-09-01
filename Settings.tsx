import {
  Ban,
  Bell,
  ChevronRight,
  Coins,
  Eye,
  FileText,
  Globe,
  LogOut,
  Pencil,
  Shield,
  Sparkles,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Button, Card, Chip, EmptyState, Field, Input, Modal, SectionHeader, Select, Toggle } from "../components/ui";
import { COUNTRIES, LANGUAGES } from "../lib/data";
import { useStore } from "../store/StoreProvider";
import type { User } from "../lib/types";
import { INTERESTS } from "../lib/data";
import { cn } from "../utils/cn";
import { ageFromDob, slug } from "../lib/utils";

const PREFS_KEY = "vibetalk.prefs.v1";

interface Prefs {
  pushNotifications: boolean;
  roomInvites: boolean;
  giftAlerts: boolean;
  gameAlerts: boolean;
  showOnline: boolean;
  showLevel: boolean;
  allowRoomInvites: boolean;
  autoJoinFromFollows: boolean;
  language: string;
}

const DEFAULT_PREFS: Prefs = {
  pushNotifications: true,
  roomInvites: true,
  giftAlerts: true,
  gameAlerts: false,
  showOnline: true,
  showLevel: true,
  allowRoomInvites: true,
  autoJoinFromFollows: false,
  language: "English",
};

function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function Settings() {
  const { me, db, updateMe, logout, toggleBlock, resetDemoData, pushToast, addNotification, markAllNotificationsRead } = useStore();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [tab, setTab] = useState<"account" | "prefs" | "privacy" | "blocked" | "reports">("account");

  useEffect(() => setPrefs(loadPrefs()), []);
  useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* storage unavailable — settings stay for this session */
    }
  }, [prefs]);

  if (!me) return null;
  const blocked = db.blocked.map((id) => db.users.find((u) => u.id === id)).filter(Boolean) as User[];
  const age = ageFromDob(me.dob);

  const TABS = [
    ["account", "Account", UserCog],
    ["prefs", "Notifications", Bell],
    ["privacy", "Privacy", Eye],
    ["blocked", `Blocked (${blocked.length})`, Ban],
    ["reports", `Reports (${db.reports.length})`, Shield],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
        {TABS.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "tap flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition",
              tab === key ? "vibe-gradient text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center gap-4 !rounded-[28px] p-5">
            <Avatar user={me} size={68} showStatus />
            <div className="min-w-[180px] flex-1">
              <p className="font-display text-lg font-extrabold">@{me.username}</p>
              <p className="text-xs text-white/50">{me.email} · {me.country} · {me.language}</p>
              <p className="mt-1 text-[11px] text-white/35">
                Level {me.level} · {age ? `age ${age}` : "age not shared"} · {(me.coins).toLocaleString()} Vibe Coins
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="soft" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(true)}>Edit profile</Button>
              <Link to="/coins"><Button size="sm" variant="coin" icon={<Coins className="size-3.5" />}>Coins</Button></Link>
              <Link to="/profile"><Button size="sm" variant="outline" icon={<Eye className="size-3.5" />}>View public</Button></Link>
            </div>
          </Card>

          <Card className="!rounded-3xl p-5">
            <SectionHeader title="Account details" subtitle="Stored in localStorage on this device" icon={<UserCog className="size-4.5 text-vibe-200" />} />
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Username", me.username],
                ["Email", me.email],
                ["Country", me.country],
                ["Language", prefs.language || me.language],
                ["Gender", me.gender === "undisclosed" ? "Private" : me.gender],
                ["Member since", new Date(me.joinedAt).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                  <dt className="text-[11px] uppercase tracking-widest text-white/35">{k}</dt>
                  <dd className="truncate text-[13px] font-semibold capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Select
                value={prefs.language}
                onChange={(e) => {
                  setPrefs((p) => ({ ...p, language: e.target.value }));
                  updateMe({ language: e.target.value });
                  pushToast(`App language set to ${e.target.value}`, "ok");
                }}
                className="max-w-[220px]"
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </Select>
              <Select
                value={me.country}
                onChange={(e) => updateMe({ country: e.target.value })}
                className="max-w-[220px]"
              >
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/legal/guidelines">
              <Card interactive className="flex items-center gap-3 !rounded-2xl p-4">
                <Users className="size-5 text-mint-400" />
                <span className="flex-1 text-sm font-bold">Community Guidelines</span>
                <ChevronRight className="size-4 text-white/35" />
              </Card>
            </Link>
            <Link to="/legal/privacy">
              <Card interactive className="flex items-center gap-3 !rounded-2xl p-4">
                <Shield className="size-5 text-vibe-200" />
                <span className="flex-1 text-sm font-bold">Privacy Policy</span>
                <ChevronRight className="size-4 text-white/35" />
              </Card>
            </Link>
            <Link to="/legal/terms">
              <Card interactive className="flex items-center gap-3 !rounded-2xl p-4">
                <FileText className="size-5 text-blush-300" />
                <span className="flex-1 text-sm font-bold">Terms of Service</span>
                <ChevronRight className="size-4 text-white/35" />
              </Card>
            </Link>
          </div>

          <Card className="!rounded-3xl border-rose-400/25 bg-rose-500/[0.06] p-5">
            <SectionHeader title="Danger zone" subtitle="Demo controls, safe to try" icon={<Trash2 className="size-4.5 text-rose-300" />} />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                icon={<LogOut className="size-4" />}
                onClick={() => {
                  logout();
                  navigate("/welcome", { replace: true });
                }}
              >
                Log out
              </Button>
              <Button variant="ghost" icon={<Sparkles className="size-4" />} onClick={() => setConfirmReset(true)}>
                Reset all demo data
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-white/40">
              Logging out only clears your session — your account, coins, chats and rooms stay saved. Resetting wipes
              the local database and restores the seeded demo world.
            </p>
          </Card>
        </div>
      )}

      {tab === "prefs" && (
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Notifications" subtitle="Preferences persist locally in this MVP" icon={<Bell className="size-4.5 text-vibe-200" />} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Toggle checked={prefs.pushNotifications} onChange={(v) => setPrefs((p) => ({ ...p, pushNotifications: v }))} label="Push notifications" description="Master switch for pings" />
            <Toggle checked={prefs.roomInvites} onChange={(v) => setPrefs((p) => ({ ...p, roomInvites: v }))} label="Room invitations" description="When someone saves you a seat" />
            <Toggle checked={prefs.giftAlerts} onChange={(v) => setPrefs((p) => ({ ...p, giftAlerts: v }))} label="Gift alerts" description="Someone sends you a rose or crown" />
            <Toggle checked={prefs.gameAlerts} onChange={(v) => setPrefs((p) => ({ ...p, gameAlerts: v }))} label="Game challenges" description="Rematch requests and streaks" />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <Globe className="size-4 text-white/45" />
            <p className="text-xs text-white/55">
              Real push delivery needs Firebase Cloud Messaging (or APNs/FCM) in version 2. This MVP only writes
              notifications into local storage.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                addNotification({
                  type: "system",
                  title: "Test ping from Settings",
                  body: "This is how gifts, follows and room invites will look. Demo only — push delivery arrives in v2.",
                });
                pushToast("Demo ping created — check the Notifications tab", "ok");
              }}
            >
              Send test ping
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { markAllNotificationsRead(); pushToast("All notifications marked read", "ok"); }}>
              Mark all read
            </Button>
          </div>
        </Card>
      )}

      {tab === "privacy" && (
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Privacy" subtitle="What other members can see" icon={<Eye className="size-4.5 text-mint-400" />} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Toggle checked={prefs.showOnline} onChange={(v) => setPrefs((p) => ({ ...p, showOnline: v }))} label="Show online status" description="Green dot next to your name" />
            <Toggle checked={prefs.showLevel} onChange={(v) => setPrefs((p) => ({ ...p, showLevel: v }))} label="Show level & xp" description="Level badge on your card" />
            <Toggle checked={prefs.allowRoomInvites} onChange={(v) => setPrefs((p) => ({ ...p, allowRoomInvites: v }))} label="Allow room invites" description="Anyone can invite you on mic" />
            <Toggle checked={prefs.autoJoinFromFollows} onChange={(v) => setPrefs((p) => ({ ...p, autoJoinFromFollows: v }))} label="Only from people I follow" description="Stricter invite filter" />
          </div>
          <div className="mt-4 space-y-2 text-xs leading-relaxed text-white/50">
            <p>• Your profile, messages, coins and rooms are stored in this browser only (localStorage key <span className="font-mono text-white/70">vibetalk.db.v1</span>).</p>
            <p>• No microphone, camera, contacts or location permission is requested by this MVP.</p>
            <p>• Clearing site data removes your account entirely — export isn't available yet.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>Delete my local data</Button>
            <Link to="/legal/privacy"><Button size="sm" variant="ghost">Read the privacy policy</Button></Link>
          </div>
        </Card>
      )}

      {tab === "blocked" && (
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Blocked users" subtitle="They can't see your rooms or message you" icon={<Ban className="size-4.5 text-rose-300" />} />
          {blocked.length === 0 ? (
            <EmptyState icon={<Users className="size-6" />} title="Nobody is blocked" body="If someone crosses a line, open their profile and choose Report & block. They'll appear here so you can undo it." action={<Link to="/search"><Button>Find members</Button></Link>} />
          ) : (
            <div className="space-y-2">
              {blocked.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <Avatar user={u} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">@{u.username}</p>
                    <p className="text-[11px] text-white/45">{u.country} · blocked in demo</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { toggleBlock(u.id); pushToast(`@${u.username} unblocked`, "info"); }}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "reports" && (
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Your reports" subtitle="Safety tickets created on this device" icon={<Shield className="size-4.5 text-vibe-200" />} />
          {db.reports.length === 0 ? (
            <EmptyState icon={<Shield className="size-6" />} title="No reports filed" body="Thank you for keeping the rooms kind. Reports you send will be listed here with a reference number." action={<Link to="/rooms"><Button>Browse rooms</Button></Link>} />
          ) : (
            <div className="space-y-2">
              {db.reports.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">#{r.id.slice(-6).toUpperCase()} · {r.targetType === "user" ? "User" : "Room"} {r.targetLabel}</p>
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200">in review</span>
                  </div>
                  <p className="mt-1.5 text-xs text-white/55">{r.reason}</p>
                  {r.details && <p className="mt-1 text-[11px] text-white/35">“{r.details}”</p>}
                  <p className="mt-1.5 text-[10px] uppercase tracking-widest text-white/30">{new Date(r.at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <EditProfileQuick open={editing} onClose={() => setEditing(false)} me={me} onSave={updateMe} allUsers={db.users} />

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        subtitle="This clears every local key and re-seeds the demo world"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Keep my data</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemoData();
                setConfirmReset(false);
                navigate("/welcome", { replace: true });
              }}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-white/60">
          Your account, DMs, coin balance, rooms and scores will be deleted from this browser. The seeded demo
          members, rooms and the <span className="font-mono text-white/80">demo@vibetalk.app</span> account come back
          fresh, so you can test onboarding again from scratch.
        </p>
      </Modal>
    </div>
  );
}

function EditProfileQuick({
  open,
  onClose,
  me,
  onSave,
  allUsers,
}: {
  open: boolean;
  onClose: () => void;
  me: User;
  onSave: (patch: Partial<User>) => void;
  allUsers: User[];
}) {
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick edit"
      subtitle="Full editor also lives on your profile page"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              const clean = slug(username);
              if (clean.length < 3) return setError("Username needs at least 3 characters.");
              if (allUsers.some((u) => u.id !== me.id && u.username.toLowerCase() === clean)) return setError("That username is taken.");
              onSave({ username: clean, bio: bio.trim() || me.bio, interests });
              setError(null);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Username"><Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} /></Field>
        <Field label="Bio" hint={`${bio.length}/160`}>
          <Input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} />
        </Field>
        <Field label="Interests" hint={`${interests.length}/5`}>
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((i) => (
              <Chip key={i} active={interests.includes(i)} onClick={() => setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length >= 5 ? p : [...p, i]))}>
                {i}
              </Chip>
            ))}
          </div>
        </Field>
        {error && <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-200">{error}</p>}
        <p className="text-[11px] leading-relaxed text-white/35">
          Changes save straight into your local profile. Avatar art is generated from your username, so it updates
          with it.
        </p>
      </div>
    </Modal>
  );
}
