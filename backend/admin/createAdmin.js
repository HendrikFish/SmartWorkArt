const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/loginModels');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createAdminUser() {
    try {
        console.log('Starte Admin-Account Erstellung...');
        
        // Verbindung zur MongoDB Atlas herstellen
        console.log('Verbinde mit MongoDB Atlas...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Verbindung zu MongoDB Atlas hergestellt');

        // Prüfen ob bereits ein Admin existiert
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('----------------------------------------');
            console.log('Ein Admin-Account existiert bereits!');
            console.log('Email:', existingAdmin.email);
            console.log('----------------------------------------');
            process.exit(0);
        }

        // Admin-Passwort hashen
        const adminPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Admin-User erstellen
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'System',
            email: 'admin@seniorenheim.de',
            password: hashedPassword,
            phoneNumber: '0123456789',
            employer: 'Seniorenheim',
            position: 'Administrator',
            facility: 'Haupteinrichtung',
            role: 'admin',
            isApproved: true,
            permissions: [
                { page: 'all', access: true }
            ]
        });

        await adminUser.save();
        console.log('----------------------------------------');
        console.log('Admin-Account wurde erfolgreich erstellt!');
        console.log('----------------------------------------');
        console.log('Anmeldedaten:');
        console.log('Email: admin@seniorenheim.de');
        console.log('Passwort:', adminPassword);
        console.log('----------------------------------------');
        console.log('WICHTIG: Bitte ändern Sie das Passwort nach dem ersten Login!');
        console.log('----------------------------------------');

    } catch (error) {
        console.error('----------------------------------------');
        console.error('Fehler beim Erstellen des Admin-Accounts:');
        console.error(error);
        console.error('----------------------------------------');
    } finally {
        await mongoose.disconnect();
        console.log('Datenbankverbindung getrennt');
    }
}

// Skript ausführen
createAdminUser(); 