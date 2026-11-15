import {
  Baby,
  CircleCheck,
  Refrigerator,
  Snowflake,
  Thermometer,
  ThermometerSun,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { Action, EndReason, Status } from "@/lib/spoil";

export const ACTION_ICONS: Record<Action, LucideIcon> = {
  fridge_in: Refrigerator,
  fridge_out: ThermometerSun,
  feed: Baby,
  finish: CircleCheck,
  discard: Trash2,
};

export const STATUS_ICONS: Record<Exclude<Status, "done">, LucideIcon> = {
  room: Thermometer,
  fridge: Snowflake,
  feeding: Baby,
};

export const END_ICONS: Record<EndReason, LucideIcon> = {
  finished: CircleCheck,
  discarded: Trash2,
};
