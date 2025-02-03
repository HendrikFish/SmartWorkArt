const express = require('express');
const router = express.Router();
const datenbankController = require('../controllers/datenbankController');

// Alle Kategorien abrufen
router.get('/kategorien', datenbankController.getKategorien);

// Alle Rezepte einer Kategorie abrufen
router.get('/rezepte/:kategorie', datenbankController.getRezepteByKategorie);

// Rezept aktualisieren
router.put('/rezepte/:kategorie/:rezeptId', datenbankController.updateRezept);

// Rezept löschen
router.delete('/rezepte/:kategorie/:rezeptId', datenbankController.deleteRezept);

module.exports = router;