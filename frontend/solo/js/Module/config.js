import { Modal } from './modal.js';
import { Toast, normalizeString } from './module.js';

export const ConfigManager = {
    config: null,

    async loadConfig() {
        try {
            const response = await fetch('/api/solo/config');
            this.config = await response.json();
            this.updateConfigUI();
            return this.config;
        } catch (error) {
            console.error('Fehler beim Laden der Konfiguration:', error);
            Toast.show('Fehler beim Laden der Konfiguration', 'error');
            return null;
        }
    },

    async saveConfig(configData) {
        try {
            // Stelle sicher, dass die Filter-Konfiguration korrekt ist
            if (!configData.filters) {
                configData.filters = {
                    fields: [],
                    areas: []
                };
            }

            const response = await fetch('/api/solo/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });

            if (response.ok) {
                Toast.show('Konfiguration erfolgreich gespeichert', 'success');
                
                // Aktualisiere die lokale Konfiguration
                this.config = configData;

                try {
                    // Lade die Bewohner neu
                    const residentsResponse = await fetch('/api/solo/residents');
                    if (!residentsResponse.ok) {
                        throw new Error('Fehler beim Laden der Bewohner');
                    }
                    const residents = await residentsResponse.json();
                    
                    // Importiere den FilterManager und zeige die Bewohner an
                    const FilterManager = (await import('./filter.js')).FilterManager;
                    
                    // Aktualisiere die Filter-Konfiguration im FilterManager
                    FilterManager.setFilters(configData.filters);
                    
                    // Zeige die gefilterten Bewohner an
                    await FilterManager.displayResidents(residents, configData);
                    
                    // Aktualisiere die UI der Filter
                    this.updateFilterOptions();
                } catch (error) {
                    console.error('Fehler beim Aktualisieren der Bewohneranzeige:', error);
                    Toast.show('Fehler beim Aktualisieren der Bewohneranzeige', 'error');
                }
                
                return true;
            } else {
                const error = await response.json();
                Toast.show('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'error');
                return false;
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Konfiguration:', error);
            Toast.show('Fehler beim Speichern der Konfiguration', 'error');
            return false;
        }
    },

    updateConfigUI() {
        // Tabs Event Listener
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Entferne aktive Klasse von allen Tabs und Inhalten
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Setze aktive Klasse für ausgewählten Tab und Inhalt
                btn.classList.add('active');
                const tabId = btn.dataset.tab;
                const tabContent = document.getElementById(tabId + 'Tab');
                if (tabContent) {
                    tabContent.classList.add('active');
                }

                // Wenn der Filter-Tab ausgewählt wurde, aktualisiere die Filteroptionen
                if (tabId === 'filter') {
                    this.updateFilterOptions();
                }
            });
        });

        // Felder Tab
        this.updateFieldsList();

        // Bereiche Tab
        this.updateAreasList();

        // Filter Tab
        this.updateFilterOptions();

        // Event Listener für den Speichern-Button
        document.getElementById('saveConfigBtn').addEventListener('click', async () => {
            const configData = this.collectConfigData();
            const success = await this.saveConfig(configData);
            if (success) {
                Modal.hide('configModal');
            }
        });
    },

    updateFieldsList() {
        const fieldsList = document.getElementById('fieldsList');
        fieldsList.innerHTML = '';

        if (this.config?.fields) {
            this.config.fields.forEach((field, index) => {
                if (!['firstName', 'lastName'].includes(field.id)) {
                    const fieldHtml = `
                        <div class="config-item" data-id="${field.id}">
                            <div class="config-item-header">
                                <h4>${field.label}</h4>
                                <button type="button" class="danger-btn delete-field" data-index="${index}">×</button>
                            </div>
                            <div class="config-item-content">
                                <div class="form-group">
                                    <label>Label</label>
                                    <input type="text" class="field-label" value="${field.label}">
                                </div>
                                <div class="form-group">
                                    <label>Typ</label>
                                    <select class="field-type">
                                        ${this.getFieldTypeOptions(field.type)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <span class="switch-label">Pflichtfeld</span>
                                    <label class="switch">
                                        <input type="checkbox" class="field-required" data-index="${index}" ${field.required ? 'checked' : ''}>
                                        <span class="switch-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    `;
                    fieldsList.insertAdjacentHTML('beforeend', fieldHtml);
                }
            });

            // Event Listener für die Pflichtfeld-Switches
            fieldsList.querySelectorAll('.field-required').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.config.fields[index].required = e.target.checked;
                });
            });
        }

        // Event Listener für das Löschen von Feldern
        fieldsList.querySelectorAll('.delete-field').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.config.fields.splice(index, 1);
                this.updateFieldsList();
            });
        });

        // Event Listener für das Hinzufügen von Feldern
        document.getElementById('addFieldBtn').addEventListener('click', () => {
            const newField = {
                id: 'field_' + Date.now(),
                label: 'Neues Feld',
                type: 'text',
                required: false
            };
            this.config.fields = this.config.fields || [];
            this.config.fields.push(newField);
            this.updateFieldsList();
        });
    },

    updateAreasList() {
        const areasList = document.getElementById('areasList');
        areasList.innerHTML = '';

        // Header mit Add-Button
        const headerHtml = `
            <div class="config-item config-header">
                <div class="config-item-header">
                    
                    <button type="button" id="addAreaBtn" class="secondary-btn">+ Bereich hinzufügen</button>
                </div>
            </div>
        `;
        areasList.insertAdjacentHTML('beforeend', headerHtml);

        if (this.config?.areas) {
            this.config.areas.forEach((area, index) => {
                const areaHtml = `
                    <div class="config-item config-area" data-name="${area.name}">
                        <div class="config-item-header">
                            <h4>${area.name}</h4>
                            <button type="button" class="danger-btn delete-area" data-index="${index}">×</button>
                        </div>
                        <div class="config-item-content">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" class="area-name" value="${area.name}">
                            </div>
                            <div class="form-group">
                                <span class="switch-label">Mehrfachauswahl erlauben</span>
                                <label class="switch">
                                    <input type="checkbox" class="area-multiple" data-index="${index}" ${area.allowMultiple ? 'checked' : ''}>
                                    <span class="switch-slider"></span>
                                </label>
                            </div>
                            <div class="form-group">
                                <span class="switch-label">Menü-Filter</span>
                                <label class="switch">
                                    <input type="checkbox" class="area-menu-filter" data-index="${index}" ${area.menuFilter ? 'checked' : ''}>
                                    <span class="switch-slider"></span>
                                </label>
                            </div>
                            <div class="form-group">
                                <span class="switch-label">Menü Relevant</span>
                                <label class="switch">
                                    <input type="checkbox" class="area-changeable" data-index="${index}" ${area.menuRelevant ? 'checked' : ''}>
                                    <span class="switch-slider"></span>
                                </label>
                            </div>
                            <div class="buttons-list">
                                ${area.buttons.map((btn, btnIndex) => `
                                    <div class="button-item">
                                        <input type="text" class="button-label" value="${btn.label}">
                                        <button type="button" class="danger-btn delete-button" data-index="${btnIndex}">×</button>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="secondary-btn add-button">+ Button hinzufügen</button>
                        </div>
                    </div>
                `;
                areasList.insertAdjacentHTML('beforeend', areaHtml);
            });

            // Event Listener für die Switches
            areasList.querySelectorAll('.area-multiple, .area-changeable, .area-menu-filter').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    if (e.target.classList.contains('area-multiple')) {
                        this.config.areas[index].allowMultiple = e.target.checked;
                    } else if (e.target.classList.contains('area-menu-filter')) {
                        this.config.areas[index].menuFilter = e.target.checked;
                    } else {
                        this.config.areas[index].menuRelevant = e.target.checked;
                    }
                });
            });

            // Event Listener für Button-Label-Änderungen
            areasList.querySelectorAll('.button-label').forEach(input => {
                input.addEventListener('input', (e) => {
                    const areaIndex = parseInt(e.target.closest('.config-item').querySelector('.delete-area').dataset.index);
                    const buttonIndex = parseInt(e.target.closest('.button-item').querySelector('.delete-button').dataset.index);
                    this.config.areas[areaIndex].buttons[buttonIndex].label = e.target.value;
                });
            });

            // Event Listener für das Löschen von Buttons
            areasList.querySelectorAll('.delete-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const areaIndex = parseInt(btn.closest('.config-item').querySelector('.delete-area').dataset.index);
                    const buttonIndex = parseInt(btn.dataset.index);
                    this.config.areas[areaIndex].buttons.splice(buttonIndex, 1);
                    this.updateButtonsList(areaIndex);
                });
            });

            // Event Listener für das Hinzufügen von Buttons
            areasList.querySelectorAll('.add-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const areaIndex = parseInt(e.target.closest('.config-item').querySelector('.delete-area').dataset.index);
                    this.config.areas[areaIndex].buttons.push({ label: 'Neuer Button' });
                    this.updateButtonsList(areaIndex);
                });
            });
        }

        // Event Listener für das Löschen von Bereichen
        areasList.querySelectorAll('.delete-area').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.config.areas.splice(index, 1);
                this.updateAreasList();
            });
        });

        // Event Listener für das Hinzufügen von Bereichen
        document.getElementById('addAreaBtn').addEventListener('click', () => {
            const newArea = {
                name: 'Neuer Bereich',
                allowMultiple: false,
                menuRelevant: false,
                menuFilter: false,
                buttons: [{ label: 'Button 1' }]
            };
            this.config.areas = this.config.areas || [];
            this.config.areas.push(newArea);
            this.updateAreasList();

            // Nach dem Update zum neuen Bereich scrollen
            setTimeout(() => {
                const newAreaElement = document.querySelector('#areasList .config-area:last-child');
                if (newAreaElement) {
                    newAreaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        });
    },

    // Neue Funktion zum Aktualisieren nur der Buttons-Liste
    updateButtonsList(areaIndex) {
        const area = this.config.areas[areaIndex];
        const buttonsList = document.querySelector(`[data-name="${area.name}"] .buttons-list`);
        
        buttonsList.innerHTML = area.buttons.map((btn, btnIndex) => `
            <div class="button-item">
                <input type="text" class="button-label" value="${btn.label}">
                <button type="button" class="danger-btn delete-button" data-index="${btnIndex}">×</button>
            </div>
        `).join('');

        // Event Listener für neue Button-Label-Änderungen
        buttonsList.querySelectorAll('.button-label').forEach(input => {
            input.addEventListener('input', (e) => {
                const buttonIndex = parseInt(e.target.closest('.button-item').querySelector('.delete-button').dataset.index);
                this.config.areas[areaIndex].buttons[buttonIndex].label = e.target.value;
            });
        });

        // Event Listener für neue Lösch-Buttons
        buttonsList.querySelectorAll('.delete-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buttonIndex = parseInt(btn.dataset.index);
                this.config.areas[areaIndex].buttons.splice(buttonIndex, 1);
                this.updateButtonsList(areaIndex);
            });
        });
    },

    updateFilterOptions() {
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) return;

        // Felder Filter
        const fieldsSection = document.createElement('div');
        fieldsSection.className = 'filter-section';
        fieldsSection.innerHTML = `
            <h4>Nach Feld filtern</h4>
            <div class="filter-options">
                ${Object.entries(this.config.fields || {}).map(([id, field]) => `
                    <div class="switch-wrapper">
                        <label class="switch">
                            <input type="checkbox" class="field-filter" value="${id}">
                            <span class="switch-slider"></span>
                        </label>
                        <span class="switch-label">${field.label || id}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Bereiche Filter
        const areasSection = document.createElement('div');
        areasSection.className = 'filter-section';
        areasSection.innerHTML = `
            <h4>Nach Bereich filtern</h4>
            <div class="filter-options">
                ${(this.config.areas || []).map(area => `
                    <div class="switch-wrapper">
                        <label class="switch">
                            <input type="checkbox" class="area-filter" value="${area.name}">
                            <span class="switch-slider"></span>
                        </label>
                        <span class="switch-label">${area.name}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Leere den Container und füge die neuen Sektionen hinzu
        filterOptions.innerHTML = '';
        filterOptions.appendChild(fieldsSection);
        filterOptions.appendChild(areasSection);

        // Event Listener für die Filter-Checkboxen
        filterOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const type = checkbox.classList.contains('field-filter') ? 'field' : 'area';
                this.handleFilterChange(checkbox, type);
            });
        });
    },

    handleFilterChange(checkbox, type) {
        const value = checkbox.value;
        const isChecked = checkbox.checked;

        // Aktualisiere die Filter-Konfiguration
        if (!this.config.filters) {
            this.config.filters = {
                fields: [],
                areas: []
            };
        }

        if (type === 'field') {
            if (isChecked) {
                this.config.filters.fields.push(value);
            } else {
                this.config.filters.fields = this.config.filters.fields.filter(f => f !== value);
            }
        } else {
            if (isChecked) {
                this.config.filters.areas.push(value);
            } else {
                this.config.filters.areas = this.config.filters.areas.filter(a => a !== value);
            }
        }

        // Aktualisiere die Checkbox-States basierend auf der Konfiguration
        const filterOptions = document.getElementById('filterOptions');
        if (filterOptions) {
            filterOptions.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                const cbType = cb.classList.contains('field-filter') ? 'field' : 'area';
                const cbValue = cb.value;
                
                if (cbType === 'field') {
                    cb.checked = this.config.filters.fields.includes(cbValue);
                } else {
                    cb.checked = this.config.filters.areas.includes(cbValue);
                }
            });
        }
    },

    collectConfigData() {
        const configData = {
            fields: [],
            areas: [],
            filters: this.config.filters || { fields: [], areas: [] }
        };

        // Felder sammeln
        document.querySelectorAll('#fieldsList .config-item').forEach(item => {
            configData.fields.push({
                id: item.dataset.id,
                label: item.querySelector('.field-label').value,
                type: item.querySelector('.field-type').value,
                required: item.querySelector('.field-required').checked
            });
        });

        // Bereiche sammeln - nur die Items mit der Klasse config-area
        document.querySelectorAll('#areasList .config-area').forEach(item => {
            const buttons = [];
            item.querySelectorAll('.button-item').forEach(buttonItem => {
                buttons.push({
                    label: buttonItem.querySelector('.button-label').value
                });
            });

            configData.areas.push({
                name: item.querySelector('.area-name').value,
                allowMultiple: item.querySelector('.area-multiple').checked,
                menuFilter: item.querySelector('.area-menu-filter').checked,
                menuRelevant: item.querySelector('.area-changeable').checked,
                buttons: buttons
            });
        });

        // Filter-Konfiguration sammeln
        const filterOptions = document.getElementById('filterOptions');
        if (filterOptions) {
            configData.filters = {
                fields: Array.from(filterOptions.querySelectorAll('.field-filter:checked')).map(cb => cb.value),
                areas: Array.from(filterOptions.querySelectorAll('.area-filter:checked')).map(cb => cb.value)
            };
        }

        return configData;
    },

    getFieldTypeOptions(selectedType = 'text') {
        const types = [
            { value: 'text', label: 'Text' },
            { value: 'number', label: 'Nummer' },
            { value: 'date', label: 'Datum' },
            { value: 'email', label: 'E-Mail' },
            { value: 'tel', label: 'Telefon' }
        ];

        return types.map(type => 
            `<option value="${type.value}" ${type.value === selectedType ? 'selected' : ''}>
                ${type.label}
            </option>`
        ).join('');
    }
}; 