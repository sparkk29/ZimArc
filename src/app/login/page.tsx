"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    if (!supabase) {
      setIsPending(false);
      setError("Supabase is not configured (missing env vars).");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsPending(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto grid min-h-[100dvh] w-full max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-2">
      <div className="animate-fade-up hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ice)]">
          Winter Arc
        </p>
        <h1 className="wa-display mt-4 text-5xl font-bold leading-none">
          Return to the work.
        </h1>
        <p className="mt-4 max-w-md text-[var(--muted)]">
          Your routines, sets, and winter streak are waiting.
        </p>
      </div>

      <div className="animate-fade-up-delay wa-card p-6 sm:p-8">
        <h2 className="wa-display text-3xl font-bold">Log in</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Continue your Winter Arc.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="wa-label">Email</span>
            <input
              className="wa-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="wa-label">Password</span>
            <input
              className="wa-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="wa-btn wa-btn-primary mt-2"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          New here?{" "}
          <Link className="font-semibold text-[var(--ice)]" href="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 text-sm text-[var(--muted)]">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
