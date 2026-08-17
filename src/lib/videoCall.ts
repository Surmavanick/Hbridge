// Real, working video call rooms via Daily.co — created server-side
// (api/create-video-room.js) so the API key never reaches the browser.
export async function createConsultationRoomUrl(bookingId: string, patientName: string): Promise<string | null> {
  try {
    const res = await fetch("/api/create-video-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, patientName }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.url === "string" ? data.url : null;
  } catch {
    return null;
  }
}

// Only a real Daily.co room counts — anything else (old fake google.com/jit.si
// links, undefined) should be replaced with a freshly created one.
export function isRealConsultationRoom(link: string | undefined): boolean {
  return !!link && link.includes(".daily.co/");
}
