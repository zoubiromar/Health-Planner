import { addDays, checkKey, daysBetween, minutesFromTime, weekday } from "./dates";
import {
  ASHWAGANDHA_ON_DAYS,
  ASHWAGANDHA_PAUSE_DAYS,
  FORCAPIL_REVIEW,
  LAB_DATE,
  PERFECTIL_DOSES,
  type DueRow,
  type Focus,
  type Phase,
  type PlanItem,
  type PlannerState,
  type Slot,
  type StockPile,
} from "./types";

export function isAnchorDay(planStart: string, iso: string): boolean {
  const offset = daysBetween(planStart, iso);
  return offset >= 0 && offset % 2 === 0;
}

export function perfectilDoseNumber(planStart: string, iso: string): number | null {
  const offset = daysBetween(planStart, iso);
  if (offset < 0 || offset % 2 === 0) return null;
  return (offset + 1) / 2;
}

export function ashwagandhaWindow(planStart: string, iso: string): "before" | "on" | "paused" {
  const offset = daysBetween(planStart, iso);
  if (offset < 0) return "before";
  const pauseStart = ASHWAGANDHA_ON_DAYS;
  const pauseEnd = ASHWAGANDHA_ON_DAYS + ASHWAGANDHA_PAUSE_DAYS - 1;
  if (offset >= pauseStart && offset <= pauseEnd) return "paused";
  return "on";
}

export function isStrengthDay(iso: string): boolean {
  const day = weekday(iso);
  return day === 1 || day === 3 || day === 6;
}

export function pileFor(state: PlannerState, item: PlanItem): StockPile | undefined {
  if (!item.stockId) return undefined;
  return state.piles.find((pile) => pile.id === item.stockId);
}

export function matchesRule(state: PlannerState, item: PlanItem, iso: string): boolean {
  const owned = pileFor(state, item);
  if (owned?.paused) return false;
  if (item.rule === "minoxidil" && state.minoxidil !== "yes") return false;

  switch (item.rule) {
    case "daily":
    case "jamieson":
    case "minoxidil":
      return true;
    case "strength":
      return isStrengthDay(iso);
    case "forcapil":
    case "zinc":
      return isAnchorDay(state.planStart, iso);
    case "perfectil": {
      const doseNumber = perfectilDoseNumber(state.planStart, iso);
      if (doseNumber === null) return false;
      return doseNumber <= PERFECTIL_DOSES || state.perfectilContinue;
    }
    case "ashwagandha":
      return ashwagandhaWindow(state.planStart, iso) !== "before";
    default:
      return false;
  }
}

export function rowsForDate(state: PlannerState, iso: string): DueRow[] {
  if (state.blank) return [];

  return state.items
    .filter((item) => matchesRule(state, item, iso))
    .map((item) => decorate(state, item, iso))
    .sort((a, b) => a.item.order - b.item.order);
}

function decorate(state: PlannerState, item: PlanItem, iso: string): DueRow {
  if (item.rule === "ashwagandha" && ashwagandhaWindow(state.planStart, iso) === "paused") {
    return { item, status: "paused-window" };
  }

  const owned = pileFor(state, item);
  if (owned && !owned.kitchen && !owned.inStock) {
    return { item, status: "muted" };
  }

  const reviewNote =
    item.rule === "forcapil" && iso >= FORCAPIL_REVIEW
      ? "The 18 January review has passed. This stays on the plan until you pause it."
      : undefined;

  return { item, status: "due", reviewNote };
}

export function rowWarning(state: PlannerState, item: PlanItem): string | null {
  const jamiesonOn = state.piles.some((pile) => pile.id === "jamieson" && !pile.paused);
  const magnesiumOn = state.piles.some((pile) => pile.id === "magnesium" && !pile.paused);

  if (item.id === "jamieson" && magnesiumOn) {
    return "The evening magnesium is also on. Together these are a lot of magnesium.";
  }
  if (item.id === "magnesium" && jamiesonOn) {
    return "Jamieson is also on. Three caplets already contain 450 mg of magnesium.";
  }
  if (item.id === "zinc" && jamiesonOn) {
    return "Jamieson already contains zinc. Using both stacks zinc.";
  }
  if (item.id === "zinc") {
    return "50 mg is above the usual daily upper limit. Take it with dinner, every other day, and stop if it causes nausea.";
  }
  return null;
}

export function isRunningLow(pile: StockPile): boolean {
  return (
    pile.tracked &&
    !pile.paused &&
    pile.inStock &&
    pile.count !== null &&
    pile.count > 0 &&
    pile.count <= pile.lowAt
  );
}

export function daysOfSupply(pile: StockPile): number | null {
  if (!pile.tracked || pile.count === null || pile.dailyUse <= 0) return null;
  return Math.floor(pile.count / pile.dailyUse);
}

export function refillPiles(state: PlannerState): StockPile[] {
  if (state.blank) return [];
  return state.piles.filter((pile) => {
    if (!pile.tracked || pile.paused || pile.kitchen) return false;
    if (pile.id === "perfectil" || pile.id === "magnesium300") return false;
    const low = pile.count !== null && pile.count <= pile.lowAt;
    return !pile.inStock || low;
  });
}

export function progress(
  rows: DueRow[],
  checks: Record<string, boolean>,
  date: string,
): { done: number; total: number } {
  const actionable = rows.filter((row) => row.status === "due");
  const done = actionable.filter((row) => checks[checkKey(date, row.item.id)]).length;
  return { done, total: actionable.length };
}

export function focusItem(
  rows: DueRow[],
  checks: Record<string, boolean>,
  slots: Slot[],
  date: string,
  nowMinutes: number,
): Focus {
  const ordered = [...slots].sort(
    (a, b) => minutesFromTime(a.time) - minutesFromTime(b.time),
  );
  let currentIndex = 0;
  ordered.forEach((slot, index) => {
    if (minutesFromTime(slot.time) <= nowMinutes) currentIndex = index;
  });

  for (let index = currentIndex; index < ordered.length; index += 1) {
    const slot = ordered[index];
    const pending = rows.find(
      (row) =>
        row.item.slotId === slot.id &&
        row.status === "due" &&
        !checks[checkKey(date, row.item.id)],
    );
    if (pending) {
      return {
        kind: "item",
        item: pending.item,
        slot,
        waiting: minutesFromTime(slot.time) > nowMinutes,
      };
    }
  }

  return { kind: "done", slot: ordered[currentIndex] ?? ordered[0] };
}

export function phases(planStart: string): Phase[] {
  const pauseStart = addDays(planStart, ASHWAGANDHA_ON_DAYS);
  const pauseEnd = addDays(pauseStart, ASHWAGANDHA_PAUSE_DAYS - 1);
  const perfectilEnd = addDays(planStart, PERFECTIL_DOSES * 2 - 1);

  return [
    {
      id: "rebuild",
      title: "Rebuild appetite",
      start: planStart,
      end: addDays(planStart, ASHWAGANDHA_ON_DAYS - 1),
      detail:
        "Mint tea on waking, small meals on the clock, and capsules only with food. Hunger is not the cue for these eight weeks.",
    },
    {
      id: "ash-pause",
      title: "Ashwagandha pause",
      start: pauseStart,
      end: pauseEnd,
      detail: "Ashwagandha rests for these two weeks. Magnesium stays at night, then ashwagandha returns.",
    },
    {
      id: "alternate",
      title: "Forcapil and Perfectil alternate",
      start: planStart,
      end: perfectilEnd,
      detail:
        "Forcapil, 2 capsules, on one day. Perfectil, 1 capsule, on the next. After this, Forcapil continues alone unless you refill Perfectil.",
    },
    {
      id: "review",
      title: "Forcapil review",
      start: FORCAPIL_REVIEW,
      end: FORCAPIL_REVIEW,
      detail: "Look at hair support on this date. Forcapil stays on the plan until you pause it.",
    },
    {
      id: "lab",
      title: "Repeat the labs",
      start: LAB_DATE,
      end: FORCAPIL_REVIEW,
      detail: "Vitamin D and magnesium. Ask about ferritin before any iron or extra zinc.",
    },
  ];
}

export function phaseIsCurrent(phase: Phase, iso: string): boolean {
  return iso >= phase.start && iso <= phase.end;
}

export function cabinetPiles(state: PlannerState): StockPile[] {
  return state.piles.filter((pile) => {
    if (pile.kitchen) return false;
    if (pile.id === "minoxidil" && state.minoxidil !== "yes") return false;
    if (pile.id === "magnesium300" && (pile.count ?? 0) <= 0) return false;
    return true;
  });
}

export function visibleItemsForSlot(rows: DueRow[], slotId: string): DueRow[] {
  return rows.filter((row) => row.item.slotId === slotId);
}
