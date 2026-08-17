import { NextRequest, NextResponse } from "next/server";
import { searchFlightOffers, type FlightOffer } from "@/lib/duffel";
import { expandCandidateDates, addDays } from "@/lib/dates";

export const dynamic = "force-dynamic";

type SearchRequestBody = {
  origin: string;
  destinations: string[];
  dateFrom: string;
  dateTo: string;
  preferredWeekdays?: string[]; // e.g. ["fri","sat"]
  tripLengthDays?: number; // if set, treated as round trip of this length
  maxDatesPerDestination?: number;
  nonStopOnly?: boolean;
};

// Hard ceiling on total API calls per request so a fat-fingered search
// range doesn't rack up an excessive number of Duffel offer requests.
const MAX_TOTAL_CALLS = 24;

export async function POST(req: NextRequest) {
  let body: SearchRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    origin,
    destinations,
    dateFrom,
    dateTo,
    preferredWeekdays = [],
    tripLengthDays,
    maxDatesPerDestination = 4,
    nonStopOnly = false,
  } = body;

  if (!origin || !destinations?.length || !dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "origin, destinations, dateFrom, and dateTo are required" },
      { status: 400 }
    );
  }

  const perDestinationCap = Math.max(
    1,
    Math.min(maxDatesPerDestination, Math.floor(MAX_TOTAL_CALLS / destinations.length))
  );

  const candidateDates = expandCandidateDates(dateFrom, dateTo, preferredWeekdays, perDestinationCap);

  if (candidateDates.length === 0) {
    return NextResponse.json(
      { error: "No candidate dates matched the given range and preferred weekdays" },
      { status: 400 }
    );
  }

  const jobs: Promise<{ destination: string; offers: FlightOffer[]; error?: string }>[] = [];

  for (const destination of destinations) {
    for (const departureDate of candidateDates) {
      const returnDate = tripLengthDays ? addDays(departureDate, tripLengthDays) : undefined;

      jobs.push(
        searchFlightOffers({
          origin,
          destination,
          departureDate,
          returnDate,
          nonStop: nonStopOnly,
          maxResults: 3,
        })
          .then((offers) => ({ destination, offers }))
          .catch((err: Error) => ({ destination, offers: [], error: err.message }))
      );
    }
  }

  const settled = await Promise.all(jobs);

  const errors = settled.filter((r) => r.error).map((r) => `${r.destination}: ${r.error}`);
  const allOffers = settled.flatMap((r) => r.offers);

  // Temporary diagnostics: shows exactly what each Duffel search returned,
  // so we can see what's happening even without server log access.
  const debug = settled.map((r) => ({
    destination: r.destination,
    offerCount: r.offers.length,
    error: r.error ?? null,
  }));

  // Group by destination, cheapest first
  const byDestination: Record<string, FlightOffer[]> = {};
  for (const offer of allOffers) {
    byDestination[offer.destination] ??= [];
    byDestination[offer.destination].push(offer);
  }
  for (const dest of Object.keys(byDestination)) {
    byDestination[dest].sort((a, b) => a.price - b.price);
  }

  const overallBest = [...allOffers].sort((a, b) => a.price - b.price)[0] ?? null;

  return NextResponse.json({
    searched: {
      origin,
      destinations,
      candidateDates,
      tripLengthDays: tripLengthDays ?? null,
    },
    overallBest,
    byDestination,
    errors: errors.length ? errors : undefined,
    debug,
  });
}
