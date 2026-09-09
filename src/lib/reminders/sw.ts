import type { ReminderSettings } from "@/lib/supabase/profile";

export async function syncReminderSettingsToServiceWorker(
  settings: ReminderSettings,
) {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({
    type: "SAVE_REMINDER_SETTINGS",
    settings,
  });

  // Ask Chromium browsers to periodically wake the SW when supported.
  const periodicSync = (
    registration as ServiceWorkerRegistration & {
      periodicSync?: {
        register: (tag: string, options?: { minInterval: number }) => Promise<void>;
      };
    }
  ).periodicSync;

  if (periodicSync && settings.enabled) {
    try {
      await periodicSync.register("winterarc-reminder-check", {
        minInterval: 60 * 60 * 1000,
      });
    } catch {
      // periodicSync requires permission / HTTPS and is not widely available.
    }
  }
}

export async function pingServiceWorkerReminderCheck() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: "CHECK_REMINDER" });
}
