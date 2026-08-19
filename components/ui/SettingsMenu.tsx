"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import type { GameMode } from "@/lib/types";

const MODE_OPTIONS: readonly { mode: GameMode; label: string }[] = [
  { mode: "bot", label: "vs Bot" },
  { mode: "twoPlayer", label: "2 Players" },
];

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const gameMode = useGameStore((state) => state.gameMode);
  const setGameMode = useGameStore((state) => state.setGameMode);

  return (
    <div
      className="absolute right-3 z-30 flex flex-col items-end gap-2"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Game mode settings"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-lg text-white backdrop-blur-sm transition-transform active:scale-95"
      >
        ⚙
      </button>

      {open && (
        <div className="overflow-hidden rounded-xl bg-neutral-900/95 shadow-xl">
          {MODE_OPTIONS.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setGameMode(mode);
                setOpen(false);
              }}
              className={`block min-h-11 w-32 px-4 py-2 text-left text-sm ${
                gameMode === mode ? "bg-white/10 font-semibold text-white" : "text-white/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
