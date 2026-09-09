"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import RoutineEditor, {
  type RoutineDayDraftForm,
} from "@/components/RoutineEditor";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createRoutine, type RoutineDraft } from "@/lib/supabase/routines";

const DEFAULT_DAYS: RoutineDayDraftForm[] = [
  {
    label: "Push",
    exercises: [
      {
        name: "Bench Press",
        sets: 3,
        reps: "8-12",
        weightText: "",
        restSeconds: 90,
        notes: "",
      },
    ],
  },
  {
    label: "Pull",
    exercises: [
      {
        name: "Lat Pulldown",
        sets: 3,
        reps: "8-12",
        weightText: "",
        restSeconds: 90,
        notes: "",
      },
    ],
  },
  {
    label: "Legs",
    exercises: [
      {
        name: "Squat",
        sets: 3,
        reps: "6-10",
        weightText: "",
        restSeconds: 120,
        notes: "",
      },
    ],
  },
];

export default function NewRoutinePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return (
    <RoutineEditor
      title="Create routine"
      subtitle="Save your Winter Arc routine and mark it active."
      initialName="Winter Arc Routine"
      initialMakeActive
      initialDays={DEFAULT_DAYS}
      submitLabel="Save routine"
      onSubmit={async (draft: RoutineDraft, makeActive: boolean) => {
        if (!supabase) throw new Error("Supabase is not configured.");
        await createRoutine(supabase, draft, makeActive);
        router.push("/routines");
        router.refresh();
      }}
    />
  );
}
