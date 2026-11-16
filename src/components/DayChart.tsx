"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "antd";
import { ChartColumn, ChartLine, type LucideIcon } from "lucide-react";
import { formatDateKey } from "@/lib/sunlight";
import { PenCircle } from "./PenCircle";

export interface DaySeries {
  label: string;
  color: string;
  values: number[];
}

type ChartType = "bars" | "line";

const CHART_TYPES: { value: ChartType; label: string; icon: LucideIcon; tilt: number }[] = [
  { value: "bars", label: "Bars", icon: ChartColumn, tilt: -1 },
  { value: "line", label: "Line", icon: ChartLine, tilt: 1 },
];

const CHART_KEY = "sproutly:chart";

function useChartType() {
  const [type, setType] = useState<ChartType>("bars");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHART_KEY);
      if (CHART_TYPES.some((t) => t.value === saved)) setType(saved as ChartType);
    } catch {}
  }, []);
  const choose = (next: ChartType) => {
    setType(next);
    try {
      localStorage.setItem(CHART_KEY, next);
    } catch {}
  };
  return [type, choose] as const;
}

const PLOT_HEIGHT = 112;
const LABEL_SPACE = 20;

const ink = (color: string) => `color-mix(in srgb, ${color} 55%, var(--ink))`;

export function DayChart({
  days,
  series,
  unit = "",
  today,
}: {
  days: string[];
  series: DaySeries[];
  unit?: string;
  today: string;
}) {
  const [type, setType] = useChartType();
  const totals = days.map((_, i) => series.reduce((sum, s) => sum + s.values[i], 0));
  const max = Math.max(1, ...(type === "bars" ? totals : series.flatMap((s) => s.values)));
  const format = (n: number) => `${n}${unit}`;
  const x = (i: number) => ((i + 0.5) / days.length) * 100;
  const y = (v: number) => PLOT_HEIGHT - (v / max) * PLOT_HEIGHT;

  return (
    <figure className="mt-3">
      <div className="relative flex items-end" style={{ height: PLOT_HEIGHT + LABEL_SPACE }}>
        {type === "line" && (
          <>
            <svg
              aria-hidden
              viewBox={`0 0 100 ${PLOT_HEIGHT}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 overflow-visible"
              style={{ height: PLOT_HEIGHT }}
            >
              {series.map((s) => (
                <polyline
                  key={s.label}
                  points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                  fill="none"
                  stroke={ink(s.color)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {series.map((s) =>
              s.values.map((v, i) => (
                <span
                  key={`${s.label}-${i}`}
                  aria-hidden
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-paper"
                  style={{ left: `${x(i)}%`, bottom: (v / max) * PLOT_HEIGHT, background: ink(s.color) }}
                />
              )),
            )}
            {series.length === 1 &&
              series[0].values.map(
                (v, i) =>
                  v > 0 && (
                    <span
                      key={i}
                      aria-hidden
                      className="pointer-events-none absolute -translate-x-1/2 text-xs text-muted tabular-nums"
                      style={{ left: `${x(i)}%`, bottom: (v / max) * PLOT_HEIGHT + 6 }}
                    >
                      {format(v)}
                    </span>
                  ),
              )}
          </>
        )}
        {days.map((day, i) => {
          const label = `${day === today ? "Today" : formatDateKey(day)}: ${
            series.length > 1 ? series.map((s) => `${s.label} ${format(s.values[i])}`).join(", ") : format(totals[i])
          }`;
          return (
            <div key={day} className="flex h-full flex-1 flex-col items-center justify-end px-1" title={label} aria-label={label} role="img">
              {type === "bars" && (
                <>
                  <span className="mb-1 text-xs text-muted tabular-nums">{totals[i] > 0 ? format(totals[i]) : ""}</span>
                  <div
                    className="flex w-full max-w-8 flex-col-reverse gap-0.5 overflow-hidden rounded-t"
                    style={{ height: (totals[i] / max) * PLOT_HEIGHT }}
                  >
                    {series.map(
                      (s) =>
                        s.values[i] > 0 && (
                          <div key={s.label} style={{ flex: s.values[i], background: s.color }} className="min-h-0.5" />
                        ),
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex border-t border-line pt-1">
        {days.map((day) => (
          <span key={day} className={`flex-1 px-1 text-center text-xs ${day === today ? "font-semibold" : "text-muted"}`}>
            {day === today ? "Today" : formatDateKey(day).slice(0, 3)}
          </span>
        ))}
      </div>
      {series.length > 1 && (
        <figcaption className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: type === "line" ? ink(s.color) : s.color }} />
              {s.label}
            </span>
          ))}
        </figcaption>
      )}
      <div role="radiogroup" aria-label="Chart type" className="mt-4 flex justify-center gap-3">
        {CHART_TYPES.map(({ value, label, icon: Icon, tilt }) => (
          <div key={value} className="relative" style={{ rotate: `${tilt}deg` }}>
            <Button
              type="primary"
              role="radio"
              aria-checked={type === value}
              icon={<Icon size={16} aria-hidden />}
              onClick={() => setType(value)}
              className={`sticky h-9! w-24! font-hand text-lg! ${type === value ? "sticky-active" : "sticky-idle"}`}
              style={{ "--sticky": series[0]?.color } as CSSProperties}
            >
              {label}
            </Button>
            {type === value && <PenCircle key={value} className="top-0 h-full" length={3} />}
          </div>
        ))}
      </div>
    </figure>
  );
}
