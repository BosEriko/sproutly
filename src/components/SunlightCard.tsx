"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Button, Popconfirm } from "antd";
import { Check, Sun, X } from "lucide-react";
import { dateKey, formatDateKey, type SunlightDay } from "@/lib/sunlight";
import { deleteSunlight, logSunlight, subscribeSunlight } from "@/lib/sunlightDays";

export function SunlightCard({ user, now }: { user: User; now: number }) {
  const [days, setDays] = useState<SunlightDay[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeSunlight(setDays, (e) => setError(e.message)), []);

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

  const today = dateKey(now);
  const doneToday = days?.some((d) => d.date === today) ?? false;

  return (
    <>
      <Button
        type="primary"
        size="large"
        block
        loading={busy}
        disabled={doneToday || days === null}
        icon={doneToday ? <Check size={30} aria-hidden /> : <Sun size={30} aria-hidden />}
        onClick={() => run(() => logSunlight(today, user))}
        className="sticky h-24! -rotate-[0.6deg] font-hand text-4xl!"
        style={{ "--sticky": "var(--sticky-sun)" } as CSSProperties}
      >
        {doneToday ? "Sunlight done today" : "Morning sunlight"}
      </Button>

      <section className="paper rotate-[0.5deg] rounded-sm px-5 pt-7 pb-4">
        <span className="tape" style={{ background: "var(--tape-room)" }} />
        <h2 className="font-hand text-3xl font-bold">Recent</h2>
        {days && days.length === 0 && <p className="text-sm text-muted">No sunlight logged yet</p>}

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {days && days.length > 0 && (
          <ul className="mt-2 divide-y divide-line">
            {days.map((d) => (
              <li key={d.date} className="flex h-10 items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Sun size={14} aria-hidden className="text-warn" />
                  {d.date === today ? "Today" : formatDateKey(d.date)}
                </span>
                <Popconfirm
                  title="Delete this day?"
                  description="This also removes its Discord card."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => run(() => deleteSunlight(d.date, user))}
                >
                  <Button
                    type="text"
                    size="small"
                    shape="circle"
                    disabled={busy}
                    aria-label="Delete sunlight day"
                    icon={<X size={14} aria-hidden />}
                  />
                </Popconfirm>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
