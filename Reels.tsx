import {
  Bookmark,
  ChevronUp,
  Heart,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipArt } from "../components/art";
import { Avatar, Button, Card, Field, IconButton, Input, Segmented, Sheet, Skeleton, TypingDots } from "../components/ui";
import { TRACKS, TONES } from "../lib/content";
import { clipsForMe, trendingVideos } from "../lib/engine";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import type { User, Video } from "../lib/types";
import { cn } from "../utils/cn";
import { compact, timeAgo } from "../lib/utils";

type Tab = "foryou" | "following" | "trending";

export function Reels() {
  const { db, me, userById, myFollows, toggleFollow, pushToast } = useStore();
  const { social, ctx, ready, registerView, toggleLikeVideo, toggleSaveVideo, commentVideo, shareVideo, createVideo, deleteVideo } = useSocial();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>("foryou");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [creatorPreview, setCreatorPreview] = useState<User | null>(null);
  const [progress, setProgress] = useState(0);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLDivElement | null)[]>([]);

  const startId = params.get("start");

  const feed = useMemo<Video[]>(() => {
    let list: Video[];
    if (tab === "trending") list = trendingVideos(ctx, 40).map((r) => r.video);
    else if (tab === "following") list = social.videos.filter((v) => myFollows.includes(v.authorId) || v.authorId === me?.id);
    else list = clipsForMe(ctx).sort((a, b) => b.score - a.score).map((r) => r.item);
    if (list.length === 0) list = social.videos;
    return startId ? [...list].sort((a, b) => (a.id === startId ? -1 : 0) - (b.id === startId ? 1 : 0) * -1) : list;
  }, [ctx, me?.id, myFollows, social.videos, startId, tab]);

  // Only score once per clip, and keep the reel index honest.
  useEffect(() => {
    if (feed[active]) registerView(feed[active].id);
    setProgress(0);
  }, [active, feed, registerView]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { root: container.current, threshold: [0.62] },
    );
    slides.current.forEach((node) => node && io.observe(node));
    return () => io.disconnect();
  }, [feed.length]);

  useEffect(() => {
    if (paused || !feed.length) return;
    const duration = (feed[active]?.duration ?? 16) * 1000;
    const started = performance.now() - progress * duration;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / duration);
      setProgress(p);
      if (p >= 1) {
        const nextIdx = (active + 1) % Math.max(1, feed.length);
        slides.current[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
        setActive(nextIdx);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused, feed.length]);

  const activeClip = feed[active];
  const commentTarget = commentsFor ? social.videos.find((v) => v.id === commentsFor) : null;

  if (!ready) {
    return (
      <div className="mx-auto grid max-w-[420px] place-items-center px-4 py-10">
        <Skeleton className="h-[70vh] w-full !rounded-[32px]" />
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-vibe-600/25 text-vibe-200"><Music2 className="size-7" /></span>
        <h1 className="font-display text-2xl font-extrabold">No clips here yet</h1>
        <p className="text-sm text-white/55">This tab is empty — switch to For You, follow a creator, or publish a demo clip (rendered locally, nothing uploaded).</p>
        <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>Create a demo clip</Button>
      </div>
    );
  }

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-6">
      <div className="mx-auto flex max-w-[520px] flex-col gap-3 px-4 pb-3 sm:px-6">
        <Segmented
          value={tab}
          onChange={(next) => { setTab(next); setActive(0); }}
          options={[
            { key: "foryou", label: "For You", icon: <Sparkles className="size-3.5" /> },
            { key: "following", label: "Following", icon: <Heart className="size-3.5" /> },
            { key: "trending", label: "Trending", icon: <Music2 className="size-3.5" /> },
          ]}
          className="justify-between"
        />
      </div>

      <div
        ref={container}
        className="reel-scroll no-scrollbar flex snap-x flex-col gap-3 overflow-y-auto px-4 pb-4 sm:px-6 lg:mx-auto lg:max-w-[1100px] lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:overflow-visible lg:px-8"
        style={{ maxHeight: "calc(100dvh - 150px)" }}
      >
        <div className="flex flex-col gap-3">
          {feed.map((video, i) => {
            const u = userById(video.authorId);
            const liked = me ? video.likes.includes(me.id) : false;
            const saved = me ? video.saves.includes(me.id) : false;
            const isActive = i === active;
            return (
              <div
                key={video.id}
                data-idx={i}
                ref={(node) => { slides.current[i] = node; }}
                className={cn(
                  "reel-slide group relative isolate aspect-[9/15] w-full shrink-0 overflow-hidden rounded-[28px] border bg-black shadow-[0_30px_90px_-40px_rgba(0,0,0,.95)] sm:aspect-[9/14]",
                  isActive ? "border-vibe-400/40" : "border-white/8",
                )}
                onClick={() => setPaused((p) => !p)}
              >
                <ClipArt tone={video.tone} shape={video.shape} playing={isActive && !paused} seed={video.authorId} className="absolute inset-0 size-full" />

                {/* tap zones */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLikeVideo(video.id); }}
                  aria-label="Like clip"
                  className="absolute inset-0 z-[1]"
                />

                {/* Audio mute/unmute control */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((m) => {
                      const next = !m;
                      pushToast(next ? "Clip muted (demo)" : "Clip unmuted (demo)", "info");
                      return next;
                    });
                  }}
                  aria-label={isMuted ? "Unmute clip" : "Mute clip"}
                  className="tap absolute right-3 top-3 z-[4] grid size-9 place-items-center rounded-full bg-black/60 text-white/90 backdrop-blur hover:bg-black/80 transition"
                >
                  {isMuted ? <VolumeX className="size-4 text-rose-300" /> : <Volume2 className="size-4 text-mint-300" />}
                </button>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] space-y-2 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 pt-16">
                  <div className="pointer-events-auto flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (u) setCreatorPreview(u);
                      }}
                      className="tap text-left flex items-center gap-2.5 min-w-0 flex-1 group/author"
                    >
                      <Avatar user={u ?? undefined} size={38} showStatus showFrame={false} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-extrabold group-hover/author:underline">@{u?.username ?? "member"}</p>
                        <p className="truncate text-[11px] text-white/55">LV {u?.level ?? 1} · {video.views.toLocaleString()} views · {timeAgo(video.createdAt)} ago</p>
                      </div>
                    </button>
                    {u && u.id !== me?.id && (
                      <Button size="sm" variant={myFollows.includes(u.id) ? "soft" : "primary"} className="pointer-events-auto" onClick={(e) => { e.stopPropagation(); toggleFollow(u.id); }}>
                        {myFollows.includes(u.id) ? "Following" : "Follow"}
                      </Button>
                    )}
                  </div>
                  <p className="text-[14px] font-semibold leading-snug text-white">{video.title}</p>
                  <p className="flex items-center gap-1.5 overflow-hidden text-[11px] text-white/70">
                    <Music2 className="size-3.5 shrink-0" />
                    <span className="truncate">{video.music}</span>
                    <span className="ml-2 shrink-0 text-white/40">{video.hashtags.join(" ")}</span>
                  </p>
                </div>

                <div className="absolute bottom-4 right-2.5 z-[3] flex flex-col items-center gap-2.5">
                  <RailButton
                    label="Like"
                    count={video.likes.length}
                    active={liked}
                    onClick={(e) => { e.stopPropagation(); toggleLikeVideo(video.id); }}
                    icon={<Heart className={cn("size-5", liked && "fill-current")} />}
                  />
                  <RailButton
                    label="Comments"
                    count={video.comments.length}
                    onClick={(e) => { e.stopPropagation(); setCommentsFor(video.id); }}
                    icon={<MessageCircle className="size-5" />}
                  />
                  <RailButton
                    label="Share"
                    count={video.shares}
                    onClick={(e) => { e.stopPropagation(); shareVideo(video.id); }}
                    icon={<Share2 className="size-5" />}
                  />
                  <RailButton
                    label="Save"
                    onClick={(e) => { e.stopPropagation(); toggleSaveVideo(video.id); }}
                    active={saved}
                    icon={<Bookmark className={cn("size-5", saved && "fill-current")} />}
                  />
                  {video.authorId === me?.id && (
                    <IconButton
                      label="Delete clip"
                      className="size-9 bg-black/50 text-rose-200"
                      onClick={(e) => { e.stopPropagation(); deleteVideo(video.id); }}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  )}
                </div>

                <div className="absolute inset-x-0 top-0 z-[3] h-[3px] bg-white/10">
                  <div className="h-full bg-white/90 transition-[width] duration-150" style={{ width: `${isActive ? progress * 100 : 0}%` }} />
                </div>
                {paused && isActive && (
                  <span className="absolute left-1/2 top-1/2 z-[4] grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                    <Play className="size-7" />
                  </span>
                )}
                {video.roomId && (
                  <Link
                    to={`/rooms/${video.roomId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-3 top-3 z-[4] inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/85 backdrop-blur hover:bg-black/75"
                  >
                    <span className="size-1.5 animate-pulse rounded-full bg-rose-400" /> from live room
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* desktop side rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-3">
            <Card className="!rounded-3xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Now playing</p>
              {activeClip ? (
                <>
                  <p className="mt-2 font-display text-lg font-extrabold leading-snug">{activeClip.title}</p>
                  <p className="mt-1 text-[11px] text-white/50">{activeClip.music}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-white/45">
                    <span>{compact(activeClip.views)} views</span>
                    <span>{activeClip.likes.length} likes</span>
                    <span>{activeClip.comments.length} comments</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="soft" onClick={() => setPaused((p) => !p)} icon={paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}>
                      {paused ? "Play" : "Pause"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCommentsFor(activeClip.id)}>
                      Comments
                    </Button>
                    <IconButton label="Jump to top" onClick={() => slides.current[0]?.scrollIntoView({ behavior: "smooth", block: "center" })} className="size-9">
                      <ChevronUp className="size-4" />
                    </IconButton>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-white/45">Scroll the feed to load a clip.</p>
              )}
            </Card>

            <Card className="!rounded-3xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">More clips</p>
              <div className="mt-2.5 space-y-2">
                {feed.slice(0, 6).map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => { slides.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" }); setActive(i); }}
                    className={cn("tap flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left transition", i === active ? "border-vibe-400/50 bg-vibe-600/15" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.06]")}
                  >
                    <ClipArt tone={v.tone} shape={v.shape} className="size-10 shrink-0 rounded-xl" overlay={false} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-bold">{v.title}</span>
                      <span className="block truncate text-[10px] text-white/40">@{db.users.find((u) => u.id === v.authorId)?.username} · {compact(v.views)} views</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            <Button className="w-full" onClick={() => setCreating(true)} icon={<Plus className="size-4" />}>
              Create demo clip
            </Button>
          </div>
        </aside>
      </div>

      <div className="mx-auto mt-3 flex max-w-[520px] items-center gap-2 px-4 sm:px-6 lg:hidden">
        <Button size="sm" variant="outline" onClick={() => setCreating(true)} icon={<Plus className="size-3.5" />}>New clip</Button>
        <span className="text-[10px] uppercase tracking-widest text-white/25">tap to pause · swipe for next</span>
      </div>

      <Sheet
        open={!!commentTarget}
        onClose={() => setCommentsFor(null)}
        title="Comments"
        subtitle={commentTarget ? `${commentTarget.comments.length} on “${commentTarget.title.slice(0, 28)}…”` : ""}
      >
        <div className="space-y-3">
          {commentTarget?.comments.length === 0 && <p className="text-xs text-white/40">No comments yet. Start it.</p>}
          {commentTarget?.comments.map((c) => {
            const cu = userById(c.authorId);
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar user={cu ?? undefined} size={32} showFrame={false} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold">@{cu?.username ?? "member"} <span className="font-normal text-white/30">· {timeAgo(c.at)} ago</span></p>
                  <p className="text-[13px] leading-snug text-white/80">{c.text}</p>
                </div>
              </div>
            );
          })}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const el = e.currentTarget.elements.namedItem("c") as HTMLInputElement | null;
              if (!el?.value.trim() || !commentTarget) return;
              commentVideo(commentTarget.id, el.value);
              el.value = "";
            }}
            className="flex items-center gap-2 rounded-2xl border border-white/12 bg-ink-950/60 p-2"
          >
            <input name="c" placeholder="Add a comment…" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-white/30" />
            <IconButton label="Send" type="submit" className="vibe-gradient size-9 border-0 text-white"><Send className="size-4" /></IconButton>
          </form>
          {commentTarget && commentTarget.authorId !== me?.id && (
            <p className="flex items-center gap-2 text-[11px] text-white/35"><TypingDots /> creators usually reply within a room</p>
          )}
        </div>
      </Sheet>

      <Sheet
        open={!!creatorPreview}
        onClose={() => setCreatorPreview(null)}
        title={creatorPreview ? `@${creatorPreview.username}` : "Creator Profile"}
        subtitle={creatorPreview ? `${creatorPreview.country} · Level ${creatorPreview.level}` : ""}
      >
        {creatorPreview && (
          <div className="space-y-4 text-center">
            <Avatar user={creatorPreview} size={76} showStatus className="mx-auto" />
            <div>
              <p className="font-display text-lg font-bold text-white">@{creatorPreview.username}</p>
              <p className="mt-1 text-xs text-white/60 leading-relaxed max-w-xs mx-auto">{creatorPreview.bio || "Creator on VibeTalk"}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                <p className="font-display text-base font-bold text-white">{compact(creatorPreview.followers)}</p>
                <p className="text-[10px] text-white/40 uppercase">Followers</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                <p className="font-display text-base font-bold text-white">{creatorPreview.level}</p>
                <p className="text-[10px] text-white/40 uppercase">Level</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                <p className="font-display text-base font-bold text-white">{compact(creatorPreview.sparkles)}</p>
                <p className="text-[10px] text-white/40 uppercase">Sparkles</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {creatorPreview.id !== me?.id && (
                <Button
                  className="flex-1"
                  variant={myFollows.includes(creatorPreview.id) ? "soft" : "primary"}
                  onClick={() => toggleFollow(creatorPreview.id)}
                >
                  {myFollows.includes(creatorPreview.id) ? "Following" : "Follow"}
                </Button>
              )}
              <Link to={`/u/${creatorPreview.id}`} className="flex-1" onClick={() => setCreatorPreview(null)}>
                <Button variant="outline" className="w-full">
                  Full Profile
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Sheet>

      <CreateClipSheet open={creating} onClose={() => setCreating(false)} onCreate={createVideo} meName={me?.username ?? "you"} />
    </div>
  );
}

function RailButton({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button onClick={onClick} aria-label={label} className="tap flex flex-col items-center gap-0.5">
      <span className={cn("grid size-10 place-items-center rounded-full border backdrop-blur transition", active ? "border-blush-400/60 bg-blush-500/25 text-blush-200" : "border-white/20 bg-black/45 text-white/85")}>
        {icon}
      </span>
      {typeof count === "number" && <span className="text-[10px] font-black text-white/85">{compact(count)}</span>}
    </button>
  );
}

function CreateClipSheet({
  open,
  onClose,
  onCreate,
  meName,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; music: string; tone: number; duration: number }) => void;
  meName: string;
}) {
  const [title, setTitle] = useState("");
  const [music, setMusic] = useState(TRACKS[0]);
  const [tone, setTone] = useState(0);
  const [duration, setDuration] = useState(16);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Create a demo clip"
      subtitle={`Publishing as @${meName} · rendered locally, no upload`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              onCreate({ title, music, tone, duration });
              setTitle("");
              onClose();
            }}
          >
            Publish clip
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <ClipArt tone={tone} shape={tone} playing className="h-56 w-full rounded-3xl" />
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} placeholder="the 2am room when the beat drops" />
        </Field>
        <Field label="Sound">
          <select value={music} onChange={(e) => setMusic(e.target.value)} className="w-full rounded-2xl border border-white/12 bg-ink-900/70 px-4 py-3 text-sm outline-none">
            {TRACKS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">Look</p>
          <div className="grid grid-cols-4 gap-2">
            {TONES.map((t) => (
              <button key={t.id} onClick={() => setTone(t.id)} className={cn("tap h-12 rounded-xl border-2", tone === t.id ? "border-white/70" : "border-transparent opacity-70")} style={{ background: t.wash }} />
            ))}
          </div>
        </div>
        <Field label="Length" hint={`${duration}s`}>
          <input type="range" min={8} max={45} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-[#a855f7]" />
        </Field>
        <p className="text-[11px] text-white/35">Version 2 renders a procedural clip from your settings so the reel flow is testable. Real camera upload + encode is a version 3 job.</p>
      </div>
    </Sheet>
  );
}
