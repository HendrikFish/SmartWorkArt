import { currentEinrichtung, currentWeek, currentYear } from "./globalVariables.js";
import { showToast } from "./toast.js";

export async function openInfoPopup(day, info) {
    console.log(`openInfoPopup aufgerufen für ${day} mit Info:`, info);
    const modal = document.getElementById("info-modal");
    const infoInput = document.getElementById("info-input");
    const saveInfoButton = document.getElementById("save-info-button");
    const closeButton = modal.querySelector(".close-button");

    if (!modal || !infoInput || !saveInfoButton || !closeButton) {
        console.error("Modal-Elemente nicht gefunden.");
        return;
    }

    infoInput.value = info || "";
    
    setTimeout(() => {
        if (infoInput.value !== info) {
            infoInput.value = info || "";
        }
    }, 0);

    modal.classList.remove("hidden");

    // Event-Listener entfernen
    saveInfoButton.onclick = null;
    closeButton.onclick = null;
    window.onclick = null;

    // Event-Listener neu setzen
    saveInfoButton.onclick = async () => {
        const newInfo = infoInput.value.trim();
        console.log(`Information für ${day} gespeichert: ${newInfo}`);

        // Update UI
        const infoButtons = document.querySelectorAll(".info-button");
        infoButtons.forEach((button) => {
            if (button.dataset.day === day) {
                button.dataset.info = newInfo;
                if (newInfo !== "") {
                    button.classList.add("info-saved");
                    button.style.color = "black";
                    button.style.backgroundColor = "lightgreen";
                } else {
                    button.classList.remove("info-saved");
                    button.style.color = "";
                    button.style.backgroundColor = "";
                }
            }
        });

        try {
            const response = await fetch("/api/orders/save-info", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    einrichtung: currentEinrichtung.name,
                    kuerzel: currentEinrichtung.kuerzel,
                    week: parseInt(currentWeek, 10),
                    year: parseInt(currentYear, 10),
                    day: day,
                    info: newInfo,
                    component: "information"
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP-Fehler: ${response.status}`);
            }

            const result = await response.json();
            console.log("Server Antwort:", result);
            showToast("Information erfolgreich gespeichert!", true);
        } catch (error) {
            console.error("Fehler beim Speichern der Information:", error);
            showToast("Es gab ein Problem beim Speichern der Information.", false);
        }

        modal.classList.add("hidden");
    };

    closeButton.onclick = () => {
        modal.classList.add("hidden");
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.add("hidden");
        }
    };
}

export async function loadInfoFromFile(day) {
    try {
        const response = await fetch(`/api/orders/load-info/${day}`);
        if (!response.ok) {
            throw new Error(`HTTP-Fehler beim Laden der Info: ${response.status}`);
        }
        const data = await response.json();
        return data.info || "";
    } catch (error) {
        console.error("Fehler beim Laden der Info:", error.message);
        return "";
    }
} 