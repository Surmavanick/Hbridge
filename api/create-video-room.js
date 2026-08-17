// Vercel serverless function: creates a real Daily.co video room for a
// consultation, keeping the API key server-side.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { bookingId, patientName } = req.body || {};
  if (!bookingId || typeof bookingId !== "string") {
    res.status(400).json({ error: "bookingId required" });
    return;
  }

  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    res.status(200).json({ url: null, error: "not_configured" });
    return;
  }

  const safeName = (typeof patientName === "string" && patientName ? patientName : "Patient")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
  const safeBookingId = bookingId.replace(/[^a-zA-Z0-9]/g, "").slice(-10);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const roomName = `HealthBridge-${safeName}-${safeBookingId}-${randomSuffix}`.slice(0, 100);

  try {
    const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "public",
        properties: {
          enable_prejoin_ui: true,
          enable_screenshare: true,
          enable_chat: true,
        },
      }),
    });

    if (!dailyRes.ok) {
      const detail = await dailyRes.text();
      res.status(200).json({ url: null, error: `daily_${dailyRes.status}`, detail: detail.slice(0, 300) });
      return;
    }

    const data = await dailyRes.json();
    res.status(200).json({ url: data.url ?? null });
  } catch {
    res.status(200).json({ url: null, error: "fetch_failed" });
  }
}
