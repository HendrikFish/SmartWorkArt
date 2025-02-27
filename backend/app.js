const path = require('path');
require('dotenv').config();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');

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
    { route: '/profile-static', dir: '../frontend/profile' }
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

// MIME-Type Konfiguration für die statischen Dateien
app.use('/navbar-static', express.static(path.join(__dirname, '../frontend/navbar'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

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

// Login-Routen (öffentlich zugänglich)
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    const loginPath = path.join(__dirname, '../frontend/login/index.html');
    console.log('Sende Login-Seite:', loginPath);
    res.sendFile(loginPath);
});

// Statische Login-Dateien (öffentlich zugänglich)
app.use('/login-static', express.static(path.join(__dirname, '../frontend/login')));

// Auth-Check Middleware für geschützte Routen
app.use('/dashboard*', auth, (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
});

// Dashboard-Routen
app.get('/dashboard', auth, (req, res) => {
    console.log('Dashboard-Route aufgerufen, User:', req.user);
    if (!req.user) {
        console.log('Kein Benutzer gefunden, Weiterleitung zum Login');
        return res.redirect('/login');
    }
    console.log('Benutzer authentifiziert, Weiterleitung zum Dashboard');
    res.redirect('/dashboard-static/index.html');
});

// Statische Dashboard-Dateien (mit Auth)
app.use('/dashboard-static', auth, (req, res, next) => {
    console.log('Dashboard-Static-Route aufgerufen, User:', req.user);
    if (!req.user) {
        console.log('Kein Benutzer gefunden, Weiterleitung zum Login');
        return res.redirect('/login');
    }
    next();
}, express.static(path.join(__dirname, '../frontend/dashboard')));

// Profil-Route (nach der Dashboard-Route)
app.get('/profile', auth, (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/profile/index.html'));
});

// Statische Profil-Dateien
app.use('/profile-static', auth, (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    next();
}, express.static(path.join(__dirname, '../frontend/profile')));

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
// Statische Module für authentifizierte Benutzer
staticModules.forEach(({ route, dir }) => {
    if (route !== '/login-static') {
        app.use(route, auth, express.static(path.join(__dirname, dir)));
    }
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

