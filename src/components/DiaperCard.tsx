"use client";

import { useEffect, useState, type CSSProperties, type SVGProps } from "react";
import type { User } from "firebase/auth";
import { Button, Popconfirm } from "antd";
import { Droplet, X } from "lucide-react";
import { changesToday, countDiapers, DIAPER_KINDS, DIAPER_LABELS, type DiaperChange, type DiaperKind } from "@/lib/diaper";
import { deleteDiaper, logDiaper, subscribeDiapers } from "@/lib/diapers";

function DirtyIcon({ size = 16, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3c1.6 1.1 2.1 2.6 1.6 4h-3.2c-.6-1.4 0-3 1.6-4z" />
      <path d="M8 7h8a2.5 2.5 0 0 1 0 5H8a2.5 2.5 0 0 1 0-5z" />
      <path d="M6 12h12a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6z" />
    </svg>
  );
}

function KindIcon({ kind, size = 16 }: { kind: DiaperKind; size?: number }) {
  if (kind === "wet") return <Droplet size={size} aria-hidden />;
  if (kind === "dirty") return <DirtyIcon size={size} aria-hidden />;
  return (
    <span className="inline-flex">
      <Droplet size={size} aria-hidden />
      <DirtyIcon size={size} aria-hidden />
    </span>
  );
}

const TILTS = [0.6, -0.4, 0.8];

const STICKY: Record<DiaperKind, string> = {
  wet: "var(--sticky-blue)",
  dirty: "var(--sticky-yellow)",
  both: "var(--sticky-pink)",
};

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatAgo(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 1) return "just now";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m ago` : `${m}m ago`;
}

export function DiaperCard({ user, now }: { user: User; now: number }) {
  const [changes, setChanges] = useState<DiaperChange[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeDiapers(setChanges, (e) => setError(e.message)), []);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const today = changes ? changesToday(changes, new Date(now)) : [];
  const counts = countDiapers(today);
  const last = changes?.[0];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {DIAPER_KINDS.map((kind, i) => (
          <Button
            key={kind}
            type="primary"
            size="large"
            disabled={busy}
            icon={<KindIcon kind={kind} size={22} />}
            onClick={() => run(() => logDiaper(kind, user))}
            className="sticky h-20! flex-col! gap-0.5! font-hand text-2xl!"
            style={{ rotate: `${TILTS[i]}deg`, "--sticky": STICKY[kind] } as CSSProperties}
          >
            {DIAPER_LABELS[kind]}
          </Button>
        ))}
      </div>

      <section className="paper rotate-[0.5deg] rounded-sm px-5 pt-7 pb-4">
        <span className="tape" style={{ background: "var(--tape-fridge)" }} />
        <div className="flex items-baseline justify-between">
          <h2 className="font-hand text-3xl font-bold">Diapers</h2>
          <span className="text-sm text-muted">
            Today: {counts.wet} wet · {counts.dirty} dirty
          </span>
        </div>
        <p className="text-sm text-muted">
          {last ? `Last change ${formatTime(last.at)} · ${formatAgo(now - last.at)}` : "No changes logged yet"}
        </p>


        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {today.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {today.map((c) => (
              <li key={c.id} className="flex h-10 items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-muted">
                    <KindIcon kind={c.kind} size={14} />
                  </span>
                  {DIAPER_LABELS[c.kind]}
                </span>
                <span className="flex items-center gap-1 text-muted">
                  {formatTime(c.at)}
                  <Popconfirm
                    title="Delete this diaper change?"
                    description="This also removes its Discord card."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => run(() => deleteDiaper(c.id, user))}
                  >
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      disabled={busy}
                      aria-label="Delete diaper change"
                      icon={<X size={14} aria-hidden />}
                    />
                  </Popconfirm>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
