const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const planController = require("../controllers/planController");
const calcController = require("../controllers/calcController");

// Lade den Wochenplan
router.get("/:year/:week", planController.getWeekPlan);

// Neue Route speziell für Calc mit Override-Funktion
router.get("/menu/:year/:week", calcController.getWeekPlanWithOverride);

// Speichere den Wochenplan
router.put("/:year/:week", planController.saveWeekPlan);

// Rezepte durchsuchen
router.get("/recipes", planController.searchRecipes);

// API zum Abrufen von Bestellungsdaten
// Lade Bestelldaten
router.get("/data/order/:year/:week", (req, res) => {
  const { year, week } = req.params;
  const dirPath = path.join(__dirname, `../data/order/${year}/${week}`);
  
  fs.readdir(dirPath, (err, files) => {
      if (err) {
          console.error(`Fehler beim Lesen des Verzeichnisses: ${dirPath}`, err);
          return res.status(404).json({ error: "Verzeichnis nicht gefunden" });
      }

      // Nur JSON-Dateien zurückgeben
      const jsonFiles = files.filter(file => file.endsWith(".json"));
      res.json(jsonFiles);
  });
});

// JSON-Datei-Inhalt lesen
router.get("/data/order/:year/:week/:file", (req, res) => {
  const { year, week, file } = req.params;
  const filePath = path.join(__dirname, `../data/order/${year}/${week}/${file}`);
  
  fs.readFile(filePath, (err, data) => {
      if (err) {
          console.error(`Fehler beim Lesen der Datei: ${filePath}`, err);
          return res.status(404).json({ error: "Datei nicht gefunden" });
      }
      res.json(JSON.parse(data));
  });
});

module.exports = router;
