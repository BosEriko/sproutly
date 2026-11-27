"use client";

import { AlarmClock } from "lucide-react";
import { ageInDays, type BabyProfile } from "@/lib/baby";
import type { Bottle } from "@/lib/bottles";
import { formatCountdown } from "./BottleCard";
import { estimateFromRhythm, estimateNextFeeding, feedingInterval, feedingRhythm, lastFedAt, RHYTHM_DAYS, shouldMakeMilk } from "@/lib/feeding";

const MINUTE = 60 * 1000;

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(ms / MINUTE));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function Shell({ children, nudge = false }: { children: React.ReactNode; nudge?: boolean }) {
  return (
    <section className="paper -rotate-[0.6deg] rounded-sm px-5 pt-7 pb-4">
      <span className="tape" style={{ background: "rgb(217 205 243 / 0.85)" }} />
      {nudge && <span className="tape-label text-xl">Make milk?</span>}
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
        <AlarmClock size={15} aria-hidden />
        Next feeding
      </h2>
      {children}
    </section>
  );
}

export function NextFeedingCard({ profile, bottles, now }: { profile: BabyProfile | null; bottles: Bottle[]; now: number }) {
  const name = profile?.name || "your baby";
  const rhythm = feedingRhythm(bottles, now);

  if (!rhythm && !profile?.birthday) {
    return (
      <Shell>
        <p className="mt-2 text-muted">Add {name}&apos;s birthday to see when the next feeding is likely.</p>
      </Shell>
    );
  }

  const lastFed = lastFedAt(bottles);
  if (lastFed === null) {
    return (
      <Shell>
        <p className="mt-2 text-muted">
          Tap <strong>Feeding</strong> on a bottle and the next feeding time will show here.
        </p>
      </Shell>
    );
  }

  let from: number;
  let to: number;
  let basis: string;
  if (rhythm) {
    ({ from, to } = estimateFromRhythm(lastFed, rhythm));
    const gap =
      Math.round(rhythm.minGap / MINUTE) === Math.round(rhythm.maxGap / MINUTE)
        ? formatDuration(rhythm.minGap)
        : `${formatDuration(rhythm.minGap)}–${formatDuration(rhythm.maxGap)}`;
    basis = `usually every ${gap}, based on the last ${RHYTHM_DAYS} days.`;
  } else {
    const ageDays = ageInDays(profile!.birthday!, new Date(now));
    const { minHours, maxHours } = feedingInterval(ageDays);
    ({ from, to } = estimateNextFeeding(lastFed, ageDays));
    basis = `every ${minHours}–${maxHours} hours is typical at ${name}'s age.`;
  }

  let headline: string;
  let detail: string;
  let tone: string;
  if (now < from) {
    headline = `in ${formatCountdown(from - now)}`;
    detail = `Likely hungry around ${formatTime(from)}–${formatTime(to)}`;
    tone = "text-accent";
  } else if (now < to) {
    headline = "Any time now";
    detail = `Usually by ${formatTime(to)}`;
    tone = "text-warn";
  } else {
    headline = "Due now";
    detail = `Last fed ${formatDuration(now - lastFed)} ago`;
    tone = "text-danger";
  }

  return (
    <Shell nudge={shouldMakeMilk({ from }, now)}>
      <p className={`mt-1 font-hand text-5xl leading-tight font-bold tabular-nums ${tone}`}>{headline}</p>
      <p>{detail}</p>
      <p className="mt-2 text-xs text-muted">
        Last fed {formatTime(lastFed)} · {basis} Hunger cues come first; this is only a guide.
      </p>
    </Shell>
  );
}
