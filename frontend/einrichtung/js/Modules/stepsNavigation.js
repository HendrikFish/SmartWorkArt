// stepsNavigation.js

import { currentStep } from "./globalVariables.js";

// Wie viele Form-Steps hast du insgesamt?
// In deinem Beispiel hast du data-step="1" bis data-step="4".
const MAX_STEP = 4;

/**
 * Initialisiert die Navigation (Event Listener für "Zurück" & "Weiter")
 * und zeigt den aktuellen Schritt + Buttons an.
 */
export function initStepNavigation() {
    document.addEventListener('click', function(event) {
        // Event-Delegation für die Navigation
        if (event.target.id === 'nextStep') {
            navigateStep(1);
        } else if (event.target.id === 'prevStep') {
            navigateStep(-1);
        }
    });

    // Initial den ersten Schritt und die Buttons anzeigen
    showStep(1);
    updateNavigationButtons();
}

/**
 * Wechselt um 'direction' Schritte (z.B. +1 oder -1).
 */
export function navigateStep(direction) {
    // Aktuellen Schritt ausblenden
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (currentStepElement) {
        currentStepElement.style.display = "none";
    }

    // Neue Schrittzahl berechnen
    let newStep = window.currentStep + direction;
    if (newStep < 1) newStep = 1;
    if (newStep > MAX_STEP) newStep = MAX_STEP;

    window.currentStep = newStep;

    // Neuen Schritt anzeigen
    showStep(window.currentStep);
}

/**
 * Zeigt einen bestimmten Schritt an und versteckt alle anderen.
 */
export function showStep(stepNumber) {
    // Alle Steps verstecken
    document.querySelectorAll(".form-step").forEach(stepElem => {
        stepElem.style.display = "none";
    });

    // Gewünschten Step anzeigen
    const targetStepElem = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (targetStepElem) {
        targetStepElem.style.display = "block";
    }

    // Globale Variable anpassen
    window.currentStep = stepNumber;

    // Navigation anpassen
    updateNavigationButtons();
}

/**
 * Passt die Sichtbarkeit von #prevStep, #nextStep und #submitForm 
 * anhand der aktuellen Step-Nummer an.
 */
export function updateNavigationButtons() {
    const prevButton = document.getElementById("prevStep");
    const nextButton = document.getElementById("nextStep");
    const submitButton = document.getElementById("submitForm");

    if (prevButton) {
        prevButton.style.display = window.currentStep > 1 ? "block" : "none";
    }

    if (nextButton) {
        nextButton.style.display = window.currentStep < MAX_STEP ? "block" : "none";
    }

    if (submitButton) {
        submitButton.style.display = window.currentStep === MAX_STEP ? "block" : "none";
    }
}
