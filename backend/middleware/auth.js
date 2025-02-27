// /backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/loginModels');

const auth = async (req, res, next) => {
    // Statischen Login-Bereich immer durchlassen
    if (req.path.startsWith('/login-static/')) {
        return next();
    }
    
    // Token aus Cookies holen
    const token = req.cookies.auth_token;
    
    console.log('Auth Middleware - Pfad:', req.path);
    console.log('Auth Middleware - Token vorhanden:', !!token);
    
    // Keine automatischen Weiterleitungen für API-Routen
    if (!token) {
        // Bei API-Anfragen 401 zurückgeben
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Bei statischen Dateien 401 zurückgeben
        if (req.path.includes('-static/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Bei HTML-Routen zum Login umleiten, ABER NUR wenn es nicht /login ist
        if (req.path.match(/^\/(dashboard|profile|admin)/) && !req.path.startsWith('/login')) {
            console.log('Nicht authentifiziert, leite weiter zu /login');
            return res.redirect('/login');
        }
        
        // Andere Routen einfach durchlassen
        return next();
    }
    
    try {
        // Token verifizieren
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        
        console.log('Benutzer authentifiziert:', req.user._id);
        next();
    } catch (error) {
        console.error('Token ungültig:', error.message);
        res.clearCookie('auth_token');
        
        // Bei API-Anfragen 401 zurückgeben
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Bei statischen Dateien 401 zurückgeben
        if (req.path.includes('-static/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Bei HTML-Routen zum Login umleiten, ABER NUR wenn es nicht /login ist
        if (req.path.match(/^\/(dashboard|profile|admin)/) && !req.path.startsWith('/login')) {
            console.log('Token ungültig, leite weiter zu /login');
            return res.redirect('/login');
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
