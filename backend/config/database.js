const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        console.log('Verbinde mit MongoDB Atlas...');
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI ist nicht in der .env Datei definiert');
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('MongoDB Verbindung hergestellt');
        
        // Test der Verbindung
        const admin = mongoose.connection.db.admin();
        const result = await admin.ping();
        console.log('Datenbank-Ping erfolgreich:', result);
        
    } catch (error) {
        console.error('MongoDB Verbindungsfehler:', error);
        process.exit(1);
    }
};

// Event Listener für Verbindungsprobleme
mongoose.connection.on('error', err => {
    console.error('MongoDB Verbindungsfehler:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Verbindung getrennt');
});

module.exports = connectDB; 