"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { ExerciseDraft, RoutineDayDraft, RoutineDraft } from "@/lib/supabase/routines";

export type ExerciseDraftForm = Omit<ExerciseDraft, "weight"> & {
  weightText: string;
};

export type RoutineDayDraftForm = Omit<RoutineDayDraft, "exercises"> & {
  exercises: ExerciseDraftForm[];
};

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function emptyExercise(): ExerciseDraftForm {
  return {
    name: "",
    sets: 3,
    reps: "8-12",
    weightText: "",
    restSeconds: 60,
    notes: "",
  };
}

type RoutineEditorProps = {
  title: string;
  subtitle: string;
  initialName: string;
  initialMakeActive: boolean;
  initialDays: RoutineDayDraftForm[];
  submitLabel: string;
  onSubmit: (draft: RoutineDraft, makeActive: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  cancelHref?: string;
};

export default function RoutineEditor({
  title,
  subtitle,
  initialName,
  initialMakeActive,
  initialDays,
  submitLabel,
  onSubmit,
  onDelete,
  cancelHref = "/routines",
}: RoutineEditorProps) {
  const [name, setName] = useState(initialName);
  const [makeActive, setMakeActive] = useState(initialMakeActive);
  const [days, setDays] = useState<RoutineDayDraftForm[]>(initialDays);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanedDraft = useMemo<RoutineDraft>(() => {
    const filteredDays = days
      .map((d): RoutineDayDraft => {
        const filteredExercises = d.exercises
          .filter((ex) => ex.name.trim().length > 0)
          .map(
            (ex): ExerciseDraft => ({
              name: ex.name.trim(),
              sets: Number.isFinite(ex.sets) ? ex.sets : 3,
              reps: ex.reps.trim() || "8-12",
              weight: parseOptionalNumber(ex.weightText),
              restSeconds: Number.isFinite(ex.restSeconds)
                ? ex.restSeconds
                : 60,
              notes: ex.notes?.trim() ? ex.notes.trim() : undefined,
            }),
          );

        return {
          label: d.label.trim(),
          exercises: filteredExercises,
        };
      })
      .filter((d) => d.label.length > 0 && d.exercises.length > 0);

    return {
      name: name.trim(),
      days: filteredDays,
    };
  }, [days, name]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cleanedDraft.name) {
      setError("Routine name is required.");
      return;
    }
    if (cleanedDraft.days.length === 0) {
      setError("Add at least one day with at least one exercise.");
      return;
    }

    setIsPending(true);
    try {
      await onSubmit(cleanedDraft, makeActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this routine? This cannot be undone.")) return;
    setIsPending(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPending(false);
    }
  }

  function addDay() {
    setDays((prev) => [...prev, { label: "", exercises: [emptyExercise()] }]);
  }

  function updateDayLabel(dayIndex: number, value: string) {
    setDays((prev) => {
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], label: value };
      return next;
    });
  }

  function removeDay(dayIndex: number) {
    setDays((prev) => prev.filter((_, idx) => idx !== dayIndex));
  }

  function addExercise(dayIndex: number) {
    setDays((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      day.exercises = [...day.exercises, emptyExercise()];
      return next;
    });
  }

  function updateExercise(
    dayIndex: number,
    exerciseIndex: number,
    patch: Partial<ExerciseDraftForm>,
  ) {
    setDays((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      const exercises = [...day.exercises];
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...patch };
      day.exercises = exercises;
      return next;
    });
  }

  function removeExercise(dayIndex: number, exerciseIndex: number) {
    setDays((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      day.exercises = day.exercises.filter((_, idx) => idx !== exerciseIndex);
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
        </div>
        <Link
          href={cancelHref}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
        >
          Back
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Routine name</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="mt-4 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={makeActive}
              onChange={(e) => setMakeActive(e.target.checked)}
            />
            Make this routine your active routine
          </label>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Days</h2>
            <button
              type="button"
              onClick={addDay}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              + Add day
            </button>
          </div>

          {days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <label className="flex w-full flex-col gap-1">
                  <span className="text-sm font-medium">
                    Day label (e.g., Push)
                  </span>
                  <input
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    value={day.label}
                    onChange={(e) => updateDayLabel(dayIndex, e.target.value)}
                    required
                  />
                </label>

                {days.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-medium">Exercises</h3>
                <button
                  type="button"
                  onClick={() => addExercise(dayIndex)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
                >
                  + Add exercise
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {day.exercises.map((ex, exIndex) => (
                  <div
                    key={exIndex}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Exercise</span>
                        <input
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={ex.name}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., Bench Press"
                          required
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Sets</span>
                        <input
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          type="number"
                          value={ex.sets}
                          min={1}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              sets: Number(e.target.value),
                            })
                          }
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Reps</span>
                        <input
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={ex.reps}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              reps: e.target.value,
                            })
                          }
                          placeholder="e.g., 8-12"
                          required
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Rest (sec)</span>
                        <input
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          type="number"
                          value={ex.restSeconds}
                          min={0}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              restSeconds: Number(e.target.value),
                            })
                          }
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          Target weight (optional)
                        </span>
                        <input
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          type="text"
                          value={ex.weightText}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              weightText: e.target.value,
                            })
                          }
                          placeholder="e.g., 60 or leave blank"
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Notes</span>
                        <input
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={ex.notes}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              notes: e.target.value,
                            })
                          }
                          placeholder="optional"
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex justify-end">
                      {day.exercises.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeExercise(dayIndex, exIndex)}
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          {onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
            >
              Delete routine
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Link
              href={cancelHref}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
