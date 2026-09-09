"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getExerciseProgress,
  listCompletedWorkoutSessions,
  listWorkoutSetsForSessions,
  type ExerciseProgressSummary,
} from "@/lib/supabase/workouts";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type CompletedSessionRow = {
  id: string;
  completed_at: string;
};

type WorkoutSetRow = {
  workout_session_id: string;
  actual_reps: number | null;
  actual_weight: number | null;
};

function toLocalISODate(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getISOWeekKey(d: Date) {
  // ISO week algorithm: week starts Monday, week 1 contains the year's first Thursday.
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}

export default function ProgressPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyCounts, setWeeklyCounts] = useState<Array<{ key: string; count: number }>>([]);
  const [volume14d, setVolume14d] = useState<Array<{ date: string; volume: number }>>([]);
  const [totalVolume30d, setTotalVolume30d] = useState<number>(0);
  const [recentWorkouts, setRecentWorkouts] = useState<string[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseProgressSummary[]>(
    [],
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!supabase) {
          setError("Supabase is not configured (missing env vars).");
          setTotalWorkouts(0);
          setStreakDays(0);
          setVolume14d([]);
          setTotalVolume30d(0);
          setWeeklyCounts([]);
          setRecentWorkouts([]);
          return;
        }

        const sessions = (await listCompletedWorkoutSessions(supabase)) as Array<{
          id: string;
          completed_at: string;
        }>;

        const sessionRows: CompletedSessionRow[] = sessions.map((s) => ({
          id: s.id,
          completed_at: s.completed_at,
        }));

        const sessionIds = sessionRows.map((s) => s.id);
        const sets = (await listWorkoutSetsForSessions(supabase, sessionIds)) as WorkoutSetRow[];

        const setsBySession = new Map<string, WorkoutSetRow[]>();
        for (const row of sets) {
          const list = setsBySession.get(row.workout_session_id) ?? [];
          list.push(row);
          setsBySession.set(row.workout_session_id, list);
        }

        setTotalWorkouts(sessionRows.length);
        setRecentWorkouts(
          sessionRows.slice(0, 5).map((s) => toLocalISODate(new Date(s.completed_at))),
        );

        // Compute streak based on completed days (current streak up to last workout day).
        const completedDays = new Set(
          sessionRows.map((s) => toLocalISODate(new Date(s.completed_at))),
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (completedDays.size === 0) {
          setStreakDays(0);
        } else {
          let anchor = new Date(today);
          while (!completedDays.has(toLocalISODate(anchor))) {
            anchor = new Date(anchor);
            anchor.setDate(anchor.getDate() - 1);
          }

          let streak = 0;
          while (completedDays.has(toLocalISODate(anchor))) {
            streak += 1;
            anchor.setDate(anchor.getDate() - 1);
          }
          setStreakDays(streak);
        }

        // Volume for last 14 days + total volume last 30 days (volume = reps * weight when both are present).
        const start14 = new Date(today);
        start14.setDate(start14.getDate() - 13);
        const start30 = new Date(today);
        start30.setDate(start30.getDate() - 29);

        const volumeByDate = new Map<string, number>();
        let volume30d = 0;

        for (const s of sessionRows) {
          const completed = new Date(s.completed_at);
          completed.setHours(0, 0, 0, 0);
          const iso = toLocalISODate(completed);

          const dateOk14 = completed >= start14;
          const dateOk30 = completed >= start30;

          if (dateOk14 || dateOk30) {
            let vol = 0;
            const setRows = setsBySession.get(s.id) ?? [];
            for (const row of setRows) {
              if (row.actual_reps != null && row.actual_weight != null) {
                vol += row.actual_reps * row.actual_weight;
              }
            }

            if (dateOk14) {
              volumeByDate.set(iso, (volumeByDate.get(iso) ?? 0) + vol);
            }
            if (dateOk30) {
              volume30d += vol;
            }
          }
        }

        setTotalVolume30d(volume30d);

        // Last 14 days chart data
        const chart: Array<{ date: string; volume: number }> = [];
        for (let i = 0; i < 14; i++) {
          const d = new Date(start14);
          d.setDate(start14.getDate() + i);
          const iso = toLocalISODate(d);
          chart.push({
            date: iso,
            volume: volumeByDate.get(iso) ?? 0,
          });
        }
        setVolume14d(chart);

        // Weekly completion counts (last ~8 weeks by date range)
        const startWeekly = new Date(today);
        startWeekly.setDate(startWeekly.getDate() - 7 * 7);
        const buckets = new Map<string, number>();

        for (const s of sessionRows) {
          const completed = new Date(s.completed_at);
          completed.setHours(0, 0, 0, 0);
          if (completed < startWeekly) continue;
          const key = getISOWeekKey(completed);
          buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }

        const keys = Array.from(buckets.keys()).sort((a, b) => (a < b ? 1 : -1));
        const topKeys = keys.slice(0, 8).reverse();
        setWeeklyCounts(
          topKeys.map((k) => ({
            key: k,
            count: buckets.get(k) ?? 0,
          })),
        );

        const exercises = await getExerciseProgress(supabase);
        setExerciseStats(exercises);
        if (exercises.length > 0) {
          setSelectedExerciseId(exercises[0].exerciseId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxVolume14 = useMemo(
    () => Math.max(1, ...volume14d.map((d) => d.volume)),
    [volume14d],
  );

  const selectedExercise = useMemo(
    () => exerciseStats.find((e) => e.exerciseId === selectedExerciseId) ?? null,
    [exerciseStats, selectedExerciseId],
  );

  const maxExerciseVolume = useMemo(() => {
    if (!selectedExercise || selectedExercise.history.length === 0) return 1;
    return Math.max(
      1,
      ...selectedExercise.history.map((h) => h.volume),
    );
  }, [selectedExercise]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Progress</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Streaks, weekly completion, and volume from your logged workouts.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {isLoading ? (
        <p className="mt-4 text-sm text-zinc-600">Loading stats...</p>
      ) : null}

      {!isLoading ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600">Current streak</p>
              <p className="mt-1 text-3xl font-semibold">{streakDays} days</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600">Workouts completed</p>
              <p className="mt-1 text-3xl font-semibold">{totalWorkouts}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600">Volume (30d)</p>
              <p className="mt-1 text-3xl font-semibold">
                {Math.round(totalVolume30d)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold">Last 14 days volume</h2>
              <div className="mt-4 flex items-end gap-2">
                {volume14d.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-2">
                    <div
                      title={`${d.date}: ${Math.round(d.volume)}`}
                      style={{
                        height: `${Math.round((d.volume / maxVolume14) * 80)}px`,
                      }}
                      className="w-4 rounded-sm bg-zinc-900 dark:bg-zinc-100"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-600">
                Volume = reps * weight (only when both are logged).
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold">Weekly completion</h2>
              <div className="mt-4 flex flex-col gap-3">
                {weeklyCounts.map((w) => (
                  <div key={w.key} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-zinc-600">{w.key}</div>
                    <div className="flex-1 rounded bg-zinc-100 p-1 dark:bg-zinc-900">
                      <div
                        style={{ width: `${Math.min(100, w.count * 20)}%` }}
                        className="h-2 rounded bg-zinc-900 dark:bg-zinc-100"
                      />
                    </div>
                    <div className="w-10 text-right text-sm font-medium">
                      {w.count}
                    </div>
                  </div>
                ))}
                {weeklyCounts.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    Complete a workout to see your stats.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Exercise progress</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Volume and personal records per exercise.
            </p>

            {exerciseStats.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600">
                Log workouts with reps and weight to see exercise stats.
              </p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {exerciseStats.slice(0, 6).map((ex) => (
                    <button
                      key={ex.exerciseId}
                      type="button"
                      onClick={() => setSelectedExerciseId(ex.exerciseId)}
                      className={
                        ex.exerciseId === selectedExerciseId
                          ? "rounded-lg border-2 border-zinc-900 bg-zinc-50 p-4 text-left dark:border-zinc-100 dark:bg-zinc-900"
                          : "rounded-lg border border-zinc-200 p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                      }
                    >
                      <p className="font-medium">{ex.exerciseName}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {Math.round(ex.totalVolume)} vol · {ex.sessionCount}{" "}
                        sessions
                      </p>
                      {ex.bestWeight != null ? (
                        <p className="mt-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          PR: {ex.bestWeight}
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>

                {selectedExercise ? (
                  <div className="mt-6">
                    <h3 className="font-semibold">
                      {selectedExercise.exerciseName} over time
                    </h3>
                    <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
                      {selectedExercise.history.map((point) => (
                        <div
                          key={point.date}
                          className="flex min-w-[28px] flex-col items-center gap-1"
                        >
                          <div
                            title={`${point.date}: ${Math.round(point.volume)} vol, max ${point.maxWeight ?? "—"}`}
                            style={{
                              height: `${Math.round((point.volume / maxExerciseVolume) * 80)}px`,
                            }}
                            className="w-4 rounded-sm bg-sky-700 dark:bg-sky-300"
                          />
                          <span className="text-[10px] text-zinc-500">
                            {point.date.slice(5)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600">
                      <span>
                        Total volume:{" "}
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {Math.round(selectedExercise.totalVolume)}
                        </strong>
                      </span>
                      {selectedExercise.bestWeight != null ? (
                        <span>
                          Best weight:{" "}
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {selectedExercise.bestWeight}
                          </strong>
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Recent workouts</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {recentWorkouts.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  No completed workouts yet.
                </p>
              ) : (
                recentWorkouts.map((d) => (
                  <span
                    key={d}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {d}
                  </span>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

