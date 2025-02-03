// Import modules
import * as Interface from './Modules/Interface.js';
import * as Person from './Modules/person.js';
import * as Plan from './Modules/plan.js';
import * as Print from './Modules/print.js';

// Constants
const API_BASE_URL = 'http://localhost:8086/api';
const ENDPOINTS = {
    SOLO_SELECT: 'soloselect',
    PLAN: 'plan'
};

// Initialize the application
async function init() {
    try {
        // Load form configuration
        const response = await fetch(`${API_BASE_URL}/${ENDPOINTS.SOLO_SELECT}/config`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();
        Interface.updateFormConfig(config);

        // Initialize selectors and load initial data
        await Interface.initializeSelectors();
        
        // Initialize print modal
        Print.initializePrintModal(Interface.DAYS);
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Fehler beim Initialisieren der Anwendung');
    }
}

// Load all necessary data
export async function loadData() {
    try {
        const year = Interface.yearSelect.value;
        const week = Interface.weekSelect.value;

        // Load plan data (layouts and categories)
        await Plan.loadPlanData(API_BASE_URL, ENDPOINTS, year, week);
        
        // Load persons
        await Person.loadPersons(API_BASE_URL, ENDPOINTS);

        // Load individual plans
        const missingPlans = [];
        for (const person of Person.allPersons) {
            const success = await Plan.loadIndividualPlan(API_BASE_URL, ENDPOINTS, year, week, person);
            if (!success) {
                missingPlans.push({
                    name: Person.formatPersonName(person),
                    id: person.id
                });
            }
        }

        // Display missing plans if any
        if (missingPlans.length > 0) {
            displayMissingPlans(missingPlans);
        }

        // Filter and display plans
        filterPlans();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Fehler beim Laden der Daten');
    }
}

// Set up event listeners
function setupEventListeners() {
    Interface.yearSelect.addEventListener('change', loadData);
    Interface.weekSelect.addEventListener('change', loadData);
    Interface.printBtn.addEventListener('click', () => Print.printModal.classList.add('active'));

    // Layout configuration
    const layoutConfigBtn = document.getElementById('layout-config-btn');
    const layoutConfigModal = document.getElementById('layoutConfigModal');
    const addLayoutBtn = document.getElementById('add-layout-btn');
    const saveConfigBtn = document.getElementById('save-config');
    const cancelConfigBtn = document.getElementById('cancel-config');

    // Globaler Event-Listener für alle Modals
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('close-modal')) {
            const modal = event.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }
    });

    layoutConfigBtn.addEventListener('click', () => {
        updateLayoutList();
        layoutConfigModal.classList.add('active');
    });

    cancelConfigBtn.addEventListener('click', () => {
        layoutConfigModal.classList.remove('active');
    });

    saveConfigBtn.addEventListener('click', async () => {
        try {
            await Plan.saveLayoutConfig(
                API_BASE_URL,
                ENDPOINTS,
                Interface.yearSelect.value,
                Interface.weekSelect.value
            );
            layoutConfigModal.classList.remove('active');
            await loadData(); // Neu laden um Änderungen anzuzeigen
            alert('Konfiguration erfolgreich gespeichert!');
        } catch (error) {
            alert('Fehler beim Speichern der Konfiguration');
        }
    });

    addLayoutBtn.addEventListener('click', () => {
        const newLayout = {
            id: `layout_${Date.now()}`,
            name: 'Neues Layout',
            categories: []
        };
        Plan.printLayouts.push(newLayout);
        updateLayoutList();
    });
}

// Update layout list
function updateLayoutList() {
    const layoutList = document.querySelector('.layout-list');
    layoutList.innerHTML = Plan.printLayouts.map(layout => `
        <div class="layout-item" data-layout-id="${layout.id}">
            <div class="layout-header">
                <input type="text" class="layout-name-input" value="${layout.name}">
                <button class="delete-layout-btn">&times;</button>
            </div>
            <div class="category-select">
                <div class="category-select-header">
                    <span>Kategorien:</span>
                    <button class="add-category-btn">+</button>
                </div>
                <div class="selected-categories">
                    ${layout.categories.map(category => `
                        <div class="category-item">
                            <span>${category}</span>
                            <button class="remove-category-btn" data-category="${category}">&times;</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="filter-select">
                <div class="filter-select-header">
                    <span>Filter:</span>
                    <button class="add-filter-btn">+</button>
                </div>
                <div class="selected-filters">
                    ${(layout.filters || []).map(filter => `
                        <div class="filter-item">
                            <span>${filter.area}: ${filter.value}</span>
                            <button class="remove-filter-btn" data-area="${filter.area}" data-value="${filter.value}">&times;</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for layout items
    layoutList.querySelectorAll('.layout-item').forEach(item => {
        const layoutId = item.dataset.layoutId;
        const layout = Plan.printLayouts.find(l => l.id === layoutId);
        if (!layout.filters) layout.filters = [];
        
        // Layout name change
        const nameInput = item.querySelector('.layout-name-input');
        nameInput.addEventListener('change', () => {
            layout.name = nameInput.value;
            filterPlans(); // Update display
        });

        // Delete layout
        const deleteBtn = item.querySelector('.delete-layout-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Layout wirklich löschen?')) {
                const index = Plan.printLayouts.findIndex(l => l.id === layoutId);
                if (index !== -1) {
                    Plan.printLayouts.splice(index, 1);
                    updateLayoutList();
                    filterPlans(); // Update display
                }
            }
        });

        // Add category
        const addCategoryBtn = item.querySelector('.add-category-btn');
        addCategoryBtn.addEventListener('click', () => {
            const categorySelect = document.createElement('div');
            categorySelect.className = 'category-multiselect active';
            categorySelect.innerHTML = `
                <div class="category-checkbox-list">
                    ${Plan.currentCategories.map(category => `
                        <label class="category-checkbox-item">
                            <input type="checkbox" value="${category}" 
                                   ${layout.categories.includes(category) ? 'checked' : ''}>
                            ${category}
                        </label>
                    `).join('')}
                </div>
                <div class="multiselect-actions">
                    <button class="btn-add-categories">Übernehmen</button>
                </div>
            `;

            const existingSelect = item.querySelector('.category-multiselect');
            if (existingSelect) {
                existingSelect.remove();
            }
            item.querySelector('.category-select').appendChild(categorySelect);

            // Add categories button
            const addCategoriesBtn = categorySelect.querySelector('.btn-add-categories');
            addCategoriesBtn.addEventListener('click', () => {
                const selectedCategories = Array.from(
                    categorySelect.querySelectorAll('input[type="checkbox"]:checked')
                ).map(cb => cb.value);
                
                layout.categories = selectedCategories;
                updateLayoutList();
                filterPlans(); // Update display
            });
        });

        // Remove category
        item.querySelectorAll('.remove-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const index = layout.categories.indexOf(category);
                if (index !== -1) {
                    layout.categories.splice(index, 1);
                    updateLayoutList();
                    filterPlans(); // Update display
                }
            });
        });

        // Add filter
        const addFilterBtn = item.querySelector('.add-filter-btn');
        addFilterBtn.addEventListener('click', () => {
            const filterSelect = document.createElement('div');
            filterSelect.className = 'filter-multiselect active';
            
            // Erstelle eine Liste aller verfügbaren Filter aus formConfig
            const filterOptions = Interface.formConfig.areas
                .filter(area => area.menuFilter)
                .map(area => area.buttons.map(button => ({
                    area: area.name,
                    value: button.label
                }))).flat();

            filterSelect.innerHTML = `
                <div class="filter-checkbox-list">
                    ${filterOptions.map(filter => `
                        <label class="filter-checkbox-item">
                            <input type="checkbox" 
                                   data-area="${filter.area}" 
                                   data-value="${filter.value}"
                                   ${layout.filters.some(f => f.area === filter.area && f.value === filter.value) ? 'checked' : ''}>
                            ${filter.area}: ${filter.value}
                        </label>
                    `).join('')}
                </div>
                <div class="multiselect-actions">
                    <button class="btn-add-filters">Übernehmen</button>
                </div>
            `;

            const existingSelect = item.querySelector('.filter-multiselect');
            if (existingSelect) {
                existingSelect.remove();
            }
            item.querySelector('.filter-select').appendChild(filterSelect);

            // Add filters button
            const addFiltersBtn = filterSelect.querySelector('.btn-add-filters');
            addFiltersBtn.addEventListener('click', () => {
                const selectedFilters = Array.from(
                    filterSelect.querySelectorAll('input[type="checkbox"]:checked')
                ).map(cb => ({
                    area: cb.dataset.area,
                    value: cb.dataset.value
                }));
                
                layout.filters = selectedFilters;
                updateLayoutList();
                filterPlans(); // Update display
            });
        });

        // Remove filter
        item.querySelectorAll('.remove-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const area = btn.dataset.area;
                const value = btn.dataset.value;
                const index = layout.filters.findIndex(f => f.area === area && f.value === value);
                if (index !== -1) {
                    layout.filters.splice(index, 1);
                    updateLayoutList();
                    filterPlans(); // Update display
                }
            });
        });
    });
}

// Filter and display plans
export function filterPlans() {
    const filteredPersons = Person.filterPersons(Interface.activeFilters, Plan.currentPlans);
    displayPlans(filteredPersons);
}

// Display missing plans
function displayMissingPlans(missingPlans) {
    // Entferne zuerst alle existierenden "missing-plans" Elemente
    document.querySelectorAll('.missing-plans').forEach(el => el.remove());

    const missingPlansHtml = `
        <div class="missing-plans">
            <h3>Fehlende Pläne für KW${Interface.weekSelect.value}/${Interface.yearSelect.value}:</h3>
            <ul>
                ${missingPlans.map(person => `
                    <li>${person.name}</li>
                `).join('')}
            </ul>
        </div>
    `;

    const plansContainer = document.querySelector('.plans-container');
    const missingPlansElement = document.createElement('div');
    missingPlansElement.innerHTML = missingPlansHtml;
    plansContainer.parentNode.insertBefore(missingPlansElement, plansContainer);
}

// Display filtered plans
function displayPlans(persons) {
    let plansContainer = document.querySelector('.plans-container');
    if (!plansContainer) {
        plansContainer = document.createElement('div');
        plansContainer.className = 'plans-container';
        document.querySelector('.container').appendChild(plansContainer);
    }

    if (persons.length === 0) {
        plansContainer.innerHTML = '<p>Keine Pläne gefunden</p>';
        return;
    }

    plansContainer.innerHTML = createPlansHTML(persons);
    attachPlanEventListeners(persons);
}

// Create plans HTML
function createPlansHTML(persons) {
    return persons.map(person => `
        <div class="person-row">
            <div class="person-info">
                <div class="person-name">${Person.formatPersonName(person)}</div>
                <div class="person-areas">
                    ${Object.entries(person.areas || {})
                        .map(([key, value]) => `<span>${key}: ${value}</span>`)
                        .join(' | ')}
                </div>
            </div>
            <div class="days-container">
                ${Interface.DAYS.map((day, dayIndex) => `
                    <div class="day-column">
                        <div class="day-header">${day}</div>
                        <div class="layout-buttons">
                            ${Plan.printLayouts.map(layout => `
                                <button class="day-button layout-${layout.id}" 
                                        data-person-id="${person.id}" 
                                        data-day-index="${dayIndex}"
                                        data-layout-id="${layout.id}">
                                    ${layout.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Attach event listeners to plan elements
function attachPlanEventListeners(persons) {
    document.querySelectorAll('.day-button').forEach(button => {
        button.addEventListener('click', () => {
            const personId = button.dataset.personId;
            const dayIndex = parseInt(button.dataset.dayIndex);
            const layoutId = button.dataset.layoutId;
            const person = persons.find(p => p.id === personId);
            const plan = Plan.currentPlans.get(personId);
            const layout = Plan.printLayouts.find(l => l.id === layoutId);

            if (person && plan && layout) {
                showDayMenu(person, plan, dayIndex, layout);
            }
        });
    });
}

// Show day menu
function showDayMenu(person, plan, dayIndex, layout) {
    const modal = document.getElementById('menuModal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        // Erstelle den Modal-Content
        modalContent.innerHTML = `
            <button class="close-modal">&times;</button>
            ${Print.createDayMenuHTML(person, plan, dayIndex, layout)}
        `;
        modal.classList.add('active');

        // Event-Listener für den Schließen-Button
        const closeButton = modalContent.querySelector('.close-modal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // Event-Listener für Klicks außerhalb des Modals
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Initialize the application
init();

function createMenuContent(person, day, mealType) {
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.id = 'modalContent';

    // Erstelle den Header
    const header = document.createElement('div');
    header.className = 'menu-header';

    // Füge den Schließen-Button hinzu
    const closeButton = document.createElement('button');
    closeButton.className = 'close-menu';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        document.getElementById('menuModal').classList.remove('active');
    };
    header.appendChild(closeButton);

    // Person Name
    const personName = document.createElement('h2');
    personName.className = 'person-name';
    personName.textContent = formatPersonName(person);
    header.appendChild(personName);

    // Person Areas
    const areasDiv = document.createElement('div');
    areasDiv.className = 'person-areas';
    areasDiv.innerHTML = formatPersonAreas(person.areas);
    header.appendChild(areasDiv);

    // Day Header
    const dayHeader = document.createElement('h3');
    dayHeader.className = 'day-header';
    dayHeader.textContent = `${DAYS[day]} - ${mealType}`;
    header.appendChild(dayHeader);

    content.appendChild(header);

    // Rest der Funktion bleibt unverändert
    // ...
}


