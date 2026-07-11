import { addDays, isBefore, parseISO, startOfDay } from "date-fns";
import type { AvailabilityRange } from "./types";

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
