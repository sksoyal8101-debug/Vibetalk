import { AlertTriangle, Ban, Check, Eye, FileText, Flag, Gavel, HeartHandshake, Lock, Scale, Shield, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, EmptyState, SectionHeader, Select } from "../components/ui";
import { ReportDialog } from "../components/ReportDialog";
import { useStore } from "../store/StoreProvider";
import { ageFromDob } from "../lib/utils";
import { LEGAL_DOCS } from "../lib/legal";

export function SafetyCenter() {
  const { me, db } = useStore();
  const [reportRoom, setReportRoom] = useState<string>("");
  const [reportOpen, setReportOpen] = useState(false);
  const age = ageFromDob(me?.dob ?? "");
  const room = db.rooms.find((r) => r.id === reportRoom);

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden !rounded-[30px] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-mint-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid size-14 place-items-center rounded-3xl bg-mint-400/15 text-mint-400 ring-1 ring-mint-400/30">
            <Shield className="size-7" />
          </span>
          <div className="min-w-[220px] flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Safety centre</h1>
            <p className="mt-1 max-w-xl text-sm text-white/55">
              VibeTalk is built for adults 18+. Respect is the price of admission — report what you don't want to
              see, block in one tap, and expect human moderation in version 2.
            </p>
          </div>
          <span className="rounded-2xl border border-mint-400/30 bg-mint-400/10 px-4 py-3 text-center">
            <span className="block font-display text-xl font-extrabold text-mint-400">18+</span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/45">
              {age && age >= 18 ? `self-declared ${age}` : "not verified"}
            </span>
          </span>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Users, title: "Respect identities", body: "No racism, homophobia, transphobia, slurs or harassment. Instant-removal territory." },
          { icon: Lock, title: "Keep it age-appropriate", body: "No sexual content involving anyone who looks under 18, no solicitation, no sharing of explicit media." },
          { icon: AlertTriangle, title: "No money pressure", body: "Never ask for bank details, gifts in exchange for favors, or send gambling links. Coins stay virtual." },
          { icon: Eye, title: "Consent on mic", body: "Don't record, screenshot or replay private conversations. Rooms are for live company only." },
          { icon: HeartHandshake, title: "Look after each other", body: "If someone sounds unsafe, offer to move them to a calmer room or ping a moderator. Don't diagnose or preach." },
          { icon: Ban, title: "No spam or self-promo", body: "One room, one message at a time. Crypto funnels, invite-farming and repeated DM blasts get removed." },
        ].map((c) => (
          <Card key={c.title} interactive className="!rounded-3xl p-4">
            <span className="grid size-10 place-items-center rounded-2xl bg-vibe-600/20 text-vibe-200 ring-1 ring-vibe-400/25">
              <c.icon className="size-5" />
            </span>
            <p className="mt-3 text-sm font-bold">{c.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{c.body}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Report a room" subtitle="Takes 15 seconds" icon={<Flag className="size-4.5 text-rose-300" />} />
          <Select value={reportRoom} onChange={(e) => setReportRoom(e.target.value)} className="mb-3">
            <option value="">Choose a room to report…</option>
            {db.rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.title} · {r.topic}</option>
            ))}
          </Select>
          <Button className="w-full" variant="danger" disabled={!room} onClick={() => setReportOpen(true)} icon={<Flag className="size-4" />}>
            {room ? `Report “${room.title}”` : "Select a room first"}
          </Button>
          <p className="mt-3 text-[11px] leading-relaxed text-white/40">
            Reports include your reason, any details you typed and the room's local id. They are stored on this device
            for the demo; version 2 sends them to a moderation queue with severity scoring.
          </p>
        </Card>

        <Card className="!rounded-3xl p-5">
          <SectionHeader title="Your safety record" subtitle="Blocks and reports on this device" icon={<Check className="size-4.5 text-mint-400" />} />
          {db.blocked.length === 0 && db.reports.length === 0 ? (
            <EmptyState icon={<Shield className="size-6" />} title="All clear" body="You haven't blocked or reported anyone. That's the ideal state — keep it, and speak up if it changes." />
          ) : (
            <div className="space-y-2.5">
              {db.blocked.length > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3 text-sm">
                  <span className="text-white/60">Blocked members</span>
                  <span className="font-black">{db.blocked.length}</span>
                </div>
              )}
              {db.reports.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3 text-sm">
                  <p className="font-bold">{r.targetType === "user" ? "User" : "Room"} · {r.targetLabel}</p>
                  <p className="mt-0.5 text-xs text-white/50">{r.reason}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-white/30">#{r.id.slice(-6).toUpperCase()} · {new Date(r.at).toLocaleString()}</p>
                </div>
              ))}
              <Link to="/settings">
                <Button size="sm" variant="outline">Manage blocked users</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <Card className="!rounded-3xl p-5">
        <SectionHeader title="Policies" subtitle="Written for this MVP, plain language on purpose" icon={<FileText className="size-4.5 text-vibe-200" />} />
        <div className="grid gap-2.5 sm:grid-cols-3">
          {([
            ["terms", "Terms of Service", Scale],
            ["privacy", "Privacy Policy", Lock],
            ["guidelines", "Community Guidelines", Sparkles],
          ] as [string, string, typeof Scale][]).map(([key, label, Icon]) => (
            <Link key={key} to={`/legal/${key}`}>
              <Card interactive className="flex items-center gap-3 !rounded-2xl p-4">
                <Icon className="size-5 text-vibe-200" />
                <span className="text-sm font-bold">{label}</span>
                <span className="ml-auto text-[11px] font-bold text-white/40">Read →</span>
              </Card>
            </Link>
          ))}
        </div>
      </Card>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="room"
        targetId={room?.id ?? ""}
        targetLabel={room?.title ?? "room"}
      />
    </div>
  );
}

export function LegalPage() {
  const { doc = "terms" } = useParams();
  const entry = LEGAL_DOCS[doc] ?? LEGAL_DOCS.terms;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="!rounded-[28px] p-5 sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blush-300/80">{entry.kicker}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{entry.title}</h1>
        <p className="mt-2 text-sm text-white/45">Last updated {entry.updated} · VibeTalk MVP (prototype)</p>
        <div className="mt-6 space-y-5">
          {entry.sections.map((s, i) => (
            <section key={s.heading}>
              <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
                <span className="grid size-6 place-items-center rounded-lg bg-vibe-600/25 text-[11px] font-black text-vibe-200">{i + 1}</span>
                {s.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
            </section>
          ))}
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Link to="/safety"><Button variant="outline">Safety centre</Button></Link>
        <Link to="/settings"><Button variant="ghost">Settings</Button></Link>
        <Link to="/"><Button variant="ghost">Back to home</Button></Link>
      </div>
      <Gavel className="hidden" />
    </div>
  );
}
