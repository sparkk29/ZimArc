"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getActiveRoutine,
  listRoutines,
  setActiveRoutine,
} from "@/lib/supabase/routines";
import { formatError } from "@/lib/format-error";

type RoutineRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export default function RoutinesPage() {
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
      setError(formatError(e));
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
      setError(formatError(e));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="wa-display text-3xl font-bold sm:text-4xl">
            Your routines
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Active:{" "}
            <span className="font-semibold text-[var(--frost)]">
              {activeRoutineName ?? "none yet"}
            </span>
          </p>
        </div>

        <Link href="/routines/new" className="wa-btn wa-btn-primary">
          + New routine
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {routines.map((r) => (
          <div key={r.id} className="wa-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })}
                </p>
                <h2 className="wa-display mt-2 text-2xl font-bold">{r.name}</h2>
                {r.id === activeRoutineId ? (
                  <span className="mt-3 inline-block rounded-full bg-[rgba(111,207,151,0.15)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
                    Active
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-2">
                {r.id !== activeRoutineId ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onSetActive(r.id)}
                    className="wa-btn wa-btn-ghost"
                  >
                    {isPending ? "Setting..." : "Set active"}
                  </button>
                ) : null}
                <Link href={`/routines/${r.id}`} className="wa-btn wa-btn-ghost">
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {routines.length === 0 ? (
        <div className="wa-card mt-10 border-dashed p-8 text-sm text-[var(--muted)]">
          No routines yet. Create your first Winter Arc routine with photo-backed
          exercises.
        </div>
      ) : null}
    </div>
  );
}
