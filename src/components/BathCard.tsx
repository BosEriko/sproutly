"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Button, Popconfirm } from "antd";
import { Bath as BathIcon, X } from "lucide-react";
import { daysAgoLabel, type Bath } from "@/lib/bath";
import { deleteBath, logBath, subscribeBaths } from "@/lib/baths";

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function BathCard({ user, now }: { user: User; now: number }) {
  const [baths, setBaths] = useState<Bath[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeBaths(setBaths, (e) => setError(e.message)), []);

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

  const last = baths?.[0];

  return (
    <>
      <Button
        type="primary"
        size="large"
        block
        loading={busy}
        icon={<BathIcon size={30} aria-hidden />}
        onClick={() => run(() => logBath(user))}
        className="sticky h-24! rotate-[0.6deg] font-hand text-4xl!"
        style={{ "--sticky": "var(--sticky-lavender)" } as CSSProperties}
      >
        Bath time
      </Button>

      <section className="paper -rotate-[0.5deg] rounded-sm px-5 pt-7 pb-4">
        <span className="tape" style={{ background: "rgb(217 205 243 / 0.85)" }} />
        <h2 className="font-hand text-3xl font-bold">Recent</h2>
        <p className="text-sm text-muted">
          {last ? `Last bath ${daysAgoLabel(last.at, now).toLowerCase()} · ${formatDateTime(last.at)}` : "No baths logged yet"}
        </p>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {baths && baths.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {baths.map((b) => (
              <li key={b.id} className="flex h-10 items-center justify-between text-sm">
                <span>{daysAgoLabel(b.at, now)}</span>
                <span className="flex items-center gap-1 text-muted">
                  <Popconfirm
                    title="Delete this bath?"
                    description="This also removes its Discord card."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => run(() => deleteBath(b.id, user))}
                  >
                    <Button
                      type="text"
                      size="small"
                      shape="circle"
                      disabled={busy}
                      aria-label="Delete bath"
                      icon={<X size={14} aria-hidden />}
                    />
                  </Popconfirm>
                  {formatDateTime(b.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
