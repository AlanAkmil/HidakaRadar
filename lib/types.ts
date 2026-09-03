export interface RawAircraft {
  hex: string;
  flight?: string;
  r?: string; // registration
  t?: string; // aircraft type
  alt_baro?: number | "ground";
  gs?: number; // ground speed, knots
  track?: number; // true track, degrees
  lat?: number;
  lon?: number;
  squawk?: string;
  category?: string;
  emergency?: string;
}

export interface Aircraft {
  hex: string;
  flight: string;
  registration: string;
  type: string;
  altitude: number | "ground";
  speed: number;
  track: number;
  lat: number;
  lon: number;
  squawk: string;
  isMilitary: boolean;
  isEmergency: boolean;
  lastSeen: number;
}

export interface GlobeCenter {
  lat: number;
  lon: number;
}
