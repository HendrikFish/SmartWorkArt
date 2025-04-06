/**
 * Scroll-to-top Funktionalität
 * Zeigt einen Button an, wenn der Benutzer nach unten scrollt,
 * und scrollt die Seite sanft nach oben, wenn der Button geklickt wird.
 */

// Hauptfunktion zum Initialisieren der Scroll-to-top Funktionalität
export function initScrollToTop() {
  // Den Button abrufen
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  
  if (!scrollToTopBtn) {
    console.error('Scroll-to-top Button nicht gefunden.');
    return;
  }
  
  // Schwellenwert für das Anzeigen des Buttons (in Pixeln)
  const scrollThreshold = 300;
  
  // Event-Listener für das Scrollen
  window.addEventListener('scroll', () => {
    // Prüfen, ob der Benutzer weiter als den Schwellenwert gescrollt hat
    if (window.scrollY > scrollThreshold) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });
  
  // Event-Listener für den Button-Klick
  scrollToTopBtn.addEventListener('click', () => {
    // Sanft zum Seitenanfang scrollen
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  console.log('Scroll-to-top Funktionalität initialisiert.');
}

// Automatisch initialisieren, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initScrollToTop); 