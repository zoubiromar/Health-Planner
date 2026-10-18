import { addDays, minutesFromTime } from "./dates";
import { pileFor } from "./schedule";
import type { PlanItem, PlannerState, Slot } from "./types";

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts = [line.slice(0, 73)];
  for (let index = 73; index < line.length; index += 72) {
    parts.push(` ${line.slice(index, index + 72)}`);
  }
  return parts.join("\r\n");
}

function utcStamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function localStamp(iso: string, time: string): string {
  return `${iso.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function itemLine(item: PlanItem): string {
  switch (item.rule) {
    case "forcapil":
      return "Forcapil, 2 capsules, on Forcapil days.";
    case "perfectil":
      return "Perfectil, 1 capsule, on Perfectil days.";
    case "ashwagandha":
      return "Ashwagandha, 1 capsule, except during the two-week pause.";
    case "strength":
      return "Easy strength, 20 minutes, on Monday, Wednesday, and Saturday.";
    default:
      return `${item.name}: ${item.dose}.`;
  }
}

function slotItems(state: PlannerState, slot: Slot): PlanItem[] {
  return state.items
    .filter((item) => item.slotId === slot.id)
    .filter((item) => {
      const owned = pileFor(state, item);
      if (owned?.paused) return false;
      if (item.rule === "minoxidil" && state.minoxidil !== "yes") return false;
      return true;
    })
    .sort((a, b) => a.order - b.order);
}

export function alertSlots(state: PlannerState): Slot[] {
  return state.slots.filter((slot) => slot.alert);
}

export function buildCalendar(state: PlannerState, todayIso: string, nowMinutes: number, now = new Date()): string {
  const stamp = utcStamp(now);
  const events = alertSlots(state).map((slot) => {
    const startIso =
      minutesFromTime(slot.time) <= nowMinutes ? addDays(todayIso, 1) : todayIso;
    const description = slotItems(state, slot).map(itemLine).join("\n");
    const lines = [
      "BEGIN:VEVENT",
      `UID:health-planner-${slot.id}@health-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${localStamp(startIso, slot.time)}`,
      "RRULE:FREQ=DAILY",
      `SUMMARY:${escapeText(`Health Planner · ${slot.alertTitle}`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(slot.alertTitle)}`,
      "TRIGGER:PT0S",
      "END:VALARM",
      "END:VEVENT",
    ];
    return lines.map(fold).join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Health Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export async function shareCalendar(ics: string): Promise<"shared" | "downloaded"> {
  const file = new File([ics], "health-planner.ics", { type: "text/calendar" });
  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Health Planner alerts" });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "shared";
    }
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "health-planner.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
