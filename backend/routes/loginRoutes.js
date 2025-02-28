const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/loginModels');
const { auth, checkRole } = require('../middleware/auth');

// Registrierung
router.post('/register', async (req, res) => {
    try {
        // Prüfe, ob die E-Mail bereits existiert
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Ein Benutzer mit dieser E-Mail existiert bereits' 
            });
        }

        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            phoneNumber, 
            employer, 
            position, 
            facility 
        } = req.body;
        
        // Validiere die erforderlichen Felder
        if (!firstName || !lastName || !email || !password || !phoneNumber || !employer || !position || !facility) {
            return res.status(400).json({ 
                message: 'Bitte füllen Sie alle erforderlichen Felder aus' 
            });
        }

        // Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Neuen Benutzer erstellen
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            employer,
            position,
            facility,
            isApproved: false,
            role: 'user'
        });

        await user.save();
        
        res.status(201).json({ 
            message: 'Registrierung erfolgreich. Warte auf Freigabe durch einen Administrator.' 
        });
    } catch (error) {
        console.error('Registrierungsfehler:', error);
        res.status(500).json({ 
            message: 'Registrierung fehlgeschlagen', 
            error: error.message 
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login-Anfrage erhalten:', req.body.email);
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !await bcrypt.compare(password, user.password)) {
            console.log('Ungültige Anmeldedaten');
            return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
        }

        if (!user.isApproved) {
            console.log('Account nicht freigegeben');
            return res.status(403).json({ message: 'Account wartet auf Freigabe' });
        }

        console.log('Login erfolgreich, erstelle Token');
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role,
                facility: user.facility,
                allowedFacilities: user.allowedFacilities,
                sessionId: req.sessionID // Session-ID hinzufügen
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Session-Daten speichern
        req.session.user = {
            userId: user._id,
            email: user.email,
            role: user.role
        };

        // Token als Cookie setzen
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/'
        });

        // Aktualisiere lastLogin
        user.lastLogin = new Date();
        await user.save();

        console.log('Login abgeschlossen, sende Antwort');
        res.json({ 
            message: 'Login erfolgreich',
            user: {
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                facility: user.facility,
                allowedFacilities: user.allowedFacilities,
                allowedModules: user.allowedModules
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login fehlgeschlagen', error: error.message });
    }
});

// Admin: Benutzer freigeben
router.put('/approve/:userId', auth, checkRole(['admin']), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { isApproved: true },
            { new: true }
        );
        res.json({ message: 'Benutzer freigegeben', user });
    } catch (error) {
        res.status(500).json({ message: 'Fehler bei der Freigabe', error: error.message });
    }
});

// Benutzerinformationen abrufen
router.get('/user/info', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            email: user.email
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzerinformationen:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Logout
router.post('/logout', auth, (req, res) => {
    try {
        // Session zerstören
        req.session.destroy((err) => {
            if (err) {
                console.error('Fehler beim Zerstören der Session:', err);
            }
            
            // Cookie löschen
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            
            res.clearCookie('sessionId', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            
            res.json({ message: 'Erfolgreich abgemeldet' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Fehler beim Abmelden' });
    }
});

// Aktuellen Benutzer abrufen
router.get('/me', auth, async (req, res) => {
    try {
        console.log('ME Route aufgerufen, userId:', req.user._id);
        const user = await User.findById(req.user._id)
            .select('-password')
            .lean();

        if (!user) {
            console.log('Benutzer nicht gefunden in /me');
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        console.log('Benutzer gefunden in /me:', user);
        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            facility: user.facility,
            allowedFacilities: user.allowedFacilities,
            allowedModules: user.allowedModules,
            permissions: user.permissions,
            isApproved: user.isApproved
        });
    } catch (error) {
        console.error('Fehler in /me Route:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Einrichtungs-Präferenzen speichern
router.post('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        // Speichere die Einrichtungs-Präferenzen
        user.facilityPreferences = req.body.facilities || {};
        await user.save();

        console.log('Einrichtungs-Präferenzen gespeichert für:', user.email);
        res.json({ message: 'Präferenzen gespeichert' });
    } catch (error) {
        console.error('Fehler beim Speichern der Präferenzen:', error);
        res.status(500).json({ message: 'Fehler beim Speichern der Präferenzen' });
    }
});

// Einrichtungs-Präferenzen abrufen
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        console.log('Einrichtungs-Präferenzen abgerufen für:', user.email);
        res.json({ facilities: user.facilityPreferences || {} });
    } catch (error) {
        console.error('Fehler beim Abrufen der Präferenzen:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Präferenzen' });
    }
});

// Benutzer aktualisieren
router.put('/user/:userId', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { role, isApproved, notes, allowedFacilities, allowedModules } = req.body;
        
        // Validiere die Rolle
        if (!['user', 'co-admin', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Ungültige Rolle' });
        }

        // Finde und aktualisiere den Benutzer
        const updateData = {
            role,
            isApproved,
            notes,
            allowedFacilities,
            allowedModules,
            // Aktualisiere das lastModified Datum
            updatedAt: new Date()
        };

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { $set: updateData },
            { 
                new: true,
                runValidators: true 
            }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        console.log('Benutzer aktualisiert:', user);

        res.json({ 
            message: 'Benutzer erfolgreich aktualisiert',
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                allowedFacilities: user.allowedFacilities,
                allowedModules: user.allowedModules,
                notes: user.notes
            }
        });

    } catch (error) {
        console.error('Fehler beim Aktualisieren des Benutzers:', error);
        res.status(500).json({ 
            message: 'Fehler beim Aktualisieren des Benutzers',
            error: error.message 
        });
    }
});

// Passwort ändern (für alle Benutzer)
router.post('/change-password', auth, async (req, res) => {
    try {
        console.log('Passwortänderungsanfrage erhalten');
        
        const { currentPassword, newPassword } = req.body;
        
        console.log('Validiere Eingaben');
        // Validierung
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Aktuelles und neues Passwort sind erforderlich' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' });
        }
        
        console.log('Suche Benutzer in der Datenbank');
        // Benutzer finden
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        
        console.log('Überprüfe aktuelles Passwort');
        // Aktuelles Passwort überprüfen
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Aktuelles Passwort ist falsch' });
        }
        
        console.log('Setze neues Passwort');
        // Neues Passwort setzen
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        console.log('Speichere Benutzer');
        // Benutzer speichern
        await user.save();
        
        console.log('Passwort erfolgreich geändert');
        res.json({ message: 'Passwort erfolgreich geändert' });
    } catch (error) {
        console.error('Fehler beim Ändern des Passworts:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzerprofil abrufen
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        res.json(user);
    } catch (error) {
        console.error('Fehler beim Abrufen des Profils:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzerprofil aktualisieren
router.put('/profile', auth, async (req, res) => {
    try {
        const { phoneNumber, employer, position } = req.body;
        
        // Benutzer finden und aktualisieren
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                phoneNumber, 
                employer, 
                position
            },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Profils:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Eigenes Passwort zurücksetzen
router.post('/reset-own-password', auth, async (req, res) => {
    try {
        // Zufälliges Passwort generieren (8 Zeichen)
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let newPassword = '';
        for (let i = 0; i < 12; i++) {
            newPassword += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        // Passwort hashen
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Benutzer aktualisieren
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { password: hashedPassword },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        
        res.json({ 
            message: 'Passwort erfolgreich zurückgesetzt',
            newPassword: newPassword
        });
    } catch (error) {
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

module.exports = router;
