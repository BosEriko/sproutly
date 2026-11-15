import { describe, expect, it } from "vitest";
import { dateKey, formatDateKey, isDateKey, isSunMinutes } from "./sunlight";

describe("dateKey", () => {
  it("uses the local calendar date", () => {
    expect(dateKey(new Date(2026, 10, 16, 0, 5).getTime())).toBe("2026-11-16");
    expect(dateKey(new Date(2026, 0, 3, 23, 59).getTime())).toBe("2026-01-03");
  });
});

describe("formatDateKey", () => {
  it("formats the date without shifting time zones", () => {
    expect(formatDateKey("2026-11-16")).toBe("Mon, Nov 16");
  });
});

describe("isDateKey", () => {
  it("only accepts YYYY-MM-DD", () => {
    expect(isDateKey("2026-11-16")).toBe(true);
    expect(isDateKey("2026-11-16T00:00")).toBe(false);
    expect(isDateKey("../x")).toBe(false);
    expect(isDateKey(5)).toBe(false);
  });
});

describe("isSunMinutes", () => {
  it("accepts whole minutes from 0 to 30", () => {
    expect(isSunMinutes(0)).toBe(true);
    expect(isSunMinutes(30)).toBe(true);
    expect(isSunMinutes(31)).toBe(false);
    expect(isSunMinutes(2.5)).toBe(false);
    expect(isSunMinutes("5")).toBe(false);
  });
});
