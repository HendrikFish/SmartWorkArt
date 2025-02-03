import { Toast, normalizeString } from './Module/module.js';
import { Modal } from './Module/modal.js';
import { SaveManager } from './Module/save.js';
import { FilterManager } from './Module/filter.js';
import { ConfigManager } from './Module/config.js';

// Bewohner-Verwaltung
export const ResidentManager = {
    async init() {
        try {
            await this.loadResidents();
        } catch (error) {
            console.error('Fehler beim Initialisieren:', error);
            Toast.show('Fehler beim Initialisieren', 'error');
        }
    },

    async loadResidents() {
        try {
            // Lade die Konfiguration
            const config = await ConfigManager.loadConfig();
            
            // Lade die Bewohner
            const response = await fetch('/api/solo/residents');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Bewohner');
            }
            const residents = await response.json();
            console.log('Geladene Bewohner:', residents); // Debug-Log
            
            // Zeige die Bewohner an
            await FilterManager.displayResidents(residents, config);
        } catch (error) {
            console.error('Fehler beim Laden der Bewohner:', error);
            Toast.show('Fehler beim Laden der Bewohner', 'error');
        }
    },

    async showResidentDetails(resident) {
        try {
            const config = await ConfigManager.loadConfig();
            const modal = document.getElementById('residentDetailModal');
            const content = modal.querySelector('.modal-content');
            
            content.innerHTML = `
                <div class="modal-header">
                    <h2>${resident.firstName} ${resident.lastName}</h2>
                    <button type="button" class="icon-btn close-modal">×</button>
                </div>
                <div class="fields-container">
                    <div class="form-group">
                        <label>Geschlecht:</label>
                        <span>${resident.gender || 'Nicht angegeben'}</span>
                    </div>
                    ${config.fields?.map(field => `
                        <div class="form-group">
                            <label>${field.label}:</label>
                            <span>${resident[field.id] || 'Nicht angegeben'}</span>
                        </div>
                    `).join('') || ''}
                    ${config.areas?.map(area => `
                        <div class="form-group">
                            <label>${area.name}:</label>
                            <span>${resident.areas?.[area.name] || 'Nicht angegeben'}</span>
                        </div>
                    `).join('') || ''}
                </div>
                <div class="button-container">
                    <button type="button" class="danger-btn" id="dismissResidentBtn">Entlassen</button>
                </div>
            `;

            // Event Listener für den Entlassen-Button
            content.querySelector('#dismissResidentBtn').addEventListener('click', async () => {
                if (await SaveManager.dismissResident(resident)) {
                    await this.loadResidents();
                }
            });

            Modal.show('residentDetailModal');
        } catch (error) {
            console.error('Fehler beim Anzeigen der Bewohnerdetails:', error);
            Toast.show('Fehler beim Anzeigen der Bewohnerdetails', 'error');
        }
    }
};

// Form-Verwaltung
const FormManager = {
    async updateForm() {
        try {
            const config = await ConfigManager.loadConfig();
            const form = document.getElementById('newResidentFormContent');
            const dynamicFields = form.querySelector('#dynamicFields');
            const dynamicAreas = form.querySelector('#dynamicAreas');
            
            // Dynamische Felder leeren
            dynamicFields.innerHTML = '';
            dynamicAreas.innerHTML = '';

            // Felder hinzufügen
            if (config && config.fields) {
                config.fields.forEach(field => {
                    if (!['firstName', 'lastName'].includes(field.id)) {
                        const fieldHtml = `
                            <div class="form-group ${field.required ? 'required-field' : ''}">
                                <label for="${field.id}">${field.label}</label>
                                <input type="${field.type}" 
                                       id="${field.id}" 
                                       name="${field.id}"
                                       ${field.required ? 'required' : ''}>
                            </div>
                        `;
                        dynamicFields.insertAdjacentHTML('beforeend', fieldHtml);
                    }
                });
            }

            // Bereiche hinzufügen
            if (config && config.areas) {
                config.areas.forEach(area => {
                    const areaHtml = `
                        <div class="area-buttons-group">
                            <h4>${area.name}</h4>
                            <div class="area-buttons" data-multiple="${area.allowMultiple || false}">
                                ${area.buttons.map(btn => `
                                    <button type="button" 
                                            class="secondary-btn area-button" 
                                            data-area="${area.name}"
                                            data-value="${btn.label}">
                                        ${btn.label}
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" name="area_${area.name}" id="area_${area.name}">
                        </div>
                    `;
                    dynamicAreas.insertAdjacentHTML('beforeend', areaHtml);
                });
            }

            // Event Listener für die Buttons
            form.querySelectorAll('.area-buttons').forEach(buttonGroup => {
                const buttons = buttonGroup.querySelectorAll('.area-button');
                const isMultiple = buttonGroup.dataset.multiple === 'true';
                const areaName = buttons[0]?.dataset.area;
                const hiddenInput = areaName 
                    ? buttonGroup.closest('.area-buttons-group')?.querySelector(`input[name="area_${areaName}"]`)
                    : buttonGroup.closest('.gender-buttons-group')?.querySelector('#gender');

                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (isMultiple) {
                            btn.classList.toggle('active');
                            const activeButtons = Array.from(buttonGroup.querySelectorAll('.area-button.active'))
                                .map(activeBtn => activeBtn.dataset.value || activeBtn.dataset.gender);
                            if (hiddenInput) {
                                hiddenInput.value = activeButtons.join(',');
                            }
                        } else {
                            buttonGroup.querySelectorAll('.area-button').forEach(b => 
                                b.classList.remove('active'));
                            btn.classList.add('active');
                            if (hiddenInput) {
                                hiddenInput.value = btn.dataset.value || btn.dataset.gender;
                            }
                        }

                        const errorMessage = buttonGroup.closest('.gender-buttons-group')?.querySelector('.error-message');
                        if (errorMessage) {
                            errorMessage.style.display = 'none';
                        }
                    });
                });
            });

            // Event Listener für das Formular
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (await SaveManager.saveResident(new FormData(e.target), true)) {
                    await ResidentManager.loadResidents();
                }
            });

        } catch (error) {
            console.error('Fehler beim Aktualisieren des Formulars:', error);
            Toast.show('Fehler beim Aktualisieren des Formulars', 'error');
        }
    }
};

// Event Listeners und Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
    Modal.init();
    await ResidentManager.init();

    // Bewohner erfassen
    document.getElementById('newResidentBtn').addEventListener('click', () => {
        FormManager.updateForm();
        Modal.show('newResidentForm');
    });

    // Config
    document.getElementById('configBtn').addEventListener('click', async () => {
        await ConfigManager.loadConfig();
        Modal.show('configModal');
    });

    // Auferstehung
    document.getElementById('resurrectionBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/solo/residents/dismissed');
            const dismissedResidents = await response.json();
            
            const list = document.getElementById('dismissedResidentsList');
            list.innerHTML = '';
            
            dismissedResidents.forEach(resident => {
                const button = document.createElement('button');
                button.className = 'resident-card';
                button.innerHTML = `${resident.firstName} ${resident.lastName}`;
                
                button.addEventListener('click', async () => {
                    if (await SaveManager.resurrectResident(resident)) {
                        await ResidentManager.loadResidents();
                    }
                });
                
                list.appendChild(button);
            });
            
            Modal.show('resurrectionModal');
        } catch (error) {
            console.error('Fehler beim Laden der entlassenen Bewohner:', error);
            Toast.show('Fehler beim Laden der entlassenen Bewohner', 'error');
        }
    });
}); 