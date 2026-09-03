"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Aircraft } from "@/lib/types";
import { altitudeLabel, speedLabel } from "@/lib/aircraft";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-mist">{label}</div>
      <div
        className={`tabular mt-0.5 text-base font-semibold ${accent ?? "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function AircraftPanel({
  aircraft,
  onClose,
}: {
  aircraft: Aircraft | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {aircraft && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="hud-panel hud-scanline absolute bottom-3 left-3 right-3 rounded-lg p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:w-80"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-lg font-bold leading-none text-white">
                {aircraft.flight}
              </div>
              <div className="mt-1 text-[11px] text-mist">
                {aircraft.hex.toUpperCase()} · {aircraft.registration} · {aircraft.type}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded border border-panel-line px-2 py-1 text-[11px] text-mist transition hover:border-cyan hover:text-cyan"
              aria-label="Close"
            >
              CLOSE
            </button>
          </div>

          {aircraft.isEmergency && (
            <div className="mt-2 rounded border border-alert/40 bg-alert/10 px-2 py-1 text-[11px] font-semibold text-alert">
              SQUAWK {aircraft.squawk} · EMERGENCY
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Altitude" value={altitudeLabel(aircraft.altitude)} accent="text-cyan" />
            <Stat label="Speed" value={speedLabel(aircraft.speed)} accent="text-phosphor" />
            <Stat label="Heading" value={`${Math.round(aircraft.track)}°`} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Squawk" value={aircraft.squawk || "—"} />
            <Stat
              label="Position"
              value={`${aircraft.lat.toFixed(2)}, ${aircraft.lon.toFixed(2)}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
