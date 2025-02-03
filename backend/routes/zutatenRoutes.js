const express = require('express');
const router = express.Router();
const zutatenController = require('../controllers/zutatenController');
const { body } = require('express-validator');

// GET /api/zutaten
router.get('/', zutatenController.getAllZutaten);

// POST /api/zutaten
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name ist erforderlich.'),
    body('preisProBasiseinheit').isFloat({ min: 0.01 }).withMessage('Preis muss größer als 0 sein.'),
    body('basiseinheit').isIn(['kg', 'g', 'l', 'ml', 'Stück']).withMessage('Ungültige Basiseinheit.'),
    body('verwendungseinheit').notEmpty().withMessage('Verwendungseinheit ist erforderlich.'),
    body('lieferanten').isArray({ min: 1 }).withMessage('Mindestens ein Lieferant ist erforderlich.'),
    body('kategorien').isArray({ min: 1 }).withMessage('Mindestens eine Kategorie ist erforderlich.'),
    body('allergene').isArray().withMessage('Allergene müssen als Array angegeben werden.')
  ],
  zutatenController.createOrUpdateZutat
);

// PUT /api/zutaten/:id
router.put(
  '/:id',
  [
    body('name').notEmpty().withMessage('Name ist erforderlich.'),
    body('preisProBasiseinheit').isFloat({ min: 0.01 }).withMessage('Preis muss größer als 0 sein.'),
    body('basiseinheit').isIn(['kg', 'g', 'l', 'ml', 'Stück']).withMessage('Ungültige Basiseinheit.'),
    body('verwendungseinheit').notEmpty().withMessage('Verwendungseinheit ist erforderlich.'),
    body('lieferanten').isArray({ min: 1 }).withMessage('Mindestens ein Lieferant ist erforderlich.'),
    body('kategorien').isArray({ min: 1 }).withMessage('Mindestens eine Kategorie ist erforderlich.'),
    body('allergene').isArray().withMessage('Allergene müssen als Array angegeben werden.')
  ],
  zutatenController.createOrUpdateZutat
);

// DELETE /api/zutaten/:id
router.delete('/:id', zutatenController.deleteZutat);

// GET /api/zutaten/ingredient-list
router.get('/ingredient-list', zutatenController.getIngredientList);

// GET /api/zutaten/export
router.get('/export', zutatenController.exportZutaten);

// POST /api/zutaten/import
router.post('/import', zutatenController.importZutaten);



const fs = require('fs');
const path = require('path');

// GET /api/zutaten
router.get('/', (req, res) => {
  const filePath = path.join(__dirname, '../data/zutaten.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Zutaten-Datei:', err);
      return res.status(500).json({ error: 'Fehler beim Laden der Zutaten.' });
    }
    res.json(JSON.parse(data));
  });
});

module.exports = router;


