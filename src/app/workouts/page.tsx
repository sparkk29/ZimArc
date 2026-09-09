"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/ssr";
import { listWorkoutSessions } from "@/lib/supabase/workouts";

type WorkoutSessionRow = {
  id: string;
  started_at: string;
  completed_at: string | null;
  routine_id: string;
  routine_name: string;
};

export default function WorkoutsPage() {
  const supabase = createClientComponentClient();

  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listWorkoutSessions(supabase);
        setSessions(rows as WorkoutSessionRow[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [supabase]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Workouts</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Log sets and track progress over time.
          </p>
        </div>

        <Link
          href="/workouts/start"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Start workout
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-4">
        {isLoading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
            No workouts yet. Start a workout using your active routine.
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-600">
                    {new Date(s.started_at).toLocaleString()}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {s.routine_name}
                  </h2>
                </div>
                <span
                  className={
                    s.completed_at
                      ? "rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      : "rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white"
                  }
                >
                  {s.completed_at ? "Completed" : "In progress"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

