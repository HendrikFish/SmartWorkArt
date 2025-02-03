// Modal-Verwaltung
export const Modal = {
    activeModals: [],

    show: (modalId) => {
        Modal.hideAll();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
            Modal.activeModals.push(modalId);
            document.body.style.overflow = 'hidden';
        }
    },

    hide: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.addEventListener('transitionend', function handler() {
                modal.style.display = 'none';
                modal.removeEventListener('transitionend', handler);
            });
            Modal.activeModals = Modal.activeModals.filter(id => id !== modalId);
            if (Modal.activeModals.length === 0) {
                document.body.style.overflow = '';
            }
        }
    },

    hideAll: () => {
        const modalsToClose = [...Modal.activeModals];
        modalsToClose.forEach(modalId => Modal.hide(modalId));
    },

    init: () => {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    Modal.hide(modal.id);
                }
            }
            
            if (e.target.classList.contains('modal')) {
                Modal.hide(e.target.id);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && Modal.activeModals.length > 0) {
                Modal.hide(Modal.activeModals[Modal.activeModals.length - 1]);
            }
        });
    }
};
