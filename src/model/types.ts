export const PLAN_START = "2026-10-18";
export const FORCAPIL_REVIEW = "2027-01-18";
export const LAB_DATE = "2027-01-12";
export const PERFECTIL_DOSES = 15;
export const ASHWAGANDHA_ON_DAYS = 56;
export const ASHWAGANDHA_PAUSE_DAYS = 14;

export type SlotId =
  | "wake"
  | "breakfast"
  | "midmorning"
  | "lunch"
  | "movement"
  | "afternoon"
  | "dinner"
  | "night";

export type Period = "Morning" | "Midday" | "Evening";

export type ItemRule =
  | "daily"
  | "strength"
  | "forcapil"
  | "perfectil"
  | "ashwagandha"
  | "minoxidil"
  | "zinc"
  | "jamieson"
  | "zaatar"
  | "fenugreek"
  | "clove";

export interface Slot {
  id: SlotId;
  label: string;
  time: string;
  alert: boolean;
  period: Period;
  alertTitle: string;
}

export interface StockPile {
  id: string;
  name: string;
  unit: string;
  count: number | null;
  bottleSize: number;
  inStock: boolean;
  paused: boolean;
  pauseReason: string;
  lowAt: number;
  tracked: boolean;
  kitchen: boolean;
  dailyUse: number;
}

export interface PlanItem {
  id: string;
  stockId?: string;
  slotId: SlotId;
  name: string;
  dose: string;
  note: string;
  consume: number;
  rule: ItemRule;
  order: number;
  custom?: boolean;
}

export interface FoodNeed {
  id: string;
  name: string;
  note: string;
  bought: boolean;
}

export interface OptionalBuy {
  id: string;
  name: string;
  reason: string;
  addCount: number;
  kind: "perfectil" | "magnesium300";
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface Profile {
  age: number;
  heightCm: number;
  weightKg: number;
}

export type DayView = "timeline" | "plates";
export type ThemeName = "daylight" | "lamp";
export const PLANNER_REVISION = 2;

export interface PlannerState {
  version: 1;
  plannerRevision: number;
  dayView: DayView;
  theme: ThemeName;
  planStart: string;
  profile: Profile;
  slots: Slot[];
  piles: StockPile[];
  items: PlanItem[];
  checks: Record<string, boolean>;
  groceryChecks: Record<string, boolean>;
  foods: FoodNeed[];
  foodWeek: string;
  optionalBuys: OptionalBuy[];
  labDone: boolean;
  weights: WeightEntry[];
  disclaimerSeen: boolean;
  minoxidil: "unanswered" | "yes" | "no";
  perfectilContinue: boolean;
  blank: boolean;
}

export interface Phase {
  id: string;
  title: string;
  start: string;
  end: string;
  detail: string;
}

export type RowStatus = "due" | "muted" | "paused-window";

export interface DueRow {
  item: PlanItem;
  status: RowStatus;
  reviewNote?: string;
}

export type Focus =
  | { kind: "item"; item: PlanItem; slot: Slot; waiting: boolean }
  | { kind: "done"; slot: Slot };
