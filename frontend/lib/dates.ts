import { addDays, formatDistanceToNow, isBefore, parseISO, startOfDay } from "date-fns";
import type { AvailabilityRange } from "./types";

/** API datetimes are UTC but often omit the trailing Z. */
export function parseApiDate(iso: string): Date {
  const trimmed = iso.trim();
  if (!trimmed) return new Date(NaN);
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return parseISO(trimmed);
  }
  return parseISO(`${trimmed}Z`);
}

export function formatMessageTimestamp(iso: string): string {
  return parseApiDate(iso).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTimestamp(iso: string): string {
  return formatDistanceToNow(parseApiDate(iso), { addSuffix: true });
}

/** True if this calendar night (check-in day) is inside a confirmed booking. */
export function isBlockedStayNight(day: Date, ranges: AvailabilityRange[]) {
  const d = startOfDay(day);
  return ranges.some((r) => {
    const start = startOfDay(parseISO(r.check_in));
    const end = startOfDay(parseISO(r.check_out));
    return !isBefore(d, start) && isBefore(d, end);
  });
}

/** True if any stay night in [checkIn, checkOut) is already booked. */
export function rangeOverlapsBlocked(
  checkIn: string,
  checkOut: string,
  ranges: AvailabilityRange[]
) {
  let d = startOfDay(parseISO(checkIn));
  const end = startOfDay(parseISO(checkOut));
  while (isBefore(d, end)) {
    if (isBlockedStayNight(d, ranges)) return true;
    d = addDays(d, 1);
  }
  return false;
}

/** True if the selected interval conflicts with any confirmed booking. */
export function rangeConflictsWithBookings(
  checkIn: Date,
  checkOut: Date,
  ranges: AvailabilityRange[]
) {
  const ci = startOfDay(checkIn);
  const co = startOfDay(checkOut);
  return ranges.some((r) => {
    const start = startOfDay(parseISO(r.check_in));
    const end = startOfDay(parseISO(r.check_out));
    return start < co && end > ci;
  });
}
