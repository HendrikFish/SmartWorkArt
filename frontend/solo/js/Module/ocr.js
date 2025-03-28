import { Toast } from './module.js';
import { Modal } from './modal.js';
import { OCRModalManager } from './ocr-modal.js';

export const OCRManager = {
    async processImage(imageFile) {
        try {
            // Lade-Anzeige anzeigen
            Toast.show('Bild wird verarbeitet...', 'info', 5000);
            
            // FormData für den Upload vorbereiten
            const formData = new FormData();
            formData.append('image', imageFile);

            // OCR-API aufrufen
            const response = await fetch('/api/solo/ocr/process', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Fehler bei der Texterkennung');
            }

            const result = await response.json();
            
            if (!result.success || !result.text) {
                throw new Error('Kein Text erkannt');
            }

            // Extrahiere Namen aus dem erkannten Text
            const names = this.extractNames(result.text);
            
            // Prüfe auf Duplikate
            const duplicates = await this.checkDuplicates(names);
            
            // Wenn Namen erkannt wurden, zeige sie an
            if (names.length > 0) {
                // Zeige die erkannten Namen im OCR-Modal an
                await OCRModalManager.showResults(names, duplicates);
            } else {
                // Wenn keine Namen erkannt wurden, zeige den vollständigen Text an
                this.showFullTextModal(result.text);
                Toast.show('Keine Namen automatisch erkannt. Bitte markieren Sie die Namen manuell.', 'info');
            }
            
            return names;
        } catch (error) {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
            Toast.show(error.message || 'Fehler bei der Texterkennung', 'error');
            return [];
        }
    },

    showFullTextModal(text) {
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
            <div class="ocr-text-content">
                <div class="ocr-full-text">${formattedText}</div>
                <div class="name-selection-form">
                    <h3>Bitte markieren Sie Vor- und Nachnamen</h3>
                    <div class="form-group">
                        <label for="firstName">Vorname</label>
                        <input type="text" id="firstName" class="form-control" placeholder="Vorname eingeben">
                    </div>
                    <div class="form-group">
                        <label for="lastName">Nachname</label>
                        <input type="text" id="lastName" class="form-control" placeholder="Nachname eingeben">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="secondary-btn" id="extractMoreBtn">Weitere Namen</button>
                <button type="button" class="primary-btn" id="confirmNameBtn">Namen übernehmen</button>
                <button type="button" class="danger-btn" id="cancelOcrBtn">Abbrechen</button>
            </div>
        `;

        // Event-Listener hinzufügen
        this.attachTextModalEventListeners(content, text);
        
        // Modal anzeigen
        Modal.show('ocrResultsModal');
    },

    attachTextModalEventListeners(content, text) {
        // Text-Selektion für Vornamen
        content.querySelector('.ocr-full-text').addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (selection.toString().trim()) {
                const selectedText = selection.toString().trim();
                // Frage, ob dies Vor- oder Nachname ist
                this.showSelectionDialog(selectedText);
            }
        });

        // Bestätigungs-Button
        content.querySelector('#confirmNameBtn').addEventListener('click', () => {
            const firstName = content.querySelector('#firstName').value.trim();
            const lastName = content.querySelector('#lastName').value.trim();
            
            if (firstName && lastName) {
                this.createResidentFromNames(firstName, lastName);
                Modal.hide('ocrResultsModal');
            } else {
                Toast.show('Bitte geben Sie Vor- und Nachnamen ein', 'warning');
            }
        });

        // Abbrechen-Button
        content.querySelector('#cancelOcrBtn').addEventListener('click', () => {
            Modal.hide('ocrResultsModal');
        });

        // Weitere Namen-Button
        content.querySelector('#extractMoreBtn').addEventListener('click', () => {
            const firstName = content.querySelector('#firstName').value.trim();
            const lastName = content.querySelector('#lastName').value.trim();
            
            if (firstName && lastName) {
                this.createResidentFromNames(firstName, lastName);
                // Felder zurücksetzen für weitere Namen
                content.querySelector('#firstName').value = '';
                content.querySelector('#lastName').value = '';
                Toast.show('Name hinzugefügt! Sie können weitere Namen markieren.', 'success');
            } else {
                Toast.show('Bitte geben Sie Vor- und Nachnamen ein', 'warning');
            }
        });
    },

    showSelectionDialog(selectedText) {
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
        
        // Positioniere den Dialog in der Nähe der Auswahl
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        dialog.style.position = 'absolute';
        dialog.style.top = `${rect.bottom + window.scrollY + 10}px`;
        dialog.style.left = `${rect.left + window.scrollX}px`;
        
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
            // Grundlegende Bewohnerdaten erstellen
            const residentData = {
                firstName: firstName,
                lastName: lastName,
                createdAt: new Date().toISOString()
            };
            
            // API aufrufen, um den Bewohner zu speichern
            const response = await fetch('/api/solo/resident', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(residentData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                // Wenn es ein Duplikat ist, ignorieren wir den Fehler
                if (errorData.error === 'Bewohner existiert bereits') {
                    Toast.show(`${firstName} ${lastName} existiert bereits`, 'info');
                    return;
                }
                throw new Error(errorData.error || 'Fehler beim Speichern des Bewohners');
            }
            
            const result = await response.json();
            Toast.show(`${firstName} ${lastName} wurde erfolgreich hinzugefügt`, 'success');
            
            // Aktualisiere die Bewohnerliste, falls nötig
            if (window.ResidentManager && typeof window.ResidentManager.loadResidents === 'function') {
                window.ResidentManager.loadResidents();
            }
        } catch (error) {
            console.error('Fehler beim Erstellen des Bewohners:', error);
            Toast.show(`Fehler: ${error.message}`, 'error');
        }
    },

    extractNames(text) {
        // Verbesserte Namenserkennung mit verschiedenen Mustern
        const patterns = [
            // Standard: Vorname Nachname
            /([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß]+)/g,
            // Mit Komma: Nachname, Vorname
            /([A-ZÄÖÜ][a-zäöüß]+),\s*([A-ZÄÖÜ][a-zäöüß]+)/g,
            // Mit Titel: Herr/Frau Vorname Nachname
            /(?:Herr|Frau)\s+([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß]+)/g,
            // Für Namenslisten mit "geboren am" oder ähnlichen Informationen
            /([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß]+)(?=\s+geboren\s+am)/g
        ];

        const names = [];
        const processedNames = new Set();

        // Debug-Ausgabe
        console.log('Erkannter Text:', text);

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const [fullMatch, firstName, lastName] = match;
                const nameKey = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
                
                // Vermeide Duplikate in der aktuellen Erkennung
                if (!processedNames.has(nameKey)) {
                    processedNames.add(nameKey);
                    names.push({
                        firstName,
                        lastName,
                        confidence: this.calculateConfidence(fullMatch),
                        originalText: fullMatch
                    });
                    
                    // Debug-Ausgabe
                    console.log('Erkannter Name:', { firstName, lastName, confidence: this.calculateConfidence(fullMatch) });
                }
            }
        });

        return names;
    },

    calculateConfidence(text) {
        // Berechne Konfidenz basierend auf verschiedenen Faktoren
        let confidence = 1.0;
        
        // Reduziere Konfidenz für ungewöhnliche Zeichen
        if (/[^A-ZÄÖÜa-zäöüß\s,]/.test(text)) {
            confidence *= 0.8;
        }
        
        // Reduziere Konfidenz für sehr kurze Namen
        if (text.length < 5) {
            confidence *= 0.7;
        }
        
        return confidence;
    },

    async checkDuplicates(names) {
        try {
            // Lade existierende Bewohner
            const response = await fetch('/api/solo/residents');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Bewohner');
            }
            const existingResidents = await response.json();

            // Finde Duplikate
            const duplicates = names.map((name, index) => {
                const normalizedName = `${name.firstName.toLowerCase()}_${name.lastName.toLowerCase()}`;
                return existingResidents.some(resident => {
                    const existingName = `${resident.firstName.toLowerCase()}_${resident.lastName.toLowerCase()}`;
                    const similarity = this.calculateSimilarity(normalizedName, existingName);
                    console.log(`Vergleich: ${normalizedName} mit ${existingName} = ${similarity}`);
                    return similarity > 0.8;
                }) ? index : -1;
            }).filter(index => index !== -1);

            return duplicates;
        } catch (error) {
            console.error('Fehler bei der Duplikatsprüfung:', error);
            Toast.show('Fehler bei der Duplikatsprüfung', 'error');
            return [];
        }
    },

    calculateSimilarity(str1, str2) {
        // Levenshtein-Distanz für Namensvergleich
        const matrix = Array(str1.length + 1).fill().map(() => Array(str2.length + 1).fill(0));
        
        for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1, // Deletion
                    matrix[i][j - 1] + 1, // Insertion
                    matrix[i - 1][j - 1] + cost // Substitution
                );
            }
        }
        
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (matrix[str1.length][str2.length] / maxLength);
    }
}; 