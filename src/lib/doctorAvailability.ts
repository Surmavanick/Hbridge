import { addDays, format } from "date-fns";
import type { BookingRequest } from "@/data/mockData";

export const CONSULTATION_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
const DEFAULT_DURATION_MIN = 60;

export interface BusySlot {
  start: Date;
  end: Date;
  patientName: string;
}

// All busy blocks for a doctor, drawn from every booking's confirmed consultation
// and any manually-scheduled sessions — real, not a separate mock calendar.
export function getDoctorBusySlots(
  doctorId: string,
  bookings: BookingRequest[],
  excludeBookingId?: string
): BusySlot[] {
  const slots: BusySlot[] = [];

  for (const b of bookings) {
    if (b.id === excludeBookingId) continue;

    if (b.doctorId === doctorId && b.consultationScheduledAt) {
      const start = new Date(b.consultationScheduledAt);
      slots.push({ start, end: new Date(start.getTime() + DEFAULT_DURATION_MIN * 60000), patientName: b.patientName });
    }

    for (const s of b.sessions ?? []) {
      if (s.doctorId !== doctorId) continue;
      const start = new Date(`${s.date}T${s.time}:00`);
      slots.push({ start, end: new Date(start.getTime() + s.durationMin * 60000), patientName: b.patientName });
    }
  }

  return slots;
}

function slotOverlaps(slots: BusySlot[], date: string, time: string, durationMin: number): BusySlot | null {
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + durationMin * 60000);
  return slots.find((s) => start < s.end && end > s.start) ?? null;
}

export function isSlotFree(slots: BusySlot[], date: string, time: string, durationMin = DEFAULT_DURATION_MIN): boolean {
  return !slotOverlaps(slots, date, time, durationMin);
}

// Who's occupying a given slot, if anyone — for the "busy with X" tooltip.
export function whoIsBusy(slots: BusySlot[], date: string, time: string, durationMin = DEFAULT_DURATION_MIN): string | null {
  return slotOverlaps(slots, date, time, durationMin)?.patientName ?? null;
}

export function getFreeTimesForDate(
  slots: BusySlot[],
  date: string,
  timeOptions: string[] = CONSULTATION_SLOTS,
  durationMin = DEFAULT_DURATION_MIN
): string[] {
  return timeOptions.filter((t) => isSlotFree(slots, date, t, durationMin));
}

// Does the doctor have at least one free slot anywhere in the patient's requested date range?
export function hasFreeSlotInRange(
  slots: BusySlot[],
  rangeStart: string,
  rangeEnd: string,
  timeOptions: string[] = CONSULTATION_SLOTS,
  durationMin = DEFAULT_DURATION_MIN
): boolean {
  let d = new Date(rangeStart);
  const end = new Date(rangeEnd);
  while (d <= end) {
    const dateStr = format(d, "yyyy-MM-dd");
    if (getFreeTimesForDate(slots, dateStr, timeOptions, durationMin).length > 0) return true;
    d = addDays(d, 1);
  }
  return false;
}

// First free date+time from a starting point — used to tell the clinic "next available" when
// the patient's preferred window doesn't line up with this doctor's schedule.
export function findNextFreeSlot(
  slots: BusySlot[],
  fromDate: Date,
  timeOptions: string[] = CONSULTATION_SLOTS,
  durationMin = DEFAULT_DURATION_MIN,
  daysToCheck = 21
): { date: string; time: string } | null {
  for (let i = 0; i < daysToCheck; i++) {
    const d = addDays(fromDate, i);
    const dateStr = format(d, "yyyy-MM-dd");
    for (const t of timeOptions) {
      if (isSlotFree(slots, dateStr, t, durationMin)) return { date: dateStr, time: t };
    }
  }
  return null;
}
