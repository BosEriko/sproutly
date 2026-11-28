import { describe, expect, it } from "vitest";
import { describeChange, parseProfile, profileChanges } from "./profileHistory";

const baby = { name: "Ana", birthday: "2026-11-01", weightKg: 3.2, heightCm: 50 };

describe("profileChanges", () => {
  it("lists only the fields that changed", () => {
    expect(profileChanges(baby, { ...baby, weightKg: 3.5 })).toEqual([{ field: "weightKg", from: 3.2, to: 3.5 }]);
    expect(profileChanges(baby, baby)).toEqual([]);
  });

  it("treats a missing profile as empty", () => {
    expect(profileChanges(null, { ...baby, heightCm: null })).toEqual([
      { field: "name", from: null, to: "Ana" },
      { field: "birthday", from: null, to: "2026-11-01" },
      { field: "weightKg", from: null, to: 3.2 },
    ]);
  });
});

describe("parseProfile", () => {
  it("accepts a valid profile and trims the name", () => {
    expect(parseProfile({ ...baby, name: "  Ana " })).toEqual(baby);
    expect(parseProfile({ name: "Ana", birthday: null, weightKg: null, heightCm: null })).not.toBeNull();
  });

  it("rejects bad values", () => {
    expect(parseProfile({ ...baby, name: " " })).toBeNull();
    expect(parseProfile({ ...baby, birthday: "Nov 1" })).toBeNull();
    expect(parseProfile({ ...baby, weightKg: -1 })).toBeNull();
    expect(parseProfile({ ...baby, heightCm: "50" })).toBeNull();
  });
});

describe("describeChange", () => {
  it("reads naturally for set, changed and cleared values", () => {
    expect(describeChange({ field: "weightKg", from: null, to: 3.2 })).toBe("Weight set to 3.2 kg");
    expect(describeChange({ field: "weightKg", from: 3.2, to: 3.5 })).toBe("Weight 3.2 kg → 3.5 kg");
    expect(describeChange({ field: "heightCm", from: 50, to: null })).toBe("Height cleared");
    expect(describeChange({ field: "birthday", from: null, to: "2026-11-01" })).toBe("Birthday set to Nov 1, 2026");
  });
});
