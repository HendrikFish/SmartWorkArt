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

/**
 * Modul für die Erstellung und Verwaltung der Bewohner-Buttons
 */

// Setzt eine einheitliche Kartenbreite für alle Bewohner-Karten
function setzeEinheitlicheKartenbreite() {
    const bewohnerKarten = document.querySelectorAll('.bewohner-card');
    if (bewohnerKarten.length === 0) return;

    // Maximale Breite finden
    let maxBreite = 0;
    bewohnerKarten.forEach(karte => {
        const breite = karte.offsetWidth;
        if (breite > maxBreite) maxBreite = breite;
    });

    // Alle Karten auf die maximale Breite setzen
    bewohnerKarten.forEach(karte => {
        karte.style.width = `${maxBreite}px`;
    });
}

/**
 * Erstellt eine Bewohner-Karte mit Infos und Aktionsbuttons
 * @param {Object} bewohner - Das Bewohnerobjekt
 * @param {string} bereich - Der Bereich/Etage des Bewohners
 * @param {Function} onClick - Die Funktion, die bei Klick auf die Karte ausgeführt wird
 * @returns {HTMLElement} Die erstellte Bewohner-Karte
 */
function erstelleBewohnerKarte(bewohner, bereich, onClick) {
    const card = document.createElement('div');
    card.className = 'bewohner-card';
    card.dataset.bewohnerId = `${bewohner.firstName.trim()}_${bewohner.lastName.trim()}`;
    
    // Karteninhalt: Name und Bereich
    const cardContent = document.createElement('div');
    cardContent.className = 'bewohner-info';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'bewohner-name';
    nameElement.textContent = `${bewohner.firstName} ${bewohner.lastName}`;
    
    const bereichElement = document.createElement('div');
    bereichElement.className = 'bewohner-bereich';
    bereichElement.textContent = bereich;
    
    cardContent.appendChild(nameElement);
    cardContent.appendChild(bereichElement);
    
    // Aktions-Buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'bewohner-actions';
    
    // Button zum Auswählen des Bewohners für Menüplan
    const selectButton = document.createElement('button');
    selectButton.className = 'bewohner-action-btn';
    selectButton.title = 'Bewohner für Menüplan auswählen';
    selectButton.innerHTML = '<span class="icon-select">☰</span>';
    selectButton.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(bewohner);
    });
    
    // Button zum Bearbeiten der Bewohnerdaten
    const editButton = document.createElement('button');
    editButton.className = 'bewohner-action-btn';
    editButton.title = 'Bewohnerdaten anzeigen';
    editButton.innerHTML = '<span class="icon-edit">ℹ️</span>';
    editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Event auslösen, um Bewohnerinformationen anzuzeigen
        const event = new CustomEvent('bewohnerSelected', {
            detail: { bewohner }
        });
        document.dispatchEvent(event);
    });
    
    // Neuer Button zum Aktualisieren der Bewohnerdaten
    const updateButton = document.createElement('button');
    updateButton.className = 'btn btn-success bewohner-update-btn';
    updateButton.title = 'Bewohnerdaten aktualisieren';
    updateButton.innerHTML = '<span>Speichern</span>';
    updateButton.dataset.bewohnerId = `${bewohner.firstName.trim()}_${bewohner.lastName.trim()}`;
    
    // Buttons zum Container hinzufügen
    actionButtons.appendChild(selectButton);
    actionButtons.appendChild(editButton);
    actionButtons.appendChild(updateButton);
    
    // Alles zur Karte hinzufügen
    card.appendChild(cardContent);
    card.appendChild(actionButtons);
    
    // Event-Listener für Klick auf die Karte
    card.addEventListener('click', () => onClick(bewohner));
    
    return card;
}

// Exportieren der Funktionen
export {
    initialisiere,
    setzeEinheitlicheBreite,
    setzeEinheitlicheKartenbreite,
    erstelleBewohnerKarte
};
