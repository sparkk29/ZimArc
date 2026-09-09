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
            // Ignore audio failures (autoplay policies, unsupported browsers).
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
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Rest timer
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {secondsLeft > 0 ? formatTime(secondsLeft) : formatTime(duration)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={() => start()}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              {secondsLeft > 0 ? "Resume" : `Start ${duration}s`}
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => start(30)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          >
            30s
          </button>
          <button
            type="button"
            onClick={() => start(60)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          >
            60s
          </button>
          <button
            type="button"
            onClick={() => start(90)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
          >
            90s
          </button>
        </div>
      </div>

      {secondsLeft > 0 ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-sky-700 transition-all dark:bg-sky-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
