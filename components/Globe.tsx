"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Aircraft, RawAircraft } from "@/lib/types";
import { normalizeAircraft, radiusFromZoom } from "@/lib/aircraft";

interface TrackedAircraft {
  prev: { lat: number; lon: number; track: number };
  next: { lat: number; lon: number; track: number };
  updatedAt: number;
  data: Aircraft;
}

const POLL_MS = 4000;
const ANIM_MS = POLL_MS; // time to lerp from prev -> next position

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_matter_nolabels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/attributions">CARTO</a> © OpenStreetMap contributors',
    },
    labels: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#080b11" } },
    { id: "carto", type: "raster", source: "carto", paint: { "raster-opacity": 0.9 } },
    { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.55 } },
  ],
};

function buildPlaneIcon(): HTMLImageElement {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(size / 2, size / 2);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  // simple nose-up aircraft glyph (fuselage + wings)
  ctx.moveTo(0, -24);
  ctx.lineTo(6, -6);
  ctx.lineTo(24, 4);
  ctx.lineTo(24, 10);
  ctx.lineTo(6, 4);
  ctx.lineTo(6, 18);
  ctx.lineTo(13, 24);
  ctx.lineTo(13, 28);
  ctx.lineTo(0, 24);
  ctx.lineTo(-13, 28);
  ctx.lineTo(-13, 24);
  ctx.lineTo(-6, 18);
  ctx.lineTo(-6, 4);
  ctx.lineTo(-24, 10);
  ctx.lineTo(-24, 4);
  ctx.lineTo(-6, -6);
  ctx.closePath();
  ctx.fill();
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

export default function Globe({
  onSelect,
  onCountChange,
}: {
  onSelect: (a: Aircraft | null) => void;
  onCountChange: (n: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const tracked = useRef<Map<string, TrackedAircraft>>(new Map());
  const selectedHex = useRef<string | null>(null);
  const rafRef = useRef<number>(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [106.827, -6.175], // Jakarta default
      zoom: 3.2,
      pitch: 0,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    map.on("load", () => {
      map.setProjection({ type: "globe" });
      map.setSky({
        "sky-color": "#0a0e14",
        "horizon-color": "#101623",
        "fog-color": "#0a0e14",
        "fog-ground-blend": 0.5,
        "horizon-fog-blend": 0.6,
        "sky-horizon-blend": 0.8,
        "atmosphere-blend": 0.6,
      });

      const icon = buildPlaneIcon();
      icon.onload = () => {
        if (!map.hasImage("plane")) {
          map.addImage("plane", icon, { sdf: true });
        }
      };

      map.addSource("aircraft", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "aircraft-glow",
        type: "circle",
        source: "aircraft",
        paint: {
          "circle-radius": ["case", ["get", "selected"], 16, 0],
          "circle-color": "#4CC9F0",
          "circle-opacity": 0.25,
          "circle-blur": 1,
        },
      });

      map.addLayer({
        id: "aircraft-icons",
        type: "symbol",
        source: "aircraft",
        layout: {
          "icon-image": "plane",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 2, 0.35, 6, 0.6, 10, 0.9],
          "icon-rotate": ["get", "track"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "text-field": ["step", ["zoom"], "", 5, ["get", "flight"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-allow-overlap": true,
          "text-optional": true,
        },
        paint: {
          "icon-color": [
            "case",
            ["get", "selected"], "#FFB000",
            ["get", "isEmergency"], "#FF5F56",
            ["==", ["get", "altBand"], "ground"], "#8A93A6",
            ["==", ["get", "altBand"], "low"], "#4CC9F0",
            ["==", ["get", "altBand"], "mid"], "#5EEAD4",
            "#FFB000",
          ],
          "text-color": "#C9D3E0",
          "text-halo-color": "#0A0E14",
          "text-halo-width": 1,
        },
      });

      map.on("click", "aircraft-icons", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const hex = f.properties?.hex as string;
        selectedHex.current = hex;
        const t = tracked.current.get(hex);
        if (t) onSelect(t.data);
        renderFrame(1);
      });

      map.on("mouseenter", "aircraft-icons", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "aircraft-icons", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", (e) => {
        const feats = map.queryRenderedFeatures(e.point, { layers: ["aircraft-icons"] });
        if (feats.length === 0) {
          selectedHex.current = null;
          onSelect(null);
          renderFrame(1);
        }
      });

      const fetchAircraft = async () => {
        const center = map.getCenter();
        const dist = radiusFromZoom(map.getZoom());
        try {
          const res = await fetch(
            `/api/aircraft?lat=${center.lat.toFixed(4)}&lon=${center.lng.toFixed(4)}&dist=${dist}`
          );
          if (!res.ok) return;
          const json = await res.json();
          const list = normalizeAircraft(json.aircraft as RawAircraft[]);
          const now = Date.now();
          const seen = new Set<string>();

          for (const a of list) {
            seen.add(a.hex);
            const existing = tracked.current.get(a.hex);
            if (existing) {
              existing.prev = interpolatedPosition(existing, now);
              existing.next = { lat: a.lat, lon: a.lon, track: a.track };
              existing.updatedAt = now;
              existing.data = a;
            } else {
              tracked.current.set(a.hex, {
                prev: { lat: a.lat, lon: a.lon, track: a.track },
                next: { lat: a.lat, lon: a.lon, track: a.track },
                updatedAt: now,
                data: a,
              });
            }
          }
          // drop aircraft not seen in this poll (left the query area)
          for (const hex of Array.from(tracked.current.keys())) {
            if (!seen.has(hex)) tracked.current.delete(hex);
          }
          onCountChange(tracked.current.size);
          if (selectedHex.current && !seen.has(selectedHex.current)) {
            selectedHex.current = null;
            onSelect(null);
          } else if (selectedHex.current) {
            const t = tracked.current.get(selectedHex.current);
            if (t) onSelect(t.data);
          }
        } catch {
          // network hiccup: keep last known positions, try again next poll
        }
      };

      fetchAircraft();
      pollTimer.current = setInterval(fetchAircraft, POLL_MS);
      map.on("moveend", fetchAircraft);

      const tick = () => {
        renderFrame(easedProgress());
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    });

    function easedProgress() {
      return 1; // per-aircraft progress computed inside renderFrame via updatedAt
    }

    function interpolatedPosition(t: TrackedAircraft, now: number) {
      const p = Math.min(1, (now - t.updatedAt) / ANIM_MS);
      return {
        lat: t.prev.lat + (t.next.lat - t.prev.lat) * p,
        lon: t.prev.lon + (t.next.lon - t.prev.lon) * p,
        track: t.next.track,
      };
    }

    function renderFrame(_unused: number) {
      const src = map.getSource("aircraft") as GeoJSONSource | undefined;
      if (!src) return;
      const now = Date.now();
      const features = Array.from(tracked.current.entries()).map(([hex, t]) => {
        const pos = interpolatedPosition(t, now);
        const alt = t.data.altitude;
        const altBand =
          alt === "ground" ? "ground" : alt < 10000 ? "low" : alt < 30000 ? "mid" : "high";
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [pos.lon, pos.lat] },
          properties: {
            hex,
            flight: t.data.flight,
            track: pos.track,
            altBand,
            isEmergency: t.data.isEmergency,
            selected: hex === selectedHex.current,
          },
        };
      });
      src.setData({ type: "FeatureCollection", features });
    }

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      cancelAnimationFrame(rafRef.current);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
