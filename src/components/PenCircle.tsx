export function PenCircle() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 60"
      preserveAspectRatio="none"
      className="pen-circle pointer-events-none absolute top-[40%] left-1 z-10 h-[calc(60%-0.25rem)] w-[calc(100%-0.5rem)]"
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
