/* Winter Arc service worker — offline shell + reminder notifications */

const CACHE_NAME = "winterarc-v1";
const APP_SHELL = ["/", "/dashboard", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});

const REMINDER_KEY = "winterarc-reminder-settings";
const LAST_FIRE_KEY = "winterarc-last-reminder-day";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("winterarc-sw", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readonly");
    const store = tx.objectStore("kv");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    const store = tx.objectStore("kv");
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function shouldFire(settings, now = new Date()) {
  if (!settings || !settings.enabled) return false;
  if (!Array.isArray(settings.days) || !settings.days.includes(now.getDay())) {
    return false;
  }
  const [hourStr, minuteStr] = String(settings.time || "").split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  return now.getHours() === hour && now.getMinutes() === minute;
}

async function maybeNotify() {
  const settings = await idbGet(REMINDER_KEY);
  if (!shouldFire(settings)) return;

  const today = new Date().toISOString().slice(0, 10);
  const last = await idbGet(LAST_FIRE_KEY);
  if (last === today) return;

  await self.registration.showNotification("Winter Arc", {
    body: "Time for your workout. Stay on your arc.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: "winterarc-reminder",
  });
  await idbSet(LAST_FIRE_KEY, today);
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SAVE_REMINDER_SETTINGS") {
    event.waitUntil(idbSet(REMINDER_KEY, data.settings));
  }
  if (data.type === "CHECK_REMINDER") {
    event.waitUntil(maybeNotify());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "winterarc-reminder-check") {
    event.waitUntil(maybeNotify());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/workouts/start");
    }),
  );
});
