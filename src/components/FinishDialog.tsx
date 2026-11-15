"use client";

import { useState } from "react";
import { MAX_FEED_ML, MIN_FEED_ML } from "@/lib/feeding";
import { NumberWheel } from "./NumberWheel";
import { StickyModal } from "./StickyModal";

const VALUES = Array.from({ length: (MAX_FEED_ML - MIN_FEED_ML) / 10 + 1 }, (_, i) => MIN_FEED_ML + i * 10);

export function FinishDialog({
  open,
  name,
  suggestedMl,
  initialMl = suggestedMl,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  name: string;
  suggestedMl: number;
  initialMl?: number;
  onCancel: () => void;
  onConfirm: (ml: number) => void;
}) {
  const [value, setValue] = useState(initialMl);
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setValue(initialMl);
  }

  return (
    <StickyModal open={open} title={`How much did ${name} drink?`} onCancel={onCancel} onOk={() => onConfirm(value)}>
      <NumberWheel
        values={VALUES}
        format={(ml) => `${ml} ml`}
        label="Amount in ml"
        initial={initialMl}
        value={value}
        onChange={setValue}
      />
      <p className="text-center text-sm text-muted">
        Suggested {suggestedMl} ml for {name}&apos;s age and weight
      </p>
    </StickyModal>
  );
}
