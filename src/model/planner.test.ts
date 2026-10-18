import { describe, expect, it } from "vitest";
import { addDays, bmi, daysBetween, proteinTarget, weekSunday } from "./dates";
import { planDaysInWeek, planYearEnd, projectRefills, snackLines } from "./groceries";
import { alertSlots, buildCalendar } from "./ics";
import { createStarter, upgradeState } from "./plan";
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
    expect(row("2026-10-18", "jamieson", state)?.item.slotId).toBe("lunch");
    expect(row("2026-10-18", "centrum", state)).toBeUndefined();
    expect(row("2026-10-18", "magnesium", state)).toBeUndefined();
    expect(row("2026-10-18", "coconut-oil", state)?.status).toBe("due");
    expect(row("2026-10-18", "zaatar", state)?.status).toBe("due");
    expect(row("2026-10-18", "fenugreek", state)).toBeUndefined();
    expect(row("2026-10-18", "clove", state)).toBeUndefined();
    expect(row("2026-10-18", "minoxidil-am", state)?.item.slotId).toBe("wake");
    expect(row("2026-10-18", "minoxidil-pm", state)?.item.slotId).toBe("night");
    expect(row("2026-10-18", "minoxidil", state)).toBeUndefined();
    expect(row("2026-10-18", "ashwagandha", state)?.status).toBe("due");
    expect(rowsForDate(state, "2026-10-17")).toEqual([]);
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

  it("lets zinc return only when it is turned back on", () => {
    const zincOn = reducer(createStarter(), { type: "set-paused", stockId: "zinc", paused: false });
    expect(row("2026-10-18", "zinc", zincOn)?.status).toBe("due");
    expect(row("2026-10-19", "zinc", zincOn)).toBeUndefined();
    expect(projectRefills(zincOn, PLAN_START).some((line) => line.stockId === "zinc")).toBe(false);
  });

  it("uses Jamieson every 5th day and keeps the spices on their own days", () => {
    expect(row("2026-10-19", "jamieson")).toBeUndefined();
    expect(row("2026-10-19", "centrum")?.status).toBe("due");
    expect(row("2026-10-19", "magnesium")?.status).toBe("due");
    expect(row("2026-10-19", "zaatar")).toBeUndefined();
    expect(row("2026-10-20", "fenugreek")?.status).toBe("due");
    expect(row("2026-10-20", "zaatar")?.status).toBe("due");
    expect(row("2026-10-21", "clove")?.status).toBe("due");
    expect(row("2026-10-23", "jamieson")?.status).toBe("due");
    expect(row("2026-10-23", "centrum")).toBeUndefined();
    expect(row("2026-10-23", "magnesium")).toBeUndefined();
    expect(row("2026-10-23", "fenugreek")).toBeUndefined();

    const paused = reducer(createStarter(), { type: "set-paused", stockId: "jamieson", paused: true });
    expect(row("2026-10-18", "jamieson", paused)).toBeUndefined();
    expect(row("2026-10-18", "centrum", paused)?.status).toBe("due");
    expect(row("2026-10-18", "magnesium", paused)?.status).toBe("due");
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
    expect(evening).toMatchObject({ kind: "item", item: { id: "ashwagandha" }, waiting: false });
    const nextNight = focusItem(rowsForDate(state, "2026-10-19"), {}, state.slots, "2026-10-19", 21 * 60 + 40);
    expect(nextNight).toMatchObject({ kind: "item", item: { id: "magnesium" }, waiting: false });

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
    expect(unfolded).toContain("every 5th day");
  });
});

describe("profile and the blank plan", () => {
  it("computes BMI and the protein cue from the current weight", () => {
    expect(bmi(54, 168)).toBe(19.1);
    expect(proteinTarget(54)).toBe(86);
  });

  it("keeps each week's grocery checks and can start blank", () => {
    let state = reducer(createStarter(), { type: "toggle-grocery", week: "2026-10-18", id: "yogurt" });
    state = reducer(state, { type: "toggle-grocery", week: "2026-10-25", id: "yogurt" });
    expect(state.groceryChecks["2026-10-18:yogurt"]).toBe(true);
    expect(state.groceryChecks["2026-10-25:yogurt"]).toBe(true);
    expect(weekSunday("2026-10-25")).toBe("2026-10-25");

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

  it("keeps both minoxidil applications off when they are declined", () => {
    const declined = reducer(createStarter(), { type: "answer-minoxidil", answer: "no" });
    expect(row("2026-10-18", "minoxidil-am", declined)).toBeUndefined();
    expect(row("2026-10-18", "minoxidil-pm", declined)).toBeUndefined();
  });

  it("upgrades an older save with Centrum and two minoxidil applications", () => {
    const current = createStarter();
    const legacy = {
      ...current,
      dayView: undefined as unknown as typeof current.dayView,
      minoxidil: "unanswered" as const,
      checks: { "2026-10-18:d3": true, "2026-10-18:minoxidil": true },
      items: [
        ...current.items.filter(
          (item) => item.id !== "centrum" && item.id !== "minoxidil-am" && item.id !== "minoxidil-pm",
        ),
        {
          id: "minoxidil",
          stockId: "minoxidil",
          slotId: "night" as const,
          name: "Minoxidil",
          dose: "Apply as shown",
          note: "Night only.",
          consume: 0,
          rule: "minoxidil" as const,
          order: 2,
        },
      ],
      piles: current.piles
        .filter((entry) => entry.id !== "centrum")
        .map((entry) =>
          entry.id === "minoxidil" ? { ...entry, count: 1, inStock: false, paused: true } : entry,
        ),
      slots: current.slots.map((slot) =>
        slot.id === "wake" ? { ...slot, alertTitle: "Mint tea" } : slot,
      ),
    };

    const upgraded = upgradeState(legacy);
    expect(upgraded.dayView).toBe("timeline");
    expect(upgraded.minoxidil).toBe("yes");
    expect(upgraded.items.some((item) => item.id === "minoxidil")).toBe(false);
    expect(row("2026-10-19", "centrum", upgraded)?.status).toBe("due");
    expect(row("2026-10-18", "minoxidil-am", upgraded)?.status).toBe("due");
    expect(row("2026-10-18", "minoxidil-pm", upgraded)?.status).toBe("due");
    expect(upgraded.checks["2026-10-18:d3"]).toBe(true);
    expect(upgraded.checks["2026-10-18:minoxidil-pm"]).toBe(true);
    expect(pile("minoxidil", upgraded).count).toBe(1);
    expect(upgraded.slots.find((slot) => slot.id === "wake")?.alertTitle).toBe(
      "Mint tea and minoxidil",
    );

    const viewed = reducer(upgraded, { type: "set-day-view", view: "timeline" });
    expect(viewed.dayView).toBe("timeline");

    const memory = {
      value: JSON.stringify(legacy),
      getItem() {
        return this.value;
      },
      setItem() {},
    };
    expect(loadState(memory).items.some((item) => item.id === "centrum")).toBe(true);
    expect(loadState(memory).checks["2026-10-18:d3"]).toBe(true);
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

describe("the year of groceries", () => {
  it("scales yogurt to the plan days in the week and buys a bag for a short week", () => {
    expect(snackLines(PLAN_START, "2026-10-18").find((line) => line.id === "yogurt")?.quantity).toBe(
      "7 cups",
    );
    const end = planYearEnd(PLAN_START);
    const lastWeek = weekSunday(end);
    const days = planDaysInWeek(PLAN_START, lastWeek);
    expect(days.length).toBeLessThan(7);
    expect(days.length).toBeGreaterThan(0);
    const yogurt = snackLines(PLAN_START, lastWeek).find((line) => line.id === "yogurt");
    expect(yogurt?.quantity).toBe(days.length === 1 ? "1 cup" : `${days.length} cups`);
    expect(snackLines(PLAN_START, lastWeek).find((line) => line.id === "apricots")?.quantity).toBe(
      "1 bag",
    );
    expect(snackLines(PLAN_START, "2026-10-11")).toEqual([]);
  });

  it("puts vitamin D on the week the bottle runs out, and not the week after", () => {
    const lines = projectRefills(createStarter(), PLAN_START);
    const vitamin = lines.find((line) => line.stockId === "d3");
    expect(vitamin?.week).toBe(weekSunday(addDays(PLAN_START, 249)));
    expect(lines.some((line) => line.stockId === "d3" && line.week === addDays(vitamin?.week ?? "", 7))).toBe(
      false,
    );
    const names = lines.map((line) => line.name).join(" ");
    expect(names).not.toMatch(/zinc|selenium|vittofer|\biron\b/i);

    const bought = reducer(createStarter(), {
      type: "buy-refill",
      week: vitamin?.week ?? PLAN_START,
      stockId: "d3",
      add: vitamin?.add ?? 0,
    });
    expect(pile("d3", bought).count).toBe(1000);
    expect(bought.groceryChecks[`${vitamin?.week}:refill-d3`]).toBe(true);
    expect(projectRefills(bought, PLAN_START).find((line) => line.stockId === "d3")?.week).not.toBe(
      vitamin?.week,
    );
  });

  it("does not turn a paused Jamieson bottle back on after the plan has been updated", () => {
    const paused = reducer(createStarter(), { type: "set-paused", stockId: "jamieson", paused: true });
    expect(upgradeState(paused).piles.find((entry) => entry.id === "jamieson")?.paused).toBe(true);

    const old = {
      ...createStarter(),
      plannerRevision: 1,
      dayView: "hours" as unknown as ReturnType<typeof createStarter>["dayView"],
      items: createStarter().items.filter((item) => item.id !== "fenugreek"),
      piles: createStarter().piles.map((entry) =>
        entry.id === "jamieson" ? { ...entry, paused: true, count: null } : entry,
      ),
    };
    const upgraded = upgradeState(old);
    expect(upgraded.dayView).toBe("timeline");
    expect(upgraded.plannerRevision).toBe(2);
    expect(pile("jamieson", upgraded)).toMatchObject({ paused: false, count: 30 });
    expect(upgraded.items.some((item) => item.id === "fenugreek")).toBe(true);
    expect(row("2026-10-18", "jamieson", upgraded)?.status).toBe("due");
  });
});
