// utton ist in  und Jahr
// Hilfsfunktion zum Berechnen der aktuellen Kalenderwoche
function calculateCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const week = Math.floor(diff / oneWeek);
    return week + 1;
}

const state = {
    currentWeek: calculateCurrentWeek(),
    currentYear: new Date().getFullYear()
};

export const getCurrentWeek = () => state.currentWeek;
export const getCurrentYear = () => state.currentYear;
export const updateCurrentWeek = (week) => { state.currentWeek = week; };
export const updateCurrentYear = (year) => { state.currentYear = year; };

// State Management
export let selectedResident = {};
export let mealPlanData = {};
export let residentsData = [];
export let formConfig = {};
export let selectedMeals = {};

// DOM Elemente
export const domElements = {
    prevWeekBtn: null,
    nextWeekBtn: null,
    currentWeekSpan: null,
    currentDateSpan: null,
    residentButtonsContainer: null,
    selectedResidentDiv: null,
    mealTableBody: null
};

// DOM Elemente initialisieren
export function initializeDOMElements() {
    const elementIds = {
        'prevWeekBtn': 'prevWeek',
        'nextWeekBtn': 'nextWeek',
        'currentWeekSpan': 'currentWeek',
        'currentDateSpan': 'currentDate',
        'residentButtonsContainer': 'residentButtons',
        'selectedResidentDiv': 'selectedResident',
        'mealTableBody': 'mealTableBody'
    };

    for (const [key, id] of Object.entries(elementIds)) {
        const element = document.getElementById(id);
        if (element) {
            domElements[key] = element;
            console.log(`Element ${key} gefunden:`, element);
        } else {
            console.error(`Element ${key} nicht gefunden für ID: ${id}`);
        }
    }
    console.log('DOM-Elemente initialisiert:', domElements);
}
