// /backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/loginModels');

const auth = async (req, res, next) => {
    try {
        // Token aus Cookies holen
        const token = req.cookies.auth_token;
        
        console.log('Auth Middleware - Pfad:', req.path);
        console.log('Auth Middleware - Token vorhanden:', !!token);
        
        if (!token) {
            console.log('Kein Token gefunden');
            
            // Bei API-Anfragen 401 zurückgeben
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({ message: 'Nicht authentifiziert' });
            }
            
            // Bei HTML-Seiten zur Login-Seite umleiten
            if (req.path.match(/^\/(dashboard|profile|admin)/)) {
                return res.redirect('/login');
            }
            
            // Bei Anfragen für statische Dateien 401 zurückgeben
            if (req.path.includes('-static/')) {
                return res.status(401).json({ message: 'Nicht authentifiziert' });
            }
            
            // Für andere Routen fortfahren (z.B. Login, Register)
            return next();
        }
        
        // Token verifizieren
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        
        console.log('Benutzer authentifiziert:', req.user._id);
        next();
    } catch (error) {
        console.error('Auth-Fehler:', error.message);
        
        // Bei abgelaufenem/ungültigem Token Cookie löschen
        res.clearCookie('auth_token');
        
        // Bei API-Anfragen 401 zurückgeben
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Bei HTML-Seiten zur Login-Seite umleiten
        if (req.path.match(/^\/(dashboard|profile|admin)/)) {
            return res.redirect('/login');
        }
        
        // Bei statischen Dateianfragen 401 zurückgeben
        if (req.path.includes('-static/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        next();
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        next();
    };
};

module.exports = { auth, checkRole };
