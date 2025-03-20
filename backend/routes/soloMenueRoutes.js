/**
 * Routes für die SoloMenü-Anwendung
 */

const express = require('express');
const router = express.Router();
const soloMenueController = require('../controllers/soloMenueController');

// Route zum Abrufen der Filterkonfiguration
router.get('/config/filter', soloMenueController.getFilterConfig);

// Route zum Abrufen aller Bewohner
router.get('/bewohner', soloMenueController.getAllBewohner);

// Route zum Abrufen eines einzelnen Bewohners nach ID
router.get('/bewohner/:id', soloMenueController.getBewohnerById);

// Route zum Abrufen der Bewohner nach Kategorie (z.B. "Saal", "1.OG", usw.)
router.get('/bewohner/kategorie/:kategorie', soloMenueController.getBewohnerByKategorie);

// Route zum Abrufen der Extra-Menüs
router.get('/extras', soloMenueController.getExtraMenus);

// Route zum Abrufen der Extra-Wünsche
router.get('/wuensche', soloMenueController.getExtraWuensche);

// Route zum Erstellen eines neuen Extra-Wunsches
router.post('/wuensche', soloMenueController.createExtraWunsch);

// Route zum Aktualisieren eines Extra-Wunsches
router.put('/wuensche/:id', soloMenueController.updateExtraWunsch);

// Route zum Löschen eines Extra-Wunsches
router.delete('/wuensche/:id', soloMenueController.deleteExtraWunsch);

// Route zum Abrufen eines Menüplans nach Jahr und KW
router.get('/menueplan/:jahr/:kw', soloMenueController.getMenueplan);

// Route zum Abrufen aller verfügbaren Menüplan-KWs für ein Jahr
router.get('/menueplan-kws/:jahr', soloMenueController.getMenueplanKWs);

// Route zum Abrufen aller verfügbaren Jahre mit Menüplänen
router.get('/menueplan-jahre', soloMenueController.getMenueplanJahre);

// Route zum Abrufen aller Extra-Kategorien
router.get('/extrakategorien', soloMenueController.getExtraKategorien);

// Route zum Speichern einer Extra-Kategorie
router.post('/extrakategorien', soloMenueController.saveExtraKategorie);

// Route zum Löschen einer Extra-Kategorie
router.delete('/extrakategorien/:id', soloMenueController.deleteExtraKategorie);

// Routen für die Verwaltung von Extra-Menüs
router.post('/extras', soloMenueController.saveExtraMenu);
router.put('/extras/:id', soloMenueController.updateExtraMenu);
router.delete('/extras/:id', soloMenueController.deleteExtraMenu);

// Neue Routen für die Bewohnerauswahl
router.get('/bewohner-auswahl/:jahr/KW:kw/:bewohnerName', soloMenueController.getBewohnerAuswahl);
router.post('/bewohner-auswahl/:jahr/KW:kw/:bewohnerName', soloMenueController.speichereBewohnerAuswahl);
router.delete('/delete-plan/:jahr/KW:kw/:bewohnerName', soloMenueController.deleteBewohnerAuswahl);

// Route für die Aktualisierung der Bewohnerdaten
router.post('/update-bewohner/:bewohnerName', soloMenueController.updateBewohner);

module.exports = router;
