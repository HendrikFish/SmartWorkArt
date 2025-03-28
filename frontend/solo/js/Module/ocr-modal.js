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
        // Zurücksetzen der gespeicherten Modal-Position
        this.modalPosition = null;
        
        const modal = document.getElementById('ocrResultsModal');
        const content = modal.querySelector('.modal-content');
        
        // Formatiere den Text und wandle Wörter in Buttons um
        const words = text.split(/\s+/);
        const buttonsHtml = words.map(word => {
            // Ignoriere leere Wörter oder Sonderzeichen
            if (word.length <= 1 || !/[a-zA-ZäöüÄÖÜß]/.test(word)) {
                return '';
            }
            
            // Bereinige das Wort von unerwünschten Zeichen
            const cleanWord = word.replace(/[^a-zA-ZäöüÄÖÜß\-]/g, '');
            if (cleanWord.length <= 1) {
                return '';
            }
            
            return `<button type="button" class="word-button">${cleanWord}</button>`;
        }).filter(button => button !== '').join(' ');
        
        content.innerHTML = `
            <div class="modal-header">
                <h2>Erkannter Text</h2>
                <div class="header-actions">
                    <button type="button" class="icon-btn close-modal">×</button>
                </div>
            </div>
            <div class="ocr-scroll-container">
                <div class="ocr-full-text">${buttonsHtml}</div>
            </div>
            <div class="name-selection-form">
                <h3>Bitte wählen Sie Vor- und Nachnamen</h3>
                <p class="touch-hint">Tippen Sie auf ein Wort, um es auszuwählen</p>
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

        // Event-Listener für die Buttons im Text
        this.attachFullTextModalListeners(content);
        
        // Styles fixieren
        content.style.overflow = 'hidden'; // Verhindert horizontales Scrollen
        
        // Modal anzeigen
        Modal.show('ocrResultsModal');
        
        // Modal stabilisieren
        this.stabilizeModal();
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