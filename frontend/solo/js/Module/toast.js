export const Toast = {
    init() {
        // Erstelle den Toast-Container, falls er noch nicht existiert
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    },

    show(message, type = 'success') {
        // Erstelle das Toast-Element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Erstelle den Icon-Container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'toast-icon';
        
        // Füge das passende Icon basierend auf dem Typ hinzu
        const icon = document.createElement('i');
        switch (type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
        iconContainer.appendChild(icon);
        
        // Erstelle die Nachricht
        const messageElement = document.createElement('div');
        messageElement.className = 'toast-message';
        messageElement.textContent = message;
        
        // Erstelle den Schließen-Button
        const closeButton = document.createElement('button');
        closeButton.className = 'toast-close';
        closeButton.innerHTML = '&times;';
        
        // Füge alle Elemente zum Toast hinzu
        toast.appendChild(iconContainer);
        toast.appendChild(messageElement);
        toast.appendChild(closeButton);
        
        // Füge den Toast zum Container hinzu
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        // Event Listener für den Schließen-Button
        closeButton.addEventListener('click', () => {
            this.hide(toast);
        });
        
        // Automatisch ausblenden nach 5 Sekunden
        setTimeout(() => {
            this.hide(toast);
        }, 5000);
        
        // Animation starten
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    },

    hide(toast) {
        toast.classList.remove('show');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
}; 