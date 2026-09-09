"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsPending(true);

    if (!supabase) {
      setIsPending(false);
      setError("Supabase is not configured (missing env vars).");
      return;
    }

    const emailRedirectTo = `${window.location.origin}/auth/callback`;

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    setIsPending(false);

    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        setError(
          "Too many confirmation emails were sent. Wait a few minutes, or disable email confirmation in Supabase Auth settings for local testing.",
        );
        return;
      }
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      setError("An account with this email already exists. Try logging in.");
      return;
    }

    setMessage(
      "Account created. Check your email and click the confirmation link to finish signing in.",
    );
  }

  return (
    <div className="mx-auto grid min-h-[100dvh] w-full max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-2">
      <div className="animate-fade-up hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ice)]">
          Winter Arc
        </p>
        <h1 className="wa-display mt-4 text-5xl font-bold leading-none">
          Build the season that builds you.
        </h1>
        <p className="mt-4 max-w-md text-[var(--muted)]">
          Visual routines, photo-backed exercises, and progress that stays
          honest through winter.
        </p>
      </div>

      <div className="animate-fade-up-delay wa-card p-6 sm:p-8">
        <h2 className="wa-display text-3xl font-bold">Create account</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Start your Winter Arc gym routine.
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="wa-btn wa-btn-primary mt-2"
          >
            {isPending ? "Creating..." : "Sign up"}
          </button>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {message ? (
            <p className="text-sm text-[var(--success)]">{message}</p>
          ) : null}
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link className="font-semibold text-[var(--ice)]" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
