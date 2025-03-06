import { getGruppenData } from "./gruppen.js";
import { updateGesamtPersonenanzahl } from "./gruppen.js";
import { getSpeiseangebotData } from "./speiseangebot.js";
import { showToast } from "./toast.js";
import { loadEinrichtungen } from "./einrichtungen.js";
import { closeModal } from "./modal.js";
import { showStep } from "./stepsNavigation.js";
import { openModal } from "./modal.js";
import config from '../../../js/config.js';

const API_BASE_URL = config.API_ENDPOINT;

export async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const personengruppeSelect = form.querySelector('select[name="personengruppe"]');
    const tourSelect = form.querySelector('select[name="tour"]');
    
    if (!personengruppeSelect.value) {
        showToast('Bitte wählen Sie eine Personengruppe aus');
        personengruppeSelect.focus();
        return;
    }
    if (!tourSelect.value) {
        showToast('Bitte wählen Sie eine Tour aus');
        return;
    }
    
    const gruppen = getGruppenData();
    if (!gruppen) {
        return;
    }
    
    const gesamtPersonenanzahl = updateGesamtPersonenanzahl();

    const einrichtungData = {
        name: form.name.value.trim() || '',
        kuerzel: form.kuerzel.value || '',
        adresse: form.adresse.value || '',
        ansprechperson: form.ansprechperson.value || '',
        telefon: form.telefon.value || '',
        email: form.email.value || '',
        personengruppe: personengruppeSelect.value,
        tour: tourSelect.value,
        gesamtPersonenanzahl,
        speiseangebot: getSpeiseangebotData() || [],
        gruppen
    };

    if (!einrichtungData.name) {
        showToast('Bitte geben Sie einen Namen ein');
        return;
    }

    const isEdit = (form.dataset.mode === 'edit');
    const fileId = form.dataset.fileId;
    
    const url = isEdit 
    ? `${API_BASE_URL}/einrichtungen/${fileId}`
    : `${API_BASE_URL}/einrichtungen`;

    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(einrichtungData)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern der Einrichtung');
        }

        showToast('Daten erfolgreich gespeichert');
        closeModal();
        await loadEinrichtungen();
    } catch (error) {
        console.error('Fehler:', error);
        showToast('Fehler: ' + error.message);
    }
}

export function handleNeueEinrichtung() {
    resetForm();
}

// Formular für neue Einrichtung vorbereiten
export function prepareNewForm() {
    const form = document.getElementById('einrichtungsForm');
    if (form) {
        // Basis-Reset
        form.reset();
        
        // Formular-Modus auf "new" setzen
        form.dataset.mode = 'new';
        delete form.dataset.fileId;
        delete form.dataset.originalName;

        // Select-Felder explizit zurücksetzen
        const personengruppeSelect = form.querySelector('select[name="personengruppe"]');
        const tourSelect = form.querySelector('select[name="tour"]');
        if (personengruppeSelect) personengruppeSelect.value = '';
        if (tourSelect) tourSelect.value = '';

        // Aktive Buttons zurücksetzen
        document.querySelectorAll('.personengruppe-btn.active, .tour-btn.active').forEach(button => {
            button.classList.remove('active');
        });

        // Alle form-steps ausblenden und ersten Step zeigen
        document.querySelectorAll('.form-step').forEach(step => {
            step.style.display = 'none';
        });
        showStep(1);

        // Navigation-Buttons zurücksetzen
        document.getElementById('prevStep').style.display = 'none';
        document.getElementById('nextStep').style.display = 'block';
        document.getElementById('submitForm').style.display = 'none';

        // Gruppenanzahl zurücksetzen
        document.getElementById('gesamtPersonenanzahl').value = '0';
        document.getElementById('gesamtPersonenanzahlDisplay').textContent = '0';

        // Gruppenliste leeren
        document.getElementById('gruppenListe').innerHTML = '';

        // Modal öffnen
        openModal();
    }
}

// Bestehende resetForm Funktion für das Editieren beibehalten
export function resetForm() {
    const form = document.getElementById('einrichtungsForm');
    if (form) {
        form.reset();
        form.querySelectorAll('[required]').forEach(input => {
            input.removeAttribute('required');
        });
    }
}
