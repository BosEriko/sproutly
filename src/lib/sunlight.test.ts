import { describe, expect, it } from "vitest";
import { dateKey, formatDateKey, isDateKey } from "./sunlight";

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
