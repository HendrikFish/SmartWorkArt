const fs = require('fs-extra');
const path = require('path');
console.log('Path-Modul geladen:', path);

// Rezept speichern
exports.saveRezept = async (req, res) => {
  try {
    console.log('Empfangene Daten:', req.body);

    const { name, rezeptKategorien, zutaten } = req.body;
    const rezeptKategorie = rezeptKategorien[0];
    const filePath = path.join(__dirname, `../data/rezepte/${rezeptKategorie}.json`);

    let daten = [];
    if (await fs.pathExists(filePath)) {
      daten = await fs.readJson(filePath);
    } else {
      // Stelle sicher, dass das Verzeichnis existiert
      await fs.ensureDir(path.dirname(filePath));
    }

    // Überprüfen, ob ein Rezept mit demselben Namen bereits existiert
    const rezeptExistiert = daten.some((rezept) => rezept.name.toLowerCase() === name.toLowerCase());
    if (rezeptExistiert) {
      return res.status(400).json({ error: `Ein Rezept mit dem Namen "${name}" existiert bereits in der Kategorie "${rezeptKategorie}".` });
    }

    const neuesRezept = {
      rezeptId: daten.length + 1,
      name,
      rezeptKategorien,
      zutaten,
      infos: req.body.infos || "", // Rezeptinformationen hinzufügen
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    daten.push(neuesRezept);
    await fs.writeJson(filePath, daten, { spaces: 2 });

    res.status(201).json(neuesRezept);
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rezepte nach Kategorie abrufen
exports.getRezepteByKategorie = async (req, res) => {
  const kategorie = req.params.kategorie;
  const filePath = path.join(__dirname, `../data/rezepte/${kategorie}.json`);

  try {
    // Rückgabe einer leeren Liste, wenn die Datei nicht existiert
    if (!(await fs.pathExists(filePath))) {
      console.warn(`Datei für Kategorie "${kategorie}" nicht gefunden. Rückgabe einer leeren Liste.`);
      return res.json([]); // Gibt eine leere Liste zurück
    }

    const rezepte = await fs.readJson(filePath);
    res.json(rezepte);
  } catch (error) {
    console.error(`Fehler beim Abrufen der Datei für Kategorie "${kategorie}":`, error.message);
    res.status(500).json({ error: "Fehler beim Abrufen der Rezepte." });
  }
};
