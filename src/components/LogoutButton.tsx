"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onLogout() {
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured (missing env vars).");
      return;
    }
    startTransition(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onLogout}
        disabled={isPending}
        className="wa-btn wa-btn-ghost"
      >
        {isPending ? "Logging out..." : "Log out"}
      </button>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
