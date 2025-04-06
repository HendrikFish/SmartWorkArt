/**
 * Modal-Manager
 * Verwaltet die modalen Dialoge der Anwendung
 */

import { ApiService } from './api-service.js';
import { ToastManager } from './toast-manager.js';
import { ConfigManager } from './config-manager.js';
import { ResidentManager } from './resident-manager.js';
import { OcrManager } from './ocr-manager.js';

export const ModalManager = {
    bootstrap: null,
    currentResident: null,
    
    /**
     * Initialisiert den Modal-Manager
     * @returns {Promise<void>}
     */
    async init() {
        console.log('Modal-Manager wird initialisiert...');
        
        // Bootstrap-Objekt für Modals laden
        this.bootstrap = window.bootstrap;
        
        if (!this.bootstrap) {
            console.error('Bootstrap nicht gefunden! Modal-Funktionalität eingeschränkt.');
            ToastManager.error('Bootstrap konnte nicht geladen werden');
        }
        
        // Event-Listener für den Neuer-Bewohner-Button und Modalaktionen
        this.initEventListeners();
        
        console.log('Modal-Manager erfolgreich initialisiert');
        return Promise.resolve();
    },
    
    /**
     * Initialisiert Event-Listener für Modals
     */
    initEventListeners() {
        // Speichern-Button im Neuer-Bewohner-Modal
        const saveNewResidentBtn = document.getElementById('saveNewResidentBtn');
        if (saveNewResidentBtn) {
            saveNewResidentBtn.addEventListener('click', async () => {
                await this.saveNewResident();
            });
        }
        
        // Speichern-Button im Bewohner-Detail-Modal
        const saveResidentBtn = document.getElementById('saveResidentBtn');
        if (saveResidentBtn) {
            saveResidentBtn.addEventListener('click', async () => {
                await this.saveResidentDetails();
            });
        }
        
        // Entlassen-Button im Bewohner-Detail-Modal
        const dismissResidentBtn = document.getElementById('dismissResidentBtn');
        if (dismissResidentBtn) {
            dismissResidentBtn.addEventListener('click', async () => {
                await this.dismissResident();
            });
        }
        
        // Wiederherstellen-Buttons für entlassene Bewohner (via Event-Delegation)
        document.addEventListener('click', async (event) => {
            const resurrectBtn = event.target.closest('.resurrect-btn');
            if (resurrectBtn) {
                const residentId = resurrectBtn.dataset.id;
                if (residentId) {
                    await this.resurrectResident(residentId);
                }
            }
        });
        
        // Enter-Taste im Neuer-Bewohner-Modal
        const newResidentForm = document.getElementById('newResidentForm');
        if (newResidentForm) {
            newResidentForm.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.saveNewResident();
                }
            });
        }
        
        // Enter-Taste im Bewohner-Detail-Modal
        const residentDetailForm = document.getElementById('residentDetailForm');
        if (residentDetailForm) {
            residentDetailForm.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.saveResidentDetails();
                }
            });
        }
    },
    
    /**
     * Zeigt das Neue-Bewohner-Modal an
     */
    showNewResidentModal() {
        // Formular zurücksetzen
        const form = document.getElementById('newResidentForm');
        if (form) form.reset();
        
        // Dynamische Bereiche laden
        this.renderDynamicAreas('dynamicAreas');
        
        // Modal anzeigen
        const newResidentModal = document.getElementById('newResidentModal');
        if (newResidentModal && this.bootstrap) {
            const modal = new this.bootstrap.Modal(newResidentModal);
            modal.show();
        } else {
            ToastManager.error('Modal konnte nicht geöffnet werden');
        }
    },
    
    /**
     * Zeigt das Bewohner-Detail-Modal an
     * @param {string} residentId - ID des Bewohners 
     */
    showResidentDetailModal(residentId) {
        // Bewohner anhand der ID suchen
        const resident = ResidentManager.findResidentById(residentId);
        if (!resident) {
            ToastManager.error('Bewohner nicht gefunden');
            return;
        }
        
        this.currentResident = resident;
        
        // Formular mit Bewohnerdaten füllen
        const firstNameInput = document.getElementById('residentDetailFirstName');
        const lastNameInput = document.getElementById('residentDetailLastName');
        const genderHerr = document.getElementById('detailGenderHerr');
        const genderFrau = document.getElementById('detailGenderFrau');
        const ageInput = document.getElementById('residentDetailAge');
        
        if (firstNameInput) firstNameInput.value = resident.firstName || '';
        if (lastNameInput) lastNameInput.value = resident.lastName || '';
        
        if (genderHerr && genderFrau) {
            if (resident.gender === 'Herr') {
                genderHerr.checked = true;
            } else if (resident.gender === 'Frau') {
                genderFrau.checked = true;
            }
        }
        
        if (ageInput) ageInput.value = resident.vergin || '';
        
        // Titel setzen
        const modalTitle = document.getElementById('residentDetailTitle');
        if (modalTitle) {
            modalTitle.textContent = `${resident.firstName} ${resident.lastName}`;
        }
        
        // Dynamische Bereiche rendern
        this.renderDynamicAreasWithValues('residentDetailAreas', resident);
        
        // Modal anzeigen
        const residentDetailModal = document.getElementById('residentDetailModal');
        if (residentDetailModal && this.bootstrap) {
            const modal = new this.bootstrap.Modal(residentDetailModal);
            modal.show();
        } else {
            ToastManager.error('Modal konnte nicht geöffnet werden');
        }
    },
    
    /**
     * Zeigt das Konfigurations-Modal an
     */
    showConfigModal() {
        // Bereiche laden und anzeigen
        ConfigManager.renderAreas();
        
        // Modal anzeigen
        const configModal = document.getElementById('configModal');
        if (configModal && this.bootstrap) {
            const modal = new this.bootstrap.Modal(configModal);
            modal.show();
        } else {
            ToastManager.error('Modal konnte nicht geöffnet werden');
        }
    },
    
    /**
     * Zeigt das OCR-Modal an
     */
    showOcrModal() {
        // OCR-Modal in den Ausgangszustand versetzen
        OcrManager.resetOcrModal();
        
        // Modal anzeigen
        const ocrModal = document.getElementById('ocrModal');
        if (ocrModal && this.bootstrap) {
            const modal = new this.bootstrap.Modal(ocrModal);
            modal.show();
        } else {
            ToastManager.error('Modal konnte nicht geöffnet werden');
        }
    },
    
    /**
     * Zeigt das Auferstehungs-Modal an
     */
    async showResurrectionModal() {
        try {
            // Entlassene Bewohner laden
            const dismissedResidents = await ApiService.getDismissedResidents();
            
            const dismissedList = document.getElementById('dismissedResidentsList');
            const noResultsElement = document.getElementById('noDismissedResidents');
            
            if (dismissedList) {
                dismissedList.innerHTML = '';
                
                if (dismissedResidents.length === 0) {
                    // Keine entlassenen Bewohner
                    if (noResultsElement) {
                        noResultsElement.classList.remove('d-none');
                    }
                } else {
                    // Entlassene Bewohner anzeigen
                    if (noResultsElement) {
                        noResultsElement.classList.add('d-none');
                    }
                    
                    // Bewohner alphabetisch sortieren
                    dismissedResidents.sort((a, b) => {
                        const lastNameA = a.lastName?.toLowerCase() || '';
                        const lastNameB = b.lastName?.toLowerCase() || '';
                        
                        if (lastNameA !== lastNameB) {
                            return lastNameA.localeCompare(lastNameB);
                        }
                        
                        const firstNameA = a.firstName?.toLowerCase() || '';
                        const firstNameB = b.firstName?.toLowerCase() || '';
                        return firstNameA.localeCompare(firstNameB);
                    });
                    
                    // Liste erstellen
                    dismissedResidents.forEach(resident => {
                        const residentId = `${resident.firstName}_${resident.lastName}`;
                        const listItem = document.createElement('div');
                        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                        
                        listItem.innerHTML = `
                            <div>${resident.lastName}, ${resident.firstName}</div>
                            <div>
                                <button class="btn btn-outline-success btn-sm resurrect-btn" data-id="${residentId}">
                                    <i class="fas fa-undo me-2"></i>Wiederherstellen
                                </button>
                            </div>
                        `;
                        
                        dismissedList.appendChild(listItem);
                    });
                }
            }
            
            // Modal anzeigen
            const resurrectionModal = document.getElementById('resurrectionModal');
            if (resurrectionModal && this.bootstrap) {
                const modal = new this.bootstrap.Modal(resurrectionModal);
                modal.show();
            } else {
                ToastManager.error('Modal konnte nicht geöffnet werden');
            }
        } catch (error) {
            console.error('Fehler beim Laden entlassener Bewohner:', error);
            ToastManager.error('Entlassene Bewohner konnten nicht geladen werden');
        }
    },
    
    /**
     * Rendert dynamische Bereiche in einem Container basierend auf der Konfiguration
     * @param {string} containerId - ID des Containers
     */
    renderDynamicAreas(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Konfiguration abrufen
        const config = ConfigManager.config;
        if (!config || !config.areas || config.areas.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>Keine Bereiche konfiguriert. Bitte erstellen Sie Bereiche unter "Konfiguration".
                </div>
            `;
            return;
        }
        
        // Bereiche sortieren und anzeigen
        const sortedAreas = [...config.areas].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        sortedAreas.forEach(area => {
            // Prüfen, ob der Bereich Buttons hat
            if (!area.buttons || area.buttons.length === 0) return;
            
            const areaContainer = document.createElement('div');
            areaContainer.className = 'mb-4';
            areaContainer.innerHTML = `
                <label class="form-label mb-2">${area.name}</label>
                <div class="area-button-group" data-area="${area.name}" data-multiple="${area.multiple || false}">
                    ${area.buttons.map(btn => `
                        <input type="radio" class="btn-check" name="area_${area.name}" 
                               id="area_${area.name}_${btn.label}" value="${btn.label}"
                               ${!area.multiple ? '' : 'data-multiple="true"'}>
                        <label class="btn btn-outline-primary area-button" 
                               for="area_${area.name}_${btn.label}">
                            ${btn.label}
                        </label>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(areaContainer);
            
            // Bei Mehrfachauswahl die Radiobuttons durch Checkboxen ersetzen
            if (area.multiple) {
                const radioInputs = areaContainer.querySelectorAll('input[type="radio"]');
                radioInputs.forEach(radio => {
                    radio.type = 'checkbox';
                    radio.name = `area_${area.name}_${radio.value}`;
                });
            }
        });
    },
    
    /**
     * Rendert dynamische Bereiche mit bereits gesetzten Werten
     * @param {string} containerId - ID des Containers
     * @param {Object} resident - Bewohnerdaten mit den Werten
     */
    renderDynamicAreasWithValues(containerId, resident) {
        // Erst normale Bereiche rendern
        this.renderDynamicAreas(containerId);
        
        if (!resident || !resident.areas) return;
        
        // Dann Werte setzen
        Object.entries(resident.areas).forEach(([areaName, value]) => {
            // Mehrfachwerte (Array)
            if (Array.isArray(value)) {
                value.forEach(val => {
                    const input = document.querySelector(`input[name="area_${areaName}_${val}"]`);
                    if (input) input.checked = true;
                });
            }
            // Einzelwert
            else {
                const input = document.querySelector(`input[name="area_${areaName}"][value="${value}"]`) ||
                              document.querySelector(`input[name="area_${areaName}_${value}"]`);
                if (input) input.checked = true;
            }
        });
        
        // Nicht-änderbare Bereiche deaktivieren
        const config = ConfigManager.config;
        if (config && config.areas) {
            config.areas.forEach(area => {
                if (!area.changeable) {
                    const areaInputs = document.querySelectorAll(`input[name^="area_${area.name}"]`);
                    areaInputs.forEach(input => {
                        input.disabled = true;
                    });
                    
                    // Hinweis hinzufügen
                    const areaContainer = document.querySelector(`.area-button-group[data-area="${area.name}"]`);
                    if (areaContainer) {
                        const hint = document.createElement('div');
                        hint.className = 'form-text text-muted mt-1';
                        hint.innerHTML = '<i class="fas fa-lock me-1"></i>Dieser Bereich kann nicht geändert werden.';
                        areaContainer.parentNode.appendChild(hint);
                    }
                }
            });
        }
    },
    
    /**
     * Sammelt alle Daten aus dem Neuer-Bewohner-Formular
     * @returns {Object} - Gesammelte Formulardaten
     */
    collectNewResidentData() {
        const formData = {
            firstName: document.getElementById('firstName')?.value.trim(),
            lastName: document.getElementById('lastName')?.value.trim(),
            gender: document.querySelector('input[name="gender"]:checked')?.value,
            areas: {}
        };
        
        // Dynamische Bereiche sammeln
        const config = ConfigManager.config;
        
        if (config && config.areas) {
            config.areas.forEach(area => {
                const areaName = area.name;
                
                // Bei Mehrfachauswahl mehrere Werte sammeln
                if (area.multiple) {
                    const checkedInputs = document.querySelectorAll(`input[name^="area_${areaName}_"]:checked`);
                    if (checkedInputs.length > 0) {
                        formData.areas[areaName] = Array.from(checkedInputs).map(input => input.value);
                    }
                } 
                // Bei Einfachauswahl einzelnen Wert nehmen
                else {
                    const checkedInput = document.querySelector(`input[name="area_${areaName}"]:checked`);
                    if (checkedInput) {
                        formData.areas[areaName] = checkedInput.value;
                    }
                }
            });
        }
        
        return formData;
    },
    
    /**
     * Sammelt alle Daten aus dem Bewohner-Detail-Formular
     * @returns {Object} - Gesammelte Formulardaten
     */
    collectResidentDetailData() {
        const formData = {
            firstName: document.getElementById('residentDetailFirstName')?.value.trim(),
            lastName: document.getElementById('residentDetailLastName')?.value.trim(),
            gender: document.querySelector('input[name="detailGender"]:checked')?.value,
            vergin: document.getElementById('residentDetailAge')?.value || '',
            areas: {}
        };
        
        // Bestehende Daten übernehmen, die nicht änderbar sind
        if (this.currentResident && this.currentResident.areas) {
            const config = ConfigManager.config;
            
            if (config && config.areas) {
                config.areas.forEach(area => {
                    if (!area.changeable && this.currentResident.areas[area.name]) {
                        formData.areas[area.name] = this.currentResident.areas[area.name];
                    }
                });
            }
        }
        
        // Dynamische Bereiche sammeln
        const config = ConfigManager.config;
        
        if (config && config.areas) {
            config.areas.forEach(area => {
                // Nicht-änderbare Bereiche überspringen
                if (!area.changeable) return;
                
                const areaName = area.name;
                
                // Bei Mehrfachauswahl mehrere Werte sammeln
                if (area.multiple) {
                    const checkedInputs = document.querySelectorAll(`input[name^="area_${areaName}_"]:checked`);
                    if (checkedInputs.length > 0) {
                        formData.areas[areaName] = Array.from(checkedInputs).map(input => input.value);
                    }
                } 
                // Bei Einfachauswahl einzelnen Wert nehmen
                else {
                    const checkedInput = document.querySelector(`input[name="area_${areaName}"]:checked`);
                    if (checkedInput) {
                        formData.areas[areaName] = checkedInput.value;
                    }
                }
            });
        }
        
        return formData;
    },
    
    /**
     * Speichert einen neuen Bewohner
     * @returns {Promise<void>}
     */
    async saveNewResident() {
        try {
            // Formulardaten sammeln
            const formData = this.collectNewResidentData();
            
            // Validierung
            if (!formData.firstName || !formData.lastName || !formData.gender) {
                ToastManager.error('Bitte füllen Sie alle Pflichtfelder aus (Vorname, Nachname, Geschlecht)');
                
                // Fehlerklassen hinzufügen
                if (!formData.firstName) {
                    document.getElementById('firstName').classList.add('is-invalid');
                }
                if (!formData.lastName) {
                    document.getElementById('lastName').classList.add('is-invalid');
                }
                if (!formData.gender) {
                    document.querySelectorAll('input[name="gender"]').forEach(input => {
                        input.classList.add('is-invalid');
                    });
                }
                
                return;
            }
            
            // Neuen Bewohner speichern
            const response = await ResidentManager.saveResident(formData, false);
            
            // Modal schließen
            const newResidentModal = document.getElementById('newResidentModal');
            if (newResidentModal && this.bootstrap) {
                const modal = this.bootstrap.Modal.getInstance(newResidentModal);
                if (modal) modal.hide();
            }
            
            ToastManager.success(`Bewohner ${formData.firstName} ${formData.lastName} wurde erfolgreich angelegt.`);
        } catch (error) {
            console.error('Fehler beim Speichern des neuen Bewohners:', error);
            ToastManager.error(`Fehler beim Speichern: ${error.message}`);
        }
    },
    
    /**
     * Speichert Änderungen am Bewohner
     * @returns {Promise<void>}
     */
    async saveResidentDetails() {
        try {
            if (!this.currentResident) {
                ToastManager.error('Kein Bewohner ausgewählt');
                return;
            }
            
            // Formulardaten sammeln
            const formData = this.collectResidentDetailData();
            
            // Validierung
            if (!formData.firstName || !formData.lastName || !formData.gender) {
                ToastManager.error('Bitte füllen Sie alle Pflichtfelder aus (Vorname, Nachname, Geschlecht)');
                
                // Fehlerklassen hinzufügen
                if (!formData.firstName) {
                    document.getElementById('residentDetailFirstName').classList.add('is-invalid');
                }
                if (!formData.lastName) {
                    document.getElementById('residentDetailLastName').classList.add('is-invalid');
                }
                if (!formData.gender) {
                    document.querySelectorAll('input[name="detailGender"]').forEach(input => {
                        input.classList.add('is-invalid');
                    });
                }
                
                return;
            }
            
            // Bewohner aktualisieren
            await ResidentManager.saveResident(formData, true);
            
            // Modal schließen
            const residentDetailModal = document.getElementById('residentDetailModal');
            if (residentDetailModal && this.bootstrap) {
                const modal = this.bootstrap.Modal.getInstance(residentDetailModal);
                if (modal) modal.hide();
            }
            
            ToastManager.success(`Bewohner ${formData.firstName} ${formData.lastName} wurde erfolgreich aktualisiert.`);
        } catch (error) {
            console.error('Fehler beim Speichern der Bewohneränderungen:', error);
            ToastManager.error(`Fehler beim Speichern: ${error.message}`);
        }
    },
    
    /**
     * Entlässt den aktuellen Bewohner
     * @returns {Promise<void>}
     */
    async dismissResident() {
        try {
            if (!this.currentResident) {
                ToastManager.error('Kein Bewohner ausgewählt');
                return;
            }
            
            // Bestätigung vom Benutzer einholen
            const residentName = `${this.currentResident.firstName} ${this.currentResident.lastName}`;
            const confirmed = confirm(`Möchten Sie ${residentName} wirklich entlassen? Dieser Vorgang kann rückgängig gemacht werden.`);
            
            if (!confirmed) return;
            
            // Bewohner entlassen
            const residentId = `${this.currentResident.firstName}_${this.currentResident.lastName}`;
            await ResidentManager.dismissResident(residentId);
            
            // Modal schließen
            const residentDetailModal = document.getElementById('residentDetailModal');
            if (residentDetailModal && this.bootstrap) {
                const modal = this.bootstrap.Modal.getInstance(residentDetailModal);
                if (modal) modal.hide();
            }
            
            ToastManager.success(`Bewohner ${residentName} wurde erfolgreich entlassen.`);
        } catch (error) {
            console.error('Fehler beim Entlassen des Bewohners:', error);
            ToastManager.error(`Fehler beim Entlassen: ${error.message}`);
        }
    },
    
    /**
     * Holt einen entlassenen Bewohner zurück
     * @param {string} residentId - ID des Bewohners
     * @returns {Promise<void>}
     */
    async resurrectResident(residentId) {
        try {
            // Bewohner wiederherstellen
            await ApiService.resurrectResident(residentId);
            
            // Bewohnerliste neu laden
            await ResidentManager.loadResidents();
            ResidentManager.displayAllResidents();
            
            // Liste der entlassenen Bewohner aktualisieren
            const dismissedListElement = document.getElementById('dismissedResidentsList');
            if (dismissedListElement) {
                // Eintrag entfernen
                const entry = dismissedListElement.querySelector(`button[data-id="${residentId}"]`);
                if (entry) {
                    const listItem = entry.closest('.list-group-item');
                    if (listItem) {
                        listItem.remove();
                        
                        // Prüfen, ob noch entlassene Bewohner vorhanden sind
                        if (dismissedListElement.children.length === 0) {
                            const noResultsElement = document.getElementById('noDismissedResidents');
                            if (noResultsElement) {
                                noResultsElement.classList.remove('d-none');
                            }
                        }
                    }
                }
            }
            
            ToastManager.success(`Bewohner wurde erfolgreich wiederhergestellt.`);
        } catch (error) {
            console.error('Fehler bei der Wiederherstellung des Bewohners:', error);
            ToastManager.error(`Fehler bei der Wiederherstellung: ${error.message}`);
        }
    },
    
    /**
     * Schließt das aktuelle Modal
     * @param {string} modalId - ID des zu schließenden Modals
     */
    closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement && this.bootstrap) {
            const modal = this.bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    }
}; 