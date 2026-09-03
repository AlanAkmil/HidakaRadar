# HidakaRadar

Real-time air traffic tracker on an interactive 3D globe with real map tiles.

- Data: [adsb.fi](https://adsb.fi) open data (community ADS-B, no API key)
- Map: MapLibre GL JS, globe projection, CARTO dark basemap (no API key)
- Stack: Next.js 14 (App Router) + Tailwind + Framer Motion

## How it works

- `app/api/aircraft/route.ts` proxies requests to adsb.fi's `lat/lon/dist`
  endpoint (max 250 NM radius per request — there's no public "whole world at
  once" endpoint), and rate-limits itself to adsb.fi's 1 req/sec public limit.
- `components/Globe.tsx` renders the globe, queries aircraft around whatever
  point is currently centered, and smoothly animates each aircraft between
  polls (every 4s) so movement doesn't look like it's teleporting.
- Tap an aircraft to see its callsign, altitude, speed, heading, and squawk.

## Deploy

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel — no environment variables needed, no API keys.
3. Done.

No local build step is required to deploy; Vercel runs `npm install` and
`npm run build` automatically.
