import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
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
          Phase 3 will add your winter arc routine builder and workout tracking.
        </p>
      </div>
    </div>
  );
}

