import { Toast } from './module.js';
import { Modal } from './modal.js';
import { OCRModalManager } from './ocr-modal.js';
import { UploadManager } from './upload.js';

export const OCRManager = {
    async processImage(imageFile) {
        try {
            // Debug: File-Typ und Größe prüfen, um festzustellen, ob die Parameter konsistent sind
            console.log('OCR-Verarbeitung gestartet für:', {
                name: imageFile.name,
                type: imageFile.type,
                size: imageFile.size + ' Bytes',
                lastModified: new Date(imageFile.lastModified).toISOString()
            });
            
            // Lade-Anzeige anzeigen
            Toast.show('Bild wird verarbeitet...', 'info', 5000);
            
            // FormData für den Upload vorbereiten
            const formData = new FormData();
            formData.append('image', imageFile);

            // OCR-API aufrufen
            console.log('Sende Bild an API...');
            
            try {
                const response = await fetch('/api/solo/ocr/process', {
                    method: 'POST',
                    body: formData,
                    // Erhöhe Timeout für größere Bilder
                    timeout: 30000
                });

                if (!response.ok) {
                    // Versuche, detaillierte Fehlerinformationen zu erhalten
                    let errorMessage = 'Fehler bei der Texterkennung';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        // Wenn kein JSON zurückkommt, verwende den HTTP-Status
                        errorMessage = `Fehler bei der Texterkennung (${response.status}: ${response.statusText})`;
                    }
                    throw new Error(errorMessage);
                }

                console.log('API-Antwort erhalten');
                const result = await response.json();
                console.log('OCR-Ergebnis:', result);
                
                // Stellen wir sicher, dass wir das Lade-Overlay auch wirklich ausblenden
                UploadManager.hideLoadingOverlay();
                
                // Auch wenn kein Text erkannt wurde, speichern wir das Ergebnis (leerer String)
                const recognizedText = result.text || '';
                console.log('Erkannter Text:', recognizedText || 'Kein Text erkannt');
                OCRModalManager.lastRecognizedText = recognizedText;
                
                if (!result.success || !recognizedText) {
                    // Zeige einen deutlicheren Hinweis und öffne direkt das Volltext-Modal
                    Toast.show('Kein Text erkannt. Bitte manuell Namen eingeben.', 'warning', 5000);
                    
                    // Kurze Verzögerung, damit der Toast sichtbar ist, dann direkt zum Volltext-Modal
                    setTimeout(() => {
                        OCRModalManager.showFullTextModal('');
                    }, 800);
                    return [];
                }

                // Extrahiere Namen aus dem erkannten Text
                const names = this.extractNames(recognizedText);
                console.log('Extrahierte Namen:', names.length > 0 ? names : 'Keine Namen erkannt');
                
                // Prüfe auf Duplikate
                const duplicates = await this.checkDuplicates(names);
                
                // Wenn Namen erkannt wurden, zeige sie an
                if (names.length > 0) {
                    // Zeige die erkannten Namen im OCR-Modal an
                    await OCRModalManager.showResults(names, duplicates);
                } else {
                    // Wenn keine Namen erkannt wurden, zeige Hinweis und dann den vollständigen Text an
                    Toast.show('Keine Namen im Dokument gefunden. Bitte markieren Sie die Namen manuell.', 'warning', 5000);
                    
                    // Kurze Verzögerung, damit der Toast sichtbar ist
                    setTimeout(() => {
                        OCRModalManager.showFullTextModal(recognizedText);
                    }, 800);
                }
                
                return names;
            } catch (apiError) {
                // Spezifischer API-Fehler
                console.error('API-Fehler bei der OCR-Verarbeitung:', apiError);
                throw new Error(`Fehler bei der Texterkennung: ${apiError.message}`);
            }
        } catch (error) {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
            // Stelle sicher, dass der Ladekreisel auch bei Fehlern ausgeblendet wird
            UploadManager.hideLoadingOverlay();
            
            // Zeige einen deutlichen Toast mit dem Fehler
            Toast.show(error.message || 'Fehler bei der Texterkennung', 'error', 5000);
            
            // Bei Fehlern trotzdem das Volltext-Modal öffnen, damit der Benutzer manuell Namen eingeben kann
            setTimeout(() => {
                OCRModalManager.showFullTextModal('');
            }, 1000);
            
            return [];
        }
    },

    showFullTextModal(text) {
        OCRModalManager.showFullTextModal(text);
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