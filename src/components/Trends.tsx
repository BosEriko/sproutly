"use client";

import { formatHour, peakHours, TREND_DAYS } from "@/lib/trends";

export interface TrendStat {
  label: string;
  value: string;
}

export interface HourSeries {
  label: string;
  color: string;
  likelihood: number[];
}

const PLOT_HEIGHT = 56;
function HourStrip({ series }: { series: HourSeries }) {
  const max = Math.max(...series.likelihood);
  const peaks = peakHours(series.likelihood);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{series.label}</p>
        <p className="text-xs text-muted">
          {peaks.length > 0 ? `Likely around ${peaks.map(formatHour).join(", ")}` : `None in the last ${TREND_DAYS} days`}
        </p>
      </div>
      <div className="mt-1 flex items-end gap-px" style={{ height: PLOT_HEIGHT }}>
        {series.likelihood.map((value, hour) => {
          const days = Math.round(value * TREND_DAYS);
          const label = `${formatHour(hour)}: ${days} of ${TREND_DAYS} days`;
          return (
            <div key={hour} className="flex h-full flex-1 items-end" title={label} aria-label={label} role="img">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: max > 0 ? Math.max(value > 0 ? 3 : 1, (value / max) * PLOT_HEIGHT) : 1,
                  background: value > 0 ? series.color : "var(--line)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden className="mt-1 flex gap-px border-t border-line pt-1 text-[10px] leading-none text-muted">
        {series.likelihood.map((_, hour) => (
          <span key={hour} className="flex flex-1 justify-center">
            <span className="whitespace-nowrap [writing-mode:vertical-rl] rotate-180">{formatHour(hour)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Trends({ stats, hours = [] }: { stats: TrendStat[]; hours?: HourSeries[] }) {
  return (
    <div className="mt-3 flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-sm bg-background px-2 py-2 text-center">
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="font-hand text-2xl leading-tight font-bold">{s.value}</dd>
          </div>
        ))}
      </dl>
      {hours.map((s) => (
        <HourStrip key={s.label} series={s} />
      ))}
      <p className="text-xs text-muted">
        {hours.length > 0 ? "Bar height shows how many days something happened in that hour. " : ""}
        Based on the last {TREND_DAYS} days.
      </p>
    </div>
  );
}
