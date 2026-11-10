"use client";

import type { ReactNode } from "react";
import { PlayerProvider as PlayerContextProvider } from "@/lib/player-context";

/**
 * Mounted once in the root layout (site-ui scope) so the single <audio>
 * element and the queue state survive client-side route changes.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  return <PlayerContextProvider>{children}</PlayerContextProvider>;
}

export default PlayerProvider;
