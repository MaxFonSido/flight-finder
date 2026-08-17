import type { FlightOffer } from "@/lib/amadeus";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function StopBadge({ stops }: { stops: number }) {
  if (stops === 0) {
    return <span className="text-runway-400">Nonstop</span>;
  }
  return (
    <span className="text-haze-500">
      {stops} stop{stops > 1 ? "s" : ""}
    </span>
  );
}

function FareCard({ offer, isBest }: { offer: FlightOffer; isBest: boolean }) {
  return (
    <div
      className={`relative rounded-xl border p-4 font-mono ${
        isBest
          ? "border-runway-500 bg-runway-500/10"
          : "border-dusk-700 bg-dusk-900/50"
      }`}
    >
      {isBest && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-runway-500 text-dusk-950 text-[10px] font-sans font-bold uppercase tracking-widest">
          Best fare
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <div className="text-lg tracking-widest text-haze-100">
          {offer.origin} <span className="text-haze-500">→</span> {offer.destination}
        </div>
        <div className="text-2xl font-semibold text-haze-100">
          ${offer.price.toFixed(0)}
          <span className="text-xs text-haze-500 ml-1">{offer.currency}</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-haze-300">
        <span>{formatDate(offer.departureDate)}</span>
        {offer.returnDate && (
          <>
            <span className="text-haze-500">–</span>
            <span>{formatDate(offer.returnDate)}</span>
          </>
        )}
        <span className="text-haze-500">•</span>
        <span>{offer.carrier}</span>
        <span className="text-haze-500">•</span>
        <span>{formatDuration(offer.durationMinutes)}</span>
        <span className="text-haze-500">•</span>
        <StopBadge stops={offer.stops} />
      </div>
    </div>
  );
}

export default function ResultsList({
  overallBest,
  byDestination,
}: {
  overallBest: FlightOffer | null;
  byDestination: Record<string, FlightOffer[]>;
}) {
  const destinations = Object.keys(byDestination);

  if (destinations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-dusk-700 p-10 text-center text-haze-500">
        No fares found for that combination. Try widening the date range or adding another destination.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {overallBest && (
        <div>
          <h2 className="font-display text-xl italic text-haze-100 mb-3">
            Your best overall option
          </h2>
          <FareCard offer={overallBest} isBest />
        </div>
      )}

      {destinations.map((dest) => {
        const offers = byDestination[dest];
        if (!offers.length) return null;
        return (
          <div key={dest}>
            <h3 className="font-display text-lg text-haze-300 mb-3">
              To {dest}
              <span className="ml-2 text-sm font-body text-haze-500">
                cheapest ${offers[0].price.toFixed(0)}
              </span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {offers.slice(0, 4).map((offer) => (
                <FareCard
                  key={offer.id + offer.departureDate}
                  offer={offer}
                  isBest={overallBest?.id === offer.id && overallBest?.departureDate === offer.departureDate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
