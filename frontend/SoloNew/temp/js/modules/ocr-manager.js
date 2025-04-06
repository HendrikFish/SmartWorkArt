/**
 * OCR-Manager
 * Verantwortlich für die OCR-Erkennung und -Verarbeitung
 */

import { ApiService } from './api-service.js';
import { ToastManager } from './toast-manager.js';
import { ResidentManager } from './resident-manager.js';
import { ConfigManager } from './config-manager.js';

export const OcrManager = {
    imagePreview: null,
    resultArea: null,
    fileInput: null,
    processBtn: null,
    continueBtn: null,
    processingImage: false,
    ocrResults: null,
    selectedConfig: null,
    
    /**
     * Initialisiert den OCR-Manager
     * @returns {Promise<void>}
     */
    async init() {
        console.log('OCR-Manager wird initialisiert...');
        
        try {
            // DOM-Elemente finden
            this.fileInput = document.getElementById('ocrFileInput');
            this.imagePreview = document.getElementById('ocrImagePreview');
            this.resultArea = document.getElementById('ocrResultArea');
            this.processBtn = document.getElementById('processOcrBtn');
            this.continueBtn = document.getElementById('continueWithOcrBtn');
            
            // Event-Listener einrichten
            this.initEventListeners();
            
            console.log('OCR-Manager erfolgreich initialisiert');
            return Promise.resolve();
        } catch (error) {
            console.error('Fehler bei der Initialisierung des OCR-Managers:', error);
            return Promise.reject(error);
        }
    },
    
    /**
     * Initialisiert Event-Listener für OCR-Funktionen
     */
    initEventListeners() {
        // Datei-Upload
        if (this.fileInput) {
            this.fileInput.addEventListener('change', () => this.handleFileSelect());
        }
        
        // Verarbeiten-Button
        if (this.processBtn) {
            this.processBtn.addEventListener('click', () => this.processImage());
        }
        
        // Fortfahren-Button
        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => this.applyOcrResults());
        }
        
        // Drag-and-Drop-Zone
        const dropZone = document.getElementById('ocrDropZone');
        if (dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            
            // Highlight bei Drag
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.add('highlight');
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.classList.remove('highlight');
                });
            });
            
            // File Drop
            dropZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                
                if (files.length > 0 && this.fileInput) {
                    this.fileInput.files = files;
                    this.handleFileSelect();
                }
            });
        }
        
        // Konfigurationsauswahl
        const ocrConfigSelect = document.getElementById('ocrConfigSelect');
        if (ocrConfigSelect) {
            ocrConfigSelect.addEventListener('change', () => {
                this.selectedConfig = ocrConfigSelect.value;
            });
        }
    },
    
    /**
     * Behandelt die Dateiauswahl für die OCR-Erkennung
     */
    handleFileSelect() {
        if (!this.fileInput || !this.fileInput.files || this.fileInput.files.length === 0) {
            return;
        }
        
        const file = this.fileInput.files[0];
        
        // Überprüfen, ob es sich um ein Bild handelt
        if (!file.type.match('image.*')) {
            ToastManager.error('Bitte wählen Sie ein Bild (jpg, png, etc.)');
            return;
        }
        
        // Datei-Größe überprüfen (max. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            ToastManager.error('Die Datei ist zu groß. Maximale Größe: 5MB');
            return;
        }
        
        // Bild-Vorschau anzeigen
        const reader = new FileReader();
        
        reader.onload = (e) => {
            if (this.imagePreview) {
                this.imagePreview.style.display = 'block';
                this.imagePreview.src = e.target.result;
                
                // Verarbeiten-Button aktivieren
                if (this.processBtn) {
                    this.processBtn.disabled = false;
                }
                
                // Ergebnisbereich zurücksetzen
                if (this.resultArea) {
                    this.resultArea.innerHTML = '';
                    this.resultArea.style.display = 'none';
                }
                
                // Fortfahren-Button deaktivieren
                if (this.continueBtn) {
                    this.continueBtn.style.display = 'none';
                }
                
                // Status zurücksetzen
                this.ocrResults = null;
            }
        };
        
        reader.readAsDataURL(file);
    },
    
    /**
     * Zeigt alle verfügbaren OCR-Konfigurationen an
     */
    showOcrConfigurations() {
        const configSelect = document.getElementById('ocrConfigSelect');
        if (!configSelect) return;
        
        // Konfigurationen aus ConfigManager lesen
        const config = ConfigManager.config;
        
        if (!config || !config.ocrConfigurations || config.ocrConfigurations.length === 0) {
            // Keine Konfiguration vorhanden
            configSelect.innerHTML = '<option value="">Keine Konfigurationen verfügbar</option>';
            return;
        }
        
        // Bestehenden Inhalt löschen
        configSelect.innerHTML = '';
        
        // Standardoption
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Bitte Konfiguration auswählen';
        configSelect.appendChild(defaultOption);
        
        // Konfigurationen hinzufügen
        config.ocrConfigurations.forEach(ocrConfig => {
            const option = document.createElement('option');
            option.value = ocrConfig.id;
            option.textContent = ocrConfig.name;
            configSelect.appendChild(option);
        });
        
        // Erste Konfiguration auswählen, falls vorhanden
        if (config.ocrConfigurations.length > 0) {
            this.selectedConfig = config.ocrConfigurations[0].id;
            configSelect.value = this.selectedConfig;
        }
    },
    
    /**
     * Führt die OCR-Erkennung auf dem ausgewählten Bild durch
     */
    async processImage() {
        if (!this.fileInput || !this.fileInput.files || this.fileInput.files.length === 0) {
            ToastManager.error('Bitte wählen Sie zuerst ein Bild aus');
            return;
        }
        
        if (!this.selectedConfig) {
            ToastManager.error('Bitte wählen Sie eine OCR-Konfiguration aus');
            return;
        }
        
        try {
            // Verarbeitung beginnen
            this.processingImage = true;
            
            if (this.processBtn) {
                this.processBtn.disabled = true;
                this.processBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird verarbeitet...';
            }
            
            const file = this.fileInput.files[0];
            const formData = new FormData();
            formData.append('image', file);
            formData.append('configId', this.selectedConfig);
            
            // OCR-Anfrage senden
            const response = await ApiService.processOcr(formData);
            
            // Ergebnisse anzeigen
            this.displayOcrResults(response);
            
        } catch (error) {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
            ToastManager.error('OCR-Verarbeitung fehlgeschlagen');
        } finally {
            // Verarbeitung beenden
            this.processingImage = false;
            
            if (this.processBtn) {
                this.processBtn.disabled = false;
                this.processBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Bild verarbeiten';
            }
        }
    },
    
    /**
     * Zeigt die OCR-Ergebnisse an
     * @param {Object} results - OCR-Ergebnisse
     */
    displayOcrResults(results) {
        if (!this.resultArea) return;
        
        // Ergebnisse speichern
        this.ocrResults = results;
        
        // Ergebnisbereich anzeigen
        this.resultArea.style.display = 'block';
        this.resultArea.innerHTML = '';
        
        // Prüfen, ob Ergebnisse vorhanden sind
        if (!results || !results.fields || Object.keys(results.fields).length === 0) {
            this.resultArea.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Keine Ergebnisse gefunden. Bitte versuchen Sie es mit einem anderen Bild oder einer anderen Konfiguration.
                </div>
            `;
            return;
        }
        
        // Übergeordnete Ergebnisse
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'card mb-4';
        
        resultsContainer.innerHTML = `
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-spell-check me-2"></i>OCR-Ergebnisse
                </h5>
            </div>
            <div class="card-body">
                <form id="ocrResultsForm">
                    <div class="row">
                        ${Object.entries(results.fields).map(([key, value]) => `
                            <div class="col-md-6 mb-3">
                                <label for="ocr_${key}" class="form-label">${this.formatFieldName(key)}</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="ocr_${key}" 
                                           name="ocr_${key}" value="${value || ''}" 
                                           data-field="${key}">
                                    <button class="btn btn-outline-secondary copy-btn" type="button" 
                                            data-field="${key}">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </form>
            </div>
        `;
        
        this.resultArea.appendChild(resultsContainer);
        
        // Fortfahren-Button anzeigen
        if (this.continueBtn) {
            this.continueBtn.style.display = 'block';
        }
        
        // Event-Listener für Kopier-Buttons
        const copyButtons = this.resultArea.querySelectorAll('.copy-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const fieldName = button.dataset.field;
                const input = document.getElementById(`ocr_${fieldName}`);
                
                if (input) {
                    // Text in die Zwischenablage kopieren
                    navigator.clipboard.writeText(input.value)
                        .then(() => {
                            // Button-Stil kurz ändern
                            button.innerHTML = '<i class="fas fa-check"></i>';
                            button.classList.add('btn-success');
                            button.classList.remove('btn-outline-secondary');
                            
                            // Nach kurzer Zeit zurücksetzen
                            setTimeout(() => {
                                button.innerHTML = '<i class="fas fa-copy"></i>';
                                button.classList.remove('btn-success');
                                button.classList.add('btn-outline-secondary');
                            }, 1500);
                        })
                        .catch(err => {
                            console.error('Fehler beim Kopieren in die Zwischenablage:', err);
                            ToastManager.error('Kopieren fehlgeschlagen');
                        });
                }
            });
        });
        
        // Wenn Bewohner erkannt wurde, vorausfüllen
        if (results.resident) {
            ToastManager.success(`Bewohner erkannt: ${results.resident.firstName} ${results.resident.lastName}`);
            
            // Bewohner-Card anzeigen
            const residentCard = document.createElement('div');
            residentCard.className = 'card mb-4 border-success';
            
            residentCard.innerHTML = `
                <div class="card-header bg-success text-white">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-user-check me-2"></i>Bewohner erkannt
                    </h5>
                </div>
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                            <div class="resident-avatar me-3">
                                <span class="resident-initials">${results.resident.firstName[0]}${results.resident.lastName[0]}</span>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <h5 class="mb-1">${results.resident.firstName} ${results.resident.lastName}</h5>
                            <p class="text-muted mb-0">${results.resident.gender || ''}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-light">
                    <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-primary" id="assignOcrToResidentBtn">
                            <i class="fas fa-link me-2"></i>Diesem Bewohner zuweisen
                        </button>
                    </div>
                </div>
            `;
            
            this.resultArea.insertBefore(residentCard, this.resultArea.firstChild);
            
            // Event-Listener für Zuweisung
            const assignButton = document.getElementById('assignOcrToResidentBtn');
            if (assignButton) {
                assignButton.addEventListener('click', () => {
                    this.assignToResident(results.resident);
                });
            }
        }
    },
    
    /**
     * Formatiert den Feldnamen für die Anzeige
     * @param {string} fieldName - Technischer Feldname
     * @returns {string} - Formatierter Feldname
     */
    formatFieldName(fieldName) {
        // Unterstrich durch Leerzeichen ersetzen und ersten Buchstaben groß machen
        const formatted = fieldName.replace(/_/g, ' ');
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    
    /**
     * Weist OCR-Ergebnisse einem Bewohner zu
     * @param {Object} resident - Bewohner
     */
    async assignToResident(resident) {
        if (!this.ocrResults || !resident) return;
        
        try {
            // Speichern der OCR-Ergebnisse für den Bewohner
            const updatedData = {
                ...resident,
                ocrData: {
                    timestamp: new Date().toISOString(),
                    fields: this.collectUpdatedOcrFields()
                }
            };
            
            await ResidentManager.saveResident(updatedData, true);
            
            ToastManager.success(`OCR-Daten wurden ${resident.firstName} ${resident.lastName} zugewiesen`);
            
            // Modal schließen
            const ocrModal = document.getElementById('ocrModal');
            if (ocrModal && window.bootstrap) {
                const modal = window.bootstrap.Modal.getInstance(ocrModal);
                if (modal) modal.hide();
            }
        } catch (error) {
            console.error('Fehler beim Zuweisen der OCR-Daten:', error);
            ToastManager.error('Zuweisen der OCR-Daten fehlgeschlagen');
        }
    },
    
    /**
     * Sammelt die aktualisierten OCR-Felder aus dem Formular
     * @returns {Object} - Aktualisierte OCR-Felder
     */
    collectUpdatedOcrFields() {
        const fields = {};
        const form = document.getElementById('ocrResultsForm');
        
        if (form) {
            const inputs = form.querySelectorAll('input[data-field]');
            
            inputs.forEach(input => {
                const fieldName = input.dataset.field;
                fields[fieldName] = input.value;
            });
        }
        
        return fields;
    },
    
    /**
     * Wendet die OCR-Ergebnisse an und erstellt einen neuen Bewohner
     */
    applyOcrResults() {
        if (!this.ocrResults) {
            ToastManager.error('Keine OCR-Ergebnisse vorhanden');
            return;
        }
        
        // OCR-Ergebnisse sammeln
        const fields = this.collectUpdatedOcrFields();
        
        // Modal schließen
        const ocrModal = document.getElementById('ocrModal');
        if (ocrModal && window.bootstrap) {
            const modal = window.bootstrap.Modal.getInstance(ocrModal);
            if (modal) modal.hide();
        }
        
        // Neuer-Bewohner-Modal öffnen
        const modalManager = window.ModalManager;
        if (modalManager) {
            modalManager.showNewResidentModal();
            
            // Verzögerung für sicheres DOM-Update
            setTimeout(() => {
                // Felder ausfüllen
                if (fields.firstName) {
                    const firstNameInput = document.getElementById('firstName');
                    if (firstNameInput) firstNameInput.value = fields.firstName;
                }
                
                if (fields.lastName) {
                    const lastNameInput = document.getElementById('lastName');
                    if (lastNameInput) lastNameInput.value = fields.lastName;
                }
                
                // Geschlecht setzen
                if (fields.gender) {
                    const lowercaseGender = fields.gender.toLowerCase();
                    if (lowercaseGender.includes('herr') || lowercaseGender.includes('männlich')) {
                        const genderHerr = document.getElementById('genderHerr');
                        if (genderHerr) genderHerr.checked = true;
                    } else if (lowercaseGender.includes('frau') || lowercaseGender.includes('weiblich')) {
                        const genderFrau = document.getElementById('genderFrau');
                        if (genderFrau) genderFrau.checked = true;
                    }
                }
                
                // Alter setzen
                if (fields.age) {
                    const ageInput = document.getElementById('residentAge');
                    if (ageInput) ageInput.value = fields.age;
                }
                
                // Bereiche setzen basierend auf OCR-Ergebnissen und Konfiguration
                const config = ConfigManager.config;
                if (config && config.areas) {
                    config.areas.forEach(area => {
                        // Automatisches Zuordnungsmuster für jeden Bereich
                        if (area.ocrMapping) {
                            const areaName = area.name;
                            
                            Object.entries(area.ocrMapping).forEach(([ocrField, buttonLabel]) => {
                                // Prüfen, ob OCR-Feld einen Wert hat, der dem Muster entspricht
                                if (fields[ocrField] && fields[ocrField].toLowerCase() === buttonLabel.toLowerCase()) {
                                    // Button in diesem Bereich setzen
                                    const input = document.querySelector(`input[name="area_${areaName}"][value="${buttonLabel}"]`) ||
                                                  document.querySelector(`input[name="area_${areaName}_${buttonLabel}"]`);
                                    if (input) input.checked = true;
                                }
                            });
                        }
                    });
                }
            }, 500);
        }
    },
    
    /**
     * Setzt das OCR-Modal in den Ausgangszustand zurück
     */
    resetOcrModal() {
        // Formulare zurücksetzen
        const fileForm = document.getElementById('ocrFileForm');
        if (fileForm) fileForm.reset();
        
        // Vorschau zurücksetzen
        if (this.imagePreview) {
            this.imagePreview.style.display = 'none';
            this.imagePreview.src = '';
        }
        
        // Ergebnisbereich zurücksetzen
        if (this.resultArea) {
            this.resultArea.style.display = 'none';
            this.resultArea.innerHTML = '';
        }
        
        // Buttons zurücksetzen
        if (this.processBtn) {
            this.processBtn.disabled = true;
        }
        
        if (this.continueBtn) {
            this.continueBtn.style.display = 'none';
        }
        
        // Status zurücksetzen
        this.ocrResults = null;
        
        // Konfigurationen anzeigen
        this.showOcrConfigurations();
    }
}; 