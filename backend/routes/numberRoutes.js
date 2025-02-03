const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Hole verfügbare Jahre
router.get('/years', async (req, res) => {
    try {
        const orderPath = path.join(__dirname, '../data/order');
        const years = await fs.readdir(orderPath);
        res.json(years);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Lesen der Jahre' });
    }
});

// Hole verfügbare Wochen für ein Jahr
router.get('/weeks/:year', async (req, res) => {
    try {
        const yearPath = path.join(__dirname, '../data/order', req.params.year);
        const weeks = await fs.readdir(yearPath);
        res.json(weeks);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Lesen der Wochen' });
    }
});

// Hole Bestelldaten für eine bestimmte Woche
router.get('/data/:year/:week', async (req, res) => {
    try {
        const weekPath = path.join(__dirname, '../data/order', req.params.year, req.params.week);
        const files = await fs.readdir(weekPath);
        const orderData = [];

        for (const file of files) {
            if (file.startsWith('order_')) {
                const data = await fs.readFile(path.join(weekPath, file), 'utf8');
                orderData.push(JSON.parse(data));
            }
        }
        res.json(orderData);
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Lesen der Bestelldaten' });
    }
});

// Neuer Endpoint für alle Einrichtungen
router.get('/einrichtungen/all', async (req, res) => {
    try {
        const einrichtungenPath = path.join(__dirname, '../data/einrichtungen');
        const files = await fs.readdir(einrichtungenPath);
        const einrichtungen = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const data = await fs.readFile(path.join(einrichtungenPath, file), 'utf8');
                einrichtungen.push(JSON.parse(data));
            }
        }
        res.json(einrichtungen);
    } catch (error) {
        console.error('Fehler beim Lesen der Einrichtungsdaten:', error);
        res.status(500).json({ error: 'Fehler beim Lesen der Einrichtungsdaten' });
    }
});

router.post('/data/:year/:week/updateInfo', async (req, res) => {
    try {
        const { year, week } = req.params;
        const { facility, day, info } = req.body;
        
        console.log('Received request:', { year, week, facility, day, info });
        
        // Verzeichnispfad
        const dirPath = path.join(__dirname, '..', 'data', 'order', year.toString(), week.toString());
        const files = await fs.readdir(dirPath);
        console.log('Available files:', files);
        
        // Suche nach der passenden Datei
        const matchingFile = files.find(file => {
            // Entferne '.json' Suffix für den Vergleich
            const fileName = file.replace('.json', '');
            // Erstelle den erwarteten Dateinamen
            const expectedFileName = `order_${facility}`;
            
            return fileName === expectedFileName;
        });
        
        if (!matchingFile) {
            // Wenn keine exakte Übereinstimmung gefunden wurde, versuche eine weniger strikte Suche
            const alternativeMatch = files.find(file => 
                file.toLowerCase().includes(facility.toLowerCase().replace(/\s+/g, '_'))
            );
            
            if (alternativeMatch) {
                console.log('Found alternative match:', alternativeMatch);
                const filePath = path.join(dirPath, alternativeMatch);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const orderData = JSON.parse(fileContent);
                
                // Info aktualisieren
                const infoIndex = orderData.orders.findIndex(
                    order => order.component === 'information' && order.day === day
                );
                
                if (infoIndex !== -1) {
                    orderData.orders[infoIndex].info = info;
                } else {
                    orderData.orders.push({
                        day,
                        component: 'information',
                        info
                    });
                }
                
                // Datei speichern
                await fs.writeFile(filePath, JSON.stringify(orderData, null, 2));
                return res.json({ success: true });
            }
            
            console.error('No matching file found for facility:', facility);
            return res.status(404).json({ error: 'Bestelldatei nicht gefunden' });
        }
        
        const filePath = path.join(dirPath, matchingFile);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const orderData = JSON.parse(fileContent);
        
        // Info aktualisieren
        const infoIndex = orderData.orders.findIndex(
            order => order.component === 'information' && order.day === day
        );
        
        if (infoIndex !== -1) {
            orderData.orders[infoIndex].info = info;
        } else {
            orderData.orders.push({
                day,
                component: 'information',
                info
            });
        }
        
        // Datei speichern
        await fs.writeFile(filePath, JSON.stringify(orderData, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Detaillierter Fehler:', error);
        res.status(500).json({ 
            error: 'Fehler beim Aktualisieren der Info',
            details: error.message 
        });
    }
});

module.exports = router;
