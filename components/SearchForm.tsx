"use client";

import { useState } from "react";

const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export type SearchPayload = {
  origin: string;
  destinations: string[];
  dateFrom: string;
  dateTo: string;
  preferredWeekdays: string[];
  tripLengthDays?: number;
  nonStopOnly: boolean;
};

export default function SearchForm({
  onSubmit,
  loading,
}: {
  onSubmit: (payload: SearchPayload) => void;
  loading: boolean;
}) {
  const [origin, setOrigin] = useState("");
  const [destinationsRaw, setDestinationsRaw] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [weekdays, setWeekdays] = useState<string[]>([]);
  const [tripLength, setTripLength] = useState<string>("");
  const [nonStopOnly, setNonStopOnly] = useState(false);

  function toggleWeekday(key: string) {
    setWeekdays((prev) =>
      prev.includes(key) ? prev.filter((w) => w !== key) : [...prev, key]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const destinations = destinationsRaw
      .split(",")
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean);

    if (!origin.trim() || destinations.length === 0 || !dateFrom || !dateTo) return;

    onSubmit({
      origin: origin.trim().toUpperCase(),
      destinations,
      dateFrom,
      dateTo,
      preferredWeekdays: weekdays,
      tripLengthDays: tripLength ? parseInt(tripLength, 10) : undefined,
      nonStopOnly,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dusk-700 bg-dusk-900/60 backdrop-blur-sm p-6 sm:p-8 space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="From (airport code)">
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="BWI"
            maxLength={3}
            required
            className="input font-mono uppercase tracking-widest"
          />
        </Field>

        <Field label="To — one or more, comma separated">
          <input
            value={destinationsRaw}
            onChange={(e) => setDestinationsRaw(e.target.value)}
            placeholder="LAX, SFO, SEA"
            required
            className="input font-mono uppercase tracking-widest"
          />
        </Field>

        <Field label="Earliest departure">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            required
            className="input"
          />
        </Field>

        <Field label="Latest departure">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            required
            className="input"
          />
        </Field>

        <Field label="Trip length in nights (optional, round trip)">
          <input
            type="number"
            min={1}
            max={60}
            value={tripLength}
            onChange={(e) => setTripLength(e.target.value)}
            placeholder="One-way if blank"
            className="input"
          />
        </Field>

        <Field label="Options">
          <label className="flex items-center gap-2 h-10 text-sm text-haze-300">
            <input
              type="checkbox"
              checked={nonStopOnly}
              onChange={(e) => setNonStopOnly(e.target.checked)}
              className="h-4 w-4 rounded border-dusk-600 bg-dusk-800 text-runway-500 focus:ring-runway-500"
            />
            Nonstop flights only
          </label>
        </Field>
      </div>

      <div>
        <span className="block text-xs uppercase tracking-widest text-haze-500 mb-2">
          Preferred travel days
          <span className="normal-case tracking-normal text-haze-500/70"> — leave blank for any day</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((w) => {
            const active = weekdays.includes(w.key);
            return (
              <button
                type="button"
                key={w.key}
                onClick={() => toggleWeekday(w.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-runway-500 border-runway-500 text-dusk-950"
                    : "border-dusk-600 text-haze-300 hover:border-haze-500"
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-runway-500 text-dusk-950 font-semibold tracking-tight hover:bg-runway-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Searching fares…" : "Find best flights"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-haze-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
