const fs = require('fs').promises;
const path = require('path');

const REZEPT_KATEGORIEN = [
    'Beilage',
    'Dessert',
    'Dip',
    'Gebäck',
    'Gemüse',
    'Hauptgericht',
    'Salat',
    'Suppe',
    'Soße'
];

// Hilfsfunktion zum Konvertieren des Kategorienamens in den Dateinamen
function getFilename(kategorie) {
    const mapping = {
        'Beilage': 'Beilage.json',
        'Dessert': 'Dessert.json',
        'Dip': 'Dip.json',
        'Gebäck': 'Gebäck.json',
        'Gemüse': 'Gemüse.json',
        'Hauptgericht': 'Hauptgericht.json',
        'Salat': 'Salat.json',
        'Suppe': 'Suppe.json',
        'Soße': 'Soße.json'
    };
    return mapping[kategorie] || `${kategorie}.json`;
}

// Hilfsfunktion zum Prüfen und Erstellen der Datei, falls sie nicht existiert
async function ensureFileExists(filePath, kategorie) {
    try {
        // Stelle sicher, dass das Verzeichnis existiert
        await fs.ensureDir(path.dirname(filePath));
        await fs.access(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Erstelle neue Datei für ${kategorie}`);
            await fs.writeFile(filePath, '[]');
        }
    }
}

const datenbankController = {
    async getKategorien(req, res) {
        try {
            console.log('Kategorien werden abgerufen...');
            res.json(REZEPT_KATEGORIEN);
        } catch (error) {
            console.error('Fehler beim Abrufen der Kategorien:', error);
            res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
        }
    },

    async getRezepteByKategorie(req, res) {
        try {
            const { kategorie } = req.params;
            console.log(`Lese Rezepte für Kategorie: ${kategorie}`);
            
            const filename = getFilename(kategorie);
            const filePath = path.join(__dirname, '..', 'data', 'rezepte', filename);
            
            console.log('Versuche Datei zu lesen von:', filePath);
            
            // Prüfe ob Datei existiert
            try {
                await fs.access(filePath);
            } catch (error) {
                console.log(`Keine Datei gefunden für ${kategorie}, erstelle leere Liste`);
                return res.json([]);
            }
            
            const data = await fs.readFile(filePath, 'utf8');
            const rezepte = JSON.parse(data);
            res.json(rezepte);
            
        } catch (error) {
            console.error(`Fehler beim Lesen der ${req.params.kategorie}-Rezepte:`, error);
            res.json([]);
        }
    },

    async updateRezept(req, res) {
        try {
            const { kategorie, rezeptId } = req.params;
            const { zutaten, infos } = req.body;
            const filename = getFilename(kategorie);
            const filePath = path.join(__dirname, '..', 'data', 'rezepte', filename);
            
            console.log(`Aktualisiere Rezept ${rezeptId} in ${kategorie}`);
            
            const data = await fs.readFile(filePath, 'utf8');
            const rezepte = JSON.parse(data);
            
            const rezeptIndex = rezepte.findIndex(r => r.rezeptId === parseInt(rezeptId));
            if (rezeptIndex === -1) {
                return res.status(404).json({ error: 'Rezept nicht gefunden' });
            }

            // Aktualisiere nur die Mengen der Zutaten und behalte alle anderen Zutatendaten
            const updatedZutaten = rezepte[rezeptIndex].zutaten.map(existingZutat => {
                const updatedZutat = zutaten.find(z => z.id === existingZutat.id);
                if (updatedZutat) {
                    return {
                        ...existingZutat,
                        menge: updatedZutat.menge
                    };
                }
                return existingZutat;
            });

            // Aktualisiere nur die geänderten Felder
            rezepte[rezeptIndex] = {
                ...rezepte[rezeptIndex],
                zutaten: updatedZutaten,
                infos: infos,
                updatedAt: new Date().toISOString()
            };

            await fs.writeFile(filePath, JSON.stringify(rezepte, null, 2));
            
            res.json({ message: 'Rezept erfolgreich aktualisiert' });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Rezepts:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Rezepts' });
        }
    },

    async deleteRezept(req, res) {
        try {
            const { kategorie, rezeptId } = req.params;
            const filename = getFilename(kategorie);
            const filePath = path.join(__dirname, '..', 'data', 'rezepte', filename);
            
            console.log(`Lösche Rezept ${rezeptId} aus ${kategorie}`);
            
            // Prüfe ob Datei existiert
            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({ error: 'Kategorie nicht gefunden' });
            }
            
            const data = await fs.readFile(filePath, 'utf8');
            const rezepte = JSON.parse(data);
            
            const neueRezepte = rezepte.filter(r => r.rezeptId !== parseInt(rezeptId));
            await fs.writeFile(filePath, JSON.stringify(neueRezepte, null, 2));
            
            res.json({ message: 'Rezept erfolgreich gelöscht' });
        } catch (error) {
            console.error('Fehler beim Löschen des Rezepts:', error);
            res.status(500).json({ error: 'Fehler beim Löschen des Rezepts' });
        }
    }
};

module.exports = datenbankController;