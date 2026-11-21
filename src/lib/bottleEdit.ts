import type { BottleEvent } from "./bottles";
import type { EndReason } from "./spoil";

export interface BottleEdit {
  endReason: EndReason;
  madeAt: number;
  fedAt: number | null;
  endedAt: number;
}

export interface Editor {
  by: string;
  byName: string;
}

const isEnd = (e: BottleEvent) => e.type === "finish" || e.type === "discard";

export function isEndReason(value: unknown): value is EndReason {
  return value === "finished" || value === "discarded";
}

export function editedEvents(events: BottleEvent[], edit: BottleEdit, editor: Editor): BottleEvent[] {
  const made = events.find((e) => e.type === "made");
  const feed = events.find((e) => e.type === "feed");
  const end = events.find(isEnd);
  const kept = events.filter((e) => e.type !== "made" && e.type !== "feed" && !isEnd(e));

  return [
    { ...(made ?? editor), type: "made" as const, at: edit.madeAt },
    ...kept,
    ...(edit.fedAt === null ? [] : [{ ...(feed ?? editor), type: "feed" as const, at: edit.fedAt }]),
    { ...(end ?? editor), type: edit.endReason === "finished" ? ("finish" as const) : ("discard" as const), at: edit.endedAt },
  ].sort((a, b) => a.at - b.at);
}
