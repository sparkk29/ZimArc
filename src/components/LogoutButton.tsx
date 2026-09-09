"use client";

import { createClientComponentClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onLogout() {
    setError(null);
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
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Logging out..." : "Log out"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

