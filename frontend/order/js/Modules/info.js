// public/js/Modules/info.js

import { currentEinrichtung, currentWeek, currentYear } from "./globalVariables.js";
import { showToast } from "./toast.js";

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

export async function handleInfoButtonClick(day) {
    const latestInfo = await loadInfoFromFile(day);
    openInfoPopup(day, latestInfo);
}

export async function openInfoPopup(day, info) {
    console.log(`openInfoPopup aufgerufen für ${day} mit Info: ${info}`);
    const modal = document.getElementById("info-modal");
    const infoInput = document.getElementById("info-input");
    const saveInfoButton = document.getElementById("save-info-button");
    const closeButton = modal.querySelector(".close-button");

    if (!modal || !infoInput || !saveInfoButton || !closeButton) {
      console.error("Modal-Elemente nicht gefunden.");
      return;
    }

    infoInput.value = info || "";
    modal.classList.remove("hidden");

    saveInfoButton.onclick = null;
    closeButton.onclick = null;

    saveInfoButton.onclick = async () => {
      const newInfo = infoInput.value.trim();
      console.log(`Information für ${day} gespeichert: ${newInfo}`);

      const infoButtons = document.querySelectorAll(".info-button");
      infoButtons.forEach((button) => {
        if (button.dataset.day === day) {
          button.dataset.info = newInfo;
          if (newInfo !== "") {
            button.classList.add("info-saved");
            button.style.color = "black";
          } else {
            button.classList.remove("info-saved");
          }
        }
      });

      try {
        const response = await fetch("/api/orders/save-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            einrichtung: currentEinrichtung.name,
            week: currentWeek,
            year: currentYear,
            day: day,
            info: newInfo,
          }),
        });
        if (!response.ok) {
          throw new Error(`HTTP-Fehler: ${response.status}`);
        }
      } catch (error) {
        console.error("Fehler beim Speichern der Information:", error.message);
        showToast("Es gab ein Problem beim Speichern der Information.", false);
      }
      modal.classList.add("hidden");
    };

    closeButton.onclick = () => {
      modal.classList.add("hidden");
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.classList.add("hidden");
      }
    };
}
