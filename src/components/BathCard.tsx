"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { User } from "firebase/auth";
import { Button } from "antd";
import { Bath as BathIcon } from "lucide-react";
import { daysAgoLabel, type Bath } from "@/lib/bath";
import { deleteBath, logBath, subscribeBaths, updateBath } from "@/lib/baths";
import { EntryMenu } from "./EntryMenu";
import { HoldHint, HoldRow } from "./HoldRow";
import { WhenDialog } from "./WhenDialog";

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

  const close = () => {
    setMode(null);
    setSelected(null);
  };

  const last = baths?.[0];

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

      <section className="paper -rotate-[0.5deg] rounded-sm px-5 pt-7 pb-4">
        <span className="tape" style={{ background: "rgb(217 205 243 / 0.85)" }} />
        <h2 className="font-hand text-3xl font-bold">Recent</h2>
        <p className="text-sm text-muted">
          {last ? `Last bath ${daysAgoLabel(last.at, now).toLowerCase()} · ${formatDateTime(last.at)}` : "No baths logged yet"}
        </p>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {baths && baths.length > 0 && (
          <>
            <ul className="mt-3 divide-y divide-line">
              {baths.map((b) => (
                <HoldRow
                  key={b.id}
                  label={`Bath ${formatDateTime(b.at)}`}
                  color="var(--sticky-lavender)"
                  className="h-10 text-sm"
                  onHold={() => {
                    setSelected(b);
                    setMode("menu");
                  }}
                >
                  <span>{daysAgoLabel(b.at, now)}</span>
                  <span className="text-muted">{formatDateTime(b.at)}</span>
                </HoldRow>
              ))}
            </ul>
            <div className="mt-2">
              <HoldHint />
            </div>
          </>
        )}
      </section>

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
