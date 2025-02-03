const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { createDirectoryIfNotExists, validatePlanData, formatPlanData } = require('../models/soloSelectModels');

// GET route to list all persons
router.get('/persons', async (req, res) => {
    try {
        const personsPath = path.join(__dirname, '../data/solo/person/upToDate');
        const files = await fs.readdir(personsPath);
        
        const persons = await Promise.all(
            files
                .filter(file => file.endsWith('.json'))
                .map(async file => {
                    const filePath = path.join(personsPath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const person = JSON.parse(content);
                    return {
                        id: file.replace('.json', ''),
                        firstName: person.firstName,
                        lastName: person.lastName,
                        gender: person.gender,
                        areas: person.areas || {}
                    };
                })
        );

        res.json(persons);
    } catch (error) {
        console.error('Error loading persons:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Personen' });
    }
});

// GET route to retrieve a specific person
router.get('/person/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filePath = path.join(__dirname, `../data/solo/person/upToDate/${id}.json`);
        
        const fileExists = await fs.access(filePath)
            .then(() => true)
            .catch(() => false);

        if (!fileExists) {
            return res.status(404).json({ error: 'Person nicht gefunden' });
        }

        const personData = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(personData));
    } catch (error) {
        console.error('Error reading person:', error);
        res.status(500).json({ error: 'Serverfehler beim Lesen der Person' });
    }
});

// GET route to retrieve a specific plan
router.get('/:year/KW:week/:fileName', async (req, res) => {
    try {
        const { year, week, fileName } = req.params;
        
        // Versuche den Plan direkt aus dem soloPlan-Ordner zu laden
        const soloPlanPath = path.join(__dirname, `../data/soloPlan/${year}/KW${week}/${fileName}`);
        console.log('Versuche zu laden:', soloPlanPath); // Debug-Ausgabe
        
        const soloPlanExists = await fs.access(soloPlanPath)
            .then(() => true)
            .catch(() => false);

        if (soloPlanExists) {
            const planData = await fs.readFile(soloPlanPath, 'utf8');
            return res.json(JSON.parse(planData));
        }

        return res.status(404).json({ error: 'Plan nicht gefunden' });
    } catch (error) {
        console.error('Error reading plan:', error);
        res.status(500).json({ error: 'Serverfehler beim Lesen des Plans' });
    }
});

// POST route to save a new plan
router.post('/:year/KW:week/:personId', async (req, res) => {
    try {
        const { year, week, personId } = req.params;
        const planData = req.body;

        // Validiere die Plandaten
        if (!validatePlanData(planData)) {
            return res.status(400).json({ error: 'Ungültige Plandaten' });
        }

        // Formatiere die Daten
        const formattedData = formatPlanData(planData);

        // Erstelle das Verzeichnis, falls es nicht existiert
        const dirPath = path.join(__dirname, `../data/soloSelect/${year}/KW${week}`);
        await createDirectoryIfNotExists(dirPath);

        // Speichere den Plan
        const filePath = path.join(dirPath, `${personId}.json`);
        await fs.writeFile(filePath, JSON.stringify(formattedData, null, 2));

        res.json({ message: 'Plan erfolgreich gespeichert' });
    } catch (error) {
        console.error('Error saving plan:', error);
        res.status(500).json({ error: 'Serverfehler beim Speichern des Plans' });
    }
});

// GET route to list all plans for a specific week
router.get('/:year/KW:week', async (req, res) => {
    try {
        const { year, week } = req.params;
        
        // Prüfe sowohl den soloPlan als auch den soloSelect Ordner
        const soloPlanPath = path.join(__dirname, `../data/soloPlan/${year}/KW${week}`);
        const soloSelectPath = path.join(__dirname, `../data/soloSelect/${year}/KW${week}`);
        
        const plans = new Set();

        // Lade Pläne aus dem soloPlan Ordner
        try {
            const soloPlanFiles = await fs.readdir(soloPlanPath);
            soloPlanFiles
                .filter(file => file.startsWith('filled_') && file.endsWith('.json'))
                .forEach(file => plans.add(file.replace('filled_', '').replace('.json', '')));
        } catch (error) {
            // Ignoriere Fehler, wenn der Ordner nicht existiert
        }

        // Lade Pläne aus dem soloSelect Ordner
        try {
            const soloSelectFiles = await fs.readdir(soloSelectPath);
            soloSelectFiles
                .filter(file => file.endsWith('.json'))
                .forEach(file => plans.add(file.replace('.json', '')));
        } catch (error) {
            // Ignoriere Fehler, wenn der Ordner nicht existiert
        }

        res.json(Array.from(plans));
    } catch (error) {
        console.error('Error listing plans:', error);
        res.status(500).json({ error: 'Serverfehler beim Auflisten der Pläne' });
    }
});

// GET route to retrieve form configuration
router.get('/config', async (req, res) => {
    try {
        const configPath = path.join(__dirname, '../data/solo/config/formConfig.json');
        const configData = await fs.readFile(configPath, 'utf8');
        res.json(JSON.parse(configData));
    } catch (error) {
        console.error('Error reading form config:', error);
        res.status(500).json({ error: 'Serverfehler beim Lesen der Konfiguration' });
    }
});

// GET route to retrieve print options for a specific week
router.get('/options/:year/KW:week', async (req, res) => {
    try {
        const { year, week } = req.params;
        const optionsDir = path.join(__dirname, `../data/soloSelect/print/${year}/KW${week}`);
        
        try {
            // Prüfe ob das Verzeichnis existiert
            await fs.access(optionsDir);
            
            // Liste alle Dateien im Verzeichnis
            const files = await fs.readdir(optionsDir);
            
            // Filtere nach print_options Dateien und sortiere nach Zeitstempel (neueste zuerst)
            const optionsFiles = files
                .filter(file => file.startsWith('print_options_') && file.endsWith('.json'))
                .sort((a, b) => {
                    const timestampA = parseInt(a.replace('print_options_', '').replace('.json', ''));
                    const timestampB = parseInt(b.replace('print_options_', '').replace('.json', ''));
                    return timestampB - timestampA;
                });

            if (optionsFiles.length > 0) {
                // Lade die neueste Datei
                const latestFile = optionsFiles[0];
                const optionsPath = path.join(optionsDir, latestFile);
                const optionsData = await fs.readFile(optionsPath, 'utf8');
                return res.json(JSON.parse(optionsData));
            }
        } catch (error) {
            // Verzeichnis oder Datei existiert nicht
        }

        // Wenn keine Optionen gefunden wurden, sende Standardkonfiguration
        res.json({
            printLayouts: [],
            defaultLayout: null,
            printOptions: {
                paperSize: 'A5',
                orientation: 'landscape',
                fontSize: '9pt'
            }
        });
    } catch (error) {
        console.error('Error reading print options:', error);
        res.status(500).json({ error: 'Serverfehler beim Lesen der Druckoptionen' });
    }
});

// POST route to save print options for a specific week
router.post('/options/:year/KW:week', async (req, res) => {
    try {
        const { year, week } = req.params;
        const timestamp = Date.now();
        const dirPath = path.join(__dirname, `../data/soloSelect/print/${year}/KW${week}`);
        const optionsPath = path.join(dirPath, `print_options_${timestamp}.json`);

        // Stelle sicher, dass das Verzeichnis existiert
        await createDirectoryIfNotExists(dirPath);

        // Speichere die Optionen mit Zeitstempel
        await fs.writeFile(optionsPath, JSON.stringify(req.body, null, 2));

        // Optional: Lösche alte Versionen, behalte nur die letzten 5
        try {
            const files = await fs.readdir(dirPath);
            const optionsFiles = files
                .filter(file => file.startsWith('print_options_') && file.endsWith('.json'))
                .sort((a, b) => {
                    const timestampA = parseInt(a.replace('print_options_', '').replace('.json', ''));
                    const timestampB = parseInt(b.replace('print_options_', '').replace('.json', ''));
                    return timestampB - timestampA;
                });

            // Lösche alle Dateien außer den neuesten 5
            for (let i = 5; i < optionsFiles.length; i++) {
                await fs.unlink(path.join(dirPath, optionsFiles[i]));
            }
        } catch (error) {
            console.error('Error cleaning up old options files:', error);
        }

        res.json({ message: 'Druckoptionen erfolgreich gespeichert' });
    } catch (error) {
        console.error('Error saving print options:', error);
        res.status(500).json({ error: 'Serverfehler beim Speichern der Druckoptionen' });
    }
});

// Layout-Management
router.get('/print/layout.json', async (req, res) => {
    try {
        const layoutPath = path.join(__dirname, '../data/soloSelect/print/layout.json');
        
        try {
            const layoutData = await fs.readFile(layoutPath, 'utf8');
            res.json(JSON.parse(layoutData));
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({ message: 'Layout nicht gefunden' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error loading layout:', error);
        res.status(500).json({ message: 'Fehler beim Laden des Layouts' });
    }
});

router.post('/save/print/layout', async (req, res) => {
    try {
        const layoutPath = path.join(__dirname, '../data/soloSelect/print/layout.json');
        const layoutDir = path.dirname(layoutPath);
        
        // Stelle sicher, dass der Ordner existiert
        await createDirectoryIfNotExists(layoutDir);
        
        // Speichere das Layout
        await fs.writeFile(layoutPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Layout erfolgreich gespeichert' });
    } catch (error) {
        console.error('Error saving layout:', error);
        res.status(500).json({ message: 'Fehler beim Speichern des Layouts' });
    }
});

module.exports = router;
