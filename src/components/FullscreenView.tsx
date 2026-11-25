"use client";

import { useEffect, type CSSProperties } from "react";
import { Button } from "antd";
import { Milk, Minimize } from "lucide-react";
import { ageInDays, type BabyProfile } from "@/lib/baby";
import type { Bottle } from "@/lib/bottles";
import { burpEndsAt, nextFeedingWindow } from "@/lib/feeding";
import { ACTION_LABELS, allowedActions, isExpired, type Action } from "@/lib/spoil";
import { ACTION_STICKY, countdownColor, formatCountdown, STATUS_LABELS } from "./BottleCard";
import { ACTION_ICONS } from "./icons";

export function enterFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
}

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let released = false;
    const request = () => {
      if (document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (released) void sentinel.release();
          else lock = sentinel;
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", request);
      void lock?.release();
    };
  }, []);
}

function formatClock(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(ms: number) {
  return new Date(ms).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function Digits({ value }: { value: string }) {
  if (!/^[\d:]+$/.test(value)) return value;
  return [...value].map((char, i) => (
    <span
      key={i}
      className="relative inline-block text-center"
      style={char === ":" ? { width: "0.26em", left: "-0.08em" } : { width: "0.5em", left: "-0.1em" }}
    >
      {char}
    </span>
  ));
}

function Timer({
  label,
  value,
  color,
  detail,
  size,
  tilt = -1,
  sticky = "var(--sticky-yellow)",
}: {
  label: string;
  value: string;
  color: string;
  detail?: string;
  size: string;
  tilt?: number;
  sticky?: string;
}) {
  return (
    <div
      className="sticky-note px-12 py-8 text-center"
      style={{ "--sticky": sticky, rotate: `${tilt}deg`, minWidth: `calc(${size} * 3.2 + 6rem)` } as CSSProperties}
    >
      <p className="text-2xl font-semibold text-ink/70">{label}</p>
      <p className={`font-hand leading-none font-bold whitespace-nowrap ${color}`} style={{ fontSize: size }}>
        <Digits value={value} />
      </p>
      {detail && <p className="mt-2 text-2xl text-ink/70">{detail}</p>}
    </div>
  );
}

function BottleTimers({
  bottles,
  now,
  busy,
  onAction,
}: {
  bottles: Bottle[];
  now: number;
  busy: boolean;
  onAction: (id: string, action: Action) => void;
}) {
  const size = bottles.length === 1 ? "min(22vw, 38vh)" : `min(${22 / bottles.length}vw, ${34 / bottles.length}vh)`;
  return bottles.map((b, i) => {
    const expired = isExpired(b, now);
    return (
      <div key={b.id} className="flex flex-col items-center gap-6">
        <Timer
          label={`${STATUS_LABELS[b.status as keyof typeof STATUS_LABELS]} · Made ${formatClock(b.madeAt)}`}
          value={expired ? "Spoiled" : formatCountdown((b.spoilsAt ?? now) - now)}
          color={countdownColor(b, now)}
          detail={b.spoilsAt ? `${expired ? "Spoiled at" : "Spoils at"} ${formatClock(b.spoilsAt)}` : undefined}
          size={size}
          tilt={i % 2 === 0 ? -1 : 1}
        />
        <div className="flex flex-wrap justify-center gap-4">
          {allowedActions(b, now).map((action, j) => {
            const Icon = ACTION_ICONS[action];
            return (
              <div key={action} style={{ rotate: `${j % 2 === 0 ? -1.5 : 1.5}deg` }}>
                <Button
                  type="primary"
                  disabled={busy}
                  icon={<Icon size={22} aria-hidden />}
                  onClick={() => onAction(b.id, action)}
                  className="sticky h-16! px-6! font-hand text-2xl!"
                  style={{ "--sticky": ACTION_STICKY[action] } as CSSProperties}
                >
                  {ACTION_LABELS[action]}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  });
}

function FeedingTimer({ bottles, profile, now }: { bottles: Bottle[]; profile: BabyProfile | null; now: number }) {
  const next = nextFeedingWindow(bottles, profile?.birthday ? ageInDays(profile.birthday, new Date(now)) : null, now);
  if (!next) return <Timer label="Next feeding" value="--:--" color="text-muted" detail="No feeding logged yet" size="min(22vw, 38vh)" />;
  if (now < next.from) {
    return (
      <Timer
        label="Next feeding"
        value={formatCountdown(next.from - now)}
        color="text-accent"
        detail={`Likely hungry around ${formatClock(next.from)}–${formatClock(next.to)}`}
        size="min(22vw, 38vh)"
      />
    );
  }
  return (
    <Timer
      label="Next feeding"
      value={now < next.to ? "Any time now" : "Due now"}
      color={now < next.to ? "text-warn" : "text-danger"}
      detail={`Last fed ${formatClock(next.lastFedAt)}`}
      size="min(12vw, 26vh)"
    />
  );
}

export function FullscreenView({
  bottles,
  profile,
  now,
  busy,
  onMade,
  onAction,
  onExit,
}: {
  bottles: Bottle[] | null;
  profile: BabyProfile | null | undefined;
  now: number;
  busy: boolean;
  onMade: () => void;
  onAction: (id: string, action: Action) => void;
  onExit: () => void;
}) {
  useWakeLock();

  useEffect(() => {
    let entered = false;
    const onChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered) onExit();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [onExit]);

  const exit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onExit();
  };

  const active = bottles?.filter((b) => b.status !== "done") ?? [];
  const burpUntil = bottles ? burpEndsAt(bottles, now) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background bg-[url('/dino-pattern.svg')] bg-size-[280px_280px]">
      <div className="flex justify-end p-6">
        <div style={{ rotate: "3deg" }}>
          <Button
            type="primary"
            icon={<Minimize size={18} aria-hidden />}
            onClick={exit}
            className="sticky h-11! px-4! font-hand text-xl!"
            style={{ "--sticky": "var(--sticky-yellow)" } as CSSProperties}
          >
            Exit
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 overflow-y-auto px-6 pb-16">
        <div
          className="sticky-note px-6 py-3 text-center"
          style={{ "--sticky": "var(--paper)", rotate: "1.5deg" } as CSSProperties}
        >
          <p className="font-hand text-5xl leading-none font-bold tabular-nums">{formatClock(now)}</p>
          <p className="mt-1 text-lg text-ink/70">{formatDay(now)}</p>
        </div>
        {burpUntil !== null && (
          <Timer
            label="Burping time"
            value={formatCountdown(burpUntil - now)}
            color="text-accent"
            detail={`Keep upright and burp until ${formatClock(burpUntil)}`}
            size={active.length > 0 ? "min(11vw, 17vh)" : "min(22vw, 38vh)"}
            tilt={1}
            sticky="var(--sticky-lavender)"
          />
        )}
        {bottles === null ? null : active.length > 0 ? (
          <BottleTimers bottles={active} now={now} busy={busy} onAction={onAction} />
        ) : burpUntil === null ? (
          <FeedingTimer bottles={bottles} profile={profile ?? null} now={now} />
        ) : null}
        {bottles !== null && active.length === 0 && (
          <div className="-mt-4" style={{ rotate: "-1.5deg" }}>
            <Button
              type="primary"
              loading={busy}
              icon={<Milk size={22} aria-hidden />}
              onClick={onMade}
              className="sticky h-16! px-6! font-hand text-2xl!"
              style={{ "--sticky": "var(--sticky-mint)" } as CSSProperties}
            >
              Made milk
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
