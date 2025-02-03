const fs = require('fs').promises;
const path = require('path');

// Verzeichnisse
const PLAN_DIR = path.join(__dirname, '..', 'data', 'plan');
const RECIPES_DIR = path.join(__dirname, '..', 'data', 'rezepte');

// Lade einen Wochenplan
const getWeekPlan = async (req, res) => {
    const { year, week } = req.params;
    const filePath = path.join(PLAN_DIR, year, `KW${week}.json`);

    try {
        await fs.mkdir(path.join(PLAN_DIR, year), { recursive: true });
        let weekPlan;
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            weekPlan = JSON.parse(data);
        } catch (error) {
            console.log(`Datei ${filePath} nicht gefunden, erstelle eine neue.`);
            weekPlan = createEmptyWeekPlan(year, week);
            await fs.writeFile(filePath, JSON.stringify(weekPlan, null, 2));
        }
        res.json(weekPlan);
    } catch (error) {
        console.error(`Fehler beim Laden des Wochenplans: ${error.message}`);
        res.status(500).json({ error: 'Fehler beim Laden des Wochenplans' });
    }
};

// Neue Funktion für das Laden des Wochenplans mit Override-Prüfung
const getWeekPlanWithOverride = async (req, res) => {
    const { year, week } = req.params;
    const overridePath = path.join(PLAN_DIR, year, `KW${week}_override.json`);
    const standardPath = path.join(PLAN_DIR, year, `KW${week}.json`);

    try {
        await fs.mkdir(path.join(PLAN_DIR, year), { recursive: true });
        let weekPlan;

        // Prüfe zuerst auf Override-Datei
        try {
            const data = await fs.readFile(overridePath, 'utf-8');
            weekPlan = JSON.parse(data);
            console.log(`Override-Plan für KW${week}/${year} geladen`);
        } catch (error) {
            // Wenn keine Override-Datei existiert, versuche Standard-Datei
            try {
                const data = await fs.readFile(standardPath, 'utf-8');
                weekPlan = JSON.parse(data);
                console.log(`Standard-Plan für KW${week}/${year} geladen`);
            } catch (error) {
                console.log(`Keine Datei für KW${week}/${year} gefunden, erstelle neue.`);
                weekPlan = createEmptyWeekPlan(year, week);
                await fs.writeFile(standardPath, JSON.stringify(weekPlan, null, 2));
            }
        }
        res.json(weekPlan);
    } catch (error) {
        console.error(`Fehler beim Laden des Wochenplans: ${error.message}`);
        res.status(500).json({ error: 'Fehler beim Laden des Wochenplans' });
    }
};

// Speichere einen Wochenplan
const saveWeekPlan = async (req, res) => {
    const { year, week } = req.params;
    const filePath = path.join(PLAN_DIR, year, `KW${week}.json`);

    try {
        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
        res.status(200).json({ message: 'Wochenplan gespeichert' });
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Speichern des Wochenplans' });
    }
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
            menue2: [],
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

// Exporte
module.exports = {
    getWeekPlan,
    getWeekPlanWithOverride,
    saveWeekPlan,
    searchRecipes,
    initializeWeeks
};
