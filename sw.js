const CACHE = "wa-crm-v2";
const ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.url.includes("anthropic.com")) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener("message", e => {
  if (e.data?.type === "CHECK_REMINDERS") {
    const contacts = e.data.contacts || [];
    const now = Date.now();
    contacts.forEach(c => {
      if (!c.tags?.includes("key")) return;
      const days = c.lastContact
        ? Math.floor((now - new Date(c.lastContact).getTime()) / 86400000)
        : 999;
      if (days >= c.reminderDays) {
        self.registration.showNotification("Time to reach out 👋", {
          body: `You haven't contacted ${c.name} in ${days} days.`,
          icon: "/icon.png",
          badge: "/icon.png",
          tag: `reminder-${c.id}`,
          data: { contactId: c.id }
        });
      }
    });
  }
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow("/");
    })
  );
});
