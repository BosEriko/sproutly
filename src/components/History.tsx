"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "antd";
import { ChartColumn, List, TrendingUp, type LucideIcon } from "lucide-react";
import { HoldHint, HoldRow } from "./HoldRow";
import { PenCircle } from "./PenCircle";

export interface FactItem {
  icon: ReactNode;
  text: string;
  label: string;
}

export function Facts({ items }: { items: FactItem[] }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1" title={item.label} aria-label={`${item.label}: ${item.text}`}>
          <span aria-hidden className="flex">
            {item.icon}
          </span>
          {item.text}
        </span>
      ))}
    </span>
  );
}

export function HistoryItem({
  icon,
  title,
  facts = [],
  meta,
  color,
  danger = false,
  label,
  onHold,
}: {
  icon: ReactNode;
  title: ReactNode;
  facts?: FactItem[];
  meta?: ReactNode;
  color: string;
  danger?: boolean;
  label: string;
  onHold: () => void;
}) {
  return (
    <HoldRow label={label} color={color} className="py-2 text-sm" onHold={onHold}>
      <span className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-ink"
          style={{ background: color, rotate: "-3deg" } as CSSProperties}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className={`truncate font-semibold ${danger ? "text-danger" : ""}`}>{title}</span>
          {facts.length > 0 && <Facts items={facts} />}
        </span>
      </span>
      {meta && <span className="shrink-0 text-muted">{meta}</span>}
    </HoldRow>
  );
}

type View = "recent" | "graphs" | "trends";

const VIEWS: { value: View; label: string; icon: LucideIcon; tilt: number }[] = [
  { value: "recent", label: "Recent", icon: List, tilt: -0.8 },
  { value: "graphs", label: "Graphs", icon: ChartColumn, tilt: 0.8 },
  { value: "trends", label: "Trends", icon: TrendingUp, tilt: -0.5 },
];

const VIEW_KEY = "sproutly:view";

function useView() {
  const [view, setView] = useState<View>("recent");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (VIEWS.some((v) => v.value === saved)) setView(saved as View);
    } catch {}
  }, []);
  const choose = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };
  return [view, choose] as const;
}

export function RecentCard({
  tape,
  color,
  tilt = 0.5,
  aside,
  empty,
  error,
  graph,
  trends,
  children,
}: {
  tape: string;
  color: string;
  tilt?: number;
  aside?: ReactNode;
  empty: string;
  error?: string | null;
  graph: ReactNode;
  trends: ReactNode;
  children?: ReactNode[];
}) {
  const [view, setView] = useView();
  const hasItems = Boolean(children && children.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="View" className="grid grid-cols-3 gap-3">
        {VIEWS.map(({ value, label, icon: Icon, tilt: noteTilt }) => (
          <div key={value} className="relative" style={{ rotate: `${noteTilt}deg` }}>
            <Button
              type="primary"
              block
              role="tab"
              aria-selected={view === value}
              icon={<Icon size={18} aria-hidden />}
              onClick={() => setView(value)}
              className={`sticky h-12! gap-1! px-2! font-hand text-xl! ${view === value ? "sticky-active" : "sticky-idle"}`}
              style={{ "--sticky": color } as CSSProperties}
            >
              {label}
            </Button>
            {view === value && <PenCircle key={value} className="top-0.5 h-[calc(100%-0.25rem)]" length={3} />}
          </div>
        ))}
      </div>
      <section className="paper rounded-sm px-5 pt-7 pb-4" style={{ rotate: `${tilt}deg` }}>
        <span className="tape" style={{ background: tape }} />
        {aside && <div className="flex justify-end">{aside}</div>}
        {view === "recent" && !hasItems && <p className="mt-3 text-sm text-muted">{empty}</p>}

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {view === "graphs" && graph}

        {view === "trends" && trends}

        {view === "recent" && hasItems && (
          <>
            <ul className="mt-3 divide-y divide-line">{children}</ul>
            <div className="mt-2">
              <HoldHint />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
