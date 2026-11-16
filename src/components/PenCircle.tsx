import type { CSSProperties } from "react";

export function PenCircle({
  className = "top-[40%] h-[calc(60%-0.25rem)]",
  length = 1,
}: {
  className?: string;
  length?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      style={{ "--pen-length": length } as CSSProperties}
      className={`pen-circle pointer-events-none absolute left-1 z-10 w-[calc(100%-0.5rem)] ${className}`}
    >
      <path
        d="M16 14 C33 3, 79 3, 92 17 C99 29, 87 54, 50 56 C19 57, 4 46, 6 29 C9 16, 28 6, 50 5 C62 4.5, 70 6, 76 8"
        pathLength={1}
        fill="none"
        stroke="#d6453d"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
