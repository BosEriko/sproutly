import { describe, expect, it } from "vitest";
import { ageInDays } from "./baby";
import type { BottleEvent } from "./bottles";
import {
  estimateNextFeeding,
  feedingDuration,
  feedingInterval,
  feedsPerDay,
  finishedTitle,
  idealFeedMl,
  lastFedAt,
} from "./feeding";

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

describe("feedsPerDay", () => {
  it("follows the typical gap for the age", () => {
    expect(feedsPerDay(10)).toBe(10);
    expect(feedsPerDay(60)).toBe(7);
    expect(feedsPerDay(200)).toBe(5);
  });
});

describe("idealFeedMl", () => {
  it("splits about 150 ml per kg per day across the day's feeds", () => {
    expect(idealFeedMl(10, 3.5)).toBe(50);
    expect(idealFeedMl(107, 6.2)).toBe(130);
  });

  it("caps the day at 960 ml", () => {
    expect(idealFeedMl(200, 9)).toBe(190);
  });

  it("falls back to age, then to a general default", () => {
    expect(idealFeedMl(45, null)).toBe(120);
    expect(idealFeedMl(null, null)).toBe(120);
    expect(idealFeedMl(null, 6)).toBe(130);
  });
});

describe("feedingDuration", () => {
  const MIN = 60000;

  it("measures from Started feeding to Finished", () => {
    expect(feedingDuration({ events: [event("made", 0), event("feed", 10 * MIN), event("finish", 28 * MIN)] })).toBe(18 * MIN);
  });

  it("is unknown without both taps", () => {
    expect(feedingDuration({ events: [event("made", 0), event("finish", 28 * MIN)] })).toBeNull();
    expect(feedingDuration({ events: [event("made", 0), event("feed", 10 * MIN), event("discard", 20 * MIN)] })).toBeNull();
  });
});

describe("finishedTitle", () => {
  const MIN = 60000;

  it("reads like 60ml within 60 minutes", () => {
    expect(finishedTitle(60, 60 * MIN)).toBe("60ml within 60 minutes");
    expect(finishedTitle(130, 20 * 1000)).toBe("130ml within 1 minute");
  });

  it("drops what it doesn't know", () => {
    expect(finishedTitle(120, null)).toBe("120ml");
    expect(finishedTitle(undefined, 18 * MIN)).toBe("Finished within 18 minutes");
    expect(finishedTitle(undefined, null)).toBe("Finished");
  });
});
