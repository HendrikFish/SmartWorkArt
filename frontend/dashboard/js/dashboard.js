document.addEventListener('DOMContentLoaded', async () => {
    try {
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

    } catch (error) {
        console.error('Fehler beim Laden des Dashboards:', error);
        if (error.message === 'Nicht autorisiert') {
            window.location.href = '/login';
        } else {
            alert('Fehler beim Laden des Dashboards. Bitte laden Sie die Seite neu.');
        }
    }
}); 