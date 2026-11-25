"use client";

import { Timer } from "lucide-react";
import { formatCountdown } from "./BottleCard";

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function BurpCard({ endsAt, now }: { endsAt: number; now: number }) {
  return (
    <section className="paper rotate-[0.6deg] rounded-sm px-5 pt-7 pb-4">
      <span className="tape" style={{ background: "rgb(253 231 169 / 0.85)" }} />
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
        <Timer size={15} aria-hidden />
        Burping time
      </h2>
      <p className="mt-1 font-hand text-5xl leading-tight font-bold tabular-nums text-accent">
        {formatCountdown(endsAt - now)}
      </p>
      <p>Keep upright and burp until {formatTime(endsAt)}</p>
    </section>
  );
}
