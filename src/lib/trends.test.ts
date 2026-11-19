import { describe, expect, it } from "vitest";
import { formatHour, hourlyLikelihood, peakHours, perDay } from "./trends";

const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();
const now = at(18, 23);

describe("hourlyLikelihood", () => {
  it("counts days with an event in each hour over the last 7 days", () => {
    const result = hourlyLikelihood([at(18, 8), at(18, 8, 30), at(17, 8), at(16, 14), at(1, 8)], now);
    expect(result).toHaveLength(24);
    expect(result[8]).toBeCloseTo(2 / 7);
    expect(result[14]).toBeCloseTo(1 / 7);
    expect(result[9]).toBe(0);
  });
});

describe("peakHours", () => {
  it("picks the strongest hours, skipping neighbours, in clock order", () => {
    const likelihood = Array.from({ length: 24 }, () => 0);
    likelihood[8] = 0.9;
    likelihood[9] = 0.8;
    likelihood[14] = 0.5;
    likelihood[23] = 0.4;
    likelihood[0] = 0.3;
    expect(peakHours(likelihood)).toEqual([8, 14, 23]);
  });

  it("ignores hours with no events", () => {
    expect(peakHours(Array.from({ length: 24 }, () => 0))).toEqual([]);
  });
});

describe("formatHour", () => {
  it("uses 12-hour labels", () => {
    expect(formatHour(0)).toBe("12 AM");
    expect(formatHour(8)).toBe("8 AM");
    expect(formatHour(12)).toBe("12 PM");
    expect(formatHour(21)).toBe("9 PM");
  });
});

describe("perDay", () => {
  it("averages over 7 days to one decimal", () => {
    expect(perDay(50)).toBe(7.1);
  });
});
