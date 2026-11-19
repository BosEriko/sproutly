import { describe, expect, it } from "vitest";
import { changesToday, countDiapers, hasPoop, isDiaperKind, isPoopSize, type DiaperChange } from "./diaper";

const at = (h: number, day = 16) => new Date(2026, 10, day, h).getTime();
const change = (kind: DiaperChange["kind"], time: number): DiaperChange => ({ id: `${kind}-${time}`, kind, at: time });

describe("changesToday", () => {
  it("keeps only changes since local midnight", () => {
    const changes = [change("wet", at(23, 15)), change("dirty", at(1)), change("both", at(9))];
    expect(changesToday(changes, new Date(at(10))).map((c) => c.kind)).toEqual(["dirty", "both"]);
  });
});

describe("countDiapers", () => {
  it("counts a both change as wet and dirty", () => {
    expect(countDiapers([change("wet", 1), change("dirty", 2), change("both", 3), change("wet", 4)])).toEqual({
      wet: 3,
      dirty: 2,
    });
  });
});

describe("isDiaperKind", () => {
  it("only accepts known kinds", () => {
    expect(isDiaperKind("wet")).toBe(true);
    expect(isDiaperKind("both")).toBe(true);
    expect(isDiaperKind("sticky")).toBe(false);
    expect(isDiaperKind(undefined)).toBe(false);
  });
});

describe("isPoopSize", () => {
  it("only accepts small, medium and large", () => {
    expect(isPoopSize("small")).toBe(true);
    expect(isPoopSize("large")).toBe(true);
    expect(isPoopSize("huge")).toBe(false);
    expect(isPoopSize(undefined)).toBe(false);
  });
});

describe("hasPoop", () => {
  it("is true for dirty and both", () => {
    expect(hasPoop("wet")).toBe(false);
    expect(hasPoop("dirty")).toBe(true);
    expect(hasPoop("both")).toBe(true);
  });
});
