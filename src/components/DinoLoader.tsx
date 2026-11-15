export function DinoLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 py-8">
      <div className="relative h-20 w-24">
        <svg viewBox="-10 -4 70 52" className="dino-hop absolute inset-x-0 top-0 h-16 w-24" aria-hidden>
          <g fill="#9fd3ae">
            <path d="M8 30 Q-2 28 -6 18" fill="none" stroke="#9fd3ae" strokeWidth="6" strokeLinecap="round" className="dino-tail" />
            <ellipse cx="22" cy="30" rx="17" ry="11" />
            <g className="dino-head">
              <path d="M32 24 Q42 20 44 6" fill="none" stroke="#9fd3ae" strokeWidth="7" strokeLinecap="round" />
              <ellipse cx="47" cy="5" rx="6" ry="4.5" />
              <circle cx="49" cy="3.5" r="1.2" fill="#3b3a48" />
            </g>
            <rect x="11" y="35" width="6" height="10" rx="3" />
            <rect x="26" y="35" width="6" height="10" rx="3" />
            <circle cx="18" cy="25" r="2.4" fill="#ffffff" opacity=".6" />
            <circle cx="26" cy="28" r="1.8" fill="#ffffff" opacity=".6" />
          </g>
        </svg>
        <span className="dino-shadow absolute bottom-0 left-1/2 h-2 w-14 -translate-x-1/2 rounded-full bg-ink/10" />
      </div>
      <p className="font-hand text-2xl text-muted">{label}</p>
    </div>
  );
}
