"use client";

import { Button, Tag } from "antd";
import { Clock } from "lucide-react";
import { ACTION_LABELS, allowedActions, isExpired, type Action, type Status } from "@/lib/spoil";
import type { Bottle } from "@/lib/bottles";
import { ACTION_ICONS, STATUS_ICONS } from "./icons";

export const STATUS_LABELS: Record<Exclude<Status, "done">, string> = {
  room: "Room temp",
  fridge: "In fridge",
  feeding: "Feeding",
};

const TAPE: Record<Exclude<Status, "done">, string> = {
  room: "var(--tape-room)",
  fridge: "var(--tape-fridge)",
  feeding: "var(--tape-feeding)",
};

const WARNING_MS = 30 * 60 * 1000;

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function countdownColor(bottle: Bottle, now: number) {
  if (isExpired(bottle, now)) return "text-danger";
  return (bottle.spoilsAt ?? now) - now <= WARNING_MS ? "text-warn" : "text-accent";
}

export function formatCountdown(ms: number) {
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
  tilt,
  onAction,
}: {
  bottle: Bottle;
  now: number;
  busy: boolean;
  tilt: number;
  onAction: (action: Action) => void;
}) {
  if (bottle.status === "done") return null;

  const expired = isExpired(bottle, now);
  const remaining = (bottle.spoilsAt ?? now) - now;
  const StatusIcon = STATUS_ICONS[bottle.status];

  return (
    <article className="paper rounded-sm px-5 pt-7 pb-5" style={{ rotate: `${tilt}deg` }}>
      <span className="tape" style={{ background: expired ? "var(--tape-spoiled)" : TAPE[bottle.status] }} />

      <div className="flex items-center justify-between">
        <Tag icon={<StatusIcon size={13} aria-hidden className="mr-1 inline align-[-2px]" />} variant="filled">
          {STATUS_LABELS[bottle.status]}
        </Tag>
        <span className="text-sm text-muted">Made {formatTime(bottle.madeAt)}</span>
      </div>

      <div className="my-2 text-center">
        <p className={`font-hand text-7xl leading-none font-bold tabular-nums ${countdownColor(bottle, now)}`}>
          {expired ? "Spoiled" : formatCountdown(remaining)}
        </p>
        {bottle.spoilsAt && (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted">
            <Clock size={13} aria-hidden />
            {expired ? "Spoiled at" : "Spoils at"} {formatTime(bottle.spoilsAt)}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {allowedActions(bottle, now).map((action) => {
          const Icon = ACTION_ICONS[action];
          return (
            <Button
              key={action}
              size="large"
              disabled={busy}
              danger={action === "discard"}
              type={expired ? "primary" : "default"}
              icon={<Icon size={16} aria-hidden />}
              onClick={() => onAction(action)}
              className={expired ? "col-span-2" : undefined}
            >
              {ACTION_LABELS[action]}
            </Button>
          );
        })}
      </div>
    </article>
  );
}
