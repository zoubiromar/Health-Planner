import { createStarter, upgradeState } from "./plan";
import type { PlannerState } from "./types";

export const STORAGE_KEY = "health-planner-v1";

export function loadState(storage: Pick<Storage, "getItem"> | null = safeStorage()): PlannerState {
  if (!storage) return createStarter();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createStarter();
    const parsed = JSON.parse(raw) as PlannerState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items) || !Array.isArray(parsed.slots)) {
      return createStarter();
    }
    return upgradeState(parsed);
  } catch {
    return createStarter();
  }
}

export function saveState(state: PlannerState, storage: Pick<Storage, "setItem"> | null = safeStorage()): void {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}
