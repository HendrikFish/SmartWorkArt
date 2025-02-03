document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Tab Wechsel Logik
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector(`.form#${btn.dataset.tab}Form`).classList.add('active');
        });
    });

    // Login Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Deaktiviere Submit-Button während des Logins
        const submitBtn = loginForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Anmeldung läuft...';

        try {
            console.log('Sende Login-Anfrage...');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Wichtig für Cookies
                body: JSON.stringify({ email, password })
            });

            console.log('Login-Antwort erhalten:', response.status);
            const data = await response.json();
            console.log('Login-Daten:', data);

            if (response.ok) {
                showSuccess(loginForm, 'Login erfolgreich! Sie werden weitergeleitet...');
                // Kurze Verzögerung für die Erfolgsmeldung
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showError(loginForm, data.message || 'Login fehlgeschlagen');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Anmelden';
            }
        } catch (error) {
            console.error('Login-Fehler:', error);
            showError(loginForm, 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Anmelden';
        }
    });

    // Registrierungs Handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Deaktiviere Submit-Button während der Registrierung
        const submitBtn = registerForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrierung läuft...';

        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            employer: document.getElementById('employer').value,
            position: document.getElementById('position').value,
            facility: document.getElementById('facility').value
        };

        try {
            console.log('Sende Registrierungs-Anfrage...');
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log('Registrierungs-Antwort erhalten:', response.status);
            const data = await response.json();
            console.log('Registrierungs-Daten:', data);

            if (response.ok) {
                showSuccess(registerForm, 'Registrierung erfolgreich. Bitte warten Sie auf die Freigabe durch einen Administrator.');
                registerForm.reset();
            } else {
                showError(registerForm, data.message);
            }
        } catch (error) {
            console.error('Registrierungs-Fehler:', error);
            showError(registerForm, 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrieren';
        }
    });

    // Hilfsfunktionen für Fehlermeldungen
    function showError(form, message) {
        removeMessages(form);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        form.appendChild(errorDiv);
    }

    function showSuccess(form, message) {
        removeMessages(form);
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        form.appendChild(successDiv);
    }

    function removeMessages(form) {
        const messages = form.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.remove());
    }
});
