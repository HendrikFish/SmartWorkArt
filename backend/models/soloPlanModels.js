const fs = require('fs').promises;
const path = require('path');

class SoloPlanModel {
    static async getFormConfig() {
        try {
            const configPath = path.join(__dirname, '../data/solo/config/formConfig.json');
            const content = await fs.readFile(configPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Fehler beim Laden der formConfig:', error);
            return null;
        }
    }

    static async getAllResidents() {
        try {
            // Lade zuerst die formConfig
            const formConfig = await this.getFormConfig();
            const areaConfig = formConfig?.areas || [];
            
            const dirPath = path.join(__dirname, '../data/solo/person/upToDate');
            console.log('Suche Bewohner in:', dirPath);
            const files = await fs.readdir(dirPath);
            console.log('Gefundene Bewohner-Dateien:', files);
            
            // Erstelle ein Set für eindeutige Bewohner basierend auf Name
            const uniqueResidents = new Map();
            
            await Promise.all(
                files
                    .filter(file => file.endsWith('.json'))
                    .map(async file => {
                        const filePath = path.join(dirPath, file);
                        try {
                            const content = await fs.readFile(filePath, 'utf-8');
                            const resident = JSON.parse(content);
                            
                            // Verarbeite die Areas und stelle sicher, dass die Werte Strings sind
                            if (resident.areas) {
                                Object.entries(resident.areas).forEach(([key, value]) => {
                                    if (typeof value === 'object' && value !== null) {
                                        // Wenn es ein Objekt ist, versuche den Wert zu extrahieren
                                        resident.areas[key] = value.value || value.label || '';
                                    } else if (Array.isArray(value)) {
                                        // Wenn es ein Array ist, verbinde die Werte
                                        resident.areas[key] = value.join(', ');
                                    } else {
                                        // Stelle sicher, dass der Wert ein String ist
                                        resident.areas[key] = String(value || '');
                                    }
                                });
                            }
                            
                            // Erstelle einen eindeutigen Schlüssel für den Bewohner
                            const key = `${resident.firstName.toLowerCase()}_${resident.lastName.toLowerCase()}`.trim();
                            
                            // Wenn dieser Bewohner noch nicht existiert oder die Datei neuer ist
                            if (!uniqueResidents.has(key) || 
                                (resident.lastModified && 
                                 new Date(resident.lastModified) > new Date(uniqueResidents.get(key).lastModified))) {
                                uniqueResidents.set(key, resident);
                            }
                        } catch (error) {
                            console.error(`Fehler beim Laden von ${file}:`, error);
                            return null;
                        }
                    })
            );

            const validResidents = Array.from(uniqueResidents.values());
            console.log(`${validResidents.length} Bewohner erfolgreich geladen`);
            
            return validResidents;
        } catch (error) {
            console.error('Fehler beim Laden der Bewohner:', error);
            throw new Error('Fehler beim Laden der Bewohnerdaten');
        }
    }

    static async getMenuData(year, week) {
        try {
            console.log('\n=== Menüdaten-Ladevorgang ===');
            
            const filePath = path.join(__dirname, '../data/plan', year.toString(), `KW${week}.json`);
            console.log('Lade Menüdaten aus:', filePath);
            
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const menuData = JSON.parse(content);
                
                if (!menuData.days) {
                    throw new Error('Ungültiges Menüdaten-Format');
                }

                // Konvertiere die Tage in das erwartete Format
                const formattedData = menuData.days.map(day => {
                    return {
                        'Suppe': day.suppe?.[0] || null,
                        'Menü 1': day.menue1?.[0] || null,
                        'Menü 2': day.menue2?.[0] || null,
                        'Dessert': day.dessert?.[0] || null,
                        'Abend-Suppe': day.abendSuppe?.[0] || null,
                        'Milchspeise': day.milchspeise?.[0] || null,
                        'Normalkost': day.normalkost?.[0] || null
                    };
                });

                return {
                    status: 'success',
                    data: formattedData
                };
            } catch (error) {
                console.log('Keine Menüdaten gefunden:', error.message);
                return {
                    status: 'empty',
                    message: `Keine Menüdaten für KW${week}/${year} verfügbar`,
                    data: Array(7).fill({})
                };
            }
        } catch (error) {
            console.error('Fehler beim Laden der Menüdaten:', error);
            throw new Error(`Fehler beim Laden der Menüdaten für KW${week}/${year}`);
        }
    }

    static async getResidentSelections(year, week, resident) {
        try {
            const dirPath = path.join(__dirname, `../data/soloPlan/${year}/KW${week}`);
            const filePath = path.join(dirPath, `${resident}.json`);
            
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(content);
            } catch (error) {
                return {}; // Keine Auswahl vorhanden
            }
        } catch (error) {
            console.error('Fehler beim Laden der Bewohnerauswahl:', error);
            throw error;
        }
    }

    static async saveResidentSelections(year, week, resident, selections) {
        try {
            const dirPath = path.join(__dirname, `../data/soloPlan/${year}/KW${week}`);
            
            // Erstelle Verzeichnisse, falls sie nicht existieren
            await fs.mkdir(dirPath, { recursive: true });
            
            const filePath = path.join(dirPath, `${resident}.json`);
            await fs.writeFile(filePath, JSON.stringify(selections, null, 2));
        } catch (error) {
            console.error('Fehler beim Speichern der Bewohnerauswahl:', error);
            throw error;
        }
    }

    static async checkExistingData(year, week, resident) {
        try {
            const filePath = path.join(__dirname, '..', 'data', 'soloPlan', year, `KW${week}`, `${resident}.json`);
            
            try {
                await fs.access(filePath);
                return { exists: true };
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return { exists: false };
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Fehler beim Prüfen der Daten:', error);
            throw error;
        }
    }

    // Extra-Kategorien laden
    static async getExtraCategories() {
        try {
            const filePath = path.join(__dirname, '..', 'data', 'soloPlan', 'extra', 'extras.json');
            
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(content);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // Erstelle Standardkategorien, wenn die Datei nicht existiert
                    const defaultCategories = {
                        extraCategories: [
                            {
                                id: "kaltePlatte",
                                displayName: "Kalte Platte",
                                type: "abend"
                            },
                            {
                                id: "wurstbrotToast",
                                displayName: "Wurstbrot-Toast",
                                type: "abend"
                            },
                            {
                                id: "wurstbrotSchwarzBrot",
                                displayName: "Wurstbrot-Schw. Brot",
                                type: "abend"
                            },
                            {
                                id: "kaesebrotToast",
                                displayName: "Käsebrot-Toast",
                                type: "abend"
                            },
                            {
                                id: "kaesebrotSchwarzBrot",
                                displayName: "Käsebrot-Schw. Brot",
                                type: "abend"
                            }
                        ]
                    };
                    
                    // Stelle sicher, dass das Verzeichnis existiert
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    
                    // Speichere die Standard-Kategorien
                    await fs.writeFile(filePath, JSON.stringify(defaultCategories, null, 2));
                    
                    return defaultCategories;
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Extra-Kategorien:', error);
            throw error;
        }
    }

    // Extra-Kategorien speichern
    static async saveExtraCategories(categories) {
        try {
            const filePath = path.join(__dirname, '..', 'data', 'soloPlan', 'extra', 'extras.json');
            
            // Stelle sicher, dass das Verzeichnis existiert
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            
            // Speichere die Kategorien
            await fs.writeFile(filePath, JSON.stringify(categories, null, 2));
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Extra-Kategorien:', error);
            throw error;
        }
    }
}

module.exports = SoloPlanModel;
