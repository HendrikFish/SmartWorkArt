const express = require('express');
const router = express.Router();
const rezepteController = require('../controllers/rezepteController');
const path = require('path');
const fs = require('fs');

router.post('/', rezepteController.saveRezept);
router.get("/kategorie/:kategorie", rezepteController.getRezepteByKategorie);
router.get('/alle', async (req, res) => {
    try {
        const rezeptePath = path.join(__dirname, '..', 'data', 'rezepte');
        const files = await fs.promises.readdir(rezeptePath);
        let allRecipes = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.promises.readFile(path.join(rezeptePath, file), 'utf8');
                const recipes = JSON.parse(content);
                allRecipes = allRecipes.concat(recipes);
            }
        }

        res.json(allRecipes);
    } catch (error) {
        console.error('Fehler beim Laden der Rezepte:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Rezepte' });
    }
});


module.exports = router;