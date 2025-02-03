// /backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/loginModels');

const auth = async (req, res, next) => {
    try {
        console.log('Auth-Middleware aufgerufen');
        console.log('Cookies:', req.cookies);
        
        const token = req.cookies.token;
        
        if (!token) {
            console.log('Kein Token gefunden');
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }

        console.log('Token gefunden, verifiziere...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verifiziert:', decoded);

        // Benutzer mit allen relevanten Feldern laden, aber ohne Passwort
        const user = await User.findById(decoded.userId)
            .select('-password')
            .lean();  // Für bessere Performance
        
        if (!user) {
            console.log('Benutzer nicht in der Datenbank gefunden');
            res.clearCookie('token');
            return res.status(401).json({ message: 'Benutzer nicht gefunden' });
        }

        if (!user.isApproved) {
            console.log('Benutzer nicht freigegeben');
            res.clearCookie('token');
            return res.status(401).json({ message: 'Account nicht freigegeben' });
        }

        console.log('Benutzer gefunden:', user.email);
        req.user = {
            _id: user._id,
            userId: user._id,
            email: user.email,
            role: user.role,
            facility: user.facility,
            allowedFacilities: user.allowedFacilities,
            allowedModules: user.allowedModules,
            permissions: user.permissions
        };
        next();
    } catch (error) {
        console.error('Auth-Middleware-Fehler:', error);
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return res.status(401).json({ message: 'Nicht authentifiziert' });
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
