"use client";

import { useState } from "react";
import SearchForm, { type SearchPayload } from "@/components/SearchForm";
import ResultsList from "@/components/ResultsList";
import type { FlightOffer } from "@/lib/duffel";

type SearchResponse = {
  overallBest: FlightOffer | null;
  byDestination: Record<string, FlightOffer[]>;
  errors?: string[];
  debug?: { destination: string; offerCount: number; error: string | null }[];
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(payload: SearchPayload) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Search failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <header className="mb-10 sm:mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-runway-500 mb-3">
          Personal fare finder
        </p>
        <h1 className="font-display text-4xl sm:text-5xl italic text-haze-100 leading-tight">
          Where to, and when
          <br />
          works for you?
        </h1>
        <p className="mt-4 text-haze-300 max-w-lg">
          Enter where you're willing to fly and the days that work for your calendar.
          This checks live fares across every combination and surfaces the cheapest one.
        </p>
      </header>

      <SearchForm onSubmit={handleSearch} loading={loading} />

      <div className="mt-10">
        {error && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/30 text-red-300 p-4 text-sm">
            {error}
          </div>
        )}

        {result && !error && (
          <ResultsList overallBest={result.overallBest} byDestination={result.byDestination} />
        )}

        {result?.errors && (
          <div className="mt-6 text-xs text-haze-500">
            Some searches didn't return data: {result.errors.join("; ")}
          </div>
        )}
      </div>
    </main>
  );
}
