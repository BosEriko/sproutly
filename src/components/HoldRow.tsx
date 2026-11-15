"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Pointer } from "lucide-react";

const HOLD_MS = 550;
const MOVE_TOLERANCE = 10;

export function HoldRow({
  onHold,
  label,
  color = "var(--sticky-mint)",
  className = "",
  children,
}: {
  onHold: () => void;
  label: string;
  color?: string;
  className?: string;
  children: ReactNode;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
    setHolding(false);
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    origin.current = { x: e.clientX, y: e.clientY };
    setHolding(true);
    timer.current = setTimeout(() => {
      cancel();
      navigator.vibrate?.(15);
      onHold();
    }, HOLD_MS);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!origin.current) return;
    if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > MOVE_TOLERANCE) cancel();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onHold();
  }

  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={`${label}. Hold to edit or delete`}
      data-holding={holding}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      className={`hold-row relative cursor-pointer select-none ${className}`}
      style={{ "--hold": color } as CSSProperties}
    >
      <span aria-hidden className="hold-fill" />
      <span className="relative flex h-full w-full items-center justify-between gap-2">{children}</span>
    </li>
  );
}

export function HoldHint() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted">
      <Pointer size={13} aria-hidden className="hold-hint-icon" />
      Hold an entry to edit or delete
    </p>
  );
}
