"use client";

import { useState, type ReactNode } from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { StickyModal } from "./StickyModal";

export function WhenDialog({
  open,
  title,
  color,
  initialAt,
  saving,
  onCancel,
  onSave,
  children,
}: {
  open: boolean;
  title: string;
  color?: string;
  initialAt: number;
  saving: boolean;
  onCancel: () => void;
  onSave: (at: number) => void;
  children?: ReactNode;
}) {
  const [when, setWhen] = useState<Dayjs>(dayjs(initialAt));
  const [lastOpen, setLastOpen] = useState(open);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setWhen(dayjs(initialAt));
  }

  return (
    <StickyModal open={open} title={title} color={color} okLoading={saving} onCancel={onCancel} onOk={() => onSave(when.valueOf())}>
      <div className="flex flex-col gap-4 pt-2">
        {children}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">When</span>
          <DatePicker
            showTime={{ format: "h:mm A", use12Hours: true }}
            format="MMM D, h:mm A"
            size="large"
            inputReadOnly
            allowClear={false}
            value={when}
            onChange={(value) => value && setWhen(value)}
            disabledDate={(date) => date.isAfter(dayjs(), "day")}
            className="w-full"
          />
        </label>
      </div>
    </StickyModal>
  );
}
