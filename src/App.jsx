import React, { useRef, useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import PlayerBar from "@/components/PlayerBar";
import Library from "@/components/pages/Library";
import SonicWaveformHero from "@/components/ui/sonic-waveform";

export default function App() {
  const audioRef = useRef(null);
  const setAudioRef = usePlayerStore((s) => s.setAudioRef);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playFirst = usePlayerStore((s) => s.playFirst);

  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
      // start with first track ready (optional autoplay)
      // playFirst();
    }
  }, [setAudioRef, playFirst]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play();
    else audioRef.current.pause();
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  };

  return (
    <main className="App bg-black min-h-screen text-slate-100">
      <SonicWaveformHero />

      {/* Foreground app - solid dark, no blur */}
      <div className="relative z-30 flex flex-col min-h-screen bg-black/80">
        <div className="flex flex-1">
          <aside className="hidden sm:block w-60 border-r border-slate-800 p-4">
            <h1 className="text-xl font-bold mb-6">WavePlay</h1>
            <nav className="space-y-2 text-sm">
              <button className="block w-full text-left px-3 py-2 rounded bg-slate-900/60 hover:bg-slate-800">
                Library
              </button>
              <button className="block w-full text-left px-3 py-2 rounded hover:bg-slate-900/60">
                Playlists
              </button>
              <button className="block w-full text-left px-3 py-2 rounded hover:bg-slate-900/60">
                Upload
              </button>
            </nav>
          </aside>

          <main className="flex-1 p-4 pb-28 sm:pb-32 overflow-y-auto">
            <Library />
          </main>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        <PlayerBar />
      </div>
    </main>
  );
}
