// Person State
export let allPersons = [];

// Load persons from API
export async function loadPersons(apiBaseUrl, endpoints) {
    try {
        const response = await fetch(`${apiBaseUrl}/${endpoints.SOLO_SELECT}/persons`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allPersons = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading persons:', error);
        alert('Fehler beim Laden der Personen');
        return false;
    }
}

// Filter persons based on active filters and current plans
export function filterPersons(activeFilters, currentPlans) {
    return allPersons.filter(person => {
        if (currentPlans.has(person.id) && person.areas) {
            if (activeFilters.size === 0) return true;
            
            return Array.from(activeFilters.values()).every(filter => {
                return person.areas[filter.area] === filter.value;
            });
        }
        return false;
    });
}

// Format person name for display
export function formatPersonName(person) {
    return `${person.gender} ${person.firstName} ${person.lastName}`;
}

// Format person ID for file name
export function formatPersonId(person) {
    return `${person.firstName}_${person.lastName}`;
} 