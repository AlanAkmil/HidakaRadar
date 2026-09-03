"use client";

import { motion } from "framer-motion";

export default function HUD({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="pointer-events-none absolute left-3 right-3 top-3 flex items-start justify-between gap-3 sm:left-4 sm:right-4 sm:top-4"
    >
      <div className="hud-panel hud-scanline pointer-events-auto flex items-center gap-2.5 rounded-md px-3 py-2">
        <div className="relative h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-phosphor" />
          <span className="absolute inset-0 animate-ping rounded-full bg-phosphor opacity-60" />
        </div>
        <div>
          <div className="font-display text-[15px] font-bold leading-none tracking-wide text-white">
            HIDAKA<span className="text-amber">RADAR</span>
          </div>
          <div className="mt-0.5 text-[10px] leading-none text-mist">
            LIVE ADS-B · adsb.fi
          </div>
        </div>
      </div>

      <div className="hud-panel hud-scanline pointer-events-auto rounded-md px-3 py-2 text-right">
        <div className="tabular font-display text-[15px] font-bold leading-none text-cyan">
          {count.toString().padStart(3, "0")}
        </div>
        <div className="mt-0.5 text-[10px] leading-none text-mist">
          AIRCRAFT IN VIEW
        </div>
      </div>
    </motion.div>
  );
}
