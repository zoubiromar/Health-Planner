import { addDays, weekSunday } from "./dates";
import { rowsForDate } from "./schedule";
import type { PlannerState, StockPile } from "./types";

export const PLAN_YEAR_DAYS = 365;

export interface ShopLine {
  id: string;
  name: string;
  quantity: string;
  note: string;
  kind: "food" | "refill";
  stockId?: string;
  add?: number;
  week?: string;
}

export function planYearEnd(planStart: string): string {
  return addDays(planStart, PLAN_YEAR_DAYS - 1);
}

export function yearWeeks(planStart: string): string[] {
  const last = weekSunday(planYearEnd(planStart));
  const weeks: string[] = [];
  let cursor = weekSunday(planStart);
  while (cursor <= last) {
    weeks.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function planDaysInWeek(planStart: string, weekStart: string): string[] {
  const end = planYearEnd(planStart);
  const days: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    const iso = addDays(weekStart, index);
    if (iso >= planStart && iso <= end) days.push(iso);
  }
  return days;
}

export function snackLines(planStart: string, weekStart: string): ShopLine[] {
  const days = planDaysInWeek(planStart, weekStart);
  if (days.length === 0) return [];
  const cups = days.length;
  return [
    {
      id: "yogurt",
      name: "Yogurt",
      quantity: cups === 1 ? "1 cup" : `${cups} cups`,
      note: "One cup on each plan day, with breakfast.",
      kind: "food",
    },
    {
      id: "apricots",
      name: "Dried apricots",
      quantity: "1 bag",
      note: "The mid-morning snack.",
      kind: "food",
    },
    {
      id: "almonds",
      name: "Almonds",
      quantity: "1 bag",
      note: "With the dried fruit, and a few with the vitamin D.",
      kind: "food",
    },
    {
      id: "chocolate",
      name: "Dark chocolate",
      quantity: "1 bar",
      note: "A couple of squares with the afternoon snack.",
      kind: "food",
    },
    {
      id: "mint",
      name: "Moroccan mint",
      quantity: "1 bunch",
      note: "For the morning tea.",
      kind: "food",
    },
  ];
}

export function weekUseNote(cups: number): string {
  const yogurt = cups === 1 ? "1 cup" : `${cups} cups`;
  return `Yogurt is ${yogurt} this week, one with breakfast on each plan day so the vitamin D has food with it. Dried apricots and almonds are the mid-morning snack. Dark chocolate is a couple of squares in the afternoon. Mint is the morning tea. Coconut oil, zaatar, fenugreek, and clove are already in the kitchen, so they stay off this list.`;
}

export function projectRefills(state: PlannerState, today: string): ShopLine[] {
  if (state.blank) return [];
  const end = planYearEnd(state.planStart);
  let cursor = today < state.planStart ? state.planStart : today;
  if (cursor > end) return [];

  const simulated = new Map<string, number>();
  const eligible = new Map<string, StockPile>();
  for (const pile of state.piles) {
    if (!canProject(pile) || pile.count === null) continue;
    simulated.set(pile.id, pile.count);
    eligible.set(pile.id, pile);
  }

  let perfectilContinue = state.perfectilContinue;
  const totals = new Map<string, ShopLine>();

  while (cursor <= end) {
    const due = rowsForDate({ ...state, perfectilContinue }, cursor).filter(
      (row) =>
        row.status === "due" &&
        row.item.consume > 0 &&
        row.item.stockId !== undefined &&
        eligible.has(row.item.stockId),
    );
    const week = weekSunday(cursor);
    for (const row of due) {
      const stockId = row.item.stockId as string;
      const pile = eligible.get(stockId);
      if (!pile) continue;
      let count = simulated.get(stockId) ?? 0;
      const consume = row.item.consume;
      if (count < consume) {
        count += pile.bottleSize;
        rememberBottle(totals, week, pile);
        if (stockId === "perfectil") perfectilContinue = true;
      }
      count -= consume;
      if (count <= 0) {
        count += pile.bottleSize;
        rememberBottle(totals, week, pile);
        if (stockId === "perfectil") perfectilContinue = true;
      }
      simulated.set(stockId, count);
    }
    cursor = addDays(cursor, 1);
  }

  return [...totals.values()];
}

export function groceryKey(week: string, id: string): string {
  return `${week}:${id}`;
}

function canProject(pile: StockPile): boolean {
  if (!pile.tracked || pile.kitchen || pile.paused) return false;
  if (pile.count === null || pile.bottleSize <= 0) return false;
  if (pile.id === "zinc") return false;
  if (/selenium|vittofer|\biron\b/i.test(pile.name)) return false;
  return true;
}

function rememberBottle(totals: Map<string, ShopLine>, week: string, pile: StockPile): void {
  const key = `${week}:${pile.id}`;
  const existing = totals.get(key);
  if (existing) {
    const add = (existing.add ?? 0) + pile.bottleSize;
    const bottles = add / pile.bottleSize;
    totals.set(key, { ...existing, add, quantity: bottleLabel(bottles, pile) });
    return;
  }
  totals.set(key, {
    id: `refill-${pile.id}`,
    name: pile.name,
    quantity: bottleLabel(1, pile),
    note: "The count runs out this week.",
    kind: "refill",
    stockId: pile.id,
    add: pile.bottleSize,
    week,
  });
}

function bottleLabel(bottles: number, pile: StockPile): string {
  const noun = bottles === 1 ? "bottle" : "bottles";
  return `${bottles} ${noun} · ${pile.bottleSize} ${pile.unit}`;
}
