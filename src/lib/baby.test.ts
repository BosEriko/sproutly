import { describe, expect, it } from "vitest";
import { ageLabel } from "./baby";

const on = (y: number, m: number, d: number) => new Date(y, m - 1, d, 15, 30);

describe("ageLabel", () => {
  it("handles the first days", () => {
    expect(ageLabel("2026-11-16", on(2026, 11, 16))).toBe("Born today");
    expect(ageLabel("2026-11-15", on(2026, 11, 16))).toBe("1 day old");
    expect(ageLabel("2026-11-10", on(2026, 11, 16))).toBe("6 days old");
  });

  it("uses weeks and days in the first month", () => {
    expect(ageLabel("2026-11-02", on(2026, 11, 16))).toBe("2 weeks old");
    expect(ageLabel("2026-10-27", on(2026, 11, 16))).toBe("2 weeks, 6 days old");
  });

  it("uses months and weeks until two years", () => {
    expect(ageLabel("2026-08-16", on(2026, 11, 16))).toBe("3 months old");
    expect(ageLabel("2026-08-01", on(2026, 11, 16))).toBe("3 months, 2 weeks old");
    expect(ageLabel("2026-08-20", on(2026, 11, 16))).toBe("2 months, 3 weeks old");
  });

  it("uses years and months after two years", () => {
    expect(ageLabel("2024-11-16", on(2026, 11, 16))).toBe("2 years old");
    expect(ageLabel("2023-06-01", on(2026, 11, 16))).toBe("3 years, 5 months old");
  });

  it("handles future birthdays", () => {
    expect(ageLabel("2026-12-01", on(2026, 11, 16))).toBe("Not born yet");
  });
});
