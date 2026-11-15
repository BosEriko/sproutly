import { describe, expect, it } from "vitest";
import { daysAgoLabel } from "./bath";

const at = (day: number, hour: number) => new Date(2026, 10, day, hour).getTime();

describe("daysAgoLabel", () => {
  it("uses calendar days, not 24-hour blocks", () => {
    expect(daysAgoLabel(at(16, 1), at(16, 23))).toBe("Today");
    expect(daysAgoLabel(at(15, 23), at(16, 1))).toBe("Yesterday");
    expect(daysAgoLabel(at(13, 12), at(16, 9))).toBe("3 days ago");
  });
});
