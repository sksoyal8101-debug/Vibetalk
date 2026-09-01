import { Check, Heart, MessageCircle, Send, UserMinus, UserPlus, UserRoundX } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui";
import { useSocial } from "../store/SocialProvider";
import { useStore } from "../store/StoreProvider";
import { cn } from "../utils/cn";

export function FriendActions({ userId, size = "sm", withMessage = true }: { userId: string; size?: "sm" | "md"; withMessage?: boolean }) {
  const { me, myFollows, toggleFollow, pushToast, userById } = useStore();
  const { social, friendState, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, removeFriend } = useSocial();
  if (!me || me.id === userId) return null;

  const state = friendState(userId);
  const following = myFollows.includes(userId);
  const user = userById(userId);
  const linkId =
    social.friends.find((f) => (f.fromId === me.id && f.toId === userId) || (f.fromId === userId && f.toId === me.id))?.id ?? "";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        size={size}
        variant={state === "friends" ? "soft" : "primary"}
        icon={state === "friends" ? <Check className="size-3.5" /> : <UserPlus className="size-3.5" />}
        disabled={state === "blocked"}
        onClick={() => {
          if (state === "none") {
            const res = sendFriendRequest(userId);
            if (!res.ok) pushToast(res.message ?? "Couldn't send that request.", "err");
            return;
          }
          if (state === "pending_out") {
            if (linkId) cancelFriendRequest(linkId);
            return;
          }
          if (state === "pending_in") {
            if (linkId) acceptFriendRequest(linkId);
            return;
          }
          removeFriend(userId);
        }}
        className={cn(state === "friends" && "text-mint-400")}
      >
        {state === "friends" ? "Friends" : state === "pending_out" ? "Request sent" : state === "pending_in" ? "Accept" : "Add friend"}
      </Button>

      {state !== "friends" && (
        <Button size={size} variant={following ? "soft" : "outline"} icon={<Heart className={cn("size-3.5", following && "fill-current")} />} onClick={() => toggleFollow(userId)}>
          {following ? "Following" : "Follow"}
        </Button>
      )}

      {withMessage && (
        <Link to={`/messages?with=${userId}`}>
          <Button size={size} variant="ghost" icon={<MessageCircle className="size-3.5" />}>
            Message
          </Button>
        </Link>
      )}

      {state === "friends" && (
        <button
          onClick={() => removeFriend(userId)}
          aria-label={`Remove ${user?.username ?? "friend"}`}
          title="Remove friend"
          className="tap grid size-8 place-items-center rounded-full border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-200"
        >
          <UserMinus className="size-3.5" />
        </button>
      )}
      {state === "pending_in" && linkId && (
        <button
          onClick={() => {
            cancelFriendRequest(linkId);
            pushToast("Request removed.", "info");
          }}
          aria-label="Decline request"
          title="Decline request"
          className="tap grid size-8 place-items-center rounded-full border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-200"
        >
          <UserRoundX className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function SendIcon() {
  return <Send className="size-3.5" />;
}
