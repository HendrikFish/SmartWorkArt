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
    { route: '/profile-static', dir: '../frontend/profile' },
    { route: '/visit-static', dir: '../frontend/visit' }
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

// Visit-Route (öffentlich zugänglich)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/visit/index.html'));
});

app.get('/visit', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/visit/index.html'));
});

// Statische Visit-Dateien (öffentlich zugänglich) - mit korrekter MIME-Typ-Konfiguration
app.use('/visit-static', express.static(path.join(__dirname, '../frontend/visit'), {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Root-Route für Zugriff auf Ressourcen im Root-Verzeichnis
app.use(express.static(path.join(__dirname, '../frontend/visit'), {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Login-Routen (weiterhin öffentlich zugänglich, aber nicht mehr der Einstiegspunkt)
app.get('/login', (req, res) => {
    const loginPath = path.join(__dirname, '../frontend/login/index.html');
    console.log('Sende Login-Seite:', loginPath);
    res.sendFile(loginPath);
});

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

// Für jede statische Route
staticModules.forEach(module => {
    app.use(module.route, auth, (req, res, next) => {
        if (!req.user) {
            return res.redirect('/login');
        }
        next();
    }, express.static(path.join(__dirname, module.dir), {
        setHeaders: (res, path, stat) => {
            if (path.endsWith('.css')) {
                res.set('Content-Type', 'text/css');
            } else if (path.endsWith('.js')) {
                res.set('Content-Type', 'application/javascript');
            }
        }
    }));
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

