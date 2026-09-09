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

  await insertRoutineDaysAndExercises(supabase, routine.id as string, draft);

  return routine.id as string;
}

export type RoutineDetail = {
  id: string;
  name: string;
  is_active: boolean;
  days: Array<{
    id: string;
    label: string;
    day_order: number;
    exercises: Array<{
      id: string;
      name: string;
      sets: number;
      reps: string;
      weight: number | null;
      restSeconds: number;
      notes: string | null;
      exercise_order: number;
    }>;
  }>;
};

export async function getRoutineDetail(
  supabase: SupabaseClient,
  routineId: string,
): Promise<RoutineDetail | null> {
  const { data: routine, error: routineErr } = await supabase
    .from("routines")
    .select("id,name,is_active")
    .eq("id", routineId)
    .maybeSingle();

  if (routineErr) throw routineErr;
  if (!routine) return null;

  const { data: days, error: daysErr } = await supabase
    .from("routine_days")
    .select("id,label,day_order")
    .eq("routine_id", routineId)
    .order("day_order", { ascending: true });

  if (daysErr) throw daysErr;

  const dayRows = (days ?? []) as Array<{
    id: string;
    label: string;
    day_order: number;
  }>;
  const dayIds = dayRows.map((d) => d.id);

  const exercisesByDay = new Map<
    string,
    RoutineDetail["days"][number]["exercises"]
  >();

  if (dayIds.length > 0) {
    const { data: exercises, error: exErr } = await supabase
      .from("routine_exercises")
      .select(
        "id,routine_day_id,exercise_order,exercise_name,target_sets,target_reps,target_weight,rest_seconds,notes",
      )
      .in("routine_day_id", dayIds)
      .order("exercise_order", { ascending: true });

    if (exErr) throw exErr;

    for (const ex of exercises ?? []) {
      const dayId = ex.routine_day_id as string;
      if (!exercisesByDay.has(dayId)) exercisesByDay.set(dayId, []);
      exercisesByDay.get(dayId)!.push({
        id: ex.id as string,
        name: ex.exercise_name as string,
        sets: ex.target_sets as number,
        reps: ex.target_reps as string,
        weight: (ex.target_weight as number | null) ?? null,
        restSeconds: ex.rest_seconds as number,
        notes: (ex.notes as string | null) ?? null,
        exercise_order: ex.exercise_order as number,
      });
    }
  }

  return {
    id: routine.id as string,
    name: routine.name as string,
    is_active: Boolean(routine.is_active),
    days: dayRows.map((d) => ({
      id: d.id,
      label: d.label,
      day_order: d.day_order,
      exercises: (exercisesByDay.get(d.id) ?? []).sort(
        (a, b) => a.exercise_order - b.exercise_order,
      ),
    })),
  };
}

async function insertRoutineDaysAndExercises(
  supabase: SupabaseClient,
  routineId: string,
  draft: RoutineDraft,
) {
  for (let dayIndex = 0; dayIndex < draft.days.length; dayIndex++) {
    const day = draft.days[dayIndex];

    const { data: dayRow, error: dayError } = await supabase
      .from("routine_days")
      .insert({
        routine_id: routineId,
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
}

export async function updateRoutine(
  supabase: SupabaseClient,
  routineId: string,
  draft: RoutineDraft,
  makeActive: boolean,
) {
  if (makeActive) {
    const { error: deactivateError } = await supabase
      .from("routines")
      .update({ is_active: false })
      .eq("is_active", true);
    if (deactivateError) throw deactivateError;
  }

  const { error: updateError } = await supabase
    .from("routines")
    .update({
      name: draft.name,
      is_active: makeActive,
    })
    .eq("id", routineId);

  if (updateError) throw updateError;

  // Replace day/exercise structure. Workout history stays via ON DELETE SET NULL
  // + exercise_name snapshot on workout_sets (see 004_routine_edit_safe.sql).
  const { error: deleteDaysError } = await supabase
    .from("routine_days")
    .delete()
    .eq("routine_id", routineId);

  if (deleteDaysError) throw deleteDaysError;

  await insertRoutineDaysAndExercises(supabase, routineId, draft);
}

export async function deleteRoutine(
  supabase: SupabaseClient,
  routineId: string,
) {
  const { count, error: countErr } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("routine_id", routineId);

  if (countErr) throw countErr;
  if ((count ?? 0) > 0) {
    throw new Error(
      "This routine has logged workouts. Delete those workouts first, or keep the routine for history.",
    );
  }

  const { error } = await supabase.from("routines").delete().eq("id", routineId);
  if (error) throw error;
}

