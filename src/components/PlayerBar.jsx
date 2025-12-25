import React, { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import WaveformCanvas from "./WaveformCanvas";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaVolumeUp,
  FaVolumeMute,
  FaRandom,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
};

export default function PlayerBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const audioRef = usePlayerStore((s) => s.audioRef);
  const isExpanded = usePlayerStore((s) => s.isExpanded);
  const toggleExpanded = usePlayerStore((s) => s.toggleExpanded);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const handlePlayPause = () => {
    if (!currentTrack || !audioRef) return;
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!audioRef) return;
    const value = Number(e.target.value);
    audioRef.currentTime = value;
  };

  const handleVolume = (e) => {
    if (!audioRef) return;
    const v = Number(e.target.value);
    setVolume(v);
    audioRef.volume = v;
    if (v === 0) {
      audioRef.muted = true;
      setMuted(true);
    } else {
      audioRef.muted = false;
      setMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef) return;
    const newMuted = !muted;
    audioRef.muted = newMuted;
    setMuted(newMuted);
    if (newMuted) {
      setVolume(0);
    } else {
      if (audioRef.volume === 0) {
        audioRef.volume = 1;
        setVolume(1);
      } else {
        setVolume(audioRef.volume);
      }
    }
  };

  const baseClass =
    "left-0 right-0 border-t border-slate-800 bg-slate-950 text-slate-100 transition-all duration-300";

  const containerClass = isExpanded
    ? `fixed inset-0 z-40 flex flex-col ${baseClass.replace(
        "border-t",
        ""
      )} bg-slate-950`
    : `fixed bottom-0 ${baseClass} px-4 py-2 bg-slate-950/95`;

  if (!currentTrack) {
    return (
      <div className={containerClass}>
        <div className="text-center text-xs text-slate-500 py-2">
          Select a track to start playing
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {isExpanded && (
        <div className="flex flex-1 flex-col md:flex-row gap-6 p-6">
          <div className="flex items-center justify-center md:w-1/3">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 shadow-2xl" />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-2">
              Now Playing
            </p>
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              {currentTrack.title}
            </h2>
            <p className="text-slate-400 mb-4">{currentTrack.artist}</p>
            <div className="w-full max-w-xl">
              <WaveformCanvas theme="neon" />
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={progress}
                onChange={handleSeek}
                className="w-full mt-2 accent-purple-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={
          "flex items-center gap-4 px-4 pb-2 " +
          (isExpanded ? "border-t border-slate-800 pt-2" : "")
        }
      >
        {!isExpanded && (
          <div className="flex items-center gap-3 w-1/4">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500 to-pink-500" />
            <div className="text-[11px]">
              <p className="font-semibold truncate">
                {currentTrack.title}
              </p>
              <p className="text-slate-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="flex-1 flex flex-col items-center gap-1">
            <WaveformCanvas theme="neon" />
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleSeek}
              className="w-full mt-1 accent-purple-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 w-1/4 justify-end text-slate-200">
          <button
            onClick={toggleExpanded}
            className="p-2 rounded-full hover:bg-slate-800"
          >
            {isExpanded ? (
              <FaChevronDown size={14} />
            ) : (
              <FaChevronUp size={14} />
            )}
          </button>

          <button
            onClick={toggleShuffle}
            className={
              "p-2 rounded-full hover:bg-slate-800 " +
              (isShuffle ? "bg-slate-800 text-purple-400" : "")
            }
          >
            <FaRandom size={14} />
          </button>

          <button
            onClick={playPrev}
            className="p-2 rounded-full hover:bg-slate-800"
          >
            <FaStepBackward />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>

          <button
            onClick={playNext}
            className="p-2 rounded-full hover:bg-slate-800"
          >
            <FaStepForward />
          </button>

          <div className="flex items-center gap-2 w-28">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-slate-800"
            >
              {muted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolume}
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
