import { describe, expect, it } from "vitest";
import { bmi, daysBetween, proteinTarget, weekSunday } from "./dates";
import { alertSlots, buildCalendar } from "./ics";
import { createStarter } from "./plan";
import { reducer } from "./reducer";
import {
  daysOfSupply,
  focusItem,
  isRunningLow,
  phases,
  progress,
  refillPiles,
  rowsForDate,
} from "./schedule";
import { loadState, saveState } from "./storage";
import { PLAN_START } from "./types";

function row(date: string, id: string, state = createStarter()) {
  return rowsForDate(state, date).find((entry) => entry.item.id === id);
}

function pile(id: string, state = createStarter()) {
  return state.piles.find((entry) => entry.id === id)!;
}

describe("starter schedule", () => {
  it("starts Sunday 18 October with Forcapil, vitamin D, and no strength session", () => {
    const state = createStarter();
    expect(row("2026-10-18", "forcapil", state)?.status).toBe("due");
    expect(row("2026-10-18", "perfectil", state)).toBeUndefined();
    expect(row("2026-10-18", "d3", state)?.status).toBe("due");
    expect(row("2026-10-18", "strength", state)).toBeUndefined();
    expect(row("2026-10-18", "walk", state)?.status).toBe("due");
    expect(row("2026-10-18", "zinc", state)).toBeUndefined();
    expect(row("2026-10-18", "jamieson", state)).toBeUndefined();
    expect(row("2026-10-18", "minoxidil", state)).toBeUndefined();
    expect(row("2026-10-18", "ashwagandha", state)?.status).toBe("due");
  });

  it("alternates Perfectil and strength on the next days", () => {
    expect(row("2026-10-19", "perfectil")?.status).toBe("due");
    expect(row("2026-10-19", "forcapil")).toBeUndefined();
    expect(row("2026-10-19", "strength")?.status).toBe("due");
    expect(row("2026-10-20", "strength")).toBeUndefined();
    expect(row("2026-10-21", "strength")?.status).toBe("due");
    expect(row("2026-10-24", "strength")?.status).toBe("due");
  });

  it("ends the Perfectil alternation after 15 doses unless it is refilled", () => {
    expect(row("2026-11-16", "perfectil")?.status).toBe("due");
    expect(row("2026-11-17", "forcapil")?.status).toBe("due");
    expect(row("2026-11-18", "perfectil")).toBeUndefined();

    const continued = reducer(createStarter(), {
      type: "buy-optional",
      id: "perfectil-refill",
      add: 30,
    });
    expect(continued.perfectilContinue).toBe(true);
    expect(pile("perfectil", continued).count).toBe(45);
    expect(row("2026-11-18", "perfectil", continued)?.status).toBe("due");
  });

  it("pauses ashwagandha for two weeks and then brings it back", () => {
    expect(row("2026-12-12", "ashwagandha")?.status).toBe("due");
    expect(row("2026-12-13", "ashwagandha")?.status).toBe("paused-window");
    expect(row("2026-12-26", "ashwagandha")?.status).toBe("paused-window");
    expect(row("2026-12-27", "ashwagandha")?.status).toBe("due");
  });

  it("keeps Forcapil after the review date and says so", () => {
    const reviewDay = "2027-01-18";
    const offset = daysBetween(PLAN_START, reviewDay);
    const forcapilDay = offset % 2 === 0 ? reviewDay : "2027-01-19";
    expect(row(forcapilDay, "forcapil")?.reviewNote).toMatch(/18 January/);
  });

  it("does not sell selenium, iron, or more zinc", () => {
    const state = createStarter();
    const names = [...state.foods, ...state.optionalBuys].map((entry) => entry.name).join(" ");
    expect(names).not.toMatch(/selenium|vittofer|iron|zinc/i);
  });
});

describe("stock", () => {
  it("decrements a shared bottle and restores it when a dose is unchecked", () => {
    let state = reducer(createStarter(), {
      type: "toggle-check",
      date: "2026-10-18",
      itemId: "d3",
    });
    expect(state.checks["2026-10-18:d3"]).toBe(true);
    expect(pile("d3", state).count).toBe(498);

    state = reducer(state, { type: "toggle-check", date: "2026-10-18", itemId: "omega-am" });
    state = reducer(state, { type: "toggle-check", date: "2026-10-18", itemId: "omega-pm" });
    expect(pile("omega", state).count).toBe(98);

    state = reducer(state, { type: "toggle-check", date: "2026-10-18", itemId: "d3" });
    expect(pile("d3", state).count).toBe(500);
    expect(daysOfSupply(pile("omega", state))).toBe(49);
  });

  it("mutes an out-of-stock dose and refuses to check it off", () => {
    const state = reducer(createStarter(), {
      type: "set-in-stock",
      stockId: "d3",
      inStock: false,
    });
    expect(row("2026-10-18", "d3", state)?.status).toBe("muted");
    const next = reducer(state, { type: "toggle-check", date: "2026-10-18", itemId: "d3" });
    expect(next.checks["2026-10-18:d3"]).toBeFalsy();
    expect(pile("d3", next).count).toBe(500);

    const rows = rowsForDate(state, "2026-10-18");
    const withStock = rowsForDate(createStarter(), "2026-10-18");
    expect(progress(rows, {}, "2026-10-18").total).toBe(progress(withStock, {}, "2026-10-18").total - 1);
  });

  it("marks a bottle running low and offers a refill that turns the reminder back on", () => {
    let state = reducer(createStarter(), { type: "set-count", stockId: "omega", count: 14 });
    expect(isRunningLow(pile("omega", state))).toBe(true);
    expect(refillPiles(state).map((entry) => entry.id)).toContain("omega");

    state = reducer(state, { type: "set-in-stock", stockId: "omega", inStock: false });
    expect(row("2026-10-18", "omega-am", state)?.status).toBe("muted");

    state = reducer(state, { type: "restock", stockId: "omega", add: 100 });
    expect(pile("omega", state)).toMatchObject({ count: 114, inStock: true });
    expect(row("2026-10-18", "omega-am", state)?.status).toBe("due");
    expect(refillPiles(createStarter())).toHaveLength(0);
  });

  it("keeps a checked ashwagandha dose from consuming stock during the pause", () => {
    const state = reducer(createStarter(), {
      type: "toggle-check",
      date: "2026-12-13",
      itemId: "ashwagandha",
    });
    expect(state.checks["2026-12-13:ashwagandha"]).toBeFalsy();
    expect(pile("ashwagandha", state).count).toBe(100);
  });

  it("lets zinc and Jamieson return only when they are turned back on", () => {
    const zincOn = reducer(createStarter(), { type: "set-paused", stockId: "zinc", paused: false });
    expect(row("2026-10-18", "zinc", zincOn)?.status).toBe("due");
    expect(row("2026-10-19", "zinc", zincOn)).toBeUndefined();

    const jamiesonOn = reducer(createStarter(), {
      type: "set-paused",
      stockId: "jamieson",
      paused: false,
    });
    expect(row("2026-10-18", "jamieson", jamiesonOn)?.status).toBe("due");
    expect(pile("jamieson", jamiesonOn).count).toBeNull();
  });
});

describe("phases, focus, and calendar", () => {
  it("anchors the phase dates to 18 October 2026", () => {
    const list = phases(PLAN_START);
    expect(list.find((phase) => phase.id === "rebuild")).toMatchObject({
      start: "2026-10-18",
      end: "2026-12-12",
    });
    expect(list.find((phase) => phase.id === "ash-pause")).toMatchObject({
      start: "2026-12-13",
      end: "2026-12-26",
    });
    expect(list.find((phase) => phase.id === "alternate")?.end).toBe("2026-11-16");
    expect(list.find((phase) => phase.id === "review")?.start).toBe("2027-01-18");
    expect(list.find((phase) => phase.id === "lab")?.start).toBe("2027-01-12");
  });

  it("keeps the evening card on the evening dose when morning was missed", () => {
    const state = createStarter();
    const rows = rowsForDate(state, "2026-10-18");
    const evening = focusItem(rows, {}, state.slots, "2026-10-18", 21 * 60 + 40);
    expect(evening).toMatchObject({ kind: "item", item: { id: "magnesium" }, waiting: false });

    const early = focusItem(rows, {}, state.slots, "2026-10-18", 7 * 60);
    expect(early).toMatchObject({ kind: "item", item: { id: "tea" }, waiting: true });
  });

  it("exports six daily calendar alerts and follows edited times", () => {
    const state = reducer(createStarter(), {
      type: "set-slot-time",
      slotId: "breakfast",
      time: "09:15",
    });
    expect(alertSlots(state)).toHaveLength(6);
    const ics = buildCalendar(state, "2026-10-18", 0, new Date("2026-10-18T00:00:00Z"));
    const unfolded = ics.replace(/\r\n /g, "");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(6);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(6);
    expect(unfolded).toContain("T073000");
    expect(unfolded).toContain("T091500");
    expect(unfolded).toContain("T130000");
    expect(unfolded).toContain("T163000");
    expect(unfolded).toContain("T203000");
    expect(unfolded).toContain("T213000");
    expect(unfolded).not.toContain("T103000");
    expect(unfolded).not.toContain("T134500");
    expect(unfolded).toContain("RRULE:FREQ=DAILY");
    expect(unfolded).toContain("Forcapil\\, 2 capsules");
    expect(unfolded).not.toContain("Zinc");
    expect(unfolded).not.toContain("Jamieson");
  });
});

describe("profile and the blank plan", () => {
  it("computes BMI and the protein cue from the current weight", () => {
    expect(bmi(54, 168)).toBe(19.1);
    expect(proteinTarget(54)).toBe(86);
  });

  it("resets the weekly food list on the next Sunday and can start blank", () => {
    let state = reducer(createStarter(), { type: "toggle-food", id: "eggs" });
    state = reducer(state, { type: "sync-food-week", today: "2026-10-20" });
    expect(state.foods.find((food) => food.id === "eggs")?.bought).toBe(true);
    state = reducer(state, { type: "sync-food-week", today: "2026-10-25" });
    expect(weekSunday("2026-10-25")).toBe("2026-10-25");
    expect(state.foods.find((food) => food.id === "eggs")?.bought).toBe(false);

    state = reducer(state, { type: "start-blank" });
    expect(rowsForDate(state, "2026-10-18")).toEqual([]);
    state = reducer(state, {
      type: "add-item",
      name: "Vitamin C",
      dose: "1 tablet",
      slotId: "breakfast",
      count: 20,
    });
    expect(row("2026-10-18", state.items[0].id, state)?.status).toBe("due");

    state = reducer(state, { type: "restore-starter" });
    expect(row("2026-10-18", "tea", state)?.status).toBe("due");
  });

  it("adds minoxidil only after it is confirmed in the house", () => {
    const state = reducer(createStarter(), { type: "answer-minoxidil", answer: "yes" });
    expect(row("2026-10-18", "minoxidil", state)?.status).toBe("due");
    const declined = reducer(createStarter(), { type: "answer-minoxidil", answer: "no" });
    expect(row("2026-10-18", "minoxidil", declined)).toBeUndefined();
  });

  it("stores the plan on the device and ignores a broken save", () => {
    const memory = {
      value: null as string | null,
      getItem() {
        return this.value;
      },
      setItem(_key: string, value: string) {
        this.value = value;
      },
    };
    const starter = createStarter();
    saveState(starter, memory);
    expect(loadState(memory).profile.weightKg).toBe(54);
    memory.value = "{";
    expect(loadState(memory).items.length).toBeGreaterThan(0);
  });
});
