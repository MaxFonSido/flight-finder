// Thin client for the Duffel Flights API.
// Docs: https://duffel.com/docs/api/overview/welcome

const BASE_URL = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

function getAccessToken(): string {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Missing DUFFEL_ACCESS_TOKEN. Add it to .env.local (see .env.local.example)."
    );
  }
  return token;
}

async function duffelRequest<T>(
  path: string,
  opts: { method?: "GET" | "POST"; body?: unknown; query?: Record<string, string> } = {}
): Promise<T> {
  const token = getAccessToken();
  const url = new URL(`${BASE_URL}${path}`);
  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": DUFFEL_VERSION,
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify({ data: opts.body }) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Duffel request failed (${res.status}) for ${path}: ${text}`);
  }

  return res.json();
}

export type FlightOffer = {
  id: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  stops: number;
  durationMinutes: number;
  carrier: string;
};

function isoDurationToMinutes(iso: string | null | undefined): number {
  // e.g. "PT14H35M" -> 875
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  return hours * 60 + minutes;
}

/**
 * Search one-way or round-trip flight offers for a single origin/destination/date combo.
 * Creates a Duffel offer request (synchronously returning offers) and normalizes the
 * cheapest few results to a flat shape.
 */
export async function searchFlightOffers(opts: {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  adults?: number;
  maxResults?: number;
  nonStop?: boolean;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}): Promise<FlightOffer[]> {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    maxResults = 5,
    nonStop = false,
    cabinClass = "economy",
  } = opts;

  const slices = [
    {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departure_date: departureDate,
    },
  ];
  if (returnDate) {
    slices.push({
      origin: destination.toUpperCase(),
      destination: origin.toUpperCase(),
      departure_date: returnDate,
    });
  }

  const data = await duffelRequest<any>("/air/offer_requests", {
    method: "POST",
    query: { return_offers: "true" },
    body: {
      slices,
      passengers: Array.from({ length: adults }, () => ({ type: "adult" })),
      cabin_class: cabinClass,
    },
  });

  let offers: any[] = data.data?.offers ?? [];

  if (nonStop) {
    offers = offers.filter((offer) =>
      offer.slices.every((slice: any) => slice.segments.length === 1)
    );
  }

  const normalized: FlightOffer[] = offers.map((offer: any) => {
    const outboundSlice = offer.slices?.[0];
    const segments = outboundSlice?.segments ?? [];
    const stops = Math.max(segments.length - 1, 0);
    const carrier =
      segments[0]?.marketing_carrier?.iata_code ??
      segments[0]?.operating_carrier?.iata_code ??
      "??";

    return {
      id: offer.id,
      price: parseFloat(offer.total_amount ?? "0"),
      currency: offer.total_currency ?? "USD",
      origin,
      destination,
      departureDate,
      returnDate,
      stops,
      durationMinutes: isoDurationToMinutes(outboundSlice?.duration),
      carrier,
    };
  });

  return normalized.sort((a, b) => a.price - b.price).slice(0, maxResults);
}
