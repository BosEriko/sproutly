"use client";

import { useState, type CSSProperties } from "react";
import { Button } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { Bottle } from "@/lib/bottles";
import type { BottleEdit } from "@/lib/bottleEdit";
import { MAX_FEED_ML, MIN_FEED_ML } from "@/lib/feeding";
import type { EndReason } from "@/lib/spoil";
import { END_ICONS } from "./icons";
import { NumberWheel } from "./NumberWheel";
import { StickyDatePicker } from "./StickyDatePicker";
import { StickyModal } from "./StickyModal";

const VALUES = Array.from({ length: (MAX_FEED_ML - MIN_FEED_ML) / 10 + 1 }, (_, i) => MIN_FEED_ML + i * 10);

const OUTCOMES: { value: EndReason; label: string; color: string; tilt: number }[] = [
  { value: "finished", label: "Finished", color: "var(--sticky-mint)", tilt: -0.6 },
  { value: "discarded", label: "Discarded", color: "var(--sticky-pink)", tilt: 0.6 },
];

function TimeField({
  label,
  value,
  allowClear = false,
  placeholder,
  onChange,
}: {
  label: string;
  value: Dayjs | null;
  allowClear?: boolean;
  placeholder?: string;
  onChange: (value: Dayjs | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <StickyDatePicker
        showTime={{ format: "h:mm A", use12Hours: true }}
        format="MMM D, h:mm A"
        allowClear={allowClear}
        placeholder={placeholder}
        value={value}
        onChange={(next) => onChange(next ?? null)}
        disabledDate={(date) => date.isAfter(dayjs(), "day")}
      />
    </label>
  );
}

function initial(bottle: Bottle | null) {
  const at = (type: string) => bottle?.events.find((e) => e.type === type)?.at;
  const end = bottle?.events.find((e) => e.type === "finish" || e.type === "discard")?.at;
  return {
    outcome: bottle?.endReason ?? "finished",
    made: dayjs(bottle?.madeAt),
    fed: at("feed") === undefined ? null : dayjs(at("feed")),
    ended: dayjs(end ?? bottle?.madeAt),
  };
}

export function BottleEditDialog({
  open,
  bottle,
  suggestedMl,
  saving,
  onCancel,
  onSave,
}: {
  open: boolean;
  bottle: Bottle | null;
  suggestedMl: number;
  saving: boolean;
  onCancel: () => void;
  onSave: (edit: BottleEdit & { amountMl?: number }) => void;
}) {
  const [outcome, setOutcome] = useState<EndReason>("finished");
  const [made, setMade] = useState<Dayjs>(dayjs());
  const [fed, setFed] = useState<Dayjs | null>(null);
  const [ended, setEnded] = useState<Dayjs>(dayjs());
  const [amount, setAmount] = useState(suggestedMl);
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const start = initial(bottle);
      setOutcome(start.outcome);
      setMade(start.made);
      setFed(start.fed);
      setEnded(start.ended);
      setAmount(bottle?.amountMl ?? suggestedMl);
    }
  }

  return (
    <StickyModal
      open={open}
      title="Edit bottle"
      color="var(--sticky-blue)"
      okLoading={saving}
      onCancel={onCancel}
      onOk={() =>
        onSave({
          endReason: outcome,
          madeAt: made.valueOf(),
          fedAt: fed?.valueOf() ?? null,
          endedAt: ended.valueOf(),
          ...(outcome === "finished" ? { amountMl: amount } : {}),
        })
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Outcome">
          {OUTCOMES.map(({ value, label, color, tilt }) => {
            const Icon = END_ICONS[value];
            return (
              <Button
                key={value}
                type="primary"
                role="radio"
                aria-checked={outcome === value}
                icon={<Icon size={18} aria-hidden />}
                onClick={() => setOutcome(value)}
                className={`sticky h-14! font-hand text-xl! ${outcome === value ? "sticky-active" : "sticky-idle"}`}
                style={{ rotate: `${tilt}deg`, "--sticky": color } as CSSProperties}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <TimeField label="Made" value={made} onChange={(v) => v && setMade(v)} />
        <TimeField label="Started feeding" value={fed} allowClear placeholder="Not fed" onChange={setFed} />
        <TimeField
          label={outcome === "finished" ? "Finished" : "Discarded"}
          value={ended}
          onChange={(v) => v && setEnded(v)}
        />

        {outcome === "finished" && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Amount</span>
            <NumberWheel
              values={VALUES}
              format={(ml) => `${ml} ml`}
              label="Amount in ml"
              initial={bottle?.amountMl ?? suggestedMl}
              value={amount}
              onChange={setAmount}
            />
          </div>
        )}
      </div>
    </StickyModal>
  );
}
