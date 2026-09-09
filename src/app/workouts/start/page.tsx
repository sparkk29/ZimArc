"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createWorkoutSession,
  getActiveRoutinePlan,
  saveWorkout,
  type WorkoutSetDraft,
  type WorkoutRoutineDayPlan,
  type WorkoutRoutineExercisePlan,
} from "@/lib/supabase/workouts";

type SetInputState = {
  repsText: string;
  weightText: string;
};

type SetValuesState = Record<
  string, // routine_exercise_id
  Record<number, SetInputState> // set_order -> values
>;

function parseOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseOptionalFloat(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function StartWorkoutPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [planDays, setPlanDays] = useState<WorkoutRoutineDayPlan[] | null>(
    null,
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [setValues, setSetValues] = useState<SetValuesState>({});

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!supabase) {
          setError("Supabase is not configured (missing env vars).");
          setPlanDays([]);
          setSessionId(null);
          return;
        }
        const plan = await getActiveRoutinePlan(supabase);
        if (!plan) {
          setPlanDays([]);
          setSessionId(null);
          setError("No active routine found. Create/activate a routine first.");
          return;
        }

        const newSessionId = await createWorkoutSession(supabase, plan.id);
        if (!newSessionId) throw new Error("Failed to create workout session.");

        setSessionId(newSessionId);
        setPlanDays(plan.days as WorkoutRoutineDayPlan[]);

        // Initialize set inputs for each exercise.
        const initial: SetValuesState = {};
        for (const day of plan.days) {
          for (const ex of day.exercises as WorkoutRoutineExercisePlan[]) {
            const perSet: Record<number, SetInputState> = {};
            const targetSets = Math.max(1, Math.trunc(ex.target_sets));
            for (let setOrder = 1; setOrder <= targetSets; setOrder++) {
              perSet[setOrder] = { repsText: "", weightText: "" };
            }
            initial[ex.id] = perSet;
          }
        }
        setSetValues(initial);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateSetInput(exerciseId: string, setOrder: number, patch: Partial<SetInputState>) {
    setSetValues((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] ?? {}),
        [setOrder]: {
          repsText:
            patch.repsText ?? prev[exerciseId]?.[setOrder]?.repsText ?? "",
          weightText:
            patch.weightText ?? prev[exerciseId]?.[setOrder]?.weightText ?? "",
        },
      },
    }));
  }

  async function onSaveWorkout() {
    if (!sessionId) return;
    if (!planDays) return;
    if (!supabase) {
      setError("Supabase is not configured (missing env vars).");
      return;
    }

    setError(null);

    try {
      const setsToInsert: WorkoutSetDraft[] = [];

      for (const day of planDays) {
        for (const ex of day.exercises) {
          const targetSets = Math.max(1, Math.trunc(ex.target_sets));
          for (let setOrder = 1; setOrder <= targetSets; setOrder++) {
            const input = setValues[ex.id]?.[setOrder] ?? {
              repsText: "",
              weightText: "",
            };

            setsToInsert.push({
              routine_exercise_id: ex.id,
              planned_reps: ex.target_reps,
              planned_weight: ex.target_weight,
              set_order: setOrder,
              actual_reps: parseOptionalInt(input.repsText),
              actual_weight: parseOptionalFloat(input.weightText),
              notes: null,
            });
          }
        }
      }

      await saveWorkout(supabase, sessionId, setsToInsert);
      router.push("/workouts");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <p className="text-sm text-zinc-600">Loading active routine...</p>
      </div>
    );
  }

  if (!planDays || planDays.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Start workout</h1>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4">
          <Link
            href="/routines"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to routine builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Log workout</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Fill in your sets and save.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workouts"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onSaveWorkout}
            disabled={!sessionId}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Save workout
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 flex flex-col gap-8">
        {planDays.map((day) => (
          <section key={day.id}>
            <h2 className="mb-4 text-xl font-semibold">{day.label}</h2>
            <div className="flex flex-col gap-6">
              {day.exercises.map((ex) => {
                const targetSets = Math.max(1, Math.trunc(ex.target_sets));
                return (
                  <div
                    key={ex.id}
                    className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {ex.exercise_name}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          Target: {targetSets} sets • {ex.target_reps} • Rest{" "}
                          {ex.rest_seconds}s
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      {Array.from({ length: targetSets }, (_, i) => i + 1).map(
                        (setOrder) => (
                          <div
                            key={setOrder}
                            className="grid gap-3 md:grid-cols-3"
                          >
                            <div className="flex items-center">
                              <span className="text-sm font-medium">
                                Set {setOrder}
                              </span>
                            </div>
                            <label className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-zinc-600">
                                Reps (actual)
                              </span>
                              <input
                                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                type="number"
                                inputMode="numeric"
                                value={
                                  setValues[ex.id]?.[setOrder]?.repsText ?? ""
                                }
                                onChange={(e) =>
                                  updateSetInput(ex.id, setOrder, {
                                    repsText: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-zinc-600">
                                Weight (actual)
                              </span>
                              <input
                                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                                type="number"
                                inputMode="decimal"
                                value={
                                  setValues[ex.id]?.[setOrder]?.weightText ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateSetInput(ex.id, setOrder, {
                                    weightText: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

