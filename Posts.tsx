import { Compass, Flame, Hash, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Composer, PostCard } from "../components/PostCard";
import { Avatar, Button, Card, EmptyState, Reveal, SectionHeader, Segmented, SkeletonList } from "../components/ui";
import { HASHTAGS } from "../lib/content";
import { creatorsYouMayLike, trendingPosts } from "../lib/engine";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { engagement } from "../lib/engine";
import { cn } from "../utils/cn";

type Tab = "feed" | "following" | "trending" | "mine";

export function Posts() {
  const { me, myFollows, userById } = useStore();
  const { ctx, social, ready } = useSocial();
  const [tab, setTab] = useState<Tab>("feed");
  const focus = new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("focus");

  const list = useMemo(() => {
    let items = [...social.posts];
    if (tab === "following") items = items.filter((p) => myFollows.includes(p.authorId) || p.authorId === me?.id);
    if (tab === "mine") items = items.filter((p) => p.authorId === me?.id);
    if (tab === "trending") items = items.sort((a, b) => engagement(b) - engagement(a));
    else items.sort((a, b) => b.createdAt - a.createdAt);
    return items;
  }, [me?.id, myFollows, social.posts, tab]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    social.posts.forEach((p) => counts.set(p.hashtag, (counts.get(p.hashtag) ?? 0) + 1 + p.likes.length / 8));
    HASHTAGS.forEach((h) => !counts.has(h) && counts.set(h, 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [social.posts]);

  const creators = useMemo(() => creatorsYouMayLike(ctx, 4), [ctx]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <Card className="relative overflow-hidden !rounded-[28px] p-5">
          <div className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-blush-500/25 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-vibe-200">Moments</p>
              <h1 className="mt-1.5 font-display text-2xl font-extrabold leading-tight sm:text-[30px]">The community feed</h1>
              <p className="mt-1.5 max-w-lg text-sm text-white/55">
                Text, motion clips and quote cards. Everything renders locally — no uploads, no CDN, nothing leaves
                this browser.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60">
              {social.posts.length} posts · {social.posts.reduce((s, p) => s + p.comments.length, 0)} comments
            </span>
          </div>
        </Card>

        <Composer />

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: "feed", label: "For you" },
            { key: "following", label: `Following (${social.posts.filter((p) => myFollows.includes(p.authorId)).length})` },
            { key: "trending", label: "Trending", icon: <Flame className="size-3.5" /> },
            { key: "mine", label: "My posts" },
          ]}
        />

        {!ready && <SkeletonList rows={3} />}

        {ready && list.length === 0 && (
          <EmptyState
            icon={<Compass className="size-6" />}
            title={tab === "mine" ? "You haven't posted yet" : "This feed is quiet"}
            body={
              tab === "following"
                ? "Follow a few members and their moments land here. Try the suggested creators on the right."
                : "Write the first post above — captions get better when they sound like a text message."
            }
            action={
              <div className="flex gap-2">
                <Link to="/discover?filter=people"><Button variant="outline">Find people</Button></Link>
                {tab === "mine" && <Button onClick={() => window.scrollTo({ top: 120, behavior: "smooth" })}>Write a post</Button>}
              </div>
            }
          />
        )}

        {ready &&
          list.map((post, i) => (
            <Reveal key={post.id} delay={Math.min(i, 5) * 60}>
              <PostCard post={post} focused={focus === post.id} />
            </Reveal>
          ))}
      </div>

      <aside className="space-y-4">
        <Card className="!rounded-3xl p-4">
          <SectionHeader title="Trending tags" subtitle="Tap to search Discover" icon={<Hash className="size-4.5 text-blush-300" />} />
          <div className="flex flex-wrap gap-1.5">
            {tags.map(([tag, weight]) => (
              <Link
                key={tag}
                to={`/discover?q=${encodeURIComponent(tag)}`}
                className="tap rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/70 hover:border-vibe-400/50 hover:text-white"
              >
                {tag}
                <span className="ml-1.5 text-white/35">{Math.round(weight)}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="!rounded-3xl p-4">
          <SectionHeader title="Creators you may like" subtitle="Content-matched, not popularity-matched" icon={<Sparkles className="size-4.5 text-vibe-200" />} />
          <div className="space-y-2">
            {creators.map(({ item, reasons }) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
                <Avatar user={item} size={38} showStatus />
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${item.id}`} className="truncate text-[13px] font-bold hover:underline">@{item.username}</Link>
                  <p className={cn("truncate text-[10.5px] text-white/45")}>{reasons.slice(0, 2).join(" · ")}</p>
                </div>
                <span className="shrink-0 text-[10px] font-black text-white/35">LV {item.level}</span>
              </div>
            ))}
          </div>
          <Link to="/friends" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-vibe-200 hover:text-white">
            <Users className="size-3.5" /> Manage friends
          </Link>
        </Card>

        <Card className="!rounded-3xl p-4">
          <SectionHeader title="Most discussed" subtitle="By comment heat" icon={<Flame className="size-4.5 text-coin-400" />} />
          <div className="space-y-2">
            {trendingPosts(ctx, 3).map(({ post }) => {
              const author = userById(post.authorId);
              return (
                <Link key={post.id} to={`/posts?focus=${post.id}`} className="block rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 transition hover:border-vibe-400/40">
                  <p className="line-clamp-2 text-[12px] leading-snug text-white/75">{post.text}</p>
                  <p className="mt-1 text-[10px] text-white/40">@{author?.username} · {post.comments.length} comments · {post.likes.length} likes</p>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="!rounded-3xl border-amber-400/20 bg-amber-400/[0.05] p-4">
          <p className="text-[11px] leading-relaxed text-amber-100/85">
            Posts are public to this device's demo community. No sexual content, no harassment, no money asks, no
            under-18 participation — the same Community Guidelines apply to every moment, clip and room.
          </p>
          <Link to="/safety" className="mt-2 inline-block text-[11px] font-bold text-amber-100 hover:text-white">
            Read the guidelines →
          </Link>
        </Card>
      </aside>
    </div>
  );
}
