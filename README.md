# Flight Finder

A personal tool: give it an origin, a list of destinations you'd fly to, and the days
that work for you — it searches live fares across every combination via the Amadeus
Flight Offers Search API and surfaces the cheapest option.

## 1. Get an Amadeus API key (free)

1. Sign up at https://developers.amadeus.com
2. Go to **My Self-Service Workspace** → **Create New App**
3. Copy the **API Key** and **API Secret**

The free "test" tier gives you a generous monthly quota of sandbox-scoped fare data —
plenty for personal use. No credit card required.

## 2. Configure

```bash
cp .env.local.example .env.local
```

Fill in `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` in `.env.local`.

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
- The app expands that into a capped set of candidate dates (max 24 total API calls
  per search, to stay well within the free-tier quota), fans out searches across
  every destination × date combination, and ranks everything by price.
- Results show the single best fare found, plus the cheapest options per destination.

## 5. Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

Then import the repo in Vercel, and add the same two environment variables
(`AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`) in the Vercel project settings under
**Environment Variables**. Redeploy after adding them.

## Notes / next steps

- Airport codes are IATA codes (e.g. `BWI`, `LAX`) — no city-name lookup yet.
- The Amadeus test environment returns realistic but not always fully live pricing.
  For production-grade real-time fares at higher volume, you'd move to Amadeus's
  paid production tier (same code, just flip `AMADEUS_ENV=production`).
- Ideas for later: save searches to Supabase and track price history over time,
  add a city-to-airport-code autocomplete, email/SMS alerts when a fare drops.
