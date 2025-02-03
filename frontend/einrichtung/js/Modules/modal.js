// public/js/modules/modal.js
import { resetForm } from "./form.js";

export function openModal() {
    const modal = document.getElementById('einrichtungsModal');
    if (modal) {
        modal.style.display = 'block';
        const form = document.getElementById('einrichtungsForm');
        if (form) {
            form.reset();
            if (!form.dataset.mode) {
                form.dataset.mode = 'new';
            }
        }
    }
}

export function closeModal() {
    const modal = document.getElementById('einrichtungsModal');
    if (modal) {
        modal.style.display = 'none';
        resetForm();
    }
}
