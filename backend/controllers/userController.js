// /backend/controllers/userController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// POST /api/users/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { username, password } = req.body;

  try {
    const existiert = await User.findOne({ username });
    if (existiert) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben.' });
    }

    const neuerBenutzer = new User({ username, password });
    await neuerBenutzer.save();

    res.status(201).json({ message: 'Benutzer registriert.' });
  } catch (error) {
    res.status(500).json({ error: 'Fehler bei der Registrierung.' });
  }
};

// POST /api/users/login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const benutzer = await User.findOne({ username });
    if (!benutzer) {
      return res.status(400).json({ error: 'Ungültige Anmeldedaten.' });
    }

    const istPasswortRichtig = await benutzer.comparePassword(password);
    if (!istPasswortRichtig) {
      return res.status(400).json({ error: 'Ungültige Anmeldedaten.' });
    }

    const token = jwt.sign(
      { id: benutzer._id, username: benutzer.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Fehler bei der Anmeldung.' });
  }
};
