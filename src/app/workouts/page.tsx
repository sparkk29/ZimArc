"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listWorkoutSessions } from "@/lib/supabase/workouts";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatError } from "@/lib/format-error";

type WorkoutSessionRow = {
  id: string;
  started_at: string;
  completed_at: string | null;
  routine_id: string;
  routine_name: string;
};

export default function WorkoutsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) {
          setError("Supabase is not configured (missing env vars).");
          return;
        }
        const rows = await listWorkoutSessions(supabase);
        setSessions(rows as WorkoutSessionRow[]);
      } catch (e) {
        setError(formatError(e));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="wa-display text-3xl font-bold sm:text-4xl">Workouts</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Log sets and revisit sessions with clear visual cues.
          </p>
        </div>

        <Link href="/workouts/start" className="wa-btn wa-btn-primary">
          Start workout
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="mt-8 grid gap-4">
        {isLoading ? (
          <div className="wa-card p-5 text-sm text-[var(--muted)]">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="wa-card border-dashed p-8 text-sm text-[var(--muted)]">
            No workouts yet. Start a workout using your active routine.
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="wa-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    {new Date(s.started_at).toLocaleString()}
                  </p>
                  <h2 className="wa-display mt-2 text-2xl font-bold">
                    {s.routine_name}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={
                      s.completed_at
                        ? "rounded-full bg-[rgba(111,207,151,0.15)] px-3 py-1 text-xs font-semibold text-[var(--success)]"
                        : "rounded-full bg-[rgba(158,201,222,0.15)] px-3 py-1 text-xs font-semibold text-[var(--ice)]"
                    }
                  >
                    {s.completed_at ? "Completed" : "In progress"}
                  </span>
                  <Link
                    href={`/workouts/${s.id}`}
                    className="wa-btn wa-btn-ghost !px-3 !py-1.5 !text-xs"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
