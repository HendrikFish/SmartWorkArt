import { getCurrentWeek, getCurrentYear, selectedResident, selectedMeals, mealPlanData, formConfig, domElements, residentsData } from './variablen.js';
import { WEEKDAYS, CATEGORIES, API_BASE_URL } from './konstanten.js';
import { formatDate, getWeekStartDate, createStorageKey, createNewSelection, extractMinimalMealData } from './hilfsfunktionen.js';
import { checkExistingData, loadResidentSelections, saveResidentSelections, updateResidentArea } from './api.js';
import { closeFabMenus, closeAllDialogs, toggleMealSelection, selectResident, resetResidentSelection } from './event-handling.js';
import { initializePanelHandling, togglePanel, keepPanelOpen, closeAllPanels } from './panel-handling.js';

// Initialisiere Panel-Handling beim Import
initializePanelHandling();

export function updateUI() {
    updateWeekDisplay();
    updateMealTable();
}

export function updateWeekDisplay() {
    if (domElements.currentWeekSpan) {
        domElements.currentWeekSpan.textContent = `KW ${getCurrentWeek()}`;
    }
    
    if (domElements.currentDateSpan) {
        const startDate = getWeekStartDate(getCurrentYear(), getCurrentWeek());
        domElements.currentDateSpan.textContent = formatDate(startDate);
    }
}

export async function updateResidentButtons() {
    const buttons = document.querySelectorAll('.resident-button');
    for (const button of buttons) {
        const resident = JSON.parse(button.dataset.resident);
        const hasData = await checkExistingData(resident);
        button.classList.toggle('has-data', hasData);
    }
}

export async function toggleResidentsList() {
    const list = document.querySelector('.residents-list');
    if (!list) {
        console.error('Bewohnerliste nicht gefunden');
        return;
    }

    const isVisible = list.style.display === 'flex';
    list.style.display = isVisible ? 'none' : 'flex';
    
    const toggleButton = document.querySelector('.toggle-residents-button');
    if (toggleButton) {
        toggleButton.innerHTML = isVisible ? '👥 Bewohner wählen' : '👥 Liste ausblenden';
    }

    if (!isVisible) {
        await updateResidentButtons();
    }
}

export async function createResidentButtons() {
    console.log('Erstelle Bewohner-Buttons...');
    console.log('FormConfig:', formConfig);
    console.log('ResidentsData:', residentsData);

    // Container leeren
    domElements.residentButtonsContainer.innerHTML = '';
    
    // Container für Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Toggle-Button für die Bewohnerliste
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-residents-button';
    toggleButton.innerHTML = '👥 Bewohner wählen';
    toggleButton.onclick = () => toggleResidentsList();
    buttonContainer.appendChild(toggleButton);
    
    // Filter-Buttons Container
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-buttons';
    
    // Erstelle Filter-Buttons basierend auf formConfig
    if (formConfig.areas) {
        formConfig.areas.forEach(area => {
            if (area.menuFilter) {
                const filterGroup = document.createElement('div');
                filterGroup.className = 'filter-group';
                
                area.buttons.forEach(button => {
                    const filterButton = document.createElement('button');
                    filterButton.className = 'filter-button';
                    filterButton.textContent = button.label;
                    filterButton.dataset.area = area.name;
                    filterButton.dataset.value = button.label;
                    
                    filterButton.addEventListener('click', async (e) => {
                        filterButton.classList.toggle('active');
                        
                        if (filterButton.classList.contains('active')) {
                            filterGroup.querySelectorAll('.filter-button').forEach(btn => {
                                if (btn !== filterButton) {
                                    btn.classList.remove('active');
                                }
                            });
                            await filterResidents(area.name, button.label);
                            
                            const list = document.querySelector('.residents-list');
                            if (list) list.style.display = 'flex';
                            
                            toggleButton.innerHTML = '👥 Liste ausblenden';
                        } else {
                            await filterResidents(area.name, '');
                        }
                    });
                    
                    filterGroup.appendChild(filterButton);
                });
                
                filterContainer.appendChild(filterGroup);
            }
        });
    }
    
    buttonContainer.appendChild(filterContainer);
    domElements.residentButtonsContainer.appendChild(buttonContainer);
    
    // Container für die Bewohnerliste
    const listContainer = document.createElement('div');
    listContainer.className = 'residents-list';
    listContainer.style.display = 'none'; // Initial versteckt
    
    // Erstelle und prüfe jeden Bewohner-Button
    if (residentsData && residentsData.length > 0) {
        for (const resident of residentsData) {
            const button = document.createElement('button');
            button.className = 'resident-button';
            button.dataset.resident = JSON.stringify(resident);
            
            // Name
            const nameSpan = document.createElement('span');
            nameSpan.className = 'resident-name';
            nameSpan.textContent = `${resident.firstName} ${resident.lastName}`;
            button.appendChild(nameSpan);
            
            // Prüfe ob Daten existieren
            const hasData = await checkExistingData(resident);
            if (hasData) {
                button.classList.add('has-data');
            }
            
            button.addEventListener('click', async () => {
                await selectResident(resident);
                await toggleResidentsList();
            });
            
            listContainer.appendChild(button);
        }
    } else {
        console.error('Keine Bewohnerdaten verfügbar');
    }
    
    domElements.residentButtonsContainer.appendChild(listContainer);
    console.log('Bewohner-Buttons erstellt');
}

export function showResidentDetails(resident) {
    const existingInfo = document.querySelector('.resident-info-container');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    const infoContainer = document.createElement('div');
    infoContainer.className = 'resident-info-container';
    
    const headerContainer = document.createElement('div');
    headerContainer.className = 'resident-info-header';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'resident-info-toggle open';
    toggleButton.textContent = 'Details';
    
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'resident-details';
    detailsContainer.style.display = 'block';
    
    toggleButton.addEventListener('click', (e) => {
        if (e.target === toggleButton) {
            const isVisible = detailsContainer.style.display !== 'none';
            detailsContainer.style.display = isVisible ? 'none' : 'block';
            toggleButton.classList.toggle('open', !isVisible);
        }
        e.stopPropagation();
    });
    
    detailsContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    if (resident.areas) {
        const areaInfo = document.createElement('div');
        areaInfo.className = 'resident-areas';
        
        Object.entries(resident.areas).forEach(([areaName, areaData]) => {
            const config = formConfig?.areas?.find(area => area.name === areaName);
            if (!config || !config.menuRelevant) return;
            
            const areaContainer = document.createElement('div');
            areaContainer.className = 'area-container';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'area-label-container';
            
            let icon = '';
            switch(areaName.trim()) {
                case 'Frühstück': icon = '🍳'; break;
                case 'Mittagessen': icon = '🍽️'; break;
                case 'Abendessen': icon = '🌙'; break;
                case 'Allergene': icon = '⚠️'; break;
                default: icon = '📍';
            }
            
            labelDiv.innerHTML = `${icon} ${areaName}`;
            areaContainer.appendChild(labelDiv);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'area-buttons';
            
            let currentValue = '';
            if (typeof areaData === 'object') {
                currentValue = areaData.value;
            } else {
                currentValue = areaData;
            }
            
            if (config.buttons) {
                config.buttons.forEach(button => {
                    const optionButton = document.createElement('button');
                    optionButton.className = 'area-option-button';
                    if (currentValue === button.label) {
                        optionButton.classList.add('active');
                    }
                    optionButton.textContent = button.label;
                    
                    optionButton.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        
                        // Entferne 'active' Klasse von allen Buttons in diesem Container
                        buttonsContainer.querySelectorAll('.area-option-button').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        
                        // Füge 'active' Klasse zum geklickten Button hinzu
                        optionButton.classList.add('active');
                        
                        // Aktualisiere den Bereich des Bewohners
                        try {
                            await updateResidentArea(resident, areaName, button.label);
                            // Aktualisiere die lokalen Daten
                            if (typeof resident.areas[areaName] === 'object') {
                                resident.areas[areaName].value = button.label;
                            } else {
                                resident.areas[areaName] = button.label;
                            }
                            console.log(`Bereich ${areaName} für ${resident.firstName} ${resident.lastName} auf ${button.label} aktualisiert`);
                        } catch (error) {
                            console.error('Fehler beim Aktualisieren des Bereichs:', error);
                            alert('Fehler beim Speichern der Änderung');
                            // Setze den Button-Status zurück
                            optionButton.classList.remove('active');
                            buttonsContainer.querySelectorAll('.area-option-button').forEach(btn => {
                                if (btn.textContent === currentValue) {
                                    btn.classList.add('active');
                                }
                            });
                        }
                    });
                    
                    buttonsContainer.appendChild(optionButton);
                });
            }
            
            areaContainer.appendChild(buttonsContainer);
            areaInfo.appendChild(areaContainer);
        });
        
        detailsContainer.appendChild(areaInfo);
    }
    
    infoContainer.appendChild(headerContainer);
    infoContainer.appendChild(detailsContainer);
    
    const selectedResidentDiv = document.getElementById('selectedResident');
    selectedResidentDiv.appendChild(infoContainer);
}

export function updateMealTable() {
    const activeFab = document.querySelector('.fab-container.active');
    let openKey = null;
    if (activeFab) {
        const cellContent = activeFab.closest('.meal-cell-content');
        if (cellContent) {
            const row = cellContent.closest('tr');
            const cell = cellContent.closest('td');
            if (row && cell) {
                const rowIndex = Array.from(row.parentElement.children).indexOf(row);
                const cellIndex = Array.from(row.children).indexOf(cell);
                openKey = `${rowIndex}-${cellIndex}`;
            }
        }
    }

    const tbody = domElements.mealTableBody;
    if (!tbody) {
        console.error('Tabellenkörper nicht gefunden!');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!mealPlanData?.days) {
        console.log('Keine Mahlzeitendaten verfügbar');
        return;
    }

    console.log('Beginne Tabellen-Update mit Daten:', mealPlanData);

    Object.entries(CATEGORIES).forEach(([apiCategory, displayName], rowIndex) => {
        console.log(`Verarbeite Kategorie: ${apiCategory} (${displayName})`);
        
        const row = document.createElement('tr');
        
        const categoryCell = document.createElement('td');
        categoryCell.textContent = displayName;
        row.appendChild(categoryCell);
        
        WEEKDAYS.forEach((weekday, cellIndex) => {
            console.log(`Verarbeite ${weekday} für ${apiCategory}`);
            
            const cell = document.createElement('td');
            const dayData = mealPlanData.days.find(d => d.day === weekday);
            
            if (apiCategory === 'suppe' || apiCategory === 'dessert' || 
                apiCategory === 'abendSuppe' || apiCategory === 'milchspeise') {
                cell.classList.add('half-height-cell');
            }
            
            if (dayData && dayData[apiCategory]) {
                const cellContent = document.createElement('div');
                cellContent.className = 'meal-cell-content';
                cellContent.dataset.cellKey = `${rowIndex}-${cellIndex}`;
                
                const storageKey = createStorageKey(weekday, apiCategory);
                const savedSelection = selectedMeals[storageKey];

                if (savedSelection) {
                    // Portion-Klasse hinzufügen
                    switch(savedSelection.portion) {
                        case '100%':
                            cellContent.classList.add('selected-100');
                            break;
                        case '50%':
                            cellContent.classList.add('selected-50');
                            break;
                        case '25%':
                            cellContent.classList.add('selected-25');
                            break;
                    }
                }
                
                cellContent.addEventListener('click', async (e) => {
                    // Verhindere Klick-Event wenn FAB-Menü aktiv ist
                    const activeFab = e.target.closest('.fab-container.active');
                    if (activeFab || e.target.closest('.sub-buttons') || e.target.closest('.switch-container')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }

                    // Prüfe ob ein Bewohner ausgewählt ist
                    if (!selectedResident || Object.keys(selectedResident).length === 0) {
                        alert('Bitte wählen Sie zuerst einen Bewohner aus.');
                        return;
                    }

                    e.stopPropagation();

                    try {
                        await toggleMealSelection(weekday, apiCategory, dayData[apiCategory]);
                    } catch (error) {
                        console.error('Fehler bei der Mahlzeitauswahl:', error);
                        alert('Fehler beim Speichern der Auswahl');
                    }
                });

                const mealsContainer = document.createElement('div');
                mealsContainer.className = 'meals-container';
                
                // Hole die Mahlzeiten oder Alternative
                let mealContent;
                if (savedSelection && savedSelection.meal && savedSelection.meal.isAlternative) {
                    mealContent = [{ name: savedSelection.meal.name }];
                    cellContent.classList.add('alternative');
                } else {
                    mealContent = Array.isArray(dayData[apiCategory]) 
                        ? dayData[apiCategory].map(extractMinimalMealData)
                        : [extractMinimalMealData(dayData[apiCategory])];
                }
                
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'content-wrapper';
                
                mealContent.forEach((meal) => {
                    const mealDiv = document.createElement('div');
                    mealDiv.className = 'meal-item';
                    mealDiv.textContent = meal.name;
                    mealsContainer.appendChild(mealDiv);
                });

                const fabContainer = document.createElement('div');
                fabContainer.className = 'fab-container';
                
                const mainFab = document.createElement('button');
                mainFab.className = 'meal-options-btn';
                mainFab.innerHTML = '+';
                
                const subButtons = document.createElement('div');
                subButtons.className = 'sub-buttons';
                subButtons.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const fabContainer = e.target.closest('.fab-container');
                    if (fabContainer) {
                        fabContainer.classList.add('active');
                    }
                });
                
                const subButtonsRow = document.createElement('div');
                subButtonsRow.className = 'sub-buttons-row';
                
                const commentBtn = document.createElement('button');
                commentBtn.className = 'sub-button comment';
                commentBtn.innerHTML = '💬';
                commentBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeAllDialogs();
                    const fabContainer = e.target.closest('.fab-container');
                    if (fabContainer) {
                        fabContainer.classList.add('active');
                    }
                    showCommentDialog(weekday, apiCategory, mealContent[0]);
                };
                
                const componentsBtn = document.createElement('button');
                componentsBtn.className = 'sub-button components';
                componentsBtn.innerHTML = '🍽️';
                componentsBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeAllDialogs();
                    const fabContainer = e.target.closest('.fab-container');
                    if (fabContainer) {
                        fabContainer.classList.add('active');
                    }
                    showComponentSelection(weekday, apiCategory, mealContent);
                };
                
                const alternativeBtn = document.createElement('button');
                alternativeBtn.className = 'sub-button alternative';
                alternativeBtn.innerHTML = '🔄';
                alternativeBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeAllDialogs();
                    const fabContainer = e.target.closest('.fab-container');
                    if (fabContainer) {
                        fabContainer.classList.add('active');
                    }
                    showAlternatives(weekday, apiCategory, mealContent);
                };
                
                subButtonsRow.appendChild(commentBtn);
                subButtonsRow.appendChild(componentsBtn);
                subButtonsRow.appendChild(alternativeBtn);
                subButtons.appendChild(subButtonsRow);
                
                mainFab.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePanel(fabContainer);
                };
                
                fabContainer.appendChild(mainFab);
                fabContainer.appendChild(subButtons);
                
                contentWrapper.appendChild(mealsContainer);
                contentWrapper.appendChild(fabContainer);
                cellContent.appendChild(contentWrapper);
                cell.appendChild(cellContent);
            } else {
                cell.textContent = '-';
            }
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
    
    if (openKey) {
        const newCellContent = document.querySelector(`[data-cell-key="${openKey}"]`);
        if (newCellContent) {
            const newFab = newCellContent.querySelector('.fab-container');
            if (newFab) {
                newFab.classList.add('active');
            }
        }
    }
    
    console.log('Tabellen-Update abgeschlossen');
}

export function showCommentDialog(day, category, meal) {
    const subButtons = document.querySelector('.fab-container.active .sub-buttons');
    if (!subButtons) return;

    clearAllContainers(subButtons);
    const storageKey = createStorageKey(day, category);

    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.classList.add('active');
    dialog.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.textContent = `Kommentar zu ${meal.name}`;
    
    const textarea = document.createElement('textarea');
    textarea.className = 'dialog-textarea';
    textarea.placeholder = 'Kommentar eingeben...';
    
    if (selectedMeals[storageKey]?.comments?.length > 0) {
        textarea.value = selectedMeals[storageKey].comments[selectedMeals[storageKey].comments.length - 1].text;
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';
    
    const saveButton = document.createElement('button');
    saveButton.className = 'dialog-button save';
    saveButton.textContent = 'Speichern';
    saveButton.onclick = () => {
        const comment = textarea.value.trim();
        if (comment) {
            if (!selectedMeals[storageKey]) {
                selectedMeals[storageKey] = createNewSelection(day, category, meal);
            }
            selectedMeals[storageKey].comments.push({
                text: comment,
                timestamp: new Date().toISOString()
            });
            saveResidentSelections();
            updateMealTable();
        }
        dialog.remove();
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-button cancel';
    cancelButton.textContent = 'Abbrechen';
    cancelButton.onclick = () => dialog.remove();
    
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    
    dialog.appendChild(header);
    dialog.appendChild(textarea);
    dialog.appendChild(buttonContainer);
    
    subButtons.appendChild(dialog);
    textarea.focus();
}

export function showComponentSelection(day, category, meals) {
    const storageKey = createStorageKey(day, category);
    let selection = selectedMeals[storageKey];
    
    if (!selection) {
        selection = createNewSelection(day, category, meals);
        selectedMeals[storageKey] = selection;
    }

    const subButtons = document.querySelector('.fab-container.active .sub-buttons');
    if (!subButtons) return;

    clearAllContainers(subButtons);

    const componentsContainer = document.createElement('div');
    componentsContainer.className = 'components-container active';

    selection.meals.forEach((meal) => {
        const componentItem = document.createElement('div');
        componentItem.className = 'component-item';
        
        const label = document.createElement('span');
        label.className = 'switch-label';
        label.textContent = meal.name;
        
        const switchContainer = document.createElement('label');
        switchContainer.className = 'switch-container';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'switch-input';
        input.checked = meal.rezept_selected !== false;
        
        // Vereinfachter Event-Handler nur für den Switch-Status
        input.addEventListener('change', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                meal.rezept_selected = input.checked;
                await saveResidentSelections();
            } catch (error) {
                console.error('Fehler beim Speichern der Komponenten-Auswahl:', error);
                input.checked = !input.checked;
                meal.rezept_selected = input.checked;
            }
        });
        
        // Verhindere Klick-Propagation für alle Elemente
        [componentItem, label, switchContainer].forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
        
        const slider = document.createElement('span');
        slider.className = 'switch-slider';
        
        switchContainer.appendChild(input);
        switchContainer.appendChild(slider);
        
        componentItem.appendChild(label);
        componentItem.appendChild(switchContainer);
        componentsContainer.appendChild(componentItem);
    });

    subButtons.appendChild(componentsContainer);
}

export async function showAlternatives(day, category, meals) {
    try {
        const storageKey = createStorageKey(day, category);
        const subButtons = document.querySelector('.fab-container.active .sub-buttons');
        if (!subButtons) return;

        clearAllContainers(subButtons);

        const alternativesContainer = document.createElement('div');
        alternativesContainer.className = 'alternatives-container active';
        
        alternativesContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            const fabContainer = subButtons.closest('.fab-container');
            if (fabContainer) {
                fabContainer.classList.add('active');
            }
        });
        
        subButtons.appendChild(alternativesContainer);
        
        const response = await fetch(`${API_BASE_URL}/soloplan/shorts`);
        if (!response.ok) throw new Error('Fehler beim Laden der Alternativen');
        const data = await response.json();
        
        const selection = selectedMeals[storageKey] || {};

        if (data[category] && Array.isArray(data[category].alternatives)) {
            const alternatives = data[category].alternatives;
            console.log('Gefundene Alternativen:', alternatives);

            alternatives.forEach(alternative => {
                const altDiv = document.createElement('div');
                altDiv.className = 'alternative-item';
                
                altDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const fabContainer = subButtons.closest('.fab-container');
                    if (fabContainer) {
                        fabContainer.classList.add('active');
                    }
                });

                const label = document.createElement('span');
                label.className = 'switch-label';
                label.textContent = alternative;
                
                const switchContainer = document.createElement('label');
                switchContainer.className = 'switch-container';
                
                const switchInput = document.createElement('input');
                switchInput.type = 'checkbox';
                switchInput.className = 'switch-input';
                switchInput.id = `alt-${category}-${alternative.replace(/\s+/g, '-')}`;
                
                // Prüfe ob diese Alternative im alternatives Array ist
                switchInput.checked = selection.alternatives?.includes(alternative);
                
                switchInput.addEventListener('change', async (e) => {
                    e.stopPropagation();
                    
                    if (!selectedMeals[storageKey]) {
                        selectedMeals[storageKey] = createNewSelection(day, category, meals);
                    }
                    
                    // Initialisiere alternatives Array falls nicht vorhanden
                    if (!selectedMeals[storageKey].alternatives) {
                        selectedMeals[storageKey].alternatives = [];
                    }
                    
                    // Aktualisiere die alternatives
                    if (switchInput.checked) {
                        if (!selectedMeals[storageKey].alternatives.includes(alternative)) {
                            selectedMeals[storageKey].alternatives.push(alternative);
                        }
                    } else {
                        selectedMeals[storageKey].alternatives = selectedMeals[storageKey].alternatives.filter(
                            alt => alt !== alternative
                        );
                    }
                    
                    // Speichere die Änderungen
                    await saveResidentSelections();
                });

                const slider = document.createElement('span');
                slider.className = 'switch-slider';

                switchContainer.appendChild(switchInput);
                switchContainer.appendChild(slider);
                altDiv.appendChild(label);
                altDiv.appendChild(switchContainer);

                alternativesContainer.appendChild(altDiv);
            });
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

function clearAllContainers(subButtons) {
    const containers = subButtons.querySelectorAll('.dialog, .components-container, .alternatives-container');
    containers.forEach(container => container.remove());
}

export async function filterResidents(areaName, filterValue) {
    const buttons = document.querySelectorAll('.resident-button');
    
    buttons.forEach(button => {
        const resident = JSON.parse(button.dataset.resident);
        const areaValue = resident.areas[areaName];
        
        let matches = false;
        if (!filterValue) {
            matches = true;
        } else if (typeof areaValue === 'object') {
            matches = areaValue.value === filterValue;
        } else {
            matches = areaValue === filterValue;
        }
        
        button.style.display = matches ? 'flex' : 'none';
    });

    const visibleButtons = Array.from(buttons).filter(button => button.style.display !== 'none');
    for (const button of visibleButtons) {
        const resident = JSON.parse(button.dataset.resident);
        const hasData = await checkExistingData(resident);
        button.classList.toggle('has-data', hasData);
    }
}
