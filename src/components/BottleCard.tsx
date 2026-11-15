"use client";

import { ACTION_LABELS, allowedActions, isExpired, type Action, type Status } from "@/lib/spoil";
import type { Bottle } from "@/lib/bottles";

const STATUS_LABELS: Record<Status, string> = {
  room: "🌡️ Room temp",
  fridge: "🧊 In fridge",
  feeding: "👶 Feeding",
  done: "Done",
};

const WARNING_MS = 30 * 60 * 1000;

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function BottleCard({
  bottle,
  now,
  busy,
  onAction,
}: {
  bottle: Bottle;
  now: number;
  busy: boolean;
  onAction: (action: Action) => void;
}) {
  const expired = isExpired(bottle, now);
  const remaining = (bottle.spoilsAt ?? now) - now;
  const tone = expired
    ? "border-red-500 bg-red-500/10"
    : remaining <= WARNING_MS
      ? "border-amber-500 bg-amber-500/10"
      : "border-emerald-500 bg-emerald-500/10";
  const countdownTone = expired ? "text-red-500" : remaining <= WARNING_MS ? "text-amber-500" : "text-emerald-500";

  return (
    <article className={`rounded-2xl border-2 p-4 ${tone}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{STATUS_LABELS[bottle.status]}</span>
        <span className="text-muted">Made {formatTime(bottle.madeAt)}</span>
      </div>

      <div className="my-3 text-center">
        <p className={`font-mono text-5xl font-bold tabular-nums ${countdownTone}`}>
          {expired ? "Spoiled" : formatCountdown(remaining)}
        </p>
        {bottle.spoilsAt && (
          <p className="mt-1 text-sm text-muted">
            {expired ? "Spoiled at" : "Spoils at"} {formatTime(bottle.spoilsAt)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {allowedActions(bottle, now).map((action) => (
          <button
            key={action}
            disabled={busy}
            onClick={() => onAction(action)}
            className={`rounded-xl px-3 py-3 text-sm font-semibold disabled:opacity-50 ${
              action === "discard" ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-card border border-line"
            } ${expired ? "col-span-2" : ""}`}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>
    </article>
  );
}
