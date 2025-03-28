import { Modal } from './modal.js';
import { Toast } from './module.js';
import { SaveManager } from './save.js';
import { ResidentManager } from '../script.js';

export const OCRModalManager = {
    async showResults(names, duplicates) {
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
                ${this.generateResultsList(names, duplicates)}
            </div>
            <div class="modal-footer">
                <button type="button" class="secondary-btn" id="selectAllBtn">Alle auswählen</button>
                <button type="button" class="primary-btn" id="confirmOcrResults">Als Bewohner speichern</button>
                <button type="button" class="secondary-btn" id="manualSelectBtn">Manuell auswählen</button>
                <button type="button" class="danger-btn" id="cancelOcrResults">Abbrechen</button>
            </div>
        `;

        this.attachEventListeners(content, names, duplicates);
        Modal.show('ocrResultsModal');
    },

    generateResultsList(names, duplicates) {
        return names.map((name, index) => `
            <div class="ocr-result-item ${duplicates.includes(index) ? 'duplicate' : ''}">
                <div class="ocr-result-checkbox">
                    <input type="checkbox" 
                           id="name_${index}" 
                           ${duplicates.includes(index) ? 'disabled' : 'checked'}>
                </div>
                <div class="ocr-result-name">
                    <div class="ocr-name-fields">
                        <input type="text" 
                               class="ocr-name-input firstName" 
                               data-index="${index}"
                               value="${name.firstName}"
                               ${duplicates.includes(index) ? 'readonly' : ''}>
                        <input type="text" 
                               class="ocr-name-input lastName" 
                               data-index="${index}"
                               value="${name.lastName}"
                               ${duplicates.includes(index) ? 'readonly' : ''}>
                    </div>
                </div>
                <div class="ocr-result-confidence">
                    ${Math.round(name.confidence * 100)}%
                </div>
                ${duplicates.includes(index) ? 
                    '<div class="ocr-duplicate-warning">Möglicherweise ein Duplikat</div>' : 
                    ''}
            </div>
        `).join('');
    },

    attachEventListeners(content, names, duplicates) {
        // "Alle auswählen" Button
        content.querySelector('#selectAllBtn').addEventListener('click', () => {
            const checkboxes = content.querySelectorAll('input[type="checkbox"]:not(:disabled)');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
        });

        // "Als Bewohner speichern" Button
        content.querySelector('#confirmOcrResults').addEventListener('click', async () => {
            const selectedNames = this.getSelectedNames(content, names);
            
            if (selectedNames.length === 0) {
                Toast.show('Bitte wählen Sie mindestens einen Namen aus', 'warning');
                return;
            }
            
            try {
                let success = 0;
                let duplicates = 0;
                
                for (const name of selectedNames) {
                    try {
                        // Erstelle den Bewohner
                        const response = await fetch('/api/solo/resident', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                firstName: name.firstName,
                                lastName: name.lastName,
                                createdAt: new Date().toISOString()
                            })
                        });
                        
                        if (response.ok) {
                            success++;
                        } else {
                            const data = await response.json();
                            if (data.error === 'Bewohner existiert bereits') {
                                duplicates++;
                            } else {
                                throw new Error(data.error || 'Unbekannter Fehler');
                            }
                        }
                    } catch (error) {
                        console.error('Fehler beim Erstellen:', error);
                    }
                }
                
                // Erfolgsmeldung
                if (success > 0) {
                    Toast.show(`${success} Bewohner erfolgreich gespeichert`, 'success');
                }
                
                if (duplicates > 0) {
                    Toast.show(`${duplicates} Bewohner existieren bereits`, 'info');
                }
                
                // Liste aktualisieren
                if (ResidentManager && typeof ResidentManager.loadResidents === 'function') {
                    await ResidentManager.loadResidents();
                }
                
                // Modal schließen
                Modal.hide('ocrResultsModal');
            } catch (error) {
                console.error('Fehler beim Speichern der Bewohner:', error);
                Toast.show('Fehler beim Speichern der Bewohner', 'error');
            }
        });

        // "Abbrechen" Button
        content.querySelector('#cancelOcrResults').addEventListener('click', () => {
            Modal.hide('ocrResultsModal');
        });

        // "Manuell auswählen" Button
        content.querySelector('#manualSelectBtn').addEventListener('click', () => {
            // Hole den Originaltext aus dem ersten Namen (falls vorhanden)
            const originalText = names.length > 0 ? names[0].originalText : '';
            
            // Extrahiere den vollständigen Text aus dem Kontext
            const fullText = names.reduce((text, name) => {
                const startIndex = text.indexOf(name.originalText);
                return startIndex >= 0 ? text : text + '\n' + name.originalText;
            }, originalText);
            
            // Schließe dieses Modal
            Modal.hide('ocrResultsModal');
            
            // Zeige das manuelle Auswahl-Modal
            if (window.OCRManager && typeof window.OCRManager.showFullTextModal === 'function') {
                window.OCRManager.showFullTextModal(fullText);
            }
        });
    },

    getSelectedNames(content, names) {
        const selectedCheckboxes = Array.from(content.querySelectorAll('input[type="checkbox"]:checked'));
        return selectedCheckboxes.map(checkbox => {
            const index = parseInt(checkbox.id.split('_')[1]);
            const firstNameInput = content.querySelector(`.firstName[data-index="${index}"]`);
            const lastNameInput = content.querySelector(`.lastName[data-index="${index}"]`);
            
            return {
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                ...names[index]
            };
        });
    }
}; 