// Panel-spezifische Event-Handler und Funktionen
export function initializePanelHandling() {
    console.log('Initializing panel handling...');
    
    // Füge CSS-Regeln für die z-index Hierarchie hinzu
    const style = document.createElement('style');
    style.textContent = `
        #mealTable {
            position: relative;
            z-index: 1;
        }
        .panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
            pointer-events: auto;
            display: none;
        }
        .panel-overlay.show {
            display: block;
        }
      
        

         
        
    `;
    document.head.appendChild(style);

    // Erstelle den Overlay einmalig
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.id = 'panel-overlay';
    document.body.appendChild(overlay);
    console.log('Overlay created:', overlay);

    // Globaler Click-Handler für das Schließen der Panels
    document.addEventListener('click', (e) => {
        // Wenn der Klick innerhalb eines Sub-Button-Menüs oder auf den Meal-Options-Button erfolgt
        const clickedSubButtons = e.target.closest('.sub-buttons');
        const clickedMealOptionsBtn = e.target.closest('.meal-options-btn');
        const clickedSubButton = e.target.closest('.sub-button');

        if (clickedSubButton) {
            // Erlaube Klicks auf Sub-Buttons
            e.stopPropagation();
            return;
        }

        if (clickedSubButtons || clickedMealOptionsBtn) {
            return;
        }

        // Schließe alle offenen Panels
        closeAllPanels();
        hideOverlay();
    });

    // Click-Handler für Meal-Options-Buttons
    document.querySelectorAll('.meal-options-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const fabContainer = button.closest('.fab-container');
            if (fabContainer) {
                const wasActive = fabContainer.classList.contains('active');
                
                // Schließe zuerst alle anderen Panels
                document.querySelectorAll('.fab-container.active').forEach(container => {
                    if (container !== fabContainer) {
                        container.classList.remove('active');
                    }
                });

                // Toggle das aktuelle Panel
                fabContainer.classList.toggle('active');

                // Zeige oder verstecke das Overlay entsprechend
                if (!wasActive) {
                    showOverlay();
                } else {
                    hideOverlay();
                }
            }
        });
    });

    // Click-Handler für den Overlay
    overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeAllPanels();
        hideOverlay();
    });
}

function showOverlay() {
    console.log('Showing overlay...');
    const overlay = document.getElementById('panel-overlay');
    if (overlay) {
        overlay.classList.add('show');
        // Erlaube Interaktionen mit dem Panel und seinen Buttons
        document.querySelectorAll('.fab-container.active, .fab-container.active .sub-buttons, .fab-container.active .sub-button').forEach(element => {
            element.style.pointerEvents = 'auto';
        });
        // Verhindere Interaktionen nur mit dem Hintergrund
        const mealTable = document.getElementById('mealTable');
        if (mealTable) {
            mealTable.style.pointerEvents = 'none';
        }
        overlay.style.pointerEvents = 'auto';
    }
}

function hideOverlay() {
    console.log('Hiding overlay...');
    const overlay = document.getElementById('panel-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        // Stelle normale Interaktionen wieder her
        const mealTable = document.getElementById('mealTable');
        if (mealTable) {
            mealTable.style.pointerEvents = 'auto';
        }
        document.querySelectorAll('.fab-container, .sub-buttons, .sub-button').forEach(element => {
            element.style.pointerEvents = 'auto';
        });
    }
}

export function closeAllPanels() {
    console.log('Closing all panels');
    document.querySelectorAll('.fab-container.active').forEach(panel => {
        panel.classList.remove('active');
    });
    hideOverlay();
}

// Diese Funktionen werden für die Kompatibilität beibehalten
export function togglePanel(panel) {
    const wasActive = panel.classList.contains('active');
    closeAllPanels();
    if (!wasActive) {
        panel.classList.add('active');
        showOverlay();
        
        // Neue Funktion: Prüfe, ob es sich um eine Extra-Kategorie handelt
        const isExtraCategory = panel.closest('.extra-category-row');
        if (isExtraCategory) {
            positionExtraCategorySubButtons(panel);
        }
    }
}

// Neue Funktion für die Positionierung der Sub-Buttons in Extra-Kategorie-Zeilen
function positionExtraCategorySubButtons(fabContainer) {
    const subButtons = fabContainer.querySelector('.sub-buttons');
    if (!subButtons) return;
    
    console.log('Positioniere Sub-Buttons für Extra-Kategorie');
    
    // Ursprüngliche Positionierung, aber mit besserer Sichtbarkeit
    subButtons.style.position = 'absolute';
    subButtons.style.top = '-6px';
    subButtons.style.right = '20px';
    subButtons.style.backgroundColor = 'white';
    subButtons.style.padding = '12px';
    subButtons.style.borderRadius = '12px';
    subButtons.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
    subButtons.style.minWidth = '100px';
    subButtons.style.zIndex = '9999';
    subButtons.style.overflow = 'visible';
    
    // Die Sub-Buttons-Row Dimensionen und Ausrichtung anpassen
    const subButtonsRow = subButtons.querySelector('.sub-buttons-row');
    if (subButtonsRow) {
        subButtonsRow.style.display = 'flex';
        subButtonsRow.style.flexDirection = 'row';
        subButtonsRow.style.justifyContent = 'space-around';
        subButtonsRow.style.gap = '8px';
        subButtonsRow.style.width = 'auto';
        subButtonsRow.style.padding = '0';
    }
    
    // Styles für die Buttons setzen
    const buttons = subButtons.querySelectorAll('.sub-button');
    buttons.forEach(button => {
        button.style.zIndex = '9999';
        button.style.pointerEvents = 'auto';
    });
    
    // Event-Listener zum Positionieren der Container beim Klick
    buttons.forEach(button => {
        // Entferne alten Event-Listener
        button.removeEventListener('click', positionContainers);
        // Füge neuen hinzu
        button.addEventListener('click', positionContainers);
    });
    
    // Funktion zum Positionieren der Container unterhalb des Panels
    function positionContainers() {
        setTimeout(() => {
            // Neue Positionen berechnen
            const subButtonsRect = subButtons.getBoundingClientRect();
            
            // Finde alle Container
            const containers = [
                subButtons.querySelector('.components-container'),
                subButtons.querySelector('.alternatives-container'),
                subButtons.querySelector('.comment-dialog')
            ];
            
            // Für jeden gefundenen Container die Position setzen
            containers.forEach(container => {
                if (container) {
                    // Sicherstellen, dass der Container Teil des DOM ist
                    if (!subButtons.contains(container)) {
                        subButtons.appendChild(container);
                    }
                    
                    // Mittige Positionierung unter dem Panel
                    container.style.position = 'absolute';
                    container.style.top = '100%';
                    
                    // Berechne die Mitte des Panels
                    const buttonWidth = subButtons.offsetWidth;
                    const containerWidth = 220; // Fixe Breite des Containers
                    const leftOffset = (buttonWidth - containerWidth) / 2;
                    
                    // Stelle sicher, dass der Container nicht über den linken Rand hinausragt
                    const left = Math.max(0, leftOffset);
                    container.style.left = left + 'px';
                    
                    container.style.marginTop = '8px';
                    container.style.zIndex = '9999';
                    container.style.width = '220px';
                    
                    console.log('Container positioniert:', container.className, 'left:', left);
                }
            });
        }, 50);
    }
}

export function keepPanelOpen(panel) {
    if (panel) {
        panel.classList.add('active');
        showOverlay();
        
        // Prüfe auch hier, ob es sich um eine Extra-Kategorie handelt
        const isExtraCategory = panel.closest('.extra-category-row');
        if (isExtraCategory) {
            positionExtraCategorySubButtons(panel);
        }
    }
} 