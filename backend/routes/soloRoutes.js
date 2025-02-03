const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const defaultConfig = require('../../data/solo/config/config.js');

// Pfade korrigieren - vom Projektroot aus
const BASE_PATH = path.join(__dirname, '../../');
const CURRENT_RESIDENTS_PATH = path.join(BASE_PATH, 'backend/data/solo/person/upToDate');
const OLD_RESIDENTS_PATH = path.join(BASE_PATH, 'backend/data/solo/person/old');
const CONFIG_PATH = path.join(BASE_PATH, 'backend/data/solo/config/formConfig.json');

// Debug-Log für Pfade
console.log('Pfade:', {
    base: BASE_PATH,
    current: CURRENT_RESIDENTS_PATH,
    old: OLD_RESIDENTS_PATH,
    config: CONFIG_PATH
});

// Hilfsfunktion für Namenskonvertierung
function normalizeName(str) {
    return str
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/é/g, 'e')
        .replace(/â/g, 'a');
}

// Verzeichnisse erstellen, falls sie nicht existieren
const ensureDirectories = async () => {
    try {
        await fs.mkdir(CURRENT_RESIDENTS_PATH, { recursive: true });
        await fs.mkdir(OLD_RESIDENTS_PATH, { recursive: true });
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
        console.log('Verzeichnisse erstellt/überprüft:', {
            current: CURRENT_RESIDENTS_PATH,
            old: OLD_RESIDENTS_PATH,
            config: CONFIG_PATH
        });
    } catch (error) {
        console.error('Fehler beim Erstellen der Verzeichnisse:', error);
    }
};

// Verzeichnisse beim Start erstellen
ensureDirectories();

// Bewohner erstellen
router.post('/resident', async (req, res) => {
    try {
        console.log('Empfangene Daten:', req.body); // Debug-Log

        // Prüfe ob firstName und lastName in den Daten vorhanden sind
        const { firstName, lastName } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({ 
                error: 'Vorname und Nachname sind erforderlich',
                receivedData: req.body
            });
        }

        // Stelle sicher, dass die Verzeichnisse existieren
        await ensureDirectories();

        const normalizedName = `${normalizeName(firstName)}_${normalizeName(lastName)}`;
        const filePath = path.join(CURRENT_RESIDENTS_PATH, `${normalizedName}.json`);
        
        // Prüfen ob die Datei bereits existiert
        try {
            await fs.access(filePath);
            return res.status(400).json({ 
                error: 'Bewohner existiert bereits' 
            });
        } catch {
            // Datei existiert nicht, fahre fort
        }
        
        // Erstelle das zu speichernde Objekt
        const residentData = {
            firstName,
            lastName,
            ...req.body
        };

        // Debug-Log vor dem Speichern
        console.log('Speichere in:', filePath);
        console.log('Daten:', residentData);

        // Speichere die Datei
        await fs.writeFile(filePath, JSON.stringify(residentData, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Bewohner erstellt',
            data: residentData,
            path: filePath
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Bewohners:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bewohner auflisten
router.get('/residents', async (req, res) => {
    try {
        console.log('Versuche Bewohner zu laden aus:', CURRENT_RESIDENTS_PATH);
        
        // Prüfe ob das Verzeichnis existiert
        try {
            await fs.access(CURRENT_RESIDENTS_PATH);
        } catch (error) {
            console.error('Verzeichnis existiert nicht:', error);
            await ensureDirectories();
            return res.json([]);
        }

        const files = await fs.readdir(CURRENT_RESIDENTS_PATH);
        console.log('Gefundene Dateien:', files);

        const residents = await Promise.all(
            files.map(async (file) => {
                try {
                    const filePath = path.join(CURRENT_RESIDENTS_PATH, file);
                    console.log('Lese Datei:', filePath);
                    const content = await fs.readFile(filePath, 'utf-8');
                    return JSON.parse(content);
                } catch (error) {
                    console.error('Fehler beim Lesen der Datei:', file, error);
                    return null;
                }
            })
        );

        // Filtere ungültige Einträge heraus
        const validResidents = residents.filter(resident => resident !== null);
        console.log('Anzahl gültiger Bewohner:', validResidents.length);

        res.json(validResidents);
    } catch (error) {
        console.error('Fehler beim Auflisten der Bewohner:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bewohner entlassen (in old-Ordner verschieben)
router.post('/resident/dismiss/:name', async (req, res) => {
    try {
        await ensureDirectories(); // Stelle sicher, dass die Verzeichnisse existieren
        
        const fileName = `${req.params.name}.json`;
        const currentPath = path.join(CURRENT_RESIDENTS_PATH, fileName);
        const newPath = path.join(OLD_RESIDENTS_PATH, fileName);
        
        // Prüfe ob die Quelldatei existiert
        try {
            await fs.access(currentPath);
        } catch {
            return res.status(404).json({ error: 'Bewohner nicht gefunden' });
        }
        
        // Stelle sicher, dass das Zielverzeichnis existiert
        await fs.mkdir(OLD_RESIDENTS_PATH, { recursive: true });
        
        // Verschiebe die Datei
        await fs.rename(currentPath, newPath);
        res.json({ success: true, message: 'Bewohner entlassen' });
    } catch (error) {
        console.error('Fehler beim Entlassen:', error);
        res.status(500).json({ error: error.message });
    }
});

// Entlassene Bewohner auflisten
router.get('/residents/dismissed', async (req, res) => {
    try {
        const files = await fs.readdir(OLD_RESIDENTS_PATH);
        const residents = await Promise.all(
            files.map(async (file) => {
                const content = await fs.readFile(
                    path.join(OLD_RESIDENTS_PATH, file),
                    'utf-8'
                );
                return JSON.parse(content);
            })
        );
        res.json(residents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bewohner wiederherstellen
router.post('/resident/resurrect/:name', async (req, res) => {
    try {
        const fileName = `${req.params.name}.json`;
        const oldPath = path.join(OLD_RESIDENTS_PATH, fileName);
        const newPath = path.join(CURRENT_RESIDENTS_PATH, fileName);
        
        await fs.rename(oldPath, newPath);
        res.json({ success: true, message: 'Bewohner wiederhergestellt' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Config laden
router.get('/config', async (req, res) => {
    try {
        const config = await fs.readFile(CONFIG_PATH, 'utf-8');
        res.json(JSON.parse(config));
    } catch (error) {
        // Falls keine Konfiguration existiert, sende Standardkonfiguration
        res.json(defaultConfig);
    }
});

// Config speichern
router.post('/config', async (req, res) => {
    try {
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Konfiguration gespeichert' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bewohner aktualisieren
router.put('/resident/:name', async (req, res) => {
    try {
        const fileName = `${req.params.name}.json`;
        const filePath = path.join(CURRENT_RESIDENTS_PATH, fileName);
        
        // Suche nach allen möglichen Dateien für diesen Bewohner
        const files = await fs.readdir(CURRENT_RESIDENTS_PATH);
        const possibleFiles = files.filter(file => {
            const baseName = file.toLowerCase().replace(/\s+/g, '').replace('.json', '');
            const requestName = fileName.toLowerCase().replace(/\s+/g, '').replace('.json', '');
            return baseName === requestName;
        });

        // Lösche alle alten Dateien
        for (const file of possibleFiles) {
            const oldPath = path.join(CURRENT_RESIDENTS_PATH, file);
            await fs.unlink(oldPath);
        }

        // Aktualisiere die Daten
        const residentData = {
            ...req.body,
            lastModified: new Date().toISOString()
        };

        // Speichere die aktualisierten Daten
        await fs.writeFile(filePath, JSON.stringify(residentData, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Bewohner aktualisiert',
            data: residentData
        });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Bewohners:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
