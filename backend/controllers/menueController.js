const fs = require('fs').promises;
const path = require('path');

exports.getWeeklyPlan = async (req, res) => {
    try {
        const { year, week } = req.params;
        
        // Validierung der Parameter
        if (!year || !week) {
            return res.status(400).json({ 
                error: 'Fehlende Parameter',
                message: 'Jahr und Kalenderwoche müssen angegeben werden'
            });
        }

        const weekNumber = week.replace('KW', '');
        const planPath = path.join(__dirname, `../data/plan/${year}/KW${weekNumber}.json`);
        const einrichtungenPath = path.join(__dirname, '../data/einrichtungen');
        
        // Prüfe ob die Datei existiert
        try {
            await fs.access(planPath);
        } catch (error) {
            return res.status(404).json({ 
                error: 'Plan nicht gefunden',
                message: `Kein Menüplan für KW${weekNumber}/${year} verfügbar`
            });
        }

        // Lade Wochenplan
        const planData = JSON.parse(await fs.readFile(planPath, 'utf8'));
        
        // Lade Einrichtungsinformationen
        const einrichtungen = {};
        const einrichtungsFiles = await fs.readdir(einrichtungenPath);
        for (const file of einrichtungsFiles) {
            if (file.endsWith('.json')) {
                const einrichtungData = JSON.parse(
                    await fs.readFile(path.join(einrichtungenPath, file), 'utf8')
                );
                einrichtungen[einrichtungData.kuerzel] = {
                    kuerzel: einrichtungData.kuerzel,
                    name: einrichtungData.name,
                    personengruppe: einrichtungData.personengruppe,
                    speiseangebot: einrichtungData.speiseangebot
                };
            }
        }

        // Formatiere die Daten für das Frontend
        const formattedData = {
            success: true,
            menuePlane: [{
                woche: `KW${weekNumber}`,
                jahr: year,
                // Wichtig: Liste aller verfügbaren Einrichtungen
                einrichtungen: Object.values(einrichtungen),
                tage: planData.days.map(day => ({
                    tag: day.day,
                    menu: {
                        suppe: day.suppe || [],
                        hauptspeise: {
                            menu1: day.menue1 || [],
                            menu2: day.menue2 || []
                        },
                        dessert: day.dessert || []
                    },
                    einrichtungen: {
                        menu1: (day['Einrichtungen-Menü1'] || [])
                            .filter(kuerzel => einrichtungen[kuerzel])
                            .map(kuerzel => einrichtungen[kuerzel]),
                        menu2: (day['Einrichtungen-Menü2'] || [])
                            .filter(kuerzel => einrichtungen[kuerzel])
                            .map(kuerzel => einrichtungen[kuerzel])
                    }
                }))
            }]
        };

        res.json(formattedData);

    } catch (error) {
        console.error('Fehler beim Laden des Menüplans:', error);
        res.status(500).json({ 
            error: 'Interner Serverfehler',
            message: error.message
        });
    }
};

exports.getEinrichtungen = async (req, res) => {
    try {
        const einrichtungenPath = path.join(__dirname, '../data/einrichtungen');
        
        // Prüfe ob das Verzeichnis existiert
        try {
            await fs.access(einrichtungenPath);
        } catch (error) {
            return res.status(404).json({ 
                error: 'Verzeichnis nicht gefunden',
                message: 'Einrichtungsverzeichnis existiert nicht'
            });
        }

        const files = await fs.readdir(einrichtungenPath);
        if (files.length === 0) {
            return res.status(404).json({ 
                error: 'Keine Daten',
                message: 'Keine Einrichtungen gefunden'
            });
        }

        const einrichtungen = [];

        for (const file of files) {
            const data = JSON.parse(
                await fs.readFile(path.join(einrichtungenPath, file), 'utf8')
            );
            einrichtungen.push(data);
        }

        res.json(einrichtungen);
    } catch (error) {
        console.error('Fehler beim Lesen der Einrichtungen:', error);
        res.status(500).json({ 
            error: 'Interner Serverfehler',
            message: error.message
        });
    }
};

exports.getAvailableWeeks = async (req, res) => {
    try {
        const basePath = path.join(__dirname, '../data/plan');
        
        try {
            await fs.access(basePath);
        } catch (error) {
            return res.json({});
        }

        const years = await fs.readdir(basePath);
        const availableWeeks = {};

        for (const year of years) {
            const yearPath = path.join(basePath, year);
            const stat = await fs.stat(yearPath);
            
            if (stat.isDirectory()) {
                const files = await fs.readdir(yearPath);
                availableWeeks[year] = files
                    .filter(file => file.startsWith('KW') && file.endsWith('.json'))
                    .map(file => parseInt(file.replace('KW', '').replace('.json', '')))
                    .filter(week => !isNaN(week));
            }
        }

        res.json(availableWeeks);
    } catch (error) {
        console.error('Fehler beim Lesen der verfügbaren Wochen:', error);
        res.status(500).json({ 
            error: 'Interner Serverfehler',
            message: error.message 
        });
    }
};
