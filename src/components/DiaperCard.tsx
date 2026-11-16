"use client";

import { useEffect, useState, type CSSProperties, type SVGProps } from "react";
import type { User } from "firebase/auth";
import { Button } from "antd";
import { Clock, Droplet } from "lucide-react";
import { changesToday, countDiapers, DIAPER_KINDS, DIAPER_LABELS, type DiaperChange, type DiaperKind } from "@/lib/diaper";
import { deleteDiaper, logDiaper, subscribeDiapers, updateDiaper } from "@/lib/diapers";
import { EntryMenu } from "./EntryMenu";
import { Facts, HistoryItem, RecentCard } from "./History";
import { WhenDialog } from "./WhenDialog";

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

const TILTS = [0.6, -0.4, 0.8];

const STICKY: Record<DiaperKind, string> = {
  wet: "var(--sticky-blue)",
  dirty: "var(--sticky-yellow)",
  both: "var(--sticky-pink)",
};

export function DiaperCard({ user, now }: { user: User; now: number }) {
  const [changes, setChanges] = useState<DiaperChange[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DiaperChange | null>(null);
  const [mode, setMode] = useState<"menu" | "edit" | null>(null);
  const [editKind, setEditKind] = useState<DiaperKind>("wet");

  useEffect(() => subscribeDiapers(setChanges, (e) => setError(e.message)), []);

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
            onClick={() => run(() => logDiaper(kind, user)).catch(() => {})}
            className="sticky h-20! flex-col! gap-0.5! font-hand text-2xl!"
            style={{ rotate: `${TILTS[i]}deg`, "--sticky": STICKY[kind] } as CSSProperties}
          >
            {DIAPER_LABELS[kind]}
          </Button>
        ))}
      </div>

      <RecentCard
        tape="var(--tape-fridge)"
        aside={
          <Facts
            items={[
              { icon: <Droplet size={13} />, text: String(counts.wet), label: "Wet today" },
              { icon: <DirtyIcon size={13} />, text: String(counts.dirty), label: "Dirty today" },
              ...(last ? [{ icon: <Clock size={13} />, text: formatAgo(now - last.at), label: "Last change" }] : []),
            ]}
          />
        }
        empty="No changes logged yet"
        error={error}
      >
        {today.map((c) => (
          <HistoryItem
            key={c.id}
            icon={<KindIcon kind={c.kind} size={15} />}
            title={DIAPER_LABELS[c.kind]}
            meta={formatTime(c.at)}
            color={STICKY[c.kind]}
            label={`${DIAPER_LABELS[c.kind]} at ${formatTime(c.at)}`}
            onHold={() => {
              setSelected(c);
              setEditKind(c.kind);
              setMode("menu");
            }}
          />
        ))}
      </RecentCard>

      <EntryMenu
        open={mode === "menu"}
        title={selected ? `${DIAPER_LABELS[selected.kind]} · ${formatTime(selected.at)}` : ""}
        onClose={close}
        onEdit={() => setMode("edit")}
        onDelete={() => (selected ? run(() => deleteDiaper(selected.id, user)) : Promise.resolve())}
      />

      <WhenDialog
        open={mode === "edit"}
        title="Edit diaper change"
        color="var(--sticky-blue)"
        initialAt={selected?.at ?? now}
        saving={busy}
        onCancel={close}
        onSave={(at) => {
          if (!selected) return;
          run(() => updateDiaper(selected.id, editKind, at, user))
            .then(close)
            .catch(() => {});
        }}
      >
        <div className="grid grid-cols-3 gap-2">
          {DIAPER_KINDS.map((kind, i) => (
            <Button
              key={kind}
              type="primary"
              aria-pressed={editKind === kind}
              icon={<KindIcon kind={kind} size={18} />}
              onClick={() => setEditKind(kind)}
              className={`sticky h-16! flex-col! gap-0! font-hand text-xl! ${editKind === kind ? "sticky-active" : "sticky-idle"}`}
              style={{ rotate: `${TILTS[i]}deg`, "--sticky": STICKY[kind] } as CSSProperties}
            >
              {DIAPER_LABELS[kind]}
            </Button>
          ))}
        </div>
      </WhenDialog>
    </>
  );
}
