const fs = require('fs').promises;
const path = require('path');

// Controller-Funktionen als Objekt exportieren
const einrichtungController = {
    getAllEinrichtungen: async (req, res) => {
        try {
            const dirPath = path.join(__dirname, '../data/einrichtungen');
            await fs.mkdir(dirPath, { recursive: true });
            const files = await fs.readdir(dirPath);
            const einrichtungen = [];
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(dirPath, file), 'utf8');
                    einrichtungen.push(JSON.parse(content));
                }
            }
            
            res.json(einrichtungen);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getEinrichtungByName: async (req, res) => {
        try {
            const fileId = req.params.name;
            const filePath = path.join(__dirname, '../data/einrichtungen', `${fileId}.json`);
            
            console.log('Suche Datei:', filePath);
            
            const content = await fs.readFile(filePath, 'utf8');
            res.json(JSON.parse(content));
        } catch (error) {
            console.error('Fehler beim Lesen der Einrichtung:', error);
            res.status(404).json({ message: 'Einrichtung nicht gefunden' });
        }
    },

    createEinrichtung: async (req, res) => {
        try {
            const einrichtungData = req.body;
            const fullName = `${einrichtungData.name} ${einrichtungData.kuerzel || ''}`.trim();
            const fileName = `${fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            const dirPath = path.join(__dirname, '../data/einrichtungen');
            const filePath = path.join(dirPath, fileName);
            
            console.log('Erstelle neue Einrichtung:', {
                fullName,
                fileName,
                filePath
            });
            
            await fs.mkdir(dirPath, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(einrichtungData, null, 2));
            
            res.status(201).json({
                message: 'Einrichtung erfolgreich erstellt',
                data: einrichtungData,
                fileId: fileName.replace('.json', '')
            });
        } catch (error) {
            console.error('Fehler beim Erstellen:', error);
            res.status(500).json({ message: error.message });
        }
    },

    updateEinrichtung: async (req, res) => {
        try {
            const fileId = req.params.name;
            const newData = req.body;
            const oldFilePath = path.join(__dirname, '../data/einrichtungen', `${fileId}.json`);
            
            const newFullName = `${newData.name} ${newData.kuerzel || ''}`.trim();
            const newFileName = `${newFullName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            const newFilePath = path.join(__dirname, '../data/einrichtungen', newFileName);

            console.log('Update Einrichtung:', {
                fileId,
                newFullName,
                oldPath: oldFilePath,
                newPath: newFilePath
            });

            // Prüfen ob die alte Datei existiert
            try {
                await fs.access(oldFilePath);
            } catch (error) {
                console.error('Alte Datei nicht gefunden:', oldFilePath);
                return res.status(404).json({ message: 'Einrichtung nicht gefunden' });
            }

            // Wenn der Name geändert wurde, alte Datei löschen und neue erstellen
            if (fileId + '.json' !== newFileName) {
                await fs.writeFile(newFilePath, JSON.stringify(newData, null, 2));
                await fs.unlink(oldFilePath);
                console.log('Datei umbenannt von', fileId + '.json', 'zu', newFileName);
            } else {
                await fs.writeFile(oldFilePath, JSON.stringify(newData, null, 2));
                console.log('Datei aktualisiert:', fileId + '.json');
            }

            res.json({ 
                message: 'Einrichtung aktualisiert',
                newName: newData.name,
                fileId: newFileName.replace('.json', '')
            });
        } catch (error) {
            console.error('Fehler beim Update:', error);
            res.status(500).json({ message: error.message });
        }
    },

    deleteEinrichtung: async (req, res) => {
        try {
            const fileId = req.params.name;
            const filePath = path.join(__dirname, '../data/einrichtungen', `${fileId}.json`);
            
            // Prüfen ob die Datei existiert
            try {
                await fs.access(filePath);
            } catch (error) {
                return res.status(404).json({ message: 'Einrichtung nicht gefunden' });
            }

            // Datei löschen
            await fs.unlink(filePath);
            
            res.json({ message: 'Einrichtung erfolgreich gelöscht' });
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = einrichtungController;
