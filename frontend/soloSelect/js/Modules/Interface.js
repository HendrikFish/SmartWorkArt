// UI Constants
export const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// Import required functions
import { filterPlans, loadData } from '../script.js';

// DOM Elements
export const yearSelect = document.getElementById('year');
export const weekSelect = document.getElementById('week');
export const filterButtons = document.getElementById('filter-buttons');
export const plansList = document.getElementById('plans-list');
export const printBtn = document.getElementById('print-btn');

// UI State
export let formConfig = null;
export let activeFilters = new Map();

// Update form config
export function updateFormConfig(newConfig) {
    formConfig = newConfig;
    setupFilterButtons();
}

// Setup filter buttons
export function setupFilterButtons() {
    if (!formConfig) return;

    filterButtons.innerHTML = '';
    const menuFilterAreas = formConfig.areas.filter(area => area.menuFilter === true);
    
    menuFilterAreas.forEach(area => {
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group';
        
        const title = document.createElement('div');
        title.className = 'filter-group-title';
        title.textContent = area.name;
        filterGroup.appendChild(title);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'filter-buttons';

        area.buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = button.label;
            btn.dataset.area = area.name;
            btn.dataset.value = button.label;
            btn.addEventListener('click', () => toggleFilter(area.name, button.label));
            buttonsContainer.appendChild(btn);
        });

        filterGroup.appendChild(buttonsContainer);
        filterButtons.appendChild(filterGroup);
    });
}

// Toggle filter
export function toggleFilter(area, value) {
    const key = `${area}:${value}`;
    const button = filterButtons.querySelector(`button[data-area="${area}"][data-value="${value}"]`);
    
    if (activeFilters.has(key)) {
        activeFilters.delete(key);
        button?.classList.remove('active');
    } else {
        activeFilters.set(key, { area, value });
        button?.classList.add('active');
    }

    filterPlans();
}

// Initialize year and week selectors
export async function initializeSelectors() {
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Fill year selector (current year and next year)
    yearSelect.innerHTML = '';
    [currentYear, currentYear + 1].forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
    yearSelect.value = currentYear;

    // Fill week selector (1-53)
    weekSelect.innerHTML = '';
    for (let week = 1; week <= 53; week++) {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = `KW${week}`;
        weekSelect.appendChild(option);
    }
    
    // Set current week
    const currentWeek = getWeekNumber(currentDate);
    weekSelect.value = currentWeek;

    await loadData();
}

// Get ISO week number
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
} 