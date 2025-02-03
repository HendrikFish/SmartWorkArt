const express = require('express');
const router = express.Router();
const menueController = require('../controllers/menueController');

router.get('/plan/:year/KW:week', menueController.getWeeklyPlan);
router.get('/einrichtungen', menueController.getEinrichtungen);
router.get('/available-weeks', menueController.getAvailableWeeks);

module.exports = router; 