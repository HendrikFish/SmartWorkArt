// Plan State
export let currentPlans = new Map();
export let currentCategories = [];
export let printLayouts = [];
export let currentLayout = null;

// Load plan data (layouts and categories)
export async function loadPlanData(apiBaseUrl, endpoints, year, week) {
    try {
        // Load layouts
        await loadLayouts(apiBaseUrl, endpoints, year, week);
        
        // Load categories
        await loadCategories(apiBaseUrl, endpoints, year, week);
        
        return true;
    } catch (error) {
        console.error('Error loading plan data:', error);
        alert('Fehler beim Laden der Plandaten');
        return false;
    }
}

// Load layouts
async function loadLayouts(apiBaseUrl, endpoints, year, week) {
    try {
        // Lade das zentrale Layout
        const config = await loadLayoutConfig(apiBaseUrl, endpoints);
        
        if (config) {
            applyConfig(config);
        } else {
            // Wenn kein Layout existiert, erstelle ein Standard-Layout und speichere es
            createDefaultLayouts();
            await saveLayoutConfig(apiBaseUrl, endpoints);
        }
    } catch (error) {
        console.error('Error loading layouts:', error);
        createDefaultLayouts();
    }
}

// Apply configuration
function applyConfig(config) {
    printLayouts = config.printLayouts || [];
    currentLayout = config.defaultLayout;

    // Stelle sicher, dass jedes Layout ein filters Array hat
    printLayouts.forEach(layout => {
        if (!layout.filters) {
            layout.filters = [];
        }
    });
}

// Load layout config
async function loadLayoutConfig(apiBaseUrl, endpoints) {
    try {
        const response = await fetch(
            `${apiBaseUrl}/${endpoints.SOLO_SELECT}/print/layout.json`
        );
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error loading layout config:', error);
        return null;
    }
}

// Create default layouts
function createDefaultLayouts() {
    const timestamp = Date.now();
    printLayouts = [
        {
            id: `layout_${timestamp}_1`,
            name: 'Mittagessen',
            categories: ['Suppe', 'Menü 1', 'Menü 2', 'Dessert'],
            filters: []
        },
        {
            id: `layout_${timestamp}_2`,
            name: 'Abendessen',
            categories: ['Abend-Suppe', 'Milchspeise', 'Normalkost'],
            filters: []
        }
    ];
    currentLayout = null;
}

// Load categories
async function loadCategories(apiBaseUrl, endpoints, year, week) {
    try {
        const response = await fetch(`${apiBaseUrl}/${endpoints.PLAN}/${year}/KW${week}`);
        if (response.ok) {
            const planData = await response.json();
            if (planData && planData.days && planData.days.length > 0) {
                currentCategories = extractCategories(planData.days[0]);
            } else {
                console.error('Keine Tage im Plan gefunden');
                currentCategories = [];
            }
        } else {
            console.error('Fehler beim Laden des Plans');
            currentCategories = [];
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        currentCategories = [];
    }
}

// Extract categories from plan data
function extractCategories(dayData) {
    return Object.keys(dayData)
        .filter(key => key !== 'day' && !key.startsWith('Einrichtungen'))
        .map(formatCategoryName);
}

// Format category name
function formatCategoryName(category) {
    switch(category) {
        case 'suppe': return 'Suppe';
        case 'menue1': return 'Menü 1';
        case 'menue2': return 'Menü 2';
        case 'dessert': return 'Dessert';
        case 'abendSuppe': return 'Abend-Suppe';
        case 'milchspeise': return 'Milchspeise';
        case 'normalkost': return 'Normalkost';
        default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
}

// Load individual plan
export async function loadIndividualPlan(apiBaseUrl, endpoints, year, week, person) {
    try {
        const fileName = `${person.firstName}_${person.lastName}.json`;
        const response = await fetch(`${apiBaseUrl}/${endpoints.SOLO_SELECT}/${year}/KW${week}/${fileName}`);
        
        if (response.ok) {
            const planData = await response.json();
            currentPlans.set(person.id, planData);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error loading plan for ${person.firstName} ${person.lastName}:`, error);
        return false;
    }
}

// Save plan
export async function savePlan(apiBaseUrl, endpoints, year, week, allPersons) {
    try {
        const plansToSave = [];
        
        for (const [personId, plan] of currentPlans.entries()) {
            const person = allPersons.find(p => p.id === personId);
            if (person) {
                plansToSave.push({
                    firstName: person.firstName,
                    lastName: person.lastName,
                    plan: plan
                });
            }
        }
        
        const currentState = {
            year,
            week,
            plans: plansToSave
        };
        
        const response = await fetch(`${apiBaseUrl}/${endpoints.SOLO_SELECT}/save/${year}/KW${week}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentState)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Error saving plan:', error);
        throw error;
    }
}

// Save layout configuration
export async function saveLayoutConfig(apiBaseUrl, endpoints) {
    try {
        const config = {
            printLayouts,
            defaultLayout: currentLayout,
            printOptions: {
                paperSize: 'A5',
                orientation: 'landscape',
                fontSize: '9pt'
            }
        };
        
        // Speichere das zentrale Layout
        const response = await fetch(
            `${apiBaseUrl}/${endpoints.SOLO_SELECT}/save/print/layout`, 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            }
        );
        
        if (!response.ok) {
            throw new Error('Fehler beim Speichern der Konfiguration');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving layout config:', error);
        throw error;
    }
} 