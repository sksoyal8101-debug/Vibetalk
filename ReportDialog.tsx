import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store/StoreProvider";
import type { Report } from "../lib/types";
import { cn } from "../utils/cn";
import { Button, Field, Modal, Textarea } from "./ui";

const USER_REASONS = [
  "Harassment or hate speech",
  "Under 18 / minor safety concern",
  "Sexual or explicit content",
  "Scam, spam or solicitation",
  "Impersonation",
  "Something else",
];

const ROOM_REASONS = [
  "Room contains hate speech",
  "Underage participants",
  "Explicit sexual content",
  "Gambling or money solicitation",
  "Illegal activity",
  "Something else",
];

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onClose: () => void;
  targetType: Report["targetType"];
  targetId: string;
  targetLabel: string;
}) {
  const { submitReport, toggleBlock, db } = useStore();
  const reasons = targetType === "user" ? USER_REASONS : ROOM_REASONS;
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const blocked = db.blocked.includes(targetId);

  function send() {
    submitReport({ targetType, targetId, targetLabel, reason, details: details.trim() });
    if (alsoBlock && targetType === "user" && !blocked) toggleBlock(targetId);
    setDetails("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Report ${targetType === "user" ? "user" : "room"}`}
      subtitle={targetLabel}
    >
      <div className="mb-4 flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100/80">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <p>
          Reports are stored locally in this MVP. In version 2 they're routed to a moderation queue with human
          review. Never share bank details, and treat all strangers with care — VibeTalk is 18+.
        </p>
      </div>

      <Field label="What happened?">
        <div className="space-y-1.5">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                "tap flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left text-sm transition",
                reason === r
                  ? "border-vibe-400/70 bg-vibe-600/20 text-white"
                  : "border-white/8 bg-white/[0.03] text-white/65 hover:bg-white/[0.07]",
              )}
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border",
                  reason === r ? "border-vibe-200 bg-vibe-400" : "border-white/25",
                )}
              >
                {reason === r && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              {r}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Anything else we should know?" className="mt-4" hint="optional">
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={400}
          placeholder="Add context, timestamps or quotes from the room chat…"
        />
      </Field>

      {targetType === "user" && (
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3 text-sm">
          <input
            type="checkbox"
            checked={alsoBlock}
            onChange={(e) => setAlsoBlock(e.target.checked)}
            className="size-4 accent-[#a855f7]"
          />
          Also block this user and remove them from my feeds
        </label>
      )}

      <div className="mt-5 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" className="flex-1" onClick={send}>
          Submit report
        </Button>
      </div>
    </Modal>
  );
}
