import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkoutRoutineExercisePlan = {
  id: string;
  exercise_name: string;
  target_sets: number;
  target_reps: string;
  target_weight: number | null;
  rest_seconds: number;
  routine_day_id: string;
  exercise_order: number;
};

export type WorkoutRoutineDayPlan = {
  id: string;
  label: string;
  day_order: number;
  exercises: WorkoutRoutineExercisePlan[];
};

export type WorkoutRoutinePlan = {
  id: string;
  name: string;
  days: WorkoutRoutineDayPlan[];
};

export async function getActiveRoutinePlan(
  supabase: SupabaseClient,
): Promise<WorkoutRoutinePlan | null> {
  const { data: activeRoutine, error: activeErr } = await supabase
    .from("routines")
    .select("id,name")
    .eq("is_active", true)
    .maybeSingle();

  if (activeErr) throw activeErr;
  if (!activeRoutine) return null;

  const routineId = activeRoutine.id as string;

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
  if (dayIds.length === 0) {
    return { id: routineId, name: activeRoutine.name as string, days: [] };
  }

  const { data: exercises, error: exErr } = await supabase
    .from("routine_exercises")
    .select(
      "id,routine_day_id,exercise_order,exercise_name,target_sets,target_reps,target_weight,rest_seconds",
    )
    .in("routine_day_id", dayIds)
    .order("routine_day_id", { ascending: true })
    .order("exercise_order", { ascending: true });

  if (exErr) throw exErr;

  const exRows = (exercises ?? []) as WorkoutRoutineExercisePlan[];

  const daysWithExercises: WorkoutRoutineDayPlan[] = dayRows.map((d) => ({
    id: d.id,
    label: d.label,
    day_order: d.day_order,
    exercises: [],
  }));

  const byDay = new Map<string, WorkoutRoutineDayPlan>();
  for (const d of daysWithExercises) byDay.set(d.id, d);

  for (const ex of exRows) {
    const day = byDay.get(ex.routine_day_id);
    if (!day) continue;
    day.exercises.push(ex);
  }

  // Ensure per-day order
  for (const d of daysWithExercises) {
    d.exercises.sort((a, b) => a.exercise_order - b.exercise_order);
  }

  return {
    id: routineId,
    name: activeRoutine.name as string,
    days: daysWithExercises.sort((a, b) => a.day_order - b.day_order),
  };
}

export async function createWorkoutSession(
  supabase: SupabaseClient,
  routineId: string,
) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ routine_id: routineId })
    .select("id")
    .single();

  if (error) throw error;
  return (data?.id ?? null) as string | null;
}

export type WorkoutSetDraft = {
  routine_exercise_id: string;
  planned_reps: string;
  planned_weight: number | null;
  set_order: number; // 1..target_sets
  actual_reps: number | null;
  actual_weight: number | null;
  notes?: string | null;
};

export async function saveWorkout(
  supabase: SupabaseClient,
  sessionId: string,
  sets: WorkoutSetDraft[],
) {
  // Insert all sets
  const rows = sets.map((s) => ({
    workout_session_id: sessionId,
    routine_exercise_id: s.routine_exercise_id,
    set_order: s.set_order,
    planned_reps: s.planned_reps,
    planned_weight: s.planned_weight,
    actual_reps: s.actual_reps,
    actual_weight: s.actual_weight,
    notes: s.notes ?? null,
  }));

  const { error: insertErr } = await supabase
    .from("workout_sets")
    .insert(rows);

  if (insertErr) throw insertErr;

  // Mark the session completed.
  const { error: updateErr } = await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (updateErr) throw updateErr;
}

export async function listWorkoutSessions(supabase: SupabaseClient) {
  const { data: sessions, error: sessErr } = await supabase
    .from("workout_sessions")
    .select("id,started_at,completed_at,routine_id")
    .order("started_at", { ascending: false })
    .limit(25);

  if (sessErr) throw sessErr;

  const sessionRows = (sessions ?? []) as Array<{
    id: string;
    started_at: string;
    completed_at: string | null;
    routine_id: string;
  }>;

  const routineIds = Array.from(new Set(sessionRows.map((s) => s.routine_id)));
  if (routineIds.length === 0) return [];

  const { data: routines, error: routinesErr } = await supabase
    .from("routines")
    .select("id,name")
    .in("id", routineIds);

  if (routinesErr) throw routinesErr;

  const routineById = new Map(
    (routines ?? []).map((r) => [r.id as string, (r.name ?? "") as string]),
  );

  return sessionRows.map((s) => ({
    ...s,
    routine_name: routineById.get(s.routine_id) ?? "Routine",
  }));
}

