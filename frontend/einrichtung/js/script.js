// public/js/main.js (oder script.js)

// 1) Wir importieren alle benötigten Funktionen aus deinen Modulen:
import { currentStep } from "./Modules/globalVariables.js";
import { showToast } from "./Modules/toast.js";
import { setupSpeiseangebot } from "./Modules/speiseangebot.js";
import { setupGruppenVerwaltung } from "./Modules/gruppen.js";
import { loadEinrichtungen } from "./Modules/einrichtungen.js";
import { setupPersonengruppenButtons, setupTourButtons } from "./Modules/personengruppenButtons.js";
import { initStepNavigation, showStep } from "./Modules/stepsNavigation.js";
import { handleFormSubmit } from "./Modules/form.js";
import { openModal, closeModal } from "./Modules/modal.js";
import { editEinrichtung } from "./Modules/einrichtungEdit.js";
import { resetForm } from './Modules/form.js';
import { prepareNewForm } from './Modules/form.js';

// 2) DOMContentLoaded-Event, um sicherzustellen, 
//    dass die DOM-Elemente existieren, wenn wir sie ansprechen.
document.addEventListener('DOMContentLoaded', function() {

    // A) Personengruppe & Tour-Buttons (Schritt 2)
    setupPersonengruppenButtons();
    setupTourButtons();

    // B) Gruppenverwaltung (Schritt 4) / Speiseangebot (Schritt 3)
    setupGruppenVerwaltung();
    setupSpeiseangebot();

    // C) Schritt-Navigation initialisieren (Weiter / Zurück)
    //    -> Das aktiviert #nextStep, #prevStep und zeigt Schritt 1 an.
    initStepNavigation();
    // Falls du explizit bei Schritt 1 starten willst und 
    // dein initStepNavigation() KEIN showStep(1) macht, 
    // könntest du hier zusätzlich schreiben:
    showStep(1);

    // D) Modal-Events (Schließen etc.)
    const closeButton = document.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('einrichtungsModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // E) Formular-Submit
    const form = document.getElementById('einrichtungsForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // F) "Neue Einrichtung" Button
    const neueEinrichtungBtn = document.getElementById('neueEinrichtung');
    if (neueEinrichtungBtn) {
        neueEinrichtungBtn.addEventListener('click', prepareNewForm);
    }

    // G) Einrichtungen laden (Dashboard füllen)
    loadEinrichtungen();
});
