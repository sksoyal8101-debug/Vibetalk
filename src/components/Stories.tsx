import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Heart,
  Image as ImageIcon,
  ImagePlus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ClipArt, StoryRing } from "./art";
import { Avatar, Button, Field, IconButton, Input, Sheet, Spinner } from "./ui";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { TONES } from "../lib/content";
import { storyRings, type StoryRing as Ring } from "../lib/engine";
import { cn } from "../utils/cn";
import { timeAgo } from "../lib/utils";
import type { Story } from "../lib/types";
import { getStoryBlob } from "../lib/storage";

const STORY_MS = 5200;

export function timeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function formatSecs(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? "0" : ""}${rem}`;
}

/**
 * Client-side image compressor: scales high-resolution photos to max 720x1280 (vertical story)
 * and exports as 78% quality JPEG Blob. Never stores base64 strings in localStorage.
 */
export async function compressImageToBlob(
  fileOrBlob: Blob,
  maxWidth = 720,
  maxHeight = 1280,
  quality = 0.78
): Promise<Blob> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(fileOrBlob);
        return;
      }
      ctx.fillStyle = "#0c0714";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else resolve(fileOrBlob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(fileOrBlob);
    };
    img.src = objectUrl;
  });
}

/**
 * Procedural sample photo generator: creates a sharp Blob on canvas.
 */
function generatePresetBlob(name: "sunset" | "studio" | "neon" | "cafe"): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(new Blob());
      return;
    }

    const grad = ctx.createLinearGradient(0, 0, 720, 1280);
    if (name === "sunset") {
      grad.addColorStop(0, "#4a044e");
      grad.addColorStop(0.35, "#831843");
      grad.addColorStop(0.65, "#f43f5e");
      grad.addColorStop(0.85, "#fb923c");
      grad.addColorStop(1, "#fde047");
    } else if (name === "studio") {
      grad.addColorStop(0, "#09090b");
      grad.addColorStop(0.4, "#2e1065");
      grad.addColorStop(0.7, "#581c87");
      grad.addColorStop(1, "#030712");
    } else if (name === "neon") {
      grad.addColorStop(0, "#082f49");
      grad.addColorStop(0.35, "#0284c7");
      grad.addColorStop(0.75, "#9333ea");
      grad.addColorStop(1, "#c026d3");
    } else {
      grad.addColorStop(0, "#1c1917");
      grad.addColorStop(0.4, "#44403c");
      grad.addColorStop(0.7, "#78350f");
      grad.addColorStop(1, "#1c1917");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(360, 480, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(360, 480, 160, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 28; i++) {
      const h = Math.sin(i * 0.4) * 80 + 90;
      ctx.fillRect(80 + i * 20, 940 - h / 2, 12, h);
    }

    ctx.font = "bold 46px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    const titles = {
      sunset: "Golden Hour Vibes 🌇",
      studio: "Late Night Studio 🎧",
      neon: "Cyber Midnight 🌌",
      cafe: "Coffee & Lo-Fi ☕",
    };
    ctx.fillText(titles[name] || "VibeTalk Story", 360, 490);

    ctx.font = "24px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("VibeTalk 18+ Live Social", 360, 550);

    canvas.toBlob((b) => resolve(b || new Blob()), "image/jpeg", 0.85);
  });
}

/**
 * Procedural sample video generator: records an animated WebM video Blob on canvas.
 * Enables instant 1-tap testing of the video story pipeline without needing local files.
 */
function generateSampleVideoBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 854;
      const ctx = canvas.getContext("2d");
      if (!ctx || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
        generatePresetBlob("studio").then(resolve);
        return;
      }
      const stream = canvas.captureStream(25);
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      } catch {
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          generatePresetBlob("studio").then(resolve);
          return;
        }
      }
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: "video/webm" }));
      };
      recorder.start();

      let frame = 0;
      const draw = () => {
        frame++;
        const grad = ctx.createLinearGradient(0, 0, 480, 854);
        grad.addColorStop(0, "#180f28");
        grad.addColorStop(0.5, "#7c3aed");
        grad.addColorStop(1, "#ec4899");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 480, 854);

        const r = 80 + Math.sin(frame * 0.15) * 30;
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(240, 427, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#34d399";
        for (let i = 0; i < 20; i++) {
          const h = 20 + Math.abs(Math.sin((frame + i * 4) * 0.2)) * 80;
          ctx.fillRect(80 + i * 16, 680 - h, 10, h);
        }

        ctx.font = "bold 28px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("VibeTalk Video Story 🎬", 240, 360);
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("Animated Test Clip (WebM)", 240, 400);

        if (frame < 55) {
          requestAnimationFrame(draw);
        } else {
          recorder.stop();
        }
      };
      draw();
    } catch {
      generatePresetBlob("studio").then(resolve);
    }
  });
}

/**
 * Hook to retrieve media from IndexedDB and manage Object URL lifecycle.
 * Creates an Object URL only when needed and guarantees revocation on unmount or story change.
 */
export function useStoryMediaUrl(story?: Story | null): {
  url: string | null;
  loading: boolean;
  error: boolean;
} {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!story) {
      setUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

    // If story has no mediaKey, fallback to static/preset mediaUrl
    if (!story.mediaKey) {
      setUrl(story.mediaUrl || null);
      setLoading(false);
      setError(!story.mediaUrl && (story.kind === "image" || story.kind === "video"));
      return;
    }

    let isCancelled = false;
    let localCreatedUrl: string | null = null;
    setLoading(true);
    setError(false);

    getStoryBlob(story.mediaKey)
      .then((blob) => {
        if (isCancelled) return;
        if (blob) {
          localCreatedUrl = URL.createObjectURL(blob);
          setUrl(localCreatedUrl);
          setLoading(false);
        } else if (story.mediaUrl) {
          setUrl(story.mediaUrl);
          setLoading(false);
        } else {
          setUrl(null);
          setLoading(false);
          setError(true);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn("Failed to retrieve story blob from IndexedDB:", err);
        setUrl(story.mediaUrl || null);
        setLoading(false);
        setError(!story.mediaUrl);
      });

    return () => {
      isCancelled = true;
      if (localCreatedUrl) {
        URL.revokeObjectURL(localCreatedUrl);
      }
    };
  }, [story?.id, story?.mediaKey, story?.mediaUrl, story?.kind]);

  return { url, loading, error };
}

/* ------------------------------ Stories Rail ------------------------------ */

export function StoriesRail({ onOpen }: { onOpen?: (ring: Ring) => void }) {
  const { ctx, social } = useSocial();
  const { me } = useStore();
  const [viewer, setViewer] = useState<Ring | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const rings = useMemo(() => storyRings(ctx), [ctx]);

  const myRing = useMemo(() => {
    const fromRings = rings.find((r) => r.user.id === me?.id);
    if (fromRings) return fromRings;
    if (!me) return undefined;
    const now = Date.now();
    const myStories = social.stories.filter((s) => s.authorId === me.id && s.expiresAt > now);
    if (myStories.length === 0) return undefined;
    return {
      user: me,
      stories: myStories.sort((a, b) => a.createdAt - b.createdAt),
      unseen: myStories.filter((s) => !s.views.includes(me.id)).length,
    };
  }, [rings, me, social.stories]);

  const otherRings = useMemo(() => rings.filter((r) => r.user.id !== me?.id), [rings, me?.id]);
  const allRings = useMemo(() => (myRing ? [myRing, ...otherRings] : otherRings), [myRing, otherRings]);
  const hasMyStories = (myRing?.stories.length ?? 0) > 0;

  const handleRailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
    setAdding(true);
  };

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {/* Your Story circle */}
        <div className="flex w-[74px] shrink-0 flex-col items-center gap-1.5">
          <div className="relative">
            {hasMyStories && myRing ? (
              <button
                onClick={() => (onOpen ? onOpen(myRing) : setViewer(myRing))}
                className="tap flex flex-col items-center"
                aria-label="View your active stories"
              >
                <StoryRing seen={myRing.unseen === 0} vip={social.vip.plan} size={68}>
                  <Avatar user={me} size={54} showFrame={false} />
                </StoryRing>
              </button>
            ) : (
              /* Native <label> trigger without programmatic .click() */
              <label
                htmlFor="stories-rail-file-input"
                className="tap group grid size-[68px] place-items-center rounded-full border border-dashed border-white/25 bg-white/[0.03] text-white/55 transition hover:border-vibe-400/70 hover:text-white cursor-pointer"
                title="Add photo or video to your story"
                aria-label="Add story"
              >
                {me ? <Avatar user={me} size={52} showFrame={false} /> : <Plus className="size-5" />}
                <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full vibe-gradient text-white shadow-md ring-2 ring-ink-950">
                  <Plus className="size-3.5 stroke-[2.8]" />
                </span>
                <input
                  id="stories-rail-file-input"
                  type="file"
                  accept="image/*,video/*,video/mp4,video/webm,video/ogg,video/quicktime,video/3gpp,video/x-m4v"
                  className="sr-only"
                  onChange={handleRailFileChange}
                />
              </label>
            )}

            {/* Always accessible + button to add another story */}
            <label
              htmlFor="stories-rail-plus-input"
              title="Add another story"
              aria-label="Add new story"
              className="tap absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full vibe-gradient text-white shadow-md ring-2 ring-ink-950 transition hover:scale-110 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="size-3.5 stroke-[2.8]" />
              <input
                id="stories-rail-plus-input"
                type="file"
                accept="image/*,video/*,video/mp4,video/webm,video/ogg,video/quicktime,video/3gpp,video/x-m4v"
                className="sr-only"
                onChange={handleRailFileChange}
              />
            </label>
          </div>

          <span className="w-full truncate text-center text-[10px] font-bold">
            {hasMyStories ? "Your story" : "Add story"}
          </span>
          {hasMyStories && myRing && (
            <span className="text-[9px] text-vibe-300 font-bold -mt-1">
              {myRing.stories.length} active
            </span>
          )}
        </div>

        {/* Other users' story rings */}
        {otherRings.map((ring) => (
          <button
            key={ring.user.id}
            onClick={() => (onOpen ? onOpen(ring) : setViewer(ring))}
            className="tap group flex w-[74px] shrink-0 flex-col items-center gap-1.5"
          >
            <StoryRing seen={ring.unseen === 0} vip={social.vip.plan} size={68}>
              <Avatar user={ring.user} size={54} showFrame={false} />
            </StoryRing>
            <span className="w-full truncate text-center text-[10px] font-bold">@{ring.user.username}</span>
            <span className="text-[9px] text-white/35">
              {ring.unseen > 0 ? `${ring.unseen} new` : `viewed · ${ring.stories.length}`}
            </span>
          </button>
        ))}
      </div>

      {viewer && (
        <StoryViewer
          rings={allRings}
          initial={viewer}
          onClose={() => setViewer(null)}
          onAdd={() => setAdding(true)}
        />
      )}

      <AddStorySheet
        open={adding}
        onClose={() => {
          setAdding(false);
          setPendingFile(null);
        }}
        initialFile={pendingFile}
        mine={myRing?.stories ?? []}
      />
    </>
  );
}

/* --------------------------- Add Story Upload Sheet --------------------------- */

export function AddStorySheet({
  open,
  onClose,
  initialFile,
  mine,
}: {
  open: boolean;
  onClose: () => void;
  initialFile?: File | null;
  mine: Story[];
}) {
  const { addStory, deleteStory } = useSocial();

  const [selectedMedia, setSelectedMedia] = useState<{
    blob: Blob;
    url: string;
    type: "image" | "video";
    duration?: number;
    name?: string;
  } | null>(null);

  const [caption, setCaption] = useState("");
  const [tone, setTone] = useState(0);
  const [sticker, setSticker] = useState("✨");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewTime, setPreviewTime] = useState(0);

  const objectUrlRef = useRef<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Revoke temporary preview URL when sheet closes or media changes
  const cleanupCurrentUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupCurrentUrl();
    };
  }, [cleanupCurrentUrl]);

  // Synchronous Object URL creation for instant 0ms preview
  const processMediaFile = useCallback(
    (file: File) => {
      setError(null);
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg|ogv|mkv|3gp|avi)$/i.test(file.name);
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg|heic|heif)$/i.test(file.name);

      if (!isImage && !isVideo) {
        setError("Please select a supported image (JPG, PNG, WebP) or video (MP4, WebM, MOV).");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError(`File is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max supported size is 50MB.`);
        return;
      }

      cleanupCurrentUrl();

      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;

      if (isImage) {
        setSelectedMedia({
          blob: file,
          url: objectUrl,
          type: "image",
          name: file.name,
        });
      } else {
        setSelectedMedia({
          blob: file,
          url: objectUrl,
          type: "video",
          duration: 15,
          name: file.name,
        });
        setPreviewPlaying(true);
        setPreviewTime(0);
      }
    },
    [cleanupCurrentUrl]
  );

  useEffect(() => {
    if (open && initialFile) {
      processMediaFile(initialFile);
    }
  }, [open, initialFile, processMediaFile]);

  useEffect(() => {
    if (!open) {
      cleanupCurrentUrl();
      setSelectedMedia(null);
      setCaption("");
      setError(null);
      setIsPublishing(false);
      setPreviewPlaying(true);
      setPreviewTime(0);
    }
  }, [open, cleanupCurrentUrl]);

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    processMediaFile(file);
  };

  const handleSelectPhotoPreset = async (presetKey: "sunset" | "studio" | "neon" | "cafe") => {
    setError(null);
    try {
      const blob = await generatePresetBlob(presetKey);
      cleanupCurrentUrl();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setSelectedMedia({
        blob,
        url: objectUrl,
        type: "image",
        name: `Photo: ${presetKey}`,
      });
    } catch {
      setError("Could not generate preset photo.");
    }
  };

  const handleSelectVideoPreset = async () => {
    setError(null);
    try {
      const blob = await generateSampleVideoBlob();
      cleanupCurrentUrl();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setSelectedMedia({
        blob,
        url: objectUrl,
        type: "video",
        duration: 3,
        name: "Sample Video (WebM)",
      });
      setPreviewPlaying(true);
      setPreviewTime(0);
    } catch {
      setError("Could not generate sample video clip.");
    }
  };

  const togglePreviewPlay = () => {
    const v = previewVideoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPreviewPlaying(true);
    } else {
      v.pause();
      setPreviewPlaying(false);
    }
  };

  // Atomic publish flow: persists blob to IndexedDB first
  const handlePublish = async () => {
    if (isPublishing) return;
    setError(null);
    setIsPublishing(true);

    try {
      let finalBlob: Blob | undefined = selectedMedia?.blob;
      const mediaType = selectedMedia?.type;

      if (selectedMedia?.type === "image" && selectedMedia.blob) {
        try {
          finalBlob = await compressImageToBlob(selectedMedia.blob);
        } catch {
          finalBlob = selectedMedia.blob;
        }
      }

      // We do NOT pass selectedMedia.url as mediaUrl because it's a temporary modal preview URL!
      const res = await addStory({
        caption: caption.trim(),
        tone,
        kind: mediaType || "gradient",
        mediaBlob: finalBlob,
        mediaType,
        duration: selectedMedia?.duration,
        sticker,
      });

      if (res && !res.ok) {
        throw new Error(res.message || "Failed to publish story.");
      }

      cleanupCurrentUrl();
      setSelectedMedia(null);
      setCaption("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error publishing story. Please try again.";
      setError(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add to Your Story"
      subtitle="Share a photo or video · active for 24 hours"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPublishing}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing || (!selectedMedia && !caption.trim())}>
            {isPublishing ? (
              <span className="flex items-center gap-2">
                <Spinner className="size-4" /> Publishing…
              </span>
            ) : (
              "Publish Story"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Error notification banner */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-300" />
            <div className="flex-1">
              <p className="font-bold">Notice</p>
              <p className="text-white/80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="tap text-white/50 hover:text-white" aria-label="Dismiss error">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* PREVIEW CONTAINER OR SELECTION AREA */}
        {selectedMedia ? (
          <div className="space-y-3">
            <div
              className="relative aspect-[9/13] w-full max-h-[360px] mx-auto overflow-hidden rounded-3xl border border-white/15 bg-black shadow-lg select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              {selectedMedia.type === "video" ? (
                <>
                  <video
                    ref={(el) => {
                      previewVideoRef.current = el;
                      if (el) {
                        el.muted = previewMuted;
                        el.defaultMuted = previewMuted;
                      }
                    }}
                    src={selectedMedia.url}
                    playsInline
                    autoPlay
                    loop
                    controls={false}
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onContextMenu={(e) => e.preventDefault()}
                    onLoadedMetadata={(e) => {
                      const d = e.currentTarget.duration;
                      if (d && !Number.isNaN(d) && d > 0) {
                        const durationSec = Math.min(60, Math.max(1, Math.round(d)));
                        setSelectedMedia((prev) => (prev ? { ...prev, duration: durationSec } : prev));
                      }
                    }}
                    onTimeUpdate={(e) => {
                      setPreviewTime(e.currentTarget.currentTime || 0);
                    }}
                    onClick={togglePreviewPlay}
                    className="absolute inset-0 size-full object-contain bg-black cursor-pointer"
                  />

                  {/* Top bar controls */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMuted((m) => {
                          const next = !m;
                          if (previewVideoRef.current) previewVideoRef.current.muted = next;
                          return next;
                        });
                      }}
                      className="tap grid size-8 place-items-center rounded-full bg-black/60 text-white/90 backdrop-blur hover:bg-black/80"
                      aria-label={previewMuted ? "Unmute preview" : "Mute preview"}
                    >
                      {previewMuted ? <VolumeX className="size-3.5 text-rose-300" /> : <Volume2 className="size-3.5 text-mint-300" />}
                    </button>
                  </div>

                  <span className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur">
                    <Film className="size-2.5 text-sky-300" /> Video
                  </span>

                  {/* Play/pause center overlay button if paused */}
                  {!previewPlaying && (
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="tap absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 grid size-12 place-items-center rounded-full bg-black/60 text-white backdrop-blur shadow-lg"
                      aria-label="Play preview"
                    >
                      <Play className="size-6 fill-current ml-0.5" />
                    </button>
                  )}

                  {/* Video mini progress indicator */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[10px] text-white/70 font-mono">
                    <div className="flex items-center gap-2 flex-1 mr-3">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="tap text-white/85 hover:text-white"
                        aria-label={previewPlaying ? "Pause preview" : "Play preview"}
                      >
                        {previewPlaying ? <Pause className="size-3" /> : <Play className="size-3 fill-current" />}
                      </button>
                      <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-vibe-300 transition-all duration-150"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((previewTime / Math.max(1, selectedMedia.duration || 15)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span>
                      {formatSecs(previewTime)} / {formatSecs(selectedMedia.duration || 15)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <img src={selectedMedia.url} alt="" aria-hidden className="absolute inset-0 size-full object-cover blur-2xl opacity-35 scale-110" />
                  <img src={selectedMedia.url} alt="Story preview" className="absolute inset-0 size-full object-contain relative z-[1]" />
                  <span className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur">
                    <ImageIcon className="size-2.5 text-vibe-300" /> Photo
                  </span>
                </>
              )}

              {/* Overlay sticker */}
              {sticker && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-5xl drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)] pointer-events-none select-none">
                  {sticker}
                </div>
              )}

              {/* Overlay caption preview */}
              {caption.trim() && (
                <div className="absolute inset-x-0 bottom-6 z-10 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                  <p className="font-display text-sm font-bold text-white text-center drop-shadow-md">{caption.trim()}</p>
                </div>
              )}
            </div>

            {/* Replace / Remove buttons */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <label
                htmlFor="sheet-replace-file-input"
                className="tap inline-flex items-center justify-center gap-2 font-semibold rounded-full select-none text-xs px-3.5 py-2 border border-white/15 text-vibe-50 hover:border-vibe-400/70 hover:bg-white/5 cursor-pointer"
              >
                <RefreshCw className="size-3.5" /> Replace Media
                <input
                  id="sheet-replace-file-input"
                  type="file"
                  accept="image/*,video/*,video/mp4,video/webm,video/ogg,video/quicktime"
                  className="sr-only"
                  onChange={handleNativeFileChange}
                  disabled={isPublishing}
                />
              </label>

              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 className="size-3.5 text-rose-300" />}
                onClick={() => {
                  cleanupCurrentUrl();
                  setSelectedMedia(null);
                }}
                disabled={isPublishing}
                className="text-rose-200 hover:text-rose-100 hover:bg-rose-500/20"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          /* NO MEDIA SELECTED YET: Native file input dropzone + quick presets */
          <div className="space-y-4">
            <label
              htmlFor="sheet-main-dropzone-input"
              className="group relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.02] p-6 text-center cursor-pointer transition hover:border-vibe-400/80 hover:bg-vibe-600/10"
            >
              <input
                id="sheet-main-dropzone-input"
                type="file"
                accept="image/*,video/*,video/mp4,video/webm,video/ogg,video/quicktime"
                className="sr-only"
                onChange={handleNativeFileChange}
              />
              <div className="grid size-14 place-items-center rounded-2xl vibe-gradient text-white shadow-lg transition group-hover:scale-110">
                <ImagePlus className="size-7" />
              </div>
              <div>
                <p className="font-display text-base font-extrabold text-white">Choose Photo or Video from Device</p>
                <p className="mt-1 text-xs text-white/50 max-w-xs mx-auto">
                  Select any image (JPG, PNG, WebP) or video clip (MP4, WebM, MOV) from your device.
                </p>
              </div>
              <span className="tap inline-flex items-center justify-center gap-2 font-semibold rounded-full select-none text-xs px-3.5 py-2 bg-white/8 text-white hover:bg-white/14 border border-white/10 mt-1">
                <UploadCloud className="size-3.5" /> Browse Device Files
              </span>
            </label>

            {/* Quick Sample Presets (photos & sample video) for instant testing */}
            <div>
              <p className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                <span>Or pick 1-tap test media</span>
                <span className="text-[10px] text-vibe-300 font-normal lowercase">photo &amp; video presets</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: "sunset", label: "Sunset", emoji: "🌇" },
                  { id: "studio", label: "Studio", emoji: "🎧" },
                  { id: "neon", label: "Neon", emoji: "🌌" },
                  { id: "cafe", label: "Cafe", emoji: "☕" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPhotoPreset(p.id as "sunset" | "studio" | "neon" | "cafe")}
                    className="tap flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-left transition hover:border-vibe-400/60 hover:bg-white/[0.08]"
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span className="truncate text-[11px] font-bold text-white/85">{p.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleSelectVideoPreset}
                  className="tap flex items-center gap-1.5 rounded-2xl border border-sky-400/30 bg-sky-500/[0.1] p-2 text-left transition hover:border-sky-400/70 hover:bg-sky-500/[0.18]"
                >
                  <span className="text-lg">🎬</span>
                  <span className="truncate text-[11px] font-bold text-sky-200">Video</span>
                </button>
              </div>
            </div>

            {/* Gradient backdrop fallback */}
            <div className="pt-1">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Or generate gradient backdrop</p>
              <div className="grid grid-cols-4 gap-2">
                {TONES.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={cn(
                      "tap h-11 rounded-2xl border-2 text-[9px] font-bold transition",
                      tone === t.id ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    style={{ background: t.wash }}
                  >
                    <span className="block truncate px-1 text-white/90">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Caption Field */}
        <Field label="Caption" hint="optional">
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Add text to your story…" />
        </Field>

        {/* Sticker Picker */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Add a Sticker Overlay</p>
          <div className="flex flex-wrap gap-1.5">
            {["✨", "🎧", "🌙", "🔥", "🎤", "🍵", "💜", "🎉", "💯", "👑"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSticker(sticker === s ? "" : s)}
                className={cn(
                  "tap grid size-9 place-items-center rounded-2xl border text-lg transition",
                  sticker === s ? "border-vibe-400/80 bg-vibe-600/30 shadow-md scale-105" : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
                aria-label={`Sticker ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Active stories list */}
        {mine.length > 0 && (
          <div className="border-t border-white/8 pt-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              Your active stories ({mine.length})
            </p>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {mine.map((s) => (
                <StoryItemRow key={s.id} story={s} onDelete={() => deleteStory(s.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function StoryItemRow({ story, onDelete }: { story: Story; onDelete: () => void }) {
  const { url } = useStoryMediaUrl(story);
  const isVid = story.mediaType === "video" || story.kind === "video";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
      <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-black border border-white/10 relative">
        {url ? (
          isVid ? (
            <video src={url} className="size-full object-cover" muted />
          ) : (
            <img src={url} alt="" className="size-full object-cover" />
          )
        ) : (
          <ClipArt tone={story.tone} shape={story.tone} className="size-full" overlay={false} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-white">{story.caption || (isVid ? "Video story" : "Photo story")}</p>
        <p className="text-[10px] text-white/45">{story.views.length} views · {timeLeft(story.expiresAt)}</p>
      </div>
      <IconButton label="Delete story" onClick={onDelete} className="size-8 text-rose-300 hover:bg-rose-500/20">
        <Trash2 className="size-3.5" />
      </IconButton>
    </div>
  );
}

/* ------------------------------- Story Viewer ------------------------------ */

export function StoryViewer({
  rings,
  initial,
  onClose,
  onAdd,
  initialStoryId,
}: {
  rings: Ring[];
  initial: Ring;
  onClose: () => void;
  onAdd?: () => void;
  initialStoryId?: string;
}) {
  const { me, pushToast } = useStore();
  const { viewStory, toggleLikeStory, deleteStory } = useSocial();
  const [ringIdx, setRingIdx] = useState(() =>
    Math.max(0, rings.findIndex((r) => r.user.id === initial.user.id))
  );
  const [idx, setIdx] = useState(() => {
    if (initialStoryId && initial.stories.length > 0) {
      const found = initial.stories.findIndex((s) => s.id === initialStoryId);
      if (found >= 0) return found;
    }
    return 0;
  });
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [reply, setReply] = useState("");
  const timer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ring = rings[ringIdx];
  const story = ring?.stories[Math.min(idx, Math.max(0, (ring?.stories.length ?? 1) - 1))];

  // Resolve media URL from IndexedDB or cache using dedicated hook
  const { url: mediaUrl, loading: mediaLoading } = useStoryMediaUrl(story);

  // Mark viewed in store
  useEffect(() => {
    if (story && me && !story.views.includes(me.id)) {
      viewStory(story.id);
    }
  }, [me, story, viewStory]);

  // Reset errors and progress when story changes
  useEffect(() => {
    setImageError(false);
    setVideoError(false);
    setVideoProgress(0);
    setVideoCurrentTime(0);
    setVideoDuration(0);
  }, [story?.id, mediaUrl]);

  const isVideo = story && (story.mediaType === "video" || story.kind === "video");

  const next = useCallback(() => {
    if (!ring) return;
    setVideoProgress(0);
    if (idx + 1 < ring.stories.length) {
      setIdx((i) => i + 1);
      return;
    }
    if (ringIdx + 1 < rings.length) {
      setRingIdx((r) => r + 1);
      setIdx(0);
      return;
    }
    onClose();
  }, [idx, onClose, ring, ringIdx, rings.length]);

  const prev = useCallback(() => {
    setVideoProgress(0);
    if (idx > 0) {
      setIdx((i) => i - 1);
      return;
    }
    if (ringIdx > 0) {
      const target = rings[ringIdx - 1];
      setRingIdx((r) => r - 1);
      setIdx(Math.max(0, target.stories.length - 1));
    }
  }, [idx, ringIdx, rings]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
      if (e.key === " " && isVideo) {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, onClose, isVideo]);

  // Auto-advance timer for images & gradient stories
  useEffect(() => {
    if (paused || !story || isVideo) return;
    timer.current = window.setTimeout(() => next(), STORY_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [paused, story?.id, idx, ringIdx, isVideo, next]);

  // Video fallback timer so stalled video never freezes the viewer
  useEffect(() => {
    if (paused || !story || !isVideo) return;
    const sec = (videoDuration > 0 ? videoDuration : (story.duration || 15)) * 1000 + 2000;
    const fallbackTimer = window.setTimeout(() => next(), sec);
    return () => window.clearTimeout(fallbackTimer);
  }, [paused, story?.id, isVideo, videoDuration, next]);

  // VIDEO STORY PLAYBACK - Step-by-step compliant with requirements
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo || !mediaUrl) return;

    v.muted = isMuted;
    v.defaultMuted = isMuted;
    v.src = mediaUrl;
    v.load();

    let isCancelled = false;

    const playWhenReady = () => {
      if (isCancelled || paused) return;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy fallback: mute and retry
          if (!v.muted) {
            v.muted = true;
            setIsMuted(true);
            v.play().catch(() => {
              // Ignore play interruption errors
            });
          }
        });
      }
    };

    v.oncanplay = () => {
      playWhenReady();
    };

    if (v.readyState >= 2) {
      playWhenReady();
    }

    return () => {
      isCancelled = true;
      v.oncanplay = null;
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
  }, [mediaUrl, isVideo, story?.id, paused]);

  // Sync mute state changes to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Pause / resume video on hold or state change
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    if (paused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [paused, isVideo]);

  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPaused((p) => !p);
  };

  if (!ring || !story) return null;

  const isMine = me?.id === story.authorId;
  const liked = me ? story.likes.includes(me.id) : false;

  return (
    <div
      className="fixed inset-0 z-[92] flex items-center justify-center bg-black/95 select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: "none", userSelect: "none" }}
    >
      <div
        className="relative h-full w-full max-w-[440px] overflow-hidden sm:h-[92dvh] sm:rounded-[32px] bg-black shadow-2xl flex flex-col justify-between"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* STORY MEDIA LAYER */}
        {mediaLoading ? (
          <div className="absolute inset-0 size-full bg-black flex flex-col items-center justify-center gap-2">
            <Spinner className="size-8 text-vibe-300" />
            <p className="text-xs text-white/50">Loading story media…</p>
          </div>
        ) : mediaUrl ? (
          isVideo ? (
            <div
              className="absolute inset-0 size-full bg-black flex items-center justify-center"
              onContextMenu={(e) => e.preventDefault()}
            >
              {videoError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                  <AlertCircle className="size-10 text-rose-300 mb-2" />
                  <p className="font-display text-sm font-bold text-white">Video format not playable</p>
                  <p className="text-xs text-white/50 mt-1 mb-3">Codec not supported by this browser engine.</p>
                  <Button size="sm" variant="outline" onClick={next}>Skip to next</Button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  controls={false}
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  onContextMenu={(e) => e.preventDefault()}
                  className="absolute inset-0 size-full object-contain bg-black"
                  onLoadedMetadata={(e) => {
                    if (e.currentTarget.duration) {
                      setVideoDuration(e.currentTarget.duration);
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (v.duration && !Number.isNaN(v.duration) && v.duration > 0) {
                      setVideoProgress(v.currentTime / v.duration);
                      setVideoCurrentTime(v.currentTime);
                      setVideoDuration(v.duration);
                    }
                  }}
                  onEnded={next}
                  onError={() => setVideoError(true)}
                />
              )}
            </div>
          ) : (
            <div
              className="absolute inset-0 size-full bg-black overflow-hidden flex items-center justify-center"
              onContextMenu={(e) => e.preventDefault()}
            >
              {imageError ? (
                <ClipArt tone={story.tone} shape={story.tone} playing={!paused} className="absolute inset-0 size-full" />
              ) : (
                <>
                  <img
                    src={mediaUrl}
                    alt=""
                    aria-hidden
                    onContextMenu={(e) => e.preventDefault()}
                    className="absolute inset-0 size-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                  />
                  <img
                    src={mediaUrl}
                    alt={story.caption || "Story"}
                    onContextMenu={(e) => e.preventDefault()}
                    className="absolute inset-0 size-full object-contain relative z-[1] pointer-events-none"
                    onError={() => setImageError(true)}
                  />
                </>
              )}
            </div>
          )
        ) : (
          <ClipArt
            tone={story.tone}
            shape={story.tone}
            playing={!paused}
            className="absolute inset-0 size-full"
          />
        )}

        {/* TOP SEGMENT PROGRESS BARS */}
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-3 pt-3.5">
          {ring.stories.map((s, i) => {
            let width = "0%";
            if (i < idx) {
              width = "100%";
            } else if (i === idx) {
              width = isVideo
                ? `${Math.min(100, Math.round(videoProgress * 100))}%`
                : paused
                ? "45%"
                : "100%";
            }
            return (
              <span
                key={s.id}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25 backdrop-blur"
              >
                <span
                  className={cn(
                    "block h-full rounded-full bg-white",
                    !isVideo && i === idx && !paused && "transition-[width] duration-[5000ms] ease-linear",
                    isVideo && i === idx && "transition-[width] duration-150 ease-out"
                  )}
                  style={{ width }}
                />
              </span>
            );
          })}
        </div>

        {/* STORY HEADER */}
        <div className="relative z-20 flex items-center gap-3 p-3 pt-7">
          <Link
            to={`/u/${ring.user.id}`}
            onClick={onClose}
            className="tap flex min-w-0 flex-1 items-center gap-2.5"
          >
            <Avatar user={ring.user} size={38} showFrame={false} />
            <div className="min-w-0 text-left">
              <span className="block truncate text-sm font-extrabold text-white drop-shadow-md">
                @{ring.user.username}
              </span>
              <span className="block text-[10px] text-white/75 drop-shadow">
                {timeAgo(story.createdAt)} ago · {story.views.length} views
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Play/Pause toggle control for video */}
            {isVideo && (
              <button
                onClick={togglePlayPause}
                className="tap grid size-9 place-items-center rounded-full bg-black/50 text-white/90 backdrop-blur hover:bg-black/75 transition"
                aria-label={paused ? "Play video" : "Pause video"}
                title={paused ? "Play" : "Pause"}
              >
                {paused ? <Play className="size-4 fill-current ml-0.5" /> : <Pause className="size-4" />}
              </button>
            )}

            {/* Audio toggle for video stories */}
            {isVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((m) => {
                    const next = !m;
                    if (videoRef.current) {
                      videoRef.current.muted = next;
                    }
                    return next;
                  });
                }}
                className="tap grid size-9 place-items-center rounded-full bg-black/50 text-white/90 backdrop-blur hover:bg-black/75 transition"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="size-4 text-rose-300" /> : <Volume2 className="size-4 text-mint-300" />}
              </button>
            )}

            {/* Delete own story button */}
            {isMine && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStory(story.id);
                  next();
                }}
                title="Delete this story"
                aria-label="Delete this story"
                className="tap grid size-9 place-items-center rounded-full bg-black/50 text-rose-300 backdrop-blur hover:bg-rose-500/25 transition"
              >
                <Trash2 className="size-4" />
              </button>
            )}

            {/* Close button */}
            <IconButton
              label="Close story"
              onClick={onClose}
              className="size-9 bg-black/50 text-white hover:bg-black/75"
            >
              <X className="size-4" />
            </IconButton>
          </div>
        </div>

        {/* TAP NAVIGATION ZONES */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous story"
          className="absolute left-0 top-16 z-10 grid h-[68%] w-1/4 place-items-start px-2 text-white/40 hover:text-white transition"
        >
          <ChevronLeft className="size-7 drop-shadow" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next story"
          className="absolute right-0 top-16 z-10 grid h-[68%] w-1/4 place-items-end px-2 text-white/40 hover:text-white transition"
        >
          <ChevronRight className="size-7 drop-shadow" />
        </button>

        {/* BOTTOM STORY OVERLAYS & ACTIONS */}
        <div className="relative z-20 space-y-3 p-4 pb-[max(18px,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          {/* Video time progress indicator */}
          {isVideo && (
            <div className="flex items-center justify-between text-[11px] font-mono text-white/70 px-1">
              <span className="flex items-center gap-1.5">
                <Film className="size-3 text-sky-300" />
                <span>{formatSecs(videoCurrentTime)} / {formatSecs(videoDuration || story.duration || 15)}</span>
              </span>
              <span className="text-[10px] text-white/45">
                {paused ? "Paused" : "Playing"}
              </span>
            </div>
          )}

          {story.sticker && (
            <div className="text-5xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)] pointer-events-none">
              {story.sticker}
            </div>
          )}

          {story.caption && (
            <p className="font-display text-base font-bold leading-snug text-white drop-shadow-md">
              {story.caption}
            </p>
          )}

          <div className="flex items-center gap-2">
            {!isMine ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!reply.trim()) return;
                    pushToast(`Reply sent to @${ring.user.username}!`, "ok");
                    setReply("");
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/25 bg-black/50 px-3.5 py-2 backdrop-blur"
                >
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Reply to @${ring.user.username}…`}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                  />
                  <button
                    type="submit"
                    aria-label="Send reply"
                    className="tap text-white/75 hover:text-white"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLikeStory(story.id);
                  }}
                  className={cn(
                    "tap grid size-10 shrink-0 place-items-center rounded-full border backdrop-blur transition",
                    liked
                      ? "border-blush-400/60 bg-blush-500/30 text-blush-200"
                      : "border-white/25 bg-black/50 text-white/80"
                  )}
                  aria-label="Like story"
                >
                  <Heart className={cn("size-4.5", liked && "fill-current")} />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-white/70 font-semibold flex items-center gap-1.5">
                  <Clock className="size-3.5 text-vibe-300" />
                  {timeLeft(story.expiresAt)}
                </span>
                {onAdd && (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      onClose();
                      onAdd();
                    }}
                    icon={<Plus className="size-3.5" />}
                  >
                    Add another story
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
