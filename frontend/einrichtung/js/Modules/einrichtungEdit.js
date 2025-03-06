import { openModal } from "./modal.js";
import { showToast } from "./toast.js";
import { setupSpeiseangebot } from "./speiseangebot.js";
import { updateGesamtPersonenanzahl, setupGruppeSlider } from "./gruppen.js";
import config from '../../../js/config.js';

const API_BASE_URL = config.API_ENDPOINT;

// Funktion zur Navigation zwischen den Schritten
function navigateStep(direction) {
    // Aktuelle Anzeige ausblenden
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (currentStepElement) {
        currentStepElement.style.display = 'none';
    }
    
    // Nächsten/vorherigen Schritt berechnen
    currentStep += direction;
    
    // Sicherstellen, dass wir in den erlaubten Grenzen bleiben
    if (currentStep < 1) currentStep = 1;
    if (currentStep > 4) currentStep = 4;
    
    // Definierte Reihenfolge der Schritte
    const stepOrder = {
        1: "Grunddaten",
        2: "Personengruppe & Tour",
        3: "Speiseangebot",
        4: "Gruppenverwaltung"
    };
    
    // Nächsten Schritt anzeigen
    const nextStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (nextStepElement) {
        nextStepElement.style.display = 'block';
        console.log(`Navigiere zu Schritt ${currentStep}: ${stepOrder[currentStep]}`); // Debug-Log
    }

    updateNavigationButtons();
}

// Funktion zur Aktualisierung der Navigationsbuttons
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevStep');
    const nextButton = document.getElementById('nextStep');
    const submitButton = document.getElementById('submitForm');

    if (prevButton) {
        prevButton.style.display = currentStep > 1 ? 'block' : 'none';
    }
    
    if (nextButton) {
        nextButton.style.display = currentStep < 4 ? 'block' : 'none';
    }
    
    if (submitButton) {
        submitButton.style.display = currentStep === 4 ? 'block' : 'none';
    }

    // Debug-Log für den aktuellen Zustand
    console.log('Navigation Status:', {
        currentStep,
        prevVisible: currentStep > 1,
        nextVisible: currentStep < 4,
        submitVisible: currentStep === 4
    });
}

function resetModalNavigation() {
    // Navigation zurücksetzen
    currentStep = 1;
    
    // Alle Schritte ausblenden
    document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Ersten Schritt anzeigen
    const firstStep = document.querySelector('.form-step[data-step="1"]');
    if (firstStep) {
        firstStep.style.display = 'block';
    }
    
    // Navigationsbuttons zurücksetzen
    const prevButton = document.getElementById('prevStep');
    const nextButton = document.getElementById('nextStep');
    const submitButton = document.getElementById('submitForm');
    
    if (prevButton) prevButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'block';
    if (submitButton) submitButton.style.display = 'none';
    
    setupSpeiseangebot();
    console.log('Navigation zurückgesetzt'); // Debug-Log
}

export async function editEinrichtung(fileId, displayName) {
    try {
        console.log('Bearbeite Einrichtung:', { fileId, displayName });
        
        openModal();
        resetModalNavigation();
        
        // Explizit zum ersten Schritt wechseln
        const allSteps = document.querySelectorAll('.form-step');
        allSteps.forEach(step => step.style.display = 'none');
        
        const firstStep = document.querySelector('.form-step[data-step="1"]');
        if (firstStep) {
            firstStep.style.display = 'block';
            updateNavigationButtons(1);
        }

        // Dann die Daten laden
        const response = await fetch(`${API_BASE_URL}/einrichtungen/${fileId}`);

        
        if (!response.ok) {
            throw new Error('Einrichtung nicht gefunden');
        }
        
        const einrichtung = await response.json();
        console.log('Geladene Einrichtungsdaten:', einrichtung);
        
        if (!einrichtung) {
            throw new Error('Keine Daten erhalten');
        }

        // Formular mit den Daten füllen
        const form = document.getElementById('einrichtungsForm');
        if (!form) {
            throw new Error('Formular nicht gefunden');
        }

        // Sicheres Setzen der Formularwerte
        const setFormValue = (fieldName, value) => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.value = value || '';
            }
        };

        // Formularfelder befüllen
        setFormValue('name', einrichtung.name);
        setFormValue('kuerzel', einrichtung.kuerzel);
        setFormValue('adresse', einrichtung.adresse);
        setFormValue('ansprechperson', einrichtung.ansprechperson);
        setFormValue('telefon', einrichtung.telefon);
        setFormValue('email', einrichtung.email);
        setFormValue('personengruppe', einrichtung.personengruppe);

        // Personengruppe-Buttons setzen
        const personengruppeButtons = document.querySelectorAll('.personengruppe-btn');
        personengruppeButtons.forEach(button => {
            button.classList.remove('active');
            if (button.textContent === einrichtung.personengruppe) {
                button.classList.add('active');
            }
        });

        // Tour-Buttons setzen
        if (einrichtung.tour) {
            console.log('Setze Tour:', einrichtung.tour); // Debug-Log
            const tourButtons = document.querySelectorAll('.tour-btn');
            const tourInput = form.querySelector('input[name="tour"]');
            
            // Setze zuerst den Tour-Input-Wert
            if (tourInput) {
                tourInput.value = einrichtung.tour;
                console.log('Tour-Input gesetzt auf:', tourInput.value); // Debug-Log
            }
            
            tourButtons.forEach(button => {
                button.classList.remove('active');
                const buttonTourNr = button.textContent.match(/Tour (\d+)/)?.[1];
                const savedTourNr = einrichtung.tour.toString();
                
                if (buttonTourNr === savedTourNr) {
                    button.classList.add('active');
                    
                    // Event simulieren um sicherzustellen, dass alle Event-Handler ausgeführt werden
                    button.click();
                }
            });
        }

        // Speiseangebot und Gruppen setzen
        setupSpeiseangebot();
        
        setTimeout(() => {
            // Speiseangebot setzen
            if (einrichtung.speiseangebot && Array.isArray(einrichtung.speiseangebot)) {
                einrichtung.speiseangebot.forEach(tagData => {
                    const container = Array.from(document.querySelectorAll('.tag-container'))
                        .find(cont => cont.querySelector('.tag-name').textContent === tagData.tag);
                    
                    if (container) {
                        const setCheckbox = (selector, value) => {
                            const checkbox = container.querySelector(selector);
                            if (checkbox) checkbox.checked = value;
                        };

                        setCheckbox('.master-option', tagData.alleOptionen);
                        setCheckbox('.speise-option[data-type="suppe"]', tagData.suppe);
                        setCheckbox('.speise-option[data-type="hauptspeise"]', tagData.hauptspeise);
                        setCheckbox('.speise-option[data-type="dessert"]', tagData.dessert);
                    }
                });
            }

            // Gruppen setzen
            const gruppenListe = document.getElementById('gruppenListe');
            if (gruppenListe && einrichtung.gruppen && Array.isArray(einrichtung.gruppen)) {
                gruppenListe.innerHTML = '';
                einrichtung.gruppen.forEach(gruppe => {
                    const gruppeDiv = document.createElement('div');
                    gruppeDiv.className = 'gruppe-item';
                    gruppeDiv.innerHTML = `
                        <div class="gruppe-details">
                            <strong>${gruppe.name}</strong>
                            <div class="personen-slider">
                                <input type="range" 
                                       min="0" 
                                       max="100" 
                                       value="${gruppe.anzahl}" 
                                       class="gruppe-personen-slider">
                                <span class="personen-anzahl">${gruppe.anzahl}</span> Personen
                            </div>
                            <input type="hidden" name="gruppenDaten[]" value='{"name":"${gruppe.name}", "anzahl":${gruppe.anzahl}}'>
                        </div>
                        <button type="button" class="delete-btn">Löschen</button>
                    `;
                    
                    setupGruppeSlider(gruppeDiv, gruppe.name);
                    
                    const deleteBtn = gruppeDiv.querySelector('.delete-btn');
                    deleteBtn.addEventListener('click', function() {
                        gruppeDiv.remove();
                        updateGesamtPersonenanzahl();
                    });
                    
                    gruppenListe.appendChild(gruppeDiv);
                });
            }

            // Gesamtanzahl aktualisieren
            const gesamtAnzahl = updateGesamtPersonenanzahl();
            const display = document.getElementById('gesamtPersonenanzahlDisplay');
            if (display) {
                display.textContent = einrichtung.gesamtPersonenanzahl || gesamtAnzahl;
            }
        }, 100);

        // Formular für Update vorbereiten
        form.dataset.mode = 'edit';
        form.dataset.fileId = fileId;
        form.dataset.originalName = einrichtung.name;

    } catch (error) {
        console.error('Fehler beim Laden der Einrichtung:', error);
        showToast('Fehler beim Laden der Einrichtung: ' + error.message);
    }
} 

// Funktion zum Handhaben des Formular-Submit-Events
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    
    // Überprüfe das Select-Element für Personengruppe
    const personengruppeSelect = form.querySelector('select[name="personengruppe"]');
    if (!personengruppeSelect.value) {
        showToast('Bitte wählen Sie eine Personengruppe aus');
        personengruppeSelect.focus();
        return;
    }
    
    // Validiere Gruppen
    const gruppen = getGruppenData();
    if (!gruppen) {
        return; // Abbruch wenn Gruppen ungültig sind
    }
    
    const formData = new FormData(form);
    const gesamtPersonenanzahl = updateGesamtPersonenanzahl();

    const einrichtungData = {
        name: formData.get('name')?.trim() || '',
        kuerzel: formData.get('kuerzel') || '',
        adresse: formData.get('adresse') || '',
        ansprechperson: formData.get('ansprechperson') || '',
        telefon: formData.get('telefon') || '',
        email: formData.get('email') || '',
        personengruppe: personengruppeSelect.value,
        tour: formData.get('tour') || '', // Tour-Wert hinzufügen
        gesamtPersonenanzahl: gesamtPersonenanzahl,
        speiseangebot: getSpeiseangebotData() || [],
        gruppen: gruppen
    };

    // Validierung der Pflichtfelder
    if (!einrichtungData.name) {
        showToast('Bitte geben Sie einen Namen ein');
        return;
    }

    const isEdit = form.dataset.mode === 'edit';
    const fileId = form.dataset.fileId;
    const url = fileId 
        ? `${API_BASE_URL}/einrichtungen/${fileId}`
        : `${API_BASE_URL}/einrichtungen`;

    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(einrichtungData)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern der Einrichtung');
        }

        showToast('Daten erfolgreich gespeichert');
        closeModal();
        await loadEinrichtungen();
    } catch (error) {
        console.error('Fehler:', error);
        showToast('Fehler: ' + error.message);
    }
} 

// Funktion zum Einrichten der Gruppenverwaltung
function setupGruppenVerwaltung() {
    const formStep4 = document.querySelector('.form-step[data-step="4"]');
    if (!formStep4) return;

    // Bestehende Elemente finden
    const gruppenListe = formStep4.querySelector('#gruppenListe');
    const gruppenInput = formStep4.querySelector('.gruppe-input');
    const gesamtpersonen = formStep4.querySelector('.gesamtpersonen');

    // Elemente in der richtigen Reihenfolge neu anordnen
    if (gruppenListe && gruppenInput && gesamtpersonen) {
        // Temporär Elemente entfernen
        gruppenListe.remove();
        gruppenInput.remove();
        gesamtpersonen.remove();

        // In der richtigen Reihenfolge wieder einfügen
        formStep4.appendChild(gruppenInput);
        formStep4.appendChild(gruppenListe);
        formStep4.appendChild(gesamtpersonen);
    }

    // Event Listener für Gruppe hinzufügen
    const addButton = document.getElementById('gruppeHinzufuegen');
    const nameInput = document.getElementById('gruppenName');

    if (addButton && nameInput) {
        addButton.addEventListener('click', () => {
            const gruppenName = nameInput.value.trim();
            if (gruppenName) {
                addGruppe(gruppenName);
                nameInput.value = '';
            }
        });

        // Enter-Taste im Input-Feld
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addButton.click();
            }
        });
    }
}

// Diese Funktion beim Laden der Seite aufrufen
document.addEventListener('DOMContentLoaded', function() {
    setupGruppenVerwaltung();
}); 

// Einheitliche Funktion zum Hinzufügen einer Gruppe
function addGruppe(gruppenName) {
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
        <button type="button" class="delete-btn" onclick="removeGruppe(this)">Löschen</button>
    `;

    setupGruppeSlider(gruppeDiv, gruppenName);
    gruppenListe.appendChild(gruppeDiv);
} 