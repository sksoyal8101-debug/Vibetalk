import { CornerUpLeft, Heart, MessageSquare, Mic, MoreHorizontal, Send, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipArt } from "./art";
import { FriendActions } from "./friends";
import { Avatar, Button, Card, IconButton } from "./ui";
import { HASHTAGS, TONES, vipTier } from "../lib/content";
import { captionIdeas, suggestSafetyCheck } from "../lib/assist";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import type { Post } from "../lib/types";
import { cn } from "../utils/cn";
import { timeAgo } from "../lib/utils";

export function PostCard({ post, focused = false }: { post: Post; focused?: boolean }) {
  const { me, userById, db, submitReport } = useStore();
  const { social, toggleLikePost, toggleSavePost, commentPost, sharePost, deletePost, toggleCommentLike } = useSocial();
  const [open, setOpen] = useState(focused);
  const [draft, setDraft] = useState("");
  const [burst, setBurst] = useState(0);

  const author = userById(post.authorId);
  const liked = me ? post.likes.includes(me.id) : false;
  const saved = me ? post.saves.includes(me.id) : false;
  const mine = post.authorId === me?.id;
  const room = post.roomId ? db.rooms.find((r) => r.id === post.roomId) : undefined;
  const plan = vipTier(social.vip.plan);
  const planForAuthor = author?.isDemo && author.level > 30 ? vipTier("gold") : null;

  return (
    <Card
      className={cn("relative overflow-hidden !rounded-[28px] p-0 transition", focused && "ring-1 ring-vibe-400/50")}
      interactive
    >
      <div className="flex items-start gap-3 p-4">
        <Link to={`/u/${author?.id ?? ""}`}>
          <Avatar user={author ?? undefined} size={46} showStatus />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link to={`/u/${author?.id ?? ""}`} className="truncate text-sm font-extrabold hover:underline">
              @{author?.username ?? "member"}
            </Link>
            {(planForAuthor ?? (mine ? plan : null)) && (
              <span className={cn("vip-badge", `vip-${(planForAuthor ?? plan)!.id}`)}>{(planForAuthor ?? plan)!.name.split(" ")[1]}</span>
            )}
            <span className="rounded-full bg-white/6 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/50">LV {author?.level ?? 1}</span>
            <span className="text-[11px] text-white/35">· {timeAgo(post.createdAt)} ago</span>
          </div>
          <p className={cn("mt-2 whitespace-pre-line text-[14.5px] leading-relaxed", post.media === "quote" ? "font-display text-lg font-bold" : "text-white/85")}>
            {post.text}
          </p>
          <Link to={`/discover?q=${encodeURIComponent(post.hashtag)}`} className="mt-1.5 inline-block text-[11px] font-bold text-vibe-200 hover:text-white">
            {post.hashtag}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {mine ? (
            <IconButton label="Delete post" onClick={() => deletePost(post.id)} className="size-8 text-white/40 hover:text-rose-200">
              <Trash2 className="size-3.5" />
            </IconButton>
          ) : (
            <IconButton
              label="Report this post"
              onClick={() => {
                submitReport({
                  targetType: "user",
                  targetId: post.authorId,
                  targetLabel: `@${author?.username ?? "member"} · post ${post.id.slice(-5)}`,
                  reason: "Reported from the feed (demo)",
                  details: post.text.slice(0, 180),
                });
                setOpen(true);
              }}
              className="size-8"
            >
              <MoreHorizontal className="size-3.5" />
            </IconButton>
          )}
        </div>
      </div>

      {post.media !== "none" && post.media !== "quote" && (
        <div className="relative">
          <ClipArt
            tone={post.tone}
            shape={post.tone}
            playing={false}
            seed={post.authorId}
            className={cn("w-full", post.media === "clip" ? "h-60" : "h-44")}
          />
          {post.media === "clip" && (
            <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white/85 backdrop-blur">
              <span className="size-1.5 rounded-full bg-blush-400" /> demo clip · no upload needed
            </span>
          )}
        </div>
      )}

      {!mine && (
        <div className="flex items-center justify-between gap-2 border-t border-white/6 px-4 py-2.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                toggleLikePost(post.id);
                if (!liked) {
                  setBurst((b) => b + 1);
                  window.setTimeout(() => setBurst(0), 900);
                }
              }}
              className={cn("tap relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition", liked ? "text-blush-300" : "text-white/55 hover:text-white")}
              aria-label="Like post"
            >
              <Heart className={cn("size-4", liked && "fill-current")} />
              {post.likes.length}
              {burst > 0 && <span key={burst} className="heart-pop pointer-events-none absolute -top-1 left-0 text-blush-300"><Heart className="size-4 fill-current" /></span>}
            </button>
            <button onClick={() => setOpen((o) => !o)} className="tap inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-white/55 hover:text-white" aria-label="Comments">
              <MessageSquare className="size-4" />
              {post.comments.length}
            </button>
            <button onClick={() => sharePost(post.id)} className="tap inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-white/55 hover:text-white" aria-label="Share">
              <CornerUpLeft className="size-4" />
              {post.shares}
            </button>
            <button
              onClick={() => toggleSavePost(post.id)}
              className={cn("tap inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition", saved ? "text-coin-400" : "text-white/40 hover:text-white")}
              aria-label="Save post"
            >
              <Sparkles className="size-3.5" /> {saved ? "saved" : "save"}
            </button>
          </div>
          <FriendActions userId={post.authorId} withMessage={false} />
        </div>
      )}

      {mine && (
        <div className="flex items-center justify-between gap-2 border-t border-white/6 px-4 py-2.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleLikePost(post.id)}
              className={cn("tap inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold", liked ? "text-blush-300" : "text-white/55 hover:text-white")}
              aria-label="Like post"
            >
              <Heart className={cn("size-4", liked && "fill-current")} /> {post.likes.length}
            </button>
            <button onClick={() => setOpen((o) => !o)} className="tap inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-white/55 hover:text-white">
              <MessageSquare className="size-4" /> {post.comments.length}
            </button>
            <button onClick={() => sharePost(post.id)} className="tap inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-white/55 hover:text-white">
              <CornerUpLeft className="size-4" /> {post.shares}
            </button>
          </div>
          {room && (
            <Link to={`/rooms/${room.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-bold text-white/60 hover:text-white">
              <Mic className="size-3" /> {room.title.slice(0, 18)}
            </Link>
          )}
        </div>
      )}

      {open && (
        <div className="space-y-2.5 border-t border-white/6 bg-black/25 p-4">
          {post.comments.length === 0 && <p className="text-[11px] text-white/35">No comments yet — be the first.</p>}
          {post.comments.map((c) => {
            const cu = userById(c.authorId);
            const cLiked = me ? c.likes.includes(me.id) : false;
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar user={cu ?? undefined} size={28} showFrame={false} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold">
                    @{cu?.username ?? "member"} <span className="font-normal text-white/30">· {timeAgo(c.at)} ago</span>
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-white/75">{c.text}</p>
                </div>
                <button
                  onClick={() => toggleCommentLike(post.id, c.id)}
                  className={cn("tap shrink-0 text-[10px] font-bold", cLiked ? "text-blush-300" : "text-white/35 hover:text-white")}
                  aria-label="Like comment"
                >
                  ♥ {c.likes.length}
                </button>
              </div>
            );
          })}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              commentPost(post.id, draft);
              setDraft("");
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              className="min-w-0 flex-1 rounded-full border border-white/12 bg-ink-950/70 px-3.5 py-2 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70"
            />
            <IconButton label="Send comment" type="submit" className="vibe-gradient size-9 border-0 text-white">
              <Send className="size-4" />
            </IconButton>
          </form>
        </div>
      )}
    </Card>
  );
}

/* --------------------------------- Composer -------------------------------- */

export function Composer({ onPosted }: { onPosted?: () => void }) {
  const { me } = useStore();
  const { createPost } = useSocial();
  const [text, setText] = useState("");
  const [tone, setTone] = useState(0);
  const [media, setMedia] = useState<Post["media"]>("gradient");
  const [hashtag, setHashtag] = useState(HASHTAGS[0]);
  const [ideas, setIdeas] = useState<string[]>([]);

  const safety = useMemo(() => suggestSafetyCheck(text), [text]);

  return (
    <Card className="!rounded-[28px] p-4">
      <div className="flex items-start gap-3">
        <Avatar user={me ?? undefined} size={44} showStatus />
        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={320}
            rows={3}
            placeholder={`What's the room energy today, @${me?.username ?? "you"}?`}
            className="w-full resize-none rounded-2xl border border-white/12 bg-ink-950/60 px-3.5 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-vibe-400/70"
          />
          {ideas.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => { setText(idea); setIdeas([]); }}
                  className="tap block w-full rounded-2xl border border-vibe-400/25 bg-vibe-600/12 px-3 py-2 text-left text-[12.5px] leading-snug text-white/80 hover:border-vibe-400/60"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(["gradient", "clip", "quote", "none"] as Post["media"][]).map((m) => (
              <button
                key={m}
                onClick={() => setMedia(m)}
                className={cn("tap rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", media === m ? "vibe-gradient border-transparent text-white" : "border-white/10 bg-white/5 text-white/45 hover:text-white")}
              >
                {m === "clip" ? "motion" : m === "none" ? "text only" : m}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-white/10" />
            {HASHTAGS.slice(0, 4).map((h) => (
              <button key={h} onClick={() => setHashtag(h)} className={cn("tap rounded-full px-2 py-1 text-[10px] font-bold", hashtag === h ? "bg-white/12 text-white" : "text-white/35 hover:text-white")}>
                {h}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TONES.slice(0, 6).map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                aria-label={t.label}
                className={cn("tap h-7 w-12 rounded-lg border-2 transition", tone === t.id ? "border-white/70" : "border-transparent opacity-70 hover:opacity-100")}
                style={{ background: t.wash }}
              />
            ))}
          </div>
          <p className={cn("mt-2 text-[11px]", safety.flag ? "text-amber-200" : "text-white/35")}>
            {safety.flag ? `⚠️ Local safety check flagged “${safety.flag}”. ${safety.note}` : safety.note}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                createPost({ text, tone, media, hashtag });
                setText("");
                setIdeas([]);
                onPosted?.();
              }}
              disabled={text.trim().length < 2}
              icon={<Send className="size-3.5" />}
            >
              Post moment
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<Sparkles className="size-3.5" />}
              onClick={() => setIdeas(captionIdeas(text || "the room", "warm").map((c) => c.caption))}
            >
              Suggest caption
            </Button>
            <span className="ml-auto text-[10px] uppercase tracking-widest text-white/25">+18 xp · AI Assistant — Demo</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
