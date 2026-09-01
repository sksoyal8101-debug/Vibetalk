import { Bot, Heart, Lightbulb, Mic, Send, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Card, Chip, Field, IconButton, Input, SectionHeader, Textarea } from "../components/ui";
import { recommendFor } from "../lib/social";
import { assistantReply, bioIdeas, captionIdeas, interestSuggestions, roomTitleIdeas, starters, suggestSafetyCheck } from "../lib/assist";
import { ROOM_CATEGORIES } from "../lib/rooms";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";

interface Turn {
  id: string;
  from: "me" | "bot";
  text: string;
  chips?: string[];
}

const QUICK = ["Write my bio", "Suggest a room title", "Give me a caption", "Conversation starter", "Recommend interests", "Is my post safe?"];

export function Assistant() {
  const { me, db } = useStore();
  const recCount = recommendFor(db, me).users.length;
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<Turn[]>([
    {
      id: "intro",
      from: "bot",
      text: "I'm the VibeTalk assistant — a local, rule-based helper (no AI API in this version). I can tighten your bio, name a room, draft a caption, suggest interests or run a safety check on a draft. Ask away.",
      chips: QUICK,
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [bio, setBio] = useState("");
  const [titleTopic, setTitleTopic] = useState("Music");
  const [captionSubject, setCaptionSubject] = useState("");
  const [draftPost, setDraftPost] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length, busy]);

  function ask(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const id = `${Date.now()}`;
    setTurns((prev) => [...prev, { id, from: "me", text: clean }]);
    setPrompt("");
    setBusy(true);
    window.setTimeout(() => {
      const res = assistantReply(clean, `your interests: ${(me?.interests ?? []).join(", ") || "none yet"}; language: ${me?.language ?? "English"}`);
      setTurns((prev) => [...prev, { id: `${id}b`, from: "bot", text: `${res.label}: ${res.text}`, chips: res.chips }]);
      setBusy(false);
    }, 620);
  }

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden !rounded-[30px] p-5 sm:p-6">
        <div className="vibe-gradient pointer-events-none absolute -right-20 -top-24 size-60 rounded-full opacity-25 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid size-14 place-items-center rounded-3xl bg-vibe-600/25 text-vibe-200 ring-1 ring-vibe-400/30">
            <Bot className="size-7" />
          </span>
          <div className="min-w-[230px] flex-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
              <Sparkles className="size-3 text-blush-300" /> AI Assistant — Demo
            </p>
            <h1 className="mt-1.5 font-display text-[26px] font-extrabold leading-tight sm:text-[32px]">Your social co-host</h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/55">
              Templates + your own profile data, evaluated locally. Nothing is sent anywhere, and no external AI API
              is called in version 2.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="flex min-h-[440px] flex-col !rounded-[28px] p-0">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {turns.map((t) => (
              <div key={t.id} className={cn("flex items-start gap-2.5", t.from === "me" && "flex-row-reverse")}>
                {t.from === "bot" ? (
                  <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-vibe-600/25 text-vibe-200">
                    <Bot className="size-4.5" />
                  </span>
                ) : (
                  <Avatar user={me ?? undefined} size={34} showFrame={false} />
                )}
                <div className={cn("max-w-[82%]", t.from === "me" && "text-right")}>
                  <p
                    className={cn(
                      "inline-block rounded-2xl px-3.5 py-2.5 text-left text-[13.5px] leading-relaxed",
                      t.from === "me" ? "vibe-gradient rounded-br-md text-white" : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white/85",
                    )}
                  >
                    {t.text}
                  </p>
                  {t.chips && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.chips.map((c) => (
                        <Chip key={c} onClick={() => ask(c)}>
                          {c}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <span className="grid size-8 place-items-center rounded-xl bg-white/6"><Sparkles className="size-3.5 animate-pulse" /></span>
                thinking locally…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(prompt);
            }}
            className="flex items-center gap-2 border-t border-white/8 p-3"
          >
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask for a bio, a room title, a caption…"
              className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-ink-950/60 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70"
            />
            <IconButton label="Send" type="submit" className="vibe-gradient size-11 shrink-0 border-0 text-white">
              <Send className="size-4.5" />
            </IconButton>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Profile bio" subtitle="3 drafts from your interests" icon={<Wand2 className="size-4.5 text-blush-300" />} />
            <Field label="Seed line (optional)">
              <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="night-shift nurse, terrible dancer" />
            </Field>
            <div className="mt-2.5 space-y-2">
              {(bioIdeas(me, "warm").length ? bioIdeas(me, "warm").map((b) => (bio ? `${bio} — ${b.split(" — ")[0]}` : b)) : []).map((idea, i) => (
                <p key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-[12.5px] leading-relaxed text-white/70">{idea}</p>
              ))}
            </div>
          </Card>

          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Room title lab" subtitle="Titles that make people tap" icon={<Mic className="size-4.5 text-mint-400" />} />
            <div className="flex flex-wrap gap-1.5">
              {ROOM_CATEGORIES.map((c) => (
                <Chip key={c} active={titleTopic === c} onClick={() => setTitleTopic(c)}>{c}</Chip>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {roomTitleIdeas(titleTopic).slice(0, 3).map((t) => (
                <div key={t.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[13px] font-bold">{t.title}</p>
                  <p className="mt-1 text-[11px] text-white/45">{t.why}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Caption & safety" subtitle="Draft a post, check it locally" icon={<Heart className="size-4.5 text-coin-400" />} />
            <Field label="What's the moment?">
              <Textarea value={captionSubject} onChange={(e) => setCaptionSubject(e.target.value)} placeholder="the room sang my bad song back at me" className="min-h-[64px]" />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setDraftPost(captionIdeas(captionSubject)[0].caption)}>Generate caption</Button>
              <Button size="sm" variant="outline" onClick={() => ask(`Caption for: ${captionSubject || "the room"}`)}>Ask assistant</Button>
            </div>
            {draftPost && (
              <>
                <Textarea value={draftPost} onChange={(e) => setDraftPost(e.target.value)} className="mt-3" />
                <p className={cn("mt-2 rounded-2xl border px-3 py-2 text-[11px] leading-relaxed", suggestSafetyCheck(draftPost).flag ? "border-amber-400/35 bg-amber-400/10 text-amber-100" : "border-mint-400/25 bg-mint-400/[0.07] text-mint-100")}>
                  {suggestSafetyCheck(draftPost).note}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["dry", "storyteller", "question"] as const).map((s) => (
                    <Chip key={s} onClick={() => setDraftPost(captionIdeas(captionSubject || s, s)[s.length % 4].caption)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card className="!rounded-[28px] p-4">
            <SectionHeader title="Talk to a member" subtitle="Openers based on their profile" icon={<Lightbulb className="size-4.5 text-sky-200" />} />
            <div className="space-y-2">
              {starters(db.users.find((u) => u.id !== me?.id) ?? null, me).slice(0, 4).map((s) => (
                <p key={s} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[12.5px] leading-relaxed text-white/70">{s}</p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {interestSuggestions(me?.interests ?? []).map((s) => (
                <Chip key={s.interest}>{s.interest} · {s.why}</Chip>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/35">{recCount} suggested members are ranked with the same local signals — see Discover.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
