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
            // Wende Modal-Zuweisung zu DOM-Variablen an, falls noch nicht vorhanden
            if (!this.modals.fullTextModal) {
                this.initializeModals();
            }

            // Hole den Container für den Text
            const textContainer = document.getElementById('ocrFullText');
            if (!textContainer) {
                console.error('OCR Volltext-Container nicht gefunden');
                return;
            }

            // Zeige das Modal
            Modal.show('fullTextModal');

            // Prüfe, ob Text erkannt wurde
            if (text && text.trim().length > 0) {
                // Wenn Text vorhanden, normalen Ablauf fortsetzen - zeige Wortauswahl
                textContainer.innerHTML = ''; // Container leeren
                
                // Erstelle klickbare Wörter
                const words = text.split(/\s+/);
                words.forEach(word => {
                    if (word.trim().length > 0) {
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'word-button';
                        wordSpan.textContent = word;
                        wordSpan.addEventListener('click', () => this.toggleWordSelection(wordSpan));
                        textContainer.appendChild(wordSpan);
                        textContainer.appendChild(document.createTextNode(' '));
                    }
                });
                
                // Zeige Hinweis für Touch-Geräte
                const touchHint = document.getElementById('touchSelectionHint');
                if (touchHint) {
                    touchHint.style.display = 'block';
                }
                
                // Blende "Kein Text" Hinweis aus
                const noTextHint = document.getElementById('noTextRecognizedHint');
                if (noTextHint) {
                    noTextHint.style.display = 'none';
                }
            } else {
                // Wenn kein Text erkannt wurde, zeige einen entsprechenden Hinweis
                // und biete direktes manuelles Eingabeformular an
                
                textContainer.innerHTML = '<div class="no-text-detected">Kein Text im Bild erkannt.</div>';
                
                // Blende Touch-Hinweis aus
                const touchHint = document.getElementById('touchSelectionHint');
                if (touchHint) {
                    touchHint.style.display = 'none';
                }
                
                // Zeige "Kein Text" Hinweis an
                const noTextHint = document.getElementById('noTextRecognizedHint');
                if (noTextHint) {
                    noTextHint.style.display = 'block';
                    noTextHint.innerHTML = `
                        <div class="no-text-hint">
                            <strong>Kein Text erkannt!</strong> 
                            <p>Bitte geben Sie die Namen direkt ein oder versuchen Sie es mit einem besser belichteten Bild.</p>
                        </div>
                    `;
                }
                
                // Aktiviere direkt das manuelle Namenseingabeformular
                this.activateManualNameEntry();
            }
        } catch (error) {
            console.error('Fehler beim Anzeigen des OCR-Volltextmodals:', error);
            Toast.show('Fehler beim Anzeigen des erkannten Textes', 'error');
        }
    },

    attachEventListeners(content, names, resolve) {
        // "Alle auswählen" Button
        content.querySelector('#selectAllBtn').addEventListener('click', () => {
            content.querySelectorAll('.ocr-result-item:not(.duplicate) input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = true;
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
    
    attachFullTextModalListeners(content) {
        // Variable für den Wechsel zwischen Vorname und Nachname
        let isFirstNameNext = true;
        
        // Event-Listener für die Wort-Buttons
        const wordButtons = content.querySelectorAll('.word-button');
        wordButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedText = button.textContent;
                
                // Abhängig vom Status in das entsprechende Feld eintragen
                if (isFirstNameNext) {
                    content.querySelector('#firstName').value = selectedText;
                    // Fokus auf das Nachnamenfeld setzen
                    content.querySelector('#lastName').focus();
                } else {
                    content.querySelector('#lastName').value = selectedText;
                    // Fokus auf den "Namen übernehmen" Button setzen
                    content.querySelector('#confirmNameBtn').focus();
                }
                
                // Status umschalten für das nächste Feld
                isFirstNameNext = !isFirstNameNext;
                
                // Visuelles Feedback für den Button
                button.classList.add('selected');
                setTimeout(() => {
                    button.classList.remove('selected');
                }, 500);
            });
        });

        // Bestätigungs-Button (Namen übernehmen)
        content.querySelector('#confirmNameBtn').addEventListener('click', async () => {
            // Verhindere mehrfaches Klicken
            if (this.isProcessingClick) return;
            this.isProcessingClick = true;
            
            // Stabilisiere das Modal vor der Verarbeitung
            this.stabilizeModal();
            
            const firstName = content.querySelector('#firstName').value.trim();
            const lastName = content.querySelector('#lastName').value.trim();
            
            if (firstName && lastName) {
                try {
                    // Speichere den Bewohner
                    await this.createResidentFromNames(firstName, lastName);
                    
                    // Felder leeren für den nächsten Namen
                    content.querySelector('#firstName').value = '';
                    content.querySelector('#lastName').value = '';
                    
                    // Fokus zurück auf das Vornamenfeld setzen
                    content.querySelector('#firstName').focus();
                    
                    // Status für den nächsten Klick zurücksetzen
                    isFirstNameNext = true;
                    
                    // Stelle sicher, dass das Modal seine Position behält
                    this.stabilizeModal();
                    
                    // Status zurücksetzen
                    this.isProcessingClick = false;
                } catch (error) {
                    console.error('Fehler beim Speichern:', error);
                    this.isProcessingClick = false;
                    // Auch bei Fehlern sollte das Modal stabil bleiben
                    this.stabilizeModal();
                }
            } else {
                Toast.show('Bitte geben Sie Vor- und Nachnamen ein', 'warning');
                this.isProcessingClick = false;
                // Auch bei Validierungsfehlern sollte das Modal stabil bleiben
                this.stabilizeModal();
            }
        });

        // Abbrechen-Button
        content.querySelector('#cancelOcrBtn').addEventListener('click', () => {
            Modal.hide('ocrResultsModal');
        });
    },
    
    async createResidentFromNames(firstName, lastName) {
        try {
            // Prüfe zuerst, ob der Bewohner bereits existiert
            const existingResidents = await this.checkResidentExists(firstName, lastName);
            
            if (existingResidents) {
                Toast.show(`Bewohner ${firstName} ${lastName} existiert bereits!`, 'warning');
                return false;
            }
            
            // Speichere den neuen Bewohner
            await SaveManager.createResident({ firstName, lastName });
            Toast.show(`Bewohner ${firstName} ${lastName} wurde erfolgreich angelegt`, 'success');
            
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
            
            console.error('Fehler beim Speichern des Bewohners:', error);
            Toast.show('Fehler beim Speichern des Bewohners', 'error');
            throw error;
        }
    },
    
    async checkResidentExists(firstName, lastName) {
        try {
            // API aufrufen, um zu prüfen, ob der Bewohner existiert
            const response = await fetch('/api/solo/residents');
            if (!response.ok) {
                throw new Error('Fehler beim Abrufen der Bewohnerliste');
            }
            
            const residents = await response.json();
            
            // Prüfe, ob ein Bewohner mit demselben Vor- und Nachnamen existiert
            const existingResident = residents.find(resident => 
                resident.firstName.toLowerCase() === firstName.toLowerCase() && 
                resident.lastName.toLowerCase() === lastName.toLowerCase()
            );
            
            return existingResident;
        } catch (error) {
            console.error('Fehler beim Prüfen auf existierende Bewohner:', error);
            return false; // Im Zweifelsfall erlauben wir das Speichern
        }
    },

    // Verarbeitet manuell eingegebene Namen und übergibt sie zur Suche
    processManuallyEnteredNames() {
        try {
            // Sammle alle Namenspaare
            const nameRows = document.querySelectorAll('.name-input-row');
            const names = [];
            
            nameRows.forEach(row => {
                const firstNameInput = row.querySelector('.firstName-input');
                const lastNameInput = row.querySelector('.lastName-input');
                
                if (firstNameInput && lastNameInput) {
                    const firstName = firstNameInput.value.trim();
                    const lastName = lastNameInput.value.trim();
                    
                    // Nur gültige Namen hinzufügen (beide Felder müssen ausgefüllt sein)
                    if (firstName && lastName) {
                        names.push({
                            firstName,
                            lastName,
                            confidence: 1.0, // Manuell eingegebene Namen haben höchste Konfidenz
                            manuallyEntered: true
                        });
                    }
                }
            });
            
            // Prüfe, ob Namen eingegeben wurden
            if (names.length === 0) {
                Toast.show('Bitte geben Sie mindestens einen vollständigen Namen ein', 'warning');
                return;
            }
            
            // Namen zur Suche übergeben
            console.log('Manuell eingegebene Namen:', names);
            
            // Modal schließen und Ergebnisse anzeigen
            Modal.hide('fullTextModal');
            
            // OCRManager.showResults aufrufen mit den manuell eingegebenen Namen
            this.showResults(names, []);
        } catch (error) {
            console.error('Fehler bei der Verarbeitung manuell eingegebener Namen:', error);
            Toast.show('Fehler bei der Namensverarbeitung', 'error');
        }
    }
}; 