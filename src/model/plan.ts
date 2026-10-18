import { weekSunday } from "./dates";
import {
  PLAN_START,
  PLANNER_REVISION,
  type DayView,
  type FoodNeed,
  type OptionalBuy,
  type PlanItem,
  type PlannerState,
  type Slot,
  type StockPile,
} from "./types";

const slots: Slot[] = [
  {
    id: "wake",
    label: "Wake",
    time: "07:30",
    alert: true,
    period: "Morning",
    alertTitle: "Mint tea and minoxidil",
  },
  {
    id: "breakfast",
    label: "Breakfast",
    time: "08:00",
    alert: true,
    period: "Morning",
    alertTitle: "Breakfast and morning capsules",
  },
  {
    id: "midmorning",
    label: "Mid-morning",
    time: "10:30",
    alert: false,
    period: "Morning",
    alertTitle: "",
  },
  {
    id: "lunch",
    label: "Lunch",
    time: "13:00",
    alert: true,
    period: "Midday",
    alertTitle: "Lunch and hair capsule",
  },
  {
    id: "movement",
    label: "After lunch",
    time: "13:45",
    alert: false,
    period: "Midday",
    alertTitle: "",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    time: "16:30",
    alert: true,
    period: "Evening",
    alertTitle: "Afternoon snack",
  },
  {
    id: "dinner",
    label: "Dinner",
    time: "20:30",
    alert: true,
    period: "Evening",
    alertTitle: "Dinner",
  },
  {
    id: "night",
    label: "Night",
    time: "21:30",
    alert: true,
    period: "Evening",
    alertTitle: "Night capsules",
  },
];

function pile(
  partial: Pick<StockPile, "id" | "name" | "unit" | "count" | "bottleSize" | "dailyUse" | "lowAt"> &
    Partial<StockPile>,
): StockPile {
  return {
    inStock: true,
    paused: false,
    pauseReason: "",
    tracked: true,
    kitchen: false,
    ...partial,
  };
}

const piles: StockPile[] = [
  pile({
    id: "d3",
    name: "Vitamin D3 1000 IU",
    unit: "softgels",
    count: 500,
    bottleSize: 500,
    dailyUse: 2,
    lowAt: 14,
  }),
  pile({
    id: "omega",
    name: "Omega-3",
    unit: "softgels",
    count: 100,
    bottleSize: 100,
    dailyUse: 2,
    lowAt: 14,
  }),
  pile({
    id: "probiotic",
    name: "Probiotic 40 billion",
    unit: "capsules",
    count: 60,
    bottleSize: 60,
    dailyUse: 1,
    lowAt: 7,
  }),
  pile({
    id: "forcapil",
    name: "Forcapil",
    unit: "capsules",
    count: 100,
    bottleSize: 100,
    dailyUse: 1,
    lowAt: 8,
  }),
  pile({
    id: "perfectil",
    name: "Perfectil",
    unit: "capsules",
    count: 15,
    bottleSize: 30,
    dailyUse: 0.5,
    lowAt: 4,
  }),
  pile({
    id: "magnesium",
    name: "Magnesium bisglycinate 200 mg",
    unit: "capsules",
    count: 120,
    bottleSize: 120,
    dailyUse: 0.8,
    lowAt: 7,
  }),
  pile({
    id: "ashwagandha",
    name: "Ashwagandha",
    unit: "capsules",
    count: 100,
    bottleSize: 100,
    dailyUse: 1,
    lowAt: 7,
  }),
  pile({
    id: "zinc",
    name: "Zinc 50 mg",
    unit: "tablets",
    count: 80,
    bottleSize: 80,
    dailyUse: 0.5,
    lowAt: 4,
    paused: true,
    pauseReason:
      "One 50 mg tablet is above the usual daily upper limit, and zinc often causes nausea when appetite is low. The zinc course on the April sheet has finished. Forcapil and Perfectil already carry a smaller mineral dose on the days you take them.",
  }),
  pile({
    id: "jamieson",
    name: "Jamieson Power for Men",
    unit: "caplets",
    count: 30,
    bottleSize: 30,
    dailyUse: 0.6,
    lowAt: 6,
    paused: false,
    inStock: true,
    pauseReason:
      "Three caplets every 5th day. Centrum is skipped that morning and the evening magnesium is skipped that night, so the zinc and magnesium are not stacked.",
  }),
  pile({
    id: "minoxidil",
    name: "Minoxidil",
    unit: "bottle",
    count: null,
    bottleSize: 1,
    dailyUse: 0,
    lowAt: 0,
    tracked: false,
    inStock: true,
    paused: false,
    pauseReason: "Apply to a dry scalp, morning and night, the way you were shown.",
  }),
  pile({
    id: "centrum",
    name: "Centrum EC4",
    unit: "tablets",
    count: 30,
    bottleSize: 30,
    dailyUse: 1,
    lowAt: 7,
  }),
  pile({
    id: "coconut",
    name: "Virgin coconut oil",
    unit: "kitchen",
    count: null,
    bottleSize: 0,
    dailyUse: 0,
    lowAt: 0,
    tracked: false,
    kitchen: true,
    pauseReason: "A teaspoon on food when you want extra calories.",
  }),
  pile({
    id: "zaatar",
    name: "Zaatar",
    unit: "kitchen",
    count: null,
    bottleSize: 0,
    dailyUse: 0,
    lowAt: 0,
    tracked: false,
    kitchen: true,
    pauseReason: "On eggs, yogurt, or lentils.",
  }),
  pile({
    id: "fenugreek",
    name: "Fenugreek seeds",
    unit: "kitchen",
    count: null,
    bottleSize: 0,
    dailyUse: 0,
    lowAt: 0,
    tracked: false,
    kitchen: true,
    pauseReason: "A pinch in food, a few days a week. Jamieson already contains fenugreek if you turn that on.",
  }),
  pile({
    id: "clove",
    name: "Clove",
    unit: "kitchen",
    count: null,
    bottleSize: 0,
    dailyUse: 0,
    lowAt: 0,
    tracked: false,
    kitchen: true,
    pauseReason: "A pinch in cooking. Keep this as a spice, not a capsule or an oil.",
  }),
];

const items: PlanItem[] = [
  {
    id: "tea",
    slotId: "wake",
    name: "Moroccan mint tea",
    dose: "One glass",
    note: "Drink this before any food or capsules.",
    consume: 0,
    rule: "daily",
    order: 0,
  },
  {
    id: "breakfast",
    slotId: "breakfast",
    name: "Small breakfast",
    dose: "Half a plate counts",
    note: "Egg, yogurt, or avocado. A few bites are enough.",
    consume: 0,
    rule: "daily",
    order: 0,
  },
  {
    id: "d3",
    stockId: "d3",
    slotId: "breakfast",
    name: "Vitamin D3",
    dose: "2 softgels · 2000 IU",
    note: "With something fatty: egg, yogurt, avocado, nuts, or a teaspoon of coconut oil. Centrum already contains some vitamin D, so stay at two softgels.",
    consume: 2,
    rule: "daily",
    order: 1,
  },
  {
    id: "omega-am",
    stockId: "omega",
    slotId: "breakfast",
    name: "Omega-3",
    dose: "1 softgel",
    note: "1200 mg, with 420 mg EPA and 280 mg DHA.",
    consume: 1,
    rule: "daily",
    order: 2,
  },
  {
    id: "probiotic",
    stockId: "probiotic",
    slotId: "breakfast",
    name: "Probiotic",
    dose: "1 capsule · 40 billion CFU",
    note: "With breakfast.",
    consume: 1,
    rule: "daily",
    order: 3,
  },
  {
    id: "centrum",
    stockId: "centrum",
    slotId: "breakfast",
    name: "Centrum EC4",
    dose: "1 tablet",
    note: "With food. Skipped on a Jamieson day. It does not replace the two vitamin D softgels, and the 50 mg zinc tablet stays off.",
    consume: 1,
    rule: "daily",
    order: 4,
  },
  {
    id: "coconut-oil",
    stockId: "coconut",
    slotId: "breakfast",
    name: "Virgin coconut oil",
    dose: "1 teaspoon",
    note: "On the food with the vitamin D, so the softgels have some fat.",
    consume: 0,
    rule: "daily",
    order: 5,
  },
  {
    id: "snack-am",
    slotId: "midmorning",
    name: "Mid-morning snack",
    dose: "If breakfast was small",
    note: "Dried fruit and a few almonds.",
    consume: 0,
    rule: "daily",
    order: 0,
  },
  {
    id: "lunch",
    slotId: "lunch",
    name: "Lunch",
    dose: "One real plate",
    note: "Sardines or salmon, lentils, or liver, with rice or bread. Add spinach, broccoli, beans, avocado, or almonds. Liver is once this week.",
    consume: 0,
    rule: "daily",
    order: 0,
  },
  {
    id: "omega-pm",
    stockId: "omega",
    slotId: "lunch",
    name: "Omega-3",
    dose: "1 softgel",
    note: "The second softgel of the day, with lunch.",
    consume: 1,
    rule: "daily",
    order: 1,
  },
  {
    id: "forcapil",
    stockId: "forcapil",
    slotId: "lunch",
    name: "Forcapil",
    dose: "2 capsules",
    note: "Hair support today. Take both with lunch.",
    consume: 2,
    rule: "forcapil",
    order: 2,
  },
  {
    id: "perfectil",
    stockId: "perfectil",
    slotId: "lunch",
    name: "Perfectil",
    dose: "1 capsule",
    note: "Hair support today, in place of Forcapil. Take it with lunch.",
    consume: 1,
    rule: "perfectil",
    order: 2,
  },
  {
    id: "jamieson",
    stockId: "jamieson",
    slotId: "lunch",
    name: "Jamieson Power for Men",
    dose: "3 caplets",
    note: "Every 5th day. Centrum stays off this morning, and the evening magnesium stays off tonight.",
    consume: 3,
    rule: "jamieson",
    order: 3,
  },
  {
    id: "walk",
    slotId: "movement",
    name: "Short walk",
    dose: "Easy pace",
    note: "A short one counts.",
    consume: 0,
    rule: "daily",
    order: 0,
  },
  {
    id: "strength",
    slotId: "movement",
    name: "Easy strength",
    dose: "20 minutes",
    note: "A squat or hinge, a push, and a row or carry. Skip this if you are wiped out.",
    consume: 0,
    rule: "strength",
    order: 1,
  },
  {
    id: "snack-pm",
    slotId: "afternoon",
    name: "Afternoon snack",
    dose: "Something small",
    note: "Yogurt, avocado, bread, or nuts and dried fruit.",
    consume: 0,
    rule: "daily",
    order: 0,
  },
  {
    id: "dinner",
    slotId: "dinner",
    name: "Dinner",
    dose: "Warm, and smaller than you think",
    note: "Starch, a protein, and greens. Zaatar, fenugreek, and clove show up on their own days.",
    consume: 0,
    rule: "daily",
    order: 0,
  },
  {
    id: "zinc",
    stockId: "zinc",
    slotId: "dinner",
    name: "Zinc",
    dose: "1 tablet · 50 mg",
    note: "With dinner, every other day.",
    consume: 1,
    rule: "zinc",
    order: 1,
  },
  {
    id: "magnesium",
    stockId: "magnesium",
    slotId: "night",
    name: "Magnesium bisglycinate",
    dose: "1 capsule · 200 mg",
    note: "After dinner, on nights that are not a Jamieson day. Three Jamieson caplets already contain 450 mg of magnesium.",
    consume: 1,
    rule: "daily",
    order: 0,
  },
  {
    id: "ashwagandha",
    stockId: "ashwagandha",
    slotId: "night",
    name: "Ashwagandha",
    dose: "1 capsule",
    note: "The bottle reads 6000 mg. Take one capsule. Eight weeks on, then a two-week pause.",
    consume: 1,
    rule: "ashwagandha",
    order: 1,
  },
  {
    id: "minoxidil-am",
    stockId: "minoxidil",
    slotId: "wake",
    name: "Minoxidil",
    dose: "Apply to the scalp",
    note: "Morning application, on dry hair, the way you were shown.",
    consume: 0,
    rule: "minoxidil",
    order: 1,
  },
  {
    id: "minoxidil-pm",
    stockId: "minoxidil",
    slotId: "night",
    name: "Minoxidil",
    dose: "Apply to the scalp",
    note: "Evening application, on dry hair, the way you were shown.",
    consume: 0,
    rule: "minoxidil",
    order: 2,
  },
  {
    id: "zaatar",
    stockId: "zaatar",
    slotId: "breakfast",
    name: "Zaatar",
    dose: "A pinch on the food",
    note: "Sunday, Tuesday, and Thursday. On eggs, yogurt, or lentils.",
    consume: 0,
    rule: "zaatar",
    order: 6,
  },
  {
    id: "fenugreek",
    stockId: "fenugreek",
    slotId: "dinner",
    name: "Fenugreek seeds",
    dose: "A pinch in the food",
    note: "Every 5th day, off the Jamieson days. A pinch, not a spoon and not a capsule.",
    consume: 0,
    rule: "fenugreek",
    order: 1,
  },
  {
    id: "clove",
    stockId: "clove",
    slotId: "dinner",
    name: "Clove",
    dose: "A pinch in the cooking",
    note: "Wednesday and Saturday. Spice only, never clove oil.",
    consume: 0,
    rule: "clove",
    order: 2,
  },
];

const foods: FoodNeed[] = [
  { id: "mint", name: "Moroccan mint", note: "For the morning tea.", bought: false },
  { id: "eggs", name: "Eggs", note: "An easy breakfast.", bought: false },
  { id: "yogurt", name: "Yogurt", note: "Breakfast or the afternoon snack.", bought: false },
  { id: "fish", name: "Sardines or salmon", note: "Lunch, a few times this week.", bought: false },
  { id: "lentils", name: "Lentils", note: "A plate you can repeat.", bought: false },
  { id: "starch", name: "Rice or bread", note: "The starch next to lunch and dinner.", bought: false },
  { id: "almonds", name: "Almonds", note: "A small handful.", bought: false },
  { id: "dried", name: "Dried fruit", note: "With the mid-morning snack.", bought: false },
  { id: "avocado", name: "Avocado", note: "Fat for breakfast, and calories without a huge plate.", bought: false },
  { id: "spinach", name: "Spinach", note: "With lunch or dinner.", bought: false },
  { id: "broccoli", name: "Broccoli", note: "With lunch or dinner.", bought: false },
  { id: "beans", name: "Beans", note: "With lunch or dinner.", bought: false },
  { id: "liver", name: "Liver", note: "Once this week.", bought: false },
];

const optionalBuys: OptionalBuy[] = [
  {
    id: "mag300",
    name: "Magnesium bisglycinate 300 mg",
    reason:
      "Optional. Your 200 mg capsule is the evening dose. A 300 mg capsule is closer to the amount on the sheet, if you later want to switch.",
    addCount: 60,
    kind: "magnesium300",
  },
  {
    id: "perfectil-refill",
    name: "Perfectil refill",
    reason:
      "Optional. Only if you want to keep alternating with Forcapil after the capsules you already have.",
    addCount: 30,
    kind: "perfectil",
  },
];

export function createStarter(): PlannerState {
  return {
    version: 1,
    plannerRevision: PLANNER_REVISION,
    planStart: PLAN_START,
    profile: { age: 28, heightCm: 168, weightKg: 54 },
    slots: slots.map((slot) => ({ ...slot })),
    piles: piles.map((entry) => ({ ...entry })),
    items: items.map((item) => ({ ...item })),
    checks: {},
    groceryChecks: {},
    foods: foods.map((food) => ({ ...food })),
    foodWeek: weekSunday(PLAN_START),
    optionalBuys: optionalBuys.map((buy) => ({ ...buy })),
    labDone: false,
    weights: [{ date: PLAN_START, kg: 54 }],
    disclaimerSeen: false,
    minoxidil: "yes",
    perfectilContinue: false,
    blank: false,
    dayView: "timeline",
  };
}

const REFRESH_IDS = ["jamieson", "centrum", "magnesium", "coconut-oil", "zaatar", "fenugreek", "clove"];

function normalizeDayView(view: DayView | "list" | "hours" | undefined): DayView {
  return view === "week" ? "week" : "timeline";
}

function migrateRevision(state: PlannerState, starter: PlannerState): PlannerState {
  const freshItems = starter.items.filter((item) => REFRESH_IDS.includes(item.id));
  const piles = state.piles.map((entry) => {
    if (entry.id === "centrum" && entry.count === null) {
      const fresh = starter.piles.find((pile) => pile.id === "centrum");
      return fresh ? { ...fresh, inStock: entry.inStock } : entry;
    }
    if (entry.id === "jamieson") {
      const fresh = starter.piles.find((pile) => pile.id === "jamieson");
      if (!fresh) return entry;
      return { ...fresh, count: entry.count ?? fresh.count, inStock: true, paused: false };
    }
    return entry;
  });
  const known = new Set(piles.map((pile) => pile.id));
  const missingPiles = starter.piles.filter((pile) => !known.has(pile.id));

  return {
    ...state,
    plannerRevision: PLANNER_REVISION,
    piles: [...piles, ...missingPiles],
    items: [...state.items.filter((item) => !REFRESH_IDS.includes(item.id)), ...freshItems.map((item) => ({ ...item }))],
  };
}

export function upgradeState(state: PlannerState): PlannerState {
  const starter = createStarter();
  let next: PlannerState = {
    ...state,
    plannerRevision: state.plannerRevision ?? 1,
    dayView: normalizeDayView(state.dayView),
    groceryChecks: state.groceryChecks ?? {},
  };
  if (next.plannerRevision < PLANNER_REVISION) {
    next = migrateRevision(next, starter);
  }

  if (!next.piles.some((pile) => pile.id === "centrum")) {
    const pile = starter.piles.find((entry) => entry.id === "centrum");
    const item = starter.items.find((entry) => entry.id === "centrum");
    if (pile && item) {
      next = { ...next, piles: [...next.piles, pile], items: [...next.items, item] };
    }
  }

  if (!next.items.some((item) => item.id === "minoxidil-am")) {
    const added = starter.items.filter(
      (item) => item.id === "minoxidil-am" || item.id === "minoxidil-pm",
    );
    const fresh = starter.piles.find((pile) => pile.id === "minoxidil");
    const checks = { ...next.checks };
    for (const [key, value] of Object.entries(checks)) {
      if (!key.endsWith(":minoxidil")) continue;
      checks[`${key.slice(0, -":minoxidil".length)}:minoxidil-pm`] = value;
      delete checks[key];
    }
    next = {
      ...next,
      minoxidil: "yes",
      checks,
      items: [...next.items.filter((item) => item.id !== "minoxidil"), ...added],
      piles: next.piles.map((pile) =>
        pile.id === "minoxidil" && fresh
          ? { ...fresh, count: pile.count }
          : pile,
      ),
      slots: next.slots.map((slot) =>
        slot.id === "wake" && slot.alertTitle === "Mint tea"
          ? { ...slot, alertTitle: "Mint tea and minoxidil" }
          : slot,
      ),
    };
  }

  return next;
}

export function magnesium300Pile(count: number): StockPile {
  return pile({
    id: "magnesium300",
    name: "Magnesium bisglycinate 300 mg",
    unit: "capsules",
    count,
    bottleSize: 60,
    dailyUse: 0,
    lowAt: 7,
    paused: true,
    pauseReason:
      "In the cabinet, off the schedule. The evening dose stays one 200 mg capsule unless you pause that one and choose this instead.",
  });
}
