import { describe, expect, it } from "vitest";
import {
  FEEDING_LIMIT,
  FRIDGE_LIMIT,
  HOUR,
  ROOM_LIMIT,
  allowedActions,
  applyAction,
  isExpired,
  newBottle,
} from "./spoil";

const T0 = Date.UTC(2026, 10, 15, 8, 0, 0);

describe("newBottle", () => {
  it("starts at room temperature with a 2h limit", () => {
    const b = newBottle(T0);
    expect(b.status).toBe("room");
    expect(b.spoilsAt).toBe(T0 + ROOM_LIMIT);
  });
});

describe("fridge", () => {
  it("extends the limit to 24h from when it was made", () => {
    const b = applyAction(newBottle(T0), "fridge_in", T0 + HOUR);
    expect(b.status).toBe("fridge");
    expect(b.spoilsAt).toBe(T0 + FRIDGE_LIMIT);
  });

  it("gives 2h after taking it out", () => {
    const inFridge = applyAction(newBottle(T0), "fridge_in", T0);
    const out = applyAction(inFridge, "fridge_out", T0 + 5 * HOUR);
    expect(out.status).toBe("room");
    expect(out.wasRefrigeratedOut).toBe(true);
    expect(out.spoilsAt).toBe(T0 + 7 * HOUR);
  });

  it("caps the out-of-fridge time at the 24h limit", () => {
    const inFridge = applyAction(newBottle(T0), "fridge_in", T0);
    const out = applyAction(inFridge, "fridge_out", T0 + 23 * HOUR);
    expect(out.spoilsAt).toBe(T0 + FRIDGE_LIMIT);
  });

  it("does not allow going back into the fridge after being taken out", () => {
    const out = applyAction(applyAction(newBottle(T0), "fridge_in", T0), "fridge_out", T0 + HOUR);
    expect(allowedActions(out, T0 + HOUR)).not.toContain("fridge_in");
    expect(() => applyAction(out, "fridge_in", T0 + HOUR)).toThrow();
  });
});

describe("feeding", () => {
  it("gives 1h once feeding starts", () => {
    const b = applyAction(newBottle(T0), "feed", T0 + 10 * 60 * 1000);
    expect(b.status).toBe("feeding");
    expect(b.spoilsAt).toBe(T0 + 10 * 60 * 1000 + FEEDING_LIMIT);
  });

  it("never extends past the existing limit", () => {
    const b = applyAction(newBottle(T0), "feed", T0 + 90 * 60 * 1000);
    expect(b.spoilsAt).toBe(T0 + ROOM_LIMIT);
  });

  it("can start straight from the fridge", () => {
    const b = applyAction(applyAction(newBottle(T0), "fridge_in", T0), "feed", T0 + 3 * HOUR);
    expect(b.spoilsAt).toBe(T0 + 4 * HOUR);
  });

  it("cannot be refrigerated while feeding", () => {
    const b = applyAction(newBottle(T0), "feed", T0);
    expect(allowedActions(b, T0)).toEqual(["finish", "discard"]);
  });
});

describe("expiry", () => {
  it("only allows discarding once expired", () => {
    const b = newBottle(T0);
    const later = T0 + ROOM_LIMIT;
    expect(isExpired(b, later)).toBe(true);
    expect(allowedActions(b, later)).toEqual(["discard"]);
    expect(() => applyAction(b, "fridge_in", later)).toThrow();
  });
});

describe("ending", () => {
  it("records finish and discard reasons", () => {
    expect(applyAction(newBottle(T0), "finish", T0)).toMatchObject({ status: "done", endReason: "finished", spoilsAt: null });
    expect(applyAction(newBottle(T0), "discard", T0)).toMatchObject({ status: "done", endReason: "discarded" });
  });

  it("allows nothing after done", () => {
    const b = applyAction(newBottle(T0), "finish", T0);
    expect(allowedActions(b, T0)).toEqual([]);
    expect(isExpired(b, T0 + 100 * HOUR)).toBe(false);
  });
});
