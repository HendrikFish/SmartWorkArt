import { getCurrentWeek, getCurrentYear } from './variablen.js';
import { WEEKDAYS } from './konstanten.js';

export function formatDate(date) {
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function getWeekStartDate(year, week) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}

export function createStorageKey(day, category) {
    const dayIndex = WEEKDAYS.indexOf(day);
    const normalizedCategory = category
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
    return `${dayIndex}_${normalizedCategory}`;
}

export function createNewSelection(day, category, meals, portion = "100%") {
    return {
        day,
        category,
        selected: true,
        portion,
        meals: Array.isArray(meals) ? meals.map(extractMinimalMealData) : [extractMinimalMealData(meals)],
        comments: [],
        alternatives: []
    };
}

export function extractMinimalMealData(meal) {
    return {
        rezeptId: meal.rezeptId,
        name: meal.name
    };
}

export function formatSelectionForSave(day, category, meals) {
    const key = `${WEEKDAYS.indexOf(day)}_${category}`;
    const mealsArray = Array.isArray(meals) ? meals : [meals];
    
    return {
        day: day,
        category: category,
        meals: mealsArray.map(meal => ({
            mealName: typeof meal === 'string' ? meal : meal.textContent || meal.name,
            selected: true,
            components: [],
            comments: [],
            alternatives: []
        })),
        selected: true,
        portion: "100%"
    };
}

export function processMealPlanData(data) {
    console.log('Rohdaten vom Server:', data);
    
    return {
        days: WEEKDAYS.map(weekday => {
            const dayData = data.days.find(d => d.day === weekday);
            if (!dayData) {
                console.log(`Keine Daten für ${weekday} gefunden`);
                return null;
            }
            
            return {
                day: weekday,
                suppe: dayData.suppe || null,
                menue1: dayData.menue1 || null,
                menue2: dayData.menue2 || null,
                dessert: dayData.dessert || null,
                abendSuppe: dayData.abendSuppe || null,
                milchspeise: dayData.milchspeise || null,
                normalkost: dayData.normalkost || null
            };
        })
    };
}

export function getAllergenList(resident) {
    const allergenArea = resident.areas?.Allergene;
    
    if (!allergenArea) return [];
    if (Array.isArray(allergenArea)) return allergenArea;
    if (typeof allergenArea === 'object') {
        if (allergenArea.value) return [allergenArea.value];
        if (allergenArea.label) return [allergenArea.label];
        return [];
    }
    if (typeof allergenArea === 'string') return [allergenArea];
    
    return [];
}

export function checkForAllergies(meals, residentAllergies) {
    if (!Array.isArray(meals) || !residentAllergies || residentAllergies.length === 0) {
        return false;
    }
    
    return meals.some(meal => 
        meal.zutaten?.some(zutat => 
            zutat.allergene?.some(allergen =>
                residentAllergies.some(residentAllergen => 
                    residentAllergen && allergen && 
                    residentAllergen.toLowerCase() === allergen.toLowerCase()
                )
            )
        )
    );
}

export function isClickInsideDetails(target) {
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
