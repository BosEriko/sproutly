"use client";

import { dateKey, formatDateKey } from "@/lib/sunlight";
import { formatHour } from "@/lib/trends";

export interface TimeDot {
  at: number;
  color: string;
  label: string;
  value?: string;
}

const PLOT_HEIGHT = 240;
const TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

const ink = (color: string) => `color-mix(in srgb, ${color} 55%, var(--ink))`;

export function TimeDotChart({
  days,
  today,
  dots,
  legend = [],
}: {
  days: string[];
  today: string;
  dots: TimeDot[];
  legend?: { label: string; color: string }[];
}) {
  const column = new Map(days.map((d, i) => [d, i]));
  const placed = dots.flatMap((dot) => {
    const i = column.get(dateKey(dot.at));
    if (i === undefined) return [];
    const d = new Date(dot.at);
    const minutes = d.getHours() * 60 + d.getMinutes();
    return [{ ...dot, x: ((i + 0.5) / days.length) * 100, y: (minutes / (24 * 60)) * 100 }];
  });

  return (
    <div>
      <div className="flex">
        <div className="relative w-11 shrink-0 text-[10px] text-muted" style={{ height: PLOT_HEIGHT }}>
          {TICKS.map((hour) => (
            <span key={hour} className="absolute right-1.5 -translate-y-1/2 whitespace-nowrap" style={{ top: `${(hour / 24) * 100}%` }}>
              {formatHour(hour % 24)}
            </span>
          ))}
        </div>
        <div className="relative flex-1 border-l border-line" style={{ height: PLOT_HEIGHT }}>
          {TICKS.map((hour) => (
            <div key={hour} aria-hidden className="absolute inset-x-0 border-t border-line" style={{ top: `${(hour / 24) * 100}%` }} />
          ))}
          {placed.map((dot, i) => (
            <span
              key={`${dot.at}-${i}`}
              title={dot.label}
              aria-label={dot.label}
              role="img"
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper"
              style={{ left: `${dot.x}%`, top: `${dot.y}%`, background: ink(dot.color) }}
            />
          ))}
          {placed.map(
            (dot, i) =>
              dot.value && (
                <span
                  key={`value-${dot.at}-${i}`}
                  aria-hidden
                  className="pointer-events-none absolute translate-x-2 -translate-y-1/2 text-[10px] leading-none font-semibold text-ink tabular-nums"
                  style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                >
                  {dot.value}
                </span>
              ),
          )}
        </div>
      </div>
      <div className="ml-11 flex pt-1">
        {days.map((day) => (
          <span key={day} className={`flex-1 px-1 text-center text-xs ${day === today ? "font-semibold" : "text-muted"}`}>
            {day === today ? "Today" : formatDateKey(day).slice(0, 3)}
          </span>
        ))}
      </div>
      {legend.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: ink(l.color) }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
