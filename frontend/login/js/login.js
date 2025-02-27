// Login-Prozess vollständig überarbeiten
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login-Seite geladen, prüfe Cookie-Status');
    
    // Prüfen, ob bereits ein Cookie gesetzt ist
    const isLoggedIn = document.cookie.includes('logged_in=true');
    if (isLoggedIn) {
        console.log('Bereits angemeldet (Cookie gefunden), versuche Weiterleitung');
        redirectIfAuthenticated();
    }
    
    // Login-Formular initialisieren
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Funktion zum Prüfen, ob Benutzer authentifiziert ist
async function redirectIfAuthenticated() {
    try {
        console.log('Überprüfe Authentifizierungsstatus...');
        const response = await fetch('/api/auth/status', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        console.log('Auth-Status-Antwort:', response.status);
        
        // Wenn authentifiziert, zum Dashboard weiterleiten
        if (response.ok) {
            const data = await response.json();
            console.log('Authentifiziert als:', data.user.email);
            window.location.href = '/dashboard';
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Fehler beim Prüfen des Auth-Status:', error);
        return false;
    }
}

// Login-Handler
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('loginMessage');
    
    try {
        console.log('Sende Login-Anfrage für:', email);
        
        messageElement.textContent = 'Login wird verarbeitet...';
        messageElement.className = 'message info';
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        console.log('Login-Antwort erhalten, Status:', response.status);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Login fehlgeschlagen:', data.message);
            messageElement.textContent = data.message;
            messageElement.className = 'message error';
            return;
        }
        
        // Bei Erfolg
        console.log('Login erfolgreich, Benutzerinfo:', data.user);
        messageElement.textContent = 'Login erfolgreich, Sie werden weitergeleitet...';
        messageElement.className = 'message success';
        
        // Speichere Benutzerdaten im localStorage
        localStorage.setItem('user', JSON.stringify({
            _id: data.user._id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            role: data.user.role
        }));
        
        // Wir setzen zusätzlich ein Client-Cookie, falls das Server-Cookie nicht funktioniert
        document.cookie = 'client_logged_in=true; path=/; max-age=86400';
        
        // Prüfe, ob Cookie gesetzt wurde (debugging)
        console.log('Cookie nach Login gesetzt?', document.cookie.includes('logged_in=true') || document.cookie.includes('client_logged_in=true'));
        
        // Verzögerung für die Weiterleitung
        setTimeout(async () => {
            console.log('Versuche Weiterleitung zum Dashboard...');
            
            // Versuche Authentifizierungsstatus erneut zu prüfen
            const isAuthenticated = await redirectIfAuthenticated();
            
            // Falls das fehlschlägt, direkte Weiterleitung ohne Prüfung
            if (!isAuthenticated) {
                console.warn('Auth-Prüfung fehlgeschlagen, versuche direkte Weiterleitung');
                window.location.href = '/dashboard';
            }
        }, 1500);
    } catch (error) {
        console.error('Login-Fehler:', error);
        messageElement.textContent = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        messageElement.className = 'message error';
    }
} 