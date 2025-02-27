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
        
        console.log('Login erfolgreich, Benutzerinfo:', data.user);
        messageElement.textContent = 'Login erfolgreich, Sie werden weitergeleitet...';
        messageElement.className = 'message success';
        
        // Benutzerinfo im localStorage speichern (ohne sensible Daten)
        localStorage.setItem('user', JSON.stringify({
            _id: data.user._id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            role: data.user.role
        }));
        
        // Direkte Weiterleitung zum Dashboard ohne Verzögerung
        window.location.href = '/dashboard';
        
    } catch (error) {
        console.error('Login-Fehler:', error);
        messageElement.textContent = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        messageElement.className = 'message error';
    }
}); 