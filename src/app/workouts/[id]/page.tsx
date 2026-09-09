"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  deleteWorkoutSession,
  getWorkoutSessionDetail,
  updateWorkoutSession,
  type WorkoutSessionDetail,
  type WorkoutSetRow,
} from "@/lib/supabase/workouts";

type SetInputState = {
  repsText: string;
  weightText: string;
  notes: string;
};

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

function groupSetsByExercise(sets: WorkoutSetRow[]) {
  const groups = new Map<
    string,
    { exerciseName: string; dayLabel: string; sets: WorkoutSetRow[] }
  >();

  for (const set of sets) {
    const key = set.routine_exercise_id;
    if (!groups.has(key)) {
      groups.set(key, {
        exerciseName: set.exercise_name,
        dayLabel: set.day_label,
        sets: [],
      });
    }
    groups.get(key)!.sets.push(set);
  }

  return Array.from(groups.values());
}

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [detail, setDetail] = useState<WorkoutSessionDetail | null>(null);
  const [setInputs, setSetInputs] = useState<Record<string, SetInputState>>({});
  const [sessionNotes, setSessionNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!supabase) {
          setError("Supabase is not configured (missing env vars).");
          return;
        }

        const data = await getWorkoutSessionDetail(supabase, sessionId);
        if (!data) {
          setError("Workout not found.");
          return;
        }

        setDetail(data);
        setSessionNotes(data.notes ?? "");

        const inputs: Record<string, SetInputState> = {};
        for (const set of data.sets) {
          inputs[set.id] = {
            repsText:
              set.actual_reps != null ? String(set.actual_reps) : "",
            weightText:
              set.actual_weight != null ? String(set.actual_weight) : "",
            notes: set.notes ?? "",
          };
        }
        setSetInputs(inputs);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function updateSetInput(setId: string, patch: Partial<SetInputState>) {
    setSetInputs((prev) => ({
      ...prev,
      [setId]: { ...prev[setId], ...patch },
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !detail) return;

    setIsSaving(true);
    setError(null);

    try {
      const updates = detail.sets.map((set) => {
        const input = setInputs[set.id] ?? {
          repsText: "",
          weightText: "",
          notes: "",
        };
        return {
          id: set.id,
          actual_reps: parseOptionalInt(input.repsText),
          actual_weight: parseOptionalFloat(input.weightText),
          notes: input.notes.trim() || null,
        };
      });

      await updateWorkoutSession(
        supabase,
        detail.id,
        updates,
        sessionNotes.trim() || null,
      );
      router.push("/workouts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete() {
    if (!supabase || !detail) return;
    if (!confirm("Delete this workout? This cannot be undone.")) return;

    setIsSaving(true);
    setError(null);

    try {
      await deleteWorkoutSession(supabase, detail.id);
      router.push("/workouts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <p className="text-sm text-zinc-600">Loading workout...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Workout</h1>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <Link
          href="/workouts"
          className="mt-4 inline-block text-sm font-medium text-zinc-900"
        >
          Back to workouts
        </Link>
      </div>
    );
  }

  const grouped = groupSetsByExercise(detail.sets);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{detail.routine_name}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {new Date(detail.started_at).toLocaleString()}
            {detail.completed_at ? " · Completed" : " · In progress"}
          </p>
        </div>
        <Link
          href="/workouts"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
        >
          Back
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Workout notes</span>
            <textarea
              className="min-h-[80px] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="How did it feel?"
            />
          </label>
        </div>

        {grouped.map((group) => (
          <section key={group.exerciseName + group.dayLabel}>
            <h2 className="mb-1 text-lg font-semibold">{group.exerciseName}</h2>
            <p className="mb-4 text-sm text-zinc-600">{group.dayLabel}</p>

            <div className="flex flex-col gap-3">
              {group.sets.map((set) => (
                <div
                  key={set.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="mb-3 text-sm text-zinc-600">
                    Set {set.set_order} · Target {set.planned_reps}
                    {set.planned_weight != null
                      ? ` @ ${set.planned_weight}`
                      : ""}
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600">
                        Reps
                      </span>
                      <input
                        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                        type="number"
                        value={setInputs[set.id]?.repsText ?? ""}
                        onChange={(e) =>
                          updateSetInput(set.id, { repsText: e.target.value })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600">
                        Weight
                      </span>
                      <input
                        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                        type="number"
                        value={setInputs[set.id]?.weightText ?? ""}
                        onChange={(e) =>
                          updateSetInput(set.id, {
                            weightText: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-zinc-600">
                        Notes
                      </span>
                      <input
                        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                        value={setInputs[set.id]?.notes ?? ""}
                        onChange={(e) =>
                          updateSetInput(set.id, { notes: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
          >
            Delete workout
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
