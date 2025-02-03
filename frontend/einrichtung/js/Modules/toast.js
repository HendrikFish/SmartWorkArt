

export function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return; // Falls kein Container existiert

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Toast nach 3 Sekunden entfernen
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
