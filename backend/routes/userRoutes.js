// /backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');

// POST /api/users/register
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Benutzername ist erforderlich.'),
    body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein.')
  ],
  userController.register
);

// POST /api/users/login
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Benutzername ist erforderlich.'),
    body('password').notEmpty().withMessage('Passwort ist erforderlich.')
  ],
  userController.login
);

module.exports = router;
