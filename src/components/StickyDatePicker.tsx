"use client";

import type { CSSProperties } from "react";
import { DatePicker, type DatePickerProps } from "antd";
import type { Dayjs } from "dayjs";

export function StickyDatePicker({
  color = "var(--paper)",
  value,
  onChange,
  ...props
}: Omit<DatePickerProps, "classNames" | "styles" | "value" | "defaultValue" | "onChange" | "onOk" | "multiple"> & {
  color?: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
}) {
  const sticky = { "--sticky": color } as CSSProperties;
  return (
    <DatePicker
      size="large"
      inputReadOnly
      {...props}
      value={value}
      onChange={(next) => onChange((next as Dayjs | null) ?? null)}
      variant="borderless"
      classNames={{ root: "sticky-note sticky-picker w-full", popup: { root: "sticky-picker-popup" } }}
      styles={{ root: sticky, popup: { root: sticky } }}
    />
  );
}
