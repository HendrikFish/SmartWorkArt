/**
 * PanelStruktur.js
 * Modul für die Erstellung und Verwaltung der Panel-Struktur im DOM
 */

/**
 * Erstellt das Panel im DOM, falls es noch nicht existiert
 * @param {Function} schliesseFunktion - Funktion zum Schließen des Panels
 * @returns {HTMLElement} Das Panel-Element
 */
function erstellePanel(schliesseFunktion) {
    // Prüfen, ob das Panel bereits existiert
    let panel = document.getElementById('bearbeitungs-panel');
    if (panel) return panel;

    // Overlay für Hintergrund erstellen
    const overlay = document.createElement('div');
    overlay.id = 'panel-overlay';
    overlay.classList.add('overlay');
    overlay.addEventListener('click', schliesseFunktion);
    document.body.appendChild(overlay);

    // Panel erstellen
    panel = document.createElement('div');
    panel.id = 'bearbeitungs-panel';
    panel.classList.add('panel');

    // Panel-Header
    const panelHeader = document.createElement('div');
    panelHeader.classList.add('panel-header');

    const panelTitle = document.createElement('div');
    panelTitle.classList.add('panel-title');
    panelTitle.textContent = 'Bewohnerdetails';

    const closeButton = document.createElement('button');
    closeButton.classList.add('close-panel');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', schliesseFunktion);

    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(closeButton);

    // Panel-Content
    const panelContent = document.createElement('div');
    panelContent.classList.add('panel-content');
    panelContent.id = 'bewohner-details';

    panel.appendChild(panelHeader);
    panel.appendChild(panelContent);
    document.body.appendChild(panel);

    return panel;
}

/**
 * Zeigt das Panel an
 * @param {HTMLElement} panel - Das Panel-Element
 */
function zeigePanel(panel) {
    if (!panel) return;
    
    panel.classList.add('active');
    const overlay = document.getElementById('panel-overlay');
    if (overlay) overlay.classList.add('active');
}

/**
 * Verbirgt das Panel
 * @param {HTMLElement} panel - Das Panel-Element
 */
function verbergePanel(panel) {
    if (!panel) return;
    
    panel.classList.remove('active');
    const overlay = document.getElementById('panel-overlay');
    if (overlay) overlay.classList.remove('active');
}

/**
 * Initialisiert das Modul
 * @param {Function} schliesseFunktion - Funktion zum Schließen des Panels
 */
function initialisiere(schliesseFunktion) {
    // Panel erstellen, aber noch nicht anzeigen
    erstellePanel(schliesseFunktion);
    
    // Event-Listener für Tastatureingaben (ESC zum Schließen)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            schliesseFunktion();
        }
    });
    
    console.log('PanelStruktur-Modul initialisiert');
}

// Modul exportieren
export {
    initialisiere,
    erstellePanel,
    zeigePanel,
    verbergePanel
}; 