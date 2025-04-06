/**
 * Leerer Service Worker 
 * Diese Datei verhindert 404-Fehler, wenn der Service Worker angefordert wird
 */

// Leerer Cache-Name
const CACHE_NAME = 'solo-new-cache-v1';

// Bei Installation: Keine Aktion
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installiert');
});

// Bei Aktivierung: Keine Aktion
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktiviert');
});

// Bei Fetch: Netzwerkanfrage durchlassen
self.addEventListener('fetch', (event) => {
  // Einfach die Anfrage durchlassen, ohne Caching
  event.respondWith(fetch(event.request));
}); 