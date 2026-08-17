# Flight Finder

A personal tool: give it an origin, a list of destinations you'd fly to, and the days
that work for you — it searches live-format fares across every combination via the
Duffel Flights API and surfaces the cheapest option.

## 1. Get a Duffel API token (free)

1. Sign up at https://duffel.com (any personal email works, "Personal Use" is fine
   for company name)
2. In the dashboard, go to **More → Developers → Access tokens**
3. Keep the **Test mode** toggle on (top left) — a `duffel_test_...` token is created
   automatically. This returns realistic sandbox data with zero cost and no live orders.

## 2. Configure

```bash
cp .env.local.example .env.local
```

Paste your token into `.env.local` as `DUFFEL_ACCESS_TOKEN`.

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 4. How the search works

- You enter an origin airport code, one or more destination codes, a date range,
  optional preferred weekdays (e.g. only Fridays/Saturdays), and an optional trip
  length in nights (for round trips).
- The app expands that into a capped set of candidate dates (max 24 total requests
  per search), fans out a Duffel offer request across every destination × date
  combination, and ranks everything by price.
- Results show the single best fare found, plus the cheapest options per destination.

## 5. Deploy to Vercel

Easiest path if you don't want to run anything locally:

1. Create a new empty repository on GitHub and upload this project's files
   (drag-and-drop works fine on the GitHub web UI — no terminal required)
2. Go to vercel.com, sign in with GitHub, **Add New Project**, select the repo
3. Before deploying, expand **Environment Variables** and add `DUFFEL_ACCESS_TOKEN`
   with your token value
4. Click Deploy — Vercel builds and hosts it, giving you a live URL

Every push to the repo automatically redeploys.

## Notes / next steps

- Airport codes are IATA codes (e.g. `BWI`, `LAX`) — no city-name lookup yet.
- This uses your **test mode** token, so pricing is realistic sandbox data, not
  bookable live fares. To go live, Duffel requires business verification and a
  balance top-up (see the "Go live" banner in their dashboard) — swap in a
  `duffel_live_...` token once that's done; no code changes needed.
- Ideas for later: save searches to Supabase and track price history over time,
  add a city-to-airport-code autocomplete, email/SMS alerts when a fare drops.
