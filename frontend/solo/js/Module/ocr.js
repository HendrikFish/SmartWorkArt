import { Toast } from './module.js';

export const OCRManager = {
    async processImage(imageFile) {
        try {
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
            
            if (names.length === 0) {
                Toast.show('Keine Namen im Bild erkannt', 'warning');
            }

            return names;
        } catch (error) {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
            Toast.show(error.message || 'Fehler bei der Texterkennung', 'error');
            return [];
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
            /(?:Herr|Frau)\s+([A-ZÄÖÜ][a-zäöüß]+)\s+([A-ZÄÖÜ][a-zäöüß]+)/g
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