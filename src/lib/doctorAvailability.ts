import { addDays, format } from "date-fns";
import type { BookingRequest, Doctor } from "@/data/mockData";

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

// First free date+time within a specific range (e.g. the patient's requested
// window) — null if the doctor has nothing open in it.
export function findFirstFreeSlotInRange(
  slots: BusySlot[],
  rangeStart: string,
  rangeEnd: string,
  timeOptions: string[] = CONSULTATION_SLOTS,
  durationMin = DEFAULT_DURATION_MIN
): { date: string; time: string } | null {
  let d = new Date(rangeStart);
  const end = new Date(rangeEnd);
  while (d <= end) {
    const dateStr = format(d, "yyyy-MM-dd");
    const free = getFreeTimesForDate(slots, dateStr, timeOptions, durationMin);
    if (free.length > 0) return { date: dateStr, time: free[0] };
    d = addDays(d, 1);
  }
  return null;
}

// Does the doctor have at least one free slot anywhere in the patient's requested date range?
export function hasFreeSlotInRange(
  slots: BusySlot[],
  rangeStart: string,
  rangeEnd: string,
  timeOptions: string[] = CONSULTATION_SLOTS,
  durationMin = DEFAULT_DURATION_MIN
): boolean {
  return findFirstFreeSlotInRange(slots, rangeStart, rangeEnd, timeOptions, durationMin) !== null;
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

// Rough category → specialty keyword match, to suggest the most relevant
// doctor first. Not a hard filter — clinics can still pick anyone on staff.
export function specialtyMatchScore(procedureCategory: string, doctorSpecialty: string): number {
  const a = procedureCategory.toLowerCase();
  const b = doctorSpecialty.toLowerCase();
  if (a === b) return 2;
  if (a.includes(b) || b.includes(a)) return 1;
  return 0;
}

export function sortDoctorsBySpecialtyMatch(doctors: Doctor[], procedureCategory: string): Doctor[] {
  return [...doctors].sort(
    (a, b) => specialtyMatchScore(procedureCategory, b.specialty) - specialtyMatchScore(procedureCategory, a.specialty)
  );
}

export function pickBestDoctor(doctors: Doctor[], procedureCategory: string): Doctor | undefined {
  return sortDoctorsBySpecialtyMatch(doctors, procedureCategory)[0];
}
