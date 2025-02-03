// Import required modules
import { DAYS } from './Interface.js';
import { allPersons, formatPersonName } from './person.js';
import { currentPlans, printLayouts } from './plan.js';

// Print Modal
export let printModal = null;

// Initialize print modal
export function initializePrintModal(DAYS) {
    // Create print modal if it doesn't exist
    if (!printModal) {
        printModal = document.createElement('div');
        printModal.className = 'print-modal';
        printModal.innerHTML = createPrintModalHTML(DAYS);
        document.body.appendChild(printModal);
    }

    // Setup event listeners
    setupPrintModalListeners();
}

// Create print modal HTML
function createPrintModalHTML(DAYS) {
    return `
        <div class="print-modal-content">
            <div class="print-modal-header">
                <h2>Druckeinstellungen</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="print-options">
                <div class="day-select">
                    <h3>Tag auswählen</h3>
                    <div class="day-options">
                        <label class="day-option">
                            <input type="radio" name="print-day" value="all" checked>
                            Alle Tage
                        </label>
                        ${DAYS.map((day, index) => `
                            <label class="day-option">
                                <input type="radio" name="print-day" value="${index}">
                                ${day}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="print-actions">
                <button class="btn" id="start-print">Drucken</button>
                <button class="btn" id="cancel-print">Abbrechen</button>
            </div>
        </div>
    `;
}

// Setup print modal event listeners
function setupPrintModalListeners() {
    const closeModalBtn = printModal.querySelector('.close-modal');
    const cancelPrintBtn = printModal.querySelector('#cancel-print');
    const startPrintBtn = printModal.querySelector('#start-print');

    // Close modal function
    const closeModal = () => printModal.classList.remove('active');

    // Add event listeners
    closeModalBtn?.addEventListener('click', closeModal);
    cancelPrintBtn?.addEventListener('click', closeModal);
    startPrintBtn?.addEventListener('click', handleStartPrint);
}

// Handle start print
export function handleStartPrint() {
    // Get selected day
    const selectedDayValue = printModal.querySelector('input[name="print-day"]:checked').value;
    const selectedDays = selectedDayValue === 'all' 
        ? Array.from({ length: DAYS.length }, (_, i) => i)
        : [parseInt(selectedDayValue)];

    // Create print content
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';

    // Collect all buttons and organize by layout and person
    const buttonsByLayout = new Map(); // Layout -> Array of {person, button}
    document.querySelectorAll('.day-button').forEach(button => {
        const personId = button.dataset.personId;
        const layoutId = button.dataset.layoutId;
        const person = allPersons.find(p => p.id === personId);
        if (!person) return;

        if (!buttonsByLayout.has(layoutId)) {
            buttonsByLayout.set(layoutId, []);
        }
        buttonsByLayout.get(layoutId).push({ person, button });
    });

    // Sort layouts (Mittagessen first, then Abendessen)
    const sortedLayouts = Array.from(buttonsByLayout.keys()).sort((a, b) => {
        const layoutA = printLayouts.find(l => l.id === a);
        const layoutB = printLayouts.find(l => l.id === b);
        return layoutA.name.localeCompare(layoutB.name);
    });

    // Process each layout
    sortedLayouts.forEach(layoutId => {
        const layout = printLayouts.find(l => l.id === layoutId);
        if (!layout) return;

        const personButtons = buttonsByLayout.get(layoutId);
        
        // Sort persons by name for consistent order
        personButtons.sort((a, b) => formatPersonName(a.person).localeCompare(formatPersonName(b.person)));

        // Process each person's buttons for this layout
        personButtons.forEach(({ person, button }) => {
            const dayIndex = parseInt(button.dataset.dayIndex);
            if (selectedDays.includes(dayIndex)) {
                const plan = currentPlans.get(person.id);
                if (plan) {
                    const menuContent = createDayMenuHTML(person, plan, dayIndex, layout);
                    const menuDiv = document.createElement('div');
                    menuDiv.className = 'menu-content';
                    menuDiv.innerHTML = menuContent;
                    printContainer.appendChild(menuDiv);
                }
            }
        });
    });

    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    // Write content to iframe
    const printDocument = printFrame.contentWindow.document;
    printDocument.open();
    printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Druckvorschau</title>
            <style>
                @page {
                    size: A5 landscape !important;
                    margin: 10mm !important;
                }
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    font-family: Arial, sans-serif !important;
                }
                body .menu-content {
                    page-break-after: always !important;
                    width: 210mm !important;
                    height: 148mm !important;
                    margin: 0 !important;
                    padding: 10mm !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                body .menu-content:last-child {
                    page-break-after: avoid !important;
                }
                body .menu-header {
                    display: grid !important;
                    grid-template-columns: 60mm 1fr !important;
                    gap: 5mm !important;
                    margin-bottom: 5mm !important;
                    flex: 0 0 auto !important;
                }
                body .person-areas {
                    border-right: 1px solid #ccc !important;
                    padding-right: 5mm !important;
                    display: grid !important;
                    grid-auto-rows: auto !important;
                    row-gap: 3mm !important;
                    font-size: 9pt !important;
                }
                body .person-areas span {
                    display: block !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                body .header-main {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 2mm !important;
                }
                body .person-name {
                    font-size: 14pt !important;
                    margin: 0 !important;
                    color: #333 !important;
                }
                body .day-header {
                    font-size: 12pt !important;
                    margin: 0 !important;
                    color: #0078d4 !important;
                }
                body .menu-table-container {
                    flex: 1 1 auto !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: flex-start !important;
                    padding-top: 10mm !important;
                }
                body .menu-table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin: 0 !important;
                }
                body .menu-table td {
                    border: 1px solid #000 !important;
                    padding: 2mm !important;
                }
                body .category-cell {
                    width: 30mm !important;
                    background-color: #f5f5f5 !important;
                    -webkit-print-color-adjust: exact !important;
                }
                body .menu-cell {
                    font-size: 9pt !important;
                }
                body .meal-info {
                    margin-bottom: 1mm !important;
                }
                body .meal-portion {
                    font-size: 8pt !important;
                }
                body .meal-alternatives,
                body .meal-comments {
                    font-size: 8pt !important;
                    margin-top: 1mm !important;
                }
                @media print {
                    body * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            </style>
        </head>
        <body>
            ${printContainer.innerHTML}
        </body>
        </html>
    `);
    printDocument.close();

    // Close modal
    printModal.classList.remove('active');

    // Print the iframe
    printFrame.contentWindow.print();

    // Remove iframe after printing
    printFrame.contentWindow.onafterprint = () => {
        document.body.removeChild(printFrame);
    };
}

// Create day menu HTML
export function createDayMenuHTML(person, plan, dayIndex, layout) {
    const day = DAYS[dayIndex];
    
    return `
        <div class="menu-header">
            <div class="person-areas">
                ${Object.entries(person.areas || {})
                    .map(([key, value]) => `<span>${key}: ${value}</span>`)
                    .join('\n')}
            </div>
            <div class="header-main">
                <h2 class="person-name">${formatPersonName(person)}</h2>
                <h3 class="day-header">${day} - ${layout.name}</h3>
            </div>
        </div>
        <div class="menu-table-container">
            <table class="menu-table">
                <tbody>
                    ${layout.categories.map(category => {
                        let jsonKey = category.toLowerCase()
                            .replace(/ü/g, 'ue')
                            .replace(/[- ]/g, '')
                            .replace('menü', 'menue');
                        
                        const key = `${dayIndex}_${jsonKey}`;
                        const mealData = plan[key];
                        
                        return `
                            <tr>
                                <td class="category-cell">${category}</td>
                                <td class="menu-cell">
                                    ${mealData ? formatMealCell(mealData) : ''}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function formatMealCell(mealData) {
    if (!mealData || !mealData.meals || mealData.meals.length === 0) {
        return '';
    }

    // Group meals by their rezept_selected status
    const selectedMeals = [];
    const unselectedMeals = [];
    
    mealData.meals.forEach(meal => {
        if (meal.rezept_selected === false) {
            unselectedMeals.push(meal.name);
        } else {
            selectedMeals.push(meal.name);
        }
    });

    return `
        <div class="meal-info">
            ${selectedMeals.length > 0 ? 
                `<strong>${selectedMeals.join(', ')}</strong>` : 
                ''
            }
            ${unselectedMeals.length > 0 ? 
                `<strong style="color: red; text-decoration: line-through;">${unselectedMeals.join(', ')}</strong>` : 
                ''
            }
            ${mealData.portion ? `<span class="meal-portion">(${mealData.portion})</span>` : ''}
        </div>
        ${mealData.alternatives && mealData.alternatives.length > 0 ? `
            <div class="meal-alternatives">
                Alternative: ${mealData.alternatives.join(', ')}
            </div>
        ` : ''}
        ${mealData.comments && mealData.comments.length > 0 ? `
            <div class="meal-comments">
                Anmerkung: ${mealData.comments.map(c => c.text).join(', ')}
            </div>
        ` : ''}
    `;
} 