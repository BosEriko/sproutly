"use client";

import { useState } from "react";
import { MAX_SUN_MINUTES } from "@/lib/sunlight";
import { NumberWheel } from "./NumberWheel";
import { StickyModal } from "./StickyModal";

const MINUTES = Array.from({ length: MAX_SUN_MINUTES + 1 }, (_, i) => i);
const DEFAULT_MINUTES = 10;

export function SunlightDialog({
  open,
  title,
  initialFront,
  initialBack,
  saving,
  onCancel,
  onSave,
}: {
  open: boolean;
  title: string;
  initialFront: number | null;
  initialBack: number | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (frontMin: number, backMin: number) => void;
}) {
  const startFront = initialFront ?? DEFAULT_MINUTES;
  const startBack = initialBack ?? DEFAULT_MINUTES;
  const [front, setFront] = useState(startFront);
  const [back, setBack] = useState(startBack);
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setFront(startFront);
      setBack(startBack);
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
      onOk={() => onSave(front, back)}
    >
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
