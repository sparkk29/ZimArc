"use client";

import { useEffect, useRef } from "react";
import type { ReminderSettings } from "@/lib/supabase/profile";
import {
  pingServiceWorkerReminderCheck,
  syncReminderSettingsToServiceWorker,
} from "@/lib/reminders/sw";

const STORAGE_KEY = "winterarc_last_reminder";

function shouldFireNow(settings: ReminderSettings) {
  if (!settings.enabled) return false;

  const now = new Date();
  const day = now.getDay();
  if (!settings.days.includes(day)) return false;

  const [hourStr, minuteStr] = settings.time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;

  return now.getHours() === hour && now.getMinutes() === minute;
}

function alreadyFiredToday() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  const today = new Date().toISOString().slice(0, 10);
  return stored === today;
}

function markFiredToday() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
}

type ReminderPollerProps = {
  settings: ReminderSettings | null;
};

export default function ReminderPoller({ settings }: ReminderPollerProps) {
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!settings) return;
    syncReminderSettingsToServiceWorker(settings).catch(() => {});
  }, [settings]);

  useEffect(() => {
    if (!settings?.enabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const tick = () => {
      const current = settingsRef.current;
      pingServiceWorkerReminderCheck().catch(() => {});
      if (!current || !shouldFireNow(current)) return;
      if (alreadyFiredToday()) return;
      if (Notification.permission !== "granted") return;

      new Notification("Winter Arc", {
        body: "Time for your workout. Stay on your arc.",
        tag: "winterarc-reminder",
      });
      markFiredToday();
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [settings?.enabled, settings?.time, settings?.days]);

  return null;
}
