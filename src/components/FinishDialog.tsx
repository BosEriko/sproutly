"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Modal } from "antd";
import { MAX_FEED_ML, MIN_FEED_ML } from "@/lib/feeding";

const ITEM = 48;
const VISIBLE = 5;
const VALUES = Array.from({ length: (MAX_FEED_ML - MIN_FEED_ML) / 10 + 1 }, (_, i) => MIN_FEED_ML + i * 10);

function indexOf(ml: number) {
  return Math.max(0, VALUES.indexOf(ml));
}

function MlWheel({ initial, value, onChange }: { initial: number; value: number; onChange: (ml: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null);

  function scrollTo(ml: number, behavior: ScrollBehavior = "smooth") {
    listRef.current?.scrollTo({ top: indexOf(ml) * ITEM, behavior });
  }

  useLayoutEffect(() => {
    scrollTo(initial, "instant");
  }, [initial]);

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;
    const index = Math.min(VALUES.length - 1, Math.max(0, Math.round(list.scrollTop / ITEM)));
    onChange(VALUES[index]);
  }

  function handleKeyDown(e: KeyboardEvent) {
    const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!step) return;
    e.preventDefault();
    scrollTo(VALUES[Math.min(VALUES.length - 1, Math.max(0, indexOf(value) + step))]);
  }

  return (
    <div className="relative mx-auto my-2 w-48" style={{ height: ITEM * VISIBLE }}>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-sm border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] bg-white/50"
        style={{ height: ITEM }}
      />
      <div
        ref={listRef}
        role="listbox"
        aria-label="Amount in ml"
        aria-activedescendant={`ml-${value}`}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] focus:outline-none [&::-webkit-scrollbar]:hidden"
        style={{
          paddingBlock: (ITEM * (VISIBLE - 1)) / 2,
          maskImage: "linear-gradient(transparent, #000 30%, #000 70%, transparent)",
        }}
      >
        {VALUES.map((ml) => (
          <div
            key={ml}
            id={`ml-${ml}`}
            role="option"
            aria-selected={ml === value}
            onClick={() => scrollTo(ml)}
            className={`flex snap-center items-center justify-center font-hand transition-all ${
              ml === value ? "text-4xl font-bold text-ink" : "text-2xl text-muted"
            }`}
            style={{ height: ITEM }}
          >
            {ml} ml
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinishDialog({
  open,
  name,
  suggestedMl,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  name: string;
  suggestedMl: number;
  onCancel: () => void;
  onConfirm: (ml: number) => void;
}) {
  const [value, setValue] = useState(suggestedMl);
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setValue(suggestedMl);
  }

  return (
    <Modal
      open={open}
      centered
      destroyOnHidden
      title={<span className="font-hand text-3xl font-bold">How much did {name} drink?</span>}
      okText="Save"
      classNames={{ container: "sticky-note" }}
      styles={{ container: { "--sticky": "var(--sticky-mint)", rotate: "-0.8deg" } as CSSProperties }}
      okButtonProps={{ className: "sticky px-6!", style: { "--sticky": "var(--sticky-yellow)" } as CSSProperties }}
      cancelButtonProps={{ type: "text" }}
      onCancel={onCancel}
      onOk={() => onConfirm(value)}
    >
      <MlWheel initial={suggestedMl} value={value} onChange={setValue} />
      <p className="text-center text-sm text-muted">
        Suggested {suggestedMl} ml for {name}&apos;s age and weight
      </p>
    </Modal>
  );
}
