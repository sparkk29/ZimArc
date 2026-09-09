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
  exercise_name: string;
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
    exercise_name: s.exercise_name,
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

export async function listCompletedWorkoutSessions(
  supabase: SupabaseClient,
  limit = 60,
) {
  const { data: sessions, error: sessErr } = await supabase
    .from("workout_sessions")
    .select("id,started_at,completed_at,routine_id")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (sessErr) throw sessErr;

  return (sessions ?? []) as Array<{
    id: string;
    started_at: string;
    completed_at: string;
    routine_id: string;
  }>;
}

export async function listWorkoutSetsForSessions(
  supabase: SupabaseClient,
  sessionIds: string[],
) {
  if (sessionIds.length === 0) return [];

  const { data: sets, error } = await supabase
    .from("workout_sets")
    .select("workout_session_id,actual_reps,actual_weight")
    .in("workout_session_id", sessionIds);

  if (error) throw error;

  return (sets ?? []) as Array<{
    workout_session_id: string;
    actual_reps: number | null;
    actual_weight: number | null;
  }>;
}

export type WorkoutSetRow = {
  id: string;
  workout_session_id: string;
  routine_exercise_id: string;
  set_order: number;
  planned_reps: string;
  planned_weight: number | null;
  actual_reps: number | null;
  actual_weight: number | null;
  notes: string | null;
  exercise_name: string;
  day_label: string;
};

export type WorkoutSessionDetail = {
  id: string;
  started_at: string;
  completed_at: string | null;
  routine_id: string;
  routine_name: string;
  notes: string | null;
  sets: WorkoutSetRow[];
};

export async function getWorkoutSessionDetail(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<WorkoutSessionDetail | null> {
  const { data: session, error: sessErr } = await supabase
    .from("workout_sessions")
    .select("id,started_at,completed_at,routine_id,notes")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessErr) throw sessErr;
  if (!session) return null;

  const { data: routine, error: routineErr } = await supabase
    .from("routines")
    .select("name")
    .eq("id", session.routine_id)
    .maybeSingle();

  if (routineErr) throw routineErr;

  const { data: sets, error: setsErr } = await supabase
    .from("workout_sets")
    .select(
      "id,workout_session_id,routine_exercise_id,set_order,planned_reps,planned_weight,actual_reps,actual_weight,notes,exercise_name",
    )
    .eq("workout_session_id", sessionId)
    .order("set_order", { ascending: true });

  if (setsErr) throw setsErr;

  const setRows = (sets ?? []) as Array<
    Omit<WorkoutSetRow, "exercise_name" | "day_label"> & {
      exercise_name: string | null;
      routine_exercise_id: string | null;
    }
  >;
  const exerciseIds = Array.from(
    new Set(
      setRows
        .map((s) => s.routine_exercise_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const exerciseMeta = new Map<
    string,
    { exercise_name: string; day_label: string }
  >();

  if (exerciseIds.length > 0) {
    const { data: exercises, error: exErr } = await supabase
      .from("routine_exercises")
      .select("id,exercise_name,routine_day_id")
      .in("id", exerciseIds);

    if (exErr) throw exErr;

    const dayIds = Array.from(
      new Set((exercises ?? []).map((e) => e.routine_day_id as string)),
    );

    const dayLabels = new Map<string, string>();
    if (dayIds.length > 0) {
      const { data: days, error: dayErr } = await supabase
        .from("routine_days")
        .select("id,label")
        .in("id", dayIds);

      if (dayErr) throw dayErr;
      for (const d of days ?? []) {
        dayLabels.set(d.id as string, d.label as string);
      }
    }

    for (const ex of exercises ?? []) {
      exerciseMeta.set(ex.id as string, {
        exercise_name: ex.exercise_name as string,
        day_label: dayLabels.get(ex.routine_day_id as string) ?? "Day",
      });
    }
  }

  const enrichedSets: WorkoutSetRow[] = setRows.map((s) => {
    const meta = s.routine_exercise_id
      ? exerciseMeta.get(s.routine_exercise_id)
      : undefined;
    return {
      ...s,
      routine_exercise_id: s.routine_exercise_id ?? "",
      exercise_name:
        s.exercise_name || meta?.exercise_name || "Unknown exercise",
      day_label: meta?.day_label ?? "Day",
    };
  });

  enrichedSets.sort((a, b) => {
    if (a.day_label !== b.day_label) return a.day_label.localeCompare(b.day_label);
    if (a.exercise_name !== b.exercise_name) {
      return a.exercise_name.localeCompare(b.exercise_name);
    }
    return a.set_order - b.set_order;
  });

  return {
    id: session.id as string,
    started_at: session.started_at as string,
    completed_at: (session.completed_at as string | null) ?? null,
    routine_id: session.routine_id as string,
    routine_name: (routine?.name as string) ?? "Routine",
    notes: (session.notes as string | null) ?? null,
    sets: enrichedSets,
  };
}

export type WorkoutSetUpdate = {
  id: string;
  actual_reps: number | null;
  actual_weight: number | null;
  notes?: string | null;
};

export async function updateWorkoutSession(
  supabase: SupabaseClient,
  sessionId: string,
  setUpdates: WorkoutSetUpdate[],
  sessionNotes?: string | null,
) {
  for (const update of setUpdates) {
    const { error } = await supabase
      .from("workout_sets")
      .update({
        actual_reps: update.actual_reps,
        actual_weight: update.actual_weight,
        notes: update.notes ?? null,
      })
      .eq("id", update.id);

    if (error) throw error;
  }

  const { error: sessionErr } = await supabase
    .from("workout_sessions")
    .update({ notes: sessionNotes ?? null })
    .eq("id", sessionId);

  if (sessionErr) throw sessionErr;
}

export async function deleteWorkoutSession(
  supabase: SupabaseClient,
  sessionId: string,
) {
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw error;
}

export type ExerciseProgressPoint = {
  date: string;
  volume: number;
  maxWeight: number | null;
  totalReps: number;
};

export type ExerciseProgressSummary = {
  exerciseId: string;
  exerciseName: string;
  totalVolume: number;
  bestWeight: number | null;
  sessionCount: number;
  history: ExerciseProgressPoint[];
};

export async function getExerciseProgress(
  supabase: SupabaseClient,
  limit = 90,
): Promise<ExerciseProgressSummary[]> {
  const sessions = await listCompletedWorkoutSessions(supabase, limit);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const completedAtBySession = new Map(
    sessions.map((s) => [s.id, s.completed_at]),
  );

  const { data: sets, error } = await supabase
    .from("workout_sets")
    .select(
      "workout_session_id,routine_exercise_id,actual_reps,actual_weight",
    )
    .in("workout_session_id", sessionIds);

  if (error) throw error;

  const exerciseIds = Array.from(
    new Set((sets ?? []).map((s) => s.routine_exercise_id as string)),
  );

  const exerciseNames = new Map<string, string>();
  if (exerciseIds.length > 0) {
    const { data: exercises, error: exErr } = await supabase
      .from("routine_exercises")
      .select("id,exercise_name")
      .in("id", exerciseIds);

    if (exErr) throw exErr;
    for (const ex of exercises ?? []) {
      exerciseNames.set(ex.id as string, ex.exercise_name as string);
    }
  }

  type Agg = {
    exerciseId: string;
    exerciseName: string;
    totalVolume: number;
    bestWeight: number | null;
    sessionIds: Set<string>;
    byDate: Map<string, { volume: number; maxWeight: number | null; totalReps: number }>;
  };

  const byExercise = new Map<string, Agg>();

  for (const row of sets ?? []) {
    const exId = row.routine_exercise_id as string;
    const sessionId = row.workout_session_id as string;
    const completedAt = completedAtBySession.get(sessionId);
    if (!completedAt) continue;

    const date = completedAt.slice(0, 10);
    const reps = row.actual_reps as number | null;
    const weight = row.actual_weight as number | null;

    if (!byExercise.has(exId)) {
      byExercise.set(exId, {
        exerciseId: exId,
        exerciseName: exerciseNames.get(exId) ?? "Unknown exercise",
        totalVolume: 0,
        bestWeight: null,
        sessionIds: new Set(),
        byDate: new Map(),
      });
    }

    const agg = byExercise.get(exId)!;
    agg.sessionIds.add(sessionId);

    if (reps != null && weight != null) {
      agg.totalVolume += reps * weight;
      agg.bestWeight =
        agg.bestWeight == null ? weight : Math.max(agg.bestWeight, weight);
    } else if (weight != null) {
      agg.bestWeight =
        agg.bestWeight == null ? weight : Math.max(agg.bestWeight, weight);
    }

    if (!agg.byDate.has(date)) {
      agg.byDate.set(date, { volume: 0, maxWeight: null, totalReps: 0 });
    }
    const day = agg.byDate.get(date)!;
    if (reps != null) day.totalReps += reps;
    if (reps != null && weight != null) day.volume += reps * weight;
    if (weight != null) {
      day.maxWeight =
        day.maxWeight == null ? weight : Math.max(day.maxWeight, weight);
    }
  }

  return Array.from(byExercise.values())
    .map((agg) => ({
      exerciseId: agg.exerciseId,
      exerciseName: agg.exerciseName,
      totalVolume: agg.totalVolume,
      bestWeight: agg.bestWeight,
      sessionCount: agg.sessionIds.size,
      history: Array.from(agg.byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date,
          volume: stats.volume,
          maxWeight: stats.maxWeight,
          totalReps: stats.totalReps,
        })),
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume);
}

