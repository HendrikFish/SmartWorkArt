// public/js/Modules/openEinrichtung.js

import {
    currentEinrichtung,
    currentWeek,
    currentYear,
    gruppen,
    updateCurrentWeek,
    updateCurrentYear
} from "./globalVariables.js";
  
import { loadEinrichtungGruppen, loadWeekData } from "./api.js";
import { updateWeekDisplay, changeWeek, loadCurrentWeek } from "./weekNavigation.js";
import { getISOWeek } from "./dateUtils.js";
import { saveOrder } from "./save.js";
import { populateTable } from "./table.js";
  
export function openEinrichtung(einrichtung) {
    currentEinrichtung.name = einrichtung.name;
    currentEinrichtung.kuerzel = einrichtung.kuerzel;
    currentEinrichtung.speiseangebot = einrichtung.speiseangebot || [];
    
    const formTitle = document.getElementById("form-title");
    const formContainer = document.getElementById("form-container");
  
    const selectedYear = new Date().getFullYear();
    const selectedWeek = getISOWeek(new Date());
  
    updateCurrentWeek(selectedWeek);
    updateCurrentYear(selectedYear);
  
    formTitle.textContent = `Wochenplan für ${einrichtung.name}`;
    updateWeekDisplay(selectedWeek, selectedYear);
  
      async function updateTable() {
        const loadedGruppen = await loadEinrichtungGruppen(einrichtung);
        if (!loadedGruppen || !Array.isArray(loadedGruppen) || loadedGruppen.length === 0) {
            console.warn("Keine Gruppen gefunden. Übergebe leeres Array an populateTable.");
            return populateTable([], [], []);
        }
        
        let kindergartenEinrichtungen = [];
        if (einrichtung.personengruppe === "Kindergartenkinder") {
            const response = await fetch("/api/orders/einrichtungen");
            const alleEinrichtungen = await response.json();
            kindergartenEinrichtungen = alleEinrichtungen.filter(e => 
                e.personengruppe === "Kindergartenkinder"
            );
        }

        gruppen.length = 0;
        gruppen.push(...loadedGruppen);
  
        console.log("Gruppen geladen:", gruppen);
        await loadWeekData(currentEinrichtung.name, currentWeek, currentYear, gruppen, kindergartenEinrichtungen);
      }
  
      updateTable();
  
      document.getElementById("prev-week").onclick = () => changeWeek(-1, currentEinrichtung.name);
      document.getElementById("next-week").onclick = () => changeWeek(1, currentEinrichtung.name);
      
      const saveButton = document.getElementById("save-button");
      saveButton.onclick = async () => {
          console.log("Save Button geklickt", {
              einrichtung: currentEinrichtung,
              week: currentWeek,
              year: currentYear
          });
          await saveOrder(currentEinrichtung, currentWeek, currentYear);
      };
  
      const weekNavigation = document.getElementById("next-week").parentElement;
      const existingButton = weekNavigation.querySelector('button[data-type="current-week"]');
      if (existingButton) {
          existingButton.remove();
      }
      const currentWeekBtn = document.createElement("button");
      currentWeekBtn.textContent = "Aktuelle Woche";
      currentWeekBtn.setAttribute('data-type', 'current-week');
      currentWeekBtn.style.backgroundColor = "#4CAF50";
      currentWeekBtn.style.color = "white";
      currentWeekBtn.style.marginLeft = "10px";
      currentWeekBtn.onclick = () => loadCurrentWeek(currentEinrichtung.name);
      weekNavigation.appendChild(currentWeekBtn);
  
      formContainer.classList.remove("hidden");
  }
  