const fs = require('fs-extra');
const path = require('path');
const { validationResult } = require('express-validator');
const xml2js = require('xml2js');

// Pfade zu den JSON-Dateien
const zutatenPath = path.join(__dirname, '../data/zutaten.json');
const lastIdPath = path.join(__dirname, '../data/lastIngredientId.json');
const responsePath = path.join(__dirname, '../data/response.json');

// Hilfsfunktion zum Laden von Daten
const loadData = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Fehler beim Laden von ${filePath}:`, error);
    throw error;
  }
};

// Hilfsfunktion zum Speichern von Daten
const saveData = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Fehler beim Speichern in ${filePath}:`, error);
    throw error;
  }
};

// GET /api/zutaten
exports.getAllZutaten = async (req, res) => {
  try {
    const zutaten = await loadData(zutatenPath);
    res.json(zutaten);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Zutaten.' });
  }
};
exports.getIngredientList = async (req, res) => {
  try {
      const responseData = await loadData(responsePath); // <-- Hier
      res.json(responseData);
  } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Zutatenliste.' });
  }
};
// POST/PUT /api/zutaten(/:id)
exports.createOrUpdateZutat = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, preisProBasiseinheit, basiseinheit, verwendungseinheit, lieferanten, kategorien, allergene, allergenCodes, preisProVerwendungseinheit } = req.body;
  const id = req.params.id ? parseInt(req.params.id, 10) : null;

  try {
    let zutaten = await loadData(zutatenPath);

    if (id) {
      // Update
      const zutatIndex = zutaten.findIndex((z) => z.id === id);
      if (zutatIndex === -1) {
        return res.status(404).json({ error: 'Zutat nicht gefunden.' });
      }

      zutaten[zutatIndex] = {
        id,
        name,
        preisProBasiseinheit,
        basiseinheit,
        verwendungseinheit,
        lieferanten,
        kategorien,
        allergene,
        allergenCodes,
        preisProVerwendungseinheit,
      };

      await saveData(zutatenPath, zutaten);
      res.json(zutaten[zutatIndex]);
    } else {
      // Neu erstellen
      const lastIdData = await loadData(lastIdPath);
      const newId = lastIdData.lastId + 1;

      const neueZutat = {
        id: newId,
        name,
        preisProBasiseinheit,
        basiseinheit,
        verwendungseinheit,
        lieferanten,
        kategorien,
        allergene,
        allergenCodes,
        preisProVerwendungseinheit,
      };

      zutaten.push(neueZutat);
      await saveData(zutatenPath, zutaten);
      await saveData(lastIdPath, { lastId: newId });

      res.status(201).json(neueZutat);
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Zutat:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Zutat.' });
  }
};

// DELETE /api/zutaten/:id
exports.deleteZutat = async (req, res) => {
  const zutatId = parseInt(req.params.id, 10);

  try {
    let zutaten = await loadData(zutatenPath);
    const zutatIndex = zutaten.findIndex((z) => z.id === zutatId);

    if (zutatIndex === -1) {
      return res.status(404).json({ error: 'Zutat nicht gefunden.' });
    }

    zutaten.splice(zutatIndex, 1);
    await saveData(zutatenPath, zutaten);

    res.json({ message: 'Zutat gelöscht.' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen der Zutat.' });
  }
};

// GET /api/zutaten/export
exports.exportZutatenAsXML = async (req, res) => {
  try {
      const zutaten = await loadData(zutatenPath);

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<zutaten>\n';
      zutaten.forEach((z) => {
          xml += `  <zutat>\n`;
          xml += `    <id>${z.id}</id>\n`;
          xml += `    <name>${z.name}</name>\n`;
          xml += `    <preisProBasiseinheit>${z.preisProBasiseinheit.toFixed(2)}</preisProBasiseinheit>\n`;
          xml += `    <basiseinheit>${z.basiseinheit}</basiseinheit>\n`;
          xml += `    <verwendungseinheit>${z.verwendungseinheit}</verwendungseinheit>\n`;
          xml += `    <preisProVerwendungseinheit>${z.preisProVerwendungseinheit.toFixed(4)}</preisProVerwendungseinheit>\n`;
          xml += `    <lieferanten>${z.lieferanten.join(', ')}</lieferanten>\n`;
          xml += `    <kategorien>${z.kategorien.join(', ')}</kategorien>\n`;
          xml += `    <allergene>${z.allergene.join(', ')}</allergene>\n`;
          xml += `    <allergenCodes>${z.allergenCodes.join(', ')}</allergenCodes>\n`;
          xml += `  </zutat>\n`;
      });
      xml += '</zutaten>';

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', 'attachment; filename="zutaten.xml"');
      res.send(xml);
  } catch (error) {
      console.error('Fehler beim Exportieren der Zutaten als XML:', error);
      res.status(500).json({ error: 'Fehler beim Exportieren der Zutaten als XML.' });
  }
};

// POST /api/zutaten/import
exports.importZutaten = async (req, res) => {
  try {
    const zutatenData = req.body; // JSON-Daten
    if (!Array.isArray(zutatenData)) {
      return res.status(400).json({ error: 'Ungültiges Format. Es wird ein Array erwartet.' });
    }

    const existingZutaten = await loadData(zutatenPath);
    const lastIdData = await loadData(lastIdPath);

    let importiert = 0;
    let übersprungen = 0;

    zutatenData.forEach((neueZutat) => {
      const duplicate = existingZutaten.some(
        (z) => z.name.toLowerCase() === neueZutat.name.toLowerCase() &&
               z.basiseinheit === neueZutat.basiseinheit
      );

      if (!duplicate) {
        lastIdData.lastId += 1;
        neueZutat.id = lastIdData.lastId;
        existingZutaten.push(neueZutat);
        importiert++;
      } else {
        übersprungen++;
      }
    });

    await saveData(zutatenPath, existingZutaten);
    await saveData(lastIdPath, lastIdData);

    res.json({
      message: `${importiert} Zutaten importiert, ${übersprungen} übersprungen.`,
    });
  } catch (error) {
    console.error('Fehler beim Importieren der Zutaten:', error);
    res.status(500).json({ error: 'Fehler beim Importieren der Zutaten.' });
  }
};

exports.exportZutaten = async (req, res) => {
  try {
    const zutaten = await loadData(zutatenPath);
    res.setHeader('Content-Disposition', 'attachment; filename="zutaten.json"');
    res.json(zutaten);
  } catch (error) {
    console.error('Fehler beim Exportieren der Zutaten:', error);
    res.status(500).json({ error: 'Fehler beim Exportieren der Zutaten.' });
  }
};

