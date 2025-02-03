const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

// Lade den Wochenplan
router.get('/:year/:week', planController.getWeekPlan);

// Speichere den Wochenplan
router.put('/:year/:week', planController.saveWeekPlan);

router.get('/recipes', planController.searchRecipes);

router.get('/einrichtungen', planController.getEinrichtungen);

module.exports = router;
