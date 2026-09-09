import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;
  const error = typeof params.error === "string" ? params.error : null;
  const errorDescription =
    typeof params.error_description === "string"
      ? params.error_description
      : null;

  // Email confirmation / OAuth often lands on Site URL (/).
  // Forward auth params to the PKCE callback handler.
  if (code || error) {
    const query = new URLSearchParams();
    if (code) query.set("code", code);
    if (error) query.set("error", error);
    if (errorDescription) query.set("error_description", errorDescription);
    redirect(`/auth/callback?${query.toString()}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
