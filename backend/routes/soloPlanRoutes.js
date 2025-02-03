const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const SoloPlanModel = require('../models/soloPlanModels');
const SoloPlanController = require('../controllers/soloPlanController');

// Route für formConfig
router.get('/config/formConfig', async (req, res) => {
    try {
        const formConfig = await SoloPlanModel.getFormConfig();
        if (!formConfig) {
            return res.status(404).json({ error: 'Konfiguration nicht gefunden' });
        }
        res.json(formConfig);
    } catch (error) {
        console.error('Fehler beim Laden der formConfig:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Route zum Abrufen aller Bewohner
router.get('/residents', SoloPlanController.getResidents);

// Route zum Aktualisieren eines Bewohners
router.put('/residents/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const residentData = req.body;
        
        // Speichere die aktualisierten Daten
        const filePath = path.join(__dirname, '../data/solo/person/upToDate', `${filename}.json`);
        await fs.writeFile(filePath, JSON.stringify(residentData, null, 2), 'utf-8');
        
        res.json({ message: 'Bewohner erfolgreich aktualisiert' });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Bewohners:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der Änderungen' });
    }
});

// Route zum Abrufen der Menüdaten
router.get('/menu/:year/KW:week', SoloPlanController.getMenu);

// Neue Route zum Prüfen existierender Daten
router.get('/hasData/:year/KW:week/:resident', SoloPlanController.checkExistingData);

// Route für rohe Menüdaten
router.get('/menu/raw/:year/KW:week', async (req, res) => {
    try {
        const { year, week } = req.params;
        const filePath = path.join(__dirname, `../data/plan/${year}/KW${week}.json`);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({ error: 'Datei nicht gefunden' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Fehler beim Lesen der Menüdaten:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

router.get('/menu/raw/:year/KW:week_override', async (req, res) => {
    try {
        const { year, week } = req.params;
        const filePath = path.join(__dirname, `../data/plan/${year}/KW${week}_override.json`);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({ error: 'Keine Override-Datei vorhanden' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Fehler beim Lesen der Override-Menüdaten:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// Routen für Bewohnerauswahl
router.get('/selections/:year/KW:week/:resident', SoloPlanController.getResidentSelections);
router.post('/selections/:year/KW:week/:resident', SoloPlanController.saveResidentSelections);
router.delete('/selections/:year/KW:week/:resident', SoloPlanController.deleteResidentSelections);

// Neue Route für Alternativen
router.get('/shorts', SoloPlanController.getShorts);
router.post('/shorts', async (req, res) => {
    try {
        const shortsPath = path.join(__dirname, '..', 'data', 'soloPlan', 'short', 'shorts.json');
        await fs.writeFile(shortsPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Alternativen erfolgreich gespeichert' });
    } catch (error) {
        console.error('Fehler beim Speichern der Alternativen:', error);
        res.status(500).json({ 
            message: 'Fehler beim Speichern der Alternativen',
            error: error.message 
        });
    }
});

module.exports = router;
