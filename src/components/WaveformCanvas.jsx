// src/components/WaveformCanvas.jsx
import React, { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/playerStore";

export default function WaveformCanvas({ theme = "neon" }) {
  const canvasRef = useRef(null);
  const audioRef = usePlayerStore((s) => s.audioRef);

  // Keep these stable across renders
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!audioRef) return;

    // Only create once
    if (!audioCtxRef.current) {
      audioCtxRef.current =
        new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!analyserRef.current) {
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }

    // Important: only call createMediaElementSource once per <audio>
    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }

    const analyser = analyserRef.current;
    const audioCtx = audioCtxRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // background
      if (theme === "neon") {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0f172a");
        gradient.addColorStop(1, "#020617");
        ctx.fillStyle = gradient;
      } else if (theme === "cyber") {
        ctx.fillStyle = "#020617";
      } else {
        ctx.fillStyle = "#020617";
      }
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        if (theme === "neon") {
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, "#a855f7");
          gradient.addColorStop(1, "#ec4899");
          ctx.fillStyle = gradient;
        } else if (theme === "cyber") {
          ctx.fillStyle = i % 2 === 0 ? "#22d3ee" : "#a3e635";
        } else {
          ctx.fillStyle = "#e5e7eb";
        }

        const barX = x;
        const barY = height - barHeight;
        const radius = 4;

        ctx.beginPath();
        ctx.moveTo(barX, height);
        ctx.lineTo(barX, barY + radius);
        ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
        ctx.lineTo(barX + barWidth - radius, barY);
        ctx.quadraticCurveTo(
          barX + barWidth,
          barY,
          barX + barWidth,
          barY + radius
        );
        ctx.lineTo(barX + barWidth, height);
        ctx.closePath();
        ctx.fill();

        x += barWidth + 1;
      }
    };

    draw();

    // Cleanup only animation; keep AudioContext/source alive for the whole app
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [audioRef, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className="w-full h-20 rounded-lg"
    />
  );
}
