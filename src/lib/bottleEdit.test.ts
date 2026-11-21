import { describe, expect, it } from "vitest";
import type { BottleEvent } from "./bottles";
import { editedEvents, isEndReason } from "./bottleEdit";

const event = (type: BottleEvent["type"], at: number, byName = "Ana"): BottleEvent => ({ type, at, by: byName, byName });
const editor = { by: "me", byName: "Me" };

describe("editedEvents", () => {
  it("turns a discarded bottle into a finished one with new times", () => {
    const events = [event("made", 1), event("fridge_in", 2), event("discard", 9)];
    expect(editedEvents(events, { endReason: "finished", madeAt: 0, fedAt: 5, endedAt: 7 }, editor)).toEqual([
      event("made", 0),
      event("fridge_in", 2),
      { type: "feed", at: 5, by: "me", byName: "Me" },
      event("finish", 7),
    ]);
  });

  it("removes the feed event when cleared and keeps who did it otherwise", () => {
    const events = [event("made", 1), event("feed", 3, "Ben"), event("finish", 6)];
    expect(editedEvents(events, { endReason: "discarded", madeAt: 1, fedAt: null, endedAt: 4 }, editor)).toEqual([
      event("made", 1),
      event("discard", 4),
    ]);
  });
});

describe("isEndReason", () => {
  it("accepts finished and discarded only", () => {
    expect(isEndReason("finished")).toBe(true);
    expect(isEndReason("discarded")).toBe(true);
    expect(isEndReason("room")).toBe(false);
  });
});
