export type Status = "room" | "fridge" | "feeding" | "done";
export type Action =
  | "fridge_in"
  | "fridge_out"
  | "feed"
  | "finish"
  | "discard";
export type EndReason = "finished" | "discarded";

export interface BottleState {
  status: Status;
  madeAt: number;
  spoilsAt: number | null;
  wasRefrigeratedOut: boolean;
  endReason?: EndReason;
}

export const HOUR = 60 * 60 * 1000;
export const ROOM_LIMIT = 2 * HOUR;
export const FRIDGE_LIMIT = 24 * HOUR;
export const FEEDING_LIMIT = 1 * HOUR;

export const ACTION_LABELS: Record<Action, string> = {
  fridge_in: "Put in fridge",
  fridge_out: "Take out of fridge",
  feed: "Started feeding",
  finish: "Finished",
  discard: "Discard",
};

export function newBottle(madeAt: number): BottleState {
  return {
    status: "room",
    madeAt,
    spoilsAt: madeAt + ROOM_LIMIT,
    wasRefrigeratedOut: false,
  };
}

export function isExpired(bottle: BottleState, now: number): boolean {
  return bottle.status !== "done" && bottle.spoilsAt !== null && now >= bottle.spoilsAt;
}

export function allowedActions(bottle: BottleState, now: number): Action[] {
  if (bottle.status === "done") return [];
  if (isExpired(bottle, now)) return ["discard"];

  const actions: Action[] = [];
  if (bottle.status === "room" && !bottle.wasRefrigeratedOut) actions.push("fridge_in");
  if (bottle.status === "fridge") actions.push("fridge_out");
  if (bottle.status === "room" || bottle.status === "fridge") actions.push("feed");
  actions.push("finish", "discard");
  return actions;
}

export function applyAction(bottle: BottleState, action: Action, now: number): BottleState {
  if (!allowedActions(bottle, now).includes(action)) {
    throw new Error(`Action "${action}" is not allowed while bottle is ${bottle.status}`);
  }

  switch (action) {
    case "fridge_in":
      return { ...bottle, status: "fridge", spoilsAt: bottle.madeAt + FRIDGE_LIMIT };
    case "fridge_out":
      return {
        ...bottle,
        status: "room",
        wasRefrigeratedOut: true,
        spoilsAt: Math.min(bottle.madeAt + FRIDGE_LIMIT, now + ROOM_LIMIT),
      };
    case "feed":
      return {
        ...bottle,
        status: "feeding",
        spoilsAt: Math.min(bottle.spoilsAt ?? Infinity, now + FEEDING_LIMIT),
      };
    case "finish":
      return { ...bottle, status: "done", spoilsAt: null, endReason: "finished" };
    case "discard":
      return { ...bottle, status: "done", spoilsAt: null, endReason: "discarded" };
  }
}
