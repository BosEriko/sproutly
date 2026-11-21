"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { dateKey, MAX_SUN_MINUTES } from "@/lib/sunlight";
import { NumberWheel } from "./NumberWheel";
import { StickyDatePicker } from "./StickyDatePicker";
import { StickyModal } from "./StickyModal";

const MINUTES = Array.from({ length: MAX_SUN_MINUTES + 1 }, (_, i) => i);
const DEFAULT_MINUTES = 10;

export function SunlightDialog({
  open,
  title,
  initialFront,
  initialBack,
  initialDate,
  saving,
  onCancel,
  onSave,
}: {
  open: boolean;
  title: string;
  initialFront: number | null;
  initialBack: number | null;
  initialDate?: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (frontMin: number, backMin: number, date?: string) => void;
}) {
  const startFront = initialFront ?? DEFAULT_MINUTES;
  const startBack = initialBack ?? DEFAULT_MINUTES;
  const [front, setFront] = useState(startFront);
  const [back, setBack] = useState(startBack);
  const [date, setDate] = useState(initialDate);
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setFront(startFront);
      setBack(startBack);
      setDate(initialDate);
    }
  }

  return (
    <StickyModal
      open={open}
      title={title}
      color="var(--sticky-sun)"
      okColor="var(--sticky-mint)"
      okDisabled={front + back === 0}
      okLoading={saving}
      onCancel={onCancel}
      onOk={() => onSave(front, back, date)}
    >
      {date && (
        <label className="mb-4 flex flex-col gap-1 pt-2">
          <span className="text-sm font-semibold">Day</span>
          <StickyDatePicker
            format="ddd, MMM D"
            allowClear={false}
            value={dayjs(date)}
            onChange={(value) => value && setDate(dateKey(value.valueOf()))}
            disabledDate={(d) => d.isAfter(dayjs(), "day")}
          />
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Front", value: front, initial: startFront, onChange: setFront },
          { label: "Back", value: back, initial: startBack, onChange: setBack },
        ].map((side) => (
          <div key={side.label} className="flex flex-col items-center">
            <span className="font-hand text-2xl font-bold">{side.label}</span>
            <NumberWheel
              values={MINUTES}
              format={(m) => `${m} min`}
              label={`${side.label} minutes`}
              initial={side.initial}
              value={side.value}
              onChange={side.onChange}
              className="w-full max-w-36"
            />
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted">Total {front + back} min</p>
    </StickyModal>
  );
}
