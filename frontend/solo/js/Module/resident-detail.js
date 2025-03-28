import { Toast } from './toast.js';

export const ResidentDetailModal = {
    modal: null,
    resident: null,
    onSave: null,

    init() {
        this.modal = document.getElementById('residentDetailModal');
    },

    generateAreaGroup(area, config) {
        const areaConfig = config.areas.find(a => a.name === area) || {};
        const isMultiple = areaConfig.allowMultiple || false;
        const buttons = areaConfig.buttons || [];
        const currentValue = this.resident.areas[area] || '';
        
        console.log(`Generiere Area Group für ${area}:`, {
            currentValue,
            isMultiple,
            buttons: buttons.map(b => b.label)
        });
        
        // Konvertiere den String-Wert in ein Array für die Prüfung
        const currentValues = isMultiple ? 
            (currentValue ? currentValue.split(',').map(v => v.trim()) : []) : 
            [currentValue];

        console.log(`Aktuelle Werte für ${area}:`, currentValues);

        return `
            <div class="area-group">
                <h3 class="area-group-title">${area}</h3>
                <div class="form-group area-buttons">
                    <div class="button-group">
                        ${buttons.map(button => {
                            // Prüfe, ob der Button aktiv sein sollte
                            const isActive = currentValues.some(value => {
                                // Normalisiere beide Werte für den Vergleich
                                const normalizedValue = value.trim().replace(/\s+/g, ' ');
                                const normalizedButton = button.label.trim().replace(/\s+/g, ' ');
                                
                                console.log(`Vergleich für ${area}:`, {
                                    value: normalizedValue,
                                    button: normalizedButton,
                                    isMatch: normalizedValue === normalizedButton
                                });
                                
                                return normalizedValue === normalizedButton;
                            });
                            
                            return `
                                <button type="button" 
                                        class="filter-button ${isActive ? 'active' : ''}" 
                                        data-area="${area}" 
                                        data-button="${button.label}" 
                                        data-multiple="${isMultiple}">
                                    ${button.label}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    show(resident, onSave) {
        this.resident = resident;
        this.onSave = onSave;
        
        console.log('Zeige Bewohner:', resident);
        
        // Konfiguration laden
        fetch('/api/solo/config')
            .then(response => response.json())
            .then(config => {
                console.log('Geladene Konfiguration:', config);
                const content = this.modal.querySelector('.modal-content');
                
                // Generiere die persönlichen Informationen basierend auf der Konfiguration
                const personalInfo = `
                    <div class="personal-info">
                        <h3 class="section-title">Persönliche Informationen</h3>
                        <div class="form-group">
                            <label>Geschlecht:</label>
                            <select class="form-input" name="gender">
                                <option value="Herr" ${resident.gender === 'Herr' ? 'selected' : ''}>Herr</option>
                                <option value="Frau" ${resident.gender === 'Frau' ? 'selected' : ''}>Frau</option>
                                <option value="" ${!resident.gender ? 'selected' : ''}>Nicht angegeben</option>
                            </select>
                        </div>
                        ${config.fields.map(field => `
                            <div class="form-group">
                                <label>${field.label}:</label>
                                <input type="${field.type || 'text'}" 
                                       class="form-input" 
                                       name="${field.id}" 
                                       value="${resident[field.id] || ''}"
                                       ${field.required ? 'required' : ''}>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Generiere die Bereichs-Buttons basierend auf der Konfiguration
                const areasHtml = config.areas.map(area => this.generateAreaGroup(area.name, config)).join('');

                content.innerHTML = `
                    <div class="modal-header">
                        <h2>${resident.firstName} ${resident.lastName}</h2>
                        <button type="button" class="icon-btn close-modal">×</button>
                    </div>
                    <div class="fields-container">
                        ${personalInfo}
                        ${areasHtml}
                    </div>
                    <div class="button-container">
                        <button type="button" class="primary-btn" id="saveResidentBtn">Speichern</button>
                        <button type="button" class="danger-btn" id="dismissResidentBtn">Entlassen</button>
                    </div>
                `;
                
                this.attachEventListeners();
                Modal.show('residentDetailModal');
            })
            .catch(error => {
                console.error('Fehler beim Laden der Konfiguration:', error);
                Toast.error('Fehler beim Laden der Konfiguration');
            });
    },

    attachEventListeners() {
        // Event Listener für die Buttons
        this.modal.querySelectorAll('.filter-button').forEach(button => {
            button.addEventListener('click', () => {
                const area = button.dataset.area;
                const value = button.dataset.button;
                const isMultiple = button.dataset.multiple === 'true';

                if (isMultiple) {
                    // Bei mehrfach-Auswahl
                    const currentValue = this.resident.areas[area] || '';
                    const currentValues = currentValue ? currentValue.split(',').map(v => v.trim()) : [];
                    const index = currentValues.indexOf(value);
                    
                    if (index === -1) {
                        currentValues.push(value);
                    } else {
                        currentValues.splice(index, 1);
                    }
                    
                    this.resident.areas[area] = currentValues.join(', ');
                } else {
                    // Bei Einzelauswahl
                    this.resident.areas[area] = value;
                }

                // UI aktualisieren
                this.updateButtonStates(area);
            });
        });

        // Event Listener für den Speichern-Button
        this.modal.querySelector('#saveResidentBtn').addEventListener('click', async () => {
            try {
                // Sammle alle Formular-Daten
                const formInputs = this.modal.querySelectorAll('.form-input');
                formInputs.forEach(input => {
                    if (input.name === 'gender') {
                        this.resident.gender = input.value;
                    } else {
                        this.resident[input.name] = input.value;
                    }
                });

                const success = await SaveManager.saveResident(this.resident, false);
                if (success) {
                    Toast.success('Bewohner erfolgreich aktualisiert');
                    this.onSave();
                }
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                Toast.error('Fehler beim Speichern der Änderungen');
            }
        });

        // Event Listener für den Entlassen-Button
        this.modal.querySelector('#dismissResidentBtn').addEventListener('click', async () => {
            // Heutiges Datum im Format YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];
            
            // Formatiere das Datum für die Anzeige im Dialog (DD.MM.YYYY)
            const [year, month, day] = today.split('-');
            const formattedDate = `${day}.${month}.${year}`;
            
            if (confirm(`Möchten Sie diesen Bewohner wirklich entlassen?\n\nDas Todesdatum wird auf heute (${formattedDate}) gesetzt.`)) {
                try {
                    const success = await SaveManager.dismissResident(this.resident);
                    if (success) {
                        Toast.success('Bewohner erfolgreich entlassen');
                        this.onSave();
                    }
                } catch (error) {
                    console.error('Fehler beim Entlassen:', error);
                    Toast.error('Fehler beim Entlassen des Bewohners');
                }
            }
        });

        // Event Listener für den Schließen-Button
        this.modal.querySelector('.close-modal').addEventListener('click', () => {
            Modal.hide('residentDetailModal');
        });
    },

    updateButtonStates(area) {
        const buttons = this.modal.querySelectorAll(`.filter-button[data-area="${area}"]`);
        const currentValue = this.resident.areas[area];
        const isMultiple = buttons[0]?.dataset.multiple === 'true';
        
        // Konvertiere den String-Wert in ein Array für die Prüfung
        const currentValues = isMultiple ? 
            (currentValue ? currentValue.split(',').map(v => v.trim()) : []) : 
            [currentValue];

        buttons.forEach(button => {
            const value = button.dataset.button;
            // Prüfe, ob der Button aktiv sein sollte
            const isActive = currentValues.some(currentValue => {
                // Normalisiere beide Werte für den Vergleich
                const normalizedValue = currentValue.trim().replace(/\s+/g, ' ');
                const normalizedButton = value.trim().replace(/\s+/g, ' ');
                return normalizedValue === normalizedButton;
            });
            
            button.classList.toggle('active', isActive);
        });
    }
}; 