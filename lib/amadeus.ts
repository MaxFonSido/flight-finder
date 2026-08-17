// Thin client for the Amadeus Self-Service Flight APIs.
// Docs: https://developers.amadeus.com/self-service/category/flights

const AMADEUS_ENV = process.env.AMADEUS_ENV === "production" ? "production" : "test";

const BASE_URL =
  AMADEUS_ENV === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
    return cachedToken.token;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET. Add them to .env.local."
    );
  }

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

async function amadeusGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus request failed (${res.status}) for ${path}: ${text}`);
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
  deepLink?: string;
};

function isoDurationToMinutes(iso: string): number {
  // e.g. "PT14H35M" -> 875
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  return hours * 60 + minutes;
}

/**
 * Search one-way or round-trip flight offers for a single origin/destination/date combo.
 * Returns the cheapest few offers for that combo, normalized to a flat shape.
 */
export async function searchFlightOffers(opts: {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  adults?: number;
  maxResults?: number;
  nonStop?: boolean;
  currency?: string;
}): Promise<FlightOffer[]> {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = 1,
    maxResults = 5,
    nonStop = false,
    currency = "USD",
  } = opts;

  const params: Record<string, string> = {
    originLocationCode: origin.toUpperCase(),
    destinationLocationCode: destination.toUpperCase(),
    departureDate,
    adults: String(adults),
    max: String(maxResults),
    currencyCode: currency,
  };
  if (returnDate) params.returnDate = returnDate;
  if (nonStop) params.nonStop = "true";

  const data = await amadeusGet<any>("/v2/shopping/flight-offers", params);

  const offers: FlightOffer[] = (data.data ?? []).map((offer: any) => {
    const itinerary = offer.itineraries?.[0];
    const segments = itinerary?.segments ?? [];
    const stops = Math.max(segments.length - 1, 0);
    const carrier = segments[0]?.carrierCode ?? "??";

    return {
      id: offer.id,
      price: parseFloat(offer.price?.grandTotal ?? offer.price?.total ?? "0"),
      currency: offer.price?.currency ?? currency,
      origin,
      destination,
      departureDate,
      returnDate,
      stops,
      durationMinutes: isoDurationToMinutes(itinerary?.duration ?? "PT0M"),
      carrier,
    };
  });

  return offers.sort((a, b) => a.price - b.price);
}

/**
 * Cheapest-date search: given a fixed origin/destination, returns the cheapest
 * days to fly within Amadeus's own date-flexibility window.
 */
export async function searchCheapestDates(opts: {
  origin: string;
  destination: string;
  departureDate?: string; // optional anchor date, YYYY-MM-DD
  oneWay?: boolean;
  currency?: string;
}): Promise<{ departureDate: string; returnDate?: string; price: number }[]> {
  const { origin, destination, departureDate, oneWay = false, currency = "USD" } = opts;

  const params: Record<string, string> = {
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    oneWay: String(oneWay),
    currency,
  };
  if (departureDate) params.departureDate = departureDate;

  const data = await amadeusGet<any>("/v1/shopping/flight-dates", params);

  return (data.data ?? [])
    .map((d: any) => ({
      departureDate: d.departureDate,
      returnDate: d.returnDate,
      price: parseFloat(d.price?.total ?? "0"),
    }))
    .sort((a: any, b: any) => a.price - b.price);
}
