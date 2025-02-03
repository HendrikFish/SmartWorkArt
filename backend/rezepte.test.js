// /backend/tests/backend/rezepte.test.js
const request = require('supertest');
const app = require('../app'); // Stelle sicher, dass app.js exportiert wird
const mongoose = require('mongoose');
const Rezept = require('../models/rezeptModel');

describe('Rezepte API', () => {
  beforeAll(async () => {
    // Verbindung zur Test-Datenbank herstellen
    await mongoose.connect(process.env.MONGODB_URI_TEST, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
  });

  afterAll(async () => {
    // Verbindung schließen
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Test-Datenbank vor jedem Test leeren
    await Rezept.deleteMany({});
  });

  it('sollte alle Rezepte abrufen', async () => {
    const rezept = new Rezept({
      name: 'Testrezept',
      rezeptKategorien: ['Hauptgericht'],
      zutaten: [{ name: 'Zutat1', menge: 2, einheit: 'Stück', preisProEinheit: 1.5 }],
      informationen: 'Testinformationen'
    });
    await rezept.save();

    const res = await request(app).get('/api/rezepte');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Testrezept');
  });

  // Weitere Tests für POST, PUT, DELETE...
});
