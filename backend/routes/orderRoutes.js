// Datei: server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper-Funktion zum Laden von JSON-Dateien
const loadJSON = (filePath) => {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error(`Fehler beim Parsen der JSON-Datei: ${filePath}`, error);
            return null;
        }
    }
    return null;
};

// Route: Alle Einrichtungen abrufen
router.get('/einrichtungen', (req, res) => {
    try {
        const einrichtungenDir = path.join(__dirname, '../data/einrichtungen');
        if (!fs.existsSync(einrichtungenDir)) {
            console.warn(`Verzeichnis für Einrichtungen nicht gefunden: ${einrichtungenDir}`);
            return res.json([]);
        }
        const files = fs.readdirSync(einrichtungenDir).filter(file => file.endsWith('.json'));
        const einrichtungen = files.map(file => {
            const data = loadJSON(path.join(einrichtungenDir, file));
            if (data) {
                return {
                    name: data.name,
                    kuerzel: data.kuerzel, // Kürzel hinzufügen
                    speiseangebot: data.speiseangebot,
                    gruppen: data.gruppen
                };
            } else {
                console.warn(`Einrichtungsdatei konnte nicht geladen werden: ${file}`);
                return null;
            }
        }).filter(e => e !== null);
        res.json(einrichtungen);
    } catch (error) {
        console.error('Fehler beim Laden der Einrichtungen:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Einrichtungen' });
    }
});

// Route: Daten für eine Einrichtung und Woche laden
router.get('/load/:year/:week/:einrichtung', (req, res) => {
    const { year, week, einrichtung } = req.params;

    try {
        // Konstruiere den Pfad zur Order-Datei im Verzeichnis data/order/<jahr>/<kalenderwoche>/
        const orderDir = path.join(__dirname, '../data/order', year, week);
        const einrichtungName = einrichtung.replace(/_/g, ' '); // Ersetze Unterstriche durch Leerzeichen
        const einrichtungNameForFile = einrichtungName.replace(/ /g, '_'); // Ersetze Leerzeichen durch Unterstriche
        const orderFile = `order_${einrichtungNameForFile}.json`;
        const orderPath = path.join(orderDir, orderFile);

        console.log(`EinrichtungName: ${einrichtungName}`);
        console.log(`EinrichtungNameForFile: ${einrichtungNameForFile}`);
        console.log(`Order-Datei: ${orderPath}`);

        if (fs.existsSync(orderPath)) {
            console.log(`Order-Datei existiert: ${orderPath}`);
            const orderData = loadJSON(orderPath);
            if (orderData) {
                console.log(`Order-Daten:`, orderData);
                res.json({ orders: orderData.orders || [], speiseangebot: [] }); // speiseangebot wird separat geladen
                return;
            } else {
                console.warn(`Order-Daten konnten nicht geladen werden: ${orderPath}`);
                res.json({ orders: [], speiseangebot: [] });
                return;
            }
        } else {
            console.log(`Keine Order-Datei gefunden für ${einrichtungName} in KW ${week} ${year}.`);
            res.json({ orders: [], speiseangebot: [] });
            return;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Daten' });
    }
});

// Route: Bestellung speichern
router.post('/save', (req, res) => {
    const { einrichtung, kuerzel, orders, week, year } = req.body; // Kürzel hinzufügen
    if (!einrichtung || !kuerzel || !orders || !week || !year) {
        console.error("Fehlende Felder:", { einrichtung, kuerzel, orders, week, year });
        return res.status(400).json({ error: 'Einrichtung, Kürzel, Orders, Week und Year sind erforderlich' });
    }

    try {
        const orderDir = path.join(__dirname, '../data/order', String(year), String(week));
        if (!fs.existsSync(orderDir)) {
            fs.mkdirSync(orderDir, { recursive: true });
            console.log(`Erstellt Verzeichnis: ${orderDir}`);
        }

        const einrichtungNameForFile = einrichtung.replace(/ /g, '_'); // Ersetze Leerzeichen durch Unterstriche
        const orderFile = `order_${einrichtungNameForFile}.json`;
        const orderPath = path.join(orderDir, orderFile);

        const orderData = {
            einrichtung,
            kuerzel, // Kürzel hinzufügen
            orders,
            week: parseInt(week, 10),
            year: parseInt(year, 10)
        };

        fs.writeFileSync(orderPath, JSON.stringify(orderData, null, 2));
        console.log(`Order-Datei gespeichert: ${orderPath}`);
        res.status(201).json({ message: 'Order erfolgreich gespeichert!' });
    } catch (error) {
        console.error('Fehler beim Speichern der Order:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der Order' });
    }
});

// Route: INFO-Daten speichern
router.post('/save-info', (req, res) => {
    const { einrichtung, week, year, day, info } = req.body;
    if (!einrichtung || !week || !year || !day) {
        return res.status(400).json({ error: 'Einrichtung, Week, Year und Day sind erforderlich' });
    }

    try {
        const orderDir = path.join(__dirname, '../data/order', String(year), String(week));
        if (!fs.existsSync(orderDir)) {
            fs.mkdirSync(orderDir, { recursive: true });
            console.log(`Erstellt Verzeichnis für INFO-Daten: ${orderDir}`);
        }

        const einrichtungNameForFile = einrichtung.replace(/ /g, '_'); // Ersetze Leerzeichen durch Unterstriche
        const orderFile = `order_${einrichtungNameForFile}.json`;
        const orderPath = path.join(orderDir, orderFile);

        let orderData = { einrichtung, orders: [], week: parseInt(week), year: parseInt(year) };
        if (fs.existsSync(orderPath)) {
            const existingData = loadJSON(orderPath);
            if (existingData) {
                orderData = existingData;
                console.log(`Bestehende Order-Daten geladen: ${orderPath}`);
            } else {
                console.warn(`Bestehende Order-Datei konnte nicht geladen werden: ${orderPath}`);
            }
        }

        // Suche nach der 'information' Komponente für den Tag
        const infoOrderIndex = orderData.orders.findIndex(order => order.day === day && order.component === 'information');

        if (infoOrderIndex !== -1) {
            // Aktualisiere bestehende Information
            orderData.orders[infoOrderIndex].info = info;
            console.log(`Aktualisiere Information für ${day} in ${orderPath}`);
        } else {
            // Füge neue Information hinzu
            orderData.orders.push({
                day,
                component: 'information',
                info
            });
            console.log(`Füge neue Information für ${day} in ${orderPath} hinzu`);
        }

        fs.writeFileSync(orderPath, JSON.stringify(orderData, null, 2));
        console.log(`Information erfolgreich gespeichert: ${orderPath}`);
        res.status(200).json({ message: 'Information erfolgreich gespeichert!' });
    } catch (error) {
        console.error('Fehler beim Speichern der Information:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der Information' });
    }
});

module.exports = router;
