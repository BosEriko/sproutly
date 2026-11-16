"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Button } from "antd";
import { Bath as BathIcon, CalendarDays } from "lucide-react";
import { daysAgoLabel, type Bath } from "@/lib/bath";
import { recentDayKeys, totalsByDay } from "@/lib/days";
import { dateKey } from "@/lib/sunlight";
import { deleteBath, logBath, subscribeBaths, updateBath } from "@/lib/baths";
import { DayChart } from "./DayChart";
import { EntryMenu } from "./EntryMenu";
import { HistoryItem, RecentCard } from "./History";
import { WhenDialog } from "./WhenDialog";

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function BathCard({ user, now }: { user: User; now: number }) {
  const [baths, setBaths] = useState<Bath[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Bath | null>(null);
  const [mode, setMode] = useState<"menu" | "edit" | null>(null);

  useEffect(() => subscribeBaths(setBaths, (e) => setError(e.message)), []);

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

  const chartDays = recentDayKeys(now);

  const close = () => {
    setMode(null);
    setSelected(null);
  };

  return (
    <>
      <Button
        type="primary"
        size="large"
        block
        loading={busy}
        icon={<BathIcon size={30} aria-hidden />}
        onClick={() => run(() => logBath(user)).catch(() => {})}
        className="sticky h-24! rotate-[0.6deg] font-hand text-4xl!"
        style={{ "--sticky": "var(--sticky-lavender)" } as CSSProperties}
      >
        Bath time
      </Button>

      <RecentCard
        tape="rgb(217 205 243 / 0.85)"
        color="var(--sticky-lavender)"
        tilt={-0.5}
        empty="No baths logged yet"
        error={error}
        graph={
          <DayChart
            days={chartDays}
            today={dateKey(now)}
            series={[
              { label: "Baths", color: "var(--sticky-lavender)", values: totalsByDay(baths ?? [], chartDays, (b) => dateKey(b.at)) },
            ]}
          />
        }
      >
        {(baths ?? []).map((b) => (
          <HistoryItem
            key={b.id}
            icon={<BathIcon size={15} />}
            title={daysAgoLabel(b.at, now)}
            facts={[{ icon: <CalendarDays size={12} />, text: formatDate(b.at), label: "Date" }]}
            meta={formatTime(b.at)}
            color="var(--sticky-lavender)"
            label={`Bath ${formatDateTime(b.at)}`}
            onHold={() => {
              setSelected(b);
              setMode("menu");
            }}
          />
        ))}
      </RecentCard>

      <EntryMenu
        open={mode === "menu"}
        title={selected ? `Bath · ${formatDateTime(selected.at)}` : ""}
        onClose={close}
        onEdit={() => setMode("edit")}
        onDelete={() => (selected ? run(() => deleteBath(selected.id, user)) : Promise.resolve())}
      />

      <WhenDialog
        open={mode === "edit"}
        title="Edit bath"
        color="var(--sticky-lavender)"
        initialAt={selected?.at ?? now}
        saving={busy}
        onCancel={close}
        onSave={(at) => {
          if (!selected) return;
          run(() => updateBath(selected.id, at, user))
            .then(close)
            .catch(() => {});
        }}
      />
    </>
  );
}
