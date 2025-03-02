import { getCurrentWeek, getCurrentYear, updateCurrentWeek, updateCurrentYear, selectedResident, selectedMeals, mealPlanData, formConfig, domElements, residentsData } from './variablen.js';
import { WEEKDAYS, CATEGORIES, API_BASE_URL } from './konstanten.js';
import { formatDate, getWeekStartDate, createStorageKey, createNewSelection, extractMinimalMealData } from './hilfsfunktionen.js';
import { loadResidentSelections, saveResidentSelections, checkExistingData, loadMealPlan } from './api.js';
import { showResidentDetails, updateUI, updateMealTable, updateResidentButtons } from './interface.js';

// Event Listeners initialisieren
export function initializeEventListeners() {
    // Prüfe ob die DOM-Elemente existieren
    if (!domElements.prevWeekBtn || !domElements.nextWeekBtn) {
        console.error('Wochennavigations-Buttons nicht gefunden');
        return;
    }

    // Wochennavigation
    domElements.prevWeekBtn.onclick = () => changeWeek(-1);
    domElements.nextWeekBtn.onclick = () => changeWeek(1);
    
    // Aktuelle Woche Button
    const currentWeekBtn = document.createElement('button');
    currentWeekBtn.className = 'current-week-btn';
    currentWeekBtn.textContent = 'Aktuelle Woche';
    currentWeekBtn.onclick = loadCurrentWeek;
    
    // Alternativen bearbeiten Button
    const editAlternativesBtn = document.createElement('button');
    editAlternativesBtn.className = 'edit-alternatives-btn';
    editAlternativesBtn.textContent = 'Alternativen bearbeiten';
    editAlternativesBtn.onclick = openAlternativesEditor;
    
    // Button zum Verwalten der Abendessen-Kategorien
    const manageCategoriesBtn = document.createElement('button');
    manageCategoriesBtn.id = 'manageCategoriesBtn';
    manageCategoriesBtn.className = 'manage-categories-btn';
    manageCategoriesBtn.textContent = 'Abendessen-Kategorien verwalten';
    manageCategoriesBtn.onclick = openCategoryManager;
    
    // Buttons nach den Week-Controls einfügen
    const weekControls = document.querySelector('.week-controls');
    if (weekControls) {
        weekControls.appendChild(currentWeekBtn);
        weekControls.appendChild(editAlternativesBtn);
        weekControls.appendChild(manageCategoriesBtn);
    }

    // Globaler Click-Handler
    document.addEventListener('click', handleGlobalClick);
    
    // Lade die aktuelle Woche beim Start
    loadCurrentWeek();
    
    console.log('Event-Listener erfolgreich initialisiert');
}

// Aktuelle Woche laden
async function loadCurrentWeek() {
    try {
        const today = new Date();
        
        // Berechne die aktuelle Kalenderwoche
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        
        // Neue Werte setzen
        updateCurrentWeek(weekNumber);
        updateCurrentYear(today.getFullYear());
        
        // UI aktualisieren
        if (domElements.currentWeekSpan) {
            domElements.currentWeekSpan.textContent = `KW${weekNumber}`;
        }

        // Datum aktualisieren
        if (domElements.currentDateSpan) {
            const startDate = getWeekStartDate(today.getFullYear(), weekNumber);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);
            
            domElements.currentDateSpan.textContent = `${formattedStartDate} - ${formattedEndDate}`;
        }

        // Daten laden und UI aktualisieren
        await loadMealPlan();
        
        if (selectedResident && Object.keys(selectedResident).length > 0) {
            await loadResidentSelections(selectedResident);
        } else {
            Object.keys(selectedMeals).forEach(key => delete selectedMeals[key]);
        }

        await updateMealTable();
        await updateResidentButtons();
        
        console.log('Aktuelle Woche geladen');
        
    } catch (error) {
        console.error('Fehler beim Laden der aktuellen Woche:', error);
        alert('Fehler beim Laden der aktuellen Woche');
    }
}

// Alle Dialoge schließen
export function closeAllDialogs() {
    const containers = document.querySelectorAll('.dialog, .components-container, .alternatives-container');
    containers.forEach(container => {
        container.classList.remove('active');
    });
}

// Woche ändern
export async function changeWeek(delta) {
    try {
        // Aktuelle Werte als Nummer speichern
        let newWeek = Number(getCurrentWeek());
        let newYear = Number(getCurrentYear());
        
        // Aktuelles Startdatum der Woche berechnen
        let startDate = getWeekStartDate(newYear, newWeek);
        
        // Delta in Tagen hinzufügen (7 Tage pro Woche)
        startDate.setDate(startDate.getDate() + (delta * 7));
        
        // Neue Jahr und Woche aus dem resultierenden Datum berechnen
        newYear = startDate.getFullYear();
        
        // Berechne die Kalenderwoche aus dem neuen Datum
        const firstDayOfYear = new Date(newYear, 0, 1);
        const daysSinceFirstDay = Math.floor((startDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
        newWeek = Math.ceil((daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7);
        
        // Werte aktualisieren
        updateCurrentWeek(newWeek);
        updateCurrentYear(newYear);
        
        console.log('Woche gewechselt zu:', newWeek, 'Jahr:', newYear);
        
        // UI aktualisieren
        if (domElements.currentWeekSpan) {
            domElements.currentWeekSpan.textContent = `KW${newWeek}`;
        }

        // Datum aktualisieren
        if (domElements.currentDateSpan) {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);
            
            domElements.currentDateSpan.textContent = `${formattedStartDate} - ${formattedEndDate}`;
        }

        // Daten laden und UI aktualisieren
        try {
            await loadMealPlan();
            console.log('Speiseplan erfolgreich geladen');

            // Wenn ein Bewohner ausgewählt ist, dessen Auswahlen laden
            if (selectedResident && Object.keys(selectedResident).length > 0) {
                await loadResidentSelections(selectedResident);
                console.log('Bewohnerauswahlen geladen');
            } else {
                // Wenn kein Bewohner ausgewählt ist, selectedMeals leeren
                Object.keys(selectedMeals).forEach(key => delete selectedMeals[key]);
            }

            // UI aktualisieren
            await updateMealTable();
            await updateResidentButtons();

            console.log('Wochenwechsel erfolgreich abgeschlossen');
            return true;

        } catch (loadError) {
            console.error('Fehler beim Laden der Daten:', loadError);
            throw new Error(`Fehler beim Laden der Daten für KW${newWeek}/${newYear}: ${loadError.message}`);
        }

    } catch (error) {
        console.error('Fehler beim Wochenwechsel:', error);
        alert(`Fehler beim Laden der Daten für die neue Woche: ${error.message}`);
        throw error;
    }
}

// Prüfen ob ein Klick innerhalb der Details ist
function isClickInsideDetails(target) {
    return Boolean(
        target.closest('.resident-info-container') ||
        target.closest('.resident-info-header') ||
        target.closest('.resident-info-toggle') ||
        target.closest('.resident-details') ||
        target.closest('.resident-areas') ||
        target.closest('.area-container') ||
        target.closest('.area-label-container') ||
        target.closest('.area-buttons') ||
        target.closest('.area-option-button') ||
        target.closest('.area-option-button.active') ||
        target.closest('.content-wrapper') ||
        target.closest('.sub-buttons') ||
        target.closest('.sub-buttons-row') ||
        target.closest('.alternatives-container') ||
        target.closest('.alternative-item') ||
        target.closest('.switch-container') ||
        target.closest('.switch-slider')
    );
}

// Globaler Click-Handler
function handleGlobalClick(e) {
    // Wenn der Klick auf einen Dialog-Button war
    if (e.target.closest('.dialog-button')) {
        closeAllDialogs();
        closeFabMenus();
        e.preventDefault();
        e.stopPropagation();
        return; // Beende die Funktion sofort
    }

    // Prüfe, ob der Klick außerhalb eines fab-containers war
    const clickedFabContainer = e.target.closest('.fab-container');
    const activeFabContainers = document.querySelectorAll('.fab-container.active');
    
    // Wenn der Klick nicht in einem fab-container war
    if (!clickedFabContainer) {
        // Schließe alle aktiven Container
        activeFabContainers.forEach(container => {
            container.classList.remove('active');
        });
        
        // Wenn der Klick im mealTable war und es aktive Container gab
        if (e.target.closest('.meal-plan') && activeFabContainers.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            return; // Beende die Funktion hier
        }
    } else {
        // Wenn in einem fab-container geklickt wurde, alle anderen schließen
        activeFabContainers.forEach(container => {
            if (container !== clickedFabContainer) {
                container.classList.remove('active');
            }
        });
    }
}

// FAB-Menüs schließen
export function closeFabMenus() {
    document.querySelectorAll('.fab-container.active').forEach(container => {
        container.classList.remove('active');
    });
    document.querySelectorAll('.sub-buttons.active, .alternatives-container.active').forEach(c => {
        c.classList.remove('active');
    });
}

// Mahlzeitauswahl umschalten
export async function toggleMealSelection(day, category, meal) {
    // Prüfe ob ein fab-container aktiv ist
    const activeFabContainer = document.querySelector('.fab-container.active');
    if (activeFabContainer) {
        // Wenn ein Container aktiv ist, prüfe ob es ein Alternativ-Switch ist
        const alternativeSwitch = activeFabContainer.querySelector('.switch-input:checked');
        if (alternativeSwitch) {
            try {
                // Lade die Alternativen
                const response = await fetch(`${API_BASE_URL}/soloPlan/shorts`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // Hole die Alternativen für diese Kategorie
                const categoryData = data[category];
                if (categoryData && categoryData.alternatives) {
                    // Erstelle eine neue Auswahl mit der Alternative
                    const storageKey = createStorageKey(day, category);
                    const selectedAlternative = alternativeSwitch.id.replace(`alt-${category}-`, '').replace(/-/g, ' ');
                    selectedMeals[storageKey] = createNewSelection(day, category, {
                        name: selectedAlternative,
                        isAlternative: true
                    });
                    
                    // UI aktualisieren
                    updateMealTable();
                    
                    // Speichern
                    await saveResidentSelections();
                }
            } catch (error) {
                console.error('Fehler beim Laden der Alternativen:', error);
                const errorToast = document.createElement('div');
                errorToast.className = 'toast-notification error';
                errorToast.textContent = 'Fehler beim Laden der Alternativen';
                document.body.appendChild(errorToast);
                
                setTimeout(() => {
                    errorToast.remove();
                }, 3000);
            }
        }
        return;
    }

    // 1. Validierung der Eingabedaten
    if (!selectedResident || Object.keys(selectedResident).length === 0) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = 'Bitte wählen Sie zuerst einen Bewohner aus';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
        return;
    }

    try {
        // 2. Daten aus mealPlanData extrahieren
        const dayData = mealPlanData.days.find(d => d.day === day);
        if (!dayData) {
            console.error('Keine Daten für den Tag gefunden:', day);
            return;
        }

        // 3. UI-Update vorbereiten
        const storageKey = createStorageKey(day, category);
        let currentSelection = selectedMeals[storageKey];
        
        // 4. Aktualisiere die Auswahl
        if (!currentSelection) {
            // Neue Auswahl erstellen
            selectedMeals[storageKey] = createNewSelection(day, category, meal);
        } else {
            // Zyklus durch die Portionsgrößen
            if (currentSelection.portion === '100%') {
                currentSelection.portion = '50%';
            } else if (currentSelection.portion === '50%') {
                currentSelection.portion = '25%';
            } else if (currentSelection.portion === '25%') {
                delete selectedMeals[storageKey];
            }
        }

        // 5. UI sofort aktualisieren
        const button = document.querySelector(`[data-day="${day}"][data-category="${category}"]`);
        if (button) {
            // Entferne zuerst alle möglichen Klassen
            button.classList.remove('selected-100', 'selected-50', 'selected-25');
            
            // Füge die entsprechende Klasse hinzu
            if (selectedMeals[storageKey]) {
                const portion = selectedMeals[storageKey].portion;
                button.classList.add(`selected-${portion.replace('%', '')}`);
            }
        }
        
        updateMealTable();
        
        // 6. Speichern mit Verzögerung
        if (window.saveTimeout) {
            clearTimeout(window.saveTimeout);
        }

        window.saveTimeout = setTimeout(async () => {
            try {
                console.log('Speichere Auswahlen:', selectedMeals);
                await saveResidentSelections();
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                alert('Fehler beim Speichern der Auswahl');
                
                // UI zurücksetzen im Fehlerfall
                delete selectedMeals[storageKey];
                updateMealTable();
            }
        }, 500);

    } catch (error) {
        console.error('Fehler bei der Mahlzeitauswahl:', error);
        alert('Fehler bei der Verarbeitung der Auswahl');
    }
}

// Bewohner auswählen
export async function selectResident(resident) {
    // Direkte Zuweisung zum importierten selectedResident Objekt
    Object.assign(selectedResident, resident);
    
    // Alle Buttons normal stylen
    document.querySelectorAll('.resident-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Ausgewählten Button hervorheben
    const selectedButton = Array.from(document.querySelectorAll('.resident-button')).find(btn => 
        btn.querySelector('.resident-name').textContent === `${resident.firstName} ${resident.lastName}`
    );
    
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // Aktualisiere die Anzeige des ausgewählten Bewohners
    const selectedResidentDiv = domElements.selectedResidentDiv;
    if (selectedResident) {
        // Container für Name und Löschen-Button
        const headerContainer = document.createElement('div');
        headerContainer.style.display = 'flex';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.justifyContent = 'center';
        headerContainer.style.gap = '10px';

        const nameHeader = document.createElement('h2');
        nameHeader.textContent = `${selectedResident.firstName} ${selectedResident.lastName}`;

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.className = 'delete-week-button';
        deleteButton.title = 'Wochenplan löschen';
        deleteButton.onclick = async () => {
            if (confirm(`Möchten Sie wirklich den Wochenplan für ${selectedResident.firstName} ${selectedResident.lastName} löschen?`)) {
                try {
                    const fileName = `filled_${selectedResident.firstName}_${selectedResident.lastName}`;
                    const response = await fetch(
                        `${API_BASE_URL}/soloplan/selections/${getCurrentYear()}/KW${getCurrentWeek()}/${fileName}`,
                        {
                            method: 'DELETE'
                        }
                    );
                    
                    if (response.ok) {
                        Object.keys(selectedMeals).forEach(key => delete selectedMeals[key]);
                        updateUI();
                        const toast = document.createElement('div');
                        toast.className = 'toast-notification';
                        toast.textContent = 'Wochenplan wurde gelöscht';
                        document.body.appendChild(toast);
                        
                        setTimeout(() => {
                            toast.remove();
                        }, 3000);
                    } else {
                        throw new Error('Fehler beim Löschen des Plans');
                    }
                } catch (error) {
                    console.error('Fehler beim Löschen:', error);
                    const errorToast = document.createElement('div');
                    errorToast.className = 'toast-notification error';
                    errorToast.textContent = 'Fehler beim Löschen des Plans';
                    document.body.appendChild(errorToast);
                    
                    setTimeout(() => {
                        errorToast.remove();
                    }, 3000);
                }
            }
        };

        headerContainer.appendChild(nameHeader);
        headerContainer.appendChild(deleteButton);
        selectedResidentDiv.innerHTML = '';
        selectedResidentDiv.appendChild(headerContainer);
        selectedResidentDiv.classList.remove('empty');
    } else {
        selectedResidentDiv.innerHTML = '';
        selectedResidentDiv.classList.add('empty');
    }
    
    await loadResidentSelections(resident);
    showResidentDetails(resident);
    updateUI();
}

// Bewohnerauswahl zurücksetzen
export function resetResidentSelection() {
    // Entferne Zusatzinformationen
    const infoContainer = document.querySelector('.resident-info-container');
    if (infoContainer) {
        infoContainer.remove();
    }
    
    // Zeige alle Bewohner-Buttons wieder an
    document.querySelectorAll('.resident-button').forEach(btn => {
        btn.style.display = 'flex';
        btn.classList.remove('active');
    });
    
    // Setze Auswahl zurück
    Object.keys(selectedResident).forEach(key => delete selectedResident[key]);
    Object.keys(selectedMeals).forEach(key => delete selectedMeals[key]);

    // Leere die Bewohneranzeige
    const selectedResidentDiv = domElements.selectedResidentDiv;
    selectedResidentDiv.innerHTML = '';
    selectedResidentDiv.classList.add('empty');
    
    updateUI();
}

// Kategorie-Sektion erstellen
function createCategorySection(displayName, apiName) {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.dataset.category = apiName;
    
    section.innerHTML = `
        <div class="category-header">
            <h3>${displayName}</h3>
            <button class="add-alternative-btn" data-category="${apiName}">+</button>
        </div>
        <div class="alternatives-list" id="${apiName}-alternatives"></div>
    `;
    
    // Event Listener für den "+ Button"
    section.querySelector('.add-alternative-btn').onclick = () => {
        addNewAlternativeField(apiName);
    };
    
    return section;
}

// Alternativen Editor öffnen
async function openAlternativesEditor() {
    try {
        // Container erstellen
        const editorContainer = document.createElement('div');
        editorContainer.className = 'alternatives-editor-container';
        
        // Overlay erstellen
        const overlay = document.createElement('div');
        overlay.className = 'alternatives-editor-overlay';
        document.body.appendChild(overlay);
        
        // Header
        const header = document.createElement('div');
        header.className = 'alternatives-editor-header';
        header.innerHTML = `
            <h2>Alternativen bearbeiten</h2>
            <div class="header-buttons">
                <button class="save-alternatives-btn">Speichern</button>
                <button class="close-editor-btn">×</button>
            </div>
        `;
        
        // Kategorien Container
        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = 'categories-container';
        
        // Kategorien in der Reihenfolge aus CATEGORIES hinzufügen
        Object.entries(CATEGORIES).forEach(([apiName, displayName]) => {
            const categorySection = createCategorySection(displayName, apiName);
            categoriesContainer.appendChild(categorySection);
        });
        
        // Container zusammenbauen
        editorContainer.appendChild(header);
        editorContainer.appendChild(categoriesContainer);
        document.body.appendChild(editorContainer);
        
        // Event Listener für Schließen-Button
        header.querySelector('.close-editor-btn').onclick = () => {
            editorContainer.remove();
            overlay.remove();
        };
        
        // Event Listener für Speichern-Button
        header.querySelector('.save-alternatives-btn').onclick = async () => {
            await saveAlternatives();
            editorContainer.remove();
            overlay.remove();
        };
        
        // Lade existierende Alternativen
        await loadExistingAlternatives();
        
    } catch (error) {
        console.error('Fehler beim Öffnen des Alternativen-Editors:', error);
        alert('Fehler beim Öffnen des Editors');
    }
}

// Alternativen speichern
async function saveAlternatives() {
    try {
        const data = {};
        
        // Für jede Kategorie die Alternativen sammeln
        Object.keys(CATEGORIES).forEach(apiName => {
            const container = document.querySelector(`#${apiName}-alternatives`);
            if (container) {
                const alternatives = Array.from(container.querySelectorAll('.alternative-input'))
                    .map(input => input.value.trim())
                    .filter(value => value !== '');
                
                if (alternatives.length > 0) {
                    data[apiName] = {
                        alternatives: alternatives
                    };
                }
            }
        });
        
        console.log('Sende Daten:', data);
        
        // An den Server senden
        const response = await fetch(`${API_BASE_URL}/soloPlan/shorts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Alternativen erfolgreich gespeichert');
        
        // Toast-Benachrichtigung anzeigen
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = 'Alternativen gespeichert';
        document.body.appendChild(toast);
        
        // Toast nach 3 Sekunden ausblenden
        setTimeout(() => {
            toast.remove();
        }, 3000);
        
    } catch (error) {
        console.error('Fehler beim Speichern der Alternativen:', error);
        
        // Fehler-Toast anzeigen
        const errorToast = document.createElement('div');
        errorToast.className = 'toast-notification error';
        errorToast.textContent = 'Fehler beim Speichern';
        document.body.appendChild(errorToast);
        
        // Fehler-Toast nach 3 Sekunden ausblenden
        setTimeout(() => {
            errorToast.remove();
        }, 3000);
        
        throw error;
    }
}

// Neues Alternativ-Feld hinzufügen
function addNewAlternativeField(category, value = '') {
    const alternativeField = document.createElement('div');
    alternativeField.className = 'alternative-field';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'alternative-input';
    input.value = value;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-alternative-btn';
    deleteButton.textContent = '🗑️';
    deleteButton.onclick = () => alternativeField.remove();
    
    alternativeField.appendChild(input);
    alternativeField.appendChild(deleteButton);
    
    const container = document.querySelector(`#${category}-alternatives`);
    if (container) {
        container.appendChild(alternativeField);
    }
}

// Existierende Alternativen laden
async function loadExistingAlternatives() {
    try {
        const response = await fetch(`${API_BASE_URL}/soloPlan/shorts`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Für jede Kategorie die existierenden Alternativen laden
        Object.entries(CATEGORIES).forEach(([apiName, displayName]) => {
            const container = document.querySelector(`#${apiName}-alternatives`);
            if (container) {
                container.innerHTML = ''; // Container leeren
                const categoryData = data[apiName];
                if (categoryData && categoryData.alternatives) {
                    categoryData.alternatives.forEach(alt => {
                        addNewAlternativeField(apiName, alt);
                    });
                }
            }
        });
        
        console.log('Alternativen erfolgreich geladen:', data);
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Alternativen:', error);
        const errorToast = document.createElement('div');
        errorToast.className = 'toast-notification error';
        errorToast.textContent = 'Fehler beim Laden der existierenden Alternativen';
        document.body.appendChild(errorToast);
        
        setTimeout(() => {
            errorToast.remove();
        }, 3000);
        throw error;
    }
}

export async function showAlternatives(day, category, meals) {
    try {
        const storageKey = createStorageKey(day, category);
        const subButtons = document.querySelector('.fab-container.active .sub-buttons');
        if (!subButtons) return;

        clearAllContainers(subButtons);

        const alternativesContainer = document.createElement('div');
        alternativesContainer.className = 'alternatives-container active';
        
        // Lade Alternativen
        const response = await fetch(`${API_BASE_URL}/soloplan/shorts`);
        if (!response.ok) throw new Error('Fehler beim Laden der Alternativen');
        const data = await response.json();
        
        const selection = selectedMeals[storageKey] || {};
        
        // Debug-Log
        console.log('Geladene Daten:', data);
        console.log('Aktuelle Kategorie:', category);
        
        // Prüfe ob Alternativen für diese Kategorie existieren
        if (data[category] && Array.isArray(data[category].alternatives)) {
            const alternatives = data[category].alternatives; // Hier ist alternatives ein Array
            console.log('Gefundene Alternativen:', alternatives);

            // Verarbeite jede Alternative einzeln
            alternatives.forEach(alternative => {
                console.log('Verarbeite Alternative:', alternative);

                const altDiv = document.createElement('div');
                altDiv.className = 'alternative-item';

                // Label für die Alternative
                const label = document.createElement('span');
                label.className = 'switch-label';
                label.textContent = alternative; // Einzelne Alternative wird hier gesetzt

                // Switch-Container erstellen
                const switchContainer = document.createElement('label');
                switchContainer.className = 'switch-container';

                // Input-Element für den Switch
                const switchInput = document.createElement('input');
                switchInput.type = 'checkbox';
                switchInput.className = 'switch-input';
                switchInput.id = `alt-${category}-${alternative.replace(/\s+/g, '-')}`;
                
                // Prüfe ob diese Alternative ausgewählt ist
                switchInput.checked = selection.meal?.isAlternative && selection.meal?.name === alternative;
                
                switchInput.addEventListener('change', async () => {
                    if (!selectedMeals[storageKey]) {
                        selectedMeals[storageKey] = createNewSelection(day, category, meals);
                    }
                    
                    if (switchInput.checked) {
                        // Diese Alternative als ausgewählte Mahlzeit setzen
                        selectedMeals[storageKey].meal = {
                            name: alternative,
                            isAlternative: true
                        };
                        // Andere Switches deaktivieren
                        alternativesContainer.querySelectorAll('.switch-input').forEach(input => {
                            if (input !== switchInput) {
                                input.checked = false;
                            }
                        });
                    } else {
                        // Zurück zur ursprünglichen Mahlzeit
                        selectedMeals[storageKey].meal = meals;
                    }
                    
                    await saveResidentSelections();
                    updateMealTable();
                });

                // Slider für den Switch
                const slider = document.createElement('span');
                slider.className = 'switch-slider';

                // Elemente zusammensetzen
                switchContainer.appendChild(switchInput);
                switchContainer.appendChild(slider);
                altDiv.appendChild(label);
                altDiv.appendChild(switchContainer);

                // Alternative zum Container hinzufügen
                alternativesContainer.appendChild(altDiv);
            });
        } else {
            console.log('Keine Alternativen für Kategorie:', category);
        }
        
        subButtons.appendChild(alternativesContainer);
        
    } catch (error) {
        console.error('Fehler beim Laden der Alternativen:', error);
        const errorToast = document.createElement('div');
        errorToast.className = 'toast-notification error';
        errorToast.textContent = 'Fehler beim Laden der Alternativen';
        document.body.appendChild(errorToast);
        
        setTimeout(() => {
            errorToast.remove();
        }, 3000);
    }
}

// Kategorie-Manager
function openCategoryManager() {
    const dialog = document.getElementById('categoryManagerDialog');
    if (!dialog) {
        createCategoryManagerDialog();
    } else {
        dialog.style.display = 'block';
    }
    
    loadExtraCategories();
}

function createCategoryManagerDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'categoryManagerDialog';
    dialog.className = 'dialog category-manager-dialog';
    
    const header = document.createElement('div');
    header.className = 'dialog-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Abendessen-Kategorien verwalten';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-dialog-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        dialog.style.display = 'none';
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.className = 'dialog-content';
    
    const categoriesList = document.createElement('div');
    categoriesList.id = 'extraCategoriesList';
    categoriesList.className = 'extra-categories-list';
    
    const addSection = document.createElement('div');
    addSection.className = 'add-category-section';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'newCategoryInput';
    input.placeholder = 'Neue Kategorie eingeben';
    
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.textContent = 'Hinzufügen';
    addBtn.onclick = addExtraCategory;
    
    addSection.appendChild(input);
    addSection.appendChild(addBtn);
    
    content.appendChild(categoriesList);
    content.appendChild(addSection);
    
    const footer = document.createElement('div');
    footer.className = 'dialog-footer';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Speichern';
    saveBtn.onclick = saveExtraCategories;
    
    footer.appendChild(saveBtn);
    
    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(footer);
    
    document.body.appendChild(dialog);
}

// Mock-Daten für Extra-Kategorien (temporär bis Backend implementiert ist)
let mockExtraCategories = [
    { id: 1, name: 'Salat' },
    { id: 2, name: 'Suppe' },
    { id: 3, name: 'Dessert' }
];

async function loadExtraCategories() {
    try {
        // Temporärer Mock-Ansatz bis Backend implementiert ist
        // const response = await fetch('/api/extra-categories');
        // if (!response.ok) throw new Error('Fehler beim Laden der Kategorien');
        // const categories = await response.json();
        
        const categories = mockExtraCategories;
        
        const list = document.getElementById('extraCategoriesList');
        list.innerHTML = '';
        
        categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';
            
            const name = document.createElement('span');
            name.className = 'category-name';
            name.textContent = category.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = () => removeExtraCategory(category.id);
            
            item.appendChild(name);
            item.appendChild(deleteBtn);
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Extra-Kategorien:', error);
        alert('Es gab ein Problem beim Laden der Kategorien. Bitte versuchen Sie es später erneut.');
    }
}

async function addExtraCategory() {
    const input = document.getElementById('newCategoryInput');
    const categoryName = input.value.trim();
    
    if (!categoryName) {
        alert('Bitte geben Sie einen Namen für die Kategorie ein.');
        return;
    }
    
    try {
        // Temporärer Mock-Ansatz bis Backend implementiert ist
        // const response = await fetch('/api/extra-categories', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ name: categoryName })
        // });
        // 
        // if (!response.ok) throw new Error('Fehler beim Hinzufügen der Kategorie');
        
        // Mock-Implementierung
        const newId = mockExtraCategories.length > 0 ? 
                      Math.max(...mockExtraCategories.map(c => c.id)) + 1 : 1;
        mockExtraCategories.push({ id: newId, name: categoryName });
        
        input.value = '';
        loadExtraCategories();
    } catch (error) {
        console.error('Fehler beim Hinzufügen der Extra-Kategorie:', error);
        alert('Es gab ein Problem beim Hinzufügen der Kategorie. Bitte versuchen Sie es später erneut.');
    }
}

async function removeExtraCategory(id) {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;
    
    try {
        // Temporärer Mock-Ansatz bis Backend implementiert ist
        // const response = await fetch(`/api/extra-categories/${id}`, {
        //     method: 'DELETE'
        // });
        // 
        // if (!response.ok) throw new Error('Fehler beim Löschen der Kategorie');
        
        // Mock-Implementierung
        mockExtraCategories = mockExtraCategories.filter(category => category.id !== id);
        
        loadExtraCategories();
    } catch (error) {
        console.error('Fehler beim Löschen der Extra-Kategorie:', error);
        alert('Es gab ein Problem beim Löschen der Kategorie. Bitte versuchen Sie es später erneut.');
    }
}

async function saveExtraCategories() {
    document.getElementById('categoryManagerDialog').style.display = 'none';
    // In einer echten Implementierung würde hier ein API-Aufruf stattfinden
    alert('Kategorien wurden gespeichert!');
}
