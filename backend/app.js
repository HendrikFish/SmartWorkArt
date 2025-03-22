const path = require('path');
require('dotenv').config();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const multer = require('multer');
const fs = require('fs');
const { promisify } = require('util');

// Port aus .env oder Standard 8086
const PORT = process.env.PORT || 8086;

// Importiere Konfiguration
const config = require('./config/config');

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
    { route: '/soloMenue-static', dir: '../frontend/soloMenue' },
    { route: '/login-static', dir: '../frontend/login' },
    { route: '/dashboard-static', dir: '../frontend/dashboard' },
    { route: '/customer-static', dir: '../frontend/customer' },
    { route: '/profile-static', dir: '../frontend/profile' },
    { route: '/frontpage-static', dir: '../frontend/frontpage' }
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
        config.API_BASE_URL, // Produktions-URL oder lokale Entwicklung, je nach Umgebung
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
            connectSrc: ["'self'", config.API_BASE_URL, process.env.FRONTEND_URL || '*'],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));

// Korrigierte Konfiguration für statische Dateien
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Statische Dateien im Wurzelverzeichnis (für Startseite)
app.use(express.static(path.join(__dirname, '..'), {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Explizite Route für styles.css mit korrektem MIME-Typ
app.get('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '../styles.css'));
});

// Explizite Route für app.js mit korrektem MIME-Typ
app.get('/app.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '../app.js'));
});

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
const soloMenueRoutes = require('./routes/soloMenueRoutes');
const loginRoutes = require('./routes/loginRoutes');
const customRoutes = require('./routes/customRoutes');
const { auth, checkRole } = require('./middleware/auth');

// API-Routen registrieren
app.use('/api/auth', loginRoutes);
app.use('/api', customRoutes);

// Frontpage-Route (öffentlich zugänglich)
app.get('/', (req, res) => {
    const frontpagePath = path.join(__dirname, '../index.html');
    res.sendFile(frontpagePath);
});

// Statische Frontpage-Dateien (öffentlich zugänglich)
app.use('/frontpage-static', express.static(path.join(__dirname, '..')));

// Login-Route
app.get('/login', (req, res) => {
    const loginPath = path.join(__dirname, '../frontend/login/index.html');
    res.sendFile(loginPath);
});

// Explizite Routen für Login CSS und JS mit korrektem MIME-Typ
app.get('/login-static/css/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '../frontend/login/css/styles.css'));
});

app.get('/login-static/js/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '../frontend/login/js/script.js'));
});

// Geschützte API-Routen mit konditioneller Authentifizierung im Entwicklungsmodus
const conditionalAuth = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        // Im Entwicklungsmodus Authentifizierung überspringen
        return next();
    }
    // In Produktion normale Authentifizierung verwenden
    return auth(req, res, next);
};

// Auth-Check Middleware für geschützte Routen (mit Entwicklungsmodus-Ausnahme)
app.use('/dashboard*', conditionalAuth, (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        return next(); // Im Entwicklungsmodus weitermachen ohne Authentifizierungsprüfung
    }
    
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
});

// Dashboard-Routen
app.get('/dashboard', conditionalAuth, (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
        // Im Entwicklungsmodus direkt zum Dashboard ohne Authentifizierungsprüfung
        return res.redirect('/dashboard-static/index.html');
    }
    
    console.log('Dashboard-Route aufgerufen, User:', req.user);
    if (!req.user) {
        console.log('Kein Benutzer gefunden, Weiterleitung zum Login');
        return res.redirect('/login');
    }
    console.log('Benutzer authentifiziert, Weiterleitung zum Dashboard');
    res.redirect('/dashboard-static/index.html');
});

// Statische Dashboard-Dateien (mit konditioneller Auth)
app.use('/dashboard-static', conditionalAuth, (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        return next(); // Im Entwicklungsmodus weitermachen ohne Authentifizierungsprüfung
    }
    
    console.log('Dashboard-Static-Route aufgerufen, User:', req.user);
    if (!req.user) {
        console.log('Kein Benutzer gefunden, Weiterleitung zum Login');
        return res.redirect('/login');
    }
    next();
}, express.static(path.join(__dirname, '../frontend/dashboard')));

// Profil-Route (nach der Dashboard-Route)
app.get('/profile', conditionalAuth, (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
        // Im Entwicklungsmodus direkt zum Profil ohne Authentifizierungsprüfung
        return res.sendFile(path.join(__dirname, '../frontend/profile/index.html'));
    }
    
    if (!req.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/profile/index.html'));
});

// Statische Profil-Dateien
app.use('/profile-static', conditionalAuth, (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        return next(); // Im Entwicklungsmodus weitermachen ohne Authentifizierungsprüfung
    }
    
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
}, express.static(path.join(__dirname, '../frontend/profile')));

// API-Routen mit konditioneller Authentifizierung
app.use('/api/einrichtungen', conditionalAuth, einrichtungRoutes);
app.use('/api/datenbank', conditionalAuth, datenbankRoutes);
app.use('/api/rezepte', conditionalAuth, rezepteRoutes);
app.use('/api/zutaten', conditionalAuth, zutatenRoutes);
app.use('/api/plan', conditionalAuth, planRoutes);
app.use('/api/calc', conditionalAuth, calcRoutes);
app.use('/api/orders', conditionalAuth, orderRoutes);
app.use('/api/numbers', conditionalAuth, numberRoutes);
app.use('/api/menue', conditionalAuth, menueRoutes);
app.use('/api/solo', conditionalAuth, soloRoutes);
app.use('/api/soloplan', conditionalAuth, soloPlanRoutes);
app.use('/api/soloselect', conditionalAuth, soloSelectRoutes);
app.use('/api/solomenue', conditionalAuth, soloMenueRoutes);

// Direkter File-API Endpunkt für Bewohnerdaten (Fallback zum Speichern)
app.post('/api/bewohner-save-direct', conditionalAuth, async (req, res) => {
    try {
        const { name, data } = req.body;
        
        if (!name || !data) {
            return res.status(400).json({ 
                error: 'Fehlerhafte Anfrage',
                message: 'Name und Daten müssen angegeben werden' 
            });
        }
        
        console.log(`[BACKEND] Direktes Speichern angefordert für Bewohner: ${name}`);
        
        // Verwende den verbesserten updateBewohner-Controller
        req.params = { bewohnerName: name };
        req.body = data;
        
        return soloMenueController.updateBewohner(req, res);
    } catch (error) {
        console.error('Fehler beim direkten Speichern der Bewohnerdaten:', error);
        res.status(500).json({ 
            error: 'Serverfehler',
            message: `Ein unerwarteter Fehler ist aufgetreten: ${error.message}`
        });
    }
});

// Multer für Datei-Uploads konfigurieren
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// Formular-Upload für Bewohnerdaten (zweiter Fallback)
app.post('/api/upload-bewohner', conditionalAuth, upload.single('bewohnerFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Keine Datei',
                message: 'Es wurde keine Datei hochgeladen.' 
            });
        }
        
        const bewohnerName = req.body.bewohnerName;
        if (!bewohnerName) {
            return res.status(400).json({ 
                error: 'Kein Bewohnername',
                message: 'Es wurde kein Bewohnername angegeben.' 
            });
        }
        
        console.log(`[BACKEND] Datei-Upload angefordert für Bewohner: ${bewohnerName}`);
        
        // JSON-Datei parsen
        try {
            const bewohnerDaten = JSON.parse(req.file.buffer.toString('utf8'));
            console.log(`[BACKEND] Upload-Datei erfolgreich geparst für: ${bewohnerName}`);
            
            // Verwende den verbesserten updateBewohner-Controller
            req.params = { bewohnerName };
            req.body = bewohnerDaten;
            
            return soloMenueController.updateBewohner(req, res);
        } catch (parseError) {
            console.error('Fehler beim Parsen der JSON-Datei:', parseError);
            return res.status(400).json({ 
                error: 'Ungültiges JSON',
                message: 'Die hochgeladene Datei enthält kein gültiges JSON.' 
            });
        }
    } catch (error) {
        console.error('Fehler beim Upload der Bewohnerdaten:', error);
        res.status(500).json({ 
            error: 'Serverfehler',
            message: `Ein unerwarteter Fehler ist aufgetreten: ${error.message}`
        });
    }
});

app.use('/api', conditionalAuth, customRoutes);
app.use('/soloplan/config', express.static(path.join(__dirname, 'data/solo/config')));

// Für jede statische Route
staticModules.forEach(module => {
    // Login-Ressourcen sollten öffentlich zugänglich sein
    if (module.route === '/login-static' || process.env.NODE_ENV !== 'production') {
        // Im Entwicklungsmodus (NODE_ENV !== 'production') oder für Login keine Authentifizierung erforderlich
        app.use(module.route, express.static(path.join(__dirname, module.dir), {
            setHeaders: (res, path, stat) => {
                if (path.endsWith('.css')) {
                    res.set('Content-Type', 'text/css');
                    // Im Entwicklungsmodus Cache-Kontrolle deaktivieren
                    if (process.env.NODE_ENV !== 'production') {
                        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                        res.set('Pragma', 'no-cache');
                        res.set('Expires', '0');
                    }
                } else if (path.endsWith('.js')) {
                    res.set('Content-Type', 'application/javascript');
                    // Im Entwicklungsmodus Cache-Kontrolle deaktivieren
                    if (process.env.NODE_ENV !== 'production') {
                        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                        res.set('Pragma', 'no-cache');
                        res.set('Expires', '0');
                    }
                }
            }
        }));
    } else {
        // Alle anderen statischen Ressourcen erfordern Authentifizierung im Produktionsmodus
        app.use(module.route, conditionalAuth, (req, res, next) => {
            if (!req.user) {
                return res.redirect('/login');
            }
            next();
        }, express.static(path.join(__dirname, module.dir), {
            setHeaders: (res, path, stat) => {
                if (path.endsWith('.css')) {
                    res.set('Content-Type', 'text/css');
                    // Im Entwicklungsmodus Cache-Kontrolle deaktivieren
                    if (process.env.NODE_ENV !== 'production') {
                        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                        res.set('Pragma', 'no-cache');
                        res.set('Expires', '0');
                    }
                } else if (path.endsWith('.js')) {
                    res.set('Content-Type', 'application/javascript');
                    // Im Entwicklungsmodus Cache-Kontrolle deaktivieren
                    if (process.env.NODE_ENV !== 'production') {
                        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                        res.set('Pragma', 'no-cache');
                        res.set('Expires', '0');
                    }
                }
            }
        }));
    }
});

// Benutzerverwaltungs-Route (nur für Admins)
app.get('/customer', conditionalAuth, checkRole(['admin']), (req, res) => {
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
            console.log(`- /api/solomenue`);
            console.log(`Statische Dateien:`);
            staticModules.forEach(({ route }) => {
                console.log(`- ${route}`);
            });
            console.log(`=================================`);
        });
    } catch (error) {
        console.error(`Server-Fehler: ${error.message}`);
        process.exit(1);
    }
}

// Server starten
startServer();

