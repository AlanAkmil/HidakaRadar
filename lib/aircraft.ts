import { Aircraft, RawAircraft } from "./types";

const EMERGENCY_SQUAWKS = new Set(["7500", "7600", "7700"]);

export function normalizeAircraft(raw: RawAircraft[]): Aircraft[] {
  const out: Aircraft[] = [];
  for (const a of raw) {
    if (typeof a.lat !== "number" || typeof a.lon !== "number") continue;
    const squawk = a.squawk ?? "";
    out.push({
      hex: a.hex,
      flight: (a.flight ?? "").trim() || a.hex.toUpperCase(),
      registration: a.r ?? "—",
      type: a.t ?? "UNK",
      altitude: a.alt_baro === "ground" ? "ground" : a.alt_baro ?? 0,
      speed: a.gs ?? 0,
      track: a.track ?? 0,
      lat: a.lat,
      lon: a.lon,
      squawk,
      isMilitary: a.category === "A7" || (a.t ?? "").startsWith("MIL"),
      isEmergency: EMERGENCY_SQUAWKS.has(squawk) || a.emergency === "true",
      lastSeen: Date.now(),
    });
  }
  return out;
}

/** Great-circle distance in nautical miles, used to size query radius from zoom. */
export function radiusFromZoom(zoom: number): number {
  // Roughly: fully zoomed out globe -> max 250nm radius, closer zoom -> tighter query
  if (zoom <= 1.5) return 250;
  if (zoom <= 3) return 180;
  if (zoom <= 5) return 100;
  if (zoom <= 7) return 50;
  return 25;
}

export function altitudeLabel(alt: Aircraft["altitude"]): string {
  if (alt === "ground") return "GND";
  return `${Math.round(alt).toLocaleString("en-US")} ft`;
}

export function speedLabel(kts: number): string {
  return `${Math.round(kts)} kt`;
}
