// Am Anfang des Dokuments, vor allen anderen Code
// Error-Handler für Ressourcen-Probleme
window.addEventListener('error', function(e) {
    const target = e.target;
    // Prüfe, ob der Fehler durch ein Ressourcen-Element verursacht wurde
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        console.error('Ressource konnte nicht geladen werden:', target.src || target.href);
        
        // Wenn es ein Authentifizierungsproblem sein könnte
        if (e.message && e.message.includes('401')) {
            console.error('Authentifizierungsfehler beim Laden von Ressourcen. Leite zur Login-Seite weiter...');
            // Kurze Verzögerung, damit die Konsole den Fehler anzeigen kann
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    }
}, true);

// Funktion zum Abrufen eines Cookie-Werts
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Am Anfang des dashboard.js
// Authentifizierungsstatus prüfen
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard wird geladen');
    
    // Prüfe, ob das nicht-httpOnly Cookie vorhanden ist
    const isLoggedIn = document.cookie.includes('logged_in=true');
    console.log('Logged-in Cookie gefunden:', isLoggedIn);
    
    // Auch lokalen Speicher für Benutzerinformationen prüfen
    const userInStorage = localStorage.getItem('user');
    console.log('Benutzer im lokalen Speicher:', !!userInStorage);
    
    if (!isLoggedIn && !userInStorage) {
        console.warn('Keine Anmeldehinweise gefunden, leite zum Login weiter');
        window.location.href = '/login';
        return;
    }
    
    // Testen, ob API-Zugriff funktioniert
    fetchAuthStatus();
    
    // Rest des Dashboard-Initialisierungscodes...
});

// Helfer-Funktion zum Testen des Auth-Status
async function fetchAuthStatus() {
    try {
        const response = await fetch('/api/auth/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            credentials: 'include'
        });
        
        console.log('Auth-Status-Antwort:', response.status);
        
        if (!response.ok) {
            console.error('Authentifizierung fehlgeschlagen, Status:', response.status);
            // Nur bei 401 zum Login weiterleiten
            if (response.status === 401) {
                console.warn('Nicht authentifiziert, leite zum Login weiter');
                // Cookies und localStorage bereinigen
                document.cookie = 'logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            return false;
        }
        
        const data = await response.json();
        console.log('Authentifiziert als:', data.user.email);
        return true;
    } catch (error) {
        console.error('Fehler beim Prüfen des Auth-Status:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Prüfe zu Beginn auf gültigen Auth-Token
        const authToken = getCookie('auth_token');
        if (!authToken) {
            console.warn('Kein Authentifizierungs-Token gefunden. Leite zur Login-Seite um...');
            window.location.href = '/login';
            return;
        }

        // Benutzerinformationen laden
        const userResponse = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (!userResponse.ok) {
            throw new Error('Nicht autorisiert');
        }
        
        const user = await userResponse.json();
        console.log('Benutzer geladen:', user);
        console.log('Erlaubte Module des Benutzers:', user.allowedModules);

        // Benutzerinformation anzeigen
        if (user.firstName && user.lastName) {
            document.getElementById('userInfo').textContent = 
                `${user.firstName} ${user.lastName} (${user.role})`;
        }

        // Module basierend auf Berechtigungen anzeigen
        const modulesGrid = document.getElementById('modulesGrid');
        if (!modulesGrid) {
            console.error('modulesGrid Element nicht gefunden');
            return;
        }
        
        // Definition aller verfügbaren Module
        const allModules = [
            {
                id: 'planung-static',
                icon: 'fa-calendar',
                title: 'Planung',
                description: 'Menüplanung und Zeitpläne'
            },
            {
                id: 'solo-static',
                icon: 'fa-user',
                title: 'Einzelplanung',
                description: 'Individuelle Planungen'
            },
            {
                id: 'soloPlan-static',
                icon: 'fa-calendar-alt',
                title: 'Solo Planung',
                description: 'Detaillierte Einzelplanung'
            },
            {
                id: 'soloSelect-static',
                icon: 'fa-list-ul',
                title: 'Solo Auswahl',
                description: 'Auswahl für Einzelplanung'
            },
            {
                id: 'rezepte-static',
                icon: 'fa-book',
                title: 'Rezepte',
                description: 'Verwaltung von Rezepten'
            },
            {
                id: 'zutaten-static',
                icon: 'fa-carrot',
                title: 'Zutaten',
                description: 'Verwaltung von Zutaten'
            },
            {
                id: 'order-static',
                icon: 'fa-shopping-cart',
                title: 'Bestellungen',
                description: 'Verwaltung von Bestellungen'
            },
            {
                id: 'menue-static',
                icon: 'fa-utensils',
                title: 'Menü',
                description: 'Menüverwaltung'
            },
            {
                id: 'customer-static',
                icon: 'fa-users',
                title: 'Benutzerverwaltung',
                description: 'Verwaltung von Benutzern'
            },
            {
                id: 'datenbank-static',
                icon: 'fa-database',
                title: 'Datenbank',
                description: 'Datenbankmanagement'
            },
            {
                id: 'einrichtungen-static',
                icon: 'fa-building',
                title: 'Einrichtungen',
                description: 'Verwaltung von Einrichtungen'
            }
        ];

        // Module filtern basierend auf Berechtigungen
        const allowedModules = allModules.filter(module => {
            console.log('Prüfe Modul:', module.id);
            
            // Standardmodule sind immer erlaubt
            if (module.id === 'order-static' || module.id === 'menue-static') {
                console.log('Standardmodul erlaubt:', module.id);
                return true;
            }
            
            // Admin sieht alles
            if (user.role === 'admin') {
                console.log('Admin hat Zugriff auf:', module.id);
                return true;
            }

            // Prüfe, ob das Modul in den erlaubten Modulen des Benutzers ist
            if (user.allowedModules && Array.isArray(user.allowedModules)) {
                const isAllowed = user.allowedModules.some(allowedModule => {
                    const normalizedAllowedModule = allowedModule.replace(/^\/|\/$/g, '');
                    const normalizedModuleId = module.id.replace(/^\/|\/$/g, '');
                    console.log('Vergleiche:', normalizedAllowedModule, 'mit', normalizedModuleId);
                    return normalizedAllowedModule === normalizedModuleId;
                });
                console.log('Modul', module.id, 'ist', isAllowed ? 'erlaubt' : 'nicht erlaubt');
                return isAllowed;
            }

            console.log('Keine allowedModules gefunden für:', module.id);
            return false;
        });

        console.log('User:', user);
        console.log('User erlaubte Module:', user.allowedModules);
        console.log('Gefilterte Module:', allowedModules);

        // Gefilterte Module anzeigen
        if (allowedModules.length === 0) {
            modulesGrid.innerHTML = '<p class="no-modules">Keine Module verfügbar.</p>';
        } else {
            modulesGrid.innerHTML = allowedModules.map(module => `
                <div class="module-card" tabindex="0" data-module="/${module.id}">
                    <div class="icon">
                        <i class="fas ${module.icon}"></i>
                    </div>
                    <h3>${module.title}</h3>
                    <p>${module.description}</p>
                    <span class="status-indicator status-online" title="Online"></span>
                </div>
            `).join('');
        }

        // Event Listener für Module
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const modulePath = card.dataset.module;
                window.location.href = modulePath;
            });
        });

        // Logout-Button Event Listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        window.location.href = '/login';
                    } else {
                        throw new Error('Logout fehlgeschlagen');
                    }
                } catch (error) {
                    console.error('Logout fehlgeschlagen:', error);
                    alert('Fehler beim Abmelden. Bitte versuchen Sie es erneut.');
                }
            });
        }

        // Profil-Button Event-Handler
        document.getElementById('profileBtn').addEventListener('click', function() {
            window.location.href = '/profile';
        });

    } catch (error) {
        console.error('Fehler beim Laden des Dashboards:', error);
        if (error.message === 'Nicht autorisiert') {
            window.location.href = '/login';
        } else {
            alert('Fehler beim Laden des Dashboards. Bitte laden Sie die Seite neu.');
        }
    }
}); 