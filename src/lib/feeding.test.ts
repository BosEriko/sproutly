import { describe, expect, it } from "vitest";
import { ageInDays } from "./baby";
import type { BottleEvent } from "./bottles";
import { estimateNextFeeding, feedingInterval, lastFedAt } from "./feeding";

const HOUR = 60 * 60 * 1000;
const event = (type: BottleEvent["type"], at: number): BottleEvent => ({ type, at, by: "u", byName: "u" });

describe("ageInDays", () => {
  it("counts whole days since the birthday", () => {
    expect(ageInDays("2026-11-16", new Date(2026, 10, 16, 23, 0))).toBe(0);
    expect(ageInDays("2026-08-01", new Date(2026, 10, 16, 8, 0))).toBe(107);
  });
});

describe("feedingInterval", () => {
  it("gets longer as the baby grows", () => {
    expect(feedingInterval(5)).toEqual({ minHours: 2, maxHours: 3 });
    expect(feedingInterval(30)).toEqual({ minHours: 3, maxHours: 4 });
    expect(feedingInterval(119)).toEqual({ minHours: 3, maxHours: 4 });
    expect(feedingInterval(200)).toEqual({ minHours: 4, maxHours: 5 });
  });
});

describe("lastFedAt", () => {
  it("uses the latest feeding start across bottles", () => {
    const bottles = [
      { events: [event("made", 1 * HOUR), event("feed", 2 * HOUR), event("finish", 3 * HOUR)] },
      { events: [event("made", 5 * HOUR), event("feed", 6 * HOUR)] },
    ];
    expect(lastFedAt(bottles)).toBe(6 * HOUR);
  });

  it("falls back to when a bottle was finished if feeding start wasn't logged", () => {
    expect(lastFedAt([{ events: [event("made", HOUR), event("finish", 2 * HOUR)] }])).toBe(2 * HOUR);
  });

  it("ignores bottles that were never fed", () => {
    expect(lastFedAt([{ events: [event("made", HOUR), event("discard", 2 * HOUR)] }])).toBeNull();
  });
});

describe("estimateNextFeeding", () => {
  it("adds the age-based interval to the last feeding", () => {
    expect(estimateNextFeeding(10 * HOUR, 60)).toEqual({ lastFedAt: 10 * HOUR, from: 13 * HOUR, to: 14 * HOUR });
  });
});
