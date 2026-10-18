export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = parseISODate(startIso).getTime();
  const end = parseISODate(endIso).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function weekday(iso: string): number {
  return parseISODate(iso).getDay();
}

export function weekSunday(iso: string): string {
  return addDays(iso, -weekday(iso));
}

export function weekDates(iso: string): string[] {
  const sunday = weekSunday(iso);
  return Array.from({ length: 7 }, (_, index) => addDays(sunday, index));
}

export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function weekdayName(iso: string): string {
  return WEEKDAYS[weekday(iso)];
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[weekday(iso)];
}

export function formatLongDate(iso: string): string {
  const date = parseISODate(iso);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatDayMonth(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatPhaseDate(iso: string): string {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function checkKey(date: string, itemId: string): string {
  return `${date}:${itemId}`;
}

export function bmi(kg: number, cm: number): number | null {
  if (kg <= 0 || cm <= 0) return null;
  const metres = cm / 100;
  return Math.round((kg / (metres * metres)) * 10) / 10;
}

export function proteinTarget(kg: number): number | null {
  if (kg <= 0) return null;
  return Math.round(kg * 1.6);
}

export function todayISO(now = new Date()): string {
  return formatISODate(now);
}

export function minutesNow(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}
