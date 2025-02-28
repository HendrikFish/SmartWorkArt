// Funktion zum Anzeigen des Registrierungsformulars
function showRegistration() {
    // Weiterleitung zur Login-Seite mit aktiviertem Registrierungsformular
    window.location.href = '/login#register';
}

// Prüfen, ob der Benutzer bereits eingeloggt ist
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            // Wenn eingeloggt, zum Dashboard weiterleiten
            window.location.href = '/dashboard';
        }
    } catch (error) {
        console.error('Fehler beim Prüfen des Auth-Status:', error);
    }
}

// Bei Seitenladung Auth-Status prüfen
document.addEventListener('DOMContentLoaded', checkAuthStatus); 