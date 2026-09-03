import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADSBFI_BASE = "https://opendata.adsb.fi/api/v2";

// Simple in-memory rate limiter so we never exceed adsb.fi's 1 req/sec
// public limit even if multiple browser tabs are polling this route.
let lastUpstreamCall = 0;
const MIN_INTERVAL_MS = 1050;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const dist = searchParams.get("dist") ?? "150";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon query params are required" },
      { status: 400 }
    );
  }

  const clampedDist = Math.min(Math.max(Number(dist) || 150, 1), 250);

  const wait = MIN_INTERVAL_MS - (Date.now() - lastUpstreamCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastUpstreamCall = Date.now();

  const upstreamUrl = `${ADSBFI_BASE}/lat/${lat}/lon/${lon}/dist/${clampedDist}`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: { "User-Agent": "HidakaRadar/1.0 (personal, non-commercial)" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      { aircraft: data.ac ?? [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "failed to reach adsb.fi" },
      { status: 502 }
    );
  }
}
