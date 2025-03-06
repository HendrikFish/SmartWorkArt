// Importiere die Konfiguration
import config from '../../../js/config.js';

export const API_BASE_URL = config.API_ENDPOINT;
console.log('API_BASE_URL wird geladen:', API_BASE_URL);

// Feste Kategorien
export const CATEGORIES = {
    'suppe': 'Suppe',
    'menue1': 'Menü 1',
    'menue2': 'Menü 2',
    'dessert': 'Dessert',
    'abendSuppe': 'Abend-Suppe',
    'milchspeise': 'Milchspeise',
    'normalkost': 'Normalkost'
};

// Umgekehrtes Mapping für API-Zugriffe
export const API_CATEGORY_MAPPING = {
    'Suppe': 'suppe',
    'Menü 1': 'menue1',
    'Menü 2': 'menue2',
    'Dessert': 'dessert',
    'Abend-Suppe': 'abendSuppe',
    'Milchspeise': 'milchspeise',
    'Normalkost': 'normalkost'
};

// Wochentage
export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// Funktion, um dynamische Extra-Kategorien hinzuzufügen
export function mergeExtraCategories(extraCats) {
    const mergedCategories = { ...CATEGORIES };
    const mergedMapping = { ...API_CATEGORY_MAPPING };
    
    if (extraCats && extraCats.length > 0) {
        extraCats.forEach(cat => {
            mergedCategories[cat.id] = cat.displayName;
            mergedMapping[cat.displayName] = cat.id;
        });
    }
    
    return { categories: mergedCategories, mapping: mergedMapping };
}
