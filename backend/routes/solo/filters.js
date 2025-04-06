const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Konstanten für Dateipfade
const CONFIG_DIR = path.join(__dirname, '../../../data/solo/config');
const FILTER_FILE = path.join(CONFIG_DIR, 'filter.json');
const FORM_CONFIG_FILE = path.join(CONFIG_DIR, 'formConfig.json');
const PERSONS_DIR = path.join(__dirname, '../../../data/solo/person/upToDate');

// Hilfsfunktion zum Laden der Formular-Konfiguration
async function loadFormConfig() {
    try {
        const formConfigData = await fs.readFile(FORM_CONFIG_FILE, 'utf8');
        return JSON.parse(formConfigData);
    } catch (error) {
        console.error('Fehler beim Laden der Formular-Konfiguration:', error);
        return { areas: [] };
    }
}

// Hilfsfunktion zum Laden der aktiven Filter
async function loadActiveFilters() {
    try {
        const filterData = await fs.readFile(FILTER_FILE, 'utf8');
        return JSON.parse(filterData);
    } catch (error) {
        return {
            activeAreas: {} // Objekt mit Bereichsnamen als Schlüssel und ausgewählten Werten
        };
    }
}

// Hilfsfunktion zum Speichern der aktiven Filter
async function saveActiveFilters(activeFilters) {
    await fs.writeFile(FILTER_FILE, JSON.stringify(activeFilters, null, 2));
}

// GET /api/solo/filters
router.get('/', async (req, res) => {
    try {
        // Lade Formular-Konfiguration und aktive Filter
        const formConfig = await loadFormConfig();
        const activeFilters = await loadActiveFilters();

        // Bereite die Antwort vor
        const response = {
            filterConfig: formConfig.areas.map(area => ({
                name: area.name,
                options: area.buttons.map(btn => btn.label)
            })),
            activeFilters: activeFilters.activeAreas
        };

        res.json(response);
    } catch (error) {
        console.error('Fehler beim Laden der Filter:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/solo/filters
router.put('/', async (req, res) => {
    try {
        const { activeAreas } = req.body;

        // Validiere die Eingabe
        if (typeof activeAreas !== 'object') {
            return res.status(400).json({
                error: 'Ungültige Eingabe',
                message: 'activeAreas muss ein Objekt sein'
            });
        }

        // Speichere die aktiven Filter
        await saveActiveFilters({ activeAreas });

        res.json({
            success: true,
            activeFilters: { activeAreas }
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Filter:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 