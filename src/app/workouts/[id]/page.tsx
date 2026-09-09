"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import ExerciseMedia from "@/components/ExerciseMedia";
import {
  deleteWorkoutSession,
  getWorkoutSessionDetail,
  updateWorkoutSession,
  type WorkoutSessionDetail,
  type WorkoutSetRow,
} from "@/lib/supabase/workouts";
import { getExerciseVisual } from "@/lib/exercises/catalog";
import { formatError } from "@/lib/format-error";

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
        setError(formatError(e));
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
      setError(formatError(err));
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
      setError(formatError(err));
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="wa-display text-3xl font-bold sm:text-4xl">
            {detail.routine_name}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {new Date(detail.started_at).toLocaleString()}
            {detail.completed_at ? " · Completed" : " · In progress"}
          </p>
        </div>
        <Link href="/workouts" className="wa-btn wa-btn-ghost">
          Back
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
        <div className="wa-card p-5">
          <label className="flex flex-col gap-1.5">
            <span className="wa-label">Workout notes</span>
            <textarea
              className="wa-input min-h-[80px]"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="How did it feel?"
            />
          </label>
        </div>

        {grouped.map((group) => {
          const visual = getExerciseVisual(group.exerciseName);
          return (
            <section key={group.exerciseName + group.dayLabel} className="wa-card p-5">
              <div className="mb-4 flex gap-4">
                <ExerciseMedia name={group.exerciseName} size="md" showMeta />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ice)]">
                    {visual.muscle} · {group.dayLabel}
                  </p>
                  <h2 className="wa-display mt-1 text-2xl font-bold">
                    {group.exerciseName}
                  </h2>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {group.sets.map((set) => (
                  <div
                    key={set.id}
                    className="rounded-2xl border border-[var(--border)] bg-[rgba(7,17,31,0.35)] p-4"
                  >
                    <p className="mb-3 text-sm text-[var(--muted)]">
                      Set {set.set_order} · Target {set.planned_reps}
                      {set.planned_weight != null
                        ? ` @ ${set.planned_weight}`
                        : ""}
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="wa-label">Reps</span>
                        <input
                          className="wa-input"
                          type="number"
                          value={setInputs[set.id]?.repsText ?? ""}
                          onChange={(e) =>
                            updateSetInput(set.id, { repsText: e.target.value })
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="wa-label">Weight</span>
                        <input
                          className="wa-input"
                          type="number"
                          value={setInputs[set.id]?.weightText ?? ""}
                          onChange={(e) =>
                            updateSetInput(set.id, {
                              weightText: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="wa-label">Notes</span>
                        <input
                          className="wa-input"
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
          );
        })}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            className="wa-btn wa-btn-danger"
          >
            Delete workout
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="wa-btn wa-btn-primary"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
