// public/js/script.js

import { openEinrichtung } from "./Modules/openEinrichtung.js";
import { showToast } from "./Modules/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script.js (ES6-Modul) wurde geladen");

  try {
    const response = await fetch("/api/orders/einrichtungen");
    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }
    const einrichtungen = await response.json();
    console.log("Einrichtungen:", einrichtungen);

    const buttonsContainer = document.getElementById("buttons-container");
    buttonsContainer.innerHTML = "";
    einrichtungen.forEach((einrichtung) => {
      const button = document.createElement("button");
      button.textContent = einrichtung.name;
      button.addEventListener("click", () => openEinrichtung(einrichtung));
      buttonsContainer.appendChild(button);
    });
  } catch (error) {
    console.error("Fehler beim Laden der Einrichtungen:", error.message);
    showToast("Es gab ein Problem beim Abrufen der Einrichtungen.", false);
  }
});
