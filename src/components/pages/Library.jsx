import React from "react";
import { usePlayerStore } from "@/store/playerStore";

export default function Library() {
  const queue = usePlayerStore((s) => s.queue);
  const setTrackByIndex = usePlayerStore((s) => s.setTrackByIndex);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Library</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {queue.map((track, index) => (
          <button
            key={track.id}
            onClick={() => setTrackByIndex(index)}
            className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-left hover:bg-slate-800/80 transition"
          >
            <div className="w-12 h-12 mb-3 rounded-md bg-gradient-to-br from-purple-500 to-pink-500" />
            <p className="font-medium truncate">{track.title}</p>
            <p className="text-xs text-slate-400 truncate">
              {track.artist}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
