export interface LiveFlightPrice {
  min: number;
  max: number;
}

const cache = new Map<string, Promise<LiveFlightPrice | null>>();

async function fetchPrice(originIata: string, destination: string): Promise<LiveFlightPrice | null> {
  try {
    const res = await fetch(
      `/api/flight-price?origin=${encodeURIComponent(originIata)}&destination=${encodeURIComponent(destination)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.found) return null;
    return { min: data.min, max: data.max };
  } catch {
    return null;
  }
}

// Module-level cache so multiple booking cards for the same route (or
// re-renders) share one in-flight request instead of firing duplicates.
export function fetchLiveFlightPrice(originIata: string, destination = "TBS"): Promise<LiveFlightPrice | null> {
  const key = `${originIata}-${destination}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetchPrice(originIata, destination);
    cache.set(key, pending);
  }
  return pending;
}
