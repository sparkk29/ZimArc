"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type {
  ExerciseDraft,
  RoutineDayDraft,
  RoutineDraft,
} from "@/lib/supabase/routines";
import ExerciseMedia from "@/components/ExerciseMedia";
import ExercisePicker from "@/components/ExercisePicker";

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
  const [pickerFor, setPickerFor] = useState<{
    dayIndex: number;
    exerciseIndex: number;
  } | null>(null);

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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="wa-display text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <Link href={cancelHref} className="wa-btn wa-btn-ghost">
          Back
        </Link>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="wa-card p-5">
          <label className="flex flex-col gap-1.5">
            <span className="wa-label">Routine name</span>
            <input
              className="wa-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="mt-4 flex items-center gap-3 text-sm text-[var(--frost)]">
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
            <h2 className="wa-display text-2xl font-bold">Days</h2>
            <button type="button" onClick={addDay} className="wa-btn wa-btn-primary">
              + Add day
            </button>
          </div>

          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="wa-card p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <label className="flex w-full flex-col gap-1.5">
                  <span className="wa-label">Day label (e.g., Push)</span>
                  <input
                    className="wa-input"
                    value={day.label}
                    onChange={(e) => updateDayLabel(dayIndex, e.target.value)}
                    required
                  />
                </label>

                {days.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="wa-btn wa-btn-ghost"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--frost)]">Exercises</h3>
                <button
                  type="button"
                  onClick={() => addExercise(dayIndex)}
                  className="wa-btn wa-btn-ghost"
                >
                  + Add exercise
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {day.exercises.map((ex, exIndex) => (
                  <div
                    key={exIndex}
                    className="rounded-2xl border border-[var(--border)] bg-[rgba(7,17,31,0.35)] p-4"
                  >
                    <div className="mb-4 flex gap-4">
                      <ExerciseMedia name={ex.name || "Custom"} size="md" showMeta />
                      <div className="min-w-0 flex-1">
                        <label className="flex flex-col gap-1.5">
                          <span className="wa-label">Exercise</span>
                          <input
                            className="wa-input"
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
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-[var(--ice)]"
                          onClick={() =>
                            setPickerFor(
                              pickerFor?.dayIndex === dayIndex &&
                                pickerFor?.exerciseIndex === exIndex
                                ? null
                                : { dayIndex, exerciseIndex: exIndex },
                            )
                          }
                        >
                          {pickerFor?.dayIndex === dayIndex &&
                          pickerFor?.exerciseIndex === exIndex
                            ? "Hide photo picker"
                            : "Choose from photo library"}
                        </button>
                      </div>
                    </div>

                    {pickerFor?.dayIndex === dayIndex &&
                    pickerFor?.exerciseIndex === exIndex ? (
                      <ExercisePicker
                        onSelect={(picked) => {
                          updateExercise(dayIndex, exIndex, { name: picked });
                          setPickerFor(null);
                        }}
                      />
                    ) : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1.5">
                        <span className="wa-label">Sets</span>
                        <input
                          className="wa-input"
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

                      <label className="flex flex-col gap-1.5">
                        <span className="wa-label">Reps</span>
                        <input
                          className="wa-input"
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

                      <label className="flex flex-col gap-1.5">
                        <span className="wa-label">Rest (sec)</span>
                        <input
                          className="wa-input"
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

                      <label className="flex flex-col gap-1.5">
                        <span className="wa-label">Target weight (optional)</span>
                        <input
                          className="wa-input"
                          type="text"
                          value={ex.weightText}
                          onChange={(e) =>
                            updateExercise(dayIndex, exIndex, {
                              weightText: e.target.value,
                            })
                          }
                          placeholder="e.g., 60"
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 md:col-span-2">
                        <span className="wa-label">Notes</span>
                        <input
                          className="wa-input"
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
                          className="wa-btn wa-btn-danger"
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
              className="wa-btn wa-btn-danger"
            >
              Delete routine
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Link href={cancelHref} className="wa-btn wa-btn-ghost">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="wa-btn wa-btn-primary"
            >
              {isPending ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
