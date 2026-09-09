"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoutineEditor, {
  type RoutineDayDraftForm,
} from "@/components/RoutineEditor";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  deleteRoutine,
  getRoutineDetail,
  updateRoutine,
  type RoutineDraft,
} from "@/lib/supabase/routines";
import { formatError } from "@/lib/format-error";

export default function EditRoutinePage() {
  const params = useParams();
  const router = useRouter();
  const routineId = params.id as string;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialName, setInitialName] = useState("");
  const [initialMakeActive, setInitialMakeActive] = useState(false);
  const [initialDays, setInitialDays] = useState<RoutineDayDraftForm[] | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!supabase) {
          setError("Supabase is not configured (missing env vars).");
          return;
        }

        const detail = await getRoutineDetail(supabase, routineId);
        if (!detail) {
          setError("Routine not found.");
          return;
        }

        setInitialName(detail.name);
        setInitialMakeActive(detail.is_active);
        setInitialDays(
          detail.days.map((day) => ({
            label: day.label,
            exercises: day.exercises.map((ex) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              weightText: ex.weight != null ? String(ex.weight) : "",
              restSeconds: ex.restSeconds,
              notes: ex.notes ?? "",
            })),
          })),
        );
      } catch (e) {
        setError(formatError(e));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <p className="text-sm text-zinc-600">Loading routine...</p>
      </div>
    );
  }

  if (!initialDays) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Edit routine</h1>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <Link
          href="/routines"
          className="mt-4 inline-block text-sm font-medium text-zinc-900"
        >
          Back to routines
        </Link>
      </div>
    );
  }

  return (
    <RoutineEditor
      title="Edit routine"
      subtitle="Update days and exercises. Past workouts keep their logged history."
      initialName={initialName}
      initialMakeActive={initialMakeActive}
      initialDays={initialDays}
      submitLabel="Save changes"
      onSubmit={async (draft: RoutineDraft, makeActive: boolean) => {
        if (!supabase) throw new Error("Supabase is not configured.");
        await updateRoutine(supabase, routineId, draft, makeActive);
        router.push("/routines");
        router.refresh();
      }}
      onDelete={async () => {
        if (!supabase) throw new Error("Supabase is not configured.");
        await deleteRoutine(supabase, routineId);
        router.push("/routines");
        router.refresh();
      }}
    />
  );
}
