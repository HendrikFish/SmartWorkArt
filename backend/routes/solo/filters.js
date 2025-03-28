const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const FILTER_CONFIG_PATH = path.join(__dirname, '../../data/solo/config/filter.json');

// Hilfsfunktion zum Erstellen der filter.json, falls sie nicht existiert
async function ensureFilterConfig() {
    try {
        await fs.access(FILTER_CONFIG_PATH);
    } catch {
        // Datei existiert nicht, erstelle sie mit Standardwerten
        const defaultConfig = {
            fields: [],
            areas: []
        };
        await fs.writeFile(FILTER_CONFIG_PATH, JSON.stringify(defaultConfig, null, 4));
    }
}

// GET /api/solo/filters - Lade die Filter-Konfiguration
router.get('/', async (req, res) => {
    try {
        await ensureFilterConfig();
        const filterConfig = await fs.readFile(FILTER_CONFIG_PATH, 'utf8');
        res.json(JSON.parse(filterConfig));
    } catch (error) {
        console.error('Fehler beim Laden der Filter-Konfiguration:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Filter-Konfiguration' });
    }
});

// PUT /api/solo/filters - Speichere die Filter-Konfiguration
router.put('/', async (req, res) => {
    try {
        await ensureFilterConfig();
        await fs.writeFile(FILTER_CONFIG_PATH, JSON.stringify(req.body, null, 4));
        res.json({ message: 'Filter-Konfiguration erfolgreich gespeichert' });
    } catch (error) {
        console.error('Fehler beim Speichern der Filter-Konfiguration:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der Filter-Konfiguration' });
    }
});

module.exports = router; 