// public/js/Modules/globalVariables.js

// Globale Variablen als ES6-Exports

export let currentWeek = null;
export let currentYear = null;
export let gruppen = [];
export let currentOrders = [];
export let currentEinrichtung = {
    name: "",
    kuerzel: "",
    speiseangebot: []
};

// Hilfsfunktionen zum Aktualisieren der Werte
export function updateCurrentWeek(week) {
    currentWeek = week;
}

export function updateCurrentYear(year) {
    currentYear = year;
}