"use client";

import { useState } from "react";
import type { FlightOffer, Segment } from "@/lib/duffel";

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

function formatClockTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function layoverMinutes(prevArrival: string, nextDeparture: string): number {
  const diffMs = new Date(nextDeparture).getTime() - new Date(prevArrival).getTime();
  return Math.max(Math.round(diffMs / 60000), 0);
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

function SegmentTimeline({ segments, label }: { segments: Segment[]; label: string }) {
  if (!segments.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-dusk-700">
      <div className="text-[10px] uppercase tracking-widest text-haze-500 mb-2">{label}</div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-sm">
              <div className="text-haze-100">
                {formatClockTime(seg.departingAt)}{" "}
                <span className="text-haze-500">{seg.originIata}</span>
                <span className="mx-2 text-haze-500">→</span>
                {formatClockTime(seg.arrivingAt)}{" "}
                <span className="text-haze-500">{seg.destinationIata}</span>
              </div>
              <div className="text-haze-400 text-xs">
                {seg.carrierIata}
                {seg.flightNumber} · {seg.carrierName}
              </div>
            </div>
            {seg.aircraftName && (
              <div className="text-xs text-haze-500 mt-0.5">{seg.aircraftName}</div>
            )}
            {i < segments.length - 1 && (
              <div className="text-xs text-runway-400 mt-1 pl-4 border-l border-dusk-600">
                {formatDuration(layoverMinutes(seg.arrivingAt, segments[i + 1].departingAt))} layover
                in {seg.destinationIata}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FareCard({ offer, isBest }: { offer: FlightOffer; isBest: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`relative rounded-xl border ${
        isBest ? "border-runway-500 bg-runway-500/10" : "border-dusk-700 bg-dusk-900/50"
      }`}
    >
      {isBest && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-runway-500 text-dusk-950 text-[10px] font-sans font-bold uppercase tracking-widest">
          Best fare
        </span>
      )}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full text-left p-4 font-mono"
      >
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
          <span>{offer.carrierName}</span>
          <span className="text-haze-500">•</span>
          <span>{formatDuration(offer.durationMinutes)}</span>
          <span className="text-haze-500">•</span>
          <StopBadge stops={offer.stops} />
          <span className="ml-auto font-sans text-haze-500">
            {expanded ? "Hide details ▲" : "Flight details ▼"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <SegmentTimeline
            segments={offer.outboundSegments}
            label={offer.returnDate ? "Outbound" : "Flight"}
          />
          {offer.returnSegments && offer.returnSegments.length > 0 && (
            <SegmentTimeline segments={offer.returnSegments} label="Return" />
          )}
        </div>
      )}
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
