// Hilfsfunktionen
export const normalizeString = (str) => {
    if (!str) return '';
    return str
        .trim()
        .toLowerCase()
        .replace(/[äÄ]/g, 'ae')
        .replace(/[öÖ]/g, 'oe')
        .replace(/[üÜ]/g, 'ue')
        .replace(/[ß]/g, 'ss')
        .replace(/[éÉ]/g, 'e')
        .replace(/[âÂ]/g, 'a')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
};

// Toast-Benachrichtigungen
export const Toast = {
    show: (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3000);
    }
};
