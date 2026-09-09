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
import { formatError } from "@/lib/format-error";

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
        setError(formatError(e));
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
      setError(formatError(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="wa-display text-3xl font-bold sm:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Configure workout reminders for your Winter Arc.
      </p>

      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? (
        <p className="mt-4 text-sm text-[var(--success)]">{message}</p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-[var(--muted)]">Loading settings...</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
          <div className="wa-card p-5">
            <h2 className="wa-display text-xl font-bold">Workout reminders</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Browser notifications at your chosen time on selected days.
              Install Winter Arc as an app for better offline/background support.
            </p>

            <label className="mt-4 flex items-center gap-3 text-sm text-[var(--frost)]">
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

            <label className="mt-4 flex max-w-xs flex-col gap-1.5">
              <span className="wa-label">Reminder time</span>
              <input
                type="time"
                className="wa-input"
                value={settings.time}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </label>

            <div className="mt-4">
              <p className="wa-label">Reminder days</p>
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
                          ? "rounded-full bg-[linear-gradient(135deg,#4f97b5_0%,#2f6f8d_100%)] px-3 py-1.5 text-xs font-semibold text-white"
                          : "wa-btn wa-btn-ghost !px-3 !py-1.5 !text-xs"
                      }
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm text-[var(--muted)]">
                Notification permission:{" "}
                <span className="font-semibold text-[var(--frost)]">
                  {notificationPermission}
                </span>
              </p>
              {notificationPermission !== "granted" &&
              notificationPermission !== "unsupported" ? (
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="wa-btn wa-btn-ghost w-fit"
                >
                  Enable browser notifications
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="wa-btn wa-btn-primary w-fit"
          >
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </form>
      )}
    </div>
  );
}
