// Vercel serverless function: proxies a live round-trip flight price lookup
// from SerpApi's Google Flights engine, keeping the API key server-side.
//
// The response is cached at Vercel's edge (Cache-Control s-maxage) so that
// repeat requests for the same origin/destination pair — from any visitor —
// are served from the CDN instead of spending SerpApi search quota.

const CACHE_HEADER =
  "public, s-maxage=1209600, stale-while-revalidate=2592000"; // fresh 14d, then serve-stale-while-refreshing up to 30d

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const origin = typeof req.query.origin === "string" ? req.query.origin.toUpperCase() : "";
  const destination =
    typeof req.query.destination === "string" && req.query.destination
      ? req.query.destination.toUpperCase()
      : "TBS";

  if (!origin || !/^[A-Z]{3}$/.test(origin)) {
    res.status(400).json({ found: false, error: "Invalid origin airport code" });
    return;
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    res.status(200).json({ found: false, error: "not_configured" });
    return;
  }

  // Reasonable medical-tourism travel window: booked ~45 days out, ~21-day stay.
  const outbound = new Date();
  outbound.setDate(outbound.getDate() + 45);
  const ret = new Date(outbound);
  ret.setDate(ret.getDate() + 21);

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_flights");
  url.searchParams.set("departure_id", origin);
  url.searchParams.set("arrival_id", destination);
  url.searchParams.set("outbound_date", formatDate(outbound));
  url.searchParams.set("return_date", formatDate(ret));
  url.searchParams.set("type", "1"); // round trip
  url.searchParams.set("currency", "USD");
  url.searchParams.set("api_key", apiKey);

  try {
    const r = await fetch(url.toString());
    if (!r.ok) {
      res.status(200).json({ found: false, error: `upstream_${r.status}` });
      return;
    }
    const data = await r.json();

    let min, max;
    const range = data.price_insights && data.price_insights.typical_price_range;
    if (Array.isArray(range) && range.length === 2) {
      [min, max] = range;
    } else {
      const prices = [...(data.best_flights || []), ...(data.other_flights || [])]
        .map((f) => f.price)
        .filter((p) => typeof p === "number");
      if (prices.length === 0) {
        res.setHeader("Cache-Control", CACHE_HEADER);
        res.status(200).json({ found: false });
        return;
      }
      min = Math.min(...prices);
      max = Math.max(...prices);
    }

    res.setHeader("Cache-Control", CACHE_HEADER);
    res.status(200).json({ found: true, min, max, currency: "USD" });
  } catch (err) {
    res.status(200).json({ found: false, error: "fetch_failed" });
  }
};
