// Passwortänderungsformular
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('passwordChangeMessage');
    
    // Grundlegende Validierung
    if (newPassword !== confirmPassword) {
        messageElement.textContent = 'Die neuen Passwörter stimmen nicht überein';
        messageElement.className = 'message error';
        return;
    }
    
    if (newPassword.length < 6) {
        messageElement.textContent = 'Das neue Passwort muss mindestens 6 Zeichen lang sein';
        messageElement.className = 'message error';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageElement.textContent = 'Passwort erfolgreich geändert';
            messageElement.className = 'message success';
            this.reset();
        } else {
            messageElement.textContent = data.message || 'Fehler beim Ändern des Passworts';
            messageElement.className = 'message error';
        }
    } catch (error) {
        console.error('Fehler:', error);
        messageElement.textContent = 'Ein Fehler ist aufgetreten';
        messageElement.className = 'message error';
    }
}); 