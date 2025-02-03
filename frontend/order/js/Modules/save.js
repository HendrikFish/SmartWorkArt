// public/js/Modules/save.js

import { currentEinrichtung, currentWeek, currentYear } from "./globalVariables.js";
import { showToast } from "./toast.js";

export async function saveOrder(einrichtung, week, year) {
    const inputs = document.querySelectorAll("#wochenplan input");
    const orders = [];

    // Sammle alle modifizierten Inputs (Hauptspeise, Suppe und Dessert)
    const modifiedInputs = Array.from(inputs).filter(input => 
        input.dataset.userModified === "true" &&
        input.style.color === "black" &&
        parseInt(input.value, 10) > 0
    );

    // Sammle die Bestellungen für alle Komponenten
    modifiedInputs.forEach(input => {
        orders.push({
            day: input.dataset.day,
            component: input.dataset.component,
            group: input.dataset.group,
            amount: parseInt(input.value, 10)
        });
    });

    // Sammle alle Info-Einträge
    const infoButtons = document.querySelectorAll(".info-button");
    infoButtons.forEach(button => {
        if (button.dataset.info) {
            orders.push({
                day: button.dataset.day,
                component: "information",
                info: button.dataset.info,
                group: "Gesamt"
            });
        }
    });

    if (!einrichtung.kuerzel) {
        console.error("Fehlendes Kürzel für die Einrichtung!");
        showToast("Kürzel der Einrichtung fehlt!", false);
        return;
    }

    try {
        const response = await fetch("/api/orders/save", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                einrichtung: einrichtung.name,
                kuerzel: einrichtung.kuerzel,
                orders: orders,
                week: parseInt(week, 10),
                year: parseInt(year, 10),
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        const result = await response.json();
        console.log("Server Antwort:", result);

        showToast("Bestellung erfolgreich gespeichert!", true);
        
        // Setze nur die Input-Flags zurück, nicht die Info-Button-Daten
        inputs.forEach(input => {
            if (input.dataset.userModified === "true") {
                input.dataset.userModified = "false";
                input.style.borderColor = "";
            }
        });

        return true;
    } catch (error) {
        console.error("Fehler beim Speichern der Bestellung:", error);
        showToast("Es gab ein Problem beim Speichern der Bestellung.", false);
        return false;
    }
}
