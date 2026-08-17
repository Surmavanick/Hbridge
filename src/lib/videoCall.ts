// Real, working video call rooms via Jitsi Meet's free public server — no API
// key, no account, no setup. The room exists the moment anyone opens the URL.
export function createConsultationRoomUrl(bookingId: string, patientName: string): string {
  const safeName = patientName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "Patient";
  const safeBookingId = bookingId.replace(/[^a-zA-Z0-9]/g, "").slice(-8);
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `https://meet.jit.si/HealthBridge-${safeName}-${safeBookingId}-${randomSuffix}`;
}

// Only meet.jit.si links are real, generated rooms — anything else (old
// mock google.com links, undefined) should be replaced with a fresh one.
export function isRealConsultationRoom(link: string | undefined): boolean {
  return !!link && link.startsWith("https://meet.jit.si/");
}
