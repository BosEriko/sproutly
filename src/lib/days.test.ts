import { describe, expect, it } from "vitest";
import { recentDayKeys, totalsByDay } from "./days";

describe("recentDayKeys", () => {
  it("lists calendar days oldest first, ending today", () => {
    expect(recentDayKeys(new Date(2026, 10, 2, 8).getTime(), 3)).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"]);
  });
});

describe("totalsByDay", () => {
  it("sums values into matching days and ignores others", () => {
    const items = [
      { day: "2026-11-01", ml: 90 },
      { day: "2026-11-01", ml: 60 },
      { day: "2026-10-01", ml: 500 },
    ];
    expect(totalsByDay(items, ["2026-11-01", "2026-11-02"], (i) => i.day, (i) => i.ml)).toEqual([150, 0]);
    expect(totalsByDay(items, ["2026-11-01"], (i) => i.day)).toEqual([2]);
  });
});
