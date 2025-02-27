const path = require('path');
require('dotenv').config();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const jwt = require('jsonwebtoken');

// Port aus .env oder Standard 8086
const PORT = process.env.PORT || 8086;


// Statische Module
const staticModules = [
    { route: '/planung-static', dir: '../frontend/plan' },
    { route: '/einrichtungen-static', dir: '../frontend/einrichtung' },
    { route: '/rezepte-static', dir: '../frontend/rezept' },
    { route: '/zutaten-static', dir: '../frontend/zutaten' },
    { route: '/order-static', dir: '../frontend/order' },
    { route: '/datenbank-static', dir: '../frontend/datenbank' },
    { route: '/calc-static', dir: '../frontend/calc' },
    { route: '/number-static', dir: '../frontend/number' },
    { route: '/menue-static', dir: '../frontend/menue' },
    { route: '/solo-static', dir: '../frontend/solo' },
    { route: '/soloPlan-static', dir: '../frontend/soloPlan' },
    { route: '/soloSelect-static', dir: '../frontend/soloSelect' },
    { route: '/login-static', dir: '../frontend/login' },
    { route: '/dashboard-static', dir: '../frontend/dashboard' },
    { route: '/customer-static', dir: '../frontend/customer' },
    { route: '/profile-static', dir: '../frontend/profile' },
    { route: '/register-static', dir: '../frontend/register' }
];

// Navbar-Konfiguration hinzufügen (nach den bestehenden staticModules)
const navbarModule = {
    route: '/navbar-static',
    dir: '../frontend/navbar'
};

// Zu den bestehenden staticModules hinzufügen
staticModules.push(navbarModule);

// Express App erstellen
const app = express();

// Basis Middleware
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

// Session-Konfiguration hinzufügen
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60, // Session-Gültigkeit in Sekunden (hier: 24 Stunden)
        autoRemove: 'native'
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // Cookie-Gültigkeit in Millisekunden
    }
}));

// CORS Middleware
app.use(cors({
    origin: [
        'https://smartworkart.onrender.com', // Render Backend
        'http://localhost:8086',            // Lokale Entwicklung
        process.env.FRONTEND_URL || '*'     // Dynamische Frontend-URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
}));


// Helmet Middleware mit angepasster CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://smartworkart.onrender.com", "http://localhost:8086", process.env.FRONTEND_URL || '*'],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));

// Korrigiere die statischen Dateien Middleware
const serveStatic = (directory, options = {}) => {
    return express.static(path.join(__dirname, directory), {
        setHeaders: (res, filePath) => {
            // Setze korrekte MIME-Types
            if (filePath.endsWith('.css')) {
                res.set('Content-Type', 'text/css');
            } else if (filePath.endsWith('.js')) {
                res.set('Content-Type', 'application/javascript');
            }
            // Weitere Header aus optionalen Parametern anwenden
            if (options.setHeaders) {
                options.setHeaders(res, filePath);
            }
        }
    });
};

// API-Routen registrieren
const einrichtungRoutes = require('./routes/einrichtungRoutes');
const datenbankRoutes = require('./routes/datenbankRoutes');
const rezepteRoutes = require('./routes/rezepteRoutes');
const zutatenRoutes = require('./routes/zutatenRoutes');
const planRoutes = require('./routes/planRoutes');
const calcRoutes = require('./routes/calcRoutes');
const orderRoutes = require('./routes/orderRoutes');
const numberRoutes = require('./routes/numberRoutes');
const menueRoutes = require('./routes/menueRoutes');
const soloRoutes = require('./routes/soloRoutes');
const soloPlanRoutes = require('./routes/soloPlanRoutes');
const soloSelectRoutes = require('./routes/soloSelectRoutes');
const loginRoutes = require('./routes/loginRoutes');
const customRoutes = require('./routes/customRoutes');
const { auth, checkRole } = require('./middleware/auth');

// API-Routen registrieren
app.use('/api/auth', loginRoutes);
app.use('/api', customRoutes);

// Root-Route verbessern
app.get('/', (req, res) => {
    // Prüfen, ob ein gültiger Auth-Token vorhanden ist
    const authToken = req.cookies.auth_token;
    
    if (authToken) {
        try {
            // Token validieren
            const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
            console.log('Root-Route: Gültiges Token für Benutzer:', decoded.user._id);
            
            // Wenn das Token gültig ist, zum Dashboard weiterleiten
            return res.redirect('/dashboard');
        } catch (error) {
            console.error('Root-Route: Ungültiges Token:', error.message);
            // Bei ungültigem Token Cookie löschen
            res.clearCookie('auth_token');
        }
    }
    
    console.log('Root-Route: Kein gültiges Token, Weiterleitung zu /login');
    // Wenn kein Token oder ungültiges Token, zum Login weiterleiten
    res.redirect('/login');
});

// Login-Route verbessern
app.get('/login', (req, res) => {
    // Prüfen, ob bereits ein gültiger Auth-Token vorhanden ist
    const authToken = req.cookies.auth_token;
    
    if (authToken) {
        try {
            // Token validieren
            const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
            console.log('Login-Route: Benutzer bereits angemeldet:', decoded.user._id);
            
            // Wenn das Token gültig ist, zum Dashboard weiterleiten
            return res.redirect('/dashboard');
        } catch (error) {
            console.error('Login-Route: Ungültiges Token:', error.message);
            // Bei ungültigem Token Cookie löschen
            res.clearCookie('auth_token');
        }
    }
    
    // Ansonsten Login-Seite anzeigen
    console.log('Login-Route: Zeige Login-Seite');
    res.sendFile(path.join(__dirname, '../frontend/login/index.html'));
});

// Registriere statische Pfade ohne Authentifizierung
app.use('/login-static', serveStatic('../frontend/login'));
app.use('/register-static', serveStatic('../frontend/register'));

// Auth-Check Middleware für geschützte Routen
app.use('/dashboard*', auth, (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
});

// Verbesserte HTML-Routen mit explizitem Handling für Trailing Slash
app.get(['/dashboard', '/dashboard/'], (req, res) => {
    const authToken = req.cookies.auth_token;
    
    // Debug-Ausgabe
    console.log('Dashboard-Zugriff, Auth-Token vorhanden:', !!authToken);
    
    if (!authToken) {
        console.log('Kein Auth-Token gefunden, Weiterleitung zu /login');
        return res.redirect('/login');
    }
    
    // Token validieren
    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        console.log('Token erfolgreich validiert für Benutzer-ID:', decoded.user._id);
        res.sendFile(path.join(__dirname, '../frontend/dashboard/index.html'));
    } catch (error) {
        console.error('Ungültiger Token:', error.message);
        res.clearCookie('auth_token');
        res.redirect('/login');
    }
});

// Registriere geschützte statische Pfade mit Authentifizierung
app.use('/dashboard-static', auth, (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
    }
    next();
}, serveStatic('../frontend/dashboard'));

// Profil-Route (nach der Dashboard-Route)
app.get('/profile', (req, res) => {
    const authToken = req.cookies.auth_token;
    if (!authToken) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/profile/index.html'));
});

// Registriere geschützte statische Pfade mit Authentifizierung
app.use('/profile-static', auth, (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
    }
    next();
}, serveStatic('../frontend/profile'));

// Geschützte API-Routen
app.use('/api/einrichtungen', auth, einrichtungRoutes);
app.use('/api/datenbank', auth, datenbankRoutes);
app.use('/api/rezepte', auth, rezepteRoutes);
app.use('/api/zutaten', auth, zutatenRoutes);
app.use('/api/plan', auth, planRoutes);
app.use('/api/calc', auth, calcRoutes);
app.use('/api/orders', auth, orderRoutes);
app.use('/api/numbers', auth, numberRoutes);
app.use('/api/menue', auth, menueRoutes);
app.use('/api/solo', auth, soloRoutes);
app.use('/api/soloplan', auth, soloPlanRoutes);
app.use('/api/soloselect', auth, soloSelectRoutes);
app.use('/api', auth, customRoutes);
app.use('/soloplan/config', express.static(path.join(__dirname, 'data/solo/config')));

// Behandle restliche statische Module über die Liste
staticModules.forEach(module => {
    // Überspringe bereits definierte Module
    if (['/login-static', '/register-static', '/dashboard-static', '/profile-static'].includes(module.route)) {
        return;
    }
    
    app.use(module.route, auth, (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Nicht authentifiziert' });
        }
        next();
    }, serveStatic(module.dir));
});

// Benutzerverwaltungs-Route (nur für Admins)
app.get('/customer', auth, checkRole(['admin']), (req, res) => {
    const customerPath = path.join(__dirname, '../frontend/customer/index.html');
    res.sendFile(customerPath);
});

// Error Handler für 404
app.use((req, res, next) => {
    console.log('404 für Route:', req.url);
    res.status(404).send('Seite nicht gefunden');
});

// Globale Fehlerbehandlung
app.use((err, req, res, next) => {
    console.error('Server Fehler:', err);
    res.status(500).send('Interner Server Fehler');
});

// Nach der Registrierung aller Routen
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
    } else if (r.name === 'router') {
        r.handle.stack.forEach(function(h){
            if (h.route){
                console.log(`${Object.keys(h.route.methods)} ${r.regexp} ${h.route.path}`);
            }
        });
    }
});

// Server starten
async function startServer() {
    try {
        // Datenbankverbindung herstellen
        await connectDB();

        // Server starten
        app.listen(PORT, () => {
            console.log(`=================================`);
            console.log(`Server läuft auf Port ${PORT}`);
            console.log(`API-Endpunkte verfügbar unter:`);
            console.log(`- /api/einrichtungen`);
            console.log(`Statische Dateien:`);
            staticModules.forEach(({ route }) => {
                console.log(`- ${route}`);
            });
        });
    } catch (error) {
        console.error('Fehler beim Serverstart:', error);
        process.exit(1);
    }
}

// Server starten
startServer();

