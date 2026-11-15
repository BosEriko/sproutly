"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Button } from "antd";
import { Check, Sun } from "lucide-react";
import { dateKey, formatDateKey, type SunlightDay } from "@/lib/sunlight";
import { deleteSunlight, logSunlight, subscribeSunlight, updateSunlight } from "@/lib/sunlightDays";
import { EntryMenu } from "./EntryMenu";
import { HoldHint, HoldRow } from "./HoldRow";
import { SunlightDialog } from "./SunlightDialog";

function minutesText(day: SunlightDay) {
  if (day.frontMin === null && day.backMin === null) return "";
  return `Front ${day.frontMin ?? 0} min · Back ${day.backMin ?? 0} min`;
}

export function SunlightCard({ user, now }: { user: User; now: number }) {
  const [days, setDays] = useState<SunlightDay[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SunlightDay | null>(null);
  const [mode, setMode] = useState<"log" | "menu" | "edit" | null>(null);

  useEffect(() => subscribeSunlight(setDays, (e) => setError(e.message)), []);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  const close = () => {
    setMode(null);
    setSelected(null);
  };

  const today = dateKey(now);
  const doneToday = days?.some((d) => d.date === today) ?? false;
  const label = (date: string) => (date === today ? "Today" : formatDateKey(date));

  return (
    <>
      <Button
        type="primary"
        size="large"
        block
        disabled={doneToday || days === null}
        icon={doneToday ? <Check size={30} aria-hidden /> : <Sun size={30} aria-hidden />}
        onClick={() => setMode("log")}
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
          <>
            <ul className="mt-2 divide-y divide-line">
              {days.map((d) => (
                <HoldRow
                  key={d.date}
                  label={`Sunlight ${label(d.date)}`}
                  color="var(--sticky-sun)"
                  className="h-10 text-sm"
                  onHold={() => {
                    setSelected(d);
                    setMode("menu");
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Sun size={14} aria-hidden className="text-warn" />
                    {label(d.date)}
                  </span>
                  <span className="text-muted">{minutesText(d)}</span>
                </HoldRow>
              ))}
            </ul>
            <div className="mt-2">
              <HoldHint />
            </div>
          </>
        )}
      </section>

      <SunlightDialog
        open={mode === "log" || mode === "edit"}
        title={mode === "edit" && selected ? `Sunlight · ${label(selected.date)}` : "Morning sunlight"}
        initialFront={mode === "edit" ? (selected?.frontMin ?? null) : null}
        initialBack={mode === "edit" ? (selected?.backMin ?? null) : null}
        saving={busy}
        onCancel={close}
        onSave={(frontMin, backMin) => {
          const task =
            mode === "edit" && selected
              ? () => updateSunlight(selected.date, frontMin, backMin, user)
              : () => logSunlight(today, frontMin, backMin, user);
          run(task)
            .then(close)
            .catch(() => {});
        }}
      />

      <EntryMenu
        open={mode === "menu"}
        title={selected ? `Sunlight · ${label(selected.date)}` : ""}
        onClose={close}
        onEdit={() => setMode("edit")}
        onDelete={() => (selected ? run(() => deleteSunlight(selected.date, user)) : Promise.resolve())}
      />
    </>
  );
}
