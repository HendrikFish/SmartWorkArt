document.addEventListener('DOMContentLoaded', function() {
    // Navigationsbutton
    document.getElementById('backToDashboard').addEventListener('click', function() {
        window.location.href = '/dashboard';
    });

    // Benutzerdaten laden
    loadUserProfile();

    // Formulare initialisieren
    initForms();
});

// Benutzerprofil laden
async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Fehler beim Laden des Profils');
        }

        const userData = await response.json();
        displayUserData(userData);
        displayUserModules(userData.allowedModules);
    } catch (error) {
        console.error('Fehler beim Laden des Profils:', error);
        showMessage('profileUpdateMessage', 'Fehler beim Laden der Profildaten', 'error');
    }
}

// Benutzerdaten anzeigen
function displayUserData(userData) {
    // Persönliche Daten
    document.getElementById('firstName').value = userData.firstName || '';
    document.getElementById('lastName').value = userData.lastName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phoneNumber').value = userData.phoneNumber || '';
    
    // Berufliche Daten
    document.getElementById('employer').value = userData.employer || '';
    document.getElementById('position').value = userData.position || '';
    document.getElementById('facility').value = userData.facility || '';
    
    // Rolle übersetzen und anzeigen
    let roleText = 'Benutzer';
    if (userData.role === 'admin') roleText = 'Administrator';
    else if (userData.role === 'co-admin') roleText = 'Co-Administrator';
    document.getElementById('role').value = roleText;
}

// Module anzeigen
function displayUserModules(modules) {
    const modulesContainer = document.getElementById('userModules');
    modulesContainer.innerHTML = '';
    
    if (!modules || modules.length === 0) {
        const noModulesMessage = document.createElement('p');
        noModulesMessage.textContent = 'Keine Module zugewiesen';
        modulesContainer.appendChild(noModulesMessage);
        return;
    }
    
    // Module-Daten für die Anzeige
    const moduleInfo = {
        '/planung-static/': { name: 'Planung', icon: 'fa-calendar-alt' },
        '/einrichtungen-static/': { name: 'Einrichtungen', icon: 'fa-building' },
        '/rezepte-static/': { name: 'Rezepte', icon: 'fa-utensils' },
        '/zutaten-static/': { name: 'Zutaten', icon: 'fa-carrot' },
        '/order-static/': { name: 'Bestellungen', icon: 'fa-shopping-cart' },
        '/datenbank-static/': { name: 'Datenbank', icon: 'fa-database' },
        '/calc-static/': { name: 'Kalkulation', icon: 'fa-calculator' },
        '/number-static/': { name: 'Nummern', icon: 'fa-hashtag' },
        '/menue-static/': { name: 'Menü', icon: 'fa-bars' },
        '/solo-static/': { name: 'Einzelplanung', icon: 'fa-user' },
        '/soloPlan-static/': { name: 'Solo Planung', icon: 'fa-tasks' },
        '/soloSelect-static/': { name: 'Solo Auswahl', icon: 'fa-check-square' },
        '/customer-static/': { name: 'Benutzerverwaltung', icon: 'fa-users-cog' }
    };
    
    modules.forEach(modulePath => {
        const moduleCard = document.createElement('div');
        moduleCard.className = 'module-card';
        
        const info = moduleInfo[modulePath] || { name: modulePath, icon: 'fa-puzzle-piece' };
        
        moduleCard.innerHTML = `
            <i class="fas ${info.icon}"></i>
            <h4>${info.name}</h4>
        `;
        
        modulesContainer.appendChild(moduleCard);
    });
}

// Formulare initialisieren
function initForms() {
    // Persönliche Informationen aktualisieren
    document.getElementById('personalInfoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            employer: document.getElementById('employer').value,
            position: document.getElementById('position').value
        };
        
        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Aktualisieren der Informationen');
            }
            
            showMessage('personalInfoMessage', 'Informationen erfolgreich aktualisiert', 'success');
        } catch (error) {
            console.error('Fehler:', error);
            showMessage('personalInfoMessage', error.message, 'error');
        }
    });
    
    // Passwort-Reset-Funktionalität
    document.getElementById('resetPassword').addEventListener('click', async function() {
        if (!confirm('Möchten Sie wirklich ein neues Passwort generieren?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/auth/reset-own-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Zurücksetzen des Passworts');
            }
            
            const data = await response.json();
            
            // Neues Passwort anzeigen
            document.getElementById('newPassword').textContent = data.newPassword;
            document.getElementById('newPasswordContainer').style.display = 'block';
            showMessage('passwordChangeMessage', 'Neues Passwort wurde generiert', 'success');
            
            // Copy-Button Funktionalität
            document.getElementById('copyPassword').addEventListener('click', function() {
                const password = document.getElementById('newPassword').textContent;
                navigator.clipboard.writeText(password).then(() => {
                    this.innerHTML = '<i class="fas fa-check"></i> Kopiert';
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-copy"></i> Kopieren';
                    }, 2000);
                });
            });
            
        } catch (error) {
            console.error('Fehler:', error);
            showMessage('passwordChangeMessage', error.message, 'error');
        }
    });
}

// Hilfsfunktion für Meldungen
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
    }
    
    // Nach 3 Sekunden ausblenden
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 5000);
} 