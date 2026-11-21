"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Button } from "antd";
import { ArrowDown, ArrowUp, Check, Sun } from "lucide-react";
import { dateKey, formatDateKey, type SunlightDay } from "@/lib/sunlight";
import { recentDayKeys, totalsByDay } from "@/lib/days";
import { perDay } from "@/lib/trends";
import { deleteSunlight, logSunlight, subscribeSunlight, updateSunlight } from "@/lib/sunlightDays";
import { DayChart } from "./DayChart";
import { Trends } from "./Trends";
import { EntryMenu } from "./EntryMenu";
import { HistoryItem, RecentCard } from "./History";
import { SunlightDialog } from "./SunlightDialog";

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
  const chartDays = recentDayKeys(now);
  const week = (days ?? []).filter((d) => chartDays.includes(d.date));
  const weekMinutes = (pick: (d: SunlightDay) => number | null) => week.reduce((sum, d) => sum + (pick(d) ?? 0), 0);
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

      <RecentCard
        tape="var(--tape-room)"
        color="var(--sticky-sun)"
        empty="No sunlight logged yet"
        error={error}
        graph={
          <DayChart
            days={chartDays}
            today={today}
            unit="m"
            series={[
              { label: "Front", color: "var(--sticky-sun)", values: totalsByDay(days ?? [], chartDays, (d) => d.date, (d) => d.frontMin ?? 0) },
              { label: "Back", color: "var(--sticky-lavender)", values: totalsByDay(days ?? [], chartDays, (d) => d.date, (d) => d.backMin ?? 0) },
            ]}
          />
        }
        trends={
          <Trends
            stats={[
              { label: "Days out", value: `${week.length}/${chartDays.length}` },
              { label: "Front/day", value: `${perDay(weekMinutes((d) => d.frontMin))}m` },
              { label: "Back/day", value: `${perDay(weekMinutes((d) => d.backMin))}m` },
            ]}
          />
        }
      >
        {(days ?? []).map((d) => (
          <HistoryItem
            key={d.date}
            icon={<Sun size={15} />}
            title={label(d.date)}
            facts={
              d.frontMin === null && d.backMin === null
                ? []
                : [
                    { icon: <ArrowUp size={12} />, text: `${d.frontMin ?? 0}m`, label: "Front" },
                    { icon: <ArrowDown size={12} />, text: `${d.backMin ?? 0}m`, label: "Back" },
                  ]
            }
            meta={d.frontMin !== null || d.backMin !== null ? `${(d.frontMin ?? 0) + (d.backMin ?? 0)}m` : undefined}
            color="var(--sticky-sun)"
            label={`Sunlight ${label(d.date)}`}
            onHold={() => {
              setSelected(d);
              setMode("menu");
            }}
          />
        ))}
      </RecentCard>

      <SunlightDialog
        open={mode === "log" || mode === "edit"}
        title={mode === "edit" && selected ? `Sunlight · ${label(selected.date)}` : "Morning sunlight"}
        initialFront={mode === "edit" ? (selected?.frontMin ?? null) : null}
        initialBack={mode === "edit" ? (selected?.backMin ?? null) : null}
        initialDate={mode === "edit" ? selected?.date : undefined}
        saving={busy}
        onCancel={close}
        onSave={(frontMin, backMin, date) => {
          const task =
            mode === "edit" && selected
              ? () => updateSunlight(selected.date, frontMin, backMin, user, date)
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
