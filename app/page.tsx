"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import HUD from "@/components/HUD";
import AircraftPanel from "@/components/AircraftPanel";
import { Aircraft } from "@/lib/types";

// MapLibre touches window/document at import time, so the globe must be client-only.
const Globe = dynamic(() => import("@/components/Globe"), { ssr: false });

export default function Page() {
  const [selected, setSelected] = useState<Aircraft | null>(null);
  const [count, setCount] = useState(0);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-void">
      <Globe onSelect={setSelected} onCountChange={setCount} />
      <HUD count={count} />
      <AircraftPanel aircraft={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
