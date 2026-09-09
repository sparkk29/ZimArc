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
  { href: "/dashboard", label: "Dashboard" },
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
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/dashboard" className="text-sm font-semibold">
              Winter Arc
            </Link>
            <nav className="flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href))
                      ? "rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      ) : null}

      <ReminderPoller settings={reminderSettings} />
      {children}
    </>
  );
}
