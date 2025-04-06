/**
 * Erstellt eine Bewohnerkarte im Design der SoloNew-Anwendung
 * @param {Object} bewohner - Bewohnerdaten
 * @returns {HTMLElement} - Die erstellte Bewohnerkarte
 */
function erstelleBewohnerKarte(bewohner) {
    // Hauptcontainer
    const card = document.createElement('div');
    card.className = 'bewohner-card';
    card.setAttribute('data-bewohner-id', bewohner.id || '');
    
    // Header 
    const cardHeader = document.createElement('div');
    cardHeader.className = 'bewohner-card-header';
    
    // Body
    const cardBody = document.createElement('div');
    cardBody.className = 'bewohner-card-body';
    
    // Bewohner-Info mit Bild und Name
    const bewohnerInfo = document.createElement('div');
    bewohnerInfo.className = 'bewohner-info';
    
    // Textinfo
    const textInfo = document.createElement('div');
    
    // Name
    const name = document.createElement('h5');
    name.className = 'bewohner-name';
    name.textContent = `${bewohner.firstName} ${bewohner.lastName}`;
    
    // Zimmer
    const zimmer = document.createElement('p');
    zimmer.className = 'bewohner-zimmer';
    zimmer.textContent = bewohner.zimmer || (bewohner.areas && bewohner.areas['Zimmer'] ? bewohner.areas['Zimmer'] : 'Kein Zimmer');
    
    textInfo.appendChild(name);
    textInfo.appendChild(zimmer);
    
    // Bild
    const img = document.createElement('img');
    img.className = 'bewohner-card-img';
    img.src = 'img/person.png';
    img.alt = `${bewohner.firstName} ${bewohner.lastName}`;
    
    // Hier die Reihenfolge ändern: Erst Text, dann Bild
    bewohnerInfo.appendChild(textInfo);
    bewohnerInfo.appendChild(img);
    
    // Sonderwünsche, falls vorhanden
    if (bewohner.sonderwuensche && bewohner.sonderwuensche.length > 0) {
        const sonderwuenscheContainer = document.createElement('div');
        sonderwuenscheContainer.className = 'sonderwuensche-liste';
        
        bewohner.sonderwuensche.forEach(wunsch => {
            const tag = document.createElement('span');
            tag.className = 'sonderwunsch-tag';
            tag.textContent = wunsch;
            sonderwuenscheContainer.appendChild(tag);
        });
        
        cardBody.appendChild(sonderwuenscheContainer);
    }
    
    // Details-Button
    const detailsButton = document.createElement('button');
    detailsButton.className = 'details-button';
    detailsButton.textContent = 'Details';
    detailsButton.setAttribute('data-i18n-key', 'buttons.details');
    
    // Event-Handler
    card.addEventListener('click', (event) => {
        if (!event.target.closest('.details-button')) {
            // Klick auf die Karte selbst - lädt das Menü der Person
            console.log(`Lade Menü für ${bewohner.firstName} ${bewohner.lastName}`);
            // Hier den Code für das Laden des Menüs einfügen
        }
    });
    
    detailsButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Verhindert, dass das Event an die Karte weitergegeben wird
        console.log(`Öffne Bearbeitungs-Panel für ${bewohner.firstName} ${bewohner.lastName}`);
        // Hier den Code für das Öffnen des Bearbeitungs-Panels einfügen
    });
    
    // Alles zusammenfügen
    cardBody.insertBefore(bewohnerInfo, cardBody.firstChild);
    cardBody.appendChild(detailsButton);
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    
    return card;
}

// Exportiere die Funktion, falls Module verwendet werden
export { erstelleBewohnerKarte }; 