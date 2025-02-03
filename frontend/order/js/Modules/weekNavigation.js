// public/js/Modules/weekNavigation.js

import { 
    currentEinrichtung, 
    currentWeek, 
    currentYear, 
    gruppen,
    updateCurrentWeek,
    updateCurrentYear 
} from "./globalVariables.js";
import { saveOrder } from "./save.js";
import { loadWeekData } from "./api.js";
import { getDateFromWeek, getISOWeekYear, getISOWeek } from "./dateUtils.js";

export function updateWeekDisplay(week, year) {
    const weekDisplay = document.getElementById("week-display");
    weekDisplay.textContent = `KW ${week}, ${year}`;
}

export function changeWeek(offset, einrichtungName) {
    const modifiedInputs = document.querySelectorAll('input[data-user-modified="true"]');
    const modifiedInfos = Array.from(document.querySelectorAll('.info-button:not(.info-saved)'));
    
    if (modifiedInputs.length > 0 || 
        (modifiedInfos.length > 0 && modifiedInfos.some(btn => btn.dataset.info))) {
        const confirmSave = window.confirm(
            "Sie haben Werte oder Informationen eingetragen aber nicht gespeichert! Sollen diese gespeichert werden?\n\n[OK] speichert die Werte und wechselt die Woche\n[Abbrechen] verwirft die Werte und Sie bleiben in der Woche"
        );
        if (confirmSave) {
            saveOrder(currentEinrichtung, currentWeek, currentYear).then(() => {
                executeWeekChange();
            });
            return;
        } else {
            modifiedInputs.forEach(input => {
                input.dataset.userModified = "false";
                input.style.color = "gray";
                input.style.fontWeight = "normal";
                input.style.backgroundColor = "";
                input.style.border = "";
            });
            loadWeekData(currentEinrichtung.name, currentWeek, currentYear, gruppen);
            return;
        }
    }
    executeWeekChange();

    function executeWeekChange() {
        const date = getDateFromWeek(currentWeek, currentYear);
        date.setDate(date.getDate() + offset * 7);

        const newWeek = getISOWeek(date);
        const newYear = getISOWeekYear(date);
        
        updateCurrentWeek(newWeek);
        updateCurrentYear(newYear);

        console.log("Wechsel zu KW:", newWeek, newYear);
        updateWeekDisplay(newWeek, newYear);

        loadWeekData(currentEinrichtung.name, newWeek, newYear, gruppen);
    }
}

export function loadCurrentWeek(einrichtungName) {
    const modifiedInputs = document.querySelectorAll('input[data-user-modified="true"]');
    if (modifiedInputs.length > 0) {
        const confirmSave = window.confirm(
          "Sie haben Werte eingetragen aber nicht gespeichert! Sollen diese gespeichert werden?\n\n[OK] speichert die Werte und wechselt die Woche\n[Abbrechen] verwirft die Werte und Sie bleiben in der Woche"
        );
        if (confirmSave) {
            saveOrder(currentEinrichtung, currentWeek, currentYear).then(() => {
                executeCurrentWeekChange();
            });
            return;
        } else {
            modifiedInputs.forEach(input => {
                input.dataset.userModified = "false";
                input.style.color = "gray";
                input.style.fontWeight = "normal";
                input.style.backgroundColor = "";
                input.style.border = "";
            });
            loadWeekData(currentEinrichtung.name, currentWeek, currentYear, gruppen);
            return;
        }
    }
    executeCurrentWeekChange();

    function executeCurrentWeekChange() {
        const today = new Date();
        const newWeek = getISOWeek(today);
        const newYear = today.getFullYear();

        updateCurrentWeek(newWeek);
        updateCurrentYear(newYear);

        console.log("Wechsel zur aktuellen KW:", newWeek, newYear);
        updateWeekDisplay(newWeek, newYear);

        loadWeekData(currentEinrichtung.name, newWeek, newYear, gruppen);
    }
}
