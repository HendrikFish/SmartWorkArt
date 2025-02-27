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
    document.getElementById('updateProfileBtn').addEventListener('click', async function() {
        const phoneNumber = document.getElementById('phoneNumber').value;
        const employer = document.getElementById('employer').value;
        const position = document.getElementById('position').value;
        
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    phoneNumber,
                    employer,
                    position
                })
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Aktualisieren des Profils');
            }
            
            const userData = await response.json();
            showMessage('profileUpdateMessage', 'Profil erfolgreich aktualisiert', 'success');
            
        } catch (error) {
            console.error('Fehler:', error);
            showMessage('profileUpdateMessage', error.message, 'error');
        }
    });
    
    // Passwortänderungsformular
    document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Passwortänderungsformular abgeschickt');
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Debug: Prüfe Eingabewerte (ohne Passwörter zu loggen)
        console.log('Eingaben überprüfen:', {
            hatCurrentPassword: !!currentPassword, 
            hatNewPassword: !!newPassword,
            hatConfirmPassword: !!confirmPassword,
            newPasswordLength: newPassword.length,
            passwörterStimmenÜberein: newPassword === confirmPassword
        });
        
        // Validierung
        if (newPassword !== confirmPassword) {
            showMessage('passwordChangeMessage', 'Die Passwörter stimmen nicht überein', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showMessage('passwordChangeMessage', 'Das neue Passwort muss mindestens 6 Zeichen lang sein', 'error');
            return;
        }
        
        try {
            console.log('Sende Passwortänderung an API...');
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            console.log('API-Antwort erhalten:', response.status);
            const responseData = await response.json();
            console.log('API-Antwortdaten:', responseData);
            
            if (!response.ok) {
                console.error('API-Fehler:', responseData);
                throw new Error(responseData.message || 'Fehler beim Ändern des Passworts');
            }
            
            showMessage('passwordChangeMessage', 'Passwort erfolgreich geändert. Bitte melden Sie sich mit dem neuen Passwort erneut an.', 'success');
            this.reset();
            
            // Optional: Nach erfolgreicher Passwortänderung automatisch abmelden
            setTimeout(() => {
                logout();
            }, 3000);
            
        } catch (error) {
            console.error('Fehler bei der Passwortänderung:', error);
            showMessage('passwordChangeMessage', error.message, 'error');
        }
    });
}

// Hilfsfunktion für Meldungen
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    // Nach 3 Sekunden ausblenden
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 5000);
}

// Hilfsfunktion zum Abmelden
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Abmeldung fehlgeschlagen:', error);
    }
} 