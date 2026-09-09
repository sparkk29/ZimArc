"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getUserProfile,
  toReminderSettings,
  type ReminderSettings,
} from "@/lib/supabase/profile";
import ReminderPoller from "./ReminderPoller";

const AUTH_ROUTES = new Set(["/login", "/signup"]);

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/routines", label: "Routines" },
  { href: "/workouts", label: "Workouts" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [reminderSettings, setReminderSettings] =
    useState<ReminderSettings | null>(null);

  const showNav = !AUTH_ROUTES.has(pathname);

  useEffect(() => {
    if (!showNav || !supabase) return;

    getUserProfile(supabase)
      .then((profile) => {
        if (profile) setReminderSettings(toReminderSettings(profile));
      })
      .catch(() => {
        // Profile table may not exist yet until migration is run.
      });
  }, [showNav, supabase, pathname]);

  return (
    <>
      {showNav ? (
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(7,17,31,0.78)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(158,201,222,0.28)] bg-[rgba(63,135,168,0.18)] text-sm font-bold text-[var(--ice)]">
                WA
              </span>
              <span>
                <span className="wa-display block text-lg font-bold leading-none tracking-tight">
                  Winter Arc
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Train through the cold
                </span>
              </span>
            </Link>
            <nav className="flex flex-wrap justify-end gap-1.5">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "rounded-full bg-[linear-gradient(135deg,#4f97b5_0%,#2f6f8d_100%)] px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-full px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:bg-[rgba(158,201,222,0.08)] hover:text-[var(--frost)]"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      ) : null}

      <ReminderPoller settings={reminderSettings} />
      <main className="flex-1">{children}</main>
    </>
  );
}
