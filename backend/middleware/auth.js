// /backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/loginModels');

module.exports = (req, res, next) => {
    // Öffentliche Routen immer durchlassen
    if (
        req.path === '/login' || 
        req.path === '/register' || 
        req.path === '/' || 
        req.path.startsWith('/login-static/') || 
        req.path.startsWith('/register-static/')
    ) {
        return next();
    }
    
    // Token aus Cookies holen
    const token = req.cookies.auth_token;
    
    console.log('Auth-Check für Pfad:', req.path, '- Token vorhanden:', !!token);
    
    if (!token) {
        // Bei API-Anfragen 401 zurückgeben
        if (req.path.startsWith('/api/')) {
            console.log('API-Aufruf ohne Token, sende 401');
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Bei Dashboard-Pfad zur Login-Seite umleiten
        if (req.path.startsWith('/dashboard')) {
            console.log('Dashboard-Zugriff ohne Token, Umleitung zu /login');
            return res.redirect('/login');
        }
        
        // Bei statischen Ressourcen 401 zurückgeben
        if (req.path.includes('-static/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Andere Pfade durchlassen
        return next();
    }
    
    // Token validieren
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        
        console.log('Token erfolgreich validiert für Benutzer:', req.user._id);
        return next();
    } catch (error) {
        console.error('Token-Validierungsfehler:', error.message);
        
        // Cookie löschen bei Fehler
        res.clearCookie('auth_token', { path: '/' });
        res.clearCookie('logged_in', { path: '/' });
        
        // Bei API-Anfragen 401 zurückgeben
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                message: 'Nicht authentifiziert',
                error: error.message 
            });
        }
        
        // Bei Dashboard-Pfad zur Login-Seite umleiten
        if (req.path.startsWith('/dashboard')) {
            return res.redirect('/login');
        }
        
        // Bei statischen Ressourcen 401 zurückgeben
        if (req.path.includes('-static/')) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        
        // Andere Pfade durchlassen
        return next();
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

module.exports = { auth: module.exports, checkRole };
