/**
 * Modal-Manager Modul
 * Verwaltet alle Modals (Bewohnerdetails, neue Bewohner, etc.)
 */

import { ApiService } from './api-service.js';
import { ConfigManager } from './config-manager.js';
import { ResidentManager } from './resident-manager.js';
import { ToastManager } from './toast-manager.js';

export const ModalManager = {
    /**
     * Initialisiert den Modal-Manager
     * @param {Object} options - Konfigurationsoptionen
     */
    init(options = {}) {
        // Registriere Event-Listener für Modal-Buttons
        this.registerEventListeners();
        
        // Initialisiere die Modalbereinigung
        this.initModalCleanup();
        
        console.log('Modal-Manager initialisiert');
    },
    
    /**
     * Registriert Event-Listener für Modal-Buttons
     */
    registerEventListeners() {
        // Event-Listener für den "Neuer Bewohner"-Button
        const newResidentBtn = document.getElementById('newResidentBtn');
        if (newResidentBtn) {
            newResidentBtn.addEventListener('click', () => {
                this.showNewResidentModal();
            });
        }
        
        // Event-Listener für den "Entlassene Bewohner"-Button
        const dismissedResidentsBtn = document.getElementById('dismissedResidentsBtn');
        if (dismissedResidentsBtn) {
            dismissedResidentsBtn.addEventListener('click', () => {
                this.showDismissedResidentsModal();
            });
        }
        
        // Event-Listener für den "Konfiguration"-Button
        const configBtn = document.getElementById('configBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                this.showConfigModal();
            });
        }
    },
    
    /**
     * Zeigt das Modal für einen neuen Bewohner an
     */
    showNewResidentModal() {
        // Initialisiere das Modal für einen neuen Bewohner
        this.initNewResidentModal();
        
        // Setze das Standard-Geburtsdatum für neue Bewohner
        const birthDateInput = document.getElementById('newResidentBirthDate');
        if (birthDateInput) {
            try {
                // Setze das Datum auf den 1. Januar 1950
                birthDateInput.value = '1950-01-01';
                birthDateInput.valueAsDate = new Date(1950, 0, 1);
                
                // Event-Listener für Fokus auf dem Datumsfeld
                birthDateInput.addEventListener('focus', function() {
                    // Wenn kein Datum gesetzt ist, setze 1950-01-01
                    if (!this.valueAsDate) {
                        this.valueAsDate = new Date(1950, 0, 1);
                    }
                    
                    // Auf iOS öffnet sich der Datepicker mit einer Verzögerung
                    setTimeout(() => {
                        if (!this.valueAsDate) {
                            this.valueAsDate = new Date(1950, 0, 1);
                        }
                    }, 50);
                });
            } catch (error) {
                console.warn('Fehler beim Setzen des Standard-Geburtsdatums:', error);
            }
        }
        
        // Bootstrap-Modal
        const modal = new bootstrap.Modal(document.getElementById('newResidentModal'));
        modal.show();
        
        // Nach dem Anzeigen den Fokus auf das erste Formularfeld setzen
        const modalElement = document.getElementById('newResidentModal');
        modalElement.addEventListener('shown.bs.modal', function () {
            // Fokussiere das erste Eingabefeld
            const firstNameInput = document.getElementById('firstName');
            if (firstNameInput) {
                firstNameInput.focus();
            }
        }, { once: true }); // Event-Listener nur einmal ausführen
    },
    
    /**
     * Initialisiert das Modal für einen neuen Bewohner
     */
    initNewResidentModal() {
        // Hole die relevanten Bereiche aus der Konfiguration
        const areas = ConfigManager.getMenuRelevantAreas();
        
        // Container für die Bereichsfelder
        const areasContainer = document.getElementById('newResidentAreas');
        
        if (!areasContainer) return;
        
        // Leere den Container
        areasContainer.innerHTML = '';
        
        // Für jeden Bereich ein Feld erstellen
        areas.forEach(area => {
            // Container für den Bereich
            const areaContainer = document.createElement('div');
            areaContainer.className = 'mb-3';
            
            // Überschrift für den Bereich
            const areaTitle = document.createElement('label');
            areaTitle.className = 'form-label';
            areaTitle.textContent = area.name;
            
            // Stelle sicher, dass die folgende Zeile VOR dem if/else-Block steht
            areaContainer.appendChild(areaTitle);
            
            if (area.multiple) {
                // Erstelle eine Checkbox-Gruppe statt eines select multiple Elements
                const checkboxGroup = document.createElement('div');
                checkboxGroup.className = 'checkbox-group mt-2';
                
                console.log('Checkbox-Gruppe für', area.name, 'erstellt');
                
                // Hole den aktuellen Wert des Bereichs (falls vorhanden)
                const currentValue = resident.areas && resident.areas[area.name] ? resident.areas[area.name] : [];
                
                // Erstelle für jede Option eine Checkbox
                area.buttons.forEach(button => {
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'form-check';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'form-check-input';
                    checkbox.id = `area-${area.name}-${button.label}`;
                    checkbox.name = `areas[${area.name}][]`; // Beachte die eckigen Klammern für Array-Parameter
                    checkbox.value = button.label;
                    
                    // Vorauswahl, wenn der Wert bereits gesetzt ist
                    if (Array.isArray(currentValue) && currentValue.includes(button.label)) {
                        checkbox.checked = true;
                    } else if (currentValue === button.label) {
                        checkbox.checked = true;
                    }
                    
                    const label = document.createElement('label');
                    label.className = 'form-check-label';
                    label.htmlFor = checkbox.id;
                    label.textContent = button.label;
                    
                    checkboxDiv.appendChild(checkbox);
                    checkboxDiv.appendChild(label);
                    checkboxGroup.appendChild(checkboxDiv);
                });
                
                // Füge nur die Checkboxgruppe zum Container hinzu
                areaContainer.appendChild(checkboxGroup);
            } else {
                // Einfachauswahl
                const select = document.createElement('select');
                select.className = 'form-select';
                select.name = `area-${area.name}`;
                select.id = `area-${area.name}`;
                
                // Füge eine leere Option hinzu
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = 'Bitte auswählen...';
                select.appendChild(emptyOption);
                
                // Optionen für jeden Button
                area.buttons.forEach(button => {
                    const option = document.createElement('option');
                    option.value = button.label;
                    option.textContent = button.label;
                    
                    // Setze den ausgewählten Status basierend auf den Bewohnerdaten
                    if (resident.areas && resident.areas[area.name]) {
                        option.selected = resident.areas[area.name] === button.label;
                    }
                    
                    select.appendChild(option);
                });
                
                // Füge nur den Input zum Container hinzu
                areaContainer.appendChild(select);
            }
            
            // Füge den Bereich zum Container hinzu
            areasContainer.appendChild(areaContainer);
        });
        
        // Event-Listener für den Speichern-Button
        const saveBtn = document.getElementById('saveNewResidentBtn');
        if (saveBtn) {
            // Entferne alte Event-Listener
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            
            // Füge neuen Event-Listener hinzu
            newSaveBtn.addEventListener('click', () => {
                this.saveNewResident();
            });
        }
    },
    
    /**
     * Speichert einen neuen Bewohner
     */
    async saveNewResident() {
        try {
            // Hole die Formularfelder
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const gender = document.getElementById('genderHerr').checked ? 'Herr' : (document.getElementById('genderFrau').checked ? 'Frau' : '');
            
            // Neue Felder hinzufügen
            const birthDateInput = document.getElementById('newResidentBirthDate');
            const birthDate = birthDateInput ? birthDateInput.value : '';
            
            // Validiere die Pflichtfelder
            if (!firstName || !lastName) {
                ToastManager.error('Bitte geben Sie Vor- und Nachnamen ein');
                return;
            }
            
            // Erstelle ein Objekt für die Bewohnerdaten
            const residentData = {
                firstName,
                lastName,
                gender,
                birthDate,
                areas: {}
            };
            
            // Hole die relevanten Bereiche aus der Konfiguration
            const areas = ConfigManager.getMenuRelevantAreas();
            
            // Für jeden Bereich die Auswahl erfassen
            areas.forEach(area => {
                const areaName = area.name;
                
                // Wenn der Bereich Mehrfachauswahl unterstützt
                if (area.multiple) {
                    // Hole alle ausgewählten Checkboxen
                    const checkboxes = document.querySelectorAll(`input[name="area-${areaName}"]:checked`);
                    
                    if (checkboxes.length > 0) {
                        // Erstelle ein Array mit den ausgewählten Werten
                        residentData.areas[areaName] = Array.from(checkboxes).map(cb => cb.value);
                    }
                } 
                // Wenn der Bereich Einfachauswahl unterstützt
                else {
                    // Hole den ausgewählten Wert
                    const select = document.getElementById(`area-${areaName}`);
                    
                    if (select && select.value) {
                        residentData.areas[areaName] = select.value;
                    }
                }
            });
            
            // Speichere den Bewohner
            await ResidentManager.createResident(residentData);
            
            // Schließe das Modal mit der sicheren Methode
            this.closeModal('newResidentModal');
            
            // Leere das Formular
            document.getElementById('newResidentForm').reset();
            
            // Zeige eine Erfolgsmeldung
            ToastManager.success('Bewohner erfolgreich erstellt');
        } catch (error) {
            console.error('Fehler beim Speichern des Bewohners:', error);
            ToastManager.error('Fehler beim Speichern des Bewohners: ' + error.message);
        }
    },
    
    /**
     * Zeigt das Modal für die Bewohnerdetails an
     * @param {Object} resident - Bewohnerdaten
     */
    showResidentDetailModal(resident) {
        // Initialisiere das Modal mit den Bewohnerdaten
        this.initResidentDetailModal(resident);
        
        // Bootstrap-Modal für Bewohnerdetails
        const modal = new bootstrap.Modal(document.getElementById('residentDetailModal'));
        
        // Zeige das Modal an
        modal.show();
        
        // Nach dem Anzeigen den Fokus auf das erste Formularfeld setzen
        const modalElement = document.getElementById('residentDetailModal');
        modalElement.addEventListener('shown.bs.modal', function () {
            // Fokussiere das erste Eingabefeld oder den Schließen-Button
            const firstInput = modalElement.querySelector('input, button');
            if (firstInput) {
                firstInput.focus();
            }
        }, { once: true }); // Event-Listener nur einmal ausführen
    },
    
    /**
     * Initialisiert das Modal für die Bewohnerdetails
     * @param {Object} resident - Bewohnerdaten
     */
    initResidentDetailModal(resident) {
        // Setze den Titel
        const titleElement = document.getElementById('residentDetailTitle');
        if (titleElement) {
            titleElement.textContent = `${resident.firstName} ${resident.lastName}`;
        }

        // Setze die Basis-Felder
        const firstNameInput = document.getElementById('residentDetailFirstName');
        const lastNameInput = document.getElementById('residentDetailLastName');
        const genderSelect = document.getElementById('residentDetailGender');
        const roomInput = document.getElementById('residentDetailRoom');
        const ageInput = document.getElementById('residentDetailAge');

        if (firstNameInput) firstNameInput.value = resident.firstName || '';
        if (lastNameInput) lastNameInput.value = resident.lastName || '';
        if (genderSelect) genderSelect.value = resident.gender || '';
        if (roomInput) roomInput.value = resident.room || '';
        if (ageInput) {
            // Wenn ein Geburtsdatum vorhanden ist, dieses setzen, sonst den Standardwert (1950-01-01)
            ageInput.value = resident.birthDate || '1950-01-01';

            // Beim Fokussieren auf das Datumsfeld in mobilen Geräten, das Jahr auf 1950 setzen
            ageInput.addEventListener('focus', function(event) {
                // Touch-Ereignis unterbrechen, um das Standard-Verhalten anzupassen
                try {
                    if (this.type === 'date' && !this.valueAsDate) {
                        // Wenn kein Datum gesetzt ist, setze 1950-01-01
                        this.valueAsDate = new Date(1950, 0, 1);
                    }
                    
                    // Auf iOS öffnet sich der Datepicker mit einem Verzögerung
                    setTimeout(() => {
                        // Versuche den Wert erneut zu setzen, da manche Browser den Wert überschreiben
                        if (!this.valueAsDate) {
                            this.valueAsDate = new Date(1950, 0, 1);
                        }
                    }, 50);
                } catch (error) {
                    console.warn('Fehler beim Setzen des Geburtsdatums:', error);
                }
            });

            // Stelle sicher, dass ein gültiges Datum gesetzt ist
            if (!ageInput.valueAsDate) {
                try {
                    ageInput.valueAsDate = new Date(1950, 0, 1);
                } catch (error) {
                    console.warn('Fehler beim Initialisieren des Geburtsdatums:', error);
                }
            }
        }

        // Generiere die dynamischen Bereiche
        const areasContainer = document.getElementById('residentDetailAreas');
        if (areasContainer) {
            areasContainer.innerHTML = ''; // Leere den Container

            // Hole die relevanten Bereiche direkt aus der ConfigManager
            const areas = ConfigManager.getMenuRelevantAreas();
            
            if (!areas || !Array.isArray(areas) || areas.length === 0) {
                console.warn('Keine Bereiche aus der Konfiguration gefunden');
                return;
            }
            
                    // Erstelle für jeden Bereich ein Formularfeld
            areas.forEach(area => {
                        const areaDiv = document.createElement('div');
                        areaDiv.className = 'col-md-6 mb-3';
                        
                        const label = document.createElement('label');
                        label.className = 'form-label';
                        label.textContent = area.name;
                        
                        let input;
                        let checkboxGroup; // Deklaration außerhalb des if-Blocks
                        
                        if (area.multiple) {
                            // Erstelle eine Checkbox-Gruppe statt eines select multiple Elements
                            checkboxGroup = document.createElement('div');
                            checkboxGroup.className = 'checkbox-group mt-2';
                            
                            console.log('Checkbox-Gruppe für', area.name, 'erstellt');
                            
                            // Hole den aktuellen Wert des Bereichs (falls vorhanden)
                            const currentValue = resident.areas && resident.areas[area.name] ? resident.areas[area.name] : [];
                            
                            // Erstelle für jede Option eine Checkbox
                            area.buttons.forEach(button => {
                                const checkboxDiv = document.createElement('div');
                                checkboxDiv.className = 'form-check';
                                
                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.className = 'form-check-input';
                                checkbox.id = `area-${area.name}-${button.label}`;
                                checkbox.name = `areas[${area.name}][]`; // Beachte die eckigen Klammern für Array-Parameter
                                checkbox.value = button.label;
                                
                                // Vorauswahl, wenn der Wert bereits gesetzt ist
                                if (Array.isArray(currentValue) && currentValue.includes(button.label)) {
                                    checkbox.checked = true;
                                } else if (currentValue === button.label) {
                                    checkbox.checked = true;
                                }
                                
                                const label = document.createElement('label');
                                label.className = 'form-check-label';
                                label.htmlFor = checkbox.id;
                                label.textContent = button.label;
                                
                                checkboxDiv.appendChild(checkbox);
                                checkboxDiv.appendChild(label);
                                checkboxGroup.appendChild(checkboxDiv);
                            });
                        } else {
                            // Einfachauswahl
                            input = document.createElement('select');
                            input.className = 'form-select';
                            input.name = `areas[${area.name}]`;
                            
                            // Füge eine leere Option hinzu
                            const emptyOption = document.createElement('option');
                            emptyOption.value = '';
                            emptyOption.textContent = 'Bitte wählen...';
                            input.appendChild(emptyOption);
                            
                            // Füge die Optionen hinzu
                            area.buttons.forEach(button => {
                                const option = document.createElement('option');
                                option.value = button.label;
                                option.textContent = button.label;
                                
                                // Setze den ausgewählten Status basierend auf den Bewohnerdaten
                                if (resident.areas && resident.areas[area.name]) {
                                    option.selected = resident.areas[area.name] === button.label;
                                }
                                
                                input.appendChild(option);
                            });
                        }
                        
                        areaDiv.appendChild(label);
                        if (area.multiple && checkboxGroup) {
                            // Bei Mehrfachauswahl die Checkbox-Gruppe hinzufügen
                            areaDiv.appendChild(checkboxGroup);
                        } else if (input) {
                            // Bei Einfachauswahl das input Element hinzufügen
                            areaDiv.appendChild(input);
                        }
                        areasContainer.appendChild(areaDiv);
                });
        }

        // Event-Listener für die Buttons
        const saveBtn = document.getElementById('saveResidentBtn');
        const dismissBtn = document.getElementById('dismissResidentBtn');
        const closeBtn = document.querySelector('[data-bs-dismiss="modal"]');

        if (saveBtn) {
            saveBtn.onclick = () => this.saveResidentDetail(resident);
        }

        if (dismissBtn) {
            dismissBtn.onclick = () => this.dismissResident(resident);
        }

        if (closeBtn) {
            closeBtn.onclick = () => this.closeResidentDetailModal();
        }
    },
    
    /**
     * Speichert die Änderungen an einem Bewohner
     * @param {Object} originalResident - Originale Bewohnerdaten
     */
    async saveResidentDetail(originalResident) {
        try {
            // Hole die Formularfelder
            const firstNameInput = document.getElementById('residentDetailFirstName');
            const lastNameInput = document.getElementById('residentDetailLastName');
            const genderSelect = document.getElementById('residentDetailGender');
            const roomInput = document.getElementById('residentDetailRoom');
            const ageInput = document.getElementById('residentDetailAge');
            
            // Prüfe, ob alle erforderlichen Elemente existieren
            if (!firstNameInput || !lastNameInput) {
                console.error('Erforderliche Formularfelder nicht gefunden:', 
                    {firstNameInput, lastNameInput});
                ToastManager.error('Formularfelder nicht gefunden. Bitte laden Sie die Seite neu.');
                return;
            }
            
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const gender = genderSelect ? genderSelect.value : '';
            const room = roomInput ? roomInput.value.trim() : '';
            const birthDate = ageInput ? ageInput.value : '';
            
            // Berechne das Alter aus dem Geburtsdatum
            let vergin = null;
            if (birthDate) {
                const birthDateObj = new Date(birthDate);
                const today = new Date();
                vergin = today.getFullYear() - birthDateObj.getFullYear();
                
                // Wenn der Geburtstag in diesem Jahr noch nicht war, ein Jahr abziehen
                if (
                    today.getMonth() < birthDateObj.getMonth() || 
                    (today.getMonth() === birthDateObj.getMonth() && today.getDate() < birthDateObj.getDate())
                ) {
                    vergin--;
                }
            }
            
            // Validiere die Pflichtfelder
            if (!firstName || !lastName) {
                ToastManager.error('Bitte geben Sie Vor- und Nachnamen ein');
                return;
            }
            
            // Prüfe, ob der Name geändert wurde
            const originalName = `${originalResident.firstName}_${originalResident.lastName}`;
            const newName = `${firstName}_${lastName}`;
            const nameChanged = originalName !== newName;
            
            if (nameChanged) {
                console.log(`Bewohnername wurde geändert: ${originalName} -> ${newName}`);
            }
            
            // Speichere den aktuellen Filterzustand vor dem Aktualisieren
            let currentFilterState = null;
            try {
                // Importiere den FilterManager, um den aktuellen Filterzustand zu erhalten
                const { FilterManager } = await import('./filter-manager.js');
                if (FilterManager.config && FilterManager.config.filters && FilterManager.config.filters.areas && FilterManager.config.filters.areas.length > 0) {
                    currentFilterState = {
                        area: FilterManager.config.filters.areas[0],
                        // Versuche herauszufinden, ob ein spezifischer Wert ausgewählt ist
                        value: document.querySelector('.filter-btn[data-value].active')?.dataset.value || null
                    };
                    console.log('Aktueller Filterzustand gespeichert:', currentFilterState);
                }
            } catch (error) {
                console.warn('Konnte aktuellen Filterzustand nicht ermitteln:', error);
            }
            
            // Erstelle ein Objekt für die aktualisierten Bewohnerdaten
            const updatedResidentData = {
                firstName,
                lastName,
                gender,
                room,
                vergin: vergin,
                birthDate: birthDate,
                areas: {}
            };
            
            // Hole die relevanten Bereiche aus der Konfiguration
            const areas = ConfigManager.getMenuRelevantAreas();
            
            // Prüfe, ob die Bereiche vorhanden sind
            if (!areas || !Array.isArray(areas)) {
                console.error('Keine Bereiche gefunden oder ungültiges Format:', areas);
                // Trotzdem fortfahren, aber ohne Bereiche
            } else {
            // Für jeden Bereich die Auswahl erfassen
            areas.forEach(area => {
                    if (!area || !area.name) return; // Überspringe ungültige Bereiche
                    
                const areaName = area.name;
                
                // Wenn der Bereich Mehrfachauswahl unterstützt
                if (area.multiple) {
                        // Hole alle ausgewählten Checkboxen für diesen Bereich
                        const checkboxes = document.querySelectorAll(`input[type="checkbox"][name="areas[${areaName}][]"]:checked`);
                        
                        if (checkboxes && checkboxes.length > 0) {
                            const selectedOptions = Array.from(checkboxes)
                                .map(checkbox => checkbox.value)
                                .filter(value => value); // Filtere leere Werte
                                
                            if (selectedOptions.length > 0) {
                                updatedResidentData.areas[areaName] = selectedOptions;
                            }
                        }
                    } 
                    // Wenn der Bereich Einfachauswahl unterstützt
                    else {
                            // Hole den ausgewählten Wert aus dem Select
                            const selectElement = document.querySelector(`select[name="areas[${areaName}]"]`);
                        
                            if (selectElement && selectElement.value) {
                                updatedResidentData.areas[areaName] = selectElement.value;
                        }
                    }
                });
            }
            
            // Hole den vollständigen Namen des Bewohners (für die API)
            if (!originalResident) {
                console.error('Originaler Bewohner ist null oder undefined');
                ToastManager.error('Fehler: Bewohnerdaten fehlen');
                return;
            }
            
            try {
                // Wenn der Name geändert wurde, verwende eine spezielle Logik
                if (nameChanged) {
                    // Ersten Schritt: Erstelle einen neuen Bewohner mit den neuen Daten
                    await ApiService.createResident(updatedResidentData);
                    
                    // Zweiten Schritt: Lösche den alten Bewohner
                    await ApiService.dismissResident(originalName);
                    
                    console.log(`Bewohner umbenannt: ${originalName} -> ${newName}`);
                    ToastManager.success('Bewohner erfolgreich aktualisiert und umbenannt');
                } else {
                    // Normales Update, wenn der Name nicht geändert wurde
                    const residentName = ResidentManager.getResidentFullName(originalResident);
                    await ResidentManager.updateResident(residentName, updatedResidentData);
                    ToastManager.success('Bewohner erfolgreich aktualisiert');
                }
                
                // Schließe das Modal mit der sicheren Methode
                this.closeModal('residentDetailModal');
                
                // Bewohnerliste aktualisieren unter Berücksichtigung des vorherigen Filterzustands
                await ResidentManager.loadResidents();
                
                // Wenn es einen vorherigen Filterzustand gab, wende diesen wieder an
                if (currentFilterState) {
                    try {
                        const { FilterManager } = await import('./filter-manager.js');
                        console.log('Wende vorherigen Filterzustand wieder an:', currentFilterState);
                        await FilterManager.applyFilter(currentFilterState.area, currentFilterState.value);
                    } catch (error) {
                        console.error('Fehler beim Wiederherstellen des Filterzustands:', error);
                        // Fallback: Alle Bewohner anzeigen
                        await ResidentManager.displayAllResidents();
                    }
                } else {
                    // Keine vorherige Sortierung, zeige alle Bewohner
                    await ResidentManager.displayAllResidents();
                }
            } catch (error) {
                console.error('Fehler beim Aktualisieren des Bewohners:', error);
                ToastManager.error('Fehler beim Aktualisieren des Bewohners: ' + error.message);
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Bewohners:', error);
            ToastManager.error('Fehler beim Aktualisieren des Bewohners: ' + error.message);
        }
    },
    
    /**
     * Entlässt einen Bewohner
     * @param {Object} resident - Bewohnerdaten
     */
    async dismissResident(resident) {
        try {
            // Bestätigungsdialog anzeigen
            const confirmed = confirm(`Möchten Sie ${resident.firstName} ${resident.lastName} wirklich entlassen?`);
            
            if (!confirmed) {
                return;
            }
            
            // Speichere den aktuellen Filterzustand vor dem Entlassen
            let currentFilterState = null;
            try {
                // Importiere den FilterManager, um den aktuellen Filterzustand zu erhalten
                const { FilterManager } = await import('./filter-manager.js');
                if (FilterManager.config && FilterManager.config.filters && FilterManager.config.filters.areas && FilterManager.config.filters.areas.length > 0) {
                    currentFilterState = {
                        area: FilterManager.config.filters.areas[0],
                        // Versuche herauszufinden, ob ein spezifischer Wert ausgewählt ist
                        value: document.querySelector('.filter-btn[data-value].active')?.dataset.value || null
                    };
                    console.log('Aktueller Filterzustand gespeichert:', currentFilterState);
                }
            } catch (error) {
                console.warn('Konnte aktuellen Filterzustand nicht ermitteln:', error);
            }
            
            // Hole den vollständigen Namen des Bewohners (für die API)
            const residentName = ResidentManager.getResidentFullName(resident);
            
            // Entlasse den Bewohner
            await ResidentManager.dismissResident(residentName);
            
            // Schließe das Modal mit der sicheren Methode
            this.closeModal('residentDetailModal');
            
            // Bewohnerliste aktualisieren unter Berücksichtigung des vorherigen Filterzustands
            await ResidentManager.loadResidents();
            
            // Wenn es einen vorherigen Filterzustand gab, wende diesen wieder an
            if (currentFilterState) {
                try {
                    const { FilterManager } = await import('./filter-manager.js');
                    console.log('Wende vorherigen Filterzustand wieder an:', currentFilterState);
                    await FilterManager.applyFilter(currentFilterState.area, currentFilterState.value);
                } catch (error) {
                    console.error('Fehler beim Wiederherstellen des Filterzustands:', error);
                    // Fallback: Alle Bewohner anzeigen
                    await ResidentManager.displayAllResidents();
                }
            } else {
                // Keine vorherige Sortierung, zeige alle Bewohner
                await ResidentManager.displayAllResidents();
            }
            
            // Zeige eine Erfolgsmeldung
            ToastManager.success('Bewohner erfolgreich entlassen');
        } catch (error) {
            console.error('Fehler beim Entlassen des Bewohners:', error);
            ToastManager.error('Fehler beim Entlassen des Bewohners: ' + error.message);
        }
    },
    
    /**
     * Zeigt das Modal für entlassene Bewohner an
     */
    async showDismissedResidentsModal() {
        try {
            // Lade die entlassenen Bewohner
            const dismissedResidents = await ResidentManager.loadDismissedResidents();
            
            // Initialisiere das Modal mit den entlassenen Bewohnern
            this.initDismissedResidentsModal(dismissedResidents);
            
            // Bootstrap-Modal für entlassene Bewohner
            const modal = new bootstrap.Modal(document.getElementById('resurrectionModal'));
            
            // Zeige das Modal an
            modal.show();
            
            // Nach dem Anzeigen den Fokus auf das erste Element setzen
            const modalElement = document.getElementById('resurrectionModal');
            modalElement.addEventListener('shown.bs.modal', function () {
                // Fokussiere den ersten Button im Modal
                const firstButton = modalElement.querySelector('button:not(.btn-close)');
                if (firstButton) {
                    firstButton.focus();
                }
            }, { once: true }); // Event-Listener nur einmal ausführen
        } catch (error) {
            console.error('Fehler beim Laden der entlassenen Bewohner:', error);
            ToastManager.error('Fehler beim Laden der entlassenen Bewohner: ' + error.message);
        }
    },
    
    /**
     * Initialisiert das Modal für entlassene Bewohner
     * @param {Array} dismissedResidents - Liste entlassener Bewohner
     */
    initDismissedResidentsModal(dismissedResidents) {
        // Container für die entlassenen Bewohner
        const dismissedResidentsContainer = document.getElementById('dismissedResidentsList');
        
        if (!dismissedResidentsContainer) return;
        
        // Leere den Container
        dismissedResidentsContainer.innerHTML = '';
        
        // Wenn keine entlassenen Bewohner vorhanden sind
        if (!dismissedResidents || dismissedResidents.length === 0) {
            dismissedResidentsContainer.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">Keine entlassenen Bewohner gefunden</p>
                </div>
            `;
            return;
        }
        
        // Sortiere die Bewohner nach Nachname, Vorname
        const sortedResidents = [...dismissedResidents].sort((a, b) => {
            const lastNameA = a.lastName.toLowerCase();
            const lastNameB = b.lastName.toLowerCase();
            
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            
            const firstNameA = a.firstName.toLowerCase();
            const firstNameB = b.firstName.toLowerCase();
            
            if (firstNameA < firstNameB) return -1;
            if (firstNameA > firstNameB) return 1;
            
            return 0;
        });
        
        // Erstelle eine Liste für die entlassenen Bewohner
        const list = document.createElement('div');
        list.className = 'list-group';
        
        // Für jeden entlassenen Bewohner einen Listeneintrag erstellen
        sortedResidents.forEach(resident => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            // Bewohnername
            const residentName = document.createElement('div');
            residentName.textContent = `${resident.lastName}, ${resident.firstName}`;
            
            // Container für die Buttons
            const btnContainer = document.createElement('div');
            
            // Wiederherstellen-Button
            const resurrectBtn = document.createElement('button');
            resurrectBtn.className = 'btn btn-outline-success btn-sm';
            resurrectBtn.innerHTML = '<i class="fas fa-undo"></i> Wiederherstellen';
            
            // Event-Listener für den Wiederherstellen-Button
            resurrectBtn.addEventListener('click', async () => {
                try {
                    // Bestätigungsdialog anzeigen
                    const confirmed = confirm(`Möchten Sie ${resident.firstName} ${resident.lastName} wirklich wiederherstellen?`);
                    
                    if (!confirmed) {
                        return;
                    }
                    
                    // Hole den vollständigen Namen des Bewohners (für die API)
                    const residentName = ResidentManager.getResidentFullName(resident);
                    
                    // Stelle den Bewohner wieder her
                    await ResidentManager.resurrectResident(residentName);
                    
                    // Initialisiere das Modal neu (ohne die wiederhergestellten Bewohner)
                    this.showDismissedResidentsModal();
                } catch (error) {
                    console.error('Fehler beim Wiederherstellen des Bewohners:', error);
                    ToastManager.error('Fehler beim Wiederherstellen des Bewohners: ' + error.message);
                }
            });
            
            // Füge den Button zum Container hinzu
            btnContainer.appendChild(resurrectBtn);
            
            // Füge Name und Button zum Listeneintrag hinzu
            listItem.appendChild(residentName);
            listItem.appendChild(btnContainer);
            
            // Füge den Listeneintrag zur Liste hinzu
            list.appendChild(listItem);
        });
        
        // Füge die Liste zum Container hinzu
        dismissedResidentsContainer.appendChild(list);
    },
    
    /**
     * Zeigt das Konfigurationsmodal an
     */
    showConfigModal() {
        // Hole das Modal-Element
        const modalElement = document.getElementById('configModal');
        if (!modalElement) {
            console.error('Konfigurationsmodal nicht gefunden');
            return;
        }
        
        try {
            // Importiere den ConfigManager, um die Konfiguration zu aktualisieren
            import('./config-manager.js').then(({ ConfigManager }) => {
                // Aktualisiere die Felder-Liste und Bereiche-Liste
                ConfigManager.updateFieldsList();
                ConfigManager.updateAreasList();
                
                // Stelle sicher, dass der erste Tab (Felder) aktiv ist
                const fieldsTab = document.getElementById('fields-tab');
                if (fieldsTab) {
                    const tabInstance = new bootstrap.Tab(fieldsTab);
                    tabInstance.show();
                }
                
                // Event-Listener für die Tab-Buttons
                const areasTab = document.getElementById('areas-tab');
                if (areasTab) {
                    areasTab.addEventListener('shown.bs.tab', function() {
                        // Aktualisiere die Bereiche-Liste wenn der Tab angezeigt wird
                        ConfigManager.updateAreasList();
                    });
                }
                
                const filterTab = document.getElementById('filter-tab');
                if (filterTab) {
                    filterTab.addEventListener('shown.bs.tab', function() {
                        // Aktualisiere die Filter-Optionen wenn der Tab angezeigt wird
                        ConfigManager.updateFilterOptions();
                    });
                }
                
                // Modal anzeigen
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }).catch(error => {
                console.error('Fehler beim Laden des ConfigManager:', error);
                window.ToastManager.error('Fehler beim Laden der Konfiguration');
            });
        } catch (error) {
            console.error('Fehler beim Anzeigen des Konfigurationsmodals:', error);
            window.ToastManager.error('Fehler beim Anzeigen des Konfigurationsmodals');
        }
    },
    
    /**
     * Zeigt das Auferstehungs-Modal an
     */
    async showResurrectionModal() {
        try {
            // Lade entlassene Bewohner
            const dismissedResidents = await ApiService.getDismissedResidents();
            
            if (!Array.isArray(dismissedResidents) || dismissedResidents.length === 0) {
                ToastManager.info('Keine entlassenen Bewohner gefunden');
                return;
            }
            
            // Bootstrap-Modal für die Auferstehung
            const modal = new bootstrap.Modal(document.getElementById('resurrectionModal'));
            
            // Initialisiere das Modal mit den entlassenen Bewohnern
            this.initResurrectionModal(dismissedResidents);
            
            // Zeige das Modal an
            modal.show();
        } catch (error) {
            console.error('Fehler beim Laden der entlassenen Bewohner:', error);
            ToastManager.error('Entlassene Bewohner konnten nicht geladen werden');
        }
    },
    
    /**
     * Initialisiert das Auferstehungs-Modal mit den entlassenen Bewohnern
     * @param {Array} dismissedResidents - Liste der entlassenen Bewohner
     */
    initResurrectionModal(dismissedResidents) {
        // Container für die entlassenen Bewohner
        const dismissedResidentsContainer = document.getElementById('dismissedResidentsList');
        
        if (!dismissedResidentsContainer) {
            console.error('Container für entlassene Bewohner nicht gefunden');
            return;
        }
        
        // Leere den Container
        dismissedResidentsContainer.innerHTML = '';
        
        if (!dismissedResidents || dismissedResidents.length === 0) {
            dismissedResidentsContainer.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">Keine entlassenen Bewohner gefunden</p>
                </div>
            `;
            return;
        }
        
        // Sortiere nach Nachname, Vorname
        const sortedResidents = [...dismissedResidents].sort((a, b) => {
            const lastNameA = a.lastName ? a.lastName.toLowerCase() : '';
            const lastNameB = b.lastName ? b.lastName.toLowerCase() : '';
            
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            
            const firstNameA = a.firstName ? a.firstName.toLowerCase() : '';
            const firstNameB = b.firstName ? b.firstName.toLowerCase() : '';
            
            if (firstNameA < firstNameB) return -1;
            if (firstNameA > firstNameB) return 1;
            
            return 0;
        });
        
        // Liste der entlassenen Bewohner erstellen
        sortedResidents.forEach(resident => {
            const residentElement = document.createElement('div');
            residentElement.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            // Name und Details
            const nameElement = document.createElement('div');
            nameElement.className = 'ms-2 me-auto';
            
            // Name mit Gender
            const nameWithGender = resident.gender ? 
                `${resident.gender} ${resident.firstName} ${resident.lastName}` : 
                `${resident.firstName} ${resident.lastName}`;
            
            nameElement.innerHTML = `
                <div class="fw-bold">${nameWithGender}</div>
                <small class="text-muted">${this.getResidentDetails(resident)}</small>
            `;
            
            // Auferstehungs-Button
            const resurrectButton = document.createElement('button');
            resurrectButton.className = 'btn btn-outline-primary btn-sm';
            resurrectButton.innerHTML = '<i class="fas fa-user-plus"></i> Auferstehen';
            
            // Event-Listener für den Auferstehungs-Button
            resurrectButton.addEventListener('click', async () => {
                try {
                    // Bewohnername für die API
                    const residentName = `${resident.firstName}_${resident.lastName}`;
                    
                    // Bewohner "auferstehen" lassen
                    await ApiService.resurrectResident(residentName);
                    
                    // Erfolg anzeigen
                    ToastManager.success(`${resident.firstName} ${resident.lastName} erfolgreich wiederhergestellt`);
                    
                    // Bewohner aus der Liste entfernen
                    residentElement.remove();
                    
                    // Wenn keine Bewohner mehr übrig sind, das Modal schließen
                    const remainingResidents = dismissedResidentsContainer.querySelectorAll('.list-group-item');
                    if (remainingResidents.length === 0) {
                        this.closeModal('resurrectionModal');
                    }
                    
                    // Bewohnerliste aktualisieren
                    await ResidentManager.loadResidents();
                    await ResidentManager.displayAllResidents();
                } catch (error) {
                    console.error('Fehler bei der Auferstehung:', error);
                    ToastManager.error(`Auferstehung fehlgeschlagen: ${error.message}`);
                }
            });
            
            // Elemente zum Container hinzufügen
            residentElement.appendChild(nameElement);
            residentElement.appendChild(resurrectButton);
            dismissedResidentsContainer.appendChild(residentElement);
        });
    },
    
    /**
     * Gibt Details eines Bewohners als String zurück
     * @param {Object} resident - Bewohnerdaten
     * @returns {string} - Details des Bewohners
     */
    getResidentDetails(resident) {
        const details = [];
        
        // Zimmer, falls verfügbar
        if (resident.room) {
            details.push(`Zimmer: ${resident.room}`);
        }
        
        // Alter, falls verfügbar
        if (resident.vergin) {
            details.push(`Alter: ${resident.vergin}`);
        } else if (resident.birthDate) {
            // Berechne das Alter aus dem Geburtsdatum
            const birthDateObj = new Date(resident.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDateObj.getFullYear();
            
            // Wenn der Geburtstag in diesem Jahr noch nicht war, ein Jahr abziehen
            if (
                today.getMonth() < birthDateObj.getMonth() || 
                (today.getMonth() === birthDateObj.getMonth() && today.getDate() < birthDateObj.getDate())
            ) {
                age--;
            }
            
            details.push(`Alter: ${age}`);
        }
        
        // Bereiche, falls verfügbar
        if (resident.areas) {
            const changeableAreas = ConfigManager.getChangeableAreas();
            
            changeableAreas.forEach(areaConfig => {
                const areaValue = resident.areas[areaConfig.name];
                
                if (areaValue) {
                    if (Array.isArray(areaValue)) {
                        if (areaValue.length > 0) {
                            details.push(`<span class="text-start">${areaConfig.name}: ${areaValue.join('<br>')}</span>`);
                        }
                    } else {
                        details.push(`${areaConfig.name}: ${areaValue}`);
                    }
                }
            });
        }
        
        return details.join(' | ');
    },
    
    /**
     * Initialisiert die Modalbereinigung für alle Bootstrap-Modals
     */
    initModalCleanup() {
        // Event-Listener für alle Modals
        document.querySelectorAll('.modal').forEach(modal => {
            // Wenn das Modal versteckt wurde
            modal.addEventListener('hidden.bs.modal', () => {
                this.cleanupModalBackdrops();
            });
            
            // Wenn es einen Fehler beim Schließen gibt
            modal.addEventListener('hide.bs.modal', (event) => {
                // Stelle sicher, dass das Modal korrekt geschlossen werden kann
                if (modal.classList.contains('show') && document.querySelector('.modal-backdrop')) {
                    // Verzögerung hinzufügen, um sicherzustellen, dass Bootstrap das Modal schließen kann
                    setTimeout(() => {
                        this.cleanupModalBackdrops();
                    }, 300);
                }
            });
        });
    },
    
    /**
     * Entfernt übrig gebliebene Modal-Backdrops
     */
    cleanupModalBackdrops() {
        // Prüfe, ob noch ein Modal sichtbar ist
        const visibleModal = document.querySelector('.modal.show');
        
        // Nur bereinigen, wenn kein Modal mehr sichtbar ist
        if (!visibleModal) {
            // Entferne alle Modal-Backdrops
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.remove();
            });
            
            // Entferne Body-Klassen und Styles
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    },
    
    /**
     * Schließt ein Modal sicher
     * @param {string} modalId - ID des zu schließenden Modals
     */
    closeModal(modalId) {
        try {
            // Versuche, die Bootstrap-Modal-Instanz zu bekommen
            const modalElement = document.getElementById(modalId);
            if (!modalElement) return;
            
            // Setze den Fokus auf ein Element außerhalb des Modals, bevor es geschlossen wird
            this.setFocusOutsideModal(modalId);
            
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            
            if (modalInstance) {
                // Schließe das Modal über die Bootstrap-API
                modalInstance.hide();
            } else {
                // Direktes Entfernen der Klassen, falls keine Bootstrap-Instanz vorhanden ist
                modalElement.classList.remove('show');
                modalElement.setAttribute('aria-hidden', 'true');
                modalElement.removeAttribute('aria-modal');
                modalElement.style.display = 'none';
                
                // Entferne den Backdrop
                this.cleanupModalBackdrops();
            }

            // Als zusätzliche Sicherheit die verschachtelten Fokus-Elemente deaktivieren
            const focusableElements = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusableElements.forEach(el => {
                el.setAttribute('tabindex', '-1');
            });
        } catch (error) {
            console.error(`Fehler beim Schließen des Modals ${modalId}:`, error);
        }
    },
    
    /**
     * Setzt den Fokus auf ein Element außerhalb des Modals
     * @param {string} modalId - ID des Modals
     */
    setFocusOutsideModal(modalId) {
        // Setze den Fokus auf ein Element außerhalb des Modals
        // Dies verhindert Probleme mit dem Fokus nach dem Schließen
        document.body.focus();
    }
};