const fs = require('fs').promises;
const path = require('path');
const { WeekPlan, WeekOverride } = require('../models/planModels');
const moment = require('moment');

// Verzeichnisse
const PLAN_DIR = path.join(__dirname, '..', 'data', 'plan');
const RECIPES_DIR = path.join(__dirname, '..', 'data', 'rezepte');
const EINRICHTUNGEN_DIR = path.join(__dirname, '..', 'data', 'einrichtungen');

// Hilfsfunktion: Prüft ob eine Woche in der Zukunft liegt
const isWeekInFuture = (year, week) => {
    const targetDate = moment().isoWeekYear(year).isoWeek(week);
    const currentDate = moment();
    return targetDate.isAfter(currentDate, 'week');
};

// Hilfsfunktion: Findet die letzte vergangene Woche mit gleichem Modulo
const findLastCompletedWeek = async (targetWeek, currentYear, currentWeek) => {
    const targetModulo = ((targetWeek - 1) % 7) + 1;
    console.log(`Suche letzte verfügbare Woche vor KW${targetWeek} mit Modulo ${targetModulo}`);

    try {
        let searchWeek = targetWeek - 1;
        let searchYear = currentYear;

        while (searchWeek >= 1 || searchYear > currentYear - 1) {
            if (searchWeek < 1) {
                searchYear--;
                searchWeek = moment().isoWeeksInYear(searchYear);
            }

            const weekModulo = ((searchWeek - 1) % 7) + 1;
            if (weekModulo === targetModulo) {
                console.log(`Prüfe KW${searchWeek}/${searchYear} als mögliche Basis`);
                
                // Zuerst nach Override-Datei suchen
                const overridePath = path.join(PLAN_DIR, searchYear.toString(), `KW${searchWeek}_override.json`);
                const standardPath = path.join(PLAN_DIR, searchYear.toString(), `KW${searchWeek}.json`);
                
                try {
                    // Prüfe ob Override existiert
                    const overrideExists = await fs.access(overridePath).then(() => true).catch(() => false);
                    const standardExists = await fs.access(standardPath).then(() => true).catch(() => false);

                    if (!overrideExists && !standardExists) {
                        console.log(`Keine Daten für KW${searchWeek}/${searchYear} gefunden, suche weiter`);
                        searchWeek--;
                        continue;
                    }

                    let baseData;
                    if (overrideExists) {
                        console.log(`Override-Datei für KW${searchWeek}/${searchYear} gefunden`);
                        const overrideData = JSON.parse(await fs.readFile(overridePath, 'utf-8'));
                        if (standardExists) {
                            const standardData = JSON.parse(await fs.readFile(standardPath, 'utf-8'));
                            baseData = mergeWeekData(standardData, overrideData);
                        } else {
                            baseData = overrideData;
                        }
                    } else {
                        console.log(`Standard-Datei für KW${searchWeek}/${searchYear} gefunden`);
                        baseData = JSON.parse(await fs.readFile(standardPath, 'utf-8'));
                    }
                    
                    // Prüfe ob die Woche tatsächlich Daten enthält
                    const hasContent = baseData.days?.some(day => 
                        Object.keys(day).some(key => 
                            Array.isArray(day[key]) && day[key].length > 0
                        )
                    );

                    if (!hasContent) {
                        console.log(`KW${searchWeek}/${searchYear} ist leer, suche weiter`);
                        searchWeek--;
                        continue;
                    }

                    console.log(`KW${searchWeek}/${searchYear} wird als Basis verwendet`);
                    // Erstelle eine neue Kopie mit angepasster Woche und Jahr
                    const newData = {
                        ...baseData,
                        year: currentYear,
                        week: targetWeek,
                        days: baseData.days.map(day => ({
                            ...day,
                            ...Object.fromEntries(
                                Object.entries(day)
                                    .filter(([key, value]) => Array.isArray(value))
                                    .map(([key, value]) => [key, [...value]])
                            )
                        }))
                    };
                    return newData;
                } catch (error) {
                    console.log(`Fehler beim Laden von KW${searchWeek}/${searchYear}:`, error);
                    searchWeek--;
                    continue;
                }
            }
            searchWeek--;
        }
        console.log('Keine passende Basiswoche gefunden');
    } catch (error) {
        console.error('Fehler beim Finden der letzten Woche:', error);
    }
    
    console.log('Erstelle leeren Plan als Fallback');
    return createEmptyWeekPlan(currentYear, targetWeek);
};

// Lade einen Wochenplan
const getWeekPlan = async (req, res) => {
    const { year, week } = req.params;
    const useRotation = req.query.useRotation === 'true';
    const forceReload = req.query.forceReload === 'true';
    const filePath = path.join(PLAN_DIR, year, `KW${week}.json`);

    try {
        await fs.mkdir(path.join(PLAN_DIR, year), { recursive: true });
        
        if ((useRotation && isWeekInFuture(parseInt(year), parseInt(week))) || forceReload) {
            console.log('Lade Basisdaten' + (forceReload ? ' (erzwungen)' : ''));
            const currentDate = moment();
            const currentWeek = currentDate.isoWeek();
            const currentYear = currentDate.isoWeekYear();

            const baseData = await findLastCompletedWeek(parseInt(week), currentYear, currentWeek);

            try {
                const overridePath = path.join(PLAN_DIR, year, `KW${week}_override.json`);
                const overrideExists = await fs.access(overridePath).then(() => true).catch(() => false);
                
                if (overrideExists && !forceReload) {
                    console.log('Überschreibungen gefunden');
                    const overrideData = JSON.parse(await fs.readFile(overridePath, 'utf-8'));
                    const mergedData = mergeWeekData(baseData, overrideData);
                    res.json(mergedData);
                } else {
                    console.log('Verwende reine Basisdaten');
                    await fs.writeFile(filePath, JSON.stringify(baseData, null, 2));
                    res.json(baseData);
                }
            } catch (error) {
                console.log('Fehler beim Laden der Überschreibungen:', error);
                await fs.writeFile(filePath, JSON.stringify(baseData, null, 2));
                res.json(baseData);
            }
            return;
        }

        // Normaler Ablauf für nicht-zukünftige Wochen
        try {
            const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
            if (!fileExists) {
                // Wenn Datei nicht existiert, erstelle neue
                const emptyPlan = createEmptyWeekPlan(year, week);
                await fs.writeFile(filePath, JSON.stringify(emptyPlan, null, 2));
                res.json(emptyPlan);
                return;
            }
            // Wenn Datei existiert, lade sie
            const data = await fs.readFile(filePath, 'utf-8');
            const weekPlan = JSON.parse(data);
            res.json(weekPlan);
        } catch (error) {
            console.error(`Fehler beim Laden/Erstellen der Datei: ${error.message}`);
            res.status(500).json({ error: 'Fehler beim Laden/Erstellen der Datei' });
        }
    } catch (error) {
        console.error(`Fehler beim Laden des Wochenplans: ${error.message}`);
        res.status(500).json({ error: 'Fehler beim Laden des Wochenplans' });
    }
};

// Speichere einen Wochenplan
const saveWeekPlan = async (req, res) => {
    const { year, week } = req.params;
    const useRotation = req.query.useRotation === 'true';

    try {
        if (useRotation && isWeekInFuture(parseInt(year), parseInt(week))) {
            // Speichere nur die Überschreibungen
            const overridePath = path.join(PLAN_DIR, year, `KW${week}_override.json`);
            await fs.writeFile(overridePath, JSON.stringify(req.body, null, 2));
            res.status(200).json({ message: 'Überschreibungen gespeichert' });
        } else {
            // Normales Speichern für nicht-zukünftige Wochen
            const filePath = path.join(PLAN_DIR, year, `KW${week}.json`);
            await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
            res.status(200).json({ message: 'Wochenplan gespeichert' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Speichern des Wochenplans' });
    }
};

// Hilfsfunktion zum Zusammenführen von Basis-Daten und Überschreibungen
const mergeWeekData = (baseData, overrideData) => {
    const merged = JSON.parse(JSON.stringify(baseData)); // Deep clone
    
    overrideData.days.forEach((overrideDay, index) => {
        Object.keys(overrideDay).forEach(key => {
            if (key !== 'day') { // Ignoriere das day-Feld
                merged.days[index][key] = overrideDay[key];
            }
        });
    });
    
    return merged;
};

// Suche nach Rezepten
const searchRecipes = async (req, res) => {
    const term = req.query.search?.toLowerCase();
    console.log("Suchbegriff:", term); // Debugging

    try {
        const files = await fs.readdir(RECIPES_DIR);
        let allRecipes = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const recipes = JSON.parse(await fs.readFile(path.join(RECIPES_DIR, file), 'utf-8'));
                allRecipes = allRecipes.concat(recipes);
            }
        }

        const filteredRecipes = allRecipes.filter(recipe =>
            recipe.name.toLowerCase().includes(term)
        );

        res.json(filteredRecipes);
    } catch (error) {
        console.error("Fehler bei der Rezeptsuche:", error.message);
        res.status(500).json({ error: "Fehler bei der Rezeptsuche" });
    }
};

// Hilfsfunktion: Erstelle einen leeren Wochenplan
function createEmptyWeekPlan(year, week) {
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    return {
        year,
        week,
        days: days.map((day) => ({
            day,
            suppe: [],
            menue1: [],
            Einrichtungen: [],
            menue2: [],
            Einrichtungen: [],
            dessert: [],
            abendSuppe: [],
            milchspeise: [],
            normalkost: []
        }))
    };
}

// Initialisiere Wochenpläne
const initializeWeeks = async () => {
    try {
        const basePath = path.join(__dirname, '../data/plan/2024');
        await fs.mkdir(basePath, { recursive: true }); // Sicherstellen, dass das Verzeichnis existiert

        for (let i = 1; i <= 52; i++) {
            const fileName = `KW${i}.json`;
            const filePath = path.join(basePath, fileName);

            try {
                await fs.access(filePath); // Prüft, ob die Datei existiert
                console.log(`Datei ${filePath} existiert bereits.`);
            } catch {
                await fs.writeFile(filePath, JSON.stringify({ message: `Wochenplan für KW${i}` }, null, 2));
                console.log(`Datei ${filePath} erstellt.`);
            }
        }
    } catch (error) {
        console.error('Fehler bei der Initialisierung der Wochenpläne:', error.message);
        throw error; // Wirf den Fehler weiter, wenn notwendig
    }
};

// Lade Einrichtungen
const getEinrichtungen = async (req, res) => {
    try {
        const files = await fs.readdir(EINRICHTUNGEN_DIR);
        let allEinrichtungen = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const einrichtungen = JSON.parse(
                    await fs.readFile(path.join(EINRICHTUNGEN_DIR, file), 'utf-8')
                );
                allEinrichtungen = allEinrichtungen.concat(einrichtungen);
            }
        }

        res.json(allEinrichtungen);
    } catch (error) {
        console.error("Fehler beim Laden der Einrichtungen:", error.message);
        res.status(500).json({ error: "Fehler beim Laden der Einrichtungen" });
    }
};

// Exporte
module.exports = {
    getEinrichtungen, 
    getWeekPlan,
    saveWeekPlan,
    searchRecipes,
    initializeWeeks
};
