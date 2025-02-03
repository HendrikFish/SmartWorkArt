import { Modal } from './modal.js';
import { Toast, normalizeString } from './module.js';

export const FilterManager = {
    async displayResidents(residents, config) {
        const list = document.getElementById('residentsList');
        list.innerHTML = '';
        list.className = 'residents-grid';

        if (!config?.filters?.areas?.length && !config?.filters?.fields?.length) {
            return this.displayResidentsDefault(residents);
        }

        if (config.filters.fields?.length > 0) {
            const activeField = config.filters.fields[0];
            this.displayFieldFilter(residents, activeField);
        } else if (config.filters.areas?.length > 0) {
            const activeArea = config.filters.areas[0];
            this.displayAreaFilter(residents, activeArea, config);
        }
    },

    displayResidentsDefault(residents) {
        const list = document.getElementById('residentsList');
        residents.forEach(resident => {
            const card = this.createResidentCard(resident);
            list.appendChild(card);
        });
    },

    displayFieldFilter(residents, field) {
        const list = document.getElementById('residentsList');

        if (field === 'gender') {
            this.displayGenderFilter(residents, list);
        } else if (field === 'firstName' || field === 'lastName') {
            this.displayNameFilter(residents, field, list);
        } else {
            this.displayGeneralFieldFilter(residents, field, list);
        }
    },

    displayGenderFilter(residents, list) {
        const groupedResidents = {
            'Herr': [],
            'Frau': [],
            'Nicht zugewiesen': []
        };

        residents.forEach(resident => {
            if (resident.gender === 'Herr') {
                groupedResidents['Herr'].push(resident);
            } else if (resident.gender === 'Frau') {
                groupedResidents['Frau'].push(resident);
            } else {
                groupedResidents['Nicht zugewiesen'].push(resident);
            }
        });

        this.createFilterColumns(groupedResidents, list);
    },

    displayNameFilter(residents, field, list) {
        const sortedResidents = [...residents].sort((a, b) => 
            a[field].localeCompare(b[field])
        );

        const groupedResidents = {};
        sortedResidents.forEach(resident => {
            const firstLetter = resident[field].charAt(0).toUpperCase();
            if (!groupedResidents[firstLetter]) {
                groupedResidents[firstLetter] = [];
            }
            groupedResidents[firstLetter].push(resident);
        });

        this.createFilterColumns(groupedResidents, list);
    },

    displayGeneralFieldFilter(residents, field, list) {
        const groupedResidents = {};
        residents.forEach(resident => {
            const value = resident[field] || 'Nicht zugewiesen';
            if (!groupedResidents[value]) {
                groupedResidents[value] = [];
            }
            groupedResidents[value].push(resident);
        });

        this.createFilterColumns(groupedResidents, list);
    },

    displayAreaFilter(residents, areaName, config) {
        const list = document.getElementById('residentsList');
        const area = config.areas.find(a => a.name === areaName);
        if (!area) return;

        const columns = new Map();
        columns.set('Nicht zugewiesen', []);
        area.buttons.forEach(btn => columns.set(btn.label, []));

        residents.forEach(resident => {
            const selectedButtons = resident.areas?.[areaName]?.split(',').map(v => v.trim()) || [];
            
            if (selectedButtons.length === 0) {
                columns.get('Nicht zugewiesen').push(resident);
            } else {
                selectedButtons.forEach(buttonLabel => {
                    if (columns.has(buttonLabel)) {
                        columns.get(buttonLabel).push(resident);
                    }
                });
            }
        });

        columns.forEach((residentGroup, columnName) => {
            const column = document.createElement('div');
            column.className = 'residents-column';
            column.innerHTML = `
                <button class="filter-button" data-value="${columnName}">
                    ${columnName}
                </button>
            `;

            residentGroup.forEach(resident => {
                const card = this.createResidentCard(resident);
                column.appendChild(card);
            });

            list.appendChild(column);
        });
    },

    createFilterColumns(groupedResidents, list) {
        Object.entries(groupedResidents).forEach(([groupName, residentGroup]) => {
            const column = document.createElement('div');
            column.className = 'residents-column';
            column.innerHTML = `
                <button class="filter-button" data-value="${groupName}">
                    ${groupName}
                </button>
            `;

            residentGroup.forEach(resident => {
                const card = this.createResidentCard(resident);
                column.appendChild(card);
            });

            list.appendChild(column);
        });
    },

    createResidentCard(resident, showLastNameFirst = false) {
        const card = document.createElement('div');
        card.className = 'resident-card';
        
        const displayName = showLastNameFirst 
            ? `${resident.lastName}, ${resident.firstName}`
            : `${resident.firstName} ${resident.lastName}`;
            
        card.innerHTML = `<h3>${displayName}</h3>`;
        
        // Event-Listener für Klicks
        card.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/solo/config');
                const config = await response.json();
                
                const modal = document.getElementById('residentDetailModal');
                const content = modal.querySelector('.modal-content');

                // Gruppiere die Bereiche
                const personalInfo = `
                    <div class="form-group">
                        <label>Geschlecht:</label>
                        <select class="form-input" name="gender">
                            <option value="Herr" ${resident.gender === 'Herr' ? 'selected' : ''}>Herr</option>
                            <option value="Frau" ${resident.gender === 'Frau' ? 'selected' : ''}>Frau</option>
                            <option value="" ${!resident.gender ? 'selected' : ''}>Nicht angegeben</option>
                        </select>
                    </div>
                    ${config.fields?.map(field => `
                        <div class="form-group">
                            <label>${field.label}:</label>
                            <input 
                                type="${field.type || 'text'}" 
                                class="form-input" 
                                name="${field.id}" 
                                value="${resident[field.id] || ''}"
                                ${field.required ? 'required' : ''}
                            >
                        </div>
                    `).join('') || ''}
                `;

                const areasHtml = config.areas?.map(area => `
                    <div class="area-group">
                        <h3 class="area-group-title">${area.name}</h3>
                        <div class="form-group area-buttons">
                            <div class="button-group">
                                ${area.buttons.map(button => `
                                    <button type="button" 
                                        class="filter-button ${(resident.areas?.[area.name] || '').includes(button.label) ? 'active' : ''}"
                                        data-area="${area.name}"
                                        data-button="${button.label}"
                                        data-multiple="${area.allowMultiple || false}"
                                        ${!area.menuRelevant ? 'disabled' : ''}>
                                        ${button.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('') || '';

                content.innerHTML = `
                    <div class="modal-header">
                        <h2>${resident.firstName} ${resident.lastName}</h2>
                        <button type="button" class="icon-btn close-modal">×</button>
                    </div>
                    <div class="fields-container">
                        <div class="personal-info">
                            <h3 class="section-title">Persönliche Informationen</h3>
                            ${personalInfo}
                        </div>
                        ${areasHtml}
                    </div>
                    <div class="button-container">
                        <button type="button" class="primary-btn" id="saveResidentBtn">Speichern</button>
                        <button type="button" class="danger-btn" id="dismissResidentBtn">Entlassen</button>
                    </div>
                `;

                // Event Listener für die Bereichs-Buttons
                content.querySelectorAll('.area-buttons .filter-button:not([disabled])').forEach(button => {
                    button.addEventListener('click', () => {
                        const area = button.dataset.area;
                        const buttonLabel = button.dataset.button;
                        const currentArea = config.areas.find(a => a.name === area);
                        
                        // Hier prüfen wir auf allowMultiple statt multiple
                        const isMultiple = currentArea?.allowMultiple === true;
                        const buttonGroup = button.closest('.button-group');
                        
                        // Toggle Button-Status
                        button.classList.toggle('active');
                        
                        // Aktualisiere resident.areas
                        if (!resident.areas) resident.areas = {};
                        if (!resident.areas[area]) resident.areas[area] = '';
                        
                        let buttons = resident.areas[area].split(',').map(b => b.trim()).filter(b => b);
                        
                        if (button.classList.contains('active')) {
                            if (!buttons.includes(buttonLabel)) {
                                if (!isMultiple) {
                                    // Bei Einzelauswahl alle anderen Buttons deaktivieren
                                    buttonGroup.querySelectorAll('.filter-button.active').forEach(activeButton => {
                                        if (activeButton !== button) {
                                            activeButton.classList.remove('active');
                                        }
                                    });
                                    buttons = [buttonLabel];
                                } else {
                                    buttons.push(buttonLabel);
                                }
                            }
                        } else {
                            buttons = buttons.filter(b => b !== buttonLabel);
                        }
                        
                        // Aktualisiere den Wert im resident.areas Objekt
                        resident.areas[area] = buttons.join(', ');
                        
                        console.log(`Bereich ${area}, Multiple: ${isMultiple}, Buttons: ${buttons.join(', ')}`);
                    });
                });

                // Event Listener für den Speichern-Button
                content.querySelector('#saveResidentBtn').addEventListener('click', async () => {
                    // Sammle alle Formular-Daten
                    const formInputs = content.querySelectorAll('.form-input');
                    formInputs.forEach(input => {
                        if (input.name === 'gender') {
                            resident.gender = input.value;
                        } else {
                            resident[input.name] = input.value;
                        }
                    });

                    const normalizedName = `${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
                    const response = await fetch(`/api/solo/resident/${normalizedName}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(resident)
                    });

                    if (response.ok) {
                        Toast.show('Bewohner erfolgreich aktualisiert', 'success');
                        Modal.hideAll();
                        // Lade die Bewohner neu
                        const residentsResponse = await fetch('/api/solo/residents');
                        const residents = await residentsResponse.json();
                        this.displayResidents(residents, config);
                    } else {
                        const error = await response.json();
                        Toast.show('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'error');
                    }
                });

                // Event Listener für den Entlassen-Button
                content.querySelector('#dismissResidentBtn').addEventListener('click', async () => {
                    const normalizedName = `${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
                    const response = await fetch(`/api/solo/resident/dismiss/${normalizedName}`, {
                        method: 'POST'
                    });

                    if (response.ok) {
                        Toast.show('Bewohner erfolgreich entlassen', 'success');
                        Modal.hideAll();
                        // Lade die Bewohner neu
                        const residentsResponse = await fetch('/api/solo/residents');
                        const residents = await residentsResponse.json();
                        this.displayResidents(residents, config);
                    } else {
                        const error = await response.json();
                        Toast.show('Fehler beim Entlassen: ' + (error.error || 'Unbekannter Fehler'), 'error');
                    }
                });

                Modal.show('residentDetailModal');
            } catch (error) {
                console.error('Fehler beim Anzeigen der Bewohnerdetails:', error);
                Toast.show('Fehler beim Anzeigen der Bewohnerdetails', 'error');
            }
        });
        
        return card;
    }
}; 