"use client";

import type { CSSProperties, ReactNode } from "react";
import { HoldHint, HoldRow } from "./HoldRow";

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

export function RecentCard({
  tape,
  tilt = 0.5,
  aside,
  empty,
  error,
  children,
}: {
  tape: string;
  tilt?: number;
  aside?: ReactNode;
  empty: string;
  error?: string | null;
  children?: ReactNode[];
}) {
  const hasItems = Boolean(children && children.length > 0);

  return (
    <section className="paper rounded-sm px-5 pt-7 pb-4" style={{ rotate: `${tilt}deg` }}>
      <span className="tape" style={{ background: tape }} />
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-hand text-3xl font-bold">Recent</h2>
        {aside}
      </div>
      {!hasItems && <p className="text-sm text-muted">{empty}</p>}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {hasItems && (
        <>
          <ul className="mt-2 divide-y divide-line">{children}</ul>
          <div className="mt-2">
            <HoldHint />
          </div>
        </>
      )}
    </section>
  );
}
