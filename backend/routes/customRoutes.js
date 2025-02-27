const express = require('express');
const router = express.Router();
const User = require('../models/loginModels');
const bcrypt = require('bcryptjs');
const { auth, checkRole } = require('../middleware/auth');

// Alle Benutzer abrufen (nur für Admins)
router.get('/customers', auth, checkRole(['admin']), async (req, res) => {
    try {
        const customers = await User.find()
            .select('-password')
            .sort({ registrationDate: -1 });
        res.json(customers);
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzer nach Status filtern (nur für Admins)
router.get('/customers/status/:status', auth, checkRole(['admin']), async (req, res) => {
    try {
        let query = {};
        if (req.params.status === 'pending') {
            query.isApproved = false;
        } else if (req.params.status === 'approved') {
            query.isApproved = true;
        }

        const customers = await User.find(query)
            .select('-password')
            .sort({ registrationDate: -1 });
        res.json(customers);
    } catch (error) {
        console.error('Fehler beim Filtern der Benutzer:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Einzelnen Benutzer abrufen
router.get('/customers/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const customer = await User.findById(req.params.id).select('-password');
        if (!customer) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        res.json(customer);
    } catch (error) {
        console.error('Fehler beim Abrufen des Benutzers:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzer-Status aktualisieren (Genehmigung/Ablehnung)
router.put('/customers/:id/status', auth, checkRole(['admin']), async (req, res) => {
    try {
        const { status, role, notes } = req.body;
        const isApproved = status === 'approved';

        const customer = await User.findByIdAndUpdate(
            req.params.id,
            { 
                isApproved,
                role: isApproved ? (role || 'user') : 'user',
                notes
            },
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Benutzerstatus:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzer löschen
router.delete('/customers/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const customer = await User.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        res.json({ message: 'Benutzer erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzerstatistiken abrufen
router.get('/customers-stats', auth, checkRole(['admin']), async (req, res) => {
    try {
        const stats = {
            total: await User.countDocuments(),
            pending: await User.countDocuments({ isApproved: false }),
            approved: await User.countDocuments({ isApproved: true })
        };
        res.json(stats);
    } catch (error) {
        console.error('Fehler beim Abrufen der Statistiken:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzer auflisten - Admin sieht alle, Co-Admin sieht alle aus seiner Einrichtung, Benutzer sieht nur sich selbst
router.get('/users', auth, async (req, res) => {
    try {
        let query = {};
        
        // Berechtigungsbasierte Filterung
        if (req.user.role === 'admin') {
            // Admin sieht alle Benutzer
            query = {};
        } else if (req.user.role === 'co-admin') {
            // Co-Admin sieht nur Benutzer seiner Einrichtung
            query = { facility: req.user.facility };
        } else {
            // Normale Benutzer sehen nur sich selbst
            query = { _id: req.user._id };
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ registrationDate: -1 });
        res.json(users);
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzer aktualisieren - Admin kann alles, Co-Admin nur in seiner Einrichtung
router.put('/users/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { isApproved, role, notes } = req.body;

        // Benutzer finden
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        // Berechtigungsprüfung
        if (req.user.role === 'admin') {
            // Admin darf alles ändern
        } else if (req.user.role === 'co-admin') {
            // Co-Admin darf nur Benutzer seiner Einrichtung ändern
            if (userToUpdate.facility !== req.user.facility) {
                return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
            }
            // Co-Admin darf keine Admins erstellen
            if (role === 'admin') {
                return res.status(403).json({ message: 'Keine Berechtigung zum Erstellen von Administratoren' });
            }
        } else {
            // Normale Benutzer dürfen nur ihre eigenen Notizen ändern
            if (userToUpdate._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
            }
            // Nur Notizen erlaubt
            if (isApproved !== undefined || role !== undefined) {
                return res.status(403).json({ message: 'Keine Berechtigung zum Ändern dieser Felder' });
            }
        }

        // Aktualisierung der erlaubten Felder
        const updateData = {};
        if (req.user.role === 'admin' || req.user.role === 'co-admin') {
            if (typeof isApproved === 'boolean') updateData.isApproved = isApproved;
            if (role && req.user.role === 'admin') updateData.role = role;
        }
        if (notes !== undefined) updateData.notes = notes;

        // Benutzer aktualisieren
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Benutzers:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Benutzer löschen - nur Admin und Co-Admin (in seiner Einrichtung)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Benutzer finden
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        // Berechtigungsprüfung
        if (req.user.role === 'admin') {
            // Admin darf jeden löschen
        } else if (req.user.role === 'co-admin') {
            // Co-Admin darf nur Benutzer seiner Einrichtung löschen
            if (userToDelete.facility !== req.user.facility) {
                return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
            }
            // Co-Admin darf keine Admins oder andere Co-Admins löschen
            if (userToDelete.role === 'admin' || userToDelete.role === 'co-admin') {
                return res.status(403).json({ message: 'Keine Berechtigung zum Löschen von Administratoren' });
            }
        } else {
            // Normale Benutzer dürfen niemanden löschen
            return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
        }

        // Benutzer löschen
        await User.findByIdAndDelete(id);
        res.json({ message: 'Benutzer erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

// Statistiken abrufen - Admin sieht alle, Co-Admin nur seine Einrichtung
router.get('/users-stats', auth, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'co-admin') {
            query.facility = req.user.facility;
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Keine Berechtigung für diese Aktion' });
        }

        const stats = {
            total: await User.countDocuments(query),
            pending: await User.countDocuments({ ...query, isApproved: false }),
            approved: await User.countDocuments({ ...query, isApproved: true })
        };
        res.json(stats);
    } catch (error) {
        console.error('Fehler beim Abrufen der Statistiken:', error);
        res.status(500).json({ message: 'Interner Server Fehler' });
    }
});

module.exports = router; 