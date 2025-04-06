import { Modal } from './modal.js';
import { Toast } from './module.js';
import { SaveManager } from './save.js';
// Import von ResidentManager aus script.js entfernen und stattdessen einen Direktzugriff auf window.ResidentManager verwenden
// import { ResidentManager } from '../script.js';
import { UploadManager } from './upload.js';

export const OCRModalManager = {
    // Speichere den letzten erkannten vollständigen Text
    lastRecognizedText: '',
    // Status-Flags zur Verhinderung von Layout-Problemen
    isProcessingClick: false,
    // Position und Größe des Modals speichern
    modalPosition: null,
    // Modals Referenzen
    modals: {
        fullTextModal: null,
        ocrResultsModal: null
    },

    // Neue Eigenschaft für die Verwaltung der ausgewählten Namen
    selectedNames: [],

    // Initialisiere die Modal-Referenzen
    initializeModals() {
        this.modals.fullTextModal = document.getElementById('fullTextModal');
        this.modals.ocrResultsModal = document.getElementById('ocrResultsModal');
        
        if (!this.modals.fullTextModal) {
            console.error('Volltext-Modal nicht gefunden');
        }
        if (!this.modals.ocrResultsModal) {
            console.error('OCR-Ergebnisse-Modal nicht gefunden');
        }
    },

    // Neue Hilfsfunktion zur Stabilisierung des Modals
    stabilizeModal() {
        const modal = document.getElementById('ocrResultsModal');
        if (!modal) return;
        
        // Wenn wir noch keine Position gespeichert haben, speichern wir die aktuelle
        if (!this.modalPosition) {
            this.modalPosition = modal.getBoundingClientRect();
        } else {
            // Stelle sicher, dass das Modal in der Mitte des Bildschirms bleibt
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.position = 'relative';
                modalContent.style.margin = 'auto';
                modalContent.style.transform = 'none';
            }
            
            // Verhindere, dass das Fenster scrollt
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            
            // Nach dem Async-Prozess wiederherstellen
            setTimeout(() => {
                window.scrollTo(scrollX, scrollY);
            }, 0);
        }
    },

    async showResults(names, duplicates) {
        return new Promise(async (resolve) => {
            // Verstecke den Ladekreisel, falls er noch angezeigt wird
            UploadManager.hideLoadingOverlay();
            
            // Prüfe, welche Namen bereits existieren
            const existingResidentsMap = {};
            console.log('Prüfe, welche Namen bereits existieren...');
            try {
                const response = await fetch('/api/solo/residents');
                if (response.ok) {
                    const residents = await response.json();
                    
                    // Prüfe jeden Namen gegen die bestehenden Bewohner
                    for (const name of names) {
                        const exists = residents.some(resident => 
                            resident.firstName.toLowerCase() === name.firstName.toLowerCase() && 
                            resident.lastName.toLowerCase() === name.lastName.toLowerCase()
                        );
                        
                        if (exists) {
                            console.log(`Bewohner ${name.firstName} ${name.lastName} existiert bereits`);
                            existingResidentsMap[`${name.firstName}_${name.lastName}`] = true;
                        }
                    }
                }
            } catch (error) {
                console.error('Fehler beim Prüfen existierender Bewohner:', error);
            }
            
            const modal = document.getElementById('ocrResultsModal');
            const content = modal.querySelector('.modal-content');
            
            content.innerHTML = `
                <div class="modal-header">
                    <h2>Erkannte Namen</h2>
                    <div class="header-actions">
                        <button type="button" class="icon-btn close-modal">×</button>
                    </div>
                </div>
                <div class="ocr-results-list">
                    ${names.map((name, index) => {
                        // Prüfe, ob dieser Name als Duplikat markiert ist
                        const isDuplicate = duplicates.some(dup => 
                            dup.firstName === name.firstName && dup.lastName === name.lastName);
                        
                        // Prüfe, ob dieser Name bereits existiert
                        const nameKey = `${name.firstName}_${name.lastName}`;
                        const isExisting = existingResidentsMap[nameKey];
                        
                        // Setze CSS-Klassen basierend auf dem Status
                        let itemClass = '';
                        if (isExisting) itemClass = 'existing-resident';
                        else if (isDuplicate) itemClass = 'duplicate';
                        
                        return `
                        <div class="ocr-result-item ${itemClass}">
                            <div class="ocr-result-checkbox">
                                <input type="checkbox" id="name_${index}" ${(isExisting || isDuplicate) ? '' : 'checked'}>
                            </div>
                            <div class="ocr-result-name">
                                <div class="ocr-name-fields">
                                    <input type="text" class="ocr-name-input firstName" data-index="${index}" value="${name.firstName}">
                                    <input type="text" class="ocr-name-input lastName" data-index="${index}" value="${name.lastName}">
                                </div>
                                ${isExisting ? `
                                <div class="ocr-existing-warning">
                                    Person existiert bereits im System
                                </div>
                                ` : isDuplicate ? `
                                <div class="ocr-duplicate-warning">
                                    Mögliches Duplikat gefunden
                                </div>
                                ` : ''}
                            </div>
                            <div class="ocr-result-confidence">
                                ${name.confidence || '100%'}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                <div class="modal-footer">
                    <button type="button" class="secondary-btn" id="selectAllBtn">Alle</button>
                    <button type="button" class="primary-btn" id="confirmOcrResults">Speichern</button>
                    <button type="button" class="secondary-btn" id="manualSelectBtn">Manuell</button>
                    <button type="button" class="danger-btn" id="cancelOcrResults">Abbrechen</button>
                </div>
            `;
            
            // Event-Listener hinzufügen
            this.attachEventListeners(content, names, resolve);
            
            // Modal anzeigen
            if (typeof Modal !== 'undefined' && Modal.show) {
                Modal.show('ocrResultsModal');
            } else {
                modal.style.display = 'flex';
                modal.classList.add('show');
            }
        });
    },

    // Zeige den Volltext-Modal an mit dem erkannten Text
    showFullTextModal(text) {
        try {
            if (!this.modals.fullTextModal) {
                this.initializeModals();
            }

            const modal = document.getElementById('fullTextModal');
            if (!modal) {
                console.error('Volltext-Modal nicht gefunden');
                return;
            }

            // Setze den Auswahlmodus zurück
            this.selectionMode = 'firstName';
            this.currentSelection = {
                firstName: null,
                lastName: null
            };

            // Leere die Liste der ausgewählten Namen
            const selectedNamesList = document.getElementById('selectedNamesList');
            if (selectedNamesList) {
                selectedNamesList.innerHTML = '';
            }

            // Aktualisiere den Modus-Indikator
            const modeText = modal.querySelector('.mode-text');
            if (modeText) {
                modeText.textContent = 'Vorname auswählen';
            }

            // Zeige das Modal
            Modal.show('fullTextModal');

            // Hole den Container für den Text
            const textContainer = document.getElementById('ocrFullText');
            if (!textContainer) {
                console.error('OCR Volltext-Container nicht gefunden');
                return;
            }

            // Prüfe, ob Text erkannt wurde
            if (text && text.trim().length > 0) {
                textContainer.innerHTML = ''; // Container leeren
                
                // Erstelle klickbare Wörter
                const words = text.split(/\s+/);
                words.forEach(word => {
                    if (word.trim().length > 0) {
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'word-button';
                        wordSpan.textContent = word;
                        
                        // Event-Listener für die Wort-Buttons
                        wordSpan.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.handleWordButtonClick(word, wordSpan);
                        });

                        textContainer.appendChild(wordSpan);
                        textContainer.appendChild(document.createTextNode(' '));
                    }
                });
            } else {
                textContainer.innerHTML = '<div class="no-text-detected">Kein Text im Bild erkannt.</div>';
            }

            // Event-Listener für die Buttons im Modal-Footer
            this.attachFullTextModalListeners();
        } catch (error) {
            console.error('Fehler beim Anzeigen des OCR-Volltextmodals:', error);
            Toast.show('Fehler beim Anzeigen des erkannten Textes', 'error');
        }
    },

    // Neue Validierungsfunktion für Bewohnernamen
    validateResidentName(firstName, lastName) {
        // Entferne ungültige Zeichen und trimme
        const cleanFirstName = firstName.trim().replace(/[<>:"/\\|?*]/g, '');
        const cleanLastName = lastName.trim().replace(/[<>:"/\\|?*]/g, '');
        
        // Prüfe auf leere Namen
        if (!cleanFirstName || !cleanLastName) {
            throw new Error('Vor- und Nachname dürfen nicht leer sein');
        }
        
        // Prüfe auf ungültige Zeichen
        if (cleanFirstName.includes(':') || cleanLastName.includes(':')) {
            throw new Error('Namen dürfen keine Doppelpunkte enthalten');
        }
        
        return {
            firstName: cleanFirstName,
            lastName: cleanLastName
        };
    },

    // Aktualisierte createResidentFromNames Methode
    async createResidentFromNames(firstName, lastName) {
        try {
            // Validiere die Namen
            const { firstName: cleanFirstName, lastName: cleanLastName } = this.validateResidentName(firstName, lastName);
            
            // Prüfe zuerst, ob der Bewohner bereits existiert
            const existingResidents = await this.checkResidentExists(cleanFirstName, cleanLastName);
            
            if (existingResidents) {
                Toast.show(`Bewohner ${cleanFirstName} ${cleanLastName} existiert bereits!`, 'warning');
                return false;
            }
            
            // Speichere den neuen Bewohner
            await SaveManager.createResident({ firstName: cleanFirstName, lastName: cleanLastName });
            Toast.show(`Bewohner ${cleanFirstName} ${cleanLastName} wurde erfolgreich angelegt`, 'success');
            
            // Aktualisiere die Bewohnerliste
            await window.ResidentManager.loadResidents();
            return true;
        } catch (error) {
            // Bei Fehler vom Typ "existiert bereits" keinen Fehler werfen
            if (error.message && error.message.includes('existiert bereits')) {
                console.log(`Bewohner ${firstName} ${lastName} existiert bereits, wird übersprungen`);
                Toast.show(`Bewohner ${firstName} ${lastName} existiert bereits!`, 'warning');
                return false;
            }
            
            // Bei Validierungsfehlern
            if (error.message && (error.message.includes('dürfen nicht leer sein') || 
                                error.message.includes('dürfen keine Doppelpunkte enthalten'))) {
                Toast.show(error.message, 'error');
                return false;
            }
            
            console.error('Fehler beim Speichern des Bewohners:', error);
            Toast.show('Fehler beim Speichern des Bewohners', 'error');
            throw error;
        }
    },

    // Aktualisierte handleWordButtonClick Methode
    handleWordButtonClick(word, wordSpan) {
        // Wenn das Wort bereits verwendet wurde, zeige eine Warnung
        if (wordSpan.classList.contains('used')) {
            Toast.show('Dieser Name wurde bereits verwendet', 'warning');
                return;
            }

        // Validiere das Wort
        if (!word || word.trim().length === 0) {
            Toast.show('Ungültiger Name', 'error');
            return;
        }

        // Wenn wir im Vornamen-Modus sind
        if (this.selectionMode === 'firstName') {
            this.currentSelection.firstName = word;
            this.selectionMode = 'lastName';
            
            // Aktualisiere den Modus-Indikator
            const modeText = document.querySelector('.mode-text');
            if (modeText) {
                modeText.textContent = 'Nachname auswählen';
            }
            
            // Markiere das Wort als verwendet
            wordSpan.classList.add('used');
            
            // Zeige eine Vorschau des ausgewählten Vornamens
            const selectedNamesList = document.getElementById('selectedNamesList');
            if (selectedNamesList) {
                const nameTag = document.createElement('div');
                nameTag.className = 'selected-name-tag';
                nameTag.innerHTML = `${word} [Nachname auswählen]`;
                selectedNamesList.appendChild(nameTag);
            }
        }
        // Wenn wir im Nachnamen-Modus sind
        else if (this.selectionMode === 'lastName') {
            this.currentSelection.lastName = word;
            
            // Validiere den vollständigen Namen
            try {
                const { firstName, lastName } = this.validateResidentName(
                    this.currentSelection.firstName,
                    this.currentSelection.lastName
                );
                
                // Füge den vollständigen Namen zur Liste hinzu
                this.addSelectedName(firstName, lastName);
                
                // Setze den Modus zurück
                this.selectionMode = 'firstName';
                this.currentSelection = { firstName: null, lastName: null };
                
                // Aktualisiere den Modus-Indikator
                const modeText = document.querySelector('.mode-text');
                if (modeText) {
                    modeText.textContent = 'Vorname auswählen';
                }
                
                // Markiere das Wort als verwendet
                wordSpan.classList.add('used');
        } catch (error) {
                Toast.show(error.message, 'error');
                // Setze den Modus zurück bei Fehler
                this.selectionMode = 'firstName';
                this.currentSelection = { firstName: null, lastName: null };
            }
        }
    },

    attachFullTextModalListeners() {
        // "Namen übernehmen" Button
        const submitBtn = document.getElementById('submitOcrTextBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', async (e) => {
                // Verhindere das Standard-Verhalten des Buttons
                e.preventDefault();
                e.stopPropagation();

                const selectedNamesList = document.getElementById('selectedNamesList');
                if (!selectedNamesList) {
                    Toast.show('Keine Namen ausgewählt', 'warning');
                    return;
                }

                const nameTags = selectedNamesList.querySelectorAll('.selected-name-tag');
                if (nameTags.length === 0) {
                    Toast.show('Bitte wählen Sie mindestens einen Namen aus', 'warning');
                    return;
                }

                try {
                    let createdCount = 0;
                    let skippedCount = 0;
                    let results = [];

                    for (const nameTag of nameTags) {
                        const nameText = nameTag.textContent.trim().replace('×', '').trim();
                        // Prüfe, ob der Name vollständig ist (kein [Nachname auswählen] mehr)
                        if (nameText.includes('[Nachname auswählen]')) {
                            Toast.show('Bitte vervollständigen Sie alle Namen', 'warning');
                            return;
                        }
                        const [firstName, lastName] = nameText.split(' ');

                        // Prüfe, ob der Bewohner bereits existiert
                        const response = await fetch('/api/solo/residents');
                        if (response.ok) {
                            const residents = await response.json();
                            const exists = residents.some(resident => 
                                resident.firstName.toLowerCase() === firstName.toLowerCase() && 
                                resident.lastName.toLowerCase() === lastName.toLowerCase()
                            );
                            
                        if (exists) {
                                results.push({
                                    name: `${firstName} ${lastName}`,
                                    status: 'skipped',
                                    message: 'existiert bereits'
                                });
                                skippedCount++;
                                continue;
                            }
                        }

                        try {
                        // Speichere den neuen Bewohner
                            await SaveManager.createResident({ 
                                firstName: firstName.trim(), 
                                lastName: lastName.trim() 
                            });
                            results.push({
                                name: `${firstName} ${lastName}`,
                                status: 'created',
                                message: 'erfolgreich angelegt'
                            });
                            createdCount++;
                        } catch (saveError) {
                            console.error(`Fehler beim Speichern von ${firstName} ${lastName}:`, saveError);
                            results.push({
                                name: `${firstName} ${lastName}`,
                                status: 'error',
                                message: 'Fehler beim Speichern'
                            });
                        }
                    }

                    // Zeige die Ergebnisse an
                    const resultsContainer = document.createElement('div');
                    resultsContainer.className = 'ocr-results-summary';
                    resultsContainer.style.marginTop = '1rem';
                    resultsContainer.style.padding = '1rem';
                    resultsContainer.style.backgroundColor = '#f8f9fa';
                    resultsContainer.style.borderRadius = '4px';
                    resultsContainer.style.transition = 'opacity 0.5s ease-out';

                    results.forEach(result => {
                        const resultItem = document.createElement('div');
                        resultItem.style.color = result.status === 'created' ? '#28a745' : 
                                                result.status === 'skipped' ? '#ffc107' : '#dc3545';
                        resultItem.style.marginBottom = '0.5rem';
                        resultItem.textContent = `${result.name}: ${result.message}`;
                        resultsContainer.appendChild(resultItem);
                    });

                    // Füge die Ergebnisse nach der selected-names-container ein
                    const selectedNamesContainer = document.querySelector('.selected-names-container');
                    if (selectedNamesContainer) {
                        selectedNamesContainer.parentNode.insertBefore(resultsContainer, selectedNamesContainer.nextSibling);
                        
                        // Entferne die Ergebnisse nach 3 Sekunden
                        setTimeout(() => {
                            resultsContainer.style.opacity = '0';
                            setTimeout(() => {
                                resultsContainer.remove();
                            }, 500);
                        }, 3000);
                    }

                    // Aktualisiere die Bewohnerliste nur wenn mindestens ein Bewohner erfolgreich gespeichert wurde
                    if (createdCount > 0) {
                        await window.ResidentManager.loadResidents();
                    }
                    
                    // Leere die Liste der ausgewählten Namen
                    selectedNamesList.innerHTML = '';
                    
                    // Setze die Auswahl zurück
                    this.currentSelection = {
                        firstName: null,
                        lastName: null
                    };
                    this.selectionMode = 'firstName';
                    
                    // Aktualisiere den Modus-Indikator
                    const modeText = document.querySelector('.mode-text');
                    if (modeText) {
                        modeText.textContent = 'Vorname auswählen';
                    }
                    
                    // Entferne die "used" Klasse von allen Wörtern
                    document.querySelectorAll('.word-button').forEach(btn => {
                        btn.classList.remove('used');
                    });
                    
                } catch (error) {
                    console.error('Fehler beim Speichern der Bewohner:', error);
                    Toast.show('Fehler beim Speichern der Bewohner', 'error');
                }
            });
        }

        // "Abbrechen" Button
        const cancelBtn = document.getElementById('cancelOcrTextBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                Modal.hide('fullTextModal');
            });
        }
    },

    attachEventListeners(content, names, resolve) {
        // "Alle auswählen" Button
        content.querySelector('#selectAllBtn').addEventListener('click', () => {
            content.querySelectorAll('.ocr-result-item:not(.duplicate) input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = true;
            });
        });
        
        // Input-Überwachung für Echtzeit-Validierung
        const nameInputs = content.querySelectorAll('.ocr-name-input');
        nameInputs.forEach(input => {
            input.addEventListener('input', async (event) => {
                const item = event.target.closest('.ocr-result-item');
                const firstName = item.querySelector('.ocr-name-input.firstName').value.trim();
                const lastName = item.querySelector('.ocr-name-input.lastName').value.trim();
                
                // Nur prüfen, wenn sowohl Vorname als auch Nachname eingegeben wurden
                if (firstName && lastName) {
                    // Bestehende Warnungen entfernen
                    const existingWarning = item.querySelector('.ocr-existing-warning');
                    if (existingWarning) {
                        existingWarning.remove();
                    }
                    
                    // CSS-Klasse entfernen, um den Zustand zurückzusetzen
                    item.classList.remove('existing-resident');
                    
                    // Prüfen, ob der Bewohner bereits existiert
                    try {
                        const residentExists = await this.checkResidentExists(firstName, lastName);
                        
                        if (residentExists) {
                            console.log(`Bewohner ${firstName} ${lastName} existiert bereits`);
                            
                            // CSS-Klasse für existierenden Bewohner hinzufügen
                            item.classList.add('existing-resident');
                            
                            // Hinzufügen der Warnung innerhalb des ocr-result-name Elements
                            const nameContainer = item.querySelector('.ocr-result-name');
                            
                            // Sicherstellen, dass keine doppelten Warnungen erzeugt werden
                            if (!nameContainer.querySelector('.ocr-existing-warning')) {
                                const warningElement = document.createElement('div');
                                warningElement.className = 'ocr-existing-warning';
                                warningElement.textContent = 'Person existiert bereits im System';
                                nameContainer.appendChild(warningElement);
                            }
                        }
                    } catch (error) {
                        console.error('Fehler bei der Prüfung auf existierende Bewohner:', error);
                    }
                }
            });
        });
        
        // "Als Bewohner speichern" Button
        content.querySelector('#confirmOcrResults').addEventListener('click', async () => {
            console.log('Speichern-Button wurde geklickt');
            try {
                // Sammle alle ausgewählten Namen
                const selectedNames = [];
                console.log('Suche nach ausgewählten Namen...');
                content.querySelectorAll('.ocr-result-item').forEach((item, index) => {
                    const checkbox = item.querySelector(`input[type="checkbox"]`);
                    if (checkbox && checkbox.checked) {
                        const firstName = item.querySelector(`.firstName`).value.trim();
                        const lastName = item.querySelector(`.lastName`).value.trim();
                        
                        if (firstName && lastName) {
                            // Speichere den Item-Typ (existierend oder neu)
                            const isExisting = item.classList.contains('existing-resident');
                            
                            selectedNames.push({ 
                                firstName, 
                                lastName,
                                isExisting
                            });
                            console.log(`Name ${index+1} ausgewählt:`, firstName, lastName, isExisting ? '(existiert bereits)' : '');
                        }
                    }
                });
                
                if (selectedNames.length === 0) {
                    console.log('Keine Namen ausgewählt');
                    Toast.show('Bitte wählen Sie mindestens einen Namen aus', 'warning');
                    return;
                }
                
                console.log(`${selectedNames.length} Namen zum Speichern ausgewählt`);
                
                // Zähler für erfolgreich erstellte und übersprungene Bewohner
                let createdCount = 0;
                let skippedCount = 0;
                
                // Speichere die ausgewählten Bewohner
                for (const name of selectedNames) {
                    if (name.isExisting) {
                        console.log(`Überspringe existierenden Bewohner: ${name.firstName} ${name.lastName}`);
                        skippedCount++;
                        continue;
                    }
                    
                    try {
                        console.log('Speichere Bewohner:', name);
                        await SaveManager.createResident({ 
                            firstName: name.firstName, 
                            lastName: name.lastName 
                        });
                        createdCount++;
                    } catch (error) {
                        // Wenn der Bewohner bereits existiert, überspringen
                        if (error.message && error.message.includes('existiert bereits')) {
                            console.log(`Bewohner ${name.firstName} ${name.lastName} existiert bereits, wird übersprungen`);
                            skippedCount++;
                        } else {
                            // Bei anderen Fehlern abbrechen
                            throw error;
                        }
                    }
                }
                
                // Zeige passende Erfolgsmeldung an
                if (createdCount > 0 && skippedCount === 0) {
                    Toast.show(`${createdCount} Bewohner wurden erfolgreich angelegt`, 'success');
                } else if (createdCount > 0 && skippedCount > 0) {
                    Toast.show(`${createdCount} Bewohner angelegt, ${skippedCount} übersprungen (existieren bereits)`, 'info');
                } else if (createdCount === 0 && skippedCount > 0) {
                    Toast.show(`Alle ${skippedCount} Bewohner existieren bereits`, 'warning');
                }
                
                // Aktualisiere die Bewohnerliste
                console.log('Aktualisiere Bewohnerliste...');
                await window.ResidentManager.loadResidents();
                
                // Modal schließen
                console.log('Schließe Modal...');
                Modal.hide('ocrResultsModal');
                resolve();
            } catch (error) {
                console.error('Fehler beim Speichern der Bewohner:', error);
                Toast.show('Fehler beim Speichern der Bewohner', 'error');
            }
        });
        
        // "Manuell auswählen" Button
        content.querySelector('#manualSelectBtn').addEventListener('click', () => {
            // Wenn wir den letzten erkannten Text haben, zeige ihn im Volltext-Modal an
            if (this.lastRecognizedText) {
                console.log('Öffne Volltext-Modal für manuelle Auswahl');
                this.showFullTextModal(this.lastRecognizedText);
            } else {
                // Wenn kein Text vorhanden ist, informiere den Benutzer
                Toast.show('Kein erkannter Text verfügbar. Bitte versuchen Sie erneut, ein Dokument zu scannen.', 'warning');
            }
        });
        
        // "Abbrechen" Button
        content.querySelector('#cancelOcrResults').addEventListener('click', () => {
            Modal.hide('ocrResultsModal');
            resolve([]);
        });
    },
    
    async checkResidentExists(firstName, lastName) {
        try {
            if (!firstName || !lastName) return false;
            
            // API aufrufen, um zu prüfen, ob der Bewohner existiert
            const response = await fetch('/api/solo/residents');
            if (!response.ok) {
                throw new Error('Fehler beim Abrufen der Bewohnerliste');
            }
            
            const residents = await response.json();
            
            // Prüfe, ob ein Bewohner mit demselben Vor- und Nachnamen existiert
            // Case-insensitive Vergleich (Kleinschreibung)
            const fnLower = firstName.toLowerCase();
            const lnLower = lastName.toLowerCase();
            
            const existingResident = residents.some(resident => 
                resident.firstName.toLowerCase() === fnLower && 
                resident.lastName.toLowerCase() === lnLower
            );
            
            return existingResident;
        } catch (error) {
            console.error('Fehler beim Prüfen auf existierende Bewohner:', error);
            return false; // Im Zweifelsfall erlauben wir das Speichern
        }
    },

    // Neue Methode zum Hinzufügen eines ausgewählten Namens
    addSelectedName(firstName, lastName) {
            const selectedNamesList = document.getElementById('selectedNamesList');
        if (!selectedNamesList) return;

        // Entferne den temporären Tag mit [Nachname auswählen]
        const tempTag = selectedNamesList.querySelector('.selected-name-tag:last-child');
        if (tempTag && tempTag.textContent.includes('[Nachname auswählen]')) {
            tempTag.remove();
        }

            const nameTag = document.createElement('div');
            nameTag.className = 'selected-name-tag';
        
        // Erstelle den Button ohne onclick Attribut
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = '×';
        removeButton.addEventListener('click', () => this.removeSelectedName(removeButton));
        
        // Füge den Namen und Button hinzu
        nameTag.appendChild(document.createTextNode(`${firstName} ${lastName} `));
        nameTag.appendChild(removeButton);

            selectedNamesList.appendChild(nameTag);
    },

    // Aktualisierte removeSelectedName Methode
    removeSelectedName(button) {
        const nameTag = button.parentElement;
        const nameText = nameTag.textContent.trim().replace('×', '').trim();
        const [firstName, lastName] = nameText.split(' ');
        
        // Entferne die "used" Klasse von allen Wörtern, die diesem Namen entsprechen
        document.querySelectorAll('.word-button').forEach(btn => {
            const btnText = btn.textContent.trim();
            if (btnText === firstName || btnText === lastName) {
                btn.classList.remove('used');
            }
        });

        nameTag.remove();
    },

    // Aktualisierte updateSelectedNamesPreview Methode
    updateSelectedNamesPreview() {
        const previewList = document.getElementById('selectedNamesList');
        if (!previewList) return;
        
        previewList.innerHTML = ''; // Liste leeren
        
        this.selectedNames.forEach(name => {
            const nameTag = document.createElement('div');
            nameTag.className = 'selected-name-tag';
            
            // Erstelle den Button ohne onclick Attribut
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => this.removeSelectedName(removeButton));
            
            // Füge den Namen und Button hinzu
            nameTag.appendChild(document.createTextNode(`${name.firstName} ${name.lastName} `));
            nameTag.appendChild(removeButton);
            
            previewList.appendChild(nameTag);
        });
    },

    // Aktualisierte processManuallyEnteredNames Methode
    async processManuallyEnteredNames() {
        try {
            // Prüfe, ob Namen ausgewählt wurden
            if (this.selectedNames.length === 0) {
                Toast.show('Bitte wählen Sie mindestens einen Namen aus', 'warning');
                return;
            }
            
            // Verarbeite die ausgewählten Namen
            const names = this.selectedNames.map(name => ({
                ...name,
                confidence: 1.0,
                manuallyEntered: true
            }));
            
            // Prüfe auf Duplikate
            const duplicates = [];
            const response = await fetch('/api/solo/residents');
            if (response.ok) {
                const residents = await response.json();
                
                for (const name of names) {
                    const exists = residents.some(resident => 
                        resident.firstName.toLowerCase() === name.firstName.toLowerCase() && 
                        resident.lastName.toLowerCase() === name.lastName.toLowerCase()
                    );
                    
                    if (exists) {
                        duplicates.push(name);
                    }
                }
            }
            
            // Modal schließen und Ergebnisse anzeigen
            Modal.hide('fullTextModal');
            this.showResults(names, duplicates);
            
            // Liste der ausgewählten Namen zurücksetzen
            this.selectedNames = [];
            
        } catch (error) {
            console.error('Fehler bei der Verarbeitung der ausgewählten Namen:', error);
            Toast.show('Fehler bei der Namensverarbeitung', 'error');
        }
    },

    // Neue Methode, um das manuelle Namenseingabeformular zu aktivieren
    activateManualNameEntry() {
        try {
            // Erstelle oder aktualisiere das Namenseingabeformular
            const formContainer = document.getElementById('manualNameEntry');
            if (!formContainer) {
                console.error('Container für manuelle Namenseingabe nicht gefunden');
                return;
            }
            
            // Formular erstellen/aktualisieren
            formContainer.innerHTML = `
                <div class="name-form-container">
                    <h3>Namen manuell eingeben</h3>
                    <p class="form-instruction">Geben Sie die Namen der Personen ein, die Sie suchen möchten:</p>
                    
                    <div id="nameInputList">
                        <div class="name-input-row">
                            <input type="text" class="form-input firstName-input" placeholder="Vorname" autocomplete="off">
                            <input type="text" class="form-input lastName-input" placeholder="Nachname" autocomplete="off">
                            <button type="button" class="remove-name-btn icon-btn close-modal" title="Entfernen"></button>
                        </div>
                    </div>
                    
                    <button type="button" id="addNameBtn" class="secondary-btn" style="margin-top: 1rem;">
                        <span>+ Weiteren Namen hinzufügen</span>
                    </button>
                </div>
            `;
            
            // Event-Listener für das Hinzufügen neuer Namensfelder
            const addBtn = document.getElementById('addNameBtn');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.addNameInputRow());
            }
            
            // Event-Listener für das Entfernen von Namensfeldern (für die erste Zeile)
            this.attachRemoveButtonListeners();
            
            // Event-Listener für die Namensübermittlung aktualisieren
            this.updateSubmitButtonListener();
            
            // Event-Listener für Echtzeit-Validierung der Namen
            this.attachNameInputListeners();
            
            // Zeige das Formular an
            formContainer.style.display = 'block';
            
            // Fokus auf das erste Eingabefeld setzen
            setTimeout(() => {
                const firstInput = formContainer.querySelector('.firstName-input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        } catch (error) {
            console.error('Fehler beim Aktivieren der manuellen Namenseingabe:', error);
        }
    },
    
    // Neue Methode für die Echtzeit-Validierung bei manueller Namenseingabe
    attachNameInputListeners() {
        try {
            const nameRows = document.querySelectorAll('.name-input-row');
            
            nameRows.forEach(row => {
                const firstNameInput = row.querySelector('.firstName-input');
                const lastNameInput = row.querySelector('.lastName-input');
                
                if (firstNameInput && lastNameInput) {
                    // Entferne bestehende Listener durch Klonen
                    const newFirstNameInput = firstNameInput.cloneNode(true);
                    const newLastNameInput = lastNameInput.cloneNode(true);
                    
                    firstNameInput.parentNode.replaceChild(newFirstNameInput, firstNameInput);
                    lastNameInput.parentNode.replaceChild(newLastNameInput, lastNameInput);
                    
                    // Event-Handler für Änderungen
                    const validateInputs = async () => {
                        const firstName = newFirstNameInput.value.trim();
                        const lastName = newLastNameInput.value.trim();
                        
                        // Entferne existierende Warnungen
                        const existingWarning = row.querySelector('.existing-warning');
                        if (existingWarning) {
                            existingWarning.remove();
                        }
                        
                        // Entferne CSS-Klasse
                        row.classList.remove('existing-resident');
                        
                        // Nur prüfen, wenn beide Felder gefüllt sind
                        if (firstName && lastName) {
                            try {
                                const residentExists = await this.checkResidentExists(firstName, lastName);
                                
                                if (residentExists) {
                                    console.log(`Bewohner ${firstName} ${lastName} existiert bereits`);
                                    
                                    // CSS-Klasse hinzufügen
                                    row.classList.add('existing-resident');
                                    
                                    // Warnung anzeigen
                                    if (!row.querySelector('.existing-warning')) {
                                        const warningElement = document.createElement('div');
                                        warningElement.className = 'existing-warning';
                                        warningElement.textContent = 'Person existiert bereits im System';
                                        warningElement.style.color = 'var(--danger-color)';
                                        warningElement.style.fontSize = '0.8rem';
                                        warningElement.style.marginTop = '0.25rem';
                                        row.appendChild(warningElement);
                                    }
                                }
                            } catch (error) {
                                console.error('Fehler bei der Prüfung auf existierende Bewohner:', error);
                            }
                        }
                    };
                    
                    // Event-Listener für beide Felder hinzufügen
                    newFirstNameInput.addEventListener('input', validateInputs);
                    newLastNameInput.addEventListener('input', validateInputs);
                }
            });
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Namensvalidierungs-Listener:', error);
        }
    },
    
    // Methode zum Hinzufügen einer neuen Namenszeile anpassen
    addNameInputRow() {
        try {
            const container = document.getElementById('nameInputList');
            if (!container) return;
            
            // Neue Zeile erstellen
            const newRow = document.createElement('div');
            newRow.className = 'name-input-row';
            newRow.innerHTML = `
                <input type="text" class="form-input firstName-input" placeholder="Vorname" autocomplete="off">
                <input type="text" class="form-input lastName-input" placeholder="Nachname" autocomplete="off">
                <button type="button" class="remove-name-btn icon-btn close-modal" title="Entfernen"></button>
            `;
            
            // Zeile zum Container hinzufügen
            container.appendChild(newRow);
            
            // Event-Listener für den Entfernen-Button
            this.attachRemoveButtonListeners();
            
            // Event-Listener für die Namensvalidierung der neuen Zeile
            this.attachNameInputListeners();
            
            // Fokus auf das neue Vorname-Feld setzen
            setTimeout(() => {
                const input = newRow.querySelector('.firstName-input');
                if (input) input.focus();
            }, 100);
        } catch (error) {
            console.error('Fehler beim Hinzufügen einer Namenseingabezeile:', error);
        }
    }
}; 