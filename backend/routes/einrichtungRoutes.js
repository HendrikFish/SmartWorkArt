const express = require('express');
const router = express.Router();
const einrichtungController = require('../controllers/einrichtungController');

router.get('/', einrichtungController.getAllEinrichtungen);
router.get('/:name', einrichtungController.getEinrichtungByName);
router.post('/', einrichtungController.createEinrichtung);
router.put('/:name', einrichtungController.updateEinrichtung);
router.delete('/:name', einrichtungController.deleteEinrichtung);

module.exports = router;
