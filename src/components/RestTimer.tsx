"use client";

import { useEffect, useState } from "react";

type RestTimerProps = {
  defaultSeconds?: number;
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${`${seconds}`.padStart(2, "0")}`;
}

export default function RestTimer({ defaultSeconds = 60 }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const duration = customDuration ?? defaultSeconds;

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Rest complete", {
                body: "Time for your next set.",
                tag: "winterarc-rest-timer",
              });
            }
          }
          try {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
            const ctx = new AudioCtx();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.frequency.value = 880;
            gain.gain.value = 0.05;
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.2);
          } catch {
            // Ignore audio failures.
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning, secondsLeft]);

  function start(seconds = duration) {
    setCustomDuration(seconds);
    setSecondsLeft(seconds);
    setIsRunning(true);
  }

  function pause() {
    setIsRunning(false);
  }

  function reset() {
    setIsRunning(false);
    setSecondsLeft(0);
    setCustomDuration(null);
  }

  const progress =
    duration > 0 && secondsLeft > 0
      ? Math.round(((duration - secondsLeft) / duration) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,17,31,0.45)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ice)]">
            Rest timer
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--frost)]">
            {secondsLeft > 0 ? formatTime(secondsLeft) : formatTime(duration)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={() => start()}
              className="wa-btn wa-btn-primary !px-3 !py-1.5 !text-xs"
            >
              {secondsLeft > 0 ? "Resume" : `Start ${duration}s`}
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              className="wa-btn wa-btn-ghost !px-3 !py-1.5 !text-xs"
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="wa-btn wa-btn-ghost !px-3 !py-1.5 !text-xs"
          >
            Reset
          </button>
          {[30, 60, 90].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => start(sec)}
              className="wa-btn wa-btn-ghost !px-3 !py-1.5 !text-xs"
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {secondsLeft > 0 ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(158,201,222,0.12)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#9ec9de,#3f87a8)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
