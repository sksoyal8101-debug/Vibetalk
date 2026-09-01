import { Ban, Bell, Eye, Globe, Lock, MessageCircle, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, Reveal, SectionHeader, Segmented, StatTile, Toggle } from "../components/ui";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import type { PrivacyAudience } from "../lib/types";
import { cn } from "../utils/cn";

const AUDIENCES: { key: PrivacyAudience; label: string; hint: string }[] = [
  { key: "everyone", label: "Everyone", hint: "Any member on this device" },
  { key: "follows", label: "People I follow", hint: "Mutual or one-way follows only" },
  { key: "friends", label: "Friends only", hint: "Accepted friend links" },
  { key: "nobody", label: "Nobody", hint: "Closed. You can still browse." },
];

const FIELDS: { key: "message" | "follow" | "friendRequest" | "invite"; label: string; why: string }[] = [
  { key: "message", label: "Who can message me", why: "Strangers can be lovely. Limit DMs if you're here for rooms only." },
  { key: "follow", label: "Who can follow me", why: "Followers see your online dot and appear in your feed." },
  { key: "friendRequest", label: "Who can send friend requests", why: "Friends unlock group chats and faster replies." },
  { key: "invite", label: "Who can invite me to rooms", why: "Hosts ping you with a speaker seat when you allow this." },
];

export function Privacy() {
  const { db, me } = useStore();
  const { social, setPrivacy } = useSocial();
  if (!me) return null;
  const p = social.privacy;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-mint-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-[230px] flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-mint-400">Privacy Center</p>
            <h1 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">Your data, your doors</h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Everything here is enforced locally in this demo, and every rule is written the way it will work with a
              real backend: who can reach you, who can see you, and what leaves your device (nothing).
            </p>
          </div>
          <div className="grid w-full max-w-[300px] grid-cols-2 gap-2.5">
            <StatTile label="Blocked" value={db.blocked.length} tone="pink" icon={<Ban className="size-4" />} />
            <StatTile label="Reports filed" value={db.reports.length} tone="violet" icon={<Shield className="size-4" />} />
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader title="Who can reach me" subtitle="Applies to profiles, rooms and the friend graph" icon={<MessageCircle className="size-4.5 text-vibe-200" />} />
        <div className="space-y-3">
          {FIELDS.map((f, i) => (
            <Reveal key={f.key} delay={i * 55}>
              <Card className="!rounded-[26px] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-bold">{f.label}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">{f.why}</p>
                  </div>
                  <Segmented
                    size="sm"
                    className="w-full max-w-[420px]"
                    value={p[f.key]}
                    onChange={(next) => setPrivacy({ [f.key]: next } as never)}
                    options={AUDIENCES.map((a) => ({ key: a.key, label: a.label }))}
                  />
                </div>
                <p className="mt-2.5 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] text-white/50">
                  Current setting: <strong className="text-white/80">{AUDIENCES.find((a) => a.key === p[f.key])?.label}</strong> —{" "}
                  {AUDIENCES.find((a) => a.key === p[f.key])?.hint}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="!rounded-[28px] p-5">
          <SectionHeader title="Visibility" subtitle="What your profile broadcasts" icon={<Eye className="size-4.5 text-sky-200" />} />
          <div className="space-y-2.5">
            <Toggle checked={p.profileVisible} onChange={(v) => setPrivacy({ profileVisible: v })} label="Profile visible in Discover" description="Off hides you from discovery lists and search (demo)" />
            <Toggle checked={p.showOnline} onChange={(v) => setPrivacy({ showOnline: v })} label="Show online status" description="The green dot next to your name" />
            <Toggle checked={p.readReceipts} onChange={(v) => setPrivacy({ readReceipts: v })} label="Read receipts" description="Double ticks in DMs" />
            <Toggle checked={p.showActivity} onChange={(v) => setPrivacy({ showActivity: v })} label="Show activity & badges" description="Level, streaks and badges on your profile" />
          </div>
        </Card>

        <Card className="!rounded-[28px] p-5">
          <SectionHeader title="Notification preferences" subtitle="Categories you actually want" icon={<Bell className="size-4.5 text-blush-300" />} />
          <div className="space-y-2.5">
            <Toggle checked={p.notifSocial} onChange={(v) => setPrivacy({ notifSocial: v })} label="Social" description="Follows, friends, reactions" />
            <Toggle checked={p.notifRooms} onChange={(v) => setPrivacy({ notifRooms: v })} label="Rooms & events" description="Invites, host online, event reminders" />
            <Toggle checked={p.notifRewards} onChange={(v) => setPrivacy({ notifRewards: v })} label="Rewards" description="Level ups, badges, dailies" />
            <Toggle checked={p.notifSystem} onChange={(v) => setPrivacy({ notifSystem: v })} label="System & safety" description="Policy notices, report outcomes" />
          </div>
        </Card>
      </div>

      <Card className="!rounded-[28px] p-5">
        <SectionHeader title="Your data, plainly" subtitle="What version 2 stores and where" icon={<Lock className="size-4.5 text-mint-400" />} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            { k: "Where it lives", v: "localStorage keys vibetalk.db.v1 and vibetalk.social.v2 on this browser." },
            { k: "What's inside", v: "Profile, session, messages, groups, posts, reels, stories, rooms, events, coins, gifts, xp, badges, favourites, settings." },
            { k: "Never collected", v: "No mic, camera, contacts, location, advertising ID, analytics or crash uploader in this build." },
            { k: "Deleting it", v: "Settings → Danger zone → Reset all demo data wipes everything, including v2 collections." },
          ].map((row) => (
            <div key={row.k} className={cn("rounded-2xl border border-white/8 bg-white/[0.03] p-3.5")}>
              <p className="text-[11px] font-black uppercase tracking-widest text-white/40">{row.k}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">{row.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/safety"><Button size="sm" variant="outline" icon={<Shield className="size-3.5" />}>Safety Center</Button></Link>
          <Link to="/settings"><Button size="sm" variant="ghost" icon={<Users className="size-3.5" />}>Blocked & reports</Button></Link>
          <Link to="/legal/privacy"><Button size="sm" variant="ghost" icon={<Globe className="size-3.5" />}>Full policy</Button></Link>
        </div>
      </Card>
    </div>
  );
}
