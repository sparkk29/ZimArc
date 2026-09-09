import type { SupabaseClient } from "@supabase/supabase-js";

export type ExerciseDraft = {
  name: string;
  sets: number;
  reps: string;
  weight?: number | null;
  restSeconds: number;
  notes?: string;
};

export type RoutineDayDraft = {
  label: string;
  exercises: ExerciseDraft[];
};

export type RoutineDraft = {
  name: string;
  days: RoutineDayDraft[];
};

export async function listRoutines(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("routines")
    .select("id,name,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveRoutine(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("routines")
    .select("id,name,is_active")
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function setActiveRoutine(supabase: SupabaseClient, routineId: string) {
  const { error: deactivateError } = await supabase
    .from("routines")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) throw deactivateError;

  const { error: activateError } = await supabase
    .from("routines")
    .update({ is_active: true })
    .eq("id", routineId);
  if (activateError) throw activateError;
}

export async function createRoutine(
  supabase: SupabaseClient,
  draft: RoutineDraft,
  makeActive: boolean,
) {
  if (makeActive) {
    // Ensure unique active routine per user before inserting the new one.
    const { error: deactivateError } = await supabase
      .from("routines")
      .update({ is_active: false })
      .eq("is_active", true);
    if (deactivateError) throw deactivateError;
  }

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      name: draft.name,
      is_active: makeActive,
    })
    .select("id")
    .single();

  if (routineError) throw routineError;

  if (!routine?.id) {
    throw new Error("Failed to create routine.");
  }

  // Insert days + exercises in order.
  for (let dayIndex = 0; dayIndex < draft.days.length; dayIndex++) {
    const day = draft.days[dayIndex];

    const { data: dayRow, error: dayError } = await supabase
      .from("routine_days")
      .insert({
        routine_id: routine.id,
        day_order: dayIndex + 1,
        label: day.label,
      })
      .select("id")
      .single();

    if (dayError) throw dayError;
    if (!dayRow?.id) throw new Error("Failed to create routine day.");

    for (
      let exerciseIndex = 0;
      exerciseIndex < day.exercises.length;
      exerciseIndex++
    ) {
      const ex = day.exercises[exerciseIndex];

      const { error: exError } = await supabase.from("routine_exercises").insert({
        routine_day_id: dayRow.id,
        exercise_order: exerciseIndex + 1,
        exercise_name: ex.name,
        target_sets: ex.sets,
        target_reps: ex.reps,
        target_weight: ex.weight ?? null,
        rest_seconds: ex.restSeconds,
        notes: ex.notes ?? null,
      });

      if (exError) throw exError;
    }
  }

  return routine.id as string;
}

