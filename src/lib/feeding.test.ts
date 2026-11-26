import { describe, expect, it } from "vitest";
import { ageInDays } from "./baby";
import type { BottleEvent } from "./bottles";
import {
  averageIntake,
  burpEndsAt,
  estimateFromRhythm,
  estimateNextFeeding,
  feedingDuration,
  feedingInterval,
  feedingRhythm,
  feedsPerDay,
  finishedTitle,
  idealFeedMl,
  lastFedAt,
  nextFeedingWindow,
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

describe("feedingRhythm", () => {
  const MIN = 60000;
  const now = 7 * 24 * HOUR;
  const fedBottle = (at: number) => ({ events: [event("made", at - 10 * MIN), event("feed", at), event("finish", at + 15 * MIN)] });

  it("uses the middle half of gaps over the last 7 days", () => {
    const bottles = [];
    for (let at = 3 * HOUR; at < now; at += 3 * HOUR) bottles.push(fedBottle(at));
    expect(feedingRhythm(bottles, now)).toEqual({ minGap: 3 * HOUR, maxGap: 3 * HOUR });
  });

  it("spreads between the quartiles", () => {
    const starts = [0, 2, 5, 8, 12].map((h) => now - 13 * HOUR + h * HOUR);
    expect(feedingRhythm(starts.map(fedBottle), now)).toEqual({ minGap: 2.75 * HOUR, maxGap: 3.25 * HOUR });
  });

  it("skips top-ups, missed logs and anything older than 7 days", () => {
    const starts = [-200 * HOUR, 10 * HOUR, 10 * HOUR + 20 * MIN, 13 * HOUR, 30 * HOUR];
    expect(feedingRhythm(starts.map(fedBottle), 31 * HOUR)).toEqual({ minGap: 2 * HOUR + 40 * MIN, maxGap: 2 * HOUR + 40 * MIN });
  });

  it("uses the last 7 days with data after a break", () => {
    const starts = [-200 * HOUR, 10 * HOUR, 12 * HOUR, 15 * HOUR];
    expect(feedingRhythm(starts.map(fedBottle), 40 * 24 * HOUR)).toEqual({ minGap: 2.25 * HOUR, maxGap: 2.75 * HOUR });
  });

  it("is unknown without any usable gap", () => {
    expect(feedingRhythm([fedBottle(now - HOUR)], now)).toBeNull();
  });

  it("adds the rhythm to the last feeding", () => {
    expect(estimateFromRhythm(10 * HOUR, { minGap: 2 * HOUR, maxGap: 3 * HOUR })).toEqual({ lastFedAt: 10 * HOUR, from: 12 * HOUR, to: 13 * HOUR });
  });
});

describe("averageIntake", () => {
  const now = 8 * 24 * HOUR;
  const finished = (at: number, amountMl?: number) => ({ amountMl, events: [event("made", at - HOUR), event("finish", at)] });

  it("averages finished bottles over the last 7 days", () => {
    const bottles = [finished(now - HOUR, 120), finished(now - 3 * 24 * HOUR, 100), finished(now - 6 * 24 * HOUR, 80)];
    expect(averageIntake(bottles, now)).toEqual({ perDay: 43, perFeed: 100 });
  });

  it("skips older, unmeasured and discarded bottles", () => {
    const discarded = { amountMl: 90, events: [event("made", now - 2 * HOUR), event("discard", now - HOUR)] };
    const bottles = [finished(now - HOUR, 140), finished(now - 2 * HOUR), finished(now - 8 * 24 * HOUR, 200), discarded];
    expect(averageIntake(bottles, now)).toEqual({ perDay: 20, perFeed: 140 });
  });

  it("uses the last 7 days with data after a break", () => {
    const bottles = [finished(now - HOUR, 120), finished(now - 6 * 24 * HOUR, 90), finished(now - 9 * 24 * HOUR, 200)];
    expect(averageIntake(bottles, now + 30 * 24 * HOUR)).toEqual({ perDay: 30, perFeed: 105 });
  });

  it("is unknown without any measured bottle", () => {
    expect(averageIntake([finished(now - HOUR)], now)).toBeNull();
  });
});

describe("nextFeedingWindow", () => {
  const fedBottle = (at: number) => ({ events: [event("feed", at)] });

  it("is null before any feeding", () => {
    expect(nextFeedingWindow([], 10, 0)).toBeNull();
  });

  it("falls back to the age-based interval without a rhythm", () => {
    expect(nextFeedingWindow([fedBottle(0)], 10, HOUR)).toEqual({ lastFedAt: 0, from: 2 * HOUR, to: 3 * HOUR });
  });

  it("is null without a rhythm or an age", () => {
    expect(nextFeedingWindow([fedBottle(0)], null, HOUR)).toBeNull();
  });
});

describe("burpEndsAt", () => {
  it("runs for 15 minutes after the latest finish", () => {
    const finished = { events: [event("feed", 0), event("finish", HOUR)] };
    expect(burpEndsAt([finished], HOUR + 60000)).toBe(HOUR + 15 * 60000);
    expect(burpEndsAt([finished], HOUR + 15 * 60000)).toBeNull();
    expect(burpEndsAt([{ events: [event("feed", 0)] }], 60000)).toBeNull();
  });
});
