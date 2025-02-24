const API_BASE_URL = "https://smartworkart.onrender.com/api";
import { getCurrentWeek, getCurrentYear, selectedMeals, mealPlanData, formConfig, residentsData, selectedResident } from './variablen.js';
import { createResidentButtons } from './interface.js';

console.log('API_BASE_URL in api.js:', API_BASE_URL);

// Bewohner laden
export async function loadResidents() {
    try {
        // Verwende den korrekten Pfad zur Konfigurationsdatei
        const configPath = '/solo/config/formConfig';
        console.log(`Versuche Konfiguration zu laden von: ${API_BASE_URL}${configPath}`);
        
        const configResponse = await fetch(`${API_BASE_URL}${configPath}`);
        if (!configResponse.ok) {
            console.error(`Fehler beim Laden der Konfiguration (Status: ${configResponse.status})`);
            throw new Error(`Fehler beim Laden der Konfiguration (Status: ${configResponse.status})`);
        }
        
        const configData = await configResponse.json();
        
        // Leere das formConfig Objekt und fülle es mit den neuen Daten
        Object.keys(formConfig).forEach(key => delete formConfig[key]);
        Object.assign(formConfig, configData);
        console.log('FormConfig erfolgreich geladen:', formConfig);
        
        // Dann lade die Bewohner
        const response = await fetch(`${API_BASE_URL}/soloplan/residents`);
        if (!response.ok) {
            console.error('Fehler beim Laden der Bewohner:', await response.text());
            throw new Error(`Fehler beim Laden der Bewohner (Status: ${response.status})`);
        }
        const residentData = await response.json();
        // Leere das residentsData Array und fülle es mit den neuen Daten
        residentsData.length = 0;
        residentsData.push(...residentData);
        console.log('Bewohner erfolgreich geladen:', residentsData);

        // Erstelle die Buttons erst nachdem beide Datensätze geladen sind
        if (formConfig.areas && residentsData.length > 0) {
            await createResidentButtons();
            console.log('Bewohner-Buttons erstellt');
        } else {
            console.error('Keine FormConfig oder Bewohnerdaten verfügbar');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        throw error;
    }
}

// Speiseplan laden
export async function loadMealPlan() {
    try {
        const currentWeek = getCurrentWeek();
        const currentYear = getCurrentYear();
        
        const overrideUrl = `${API_BASE_URL}/soloplan/menu/raw/${currentYear}/KW${currentWeek}_override`;
        const standardUrl = `${API_BASE_URL}/soloplan/menu/raw/${currentYear}/KW${currentWeek}`;
        
        console.log('Debug - API URLs:', {
            API_BASE_URL,
            overrideUrl,
            standardUrl,
            window_location: window.location.href
        });
        
        console.log('Versuche Override-Datei zu laden:', overrideUrl);
        
        // Override anfordern
        const overrideResponse = await fetch(overrideUrl);
        
        // Wenn Override existiert: Verwenden
        if (overrideResponse.ok) {
            console.log('Override-Datei gefunden, verwende diese');
            const data = await overrideResponse.json();
            processMealPlanData(data);
        } 
        // Falls 404 -> Standard
        else if (overrideResponse.status === 404) {
            console.log('Keine Override-Datei (404), lade Standard-Datei:', standardUrl);
            const standardResponse = await fetch(standardUrl);
            if (!standardResponse.ok) {
                throw new Error(`HTTP error! status: ${standardResponse.status}`);
            }
            const data = await standardResponse.json();
            processMealPlanData(data);
        } 
        // Falls andere Fehler (403, 500, ...)
        else {
            const errorText = await overrideResponse.text();
            throw new Error(`Fehler bei Override-Datei: ${overrideResponse.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Fehler beim Laden des Speiseplans:', error);
        Object.assign(mealPlanData, { days: [] });
        throw error;
    }
}

// Bewohnerauswahlen laden
export async function loadResidentSelections(resident) {
    try {
        const currentWeek = getCurrentWeek();
        const currentYear = getCurrentYear();
        
        const fileName = `${resident.firstName}_${resident.lastName}`;
        const response = await fetch(
            `${API_BASE_URL}/soloplan/selections/${currentYear}/KW${currentWeek}/${fileName}`
        );
        
        if (response.ok) {
            const data = await response.json();
            // Leere die selectedMeals zuerst
            Object.keys(selectedMeals).forEach(key => delete selectedMeals[key]);
            // Füge dann die neuen Daten hinzu
            Object.assign(selectedMeals, data);
            console.log(`Geladene Auswahlen für KW${currentWeek}/${currentYear}:`, selectedMeals);
        } else {
            // Wenn keine Daten gefunden wurden, leere die selectedMeals
            Object.keys(selectedMeals).forEach(key => delete selectedMeals[key]);
            console.log(`Keine Auswahlen gefunden für KW${currentWeek}/${currentYear}`);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bewohnerauswahl:', error);
        Object.keys(selectedMeals).forEach(key => delete selectedMeals[key]);
        throw error;
    }
}

// Bewohnerauswahlen speichern
export async function saveResidentSelections() {
    if (!selectedResident || Object.keys(selectedResident).length === 0) {
        console.error('Kein Bewohner ausgewählt');
        return;
    }

    try {
        const currentWeek = getCurrentWeek();
        const currentYear = getCurrentYear();
        
        const fileName = `${selectedResident.firstName}_${selectedResident.lastName}`;
        console.log(`Speichere Auswahlen für KW${currentWeek}/${currentYear}:`, selectedMeals);
        
        const response = await fetch(
            `${API_BASE_URL}/soloplan/selections/${currentYear}/KW${currentWeek}/${fileName}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedMeals)
            }
        );

        if (!response.ok) {
            throw new Error(`Fehler beim Speichern der Auswahl für KW${currentWeek}/${currentYear}`);
        }
        
        console.log(`Auswahlen erfolgreich gespeichert für KW${currentWeek}/${currentYear}`);
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

// Existierende Daten prüfen
export async function checkExistingData(resident) {
    try {
        const currentWeek = getCurrentWeek();
        const currentYear = getCurrentYear();
        
        const fileName = `${resident.firstName}_${resident.lastName}`;
        const response = await fetch(
            `${API_BASE_URL}/soloplan/hasData/${currentYear}/KW${currentWeek}/${fileName}`
        );
        if (!response.ok) {
            throw new Error('Fehler beim Prüfen der Daten');
        }
        const data = await response.json();
        return data.exists;
    } catch (error) {
        console.error('Fehler beim Prüfen existierender Daten:', error);
        return false;
    }
}

// Bewohnerbereich aktualisieren
export async function updateResidentArea(resident, areaName, newValue) {
    try {
        // Erstelle eine Kopie der aktuellen Daten
        const updatedResident = { ...resident };
        
        // Aktualisiere nur den spezifischen Wert
        if (typeof updatedResident.areas[areaName] === 'object') {
            updatedResident.areas[areaName].value = newValue;
        } else {
            updatedResident.areas[areaName] = newValue;
        }
        
        // Erstelle den korrekten Dateinamen ohne Leerzeichen am Ende
        const firstName = resident.firstName.trim();
        const lastName = resident.lastName.trim();
        const fileName = `${firstName}_${lastName}`;
        
        // Sende Update-Request an den Server
        const response = await fetch(`${API_BASE_URL}/soloplan/residents/${fileName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedResident)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server-Antwort:', errorText);
            throw new Error('Fehler beim Speichern der Änderungen');
        }
        
        // Aktualisiere die lokalen Daten
        Object.assign(resident, updatedResident);
        
        return resident;
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Bewohnerdaten:', error);
        throw error;
    }
}

// Hilfsfunktion zum Verarbeiten der Mahlzeitendaten
function processMealPlanData(data) {
    console.log('Rohdaten vom Server:', data);
    
    Object.assign(mealPlanData, {
        days: data.days.map(dayData => ({
            day: dayData.day,
            suppe: dayData.suppe || null,
            menue1: dayData.menue1 || null,
            menue2: dayData.menue2 || null,
            dessert: dayData.dessert || null,
            abendSuppe: dayData.abendSuppe || null,
            milchspeise: dayData.milchspeise || null,
            normalkost: dayData.normalkost || null
        }))
    });
    
    console.log('Finale verarbeitete Daten:', mealPlanData);
}
