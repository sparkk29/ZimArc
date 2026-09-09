import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Signed in as <span className="font-medium">{data.user.email}</span>
          </p>
        </div>

        <LogoutButton />
      </div>

      <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Next steps</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Manage your Winter Arc routine, then start tracking workouts.
        </p>

        <div className="mt-4">
          <Link
            href="/routines"
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to routine builder
          </Link>
        </div>

        <div className="mt-3">
          <Link
            href="/workouts/start"
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
          >
            Start workout
          </Link>
        </div>

        <div className="mt-3">
          <Link
            href="/progress"
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
          >
            View progress
          </Link>
        </div>
      </div>
    </div>
  );
}

