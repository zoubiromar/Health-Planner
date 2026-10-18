import { checkKey, weekSunday } from "./dates";
import { createStarter, magnesium300Pile } from "./plan";
import { pileFor, rowsForDate } from "./schedule";
import type { DayView, PlannerState, SlotId } from "./types";

export type Action =
  | { type: "toggle-check"; date: string; itemId: string }
  | { type: "set-count"; stockId: string; count: number }
  | { type: "set-in-stock"; stockId: string; inStock: boolean }
  | { type: "set-paused"; stockId: string; paused: boolean }
  | { type: "set-slot-time"; slotId: SlotId; time: string }
  | { type: "set-profile"; profile: Partial<PlannerState["profile"]> }
  | { type: "add-weight"; date: string; kg: number }
  | { type: "dismiss-disclaimer" }
  | { type: "answer-minoxidil"; answer: "yes" | "no" }
  | { type: "set-day-view"; view: DayView }
  | { type: "toggle-grocery"; week: string; id: string }
  | { type: "buy-refill"; week: string; stockId: string; add: number }
  | { type: "toggle-food"; id: string }
  | { type: "restock"; stockId: string; add: number }
  | { type: "set-lab-done"; done: boolean }
  | { type: "buy-optional"; id: string; add: number }
  | { type: "add-item"; name: string; dose: string; slotId: SlotId; count: number | null }
  | { type: "start-blank" }
  | { type: "restore-starter" }
  | { type: "sync-food-week"; today: string };

function mapPile(
  state: PlannerState,
  stockId: string,
  update: (pile: PlannerState["piles"][number]) => PlannerState["piles"][number],
): PlannerState {
  return {
    ...state,
    piles: state.piles.map((pile) => (pile.id === stockId ? update(pile) : pile)),
  };
}

export function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "toggle-check": {
      const row = rowsForDate(state, action.date).find((entry) => entry.item.id === action.itemId);
      if (!row || row.status !== "due") return state;

      const key = checkKey(action.date, action.itemId);
      const wasChecked = Boolean(state.checks[key]);
      const checks = { ...state.checks, [key]: !wasChecked };
      let next: PlannerState = { ...state, checks };

      if (row.item.stockId && row.item.consume > 0) {
        const owned = pileFor(state, row.item);
        if (owned && owned.count !== null) {
          const delta = wasChecked ? row.item.consume : -row.item.consume;
          next = mapPile(next, owned.id, (pile) => ({
            ...pile,
            count: Math.max(0, (pile.count ?? 0) + delta),
          }));
        }
      }
      return next;
    }
    case "set-count": {
      if (!Number.isFinite(action.count) || action.count < 0) return state;
      return mapPile(state, action.stockId, (pile) => ({
        ...pile,
        count: Math.round(action.count),
      }));
    }
    case "set-in-stock":
      return mapPile(state, action.stockId, (pile) => ({ ...pile, inStock: action.inStock }));
    case "set-paused":
      return mapPile(state, action.stockId, (pile) => ({ ...pile, paused: action.paused }));
    case "set-slot-time": {
      if (!/^\d{2}:\d{2}$/.test(action.time)) return state;
      return {
        ...state,
        slots: state.slots.map((slot) =>
          slot.id === action.slotId ? { ...slot, time: action.time } : slot,
        ),
      };
    }
    case "set-profile": {
      const profile = { ...state.profile, ...action.profile };
      if (profile.age <= 0 || profile.heightCm <= 0 || profile.weightKg <= 0) return state;
      return { ...state, profile };
    }
    case "add-weight": {
      if (!Number.isFinite(action.kg) || action.kg <= 0) return state;
      const week = weekSunday(action.date);
      const weights = state.weights.filter((entry) => weekSunday(entry.date) !== week);
      weights.push({ date: action.date, kg: action.kg });
      weights.sort((a, b) => (a.date < b.date ? -1 : 1));
      return {
        ...state,
        weights,
        profile: { ...state.profile, weightKg: action.kg },
      };
    }
    case "dismiss-disclaimer":
      return { ...state, disclaimerSeen: true };
    case "set-day-view":
      if (action.view !== "timeline" && action.view !== "week") return state;
      return { ...state, dayView: action.view };
    case "toggle-grocery": {
      const key = `${action.week}:${action.id}`;
      return {
        ...state,
        groceryChecks: { ...state.groceryChecks, [key]: !state.groceryChecks[key] },
      };
    }
    case "buy-refill": {
      if (!Number.isFinite(action.add) || action.add <= 0) return state;
      const next = reducer(state, { type: "restock", stockId: action.stockId, add: action.add });
      const key = `${action.week}:refill-${action.stockId}`;
      return {
        ...next,
        groceryChecks: { ...next.groceryChecks, [key]: true },
      };
    }
    case "answer-minoxidil": {
      if (action.answer === "no") {
        return mapPile({ ...state, minoxidil: "no" }, "minoxidil", (pile) => ({
          ...pile,
          paused: true,
          inStock: false,
        }));
      }
      return mapPile({ ...state, minoxidil: "yes" }, "minoxidil", (pile) => ({
        ...pile,
        paused: false,
        inStock: true,
      }));
    }
    case "toggle-food":
      return {
        ...state,
        foods: state.foods.map((food) =>
          food.id === action.id ? { ...food, bought: !food.bought } : food,
        ),
      };
    case "restock": {
      if (!Number.isFinite(action.add) || action.add <= 0) return state;
      let next = mapPile(state, action.stockId, (pile) => ({
        ...pile,
        count: (pile.count ?? 0) + Math.round(action.add),
        inStock: true,
      }));
      if (action.stockId === "perfectil") next = { ...next, perfectilContinue: true };
      return next;
    }
    case "set-lab-done":
      return { ...state, labDone: action.done };
    case "buy-optional": {
      const offer = state.optionalBuys.find((buy) => buy.id === action.id);
      if (!offer || !Number.isFinite(action.add) || action.add <= 0) return state;
      const add = Math.round(action.add);
      if (offer.kind === "perfectil") {
        return reducer(state, { type: "restock", stockId: "perfectil", add });
      }
      const existing = state.piles.find((pile) => pile.id === "magnesium300");
      if (!existing) {
        return { ...state, piles: [...state.piles, magnesium300Pile(add)] };
      }
      return mapPile(state, "magnesium300", (pile) => ({
        ...pile,
        count: (pile.count ?? 0) + add,
        inStock: true,
      }));
    }
    case "add-item": {
      const name = action.name.trim();
      if (!name) return state;
      const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${state.items.length + 1}`;
      const tracked = action.count !== null;
      const item = {
        id,
        stockId: tracked ? id : undefined,
        slotId: action.slotId,
        name,
        dose: action.dose.trim() || "As you choose",
        note: "Added on this device.",
        consume: tracked ? 1 : 0,
        rule: "daily" as const,
        order: 10,
        custom: true,
      };
      const piles = tracked
        ? [
            ...state.piles,
            {
              id,
              name,
              unit: "doses",
              count: Math.max(0, Math.round(action.count ?? 0)),
              bottleSize: Math.max(1, Math.round(action.count ?? 1)),
              inStock: true,
              paused: false,
              pauseReason: "",
              lowAt: 7,
              tracked: true,
              kitchen: false,
              dailyUse: 1,
            },
          ]
        : state.piles;
      return { ...state, blank: false, items: [...state.items, item], piles };
    }
    case "start-blank":
      return {
        ...createStarter(),
        blank: true,
        items: [],
        piles: [],
        foods: [],
        optionalBuys: [],
        checks: {},
        labDone: false,
        minoxidil: "unanswered",
        perfectilContinue: false,
        dayView: state.dayView,
        disclaimerSeen: state.disclaimerSeen,
        weights: state.weights,
        profile: state.profile,
        slots: state.slots,
        foodWeek: state.foodWeek,
      };
    case "restore-starter": {
      const starter = createStarter();
      return {
        ...starter,
        disclaimerSeen: state.disclaimerSeen,
        weights: state.weights.length > 0 ? state.weights : starter.weights,
        profile: state.profile,
        dayView: state.dayView,
      };
    }
    case "sync-food-week": {
      const sunday = weekSunday(action.today);
      if (sunday === state.foodWeek) return state;
      return {
        ...state,
        foodWeek: sunday,
        foods: state.foods.map((food) => ({ ...food, bought: false })),
      };
    }
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}
