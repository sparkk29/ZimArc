import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const QUOTES = [
  "Cold season. Warm blood. Keep the arc.",
  "Small sessions stack into a season.",
  "Show up once more than yesterday.",
];

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const name = data.user.email?.split("@")[0] ?? "athlete";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <section className="animate-fade-up relative overflow-hidden rounded-[2rem] border border-[var(--border)]">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80"
            alt="Gym atmosphere"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111f] via-[#07111f]/82 to-[#07111f]/35" />
        </div>

        <div className="relative flex flex-col gap-8 p-6 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ice)]">
              Winter Arc
            </p>
            <h1 className="wa-display mt-3 text-4xl font-bold leading-none sm:text-5xl">
              Stay on your arc, {name}.
            </h1>
            <p className="mt-4 max-w-md text-base text-[var(--frost)]/85">
              {quote}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/workouts/start" className="wa-btn wa-btn-primary">
                Start workout
              </Link>
              <Link href="/routines" className="wa-btn wa-btn-ghost">
                Build routine
              </Link>
            </div>
          </div>
          <LogoutButton />
        </div>
      </section>

      <section className="animate-fade-up-delay mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            href: "/routines",
            title: "Routines",
            copy: "Design splits with photo-backed exercises.",
            image:
              "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=800&q=80",
          },
          {
            href: "/workouts",
            title: "Workouts",
            copy: "Log sets with rest timers and visual cues.",
            image:
              "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?auto=format&fit=crop&w=800&q=80",
          },
          {
            href: "/progress",
            title: "Progress",
            copy: "Track streaks, volume, and personal records.",
            image:
              "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group wa-card overflow-hidden transition hover:-translate-y-1"
          >
            <div className="relative h-36">
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c30] via-[#0e1c30]/35 to-transparent" />
            </div>
            <div className="p-5">
              <h2 className="wa-display text-xl font-bold">{card.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.copy}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
