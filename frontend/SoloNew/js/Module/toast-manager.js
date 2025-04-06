/**
 * Toast-Manager Modul
 * Verwaltet die Anzeige von Benachrichtigungs-Toasts
 */

export const ToastManager = {
    container: null,
    defaultDuration: 3000,
    
    /**
     * Initialisiert den Toast-Manager
     * @param {Object} config - Konfigurationsoptionen
     */
    init(config = {}) {
        this.defaultDuration = config.defaultToastDuration || 3000;
        this.container = document.querySelector('.toast-container');
        
        // Erstelle Container, falls nicht vorhanden
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(this.container);
        }
        
        console.log('Toast-Manager initialisiert');
    },
    
    /**
     * Zeigt eine Toast-Nachricht an
     * @param {string} message - Anzuzeigende Nachricht
     * @param {string} type - Typ der Nachricht ('success', 'error', 'info', 'warning')
     * @param {number} duration - Anzeigedauer in ms (optional)
     */
    show(message, type = 'info', duration = null) {
        if (!this.container) this.init();
        
        const toastId = `toast-${Date.now()}`;
        const toastDuration = duration || this.defaultDuration;
        
        // Toast-Typen auf Bootstrap-Klassen mappen
        const typeClasses = {
            success: 'bg-success text-white',
            error: 'bg-danger text-white',
            warning: 'bg-warning',
            info: 'bg-info text-white'
        };
        
        // Icon für den Toast-Typ
        const icons = {
            success: '<i class="fas fa-check-circle me-2"></i>',
            error: '<i class="fas fa-exclamation-circle me-2"></i>',
            warning: '<i class="fas fa-exclamation-triangle me-2"></i>',
            info: '<i class="fas fa-info-circle me-2"></i>'
        };
        
        // Toast-HTML erstellen
        const toastElement = document.createElement('div');
        toastElement.className = `toast ${typeClasses[type] || 'bg-light'} fade-in`;
        toastElement.id = toastId;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');
        
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${icons[type] || ''}${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Schließen"></button>
            </div>
        `;
        
        // Toast zum Container hinzufügen
        this.container.appendChild(toastElement);
        
        // Bootstrap Toast initialisieren
        const toast = new bootstrap.Toast(toastElement, {
            delay: toastDuration,
            autohide: true
        });
        
        // Toast anzeigen
        toast.show();
        
        // Toast nach Ablauf der Zeit entfernen
        setTimeout(() => {
            if (toastElement && toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, toastDuration + 500); // Extra Zeit für Fade-Out-Animation
        
        return toastId;
    },
    
    /**
     * Zeigt eine Erfolgsmeldung an
     * @param {string} message - Anzuzeigende Nachricht
     * @param {number} duration - Anzeigedauer in ms (optional)
     */
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    },
    
    /**
     * Zeigt eine Fehlermeldung an
     * @param {string} message - Anzuzeigende Nachricht
     * @param {number} duration - Anzeigedauer in ms (optional)
     */
    error(message, duration = null) {
        return this.show(message, 'error', duration);
    },
    
    /**
     * Zeigt eine Warnmeldung an
     * @param {string} message - Anzuzeigende Nachricht
     * @param {number} duration - Anzeigedauer in ms (optional)
     */
    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    },
    
    /**
     * Zeigt eine Infomeldung an
     * @param {string} message - Anzuzeigende Nachricht
     * @param {number} duration - Anzeigedauer in ms (optional)
     */
    info(message, duration = null) {
        return this.show(message, 'info', duration);
    },
    
    /**
     * Entfernt einen Toast mit der angegebenen ID
     * @param {string} toastId - ID des zu entfernenden Toasts
     */
    remove(toastId) {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            const bsToast = bootstrap.Toast.getInstance(toastElement);
            if (bsToast) {
                bsToast.hide();
            }
        }
    }
}; 