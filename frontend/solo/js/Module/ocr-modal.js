import { Modal } from './modal.js';
import { Toast } from './module.js';
import { SaveManager } from './save.js';
import { ResidentManager } from '../script.js';
import { UploadManager } from './upload.js';

export const OCRModalManager = {
    // Speichere den letzten erkannten vollständigen Text
    lastRecognizedText: '',
    // Status-Flags zur Verhinderung von Layout-Problemen
    isProcessingClick: false,

    async showResults(names, duplicates) {
        return new Promise((resolve) => {
            // Verstecke den Ladekreisel, falls er noch angezeigt wird
            UploadManager.hideLoadingOverlay();
            
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
                        
                        return `
                        <div class="ocr-result-item ${isDuplicate ? 'duplicate' : ''}">
                            <div class="ocr-result-checkbox">
                                <input type="checkbox" id="name_${index}" ${isDuplicate ? '' : 'checked'}>
                            </div>
                            <div class="ocr-result-name">
                                <div class="ocr-name-fields">
                                    <input type="text" class="ocr-name-input firstName" data-index="${index}" value="${name.firstName}">
                                    <input type="text" class="ocr-name-input lastName" data-index="${index}" value="${name.lastName}">
                                </div>
                                ${isDuplicate ? `
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
        // Speichere den aktuellen Text für spätere Verwendung
        this.lastRecognizedText = text;
        
        const modal = document.getElementById('ocrResultsModal');
        const content = modal.querySelector('.modal-content');
        
        // Formatiere den Text für bessere Lesbarkeit
        const formattedText = text.replace(/\n/g, '<br>');
        
        content.innerHTML = `
            <div class="modal-header">
                <h2>Erkannter Text</h2>
                <div class="header-actions">
                    <button type="button" class="icon-btn close-modal">×</button>
                </div>
            </div>
            <div class="ocr-scroll-container">
                <div class="ocr-full-text">${formattedText}</div>
            </div>
            <div class="name-selection-form">
                <h3>Bitte markieren Sie Vor- und Nachnamen</h3>
                <p class="touch-hint">Tippen Sie auf einen Namen, um ihn auszuwählen</p>
                <div class="form-group">
                    <label for="firstName">Vorname</label>
                    <input type="text" id="firstName" class="form-control" placeholder="Vorname eingeben">
                </div>
                <div class="form-group">
                    <label for="lastName">Nachname</label>
                    <input type="text" id="lastName" class="form-control" placeholder="Nachname eingeben">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="primary-btn" id="confirmNameBtn">Namen übernehmen</button>
                <button type="button" class="danger-btn" id="cancelOcrBtn">Abbrechen</button>
            </div>
        `;

        // Event-Listener für die manuelle Textauswahl
        this.attachFullTextModalListeners(content);
        
        // Styles fixieren
        content.style.overflow = 'hidden'; // Verhindert horizontales Scrollen
        
        // Modal anzeigen
        Modal.show('ocrResultsModal');
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
            try {
                // Sammle alle ausgewählten Namen
                const selectedNames = [];
                content.querySelectorAll('.ocr-result-item').forEach((item, index) => {
                    const checkbox = item.querySelector(`input[type="checkbox"]`);
                    if (checkbox && checkbox.checked) {
                        const firstName = item.querySelector(`.firstName`).value.trim();
                        const lastName = item.querySelector(`.lastName`).value.trim();
                        
                        if (firstName && lastName) {
                            selectedNames.push({ firstName, lastName });
                        }
                    }
                });
                
                if (selectedNames.length === 0) {
                    Toast.show('Bitte wählen Sie mindestens einen Namen aus', 'warning');
                    return;
                }
                
                // Speichere die ausgewählten Bewohner
                for (const name of selectedNames) {
                    await SaveManager.createResident(name);
                }
                
                Toast.show(`${selectedNames.length} Bewohner wurden erfolgreich angelegt`, 'success');
                
                // Aktualisiere die Bewohnerliste
                await ResidentManager.loadResidents();
                
                // Modal schließen
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
        const fullTextElement = content.querySelector('.ocr-full-text');
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            // Für Touch-Geräte: Tap-Event für Text-Auswahl
            fullTextElement.addEventListener('click', (event) => {
                // Prüfe, ob ein Wort geklickt wurde
                const text = event.target.innerText || '';
                if (text) {
                    // Finde das Wort, das geklickt wurde
                    const words = text.split(/\s+/);
                    // Vereinfachte Annahme: Das nächste Wort zum Klickpunkt auswählen
                    if (words.length > 0) {
                        const selectedText = words[0].replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
                        if (selectedText.length > 1) {
                            this.showSelectionDialog(selectedText);
                        }
                    }
                }
            });
        } else {
            // Für Desktop: Normale Textauswahl mit Maus
            fullTextElement.addEventListener('mouseup', () => {
                const selection = window.getSelection();
                if (selection.toString().trim()) {
                    const selectedText = selection.toString().trim();
                    this.showSelectionDialog(selectedText);
                }
            });
        }

        // Bestätigungs-Button (Namen übernehmen)
        content.querySelector('#confirmNameBtn').addEventListener('click', async () => {
            // Verhindere mehrfaches Klicken
            if (this.isProcessingClick) return;
            this.isProcessingClick = true;
            
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
                    
                    // Status zurücksetzen
                    this.isProcessingClick = false;
                } catch (error) {
                    console.error('Fehler beim Speichern:', error);
                    this.isProcessingClick = false;
                }
            } else {
                Toast.show('Bitte geben Sie Vor- und Nachnamen ein', 'warning');
                this.isProcessingClick = false;
            }
        });

        // Abbrechen-Button
        content.querySelector('#cancelOcrBtn').addEventListener('click', () => {
            Modal.hide('ocrResultsModal');
        });
    },
    
    showSelectionDialog(selectedText) {
        // Entferne alle vorhandenen Auswahldialoge
        document.querySelectorAll('.selection-dialog-container').forEach(el => el.remove());
        
        const dialogHTML = `
            <div class="selection-dialog">
                <p>Ausgewählter Text: "${selectedText}"</p>
                <div class="selection-buttons">
                    <button type="button" class="btn btn-sm" id="setFirstNameBtn">Als Vorname</button>
                    <button type="button" class="btn btn-sm" id="setLastNameBtn">Als Nachname</button>
                    <button type="button" class="btn btn-sm" id="cancelSelectionBtn">Abbrechen</button>
                </div>
            </div>
        `;
        
        // Dialog erstellen und positionieren
        const dialog = document.createElement('div');
        dialog.className = 'selection-dialog-container';
        dialog.innerHTML = dialogHTML;
        document.body.appendChild(dialog);
        
        // Positioniere den Dialog - für Touch-Geräte zentriert
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            // Zentriert für Touch-Geräte
            dialog.style.position = 'fixed';
            dialog.style.top = '50%';
            dialog.style.left = '50%';
            dialog.style.transform = 'translate(-50%, -50%)';
            dialog.style.zIndex = '9999';
        } else {
            // Nahe der Selektion für Desktop
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            dialog.style.position = 'absolute';
            dialog.style.top = `${rect.bottom + window.scrollY + 10}px`;
            dialog.style.left = `${rect.left + window.scrollX}px`;
        }
        
        // Event-Listener
        dialog.querySelector('#setFirstNameBtn').addEventListener('click', () => {
            document.querySelector('#firstName').value = selectedText;
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('#setLastNameBtn').addEventListener('click', () => {
            document.querySelector('#lastName').value = selectedText;
            document.body.removeChild(dialog);
        });
        
        dialog.querySelector('#cancelSelectionBtn').addEventListener('click', () => {
            document.body.removeChild(dialog);
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
            await ResidentManager.loadResidents();
            return true;
        } catch (error) {
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
    }
}; 