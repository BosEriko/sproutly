"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

const ITEM = 48;
const VISIBLE = 5;

export function NumberWheel({
  values,
  format,
  label,
  initial,
  value,
  onChange,
  className = "w-48",
}: {
  values: number[];
  format: (value: number) => string;
  label: string;
  initial: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const indexOf = (v: number) => Math.max(0, values.indexOf(v));

  function scrollTo(v: number, behavior: ScrollBehavior = "smooth") {
    listRef.current?.scrollTo({ top: indexOf(v) * ITEM, behavior });
  }

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: Math.max(0, values.indexOf(initial)) * ITEM, behavior: "instant" });
  }, [initial, values]);

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;
    const index = Math.min(values.length - 1, Math.max(0, Math.round(list.scrollTop / ITEM)));
    if (values[index] !== value) onChange(values[index]);
  }

  function handleKeyDown(e: KeyboardEvent) {
    const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!step) return;
    e.preventDefault();
    scrollTo(values[Math.min(values.length - 1, Math.max(0, indexOf(value) + step))]);
  }

  const idPrefix = label.toLowerCase().replace(/\W+/g, "-");

  return (
    <div className={`relative mx-auto my-2 ${className}`} style={{ height: ITEM * VISIBLE }}>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-sm border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] bg-white/50"
        style={{ height: ITEM }}
      />
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`${idPrefix}-${value}`}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] focus:outline-none [&::-webkit-scrollbar]:hidden"
        style={{
          paddingBlock: (ITEM * (VISIBLE - 1)) / 2,
          maskImage: "linear-gradient(transparent, #000 30%, #000 70%, transparent)",
        }}
      >
        {values.map((v) => (
          <div
            key={v}
            id={`${idPrefix}-${v}`}
            role="option"
            aria-selected={v === value}
            onClick={() => scrollTo(v)}
            className={`flex snap-center items-center justify-center font-hand transition-all ${
              v === value ? "text-4xl font-bold text-ink" : "text-2xl text-muted"
            }`}
            style={{ height: ITEM }}
          >
            {format(v)}
          </div>
        ))}
      </div>
    </div>
  );
}
