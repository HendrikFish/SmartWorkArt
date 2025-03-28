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
                           ${duplicates.includes(index) ? 'disabled' : ''}>
                </div>
                <div class="ocr-result-name">
                    <input type="text" 
                           class="ocr-name-input" 
                           data-index="${index}"
                           value="${name.firstName} ${name.lastName}"
                           ${duplicates.includes(index) ? 'readonly' : ''}>
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
        // Event Listener für den "Alle auswählen" Button
        content.querySelector('#selectAllBtn').addEventListener('click', () => {
            const checkboxes = content.querySelectorAll('input[type="checkbox"]:not(:disabled)');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(checkbox => {
                if (!checkbox.disabled) {
                    checkbox.checked = !allChecked;
                }
            });
        });

        // Event Listener für den OK-Button
        content.querySelector('#confirmOcrResults').addEventListener('click', async () => {
            const selectedNames = this.getSelectedNames(content, names);
            if (selectedNames.length === 0) {
                Toast.show('Bitte wählen Sie mindestens einen Namen aus', 'warning');
                return;
            }

            try {
                for (const name of selectedNames) {
                    await SaveManager.saveResident(name, true);
                }

                Toast.show('Namen wurden erfolgreich gespeichert', 'success');
                Modal.hide('ocrResultsModal');
                
                // Aktualisiere die Bewohnerliste
                await ResidentManager.loadResidents();
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                Toast.show('Fehler beim Speichern der Namen', 'error');
            }
        });

        // Event Listener für den Abbrechen-Button
        content.querySelector('#cancelOcrResults').addEventListener('click', () => {
            Modal.hide('ocrResultsModal');
        });

        // Event Listener für die Namens-Eingabefelder
        content.querySelectorAll('.ocr-name-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const [firstName, ...lastNameParts] = e.target.value.split(' ');
                names[index] = {
                    ...names[index],
                    firstName,
                    lastName: lastNameParts.join(' ')
                };
            });
        });

        // Event Listener für den Schließen-Button im Header
        content.querySelector('.close-modal').addEventListener('click', () => {
            Modal.hide('ocrResultsModal');
        });
    },

    getSelectedNames(content, names) {
        return Array.from(content.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => names[parseInt(checkbox.id.split('_')[1])]);
    },

    showEditModal(names) {
        // Hier implementieren wir die Logik für das Bearbeitungs-Modal
        // Dies wird später implementiert
        console.log('Bearbeite Namen:', names);
    }
}; 