/**
 * Toast-Manager
 * Verwaltet Toast-Benachrichtigungen für Benutzer-Feedback
 */

export const ToastManager = {
    bootstrap: null,
    toastContainer: null,
    
    /**
     * Initialisiert den Toast-Manager
     * @returns {Promise<void>}
     */
    init() {
        console.log('Toast-Manager wird initialisiert...');
        
        // Bootstrap Toast-Funktionalität laden
        this.bootstrap = window.bootstrap;
        
        if (!this.bootstrap) {
            console.error('Bootstrap nicht gefunden! Toast-Funktionalität eingeschränkt.');
        }
        
        // Toast-Container finden oder erstellen
        this.toastContainer = document.querySelector('.toast-container');
        
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.classList.add('toast-container', 'position-fixed', 'top-0', 'end-0', 'p-3');
            document.body.appendChild(this.toastContainer);
        }
        
        console.log('Toast-Manager erfolgreich initialisiert');
        return Promise.resolve();
    },
    
    /**
     * Erstellt ein neues Toast-Element
     * @param {Object} options - Konfigurationsoptionen
     * @param {string} options.title - Toast-Titel
     * @param {string} options.message - Toast-Nachricht
     * @param {string} options.type - Toast-Typ (success, error, warning, info)
     * @param {boolean} options.autohide - Automatisch ausblenden
     * @param {number} options.delay - Verzögerung in ms bis zum Ausblenden
     * @returns {HTMLElement} - Das erstellte Toast-Element
     */
    createToastElement(options) {
        const { title, message, type = 'info', autohide = true, delay = 5000 } = options;
        
        // Toast-Typ zu Bootstrap-Klasse konvertieren
        const typeMap = {
            success: 'bg-success text-white',
            error: 'bg-danger text-white',
            warning: 'bg-warning',
            info: 'bg-info text-white'
        };
        
        const bgClass = typeMap[type] || typeMap.info;
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const icon = iconMap[type] || iconMap.info;
        
        // Toast-Element erstellen
        const toastElement = document.createElement('div');
        toastElement.classList.add('toast', 'mb-2', 'shadow-sm', bgClass);
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');
        
        if (autohide) {
            toastElement.setAttribute('data-bs-autohide', 'true');
            toastElement.setAttribute('data-bs-delay', delay);
        } else {
            toastElement.setAttribute('data-bs-autohide', 'false');
        }
        
        // Toast-HTML-Struktur erstellen
        toastElement.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-${icon} me-2"></i>
                <strong class="me-auto">${title || 'Benachrichtigung'}</strong>
                <small>${this.getCurrentTime()}</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Schließen"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        return toastElement;
    },
    
    /**
     * Zeigt ein Toast an
     * @param {Object} options - Toast-Optionen
     */
    show(options) {
        const toastElement = this.createToastElement(options);
        this.toastContainer.appendChild(toastElement);
        
        // Bootstrap Toast initialisieren und anzeigen
        if (this.bootstrap) {
            const bsToast = new this.bootstrap.Toast(toastElement);
            bsToast.show();
            
            // Event-Listener für das Entfernen des Elements nach dem Ausblenden
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        } else {
            // Fallback für fehlende Bootstrap-Funktionalität
            toastElement.style.opacity = '1';
            if (options.autohide !== false) {
                setTimeout(() => {
                    toastElement.style.opacity = '0';
                    toastElement.style.transition = 'opacity 0.5s';
                    setTimeout(() => {
                        toastElement.remove();
                    }, 500);
                }, options.delay || 5000);
            }
        }
    },
    
    /**
     * Erfolgs-Toast anzeigen
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {Object} options - Zusätzliche Toast-Optionen
     */
    success(message, options = {}) {
        this.show({
            title: options.title || 'Erfolg',
            message,
            type: 'success',
            ...options
        });
    },
    
    /**
     * Fehler-Toast anzeigen
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {Object} options - Zusätzliche Toast-Optionen
     */
    error(message, options = {}) {
        this.show({
            title: options.title || 'Fehler',
            message,
            type: 'error',
            autohide: false,
            ...options
        });
    },
    
    /**
     * Warnungs-Toast anzeigen
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {Object} options - Zusätzliche Toast-Optionen
     */
    warning(message, options = {}) {
        this.show({
            title: options.title || 'Warnung',
            message,
            type: 'warning',
            ...options
        });
    },
    
    /**
     * Info-Toast anzeigen
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {Object} options - Zusätzliche Toast-Optionen
     */
    info(message, options = {}) {
        this.show({
            title: options.title || 'Information',
            message,
            type: 'info',
            ...options
        });
    },
    
    /**
     * Aktuelle Uhrzeit im Format HH:MM:SS
     * @returns {string} - Formatierte Uhrzeit
     */
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}; 