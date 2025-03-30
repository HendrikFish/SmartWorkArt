import { Toast, normalizeString } from './Module/module.js';
import { Modal } from './Module/modal.js';
import { SaveManager } from './Module/save.js';
import { FilterManager } from './Module/filter.js';
import { ConfigManager } from './Module/config.js';
import { OCRManager } from './Module/ocr.js';
import { UploadManager } from './Module/upload.js';
import { OCRModalManager } from './Module/ocr-modal.js';

// Bewohner-Verwaltung
export const ResidentManager = {
    async init() {
        try {
            await this.loadResidents();
        } catch (error) {
            console.error('Fehler beim Initialisieren:', error);
            Toast.show('Fehler beim Initialisieren', 'error');
        }
    },

    async loadResidents() {
        try {
            // Lade die Konfiguration
            const config = await ConfigManager.loadConfig();
            
            // Lade die Bewohner
            const response = await fetch('/api/solo/residents');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Bewohner');
            }
            const residents = await response.json();
            console.log('Geladene Bewohner:', residents); // Debug-Log
            
            // Zeige die Bewohner an
            await FilterManager.displayResidents(residents, config);
        } catch (error) {
            console.error('Fehler beim Laden der Bewohner:', error);
            Toast.show('Fehler beim Laden der Bewohner', 'error');
        }
    },

    async showResidentDetails(resident) {
        try {
            const config = await ConfigManager.loadConfig();
            const modal = document.getElementById('residentDetailModal');
            const content = modal.querySelector('.modal-content');
            
            content.innerHTML = `
                <div class="modal-header">
                    <h2>${resident.firstName} ${resident.lastName}</h2>
                    <button type="button" class="icon-btn close-modal"></button>
                </div>
                <div class="fields-container">
                    <div class="form-group">
                        <label>Geschlecht:</label>
                        <span>${resident.gender || 'Nicht angegeben'}</span>
                    </div>
                    ${config.fields?.map(field => `
                        <div class="form-group">
                            <label>${field.label}:</label>
                            <span>${resident[field.id] || 'Nicht angegeben'}</span>
                        </div>
                    `).join('') || ''}
                    ${config.areas?.map(area => `
                        <div class="form-group">
                            <label>${area.name}:</label>
                            <span>${resident.areas?.[area.name] || 'Nicht angegeben'}</span>
                        </div>
                    `).join('') || ''}
                </div>
                <div class="button-container">
                    <button type="button" class="danger-btn" id="dismissResidentBtn">Entlassen</button>
                </div>
            `;

            // Event Listener für den Entlassen-Button
            content.querySelector('#dismissResidentBtn').addEventListener('click', async () => {
                // Heutiges Datum im Format YYYY-MM-DD
                const today = new Date().toISOString().split('T')[0];
                
                // Formatiere das Datum für die Anzeige im Dialog (DD.MM.YYYY)
                const [year, month, day] = today.split('-');
                const formattedDate = `${day}.${month}.${year}`;
                
                if (confirm(`Möchten Sie diesen Bewohner wirklich entlassen?\n\nDas Todesdatum wird auf heute (${formattedDate}) gesetzt.`)) {
                    try {
                        const success = await SaveManager.dismissResident(resident);
                        if (success) {
                            // Modal schließen - doppelte Absicherung
                            Modal.hide('residentDetailModal');
                            // Kurz warten, um sicherzustellen, dass das Modal geschlossen ist
                            await new Promise(resolve => setTimeout(resolve, 300));
                            // Dann Liste neu laden
                            await this.loadResidents();
                            // Erfolgsmeldung
                            Toast.show('Bewohner erfolgreich entlassen', 'success');
                        }
                    } catch (error) {
                        console.error('Fehler beim Entlassen:', error);
                        Toast.show('Fehler beim Entlassen des Bewohners: ' + error.message, 'error');
                    }
                }
            });

            Modal.show('residentDetailModal');
        } catch (error) {
            console.error('Fehler beim Anzeigen der Bewohnerdetails:', error);
            Toast.show('Fehler beim Anzeigen der Bewohnerdetails', 'error');
        }
    }
};

// Form-Verwaltung
const FormManager = {
    resetForm() {
        const form = document.getElementById('newResidentFormContent');
        // Setze alle Input-Felder zurück
        form.querySelectorAll('input').forEach(input => {
            input.value = '';
        });
        
        // Setze alle Select-Felder zurück
        form.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        // Setze alle Textarea-Felder zurück
        form.querySelectorAll('textarea').forEach(textarea => {
            textarea.value = '';
        });
        
        // Entferne active-Klasse von allen Buttons
        form.querySelectorAll('.area-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Setze die dynamischen Felder zurück
        const dynamicFields = form.querySelector('#dynamicFields');
        const dynamicAreas = form.querySelector('#dynamicAreas');
        if (dynamicFields) dynamicFields.innerHTML = '';
        if (dynamicAreas) dynamicAreas.innerHTML = '';
        
        // Setze versteckte Felder zurück
        form.querySelectorAll('input[type="hidden"]').forEach(input => {
            input.value = '';
        });
    },

    async updateForm() {
        try {
            // Setze das Formular zurück
            this.resetForm();
            
            const config = await ConfigManager.loadConfig();
            const form = document.getElementById('newResidentFormContent');
            const dynamicFields = form.querySelector('#dynamicFields');
            const dynamicAreas = form.querySelector('#dynamicAreas');
            
            // Felder hinzufügen
            if (config && config.fields) {
                config.fields.forEach(field => {
                    if (!['firstName', 'lastName'].includes(field.id)) {
                        const fieldHtml = `
                            <div class="form-group ${field.required ? 'required-field' : ''}">
                                <label for="${field.id}">${field.label}</label>
                                <input type="${field.type}" 
                                       id="${field.id}" 
                                       name="${field.id}"
                                       ${field.required ? 'required' : ''}>
                            </div>
                        `;
                        dynamicFields.insertAdjacentHTML('beforeend', fieldHtml);
                    }
                });
            }

            // Bereiche hinzufügen
            if (config && config.areas) {
                dynamicAreas.innerHTML = ''; // Stelle sicher, dass dynamicAreas leer ist
                
                config.areas.forEach(area => {
                    // Bestimme den Wert für multiple basierend auf den verschiedenen möglichen Eigenschaften in der config
                    const isMultiple = area.multiple || area.allowMultiple || false;
                    
                    const areaHtml = `
                        <div class="area-buttons-group">
                            <h4>${area.name}</h4>
                            <div class="area-buttons" data-multiple="${isMultiple}">
                                ${area.buttons.map(btn => `
                                    <button type="button" 
                                            class="secondary-btn area-button" 
                                            data-area="${area.name}"
                                            data-value="${btn.label}">
                                        ${btn.label}
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" name="area_${area.name}" id="area_${area.name}">
                        </div>
                    `;
                    dynamicAreas.insertAdjacentHTML('beforeend', areaHtml);
                });
                
                // Füge Event-Listener für alle Bereichs-Buttons hinzu
                this.addButtonEventListeners(form);
            }

            // Event Listener für das Formular
            // Entferne zuerst bestehende Listener, um doppelte zu vermeiden
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Füge die Event-Listener für die Buttons erneut hinzu
            this.addButtonEventListeners(newForm);
            
            // Füge den Submit-Listener hinzu
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (await SaveManager.saveResident(new FormData(e.target), true)) {
                    await ResidentManager.loadResidents();
                }
            });

        } catch (error) {
            console.error('Fehler beim Aktualisieren des Formulars:', error);
            Toast.show('Fehler beim Aktualisieren des Formulars', 'error');
        }
    },
    
    // Neue Methode zum Hinzufügen von Button-Event-Listenern
    addButtonEventListeners(form) {
        console.log('Füge Event-Listener für Buttons hinzu...');
        
        // Event Listener für die Geschlechts-Buttons
        const genderGroup = form.querySelector('.gender-buttons-group .area-buttons');
        if (genderGroup) {
            const genderButtons = genderGroup.querySelectorAll('.area-button');
            const genderInput = form.querySelector('#gender');
            
            genderButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    console.log('Gender-Button geklickt:', btn.dataset.gender);
                    genderButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (genderInput) {
                        genderInput.value = btn.dataset.gender;
                    }
                    
                    const errorMessage = genderGroup.closest('.gender-buttons-group')?.querySelector('.error-message');
                    if (errorMessage) {
                        errorMessage.style.display = 'none';
                    }
                });
            });
        }
        
        // Event Listener für die Bereichs-Buttons
        form.querySelectorAll('#dynamicAreas .area-buttons').forEach(buttonGroup => {
            const buttons = buttonGroup.querySelectorAll('.area-button');
            const isMultiple = buttonGroup.dataset.multiple === 'true';
            const areaName = buttons[0]?.dataset.area;
            const hiddenInput = areaName 
                ? form.querySelector(`input[name="area_${areaName}"]`)
                : null;

            buttons.forEach(btn => {
                // Entferne bestehende Listener, um doppelte zu vermeiden
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                // Füge den neuen Listener hinzu
                newBtn.addEventListener('click', () => {
                    console.log('Bereichs-Button geklickt:', areaName, newBtn.dataset.value);
                    
                    if (isMultiple) {
                        newBtn.classList.toggle('active');
                        const activeButtons = Array.from(buttonGroup.querySelectorAll('.area-button.active'))
                            .map(activeBtn => activeBtn.dataset.value);
                        if (hiddenInput) {
                            hiddenInput.value = activeButtons.join(',');
                        }
                    } else {
                        buttonGroup.querySelectorAll('.area-button').forEach(b => 
                            b.classList.remove('active'));
                        newBtn.classList.add('active');
                        if (hiddenInput) {
                            hiddenInput.value = newBtn.dataset.value;
                        }
                    }
                });
            });
        });
        
        console.log('Event-Listener für Buttons hinzugefügt.');
    }
};

// Event Listeners und Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialisiere die Filter zuerst
        await FilterManager.init();
        
        // Dann initialisiere die restlichen Komponenten
        Modal.init();
        await ResidentManager.init();

        // Upload-Manager initialisieren (dieser übernimmt alle Kamera-Steuerungselemente)
        // und fügt die notwendigen Event-Listener für Kamera-Buttons hinzu
        UploadManager.init();

        // Neuer Bewohner Button
        const newResidentBtn = document.getElementById('newResidentBtn');
        if (newResidentBtn) {
            newResidentBtn.addEventListener('click', async () => {
                try {
                    console.log('Neuer Bewohner Button wurde geklickt');
                    
                    // Setze das Formular zurück
                    await FormManager.updateForm();
                    
                    // Zeige das Modal an
                    const modal = document.getElementById('newResidentForm');
                    if (!modal) {
                        console.error('Modal "newResidentForm" nicht gefunden');
                        return;
                    }
                    
                    // Stelle sicher, dass das Modal angezeigt wird
                    modal.style.display = 'flex';
                    setTimeout(() => {
                        modal.classList.add('show');
                    }, 10);
                    
                    // Überprüfe, ob das Modal geöffnet wurde
                    console.log('Modal geöffnet:', modal.classList.contains('show'));
                    
                } catch (error) {
                    console.error('Fehler beim Öffnen des Formulars:', error);
                    Toast.show('Fehler beim Öffnen des Formulars', 'error');
                }
            });
        }

        // Auferstehung Button
        const resurrectionBtn = document.getElementById('resurrectionBtn');
        if (resurrectionBtn) {
            // Definiere die Handler-Funktion
            async function handleResurrectionClick() {
                console.log('Auferstehungs-Button wurde geklickt');
                try {
                    // Überprüfe zuerst, ob das old-Verzeichnis existiert
                    const checkResponse = await fetch('/api/solo/check-old-directory');
                    const checkResult = await checkResponse.json();
                    
                    if (!checkResult.exists) {
                        Toast.show('Das Verzeichnis für entlassene Bewohner existiert nicht', 'warning');
                        // Versuche, das Verzeichnis zu erstellen
                        await fetch('/api/solo/create-directories', { method: 'POST' });
                    }
                    
                    const response = await fetch('/api/solo/residents/dismissed');
                    if (!response.ok) {
                        throw new Error(`Fehler beim Laden der entlassenen Bewohner: ${response.status}`);
                    }
                    const dismissedResidents = await response.json();
                    console.log('Entlassene Bewohner geladen:', dismissedResidents);
                    
                    const list = document.getElementById('dismissedResidentsList');
                    if (!list) {
                        console.error('dismissedResidentsList nicht gefunden');
                        return;
                    }
                    
                    list.innerHTML = '';
                    
                    if (!dismissedResidents || dismissedResidents.length === 0) {
                        list.innerHTML = '<div class="no-residents-message">Keine entlassenen Bewohner vorhanden.</div>';
                        Modal.show('resurrectionModal');
                        return;
                    }
                    
                    // Debug: Prüfe, ob Todesdaten vorhanden sind
                    console.log('Prüfe Todesdaten in den entlassenen Bewohnern:');
                    dismissedResidents.forEach(resident => {
                        console.log(`${resident.firstName} ${resident.lastName}: Todesdatum = ${resident.todesdatum || 'nicht vorhanden'}`);
                    });
                    
                    // Setze ein Standard-Todesdatum für Bewohner ohne Todesdatum
                    dismissedResidents.forEach(resident => {
                        if (!resident.todesdatum) {
                            console.log(`Setze Standard-Todesdatum für ${resident.firstName} ${resident.lastName}`);
                            // Verwende das lastModified-Datum oder das aktuelle Datum als Fallback
                            resident.todesdatum = resident.lastModified ? 
                                resident.lastModified.split('T')[0] : 
                                new Date().toISOString().split('T')[0];
                        }
                    });
                    
                    // Sortiere entlassene Bewohner nach Todesdatum absteigend (neueste zuerst)
                    dismissedResidents.sort((a, b) => {
                        const dateA = a.todesdatum ? new Date(a.todesdatum) : new Date(0);
                        const dateB = b.todesdatum ? new Date(b.todesdatum) : new Date(0);
                        return dateB - dateA; // Absteigend sortieren
                    });
                    
                    dismissedResidents.forEach(resident => {
                        const button = document.createElement('button');
                        button.className = 'resident-card';
                        
                        // Formatiere das Todesdatum, falls es existiert
                        let dateDisplay = '';
                        if (resident.todesdatum) {
                            const [year, month, day] = resident.todesdatum.split('-');
                            dateDisplay = `<div class="death-date">✝ ${day}.${month}.${year}</div>`;
                        }
                        
                        button.innerHTML = `
                            <div class="resident-name">${resident.firstName} ${resident.lastName}</div>
                            ${dateDisplay}
                        `;
                        
                        button.addEventListener('click', async () => {
                            try {
                                if (await SaveManager.resurrectResident(resident)) {
                                    // Aktualisiere das Modal, falls noch weitere entlassene Bewohner angezeigt werden sollen
                                    // Alternativ schließe das Modal nach einer erfolgreichen Wiederherstellung
                                    Modal.hide('resurrectionModal');
                                    Toast.show('Bewohner erfolgreich wiederhergestellt', 'success');
                                    await ResidentManager.loadResidents();
                                }
                            } catch (error) {
                                console.error('Fehler bei der Wiederherstellung:', error);
                                Toast.show('Fehler bei der Wiederherstellung: ' + error.message, 'error');
                            }
                        });
                        
                        list.appendChild(button);
                    });
                    
                    // Zeige das Modal direkt an
                    Modal.show('resurrectionModal');
                } catch (error) {
                    console.error('Fehler beim Laden der entlassenen Bewohner:', error);
                    Toast.show('Fehler beim Laden der entlassenen Bewohner: ' + error.message, 'error');
                }
            }
            
            // Füge den Event-Listener hinzu
            resurrectionBtn.addEventListener('click', handleResurrectionClick);
            
            console.log('Auferstehungs-Button wurde initialisiert');
        } else {
            console.error('resurrectionBtn nicht gefunden');
        }
    } catch (error) {
        console.error('Fehler beim Initialisieren:', error);
        Toast.show('Fehler beim Initialisieren der Anwendung', 'error');
    }
});

// ResidentManager auch global verfügbar machen
window.ResidentManager = ResidentManager;

// Diese Zeile nur zu Debugging-Zwecken hinzufügen
console.log('ResidentManager global verfügbar gemacht:', window.ResidentManager); 