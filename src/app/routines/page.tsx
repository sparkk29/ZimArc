"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getActiveRoutine,
  listRoutines,
  setActiveRoutine,
} from "@/lib/supabase/routines";

type RoutineRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export default function RoutinesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [routines, setRoutines] = useState<RoutineRow[]>([]);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      if (!supabase) {
        setError("Supabase is not configured (missing env vars).");
        setRoutines([]);
        setActiveRoutineId(null);
        return;
      }
      const list = await listRoutines(supabase);
      setRoutines(list as RoutineRow[]);

      const active = await getActiveRoutine(supabase);
      setActiveRoutineId(active?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeRoutineName = useMemo(() => {
    const active = routines.find((r) => r.id === activeRoutineId);
    return active?.name ?? null;
  }, [activeRoutineId, routines]);

  async function onSetActive(routineId: string) {
    setError(null);
    setIsPending(true);
    try {
      if (!supabase) {
        setError("Supabase is not configured (missing env vars).");
        return;
      }
      await setActiveRoutine(supabase, routineId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your routines</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Active:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {activeRoutineName ?? "none yet"}
            </span>
          </p>
        </div>

        <Link
          href="/routines/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + New routine
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {routines.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Created:{" "}
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{r.name}</h2>
                {r.id === activeRoutineId ? (
                  <span className="mt-2 inline-block rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                    Active
                  </span>
                ) : null}
              </div>

              {r.id !== activeRoutineId ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onSetActive(r.id)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100"
                >
                  {isPending ? "Setting..." : "Set active"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                >
                  View
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {routines.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          No routines yet. Create your first Winter Arc routine and start tracking progress.
        </div>
      ) : null}
    </div>
  );
}

