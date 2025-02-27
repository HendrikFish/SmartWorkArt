document.addEventListener('DOMContentLoaded', () => {
    let currentUsers = [];
    let currentFilter = 'all';
    const modal = document.getElementById('userModal');
    const searchInput = document.getElementById('searchInput');
    let currentUserId = null;
    let allFacilities = []; // Speichert alle verfügbaren Einrichtungen

    // Event Listener für "Zurück zum Dashboard" Button
    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = '/dashboard';
    });

    // Benutzer laden
    async function loadUsers(status = 'all') {
        try {
            const response = await fetch('/api/users', {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Fehler beim Laden der Benutzer');

            currentUsers = await response.json();
            displayUsers(currentUsers);
            updateStats();
        } catch (error) {
            console.error('Fehler:', error);
            showError('Fehler beim Laden der Benutzer');
        }
    }

    // Benutzer anzeigen
    function displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.facility}</td>
                <td>${user.position}</td>
                <td><span class="status-badge ${getStatusClass(user)}">${getStatusText(user)}</span></td>
                <td>${new Date(user.registrationDate).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn btn-edit" data-id="${user._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" data-id="${user._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }

    // Status Text formatieren
    function getStatusText(user) {
        if (!user.isApproved) {
            return 'Ausstehend';
        }
        return 'Genehmigt';
    }

    // Status-Klasse ermitteln
    function getStatusClass(user) {
        if (!user.isApproved) {
            return 'status-pending';
        }
        return 'status-approved';
    }

    // Statistiken aktualisieren
    function updateStats() {
        const stats = {
            pending: currentUsers.filter(u => !u.isApproved).length,
            approved: currentUsers.filter(u => u.isApproved).length,
            total: currentUsers.length
        };

        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('approvedCount').textContent = stats.approved;
        document.getElementById('rejectedCount').textContent = '0'; // Nicht mehr verwendet
    }

    // Einrichtungen laden
    async function loadFacilities() {
        try {
            const response = await fetch('/api/einrichtungen', {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Fehler beim Laden der Einrichtungen');
            allFacilities = await response.json();
        } catch (error) {
            console.error('Fehler:', error);
            showError('Fehler beim Laden der Einrichtungen');
        }
    }

    // Modal Funktionen
    async function openModal(userId) {
        currentUserId = userId;
        const user = currentUsers.find(u => u._id === userId);
        if (!user) return;

        // Benutzer-ID im Dataset speichern
        const modalContent = document.querySelector('.modal-content');
        modalContent.dataset.userId = userId;
        console.log('Modal geöffnet für Benutzer-ID:', userId); // Debug-Ausgabe

        // Grundlegende Informationen
        document.getElementById('modalFirstName').textContent = user.firstName;
        document.getElementById('modalLastName').textContent = user.lastName;
        document.getElementById('modalEmail').textContent = user.email;
        document.getElementById('modalPhone').textContent = user.phoneNumber;
        document.getElementById('modalEmployer').textContent = user.employer;
        document.getElementById('modalPosition').textContent = user.position;
        document.getElementById('modalFacility').textContent = user.facility;
        document.getElementById('modalStatus').value = user.isApproved ? 'approved' : 'pending';
        document.getElementById('modalRole').value = user.role;
        document.getElementById('modalNotes').value = user.notes || '';

        // Berechtigungen basierend auf der Rolle setzen
        updatePermissionCheckboxes(user.role, user.allowedModules);

        // Einrichtungen anzeigen
        await updateFacilitiesCheckboxes(user);

        modal.style.display = 'block';
        console.log('Modal geöffnet für Benutzer:', user.email, 'mit Modulen:', user.allowedModules);
    }

    // Berechtigungen basierend auf der Rolle aktualisieren
    function updatePermissionCheckboxes(role, allowedModules = []) {
        console.log('Aktualisiere Berechtigungen für Rolle:', role, 'mit Modulen:', allowedModules);

        // Alle Modul-Checkboxen finden
        const moduleCheckboxes = document.querySelectorAll('.permissions-grid input[type="checkbox"]');

        moduleCheckboxes.forEach(checkbox => {
            const modulePath = checkbox.dataset.module;

            switch (role) {
                case 'admin':
                    // Admin hat Zugriff auf alle Module
                    checkbox.checked = true;
                    checkbox.disabled = true;
                    break;
                case 'co-admin':
                case 'user':
                    // Alle Module sind auswählbar
                    checkbox.disabled = false;
                    // Checkbox ist aktiviert, wenn sie in allowedModules ist
                    checkbox.checked = allowedModules.includes(modulePath);
                    break;
                default:
                    checkbox.checked = false;
                    checkbox.disabled = true;
            }
        });

        // Standardmodule aktivieren, wenn keine Module ausgewählt sind
        if (allowedModules.length === 0) {
            const standardModules = ['module-order', 'module-menue'];
            standardModules.forEach(moduleId => {
                const checkbox = document.getElementById(moduleId);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        console.log('Module-Berechtigungen aktualisiert für Rolle:', role);
    }

    // Einrichtungs-Checkboxen aktualisieren
    async function updateFacilitiesCheckboxes(user) {
        if (!allFacilities.length) {
            await loadFacilities();
        }

        const container = document.getElementById('facilitiesContainer');
        container.innerHTML = '';

        const isAdmin = user.role === 'admin';
        const isCoAdmin = user.role === 'co-admin';

        allFacilities.forEach(facility => {
            const div = document.createElement('div');
            div.className = 'facility-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            const facilityId = facility.kuerzel; // Kürzel als ID verwenden
            checkbox.id = `facility-${facilityId}`;
            checkbox.value = facilityId;

            // Checkbox-Status setzen
            if (isAdmin) {
                checkbox.checked = true;
                checkbox.disabled = true;
            } else if (isCoAdmin) {
                checkbox.checked = facility.kuerzel === user.facility;
                checkbox.disabled = true;
            } else {
                // Prüfen, ob die Einrichtung in den erlaubten Einrichtungen ist
                checkbox.checked = user.allowedFacilities?.includes(facilityId) || false;
                checkbox.disabled = false;
            }

            const label = document.createElement('label');
            label.htmlFor = `facility-${facilityId}`;
            label.textContent = facility.name;

            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
    }

    // Event Listener für Rollenänderung
    document.getElementById('modalRole').addEventListener('change', (e) => {
        const role = e.target.value;
        const user = currentUsers.find(u => u._id === currentUserId);
        updatePermissionCheckboxes(role, user?.allowedModules || []);

        // Einrichtungen aktualisieren
        if (user) {
            user.role = role;
            updateFacilitiesCheckboxes(user);
        }
    });

    function closeModal() {
        modal.style.display = 'none';
        currentUserId = null;
    }

    // Event Listener für Modal schließen
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Event Listener für den Speichern-Button
    document.getElementById('saveChanges').addEventListener('click', async () => {
        if (!currentUserId) {
            showError('Kein Benutzer ausgewählt');
            return;
        }
        await saveUser(currentUserId);
    });

    // Event Listener für Benutzeraktionen
    document.getElementById('usersTableBody').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const userId = button.dataset.id;
        if (button.classList.contains('btn-view') || button.classList.contains('btn-edit')) {
            openModal(userId);
        } else if (button.classList.contains('btn-delete')) {
            if (confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
                deleteUser(userId);
            }
        }
    });

    // Benutzer löschen
    async function deleteUser(userId) {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Fehler beim Löschen des Benutzers');

            await loadUsers(currentFilter);
            showSuccess('Benutzer erfolgreich gelöscht');
        } catch (error) {
            console.error('Fehler:', error);
            showError('Fehler beim Löschen des Benutzers');
        }
    }

    // Benutzer speichern
    async function saveUser(userId) {
        try {
            // Verbesserte Checkbox-Erfassung
            const moduleCheckboxes = document.querySelectorAll('.permissions-grid input[type="checkbox"]');
            const facilityCheckboxes = document.querySelectorAll('#facilitiesContainer input[type="checkbox"]');

            const userData = {
                role: document.getElementById('modalRole').value,
                isApproved: document.getElementById('modalStatus').value === 'approved',
                notes: document.getElementById('modalNotes').value,

                // Explizite Erfassung der ausgewählten Einrichtungen
                allowedFacilities: Array.from(facilityCheckboxes)
                    .filter(checkbox => checkbox.checked)
                    .map(checkbox => checkbox.value),

                // Explizite Erfassung der ausgewählten Module
                allowedModules: Array.from(moduleCheckboxes)
                    .filter(checkbox => checkbox.checked)
                    .map(checkbox => checkbox.dataset.module)
                    .map(module => {
                        if (!module.startsWith('/')) module = '/' + module;
                        if (!module.endsWith('/')) module += '/';
                        if (!module.includes('-static')) {
                            module = module.replace('/', '-static/');
                        }
                        return module;
                    })
            };

            console.log('Zu speichernde Daten:', userData);

            const response = await fetch(`/api/auth/user/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server-Fehler:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Fehler beim Speichern des Benutzers: ${response.status} ${response.statusText}`);
            }

            let responseData;
            try {
                responseData = await response.json();
                console.log('Server-Antwort (Erfolg):', responseData);

                // Aktualisiere den Benutzer in der lokalen Liste
                const userIndex = currentUsers.findIndex(u => u._id === userId);
                if (userIndex !== -1) {
                    currentUsers[userIndex] = {
                        ...currentUsers[userIndex],
                        ...responseData.user || responseData,
                        allowedModules: userData.allowedModules
                    };
                }

                showSuccess('Benutzer erfolgreich gespeichert');
                closeModal();
                await loadUsers(); // Lade die Benutzerliste neu

            } catch (e) {
                console.warn('Server-Antwort konnte nicht als JSON geparst werden:', e);
                throw new Error('Fehler beim Verarbeiten der Server-Antwort');
            }

        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            showError(error.message || 'Fehler beim Speichern des Benutzers');
        }
    }

    // Filter Buttons
    document.querySelector('.filter-buttons').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        currentFilter = button.dataset.status;
        loadUsers(currentFilter);
    });

    // Suche
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredUsers = currentUsers.filter(user =>
            user.firstName.toLowerCase().includes(searchTerm) ||
            user.lastName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.facility.toLowerCase().includes(searchTerm)
        );
        displayUsers(filteredUsers);
    });

    // Benachrichtigungen
    function showSuccess(message) {
        // Hier können Sie eine Toast-Nachricht oder eine andere Benachrichtigung implementieren
        alert(message);
    }

    function showError(message) {
        // Hier können Sie eine Toast-Nachricht oder eine andere Benachrichtigung implementieren
        alert(message);
    }

    // Passwort-Reset-Funktionalität überarbeiten
    document.getElementById('resetPassword').addEventListener('click', async function() {
        if (!confirm('Möchten Sie wirklich ein neues Passwort für diesen Benutzer generieren?')) {
            return;
        }
        
        // Korrigierte Methode zum Abrufen der userId
        const userId = document.querySelector('.modal-content').dataset.userId;
        
        console.log('Reset Passwort für Benutzer-ID:', userId);
        
        if (!userId) {
            alert('Fehler: Benutzer-ID konnte nicht ermittelt werden.');
            return;
        }
        
        const apiEndpoint = `/api/customers/${userId}/reset-password`;
        console.log('Verwende folgenden API-Endpunkt:', apiEndpoint);
        
        try {
            // Frischen CSRF-Token laden (falls verwendet)
            // Optional: await refreshCSRFToken();
            
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache' // Verhindert Caching
                },
                credentials: 'include',
                cache: 'no-store' // Verhindert Caching der Anfrage
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server-Antwort:', errorText);
                
                // Bei 401 neu laden oder zum Login weiterleiten
                if (response.status === 401) {
                    alert('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
                    window.location.href = '/login';
                    return;
                }
                
                throw new Error(`Fehler beim Zurücksetzen des Passworts: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Neues Passwort anzeigen und sicherstellen, dass das Container-Element leer ist
            const passwordContainer = document.getElementById('newPasswordContainer');
            const passwordElement = document.getElementById('newPassword');
            
            passwordElement.textContent = data.newPassword;
            passwordContainer.style.display = 'block';
            
            // Event Listener entfernen, um Doppelanmeldung zu vermeiden
            const copyBtn = document.getElementById('copyPassword');
            copyBtn.replaceWith(copyBtn.cloneNode(true));
            
            // Neuen Event Listener hinzufügen
            document.getElementById('copyPassword').addEventListener('click', function() {
                const password = document.getElementById('newPassword').textContent;
                navigator.clipboard.writeText(password)
                    .then(() => {
                        this.innerHTML = '<i class="fas fa-check"></i> Kopiert';
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i> Kopieren';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Fehler beim Kopieren:', err);
                        alert('Fehler beim Kopieren des Passworts');
                    });
            });
            
            showMessage('success', 'Passwort wurde erfolgreich zurückgesetzt');
        } catch (error) {
            console.error('Fehler:', error);
            showMessage('error', error.message);
        }
    });

    // Passwort-Kopier-Funktionalität
    document.getElementById('copyPassword').addEventListener('click', function() {
        const passwordText = document.getElementById('newPassword').textContent;
        
        navigator.clipboard.writeText(passwordText)
            .then(() => {
                showMessage('success', 'Passwort in die Zwischenablage kopiert');
            })
            .catch(() => {
                showMessage('error', 'Fehler beim Kopieren');
            });
    });

    // Hilfsfunktion für Meldungen
    function showMessage(type, message) {
        // Bestehende Meldungen entfernen
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Neue Meldung erstellen
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Zur Modal-Content hinzufügen
        document.querySelector('.modal-content').appendChild(messageDiv);
        
        // Nach 3 Sekunden ausblenden
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Beim Öffnen des Modals das Passwort-Container zurücksetzen
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('newPasswordContainer').style.display = 'none';
    });

    // Initial Benutzer und Einrichtungen laden
    loadUsers();
    loadFacilities();
});
