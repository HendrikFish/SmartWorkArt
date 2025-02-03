const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function resetDatabase() {
    try {
        // Verbindung zur Datenbank herstellen
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Mit MongoDB verbunden');

        // Collection löschen
        await mongoose.connection.db.dropCollection('users');
        console.log('Users Collection gelöscht');

        // Alle Indizes löschen
        await mongoose.connection.db.collection('users').dropIndexes();
        console.log('Alle Indizes gelöscht');

        console.log('Datenbank erfolgreich zurückgesetzt');
    } catch (error) {
        console.error('Fehler beim Zurücksetzen der Datenbank:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Datenbankverbindung getrennt');
    }
}

resetDatabase(); 