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
        const { email, password } = req.body;
        
        console.log('Login-Versuch für:', email);
        
        // Benutzer finden
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('Benutzer nicht gefunden:', email);
            return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
        }
        
        if (!user.isApproved) {
            console.log('Benutzer nicht genehmigt:', email);
            return res.status(401).json({ message: 'Ihr Konto wurde noch nicht genehmigt' });
        }
        
        // Passwort überprüfen
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            console.log('Passwort falsch für:', email);
            return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
        }
        
        // Aktualisiere lastLogin
        user.lastLogin = new Date();
        await user.save();
        
        console.log('Login erfolgreich für:', email);
        
        // JWT-Token erstellen
        const payload = {
            user: {
                _id: user._id,
                role: user.role
            }
        };
        
        // Token direkt generieren ohne callback
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // Debug-Info
        console.log('Token generiert, Länge:', token.length);
        
        // Token als Cookie setzen mit absolut einfachsten Einstellungen für Entwicklung
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Für Entwicklung auf false setzen
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 1 Tag
        });
        
        console.log('Cookie gesetzt für Benutzer:', email);
        
        // Bei erfolgreicher Anmeldung auch ein Nicht-HttpOnly-Cookie setzen
        // für Frontend-Validierung
        res.cookie('logged_in', 'true', {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        // Erfolgreiche Antwort senden
        res.json({
            message: 'Login erfolgreich',
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.status(500).json({ message: 'Serverfehler: ' + error.message });
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
        
        // Debug: Prüfe Eingabedaten (ohne Passwörter zu loggen)
        console.log('Eingaben vorhanden:', {
            hatCurrentPassword: !!currentPassword,
            hatNewPassword: !!newPassword,
            newPasswordLength: newPassword ? newPassword.length : 0
        });
        
        // Validierung
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Aktuelles und neues Passwort sind erforderlich' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' });
        }
        
        console.log('Suche Benutzer in der Datenbank mit ID:', req.user._id);
        // Benutzer finden
        const user = await User.findById(req.user._id);
        if (!user) {
            console.error('Benutzer nicht gefunden mit ID:', req.user._id);
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        
        console.log('Benutzer gefunden, überprüfe aktuelles Passwort');
        // Aktuelles Passwort überprüfen
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        console.log('Passwort-Vergleich Ergebnis:', isMatch);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Aktuelles Passwort ist falsch' });
        }
        
        console.log('Setze neues Passwort');
        // Neues Passwort setzen
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log('Hash erstellt. HashLength:', hashedPassword.length);
        
        // Password direkt setzen statt User-Objekt zu modifizieren
        const updateResult = await User.updateOne(
            { _id: req.user._id }, 
            { $set: { password: hashedPassword } }
        );
        
        console.log('Update-Ergebnis:', updateResult);
        
        if (updateResult.modifiedCount !== 1) {
            console.error('Problem beim Speichern des Passworts. ModifiedCount:', updateResult.modifiedCount);
            return res.status(500).json({ message: 'Passwort konnte nicht aktualisiert werden' });
        }
        
        console.log('Passwort erfolgreich geändert');
        res.json({ message: 'Passwort erfolgreich geändert' });
    } catch (error) {
        console.error('Fehler beim Ändern des Passworts:', error);
        res.status(500).json({ message: 'Interner Server Fehler: ' + error.message });
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

// Neuer Endpoint zum Prüfen des Auth-Status
router.get('/status', auth, async (req, res) => {
    try {
        console.log('Auth-Status-Anfrage von Benutzer-ID:', req.user._id);
        
        // Benutzer in DB suchen, um aktuelle Informationen zu erhalten
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            console.log('Benutzer nicht in Datenbank gefunden, trotz gültigem Token');
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        
        // Erfolgreiche Antwort senden
        res.json({ 
            authenticated: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Fehler beim Abrufen des Auth-Status:', error);
        res.status(500).json({ message: 'Serverfehler' });
    }
});

module.exports = router;
