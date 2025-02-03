// public/js/modules/gruppen.js
import { showToast } from "./toast.js";

// Funktion zum Einrichten des Sliders für eine Gruppe
export function setupGruppeSlider(gruppeDiv, gruppenName) {
    const slider = gruppeDiv.querySelector('.gruppe-personen-slider');
    const anzahlDisplay = gruppeDiv.querySelector('.personen-anzahl');
    const hiddenInput = gruppeDiv.querySelector('input[name="gruppenDaten[]"]');

    slider.addEventListener('input', () => {
        anzahlDisplay.textContent = slider.value;
        const data = JSON.parse(hiddenInput.value);
        data.anzahl = parseInt(slider.value);
        hiddenInput.value = JSON.stringify(data);
        updateGesamtPersonenanzahl();
    });
}

// Funktion zur Aktualisierung der Gesamtpersonenanzahl
export function updateGesamtPersonenanzahl() {
    let gesamt = 0;
    document.querySelectorAll('.gruppe-personen-slider').forEach(slider => {
        gesamt += parseInt(slider.value) || 0;
    });
    
    const display = document.getElementById('gesamtPersonenanzahlDisplay');
    if (display) {
        display.textContent = gesamt;
    }
    
    const gesamtInput = document.getElementById('gesamtPersonenanzahl');
    if (gesamtInput) {
        gesamtInput.value = gesamt;
    }
    
    return gesamt;
}

// Funktion zum Hinzufügen einer Gruppe
export function addGruppe(gruppenName) {
    if (!gruppenName) {
        showToast('Bitte geben Sie einen Gruppennamen ein');
        return;
    }
    
    // Prüfe ob der Gruppenname bereits existiert
    const existingGroups = document.querySelectorAll('.gruppe-item');
    for (let group of existingGroups) {
        const existingName = group.querySelector('strong').textContent;
        if (existingName.toLowerCase() === gruppenName.toLowerCase()) {
            showToast('Eine Gruppe mit diesem Namen existiert bereits');
            return;
        }
    }
    
    const gruppenListe = document.getElementById('gruppenListe');
    const gruppeDiv = document.createElement('div');
    gruppeDiv.className = 'gruppe-item';
    gruppeDiv.innerHTML = `
        <div class="gruppe-details">
            <strong>${gruppenName}</strong>
            <div class="personen-slider">
                <input type="range" 
                       min="0" 
                       max="100" 
                       value="0" 
                       class="gruppe-personen-slider">
                <span class="personen-anzahl">0</span> Personen
            </div>
            <input type="hidden" name="gruppenDaten[]" value='{"name":"${gruppenName}", "anzahl":0}'>
        </div>
        <button type="button" class="delete-btn">Löschen</button>
    `;

    setupGruppeSlider(gruppeDiv, gruppenName);
    
    // Event Listener für den Löschen-Button
    const deleteBtn = gruppeDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        gruppeDiv.remove();
        updateGesamtPersonenanzahl();
    });
    
    gruppenListe.appendChild(gruppeDiv);
}

// Funktion zur Verwaltung der Gruppen
export function setupGruppenVerwaltung() {
    const gruppenListe = document.getElementById('gruppenListe');
    const gruppenInput = document.getElementById('gruppenName');
    const addButton = document.getElementById('gruppeHinzufuegen');

    if (!gruppenListe || !gruppenInput || !addButton) return;

    addButton.addEventListener('click', () => {
        const gruppenName = gruppenInput.value.trim();
        if (gruppenName) {
            addGruppe(gruppenName);
            gruppenInput.value = '';
        }
    });
}

// Funktion zum Sammeln der Gruppendaten mit Validierung
export function getGruppenData() {
    const gruppen = [];
    let hasEmptyGroups = false;
    
    document.querySelectorAll('.gruppe-item').forEach(gruppeDiv => {
        const hiddenInput = gruppeDiv.querySelector('input[name="gruppenDaten[]"]');
        if (hiddenInput.value) {
            try {
                const data = JSON.parse(hiddenInput.value);
                if (data.anzahl === 0) {
                    hasEmptyGroups = true;
                    const gruppenName = gruppeDiv.querySelector('strong').textContent;
                    showToast(`Die Gruppe "${gruppenName}" hat keine Personen`);
                }
                gruppen.push(data);
            } catch (e) {
                console.error('Ungültiges JSON in gruppenDaten:', hiddenInput.value);
            }
        }
    });
    
    if (hasEmptyGroups) {
        return null;
    }
    
    return gruppen;
}
