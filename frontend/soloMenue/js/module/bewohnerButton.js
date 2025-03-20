/**
 * Module für die Verwaltung und Anpassung der Bewohner-Buttons/Karten
 */

/**
 * Ermittelt die breiteste Bewohner-Karte und setzt diese Breite für alle Karten
 */
function setzeEinheitlicheBreite() {
    // Alle Bewohner-Karten auswählen
    const bewohnerKarten = document.querySelectorAll('.bewohner-card');
    
    if (bewohnerKarten.length === 0) return;
    
    // Ursprüngliches CSS zurücksetzen, damit die natürliche Breite berechnet werden kann
    bewohnerKarten.forEach(karte => {
        karte.style.width = 'auto';
    });
    
    // Kurze Verzögerung, um sicherzustellen, dass das DOM aktualisiert ist
    setTimeout(() => {
        let maxBreite = 0;
        
        // Die breiteste Karte finden
        bewohnerKarten.forEach(karte => {
            const kartenBreite = karte.getBoundingClientRect().width;
            maxBreite = Math.max(maxBreite, kartenBreite);
        });
        
        // Mindestbreite sicherstellen (falls die Karten sehr kurze Namen haben)
        maxBreite = Math.max(maxBreite, 120);
        
        // Die ermittelte Breite auf alle Karten anwenden (plus ein kleiner Puffer)
        bewohnerKarten.forEach(karte => {
            karte.style.width = `${maxBreite + 10}px`;
            karte.style.boxSizing = 'border-box';
        });
        
        console.log(`Einheitliche Kartenbreite gesetzt: ${maxBreite + 10}px`);
    }, 50);
}

/**
 * Event-Listener für den Fall, dass neue Bewohner-Karten hinzugefügt werden
 */
function beobachteBewohnerContainer() {
    // MutationObserver für Änderungen am Bewohner-Container
    const bewohnerContainer = document.getElementById('bewohner-container');
    
    if (!bewohnerContainer) return;
    
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Wenn neue Kinder hinzugefügt wurden, die Breite anpassen
                setzeEinheitlicheBreite();
                break;
            }
        }
    });
    
    // Beobachter starten
    observer.observe(bewohnerContainer, { childList: true });
}

/**
 * Initialisiert das Modul
 */
function initialisiere() {
    // Beobachter für Änderungen am Bewohner-Container starten
    beobachteBewohnerContainer();
    
    // Event-Listener für Fenstergröße, um bei Größenänderungen die Breite anzupassen
    window.addEventListener('resize', setzeEinheitlicheBreite);
    
    // Event-Listener für bewohnerListUpdated-Event
    document.addEventListener('bewohnerListUpdated', () => {
        console.log('Bewohnerliste aktualisiert, passe Kartenbreite an');
        setzeEinheitlicheBreite();
    });
    
    // Nach kurzem Delay erstmals ausführen (um sicherzustellen, dass die Karten geladen sind)
    setTimeout(setzeEinheitlicheBreite, 300);
}

// Exportieren der Funktionen
export {
    initialisiere,
    setzeEinheitlicheBreite
};
