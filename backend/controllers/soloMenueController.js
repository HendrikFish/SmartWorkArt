/**
 * Controller für die SoloMenü-Anwendung
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Hilfsfunktionen
const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.access);
const mkdirAsync = promisify(fs.mkdir);

// Pfade zu den Daten
const DATA_DIR = path.join(__dirname, '../data');
const CONFIG_PATH = path.join(__dirname, '../data/solo/config/formConfig.json');
const PERSON_PATH = path.join(__dirname, '../data/solo/person');
const UPTODATE_PERSON_PATH = path.join(__dirname, '../data/solo/person/upToDate');
const EXTRA_MENUE_PATH = path.join(__dirname, '../data/soloMenue/extraMenue.json');
const EXTRA_WUENSCHE_PATH = path.join(__dirname, '../data/soloMenue/extraWuensche.json');
const EXTRA_KATEGORIE_PATH = path.join(__dirname, '../data/soloMenue/extraKategorie.json');

/**
 * Liest alle JSON-Dateien in einem Verzeichnis
 * @param {string} dir - Verzeichnispfad
 * @returns {Promise<Array>} Array mit Dateiinhalten
 */
async function readJsonFilesFromDirectory(dir) {
    try {
        const files = await readdirAsync(dir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const fileContents = await Promise.all(
            jsonFiles.map(async (file) => {
                const filePath = path.join(dir, file);
                const stats = await statAsync(filePath);
                
                if (stats.isFile()) {
                    const content = await readFileAsync(filePath, 'utf8');
                    return JSON.parse(content);
                }
                return null;
            })
        );
        
        return fileContents.filter(content => content !== null);
    } catch (error) {
        console.error('Fehler beim Lesen der Dateien:', error);
        return [];
    }
}

// Controller-Methoden
const soloMenueController = {
    /**
     * Abrufen der Filterkonfiguration
     */
    getFilterConfig: async (req, res) => {
        try {
            const configData = await readFileAsync(CONFIG_PATH, 'utf8');
            const config = JSON.parse(configData);
            
            // Alle Bereiche zurückgeben, damit Frontend auch nach menuRelevant filtern kann
            res.json(config.areas);
        } catch (error) {
            console.error('Fehler beim Abrufen der Filterkonfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Filterkonfiguration' });
        }
    },
    
    /**
     * Abrufen aller Bewohner
     */
    getAllBewohner: async (req, res) => {
        try {
            // Zuerst aus upToDate-Verzeichnis lesen, falls vorhanden
            let bewohner = [];
            
            try {
                bewohner = await readJsonFilesFromDirectory(UPTODATE_PERSON_PATH);
            } catch (error) {
                console.error('Fehler beim Lesen aus upToDate-Verzeichnis:', error);
                // Wenn upToDate nicht existiert, aus dem Hauptverzeichnis lesen
                bewohner = await readJsonFilesFromDirectory(PERSON_PATH);
            }
            
            res.json(bewohner);
        } catch (error) {
            console.error('Fehler beim Abrufen aller Bewohner:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen aller Bewohner' });
        }
    },
    
    /**
     * Abrufen eines einzelnen Bewohners nach ID
     */
    getBewohnerById: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({ error: 'Keine Bewohner-ID angegeben' });
            }
            
            // Erst im upToDate-Verzeichnis suchen
            let bewohnerDatei = path.join(UPTODATE_PERSON_PATH, `${id}.json`);
            
            try {
                await statAsync(bewohnerDatei);
            } catch (error) {
                // Wenn nicht in upToDate gefunden, im Hauptverzeichnis suchen
                bewohnerDatei = path.join(PERSON_PATH, `${id}.json`);
            }
            
            const bewohnerData = await readFileAsync(bewohnerDatei, 'utf8');
            const bewohner = JSON.parse(bewohnerData);
            
            res.json(bewohner);
        } catch (error) {
            console.error('Fehler beim Abrufen des Bewohners:', error);
            res.status(404).json({ error: 'Bewohner nicht gefunden' });
        }
    },
    
    /**
     * Abrufen der Bewohner nach Kategorie
     */
    getBewohnerByKategorie: async (req, res) => {
        try {
            const { kategorie } = req.params;
            
            if (!kategorie) {
                return res.status(400).json({ error: 'Keine Kategorie angegeben' });
            }
            
            // Alle Bewohner laden
            const bewohner = await readJsonFilesFromDirectory(UPTODATE_PERSON_PATH);
            
            // Nach Kategorie filtern
            const gefilterteBewohner = bewohner.filter(b => 
                b.areas && b.areas['Wo wird das Essen eingetragen!'] === kategorie
            );
            
            res.json(gefilterteBewohner);
        } catch (error) {
            console.error('Fehler beim Abrufen der Bewohner nach Kategorie:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Bewohner nach Kategorie' });
        }
    },
    
    /**
     * Abrufen der Extra-Menüs
     */
    getExtraMenus: async (req, res) => {
        try {
            const extraMenuData = await readFileAsync(EXTRA_MENUE_PATH, 'utf8');
            const extraMenus = JSON.parse(extraMenuData);
            
            res.json(extraMenus);
        } catch (error) {
            console.error('Fehler beim Abrufen der Extra-Menüs:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Extra-Menüs' });
        }
    },
    
    /**
     * Speichert ein neues Extra-Menü
     */
    saveExtraMenu: async (req, res) => {
        try {
            // Daten aus dem Request-Body holen
            const { name, description, kategorieNamen } = req.body;
            
            if (!name || !description || !kategorieNamen) {
                return res.status(400).json({ error: 'Name, Beschreibung und Kategorie sind erforderlich' });
            }
            
            // Aktuelle Extra-Menüs laden
            const extraMenuData = await readFileAsync(EXTRA_MENUE_PATH, 'utf8');
            const extraMenus = JSON.parse(extraMenuData);
            
            // Neue ID generieren
            const id = `extra${Date.now()}`;
            
            // Neues Extra-Menü hinzufügen
            extraMenus.extramenues.push({
                'kategorie-name': kategorieNamen,
                id,
                name,
                description
            });
            
            // Zurück in die Datei schreiben
            await writeFileAsync(EXTRA_MENUE_PATH, JSON.stringify(extraMenus, null, 2), 'utf8');
            
            res.json({ success: true, id });
        } catch (error) {
            console.error('Fehler beim Speichern des Extra-Menüs:', error);
            res.status(500).json({ error: 'Fehler beim Speichern des Extra-Menüs' });
        }
    },
    
    /**
     * Aktualisiert ein bestehendes Extra-Menü
     */
    updateExtraMenu: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, kategorieNamen } = req.body;
            
            if (!name || !description || !kategorieNamen) {
                return res.status(400).json({ error: 'Name, Beschreibung und Kategorie sind erforderlich' });
            }
            
            // Aktuelle Extra-Menüs laden
            const extraMenuData = await readFileAsync(EXTRA_MENUE_PATH, 'utf8');
            const extraMenus = JSON.parse(extraMenuData);
            
            // Extra-Menü mit der angegebenen ID finden
            const index = extraMenus.extramenues.findIndex(menu => menu.id === id);
            
            if (index === -1) {
                return res.status(404).json({ error: 'Extra-Menü nicht gefunden' });
            }
            
            // Extra-Menü aktualisieren
            extraMenus.extramenues[index] = {
                'kategorie-name': kategorieNamen,
                id,
                name,
                description
            };
            
            // Zurück in die Datei schreiben
            await writeFileAsync(EXTRA_MENUE_PATH, JSON.stringify(extraMenus, null, 2), 'utf8');
            
            res.json({ success: true });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Extra-Menüs:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Extra-Menüs' });
        }
    },
    
    /**
     * Löscht ein Extra-Menü
     */
    deleteExtraMenu: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Aktuelle Extra-Menüs laden
            const extraMenuData = await readFileAsync(EXTRA_MENUE_PATH, 'utf8');
            const extraMenus = JSON.parse(extraMenuData);
            
            // Extra-Menü mit der angegebenen ID finden und entfernen
            const initialLength = extraMenus.extramenues.length;
            extraMenus.extramenues = extraMenus.extramenues.filter(menu => menu.id !== id);
            
            if (extraMenus.extramenues.length === initialLength) {
                return res.status(404).json({ error: 'Extra-Menü nicht gefunden' });
            }
            
            // Zurück in die Datei schreiben
            await writeFileAsync(EXTRA_MENUE_PATH, JSON.stringify(extraMenus, null, 2), 'utf8');
            
            res.json({ success: true });
        } catch (error) {
            console.error('Fehler beim Löschen des Extra-Menüs:', error);
            res.status(500).json({ error: 'Fehler beim Löschen des Extra-Menüs' });
        }
    },
    
    /**
     * Abrufen der Extra-Wünsche
     */
    getExtraWuensche: async (req, res) => {
        try {
            const extraWuenscheData = await readFileAsync(EXTRA_WUENSCHE_PATH, 'utf8');
            const extraWuensche = JSON.parse(extraWuenscheData);
            
            res.json(extraWuensche);
        } catch (error) {
            console.error('Fehler beim Abrufen der Extra-Wünsche:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Extra-Wünsche' });
        }
    },
    
    /**
     * Erstellen eines neuen Extra-Wunsches
     */
    createExtraWunsch: async (req, res) => {
        try {
            // Daten aus der Anfrage extrahieren
            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Name ist erforderlich' });
            }
            
            // Vorhandene Wünsche laden
            const extraWuenscheData = await readFileAsync(EXTRA_WUENSCHE_PATH, 'utf8');
            const extraWuensche = JSON.parse(extraWuenscheData);
            
            // Neue ID generieren (Unix-Timestamp)
            const newId = Date.now().toString();
            
            // Neuen Wunsch erstellen
            const neuerWunsch = {
                id: newId,
                name,
                description: description || ''
            };
            
            // Wunsch hinzufügen
            extraWuensche.extrawuensche.push(neuerWunsch);
            
            // Zurück in die Datei schreiben
            await writeFileAsync(EXTRA_WUENSCHE_PATH, JSON.stringify(extraWuensche, null, 2), 'utf8');
            
            res.status(201).json({ success: true, wunsch: neuerWunsch });
        } catch (error) {
            console.error('Fehler beim Erstellen des Extra-Wunsches:', error);
            res.status(500).json({ error: 'Fehler beim Erstellen des Extra-Wunsches' });
        }
    },
    
    /**
     * Aktualisieren eines bestehenden Extra-Wunsches
     */
    updateExtraWunsch: async (req, res) => {
        try {
            // ID aus den Parametern extrahieren
            const { id } = req.params;
            
            // Daten aus der Anfrage extrahieren
            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Name ist erforderlich' });
            }
            
            // Vorhandene Wünsche laden
            const extraWuenscheData = await readFileAsync(EXTRA_WUENSCHE_PATH, 'utf8');
            const extraWuensche = JSON.parse(extraWuenscheData);
            
            // Wunsch finden
            const wunschIndex = extraWuensche.extrawuensche.findIndex(wunsch => wunsch.id === id);
            
            if (wunschIndex === -1) {
                return res.status(404).json({ error: 'Extra-Wunsch nicht gefunden' });
            }
            
            // Wunsch aktualisieren
            extraWuensche.extrawuensche[wunschIndex] = {
                ...extraWuensche.extrawuensche[wunschIndex],
                name,
                description: description || ''
            };
            
            // Zurück in die Datei schreiben
            await writeFileAsync(EXTRA_WUENSCHE_PATH, JSON.stringify(extraWuensche, null, 2), 'utf8');
            
            res.json({ success: true, wunsch: extraWuensche.extrawuensche[wunschIndex] });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Extra-Wunsches:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Extra-Wunsches' });
        }
    },
    
    /**
     * Löschen eines Extra-Wunsches
     */
    deleteExtraWunsch: async (req, res) => {
        try {
            // ID aus den Parametern extrahieren
            const { id } = req.params;
            
            // Vorhandene Wünsche laden
            const extraWuenscheData = await readFileAsync(EXTRA_WUENSCHE_PATH, 'utf8');
            const extraWuensche = JSON.parse(extraWuenscheData);
            
            // Wunsch finden
            const wunschIndex = extraWuensche.extrawuensche.findIndex(wunsch => wunsch.id === id);
            
            if (wunschIndex === -1) {
                return res.status(404).json({ error: 'Extra-Wunsch nicht gefunden' });
            }
            
            // Wunsch entfernen
            extraWuensche.extrawuensche.splice(wunschIndex, 1);
            
            // Zurück in die Datei schreiben
            await writeFileAsync(EXTRA_WUENSCHE_PATH, JSON.stringify(extraWuensche, null, 2), 'utf8');
            
            res.json({ success: true });
        } catch (error) {
            console.error('Fehler beim Löschen des Extra-Wunsches:', error);
            res.status(500).json({ error: 'Fehler beim Löschen des Extra-Wunsches' });
        }
    },
    
    /**
     * Abrufen eines Menüplans nach Jahr und KW
     */
    getMenueplan: async (req, res) => {
        try {
            const { jahr, kw } = req.params;
            
            if (!jahr || !kw) {
                return res.status(400).json({ error: 'Jahr und KW müssen angegeben werden' });
            }
            
            let filename = kw;
            // Prüfen, ob es eine KW-Datei mit diesem Namen gibt
            let menuplanPath = path.join(__dirname, `../data/plan/${jahr}/${filename}.json`);
            
            try {
                await statAsync(menuplanPath);
            } catch (error) {
                return res.status(404).json({ error: `Menüplan für ${kw}/${jahr} nicht gefunden` });
            }
            
            const menuplanData = await readFileAsync(menuplanPath, 'utf8');
            const menueplan = JSON.parse(menuplanData);
            
            res.json(menueplan);
        } catch (error) {
            console.error('Fehler beim Abrufen des Menüplans:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen des Menüplans' });
        }
    },
    
    /**
     * Abrufen aller verfügbaren Menüplan-KWs für ein Jahr
     */
    getMenueplanKWs: async (req, res) => {
        try {
            const { jahr } = req.params;
            
            if (!jahr) {
                return res.status(400).json({ error: 'Jahr muss angegeben werden' });
            }
            
            const jahrVerzeichnis = path.join(__dirname, `../data/plan/${jahr}`);
            
            try {
                await statAsync(jahrVerzeichnis);
            } catch (error) {
                return res.status(404).json({ error: `Keine Menüpläne für das Jahr ${jahr} gefunden` });
            }
            
            const dateien = await readdirAsync(jahrVerzeichnis);
            const kwDateien = dateien.filter(datei => 
                datei.startsWith('KW') && datei.endsWith('.json')
            );
            
            // Extrahiere KW-Nummern aus den Dateinamen
            const kws = kwDateien.map(datei => {
                const match = datei.match(/KW(\d+)(_override)?\.json/);
                return match ? {
                    kw: match[1],
                    isOverride: !!match[2]
                } : null;
            }).filter(Boolean);
            
            res.json(kws);
        } catch (error) {
            console.error('Fehler beim Abrufen der Menüplan-KWs:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Menüplan-KWs' });
        }
    },
    
    /**
     * Abrufen aller verfügbaren Jahre mit Menüplänen
     */
    getMenueplanJahre: async (req, res) => {
        try {
            const planVerzeichnis = path.join(__dirname, '../data/plan');
            
            try {
                await statAsync(planVerzeichnis);
            } catch (error) {
                return res.status(404).json({ error: 'Menüplan-Verzeichnis nicht gefunden' });
            }
            
            const dateien = await readdirAsync(planVerzeichnis);
            const jahre = dateien.filter(async (datei) => {
                const stats = await statAsync(path.join(planVerzeichnis, datei));
                return stats.isDirectory() && /^\d{4}$/.test(datei);
            });
            
            res.json(jahre);
        } catch (error) {
            console.error('Fehler beim Abrufen der Menüplan-Jahre:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Menüplan-Jahre' });
        }
    },
    
    /**
     * Abrufen aller Extra-Kategorien
     */
    getExtraKategorien: async (req, res) => {
        try {
            let extraKategorien = [];
            
            // Prüfen, ob die Datei existiert
            try {
                const fileExists = await new Promise((resolve) => {
                    fs.access(EXTRA_KATEGORIE_PATH, fs.constants.F_OK, (err) => {
                        resolve(!err);
                    });
                });
                
                if (fileExists) {
                    // Datei existiert, also einlesen
                    const extraKategorieData = await readFileAsync(EXTRA_KATEGORIE_PATH, 'utf8');
                    
                    try {
                        const parsed = JSON.parse(extraKategorieData);
                        // Sicherstellen, dass es sich um ein Array handelt
                        extraKategorien = Array.isArray(parsed) ? parsed : [];
                    } catch (parseError) {
                        console.error('JSON Parse Fehler:', parseError);
                        // Bei Parsing-Fehler ein leeres Array zurückgeben
                        extraKategorien = [];
                        
                        // Neue leere Datei erstellen
                        await writeFileAsync(EXTRA_KATEGORIE_PATH, JSON.stringify([]), 'utf8');
                    }
                } else {
                    // Wenn die Datei nicht existiert, leeres Array zurückgeben und Datei erstellen
                    await writeFileAsync(EXTRA_KATEGORIE_PATH, JSON.stringify([]), 'utf8');
                }
            } catch (error) {
                console.error('Fehler beim Zugriff auf extraKategorie.json:', error);
                // Bei Fehler ein leeres Array zurückgeben
                extraKategorien = [];
                
                // Verzeichnis prüfen und ggf. erstellen
                const dir = path.dirname(EXTRA_KATEGORIE_PATH);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                // Neue leere Datei erstellen
                await writeFileAsync(EXTRA_KATEGORIE_PATH, JSON.stringify([]), 'utf8');
            }
            
            res.json(extraKategorien);
        } catch (error) {
            console.error('Fehler beim Abrufen der Extra-Kategorien:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Extra-Kategorien' });
        }
    },
    
    /**
     * Speichern einer Extra-Kategorie
     */
    saveExtraKategorie: async (req, res) => {
        try {
            const neueKategorie = req.body;
            
            console.log('Versuche Kategorie zu speichern:', JSON.stringify(neueKategorie));
            
            if (!neueKategorie || !neueKategorie.displayKategorie || !neueKategorie.text) {
                console.warn('Ungültige Kategorie-Daten:', JSON.stringify(neueKategorie));
                return res.status(400).json({ error: 'Ungültige Kategorie-Daten' });
            }
            
            // Bestehende Kategorien laden
            let extraKategorien = [];
            try {
                // Prüfen, ob die Datei existiert
                const fileExists = await new Promise((resolve) => {
                    fs.access(EXTRA_KATEGORIE_PATH, fs.constants.F_OK, (err) => {
                        resolve(!err);
                    });
                });
                
                if (fileExists) {
                    const extraKategorieData = await readFileAsync(EXTRA_KATEGORIE_PATH, 'utf8');
                    try {
                        const parsed = JSON.parse(extraKategorieData);
                        extraKategorien = Array.isArray(parsed) ? parsed : [];
                    } catch (parseError) {
                        console.error('JSON Parse Fehler:', parseError);
                        extraKategorien = [];
                        // Beschädigte Datei überschreiben
                        await writeFileAsync(EXTRA_KATEGORIE_PATH, JSON.stringify([]), 'utf8');
                    }
                } else {
                    // Wenn die Datei nicht existiert, versuchen Sie, sie zu erstellen
                    const dir = path.dirname(EXTRA_KATEGORIE_PATH);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    await writeFileAsync(EXTRA_KATEGORIE_PATH, JSON.stringify([]), 'utf8');
                }
            } catch (error) {
                console.error('Fehler beim Laden der bestehenden Kategorien:', error);
                // Bei Fehler einfach mit einem leeren Array fortfahren
                extraKategorien = [];
            }
            
            // Prüfen, ob es sich um eine Aktualisierung handelt
            const index = extraKategorien.findIndex(k => k.id === neueKategorie.id);
            
            if (index !== -1) {
                // Bestehende Kategorie aktualisieren
                extraKategorien[index] = neueKategorie;
                console.log(`Kategorie mit ID ${neueKategorie.id} aktualisiert`);
            } else {
                // Neue Kategorie hinzufügen
                extraKategorien.push(neueKategorie);
                console.log(`Neue Kategorie mit ID ${neueKategorie.id} hinzugefügt`);
            }
            
            // Daten speichern
            try {
                await writeFileAsync(EXTRA_KATEGORIE_PATH, JSON.stringify(extraKategorien, null, 2), 'utf8');
                console.log(`Kategorien erfolgreich in ${EXTRA_KATEGORIE_PATH} gespeichert`);
                res.json(neueKategorie);
            } catch (writeError) {
                console.error('Fehler beim Schreiben der Kategorie-Datei:', writeError);
                res.status(500).json({ error: 'Fehler beim Speichern der Kategorien-Datei' });
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Extra-Kategorie:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Extra-Kategorie' });
        }
    },
    
    /**
     * Löschen einer Extra-Kategorie
     */
    deleteExtraKategorie: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({ error: 'Keine Kategorie-ID angegeben' });
            }
            
            // Bestehende Kategorien laden
            let extraKategorien = [];
            try {
                await statAsync(EXTRA_KATEGORIE_PATH);
                const extraKategorieData = await readFileAsync(EXTRA_KATEGORIE_PATH, 'utf8');
                extraKategorien = JSON.parse(extraKategorieData);
            } catch (error) {
                return res.status(404).json({ error: 'Keine Extra-Kategorien gefunden' });
            }
            
            // Kategorie finden und entfernen
            const initialLength = extraKategorien.length;
            extraKategorien = extraKategorien.filter(k => k.id !== id);
            
            if (extraKategorien.length === initialLength) {
                return res.status(404).json({ error: 'Kategorie nicht gefunden' });
            }
            
            // Aktualisierte Daten speichern
            await writeFileAsync(EXTRA_KATEGORIE_PATH, JSON.stringify(extraKategorien, null, 2), 'utf8');
            
            res.json({ success: true, message: 'Kategorie erfolgreich gelöscht' });
        } catch (error) {
            console.error('Fehler beim Löschen der Extra-Kategorie:', error);
            res.status(500).json({ error: 'Fehler beim Löschen der Extra-Kategorie' });
        }
    },
    
    /**
     * Lädt die Essensauswahl eines Bewohners für eine bestimmte Kalenderwoche
     * @param {Object} req - Request-Objekt
     * @param {Object} res - Response-Objekt
     */
    getBewohnerAuswahl: async (req, res) => {
        try {
            const { jahr, kw, bewohnerName } = req.params;
            
            console.log(`[BACKEND] Lade Bewohnerauswahl für: ${bewohnerName} (KW${kw}/${jahr})`);
            
            // Pfad zur JSON-Datei erstellen
            const bewohnerAuswahlPath = path.join(
                DATA_DIR,
                'soloMenue',
                jahr,
                `KW${kw}`,
                `${bewohnerName}.json`
            );
            
            console.log(`[BACKEND] Vollständiger Dateipfad: ${bewohnerAuswahlPath}`);
            
            // Prüfen, ob die Datei existiert
            try {
                try {
                    await fs.promises.access(bewohnerAuswahlPath, fs.constants.F_OK);
                    console.log(`[BACKEND] Bewohnerauswahl-Datei gefunden: ${bewohnerAuswahlPath}`);
                } catch (accessErr) {
                    // Datei existiert nicht
                    console.log(`[BACKEND] Bewohnerauswahl-Datei existiert nicht: ${bewohnerAuswahlPath}`);
                    return res.status(404).json({ 
                        error: 'Datei nicht gefunden',
                        message: `Es gibt noch keine gespeicherte Auswahl für ${bewohnerName} in KW${kw}/${jahr}.`,
                        path: bewohnerAuswahlPath
                    });
                }
                
                // Datei einlesen
                try {
                    const bewohnerAuswahlData = await fs.promises.readFile(bewohnerAuswahlPath, 'utf8');
                    let bewohnerAuswahl;
                    
                    try {
                        bewohnerAuswahl = JSON.parse(bewohnerAuswahlData);
                        console.log(`[BACKEND] Bewohnerauswahl erfolgreich geladen für: ${bewohnerName}`);
                        return res.json(bewohnerAuswahl);
                    } catch (parseErr) {
                        console.error(`[BACKEND] Fehler beim Parsen der JSON-Datei: ${parseErr.message}`);
                        return res.status(500).json({ 
                            error: 'Ungültiges JSON-Format',
                            message: `Die Auswahldatei für ${bewohnerName} in KW${kw}/${jahr} enthält ungültiges JSON: ${parseErr.message}`,
                            path: bewohnerAuswahlPath
                        });
                    }
                } catch (readErr) {
                    console.error(`[BACKEND] Fehler beim Lesen der Datei: ${readErr.message}`);
                    return res.status(500).json({ 
                        error: 'Lesefehler',
                        message: `Die Bewohnerauswahl konnte nicht gelesen werden: ${readErr.message}`,
                        path: bewohnerAuswahlPath
                    });
                }
            } catch (fsError) {
                console.error('[BACKEND] Allgemeiner Fehler beim Dateisystem-Zugriff:', fsError);
                res.status(500).json({ 
                    error: 'Serverfehler',
                    message: `Fehler beim Dateisystem-Zugriff: ${fsError.message}`,
                    path: bewohnerAuswahlPath
                });
            }
        } catch (error) {
            console.error('[BACKEND] Allgemeiner Fehler beim Laden der Bewohnerauswahl:', error);
            res.status(500).json({ 
                error: 'Serverfehler',
                message: `Ein unerwarteter Fehler ist aufgetreten: ${error.message}`
            });
        }
    },
    
    /**
     * Speichert die Essensauswahl eines Bewohners für eine bestimmte Kalenderwoche
     * @param {Object} req - Request-Objekt
     * @param {Object} res - Response-Objekt
     */
    speichereBewohnerAuswahl: async (req, res) => {
        try {
            const { jahr, kw, bewohnerName } = req.params;
            const bewohnerAuswahl = req.body;
            
            console.log(`[BACKEND] Speichere Bewohnerauswahl für: ${bewohnerName} (KW${kw}/${jahr})`);
            
            // Pfade für die Ordnerstruktur
            const dataDirPath = DATA_DIR;
            const soloMenueDirPath = path.join(DATA_DIR, 'soloMenue');
            const jahresOrdnerPath = path.join(soloMenueDirPath, jahr);
            const kwOrdnerPath = path.join(jahresOrdnerPath, `KW${kw}`);
            const bewohnerAuswahlPath = path.join(kwOrdnerPath, `${bewohnerName}.json`);
            
            console.log(`[BACKEND] Speicherpfad: ${bewohnerAuswahlPath}`);
            
            // Prüfen und erstellen der notwendigen Ordnerstruktur
            try {
                // Jahres- und KW-Ordner mit recursive:true erstellen (erstellt alle notwendigen Ordner auf einmal)
                try {
                    await fs.promises.mkdir(kwOrdnerPath, { recursive: true });
                    console.log(`[BACKEND] Verzeichnisstruktur erstellt oder bereits vorhanden: ${kwOrdnerPath}`);
                } catch (mkdirErr) {
                    console.error(`[BACKEND] Fehler beim Erstellen der Verzeichnisstruktur: ${mkdirErr.message}`);
                    return res.status(500).json({
                        error: 'Serverfehler',
                        message: `Fehler beim Erstellen der Verzeichnisstruktur: ${mkdirErr.message}`,
                        path: kwOrdnerPath
                    });
                }
                
                // Daten schreiben
                try {
                    const jsonStr = JSON.stringify(bewohnerAuswahl, null, 2);
                    await fs.promises.writeFile(
                        bewohnerAuswahlPath,
                        jsonStr,
                        'utf8'
                    );
                    console.log(`[BACKEND] Bewohnerauswahl erfolgreich gespeichert: ${bewohnerAuswahlPath}`);
                    
                    // Prüfen, ob die Datei wirklich erstellt wurde
                    try {
                        await fs.promises.access(bewohnerAuswahlPath, fs.constants.F_OK);
                        console.log(`[BACKEND] Datei erfolgreich verifiziert: ${bewohnerAuswahlPath}`);
                    } catch (verifyErr) {
                        console.warn(`[BACKEND] Datei konnte nicht verifiziert werden: ${verifyErr.message}`);
                    }
                    
                    res.json({
                        success: true,
                        message: `Bewohnerauswahl für ${bewohnerName} in KW${kw}/${jahr} erfolgreich gespeichert.`,
                        path: bewohnerAuswahlPath
                    });
                } catch (writeErr) {
                    console.error(`[BACKEND] Fehler beim Schreiben der Datei: ${writeErr.message}`);
                    return res.status(500).json({
                        error: 'Serverfehler',
                        message: `Fehler beim Schreiben der Datei: ${writeErr.message}`,
                        path: bewohnerAuswahlPath
                    });
                }
            } catch (fsError) {
                console.error('[BACKEND] Allgemeiner Fehler beim Dateisystem-Zugriff:', fsError);
                res.status(500).json({ 
                    error: 'Serverfehler',
                    message: `Fehler beim Dateisystem-Zugriff: ${fsError.message}`,
                    path: bewohnerAuswahlPath
                });
            }
        } catch (error) {
            console.error('[BACKEND] Allgemeiner Fehler beim Speichern der Bewohnerauswahl:', error);
            res.status(500).json({ 
                error: 'Serverfehler',
                message: `Ein unerwarteter Fehler ist aufgetreten: ${error.message}`
            });
        }
    },
    
    /**
     * Löscht die Essensauswahl eines Bewohners für eine bestimmte Kalenderwoche
     * @param {Object} req - Request-Objekt
     * @param {Object} res - Response-Objekt
     */
    deleteBewohnerAuswahl: async (req, res) => {
        try {
            const { jahr, kw, bewohnerName } = req.params;
            
            console.log(`[BACKEND] Lösche Bewohnerauswahl für: ${bewohnerName} (KW${kw}/${jahr})`);
            
            // Pfad zur JSON-Datei erstellen
            const bewohnerAuswahlPath = path.join(
                DATA_DIR,
                'soloMenue',
                jahr,
                `KW${kw}`,
                `${bewohnerName}.json`
            );
            
            console.log(`[BACKEND] Vollständiger Dateipfad: ${bewohnerAuswahlPath}`);
            
            // Prüfen, ob die Datei existiert
            try {
                try {
                    await fs.promises.access(bewohnerAuswahlPath, fs.constants.F_OK);
                    console.log(`[BACKEND] Bewohnerauswahl-Datei gefunden: ${bewohnerAuswahlPath}`);
                } catch (accessErr) {
                    // Datei existiert nicht
                    console.log(`[BACKEND] Bewohnerauswahl-Datei existiert nicht: ${bewohnerAuswahlPath}`);
                    return res.status(404).json({ 
                        error: 'Datei nicht gefunden',
                        message: `Es gibt noch keine gespeicherte Auswahl für ${bewohnerName} in KW${kw}/${jahr}.`,
                        path: bewohnerAuswahlPath
                    });
                }
                
                // Datei löschen
                try {
                    await fs.promises.unlink(bewohnerAuswahlPath);
                    console.log(`[BACKEND] Bewohnerauswahl-Datei erfolgreich gelöscht: ${bewohnerAuswahlPath}`);
                    res.json({
                        success: true,
                        message: `Bewohnerauswahl für ${bewohnerName} in KW${kw}/${jahr} erfolgreich gelöscht.`,
                        path: bewohnerAuswahlPath
                    });
                } catch (deleteErr) {
                    console.error(`[BACKEND] Fehler beim Löschen der Datei: ${deleteErr.message}`);
                    return res.status(500).json({
                        error: 'Serverfehler',
                        message: `Fehler beim Löschen der Datei: ${deleteErr.message}`,
                        path: bewohnerAuswahlPath
                    });
                }
            } catch (fsError) {
                console.error('[BACKEND] Allgemeiner Fehler beim Dateisystem-Zugriff:', fsError);
                res.status(500).json({ 
                    error: 'Serverfehler',
                    message: `Fehler beim Dateisystem-Zugriff: ${fsError.message}`,
                    path: bewohnerAuswahlPath
                });
            }
        } catch (error) {
            console.error('[BACKEND] Allgemeiner Fehler beim Löschen der Bewohnerauswahl:', error);
            res.status(500).json({ 
                error: 'Serverfehler',
                message: `Ein unerwarteter Fehler ist aufgetreten: ${error.message}`
            });
        }
    },
    
    /**
     * Aktualisiert die Bewohnerdaten eines bestehenden Bewohners
     * Sucht automatisch in beiden Verzeichnissen und speichert im upToDate-Verzeichnis
     */
    updateBewohner: async (req, res) => {
        try {
            const { bewohnerName } = req.params;
            const updatedBewohnerData = req.body;
            
            console.log(`[BACKEND] Aktualisiere Bewohnerdaten für: ${bewohnerName}`);
            
            // Pfad zur JSON-Datei im upToDate-Verzeichnis
            const upToDateFilePath = path.join(
                UPTODATE_PERSON_PATH,
                `${bewohnerName}.json`
            );
            
            // Pfad zur JSON-Datei im Hauptverzeichnis
            const mainFilePath = path.join(
                PERSON_PATH,
                `${bewohnerName}.json`
            );
            
            console.log(`[BACKEND] Mögliche Dateipfade:
            - upToDate: ${upToDateFilePath}
            - Hauptverzeichnis: ${mainFilePath}`);
            
            // Neue Strategie: Durchsuchen aller Bewohnerdateien nach Namen
            let bewohnerFileFound = false;
            let existingFilePath = null;
            
            // Stelle sicher, dass das upToDate-Verzeichnis existiert
            try {
                await fs.promises.mkdir(UPTODATE_PERSON_PATH, { recursive: true });
                console.log(`[BACKEND] upToDate-Verzeichnis existiert oder wurde erstellt: ${UPTODATE_PERSON_PATH}`);
            } catch (mkdirErr) {
                console.error(`[BACKEND] Fehler beim Erstellen des upToDate-Verzeichnisses: ${mkdirErr.message}`);
            }
            
            // Suche in upToDate nach Name statt Dateiname
            try {
                const files = await fs.promises.readdir(UPTODATE_PERSON_PATH);
                
                // Extrahiere Namen aus dem Parameter
                let searchFirstName, searchLastName;
                if (bewohnerName.includes('_')) {
                    [searchFirstName, searchLastName] = bewohnerName.split('_').map(part => part.toLowerCase().trim());
                }
                
                console.log(`[BACKEND] Suche nach Bewohner mit Namen: ${searchFirstName} ${searchLastName}`);
                
                // Durchsuche alle Dateien
                for (const file of files) {
                    if (!file.endsWith('.json')) continue;
                    
                    try {
                        const filePath = path.join(UPTODATE_PERSON_PATH, file);
                        const content = await fs.promises.readFile(filePath, 'utf8');
                        const bewohner = JSON.parse(content);
                        
                        // Vergleiche Namen (case-insensitive)
                        const firstName = (bewohner.firstName || '').toLowerCase().trim();
                        const lastName = (bewohner.lastName || '').toLowerCase().trim();
                        
                        if (firstName === searchFirstName && lastName === searchLastName) {
                            console.log(`[BACKEND] Bewohner gefunden in Datei: ${file}`);
                            bewohnerFileFound = true;
                            existingFilePath = filePath;
                            break;
                        }
                        
                        // Falls searchFirstName oder searchLastName nicht definiert sind, alternative Suche
                        if (!searchFirstName || !searchLastName) {
                            const fileNameWithoutExt = file.replace('.json', '').toLowerCase();
                            if (fileNameWithoutExt === bewohnerName.toLowerCase()) {
                                console.log(`[BACKEND] Bewohner gefunden über Dateinamen: ${file}`);
                                bewohnerFileFound = true;
                                existingFilePath = filePath;
                                break;
                            }
                        }
                    } catch (err) {
                        console.error(`[BACKEND] Fehler beim Lesen/Parsen von ${file}:`, err);
                    }
                }
                
                // Wenn in upToDate nicht gefunden, im Hauptverzeichnis suchen
                if (!bewohnerFileFound) {
                    try {
                        const files = await fs.promises.readdir(PERSON_PATH);
                        
                        for (const file of files) {
                            if (!file.endsWith('.json')) continue;
                            
                            try {
                                const filePath = path.join(PERSON_PATH, file);
                                const content = await fs.promises.readFile(filePath, 'utf8');
                                const bewohner = JSON.parse(content);
                                
                                // Vergleiche Namen (case-insensitive)
                                const firstName = (bewohner.firstName || '').toLowerCase().trim();
                                const lastName = (bewohner.lastName || '').toLowerCase().trim();
                                
                                if (firstName === searchFirstName && lastName === searchLastName) {
                                    console.log(`[BACKEND] Bewohner gefunden in Hauptverzeichnis-Datei: ${file}`);
                                    bewohnerFileFound = true;
                                    existingFilePath = filePath;
                                    break;
                                }
                                
                                // Falls searchFirstName oder searchLastName nicht definiert sind, alternative Suche
                                if (!searchFirstName || !searchLastName) {
                                    const fileNameWithoutExt = file.replace('.json', '').toLowerCase();
                                    if (fileNameWithoutExt === bewohnerName.toLowerCase()) {
                                        console.log(`[BACKEND] Bewohner gefunden über Dateinamen im Hauptverzeichnis: ${file}`);
                                        bewohnerFileFound = true;
                                        existingFilePath = filePath;
                                        break;
                                    }
                                }
                            } catch (err) {
                                console.error(`[BACKEND] Fehler beim Lesen/Parsen von ${file} im Hauptverzeichnis:`, err);
                            }
                        }
                    } catch (dirErr) {
                        console.error(`[BACKEND] Fehler beim Lesen des Hauptverzeichnisses:`, dirErr);
                    }
                }
            } catch (dirErr) {
                console.error(`[BACKEND] Fehler beim Lesen des upToDate-Verzeichnisses:`, dirErr);
            }
            
            // Wenn der Bewohner nicht gefunden wurde und wir keinen expliziten Namen haben,
            // dann versuche es mit dem angegebenen Dateinamen
            if (!bewohnerFileFound) {
                try {
                    // Prüfe, ob die Datei mit dem exakten Namen existiert
                    await fs.promises.access(upToDateFilePath, fs.constants.F_OK);
                    bewohnerFileFound = true;
                    existingFilePath = upToDateFilePath;
                    console.log(`[BACKEND] Bewohner-Datei existiert exakt im upToDate-Verzeichnis: ${upToDateFilePath}`);
                } catch (err) {
                    try {
                        await fs.promises.access(mainFilePath, fs.constants.F_OK);
                        bewohnerFileFound = true;
                        existingFilePath = mainFilePath;
                        console.log(`[BACKEND] Bewohner-Datei existiert exakt im Hauptverzeichnis: ${mainFilePath}`);
                    } catch (err) {
                        console.log(`[BACKEND] Bewohner nicht gefunden, weder über Namen noch über Dateinamen.`);
                    }
                }
            }
            
            // Wenn die Datei immer noch nicht gefunden wurde, erstelle eine neue
            const targetFilePath = bewohnerFileFound ? upToDateFilePath : path.join(
                UPTODATE_PERSON_PATH,
                `${bewohnerName}.json`
            );
            
            // Wenn ein Bewohner gefunden wurde, aber in einer anderen Datei, kopiere ihn
            if (bewohnerFileFound && existingFilePath && existingFilePath !== upToDateFilePath) {
                try {
                    // Lösche alte Datei im upToDate, falls vorhanden
                    try {
                        await fs.promises.access(upToDateFilePath, fs.constants.F_OK);
                        await fs.promises.unlink(upToDateFilePath);
                        console.log(`[BACKEND] Alte Bewohner-Datei in upToDate gelöscht: ${upToDateFilePath}`);
                    } catch (err) {
                        // Datei existiert nicht, ignorieren
                    }
                    
                    // Kopiere Datei
                    const content = await fs.promises.readFile(existingFilePath, 'utf8');
                    console.log(`[BACKEND] Inhalt der gefundenen Datei:`, content.substring(0, 100) + '...');
                } catch (err) {
                    console.error(`[BACKEND] Fehler beim Kopieren der Bewohnerdatei:`, err);
                }
            }
            
            // Daten schreiben
            try {
                const jsonStr = JSON.stringify(updatedBewohnerData, null, 2);
                await fs.promises.writeFile(
                    targetFilePath,
                    jsonStr,
                    'utf8'
                );
                console.log(`[BACKEND] Bewohnerdaten erfolgreich gespeichert: ${targetFilePath}`);
                
                // Überprüfen, ob die Datei tatsächlich geschrieben wurde
                try {
                    await fs.promises.access(targetFilePath, fs.constants.F_OK);
                    console.log(`[BACKEND] Datei erfolgreich verifiziert: ${targetFilePath}`);
                } catch (accessErr) {
                    console.warn(`[BACKEND] Datei konnte nicht verifiziert werden: ${accessErr.message}`);
                }
                
                res.json({
                    success: true,
                    message: `Bewohnerdaten für ${bewohnerName} erfolgreich aktualisiert.`,
                    path: targetFilePath
                });
            } catch (writeErr) {
                console.error(`[BACKEND] Fehler beim Speichern der Bewohnerdaten: ${writeErr.message}`);
                return res.status(500).json({
                    error: 'Serverfehler',
                    message: `Fehler beim Speichern der Bewohnerdaten: ${writeErr.message}`,
                    path: targetFilePath
                });
            }
        } catch (error) {
            console.error('[BACKEND] Allgemeiner Fehler bei der Aktualisierung der Bewohnerdaten:', error);
            res.status(500).json({ 
                error: 'Serverfehler',
                message: `Ein unerwarteter Fehler ist aufgetreten: ${error.message}`
            });
        }
    }
};

module.exports = soloMenueController;
