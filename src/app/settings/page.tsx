"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getUserProfile,
  toReminderSettings,
  updateReminderSettings,
  type ReminderSettings,
} from "@/lib/supabase/profile";
import { syncReminderSettingsToServiceWorker } from "@/lib/reminders/sw";

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function SettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: false,
    time: "07:00",
    days: [1, 2, 3, 4, 5],
  });
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!supabase) {
          setError("Supabase is not configured (missing env vars).");
          return;
        }

        const profile = await getUserProfile(supabase);
        if (profile) setSettings(toReminderSettings(profile));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDay(day: number) {
    setSettings((prev) => {
      const has = prev.days.includes(day);
      const days = has
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort((a, b) => a - b);
      return { ...prev, days };
    });
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission !== "granted") {
      setError("Notifications were not granted.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase is not configured (missing env vars).");
      return;
    }

    if (settings.enabled && settings.days.length === 0) {
      setError("Pick at least one reminder day.");
      return;
    }

    if (
      settings.enabled &&
      notificationPermission !== "granted" &&
      notificationPermission !== "unsupported"
    ) {
      setError("Enable browser notifications before turning on reminders.");
      return;
    }

    setIsSaving(true);
    try {
      await updateReminderSettings(supabase, settings);
      await syncReminderSettingsToServiceWorker(settings);
      setMessage("Reminder settings saved. You can also install Winter Arc as an app for better offline reminders.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Configure workout reminders for your Winter Arc.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-zinc-600">Loading settings...</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Workout reminders</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Browser notifications at your chosen time on selected days.
              Install Winter Arc as an app for better offline/background support.
            </p>

            <label className="mt-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
              />
              Enable reminders
            </label>

            <label className="mt-4 flex flex-col gap-1">
              <span className="text-sm font-medium">Reminder time</span>
              <input
                type="time"
                className="w-full max-w-xs rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                value={settings.time}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </label>

            <div className="mt-4">
              <p className="text-sm font-medium">Reminder days</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAY_OPTIONS.map((day) => {
                  const active = settings.days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={
                        active
                          ? "rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                          : "rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                      }
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm text-zinc-600">
                Notification permission:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {notificationPermission}
                </span>
              </p>
              {notificationPermission !== "granted" &&
              notificationPermission !== "unsupported" ? (
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100"
                >
                  Enable browser notifications
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </form>
      )}
    </div>
  );
}
