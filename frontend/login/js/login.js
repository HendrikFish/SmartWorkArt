// Login-Funktion verbessern
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('loginMessage');
    
    try {
        console.log('Sende Login-Anfrage für:', email);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Wichtig für Cookies
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
        
        console.log('Login erfolgreich, leite weiter zum Dashboard');
        messageElement.textContent = 'Login erfolgreich, Sie werden weitergeleitet...';
        messageElement.className = 'message success';
        
        // Kurze Verzögerung für die Weiterleitung
        setTimeout(() => {
            // Explizit auf /dashboard ohne Trailing Slash weiterleiten
            window.location.href = '/dashboard';
        }, 1000);
        
    } catch (error) {
        console.error('Login-Fehler:', error);
        messageElement.textContent = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        messageElement.className = 'message error';
    }
}); 