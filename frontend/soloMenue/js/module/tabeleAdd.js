/**
 * Modul zum Hinzufügen und Verwalten von Tabellenzeilen
 */

// Referenz auf DOM-Elemente
let addKategorieBtn;
let kategorieFormOverlay;
let closeKategorieFormBtn;
let cancelKategorieFormBtn;
let saveKategorieFormBtn;
let displayKategorieInput;
let kategorieTextInput;
let kategorienListe;
let formTabs;
let editPanel;
let backToListBtn;
let editKategorieIdInput;
let editDisplayKategorieInput;
let editKategorieTextInput;
let updateKategorieBtn;
let deleteKategorieBtn;

// Referenzen für Extra-Optionen
let extraOptionenKategorieSelect;
let neueExtraKategorieContainer;
let neueExtraKategorieInput;
let extraOptionNameInput;
let extraOptionDescriptionInput;
let saveExtraOptionBtn;
let cancelExtraOptionBtn;
let extraOptionenListe;
let editExtraOptionPanel;
let backToExtrasBtn;
let editExtraOptionIdInput;
let editExtraOptionKategorieSelect;
let editExtraOptionNameInput;
let editExtraOptionDescriptionInput;
let updateExtraOptionBtn;
let deleteExtraOptionBtn;

// Referenzen für Sonderwünsche
let sonderwunschNameInput;
let sonderwunschDescriptionInput;
let saveSonderwunschBtn;
let cancelSonderwunschBtn;
let sonderwunschListe;
let editSonderwunschPanel;
let backToSonderwunscheBtn;
let editSonderwunschIdInput;
let editSonderwunschNameInput;
let editSonderwunschDescriptionInput;
let updateSonderwunschBtn;
let deleteSonderwunschBtn;

// Speichert die aktuelle Liste der benutzerdefinierten Kategorien
let extraKategorien = [];
let aktuelleKategorieId = null;

// Speichert die aktuelle Liste der Extra-Optionen
let extraOptionen = [];
let aktuelleExtraOptionId = null;

// Speichert die aktuelle Liste der Sonderwünsche
let sonderwuensche = [];
let aktuelleSonderwunschId = null;

/**
 * Lädt die Extra-Optionen vom Server
 * @returns {Promise<Array>} Die Liste der Extra-Optionen
 */
async function ladeExtraOptionen() {
    try {
        const response = await fetch('/api/solomenue/extras');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Extra-Optionen');
        }

        const daten = await response.json();
        
        // Sicherstellen, dass wir ein Array haben
        if (daten && Array.isArray(daten.extramenues)) {
            extraOptionen = daten.extramenues;
        } else {
            console.warn('Unerwartetes Format für extraOptionen - setze auf leeres Array');
            extraOptionen = [];
        }
        
        return extraOptionen;
    } catch (error) {
        console.error('Fehler beim Laden der Extra-Optionen:', error);
        extraOptionen = [];
        return [];
    }
}

/**
 * Speichert eine neue Extra-Option
 * @param {Object} option - Die zu speichernde Extra-Option
 * @returns {Promise<Object>} Die gespeicherte Extra-Option
 */
async function speichereExtraOption(option) {
    try {
        const response = await fetch('/api/solomenue/extras', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(option)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern der Extra-Option');
        }

        const result = await response.json();
        
        // Event auslösen, damit andere Module die Änderung mitbekommen
        document.dispatchEvent(new CustomEvent('extraOptionenUpdated'));
        
        return result;
    } catch (error) {
        console.error('Fehler beim Speichern der Extra-Option:', error);
        throw error;
    }
}

/**
 * Aktualisiert eine bestehende Extra-Option
 * @param {Object} extraOption - Die zu aktualisierende Extra-Option mit ID und Daten
 */
async function aktualisiereExtraOption(extraOption) {
    try {
        if (!extraOption || !extraOption.id) {
            throw new Error('Keine gültige ID für die Aktualisierung angegeben');
        }

        const id = extraOption.id;
        
        const response = await fetch(`/api/solomenue/extras/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(extraOption)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Aktualisieren der Extra-Option');
        }

        return await response.json();
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Extra-Option:', error);
        throw error;
    }
}

/**
 * Löscht eine Extra-Option
 * @param {string} id - Die ID der zu löschenden Extra-Option
 * @returns {Promise<Object>} Das Ergebnis des Löschens
 */
async function loescheExtraOption(id) {
    try {
        const response = await fetch(`/api/solomenue/extras/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Fehler beim Löschen der Extra-Option');
        }

        const result = await response.json();
        
        // Event auslösen, damit andere Module die Änderung mitbekommen
        document.dispatchEvent(new CustomEvent('extraOptionenUpdated'));
        
        return result;
    } catch (error) {
        console.error('Fehler beim Löschen der Extra-Option:', error);
        throw error;
    }
}

/**
 * Zeigt die Liste der verfügbaren Extra-Optionen an
 */
async function zeigeExtraOptionenListe() {
    try {
        // Container für die Liste finden
        const extraOptionenContainer = document.getElementById('extra-optionen-liste');
        if (!extraOptionenContainer) return;
        
        // Extra-Optionen laden
        const extraOptionen = await ladeExtraOptionen();
        
        // Container leeren
        extraOptionenContainer.innerHTML = '';
        
        // Prüfen, ob Extra-Optionen vorhanden sind
        if (extraOptionen.length === 0) {
            extraOptionenContainer.innerHTML = '<p>Keine Extra-Optionen vorhanden.</p>';
            return;
        }
        
        // Gruppiere die Extra-Optionen nach Kategorie
        const nachKategorieGruppiert = {};
        extraOptionen.forEach(option => {
            // Unterstützung für beide Feldnamen
            const kategorie = option.kategorieNamen || option['kategorie-name'] || 'Andere';
            if (!nachKategorieGruppiert[kategorie]) {
                nachKategorieGruppiert[kategorie] = [];
            }
            nachKategorieGruppiert[kategorie].push(option);
        });
        
        // Liste erstellen (gruppiert nach Kategorie)
        const kategorien = Object.keys(nachKategorieGruppiert).sort();
        
        kategorien.forEach(kategorie => {
            // Kategorie-Header hinzufügen
            const kategorieDiv = document.createElement('div');
            kategorieDiv.className = 'extra-optionen-kategorie';
            
            const kategorieHeader = document.createElement('h4');
            kategorieHeader.textContent = kategorie;
            kategorieDiv.appendChild(kategorieHeader);
            
            // Optionen der Kategorie hinzufügen
            const optionenListe = document.createElement('ul');
            optionenListe.className = 'extra-optionen-liste';
            
            nachKategorieGruppiert[kategorie].forEach(option => {
                const optionItem = document.createElement('li');
                optionItem.className = 'extra-option-item';
                
                // Name und Beschreibung
                const optionInfo = document.createElement('div');
                optionInfo.className = 'extra-option-info';
                
                const optionName = document.createElement('h5');
                optionName.textContent = option.name;
                optionInfo.appendChild(optionName);
                
                // Unterstützung für beide Feldnamen (description und beschreibung)
                if (option.description || option.beschreibung) {
                    const optionDesc = document.createElement('p');
                    optionDesc.textContent = option.description || option.beschreibung;
                    optionInfo.appendChild(optionDesc);
                }
                
                optionItem.appendChild(optionInfo);
                
                // Aktionen (Bearbeiten, Löschen)
                const optionActions = document.createElement('div');
                optionActions.className = 'extra-option-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'btn edit-btn';
                editBtn.innerHTML = '✎';
                editBtn.setAttribute('title', 'Bearbeiten');
                editBtn.addEventListener('click', () => zeigeExtraOptionBearbeitungsPanel(option.id));
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn delete-btn';
                deleteBtn.innerHTML = '✖';
                deleteBtn.setAttribute('title', 'Löschen');
                deleteBtn.addEventListener('click', () => loescheExtraOptionHandler(option.id));
                
                optionActions.appendChild(editBtn);
                optionActions.appendChild(deleteBtn);
                
                optionItem.appendChild(optionActions);
                
                optionenListe.appendChild(optionItem);
            });
            
            kategorieDiv.appendChild(optionenListe);
            extraOptionenContainer.appendChild(kategorieDiv);
        });
    } catch (error) {
        console.error('Fehler beim Anzeigen der Extra-Optionen:', error);
        
        // Container für die Liste finden
        const extraOptionenContainer = document.getElementById('extra-optionen-liste');
        if (extraOptionenContainer) {
            extraOptionenContainer.innerHTML = '<p class="error">Fehler beim Laden der Extra-Optionen.</p>';
        }
    }
}

/**
 * Öffnet das Formular zur Bearbeitung einer Extra-Option
 * @param {string} optionId - ID der zu bearbeitenden Extra-Option
 */
async function zeigeExtraOptionBearbeitungsPanel(optionId) {
    try {
        // Option aus der Liste der geladenen Optionen finden
        const extraOptionen = await getExtraOptionen();
        const zuBearbeitendeOption = extraOptionen.find(option => option.id === optionId);
        
        if (!zuBearbeitendeOption) {
            console.error(`Extra-Option mit ID ${optionId} nicht gefunden`);
            return;
        }
        
        console.log("Bearbeiten der Extra-Option:", zuBearbeitendeOption);
        
        // Zum Tab "Extra-Optionen" wechseln
        wechsleTab('extra-optionen');
        
        // Formularfelder mit den Daten der Option befüllen
        const extraOptionenKategorie = document.getElementById('extra-optionen-kategorie');
        const extraOptionName = document.getElementById('extra-option-name');
        const extraOptionDescription = document.getElementById('extra-option-description');
        const neueExtraKategorie = document.getElementById('neue-extra-kategorie');
        const neueKategorieContainer = document.querySelector('.neue-kategorie-container');
        
        // Kategorie setzen
        const kategorieName = zuBearbeitendeOption['kategorie-name'];
        
        // Wir prüfen, ob die Kategorie im Dropdown existiert
        let kategorieExistiert = false;
        for (let i = 0; i < extraOptionenKategorie.options.length; i++) {
            if (extraOptionenKategorie.options[i].value === kategorieName) {
                extraOptionenKategorie.value = kategorieName;
                kategorieExistiert = true;
                break;
            }
        }
        
        // Wenn die Kategorie nicht existiert, wählen wir "Neue Kategorie..." und setzen den Wert im Eingabefeld
        if (!kategorieExistiert) {
            extraOptionenKategorie.value = 'neue-kategorie';
            neueExtraKategorie.value = kategorieName;
            neueKategorieContainer.style.display = 'block';
        } else {
            neueKategorieContainer.style.display = 'none';
        }
        
        // Name und Beschreibung setzen
        extraOptionName.value = zuBearbeitendeOption.name || '';
        extraOptionDescription.value = zuBearbeitendeOption.beschreibung || '';
        
        // Speichern-Button verstecken und den Aktualisieren-Button anzeigen
        const saveButton = document.getElementById('save-extra-option-form');
        const updateButton = document.getElementById('update-extra-option-form');
        const cancelButton = document.getElementById('cancel-extra-option-form');
        
        // ID der zu bearbeitenden Option speichern (für die Aktualisierung)
        // Wir verwenden ein verstecktes Feld
        let hiddenIdField = document.getElementById('bearbeitung-extra-option-id');
        if (!hiddenIdField) {
            hiddenIdField = document.createElement('input');
            hiddenIdField.type = 'hidden';
            hiddenIdField.id = 'bearbeitung-extra-option-id';
            document.getElementById('extra-option-form').appendChild(hiddenIdField);
        }
        hiddenIdField.value = optionId;
        
        // Buttons anpassen
        if (saveButton) saveButton.style.display = 'none';
        if (updateButton) {
            updateButton.style.display = 'inline-block';
        } else {
            // Falls der Update-Button noch nicht existiert, erstellen wir ihn
            const formActions = document.querySelector('#extra-option-form .form-actions');
            if (formActions) {
                const newUpdateButton = document.createElement('button');
                newUpdateButton.id = 'update-extra-option-form';
                newUpdateButton.className = 'btn';
                newUpdateButton.textContent = 'Aktualisieren';
                newUpdateButton.addEventListener('click', aktualisiereExtraOptionFormularDaten);
                
                // Einfügen vor dem Abbrechen-Button
                if (cancelButton) {
                    formActions.insertBefore(newUpdateButton, cancelButton);
                } else {
                    formActions.appendChild(newUpdateButton);
                }
            }
        }
        
        // Löschen-Button anzeigen
        let deleteButton = document.getElementById('delete-extra-option-form');
        if (deleteButton) {
            deleteButton.style.display = 'inline-block';
        } else {
            // Falls der Löschen-Button noch nicht existiert, erstellen wir ihn
            const formActions = document.querySelector('#extra-option-form .form-actions');
            if (formActions) {
                const newDeleteButton = document.createElement('button');
                newDeleteButton.id = 'delete-extra-option-form';
                newDeleteButton.className = 'btn delete-btn';
                newDeleteButton.textContent = 'Löschen';
                newDeleteButton.addEventListener('click', async () => {
                    if (confirm('Sind Sie sicher, dass Sie diese Extra-Option löschen möchten?')) {
                        await loescheExtraOptionHandler(optionId);
                        resetFormular();
                        await zeigeExtraOptionenListe();
                    }
                });
                
                // Einfügen nach dem Aktualisieren-Button
                const updateBtn = document.getElementById('update-extra-option-form');
                if (updateBtn && updateBtn.nextSibling) {
                    formActions.insertBefore(newDeleteButton, updateBtn.nextSibling);
                } else {
                    formActions.appendChild(newDeleteButton);
                }
            }
        }
        
        // Ändern Sie die Überschrift des Formulars
        const formHeader = document.querySelector('#extra-option-form .card-title');
        if (formHeader) {
            formHeader.textContent = 'Extra-Option bearbeiten';
        }
        
        // Scroll zum Formular, um es für den Benutzer sichtbar zu machen
        document.getElementById('extra-option-form').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Fehler beim Anzeigen des Bearbeitungspanels:', error);
    }
}

/**
 * Setzt das Formular zurück
 */
function resetFormular() {
    // Formulare zurücksetzen
    if (extraOptionNameInput) extraOptionNameInput.value = '';
    if (extraOptionDescriptionInput) extraOptionDescriptionInput.value = '';
    if (extraOptionenKategorieSelect) extraOptionenKategorieSelect.value = '';
    if (neueExtraKategorieInput) neueExtraKategorieInput.value = '';
    if (neueExtraKategorieContainer) neueExtraKategorieContainer.style.display = 'none';
    
    // Formular ausblenden
    const extraOptionForm = document.getElementById('extra-option-form');
    if (extraOptionForm) {
        extraOptionForm.style.display = 'none';
    }
    
    // Toggle-Button-Text zurücksetzen
    const toggleBtnText = document.getElementById('toggle-extraoption-btn-text');
    if (toggleBtnText) {
        toggleBtnText.textContent = '+ Neue Extra-Option hinzufügen';
    }
    
    // Verstecke das Bearbeitungspanel, wenn es existiert
    if (editExtraOptionPanel) {
        editExtraOptionPanel.style.display = 'none';
    }
    
    // Zeige die Liste wieder an
    if (extraOptionenListe) {
        extraOptionenListe.style.display = 'block';
    }
    
    // Aktuelle IDs zurücksetzen
    aktuelleExtraOptionId = null;
}

/**
 * Speichert die Formulardaten für eine neue Extra-Option
 */
async function speichereExtraOptionFormularDaten() {
    try {
        // Formulardaten abrufen
        const kategorie = extraOptionenKategorieSelect.value;
        const name = extraOptionNameInput.value.trim();
        const description = extraOptionDescriptionInput.value.trim();

        // Validierung
        if (!name) {
            alert('Bitte geben Sie einen Namen ein');
            return;
        }

        let kategorieWert;

        // Wenn "Neue Kategorie" ausgewählt wurde, neue Kategorie verwenden
        if (kategorie === 'neue-kategorie') {
            const neueKategorie = neueExtraKategorieInput.value.trim();
            if (!neueKategorie) {
                alert('Bitte geben Sie eine Kategorie ein');
                return;
            }
            // Neue Kategorie immer in Großbuchstaben speichern
            kategorieWert = neueKategorie.toUpperCase();
        } else {
            // Bestehende Kategorie verwenden
            kategorieWert = kategorie;
        }

        // Extra-Option erstellen
        const extraOption = {
            name,
            kategorieNamen: kategorieWert,
            description
        };

        // Option auf dem Server speichern
        await speichereExtraOption(extraOption);

        // Formular zurücksetzen und ausblenden
        extraOptionNameInput.value = '';
        extraOptionDescriptionInput.value = '';
        if (neueExtraKategorieInput) neueExtraKategorieInput.value = '';
        if (neueExtraKategorieContainer) neueExtraKategorieContainer.style.display = 'none';
        
        document.getElementById('extra-option-form').style.display = 'none';
        document.getElementById('toggle-extraoption-btn-text').textContent = '+ Neue Extra-Option hinzufügen';

        // Extra-Optionen neu laden UND in der Liste anzeigen
        await zeigeExtraOptionenListe();
        
        // Kategorien-Dropdowns aktualisieren, falls neue Kategorie hinzugefügt wurde
        await aktualisiereKategorieDropdowns();

        // Erfolgsbenachrichtigung
        alert('Extra-Option erfolgreich gespeichert!');
    } catch (error) {
        console.error('Fehler beim Speichern der Extra-Option:', error);
        alert('Fehler beim Speichern: ' + error.message);
    }
}

/**
 * Aktualisiert die Formulardaten für eine bestehende Extra-Option
 */
async function aktualisiereExtraOptionFormularDaten() {
    try {
        // ID prüfen
        if (!aktuelleExtraOptionId) {
            alert('Keine ID gefunden');
            return;
        }

        // Formulardaten abrufen
        const kategorie = editExtraOptionKategorieSelect.value;
        const name = editExtraOptionNameInput.value.trim();
        const description = editExtraOptionDescriptionInput.value.trim();

        // Validierung
        if (!name) {
            alert('Bitte geben Sie einen Namen ein');
            return;
        }

        // Extra-Option aktualisieren
        const extraOption = {
            id: aktuelleExtraOptionId,
            name,
            kategorieNamen: kategorie.toUpperCase(), // Immer in Großbuchstaben speichern
            description
        };

        // Option auf dem Server aktualisieren
        await aktualisiereExtraOption(extraOption);

        // Formular zurücksetzen und ausblenden
        resetFormular();

        // Extra-Optionen neu laden UND in der Liste anzeigen
        await zeigeExtraOptionenListe();
        
        // Kategorien-Dropdowns aktualisieren, falls die Kategorie geändert wurde
        await aktualisiereKategorieDropdowns();

        // Erfolgsbenachrichtigung
        alert('Extra-Option erfolgreich aktualisiert!');
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Extra-Option:', error);
        alert('Fehler beim Aktualisieren: ' + error.message);
    }
}

/**
 * Event-Handler zum Löschen einer Extra-Option
 * @param {string} optionId - ID der zu löschenden Extra-Option
 */
async function loescheExtraOptionHandler(optionId) {
    try {
        if (confirm('Sind Sie sicher, dass Sie diese Extra-Option löschen möchten?')) {
            await loescheExtraOption(optionId);
            
            // Formular zurücksetzen
            resetFormular();
            
            // Liste aktualisieren
            await zeigeExtraOptionenListe();
            
            // Dropdown-Menüs aktualisieren
            await aktualisiereKategorieDropdowns();
            
            alert('Extra-Option erfolgreich gelöscht!');
        }
    } catch (error) {
        console.error('Fehler beim Löschen der Extra-Option:', error);
        alert('Fehler beim Löschen der Extra-Option: ' + error.message);
    }
}

/**
 * Lädt die benutzerdefinierten Kategorien vom Server
 * @returns {Promise<Array>} Die Liste der Kategorien
 */
async function ladeExtraKategorien() {
    try {
        const response = await fetch('/api/solomenue/extrakategorien');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Extra-Kategorien');
        }

        const daten = await response.json();
        
        // Sicherstellen, dass wir ein Array haben
        if (Array.isArray(daten)) {
            extraKategorien = daten;
        } else {
            console.warn('Unerwartetes Format für extraKategorien - setze auf leeres Array');
            extraKategorien = [];
        }
        
        return extraKategorien;
    } catch (error) {
        console.error('Fehler beim Laden der Extra-Kategorien:', error);
        extraKategorien = [];
        return [];
    }
}

/**
 * Speichert eine neue oder aktualisierte Kategorie
 * @param {Object} kategorie - Die zu speichernde Kategorie
 * @returns {Promise<Object>} Die gespeicherte Kategorie
 */
async function speichereKategorie(kategorie) {
    try {
        const response = await fetch('/api/solomenue/extrakategorien', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(kategorie)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern der Kategorie');
        }

        // Kategorie wurde erfolgreich gespeichert
        const result = await response.json();
        
        // Kategorien neu laden
        await ladeExtraKategorien();
        
        // Dropdown-Menüs aktualisieren
        await aktualisiereKategorieDropdowns();
        
        return result;
    } catch (error) {
        console.error('Fehler beim Speichern der Kategorie:', error);
        throw error;
    }
}

/**
 * Löscht eine Kategorie
 * @param {string} id - Die ID der zu löschenden Kategorie
 * @returns {Promise<boolean>} Erfolg der Operation
 */
async function loescheKategorie(id) {
    try {
        const response = await fetch(`/api/solomenue/extrakategorien/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Fehler beim Löschen der Kategorie');
        }

        // Kategorie wurde erfolgreich gelöscht
        const result = await response.json();
        
        // Kategorien neu laden
        await ladeExtraKategorien();
        
        // Dropdown-Menüs aktualisieren
        await aktualisiereKategorieDropdowns();
        
        return result;
    } catch (error) {
        console.error('Fehler beim Löschen der Kategorie:', error);
        throw error;
    }
}

/**
 * Öffnet das Formular zur Kategorienverwaltung
 */
function oeffneKategorieFormular() {
    if (!kategorieFormOverlay) return;
    
    // Formular zurücksetzen
    displayKategorieInput.value = '';
    kategorieTextInput.value = '';
    
    // Zum Kategorien-Tab wechseln
    wechsleTab('kategorien');
    
    // Formular ausblenden
    const kategorieForm = document.getElementById('kategorie-form');
    if (kategorieForm) {
        kategorieForm.style.display = 'none';
    }
    
    // Toggle-Button-Text zurücksetzen
    const toggleBtnText = document.getElementById('toggle-kategorie-btn-text');
    if (toggleBtnText) {
        toggleBtnText.textContent = '+ Neue Kategorie hinzufügen';
    }
    
    // Bearbeitungspanel ausblenden
    versteckeBearbeitungsPanel();
    
    // Kategorien neu laden
    zeigeKategorienListe();
    
    // Formular anzeigen
    kategorieFormOverlay.classList.add('active');
}

/**
 * Schließt das Formular
 */
function schliesseKategorieFormular() {
    if (!kategorieFormOverlay) return;
    kategorieFormOverlay.classList.remove('active');
}

/**
 * Wechselt zwischen den Tabs im Formular
 * @param {string} tabId - Die ID des Tabs, zu dem gewechselt werden soll
 */
function wechsleTab(tabId) {
    // Alle Tabs und Tab-Inhalte inaktivieren
    document.querySelectorAll('.form-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Gewählten Tab und Inhalt aktivieren
    const selectedTab = document.querySelector(`.form-tab[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(tabId);
    
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    if (selectedPane) {
        selectedPane.classList.add('active');
        
        // Bei Wechsel zu "kategorien" die Liste aktualisieren
        if (tabId === 'kategorien') {
            zeigeKategorienListe();
        }
        
        // Bei Wechsel zu "extra-optionen" die Liste aktualisieren
        if (tabId === 'extra-optionen') {
            zeigeExtraOptionenListe();
        }
        
        // Bei Wechsel zu "Sonderwünsche" die Liste aktualisieren
        if (tabId === 'sonderwuensche') {
            zeigeSonderwunschListe();
        }
    }
}

/**
 * Zeigt die Liste der vorhandenen Kategorien an
 */
async function zeigeKategorienListe() {
    if (!kategorienListe) return;
    
    // Lade-Anzeige
    kategorienListe.innerHTML = '<div class="loading-message">Kategorien werden geladen...</div>';
    
    // Kategorien laden
    await ladeExtraKategorien();
    
    // Liste leeren
    kategorienListe.innerHTML = '';
    
    // Wenn keine Kategorien vorhanden sind
    if (extraKategorien.length === 0) {
        kategorienListe.innerHTML = '<div class="no-kategorien">Keine Kategorien vorhanden</div>';
        return;
    }
    
    // Kategorien anzeigen
    extraKategorien.forEach(kategorie => {
        const kategorieItem = document.createElement('div');
        kategorieItem.classList.add('kategorie-item');
        kategorieItem.dataset.id = kategorie.id;
        
        kategorieItem.innerHTML = `
            <div class="kategorie-info">
                <div class="kategorie-name">${kategorie.displayKategorie}</div>
                <div class="kategorie-text">${kategorie.text}</div>
            </div>
            <div class="kategorie-actions">
                <button class="edit-btn" title="Bearbeiten">✎</button>
                <button class="delete-btn" title="Löschen">✖</button>
            </div>
        `;
        
        // Event-Listener für die Bearbeiten-Schaltfläche
        const editBtn = kategorieItem.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                zeigeBearbeitungsPanel(kategorie);
            });
        }
        
        // Event-Listener für die Löschen-Schaltfläche
        const deleteBtn = kategorieItem.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Möchten Sie die Kategorie "${kategorie.displayKategorie}" wirklich löschen?`)) {
                    loescheKategorieHandler(kategorie.id);
                }
            });
        }
        
        kategorienListe.appendChild(kategorieItem);
    });
}

/**
 * Zeigt das Bearbeitungspanel für eine Kategorie an
 * @param {Object} kategorie - Die zu bearbeitende Kategorie
 */
function zeigeBearbeitungsPanel(kategorie) {
    if (!editPanel) return;
    
    // Kategorie-ID speichern
    aktuelleKategorieId = kategorie.id;
    
    // Formularfelder füllen
    editKategorieIdInput.value = kategorie.id;
    editDisplayKategorieInput.value = kategorie.displayKategorie;
    editKategorieTextInput.value = kategorie.text;
    
    // Bearbeitungspanel anzeigen
    editPanel.classList.add('active');
}

/**
 * Versteckt das Bearbeitungspanel
 */
function versteckeBearbeitungsPanel() {
    if (!editPanel) return;
    
    // Formularfelder zurücksetzen
    editKategorieIdInput.value = '';
    editDisplayKategorieInput.value = '';
    editKategorieTextInput.value = '';
    
    // Bearbeitungspanel ausblenden
    editPanel.classList.remove('active');
    
    // Aktuelle Kategorie-ID zurücksetzen
    aktuelleKategorieId = null;
}

/**
 * Speichert die im Formular eingegebenen Daten
 */
async function speichereFormularDaten() {
    const displayKategorie = displayKategorieInput.value.trim();
    const text = kategorieTextInput.value.trim();
    
    if (!displayKategorie) {
        alert('Bitte geben Sie einen Anzeigenamen für die Kategorie ein.');
        return;
    }
    
    if (!text) {
        alert('Bitte geben Sie einen Text ein.');
        return;
    }
    
    try {
        const neueKategorie = {
            id: Date.now().toString(), // Einfache ID-Generierung
            displayKategorie,
            text
        };
        
        await speichereKategorie(neueKategorie);
        
        // Liste der Kategorien aktualisieren
        extraKategorien = await ladeExtraKategorien();
        
        // Event auslösen, um die Tabelle zu aktualisieren
        document.dispatchEvent(new CustomEvent('extraKategorienUpdated', {
            detail: { kategorien: extraKategorien }
        }));
        
        // Formularfelder zurücksetzen
        displayKategorieInput.value = '';
        kategorieTextInput.value = '';
        
        // Formular ausblenden
        document.getElementById('kategorie-form').style.display = 'none';
        document.getElementById('toggle-kategorie-btn-text').textContent = '+ Neue Kategorie hinzufügen';
        
        // Erfolgsmeldung anzeigen
        alert('Kategorie erfolgreich gespeichert!');
        
        // Kategorien-Liste neu laden
        zeigeKategorienListe();
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern der Kategorie: ' + error.message);
    }
}

/**
 * Aktualisiert eine bestehende Kategorie
 */
async function aktualisiereKategorie() {
    const id = editKategorieIdInput.value;
    const displayKategorie = editDisplayKategorieInput.value.trim();
    const text = editKategorieTextInput.value.trim();
    
    if (!displayKategorie) {
        alert('Bitte geben Sie einen Anzeigenamen für die Kategorie ein.');
        return;
    }
    
    if (!text) {
        alert('Bitte geben Sie einen Text ein.');
        return;
    }
    
    try {
        const aktualisierteKategorie = {
            id,
            displayKategorie,
            text
        };
        
        await speichereKategorie(aktualisierteKategorie);
        
        // Liste der Kategorien aktualisieren
        extraKategorien = await ladeExtraKategorien();
        
        // Event auslösen, um die Tabelle zu aktualisieren
        document.dispatchEvent(new CustomEvent('extraKategorienUpdated', {
            detail: { kategorien: extraKategorien }
        }));
        
        // Erfolgsmeldung anzeigen
        alert('Kategorie erfolgreich aktualisiert!');
        
        // Bearbeitungspanel verstecken und zur Liste zurückkehren
        versteckeBearbeitungsPanel();
        zeigeKategorienListe();
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        alert('Fehler beim Aktualisieren der Kategorie: ' + error.message);
    }
}

/**
 * Löscht eine Kategorie
 * @param {string} id - Die ID der zu löschenden Kategorie
 */
async function loescheKategorieHandler(id) {
    try {
        await loescheKategorie(id);
        
        // Liste der Kategorien aktualisieren
        extraKategorien = await ladeExtraKategorien();
        
        // Event auslösen, um die Tabelle zu aktualisieren
        document.dispatchEvent(new CustomEvent('extraKategorienUpdated', {
            detail: { kategorien: extraKategorien }
        }));
        
        // Wenn wir gerade im Bearbeitungspanel sind, dieses verstecken
        versteckeBearbeitungsPanel();
        
        // Liste aktualisieren
        zeigeKategorienListe();
        
        // Erfolgsmeldung anzeigen
        alert('Kategorie erfolgreich gelöscht!');
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen der Kategorie: ' + error.message);
    }
}

/**
 * Fügt benutzerdefinierte Kategorien zur Tabelle hinzu
 * @param {HTMLTableElement} tabelle - Die Tabelle, zu der die Kategorien hinzugefügt werden sollen
 */
function fuegeExtraKategorienHinzu(tabelle) {
    if (!tabelle) return;
    
    // Sicherstellen, dass extraKategorien ein Array ist
    if (!Array.isArray(extraKategorien)) {
        console.warn('extraKategorien ist kein Array - wird übersprungen');
        return;
    }
    
    if (extraKategorien.length === 0) {
        console.log('Keine benutzerdefinierten Kategorien gefunden');
        return;
    }
    
    const tbody = tabelle.querySelector('tbody');
    if (!tbody) return;
    
    console.log('Füge', extraKategorien.length, 'Extra-Kategorien zur Tabelle hinzu');
    
    // Für jede benutzerdefinierte Kategorie eine Zeile hinzufügen
    extraKategorien.forEach(kategorie => {
        const zeile = document.createElement('tr');
        zeile.dataset.extraKategorie = kategorie.id;
        
        // Kategorie-ID in data-Attribut für die Auswahl speichern
        zeile.dataset.kategorie = `extra_${kategorie.id}`;
        
        // Kategoriename in der ersten Spalte
        const kategorieZelle = document.createElement('td');
        kategorieZelle.classList.add('kategorie-zelle');
        kategorieZelle.textContent = kategorie.displayKategorie.toUpperCase();
        zeile.appendChild(kategorieZelle);
        
        // In jeder Zelle für die Wochentage den gleichen Text anzeigen
        const wochentage = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
        wochentage.forEach(tag => {
            const zelle = document.createElement('td');
            zelle.dataset.tag = tag;
            // Kategorie-ID auch in der Zelle speichern für die Auswahl
            zelle.dataset.kategorie = `extra_${kategorie.id}`;
            zelle.classList.add('menue-zelle', 'klickbar');
            zelle.textContent = kategorie.text;
            
            // Eine eindeutige ID für die Zelle setzen
            zelle.id = `zelle-${tag}-extra_${kategorie.id}`;
            
            zeile.appendChild(zelle);
        });
        
        tbody.appendChild(zeile);
    });
}

/**
 * Initialisiert die Formular-Event-Listener
 */
function initialisiereFormular() {
    // DOM-Elemente abrufen für Kategorien
    addKategorieBtn = document.getElementById('add-kategorie-btn');
    kategorieFormOverlay = document.getElementById('kategorie-form-overlay');
    closeKategorieFormBtn = document.getElementById('close-kategorie-form');
    cancelKategorieFormBtn = document.getElementById('cancel-kategorie-form');
    saveKategorieFormBtn = document.getElementById('save-kategorie-form');
    displayKategorieInput = document.getElementById('display-kategorie');
    kategorieTextInput = document.getElementById('kategorie-text');
    kategorienListe = document.getElementById('kategorien-liste');
    formTabs = document.querySelectorAll('.form-tab');
    editPanel = document.getElementById('edit-kategorie-panel');
    backToListBtn = document.getElementById('back-to-list-btn');
    editKategorieIdInput = document.getElementById('edit-kategorie-id');
    editDisplayKategorieInput = document.getElementById('edit-display-kategorie');
    editKategorieTextInput = document.getElementById('edit-kategorie-text');
    updateKategorieBtn = document.getElementById('update-kategorie-btn');
    deleteKategorieBtn = document.getElementById('delete-kategorie-btn');
    
    // DOM-Elemente abrufen für Extra-Optionen
    extraOptionenKategorieSelect = document.getElementById('extra-optionen-kategorie');
    neueExtraKategorieContainer = document.querySelector('.neue-kategorie-container');
    neueExtraKategorieInput = document.getElementById('neue-extra-kategorie');
    extraOptionNameInput = document.getElementById('extra-option-name');
    extraOptionDescriptionInput = document.getElementById('extra-option-description');
    saveExtraOptionBtn = document.getElementById('save-extra-option-form');
    cancelExtraOptionBtn = document.getElementById('cancel-extra-option-form');
    extraOptionenListe = document.getElementById('extra-optionen-liste');
    editExtraOptionPanel = document.getElementById('edit-extra-option-panel');
    backToExtrasBtn = document.getElementById('back-to-extras-btn');
    editExtraOptionIdInput = document.getElementById('edit-extra-option-id');
    editExtraOptionKategorieSelect = document.getElementById('edit-extra-option-kategorie');
    editExtraOptionNameInput = document.getElementById('edit-extra-option-name');
    editExtraOptionDescriptionInput = document.getElementById('edit-extra-option-description');
    updateExtraOptionBtn = document.getElementById('update-extra-option-btn');
    deleteExtraOptionBtn = document.getElementById('delete-extra-option-btn');
    
    // DOM-Elemente abrufen für Sonderwünsche
    sonderwunschNameInput = document.getElementById('sonderwunsch-name');
    sonderwunschDescriptionInput = document.getElementById('sonderwunsch-description');
    saveSonderwunschBtn = document.getElementById('save-sonderwunsch-form');
    cancelSonderwunschBtn = document.getElementById('cancel-sonderwunsch-form');
    sonderwunschListe = document.getElementById('sonderwunsch-liste');
    editSonderwunschPanel = document.getElementById('edit-sonderwunsch-panel');
    backToSonderwunscheBtn = document.getElementById('back-to-sonderwunsche-btn');
    editSonderwunschIdInput = document.getElementById('edit-sonderwunsch-id');
    editSonderwunschNameInput = document.getElementById('edit-sonderwunsch-name');
    editSonderwunschDescriptionInput = document.getElementById('edit-sonderwunsch-description');
    updateSonderwunschBtn = document.getElementById('update-sonderwunsch-btn');
    deleteSonderwunschBtn = document.getElementById('delete-sonderwunsch-btn');
    
    // Event-Listener hinzufügen für Kategorien
    if (addKategorieBtn) {
        addKategorieBtn.addEventListener('click', oeffneKategorieFormular);
    }
    
    if (closeKategorieFormBtn) {
        closeKategorieFormBtn.addEventListener('click', schliesseKategorieFormular);
    }
    
    // Toggle-Button für Kategorieformular
    const toggleKategorieFormButton = document.getElementById('toggle-kategorie-form');
    if (toggleKategorieFormButton) {
        toggleKategorieFormButton.addEventListener('click', function() {
            const kategorieForm = document.getElementById('kategorie-form');
            const toggleBtnText = document.getElementById('toggle-kategorie-btn-text');
            
            if (kategorieForm.style.display === 'none' || !kategorieForm.style.display) {
                kategorieForm.style.display = 'block';
                toggleBtnText.textContent = '- Formular ausblenden';
                // Ausblenden des Bearbeitungspanels, falls es geöffnet ist
                document.getElementById('edit-kategorie-panel').style.display = 'none';
                // Formularfelder fokussieren
                document.getElementById('display-kategorie').focus();
            } else {
                kategorieForm.style.display = 'none';
                toggleBtnText.textContent = '+ Neue Kategorie hinzufügen';
            }
        });
    }
    
    if (cancelKategorieFormBtn) {
        cancelKategorieFormBtn.addEventListener('click', function() {
            // Formular zurücksetzen und ausblenden
            displayKategorieInput.value = '';
            kategorieTextInput.value = '';
            document.getElementById('kategorie-form').style.display = 'none';
            document.getElementById('toggle-kategorie-btn-text').textContent = '+ Neue Kategorie hinzufügen';
        });
    }
    
    if (saveKategorieFormBtn) {
        saveKategorieFormBtn.addEventListener('click', speichereFormularDaten);
    }
    
    // Tab-Wechsel
    formTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            wechsleTab(tab.dataset.tab);
        });
    });
    
    // Zurück-Button im Kategorie-Bearbeitungspanel
    if (backToListBtn) {
        backToListBtn.addEventListener('click', versteckeBearbeitungsPanel);
    }
    
    // Aktualisieren-Button im Kategorie-Bearbeitungspanel
    if (updateKategorieBtn) {
        updateKategorieBtn.addEventListener('click', aktualisiereKategorie);
    }
    
    // Löschen-Button im Kategorie-Bearbeitungspanel
    if (deleteKategorieBtn) {
        deleteKategorieBtn.addEventListener('click', () => {
            if (aktuelleKategorieId && confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
                loescheKategorieHandler(aktuelleKategorieId);
            }
        });
    }
    
    // Toggle-Button für Extra-Optionen-Formular
    const toggleExtraOptionFormButton = document.getElementById('toggle-extraoption-form');
    if (toggleExtraOptionFormButton) {
        toggleExtraOptionFormButton.addEventListener('click', function() {
            const extraOptionForm = document.getElementById('extra-option-form');
            const toggleBtnText = document.getElementById('toggle-extraoption-btn-text');
            
            if (extraOptionForm.style.display === 'none' || !extraOptionForm.style.display) {
                extraOptionForm.style.display = 'block';
                toggleBtnText.textContent = '- Formular ausblenden';
                // Formularfelder fokussieren
                document.getElementById('extra-optionen-kategorie').focus();
            } else {
                extraOptionForm.style.display = 'none';
                toggleBtnText.textContent = '+ Neue Extra-Option hinzufügen';
            }
        });
    }
    
    // Event-Listener hinzufügen für Extra-Optionen
    if (extraOptionenKategorieSelect) {
        extraOptionenKategorieSelect.addEventListener('change', () => {
            // Wenn "Neue Kategorie" ausgewählt wurde, das Eingabefeld anzeigen
            if (extraOptionenKategorieSelect.value === 'neue-kategorie' && neueExtraKategorieContainer) {
                neueExtraKategorieContainer.style.display = 'flex';
            } else if (neueExtraKategorieContainer) {
                neueExtraKategorieContainer.style.display = 'none';
            }
        });
    }
    
    if (saveExtraOptionBtn) {
        saveExtraOptionBtn.addEventListener('click', speichereExtraOptionFormularDaten);
    }
    
    if (cancelExtraOptionBtn) {
        cancelExtraOptionBtn.addEventListener('click', function() {
            // Formular zurücksetzen und ausblenden
            extraOptionNameInput.value = '';
            extraOptionDescriptionInput.value = '';
            if (neueExtraKategorieInput) neueExtraKategorieInput.value = '';
            if (neueExtraKategorieContainer) neueExtraKategorieContainer.style.display = 'none';
            document.getElementById('extra-option-form').style.display = 'none';
            document.getElementById('toggle-extraoption-btn-text').textContent = '+ Neue Extra-Option hinzufügen';
        });
    }
    
    // Zurück-Button im Extra-Option-Bearbeitungspanel
    if (backToExtrasBtn) {
        backToExtrasBtn.addEventListener('click', resetFormular);
    }
    
    // Aktualisieren-Button im Extra-Option-Bearbeitungspanel
    if (updateExtraOptionBtn) {
        updateExtraOptionBtn.addEventListener('click', aktualisiereExtraOptionFormularDaten);
    }
    
    if (deleteExtraOptionBtn) {
        deleteExtraOptionBtn.addEventListener('click', () => {
            if (aktuelleExtraOptionId && confirm('Möchten Sie diese Extra-Option wirklich löschen?')) {
                loescheExtraOptionHandler(aktuelleExtraOptionId);
            }
        });
    }
    
    // Event-Listener hinzufügen für Sonderwünsche
    const toggleSonderwunschFormButton = document.getElementById('toggle-sonderwunsch-form');
    if (toggleSonderwunschFormButton) {
        toggleSonderwunschFormButton.addEventListener('click', function() {
            const sonderwunschForm = document.getElementById('sonderwunsch-form');
            const toggleBtnText = document.getElementById('toggle-btn-text');
            
            if (sonderwunschForm.style.display === 'none' || !sonderwunschForm.style.display) {
                sonderwunschForm.style.display = 'block';
                toggleBtnText.textContent = '- Formular ausblenden';
                // Ausblenden des Bearbeitungspanels, falls es geöffnet ist
                document.getElementById('edit-sonderwunsch-panel').style.display = 'none';
                // Formularfelder fokussieren
                document.getElementById('sonderwunsch-name').focus();
            } else {
                sonderwunschForm.style.display = 'none';
                toggleBtnText.textContent = '+ Neuen Sonderwunsch hinzufügen';
            }
        });
    }
    
    if (saveSonderwunschBtn) {
        saveSonderwunschBtn.addEventListener('click', speichereSonderwunschFormularDaten);
    }
    
    if (cancelSonderwunschBtn) {
        cancelSonderwunschBtn.addEventListener('click', function() {
            // Formular zurücksetzen und ausblenden
            sonderwunschNameInput.value = '';
            sonderwunschDescriptionInput.value = '';
            document.getElementById('sonderwunsch-form').style.display = 'none';
            document.getElementById('toggle-btn-text').textContent = '+ Neuen Sonderwunsch hinzufügen';
        });
    }
    
    if (backToSonderwunscheBtn) {
        backToSonderwunscheBtn.addEventListener('click', function() {
            // Bearbeitungspanel ausblenden
            document.getElementById('edit-sonderwunsch-panel').style.display = 'none';
            aktuelleSonderwunschId = null;
        });
    }
    
    if (updateSonderwunschBtn) {
        updateSonderwunschBtn.addEventListener('click', aktualisiereSonderwunschFormularDaten);
    }
    
    if (deleteSonderwunschBtn) {
        deleteSonderwunschBtn.addEventListener('click', function() {
            if (aktuelleSonderwunschId && confirm('Möchten Sie diesen Sonderwunsch wirklich löschen?')) {
                loescheSonderwunschHandler(aktuelleSonderwunschId);
            }
        });
    }
    
    // ESC-Taste zum Schließen des Formulars
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && kategorieFormOverlay && kategorieFormOverlay.classList.contains('active')) {
            schliesseKategorieFormular();
        }
    });
    
    // Klick auf Overlay zum Schließen des Formulars
    if (kategorieFormOverlay) {
        kategorieFormOverlay.addEventListener('click', (event) => {
            if (event.target === kategorieFormOverlay) {
                schliesseKategorieFormular();
            }
        });
    }
}

/**
 * Initialisiert das Modul
 */
async function initialisiere() {
    console.log('Initialisiere TabeleAdd-Modul');
    
    // Formular initialisieren
    initialisiereFormular();
    
    // Extra-Optionen initialisieren
    initialisiereExtraOptionen();
    
    // Kategorien laden
    await ladeExtraKategorien();
    
    // Event-Listener für die Tabellenerstellung hinzufügen
    document.addEventListener('menuplanTabelleErstellt', async (event) => {
        const tabelle = event.detail.tabelle;
        fuegeExtraKategorienHinzu(tabelle);
        
        // Kategorien-Dropdowns aktualisieren, sobald die Tabelle erstellt wurde
        await aktualisiereKategorieDropdowns();
    });
    
    // Event-Listener für Aktualisierungen der Kategorien
    document.addEventListener('extraKategorienUpdated', async (event) => {
        // Tabelle neu laden, wenn sie existiert
        const tabelle = document.querySelector('.menueplan-tabelle');
        if (tabelle) {
            // Vorhandene benutzerdefinierte Kategorien entfernen
            const extraZeilen = tabelle.querySelectorAll('tr[data-extra-kategorie]');
            extraZeilen.forEach(zeile => zeile.remove());
            
            // Neue Kategorien hinzufügen
            fuegeExtraKategorienHinzu(tabelle);
            
            // Kategorien-Dropdowns aktualisieren
            await aktualisiereKategorieDropdowns();
        }
    });
    
    // Event-Listener für Menüplan-Updates hinzufügen, um Kategorien zu aktualisieren
    document.addEventListener('menuplanUpdated', async () => {
        console.log('Menüplan wurde aktualisiert, aktualisiere Kategorie-Dropdowns');
        await aktualisiereKategorieDropdowns();
    });
    
    // Kategorie-Dropdowns initial befüllen mit verfügbaren Kategorien
    // Dies muss immer am Ende der Initialisierung stehen, damit alle Ereignisse registriert sind
    console.log('Initialisiere Kategorie-Dropdowns...');
    await aktualisiereKategorieDropdowns();
    console.log('Kategorie-Dropdowns initialisiert');
}

/**
 * Gibt die Liste der Extra-Kategorien zurück
 * @returns {Array} Die Liste der Extra-Kategorien
 */
function getExtraKategorien() {
    return extraKategorien;
}

/**
 * Gibt die Liste der Extra-Optionen zurück
 * @returns {Array} Die Liste der Extra-Optionen
 */
function getExtraOptionen() {
    return extraOptionen;
}

/**
 * Aktualisiert die Dropdown-Menüs für Kategorien in allen relevanten Formularen
 * Befüllt die Dropdowns mit Standardkategorien und benutzerdefinierten Kategorien
 */
async function aktualisiereKategorieDropdowns() {
    // Erstelle eine Menge für alle eindeutigen Kategorien (unabhängig von Groß-/Kleinschreibung)
    const kategorienMap = new Map();
    
    // 0. Standard-Kategorien hinzufügen, die immer vorhanden sein sollen
    const standardKategorien = [
        "MENÜ 1", "MENÜ 2", "SUPPE", "DESSERT", "SALAT", "BEILAGE", 
        "VORSPEISE", "FRÜHSTÜCK", "ABENDESSEN", "KALTE PLATTE", "OBST"
    ];
    
    standardKategorien.forEach(kategorie => {
        kategorienMap.set(kategorie, kategorie);
    });
    
    // 1. Sammle alle Kategorien aus der Menüplantabelle (diese haben Priorität)
    const menueplanTabelle = document.querySelector('.menueplan-tabelle');
    if (menueplanTabelle) {
        const kategorieZellen = menueplanTabelle.querySelectorAll('.kategorie-zelle');
        kategorieZellen.forEach(zelle => {
            const kategorieName = zelle.textContent.trim();
            // Verwende die Darstellung aus der Tabelle als Standard (normalerweise in Großbuchstaben)
            kategorienMap.set(kategorieName.toUpperCase(), kategorieName);
        });
    }
    
    // 2. Benutzerdefinierte Kategorien laden, falls noch nicht geschehen
    if (extraKategorien.length === 0) {
        await ladeExtraKategorien();
    }
    
    // Benutzerdefinierte Kategorien hinzufügen
    extraKategorien.forEach(kat => {
        if (kat.displayKategorie) {
            const normalisiert = kat.displayKategorie.toUpperCase();
            if (!kategorienMap.has(normalisiert)) {
                kategorienMap.set(normalisiert, kat.displayKategorie.toUpperCase());
            }
        }
    });
    
    // 3. Menü-Kategorien aus der API laden und hinzufügen, falls noch nicht vorhanden
    try {
        const response = await fetch('/api/solomenue/extras');
        if (response.ok) {
            const data = await response.json();
            if (data && data.extramenues) {
                // Sammle alle eindeutigen Kategorienamen
                data.extramenues.forEach(menu => {
                    if (menu.kategorieNamen) {
                        const normalisiert = menu.kategorieNamen.toUpperCase();
                        if (!kategorienMap.has(normalisiert)) {
                            kategorienMap.set(normalisiert, menu.kategorieNamen.toUpperCase());
                        }
                    } else if (menu['kategorie-name']) {
                        // Fallback für älteres Feldformat
                        const normalisiert = menu['kategorie-name'].toUpperCase();
                        if (!kategorienMap.has(normalisiert)) {
                            kategorienMap.set(normalisiert, menu['kategorie-name'].toUpperCase());
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden der Menü-Kategorien:', error);
    }
    
    // Konvertiere die Map zu einem Array von Objekten für die Dropdown-Optionen
    let alleKategorien = Array.from(kategorienMap.values()).map(kategorie => ({
        value: kategorie,
        text: kategorie
    }));
    
    // Sortiere die Kategorien alphabetisch
    alleKategorien.sort((a, b) => a.text.localeCompare(b.text));
    
    console.log('Gefundene Kategorien für Dropdowns:', alleKategorien.map(k => k.text));
    
    // Finde die Dropdowns
    const extraOptionenKategorie = document.getElementById('extra-optionen-kategorie');
    const editExtraOptionKategorie = document.getElementById('edit-extra-option-kategorie');
    
    if (extraOptionenKategorie) {
        // Aktuelle Auswahl speichern
        const aktuelleAuswahl = extraOptionenKategorie.value;
        
        // Dropdown leeren
        extraOptionenKategorie.innerHTML = '';
        
        // Kategorien hinzufügen
        alleKategorien.forEach(kat => {
            const option = document.createElement('option');
            option.value = kat.value;
            option.textContent = kat.text;
            extraOptionenKategorie.appendChild(option);
        });
        
        // "Neue Kategorie..." Option hinzufügen (am Ende)
        const neueKategorieOption = document.createElement('option');
        neueKategorieOption.value = 'neue-kategorie';
        neueKategorieOption.textContent = 'Neue Kategorie...';
        extraOptionenKategorie.appendChild(neueKategorieOption);
        
        // Vorherige Auswahl wiederherstellen, wenn möglich
        if (aktuelleAuswahl) {
            // Prüfen, ob der exakte Wert oder ein normalisierter Wert vorhanden ist
            const normalisierteAuswahl = aktuelleAuswahl.toUpperCase();
            const option = Array.from(extraOptionenKategorie.options).find(
                opt => opt.value === aktuelleAuswahl || opt.value.toUpperCase() === normalisierteAuswahl
            );
            if (option) {
                extraOptionenKategorie.value = option.value;
            }
        }
    }
    
    // Gleicher Prozess für das Bearbeitungs-Dropdown
    if (editExtraOptionKategorie) {
        // Aktuelle Auswahl speichern
        const aktuelleAuswahl = editExtraOptionKategorie.value;
        
        // Dropdown leeren
        editExtraOptionKategorie.innerHTML = '';
        
        // Kategorien hinzufügen (ohne "Neue Kategorie..." Option)
        alleKategorien.forEach(kat => {
            const option = document.createElement('option');
            option.value = kat.value;
            option.textContent = kat.text;
            editExtraOptionKategorie.appendChild(option);
        });
        
        // Vorherige Auswahl wiederherstellen, wenn möglich
        if (aktuelleAuswahl) {
            // Prüfen, ob der exakte Wert oder ein normalisierter Wert vorhanden ist
            const normalisierteAuswahl = aktuelleAuswahl.toUpperCase();
            const option = Array.from(editExtraOptionKategorie.options).find(
                opt => opt.value === aktuelleAuswahl || opt.value.toUpperCase() === normalisierteAuswahl
            );
            if (option) {
                editExtraOptionKategorie.value = option.value;
            }
        }
    }
    
    console.log(`Kategorie-Dropdowns mit ${alleKategorien.length} Kategorien aktualisiert`);
}

/**
 * Initialisiert die Extra-Optionen-Funktionalität
 * Setzt Event-Listener für die Extra-Optionen-Kategorie-Dropdown und Buttons
 */
function initialisiereExtraOptionen() {
    console.log('Initialisiere Extra-Optionen...');
    
    // Kategorie-Dropdown
    if (extraOptionenKategorieSelect) {
        extraOptionenKategorieSelect.addEventListener('change', () => {
            // Wenn "Neue Kategorie" ausgewählt wurde, das Eingabefeld anzeigen
            if (extraOptionenKategorieSelect.value === 'neue-kategorie' && neueExtraKategorieContainer) {
                neueExtraKategorieContainer.style.display = 'flex';
            } else if (neueExtraKategorieContainer) {
                neueExtraKategorieContainer.style.display = 'none';
            }
        });
    }
    
    // Speichern-Button
    if (saveExtraOptionBtn) {
        saveExtraOptionBtn.addEventListener('click', speichereExtraOptionFormularDaten);
    }
    
    // Abbrechen-Button
    if (cancelExtraOptionBtn) {
        cancelExtraOptionBtn.addEventListener('click', resetFormular);
    }
    
    // Zurück-Button im Bearbeitungspanel
    if (backToExtrasBtn) {
        backToExtrasBtn.addEventListener('click', resetFormular);
    }
    
    // Aktualisieren-Button im Bearbeitungspanel
    if (updateExtraOptionBtn) {
        updateExtraOptionBtn.addEventListener('click', aktualisiereExtraOptionFormularDaten);
    }
    
    // Löschen-Button im Bearbeitungspanel
    if (deleteExtraOptionBtn) {
        deleteExtraOptionBtn.addEventListener('click', () => {
            if (aktuelleExtraOptionId && confirm('Möchten Sie diese Extra-Option wirklich löschen?')) {
                loescheExtraOptionHandler(aktuelleExtraOptionId);
            }
        });
    }
    
    // Versteckte Felder und Buttons erstellen, falls noch nicht vorhanden
    if (!document.getElementById('bearbeitung-extra-option-id')) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'bearbeitung-extra-option-id';
        document.body.appendChild(hiddenInput);
    }
}

/**
 * Lädt die Sonderwünsche vom Server
 * @returns {Promise<Array>} Die Liste der Sonderwünsche
 */
async function ladeSonderwuensche() {
    try {
        const response = await fetch('/api/solomenue/wuensche');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Sonderwünsche');
        }

        const daten = await response.json();
        
        // Sicherstellen, dass wir ein Array haben
        if (daten && Array.isArray(daten.extrawuensche)) {
            sonderwuensche = daten.extrawuensche;
        } else {
            console.warn('Unerwartetes Format für Sonderwünsche - setze auf leeres Array');
            sonderwuensche = [];
        }
        
        return sonderwuensche;
    } catch (error) {
        console.error('Fehler beim Laden der Sonderwünsche:', error);
        sonderwuensche = [];
        return [];
    }
}

/**
 * Speichert einen neuen Sonderwunsch auf dem Server
 * @param {Object} sonderwunsch - Der zu speichernde Sonderwunsch
 * @returns {Promise<Object>} Das Ergebnis der Operation
 */
async function speichereSonderwunsch(sonderwunsch) {
    try {
        const response = await fetch('/api/solomenue/wuensche', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sonderwunsch)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern des Sonderwunsches');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Speichern des Sonderwunsches:', error);
        throw error;
    }
}

/**
 * Aktualisiert einen bestehenden Sonderwunsch auf dem Server
 * @param {Object} sonderwunsch - Der zu aktualisierende Sonderwunsch
 * @returns {Promise<Object>} Das Ergebnis der Operation
 */
async function aktualisiereSonderwunsch(sonderwunsch) {
    try {
        const response = await fetch(`/api/solomenue/wuensche/${sonderwunsch.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sonderwunsch)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Aktualisieren des Sonderwunsches');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Sonderwunsches:', error);
        throw error;
    }
}

/**
 * Löscht einen Sonderwunsch auf dem Server
 * @param {string} id - Die ID des zu löschenden Sonderwunsches
 * @returns {Promise<Object>} Das Ergebnis der Operation
 */
async function loescheSonderwunsch(id) {
    try {
        const response = await fetch(`/api/solomenue/wuensche/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Löschen des Sonderwunsches');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Löschen des Sonderwunsches:', error);
        throw error;
    }
}

/**
 * Zeigt die Liste der verfügbaren Sonderwünsche an
 */
async function zeigeSonderwunschListe() {
    try {
        // Container für die Sonderwünsche abrufen
        const sonderwunschContainer = document.getElementById('sonderwunsch-liste');
        
        if (!sonderwunschContainer) {
            console.warn('Sonderwunsch-Container nicht gefunden');
            return;
        }
        
        // Sonderwünsche laden
        await ladeSonderwuensche();
        
        // Prüfen, ob Sonderwünsche vorhanden sind
        if (sonderwuensche.length === 0) {
            sonderwunschContainer.innerHTML = '<p>Keine Sonderwünsche vorhanden.</p>';
            return;
        }
        
        // HTML für die Sonderwünsche erstellen
        let html = '';
        
        sonderwuensche.forEach(wunsch => {
            html += `
                <div class="sonderwunsch-item" data-id="${wunsch.id}">
                    <div class="sonderwunsch-info">
                        <h5>${wunsch.name}</h5>
                        <p>${wunsch.description || ''}</p>
                    </div>
                    <div class="sonderwunsch-actions">
                        <button class="btn edit-btn" title="Bearbeiten">✎</button>
                        <button class="btn delete-btn" title="Löschen">✖</button>
                    </div>
                </div>
            `;
        });
        
        // HTML in den Container einfügen
        sonderwunschContainer.innerHTML = html;
        
        // Event-Listener für Bearbeiten- und Löschen-Buttons hinzufügen
        sonderwunschContainer.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                // Verhindern, dass das Event auf Elternelemente übergeht
                event.stopPropagation();
                
                const sonderwunschId = this.closest('.sonderwunsch-item').dataset.id;
                zeigeSonderwunschBearbeitungsPanel(sonderwunschId);
            });
        });
        
        sonderwunschContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                // Verhindern, dass das Event auf Elternelemente übergeht
                event.stopPropagation();
                
                const sonderwunschId = this.closest('.sonderwunsch-item').dataset.id;
                if (confirm('Sind Sie sicher, dass Sie diesen Sonderwunsch löschen möchten?')) {
                    loescheSonderwunschHandler(sonderwunschId);
                }
            });
        });
    } catch (error) {
        console.error('Fehler beim Anzeigen der Sonderwünsche:', error);
        
        const sonderwunschContainer = document.getElementById('sonderwunsch-liste');
        if (sonderwunschContainer) {
            sonderwunschContainer.innerHTML = '<p class="error">Fehler beim Laden der Sonderwünsche.</p>';
        }
    }
}

/**
 * Zeigt das Bearbeitungs-Panel für einen Sonderwunsch
 * @param {string} wunschId - Die ID des zu bearbeitenden Sonderwunsches
 */
async function zeigeSonderwunschBearbeitungsPanel(wunschId) {
    try {
        // Sonderwunsch finden
        const wunsch = sonderwuensche.find(w => w.id === wunschId);
        
        if (!wunsch) {
            console.warn(`Sonderwunsch mit ID ${wunschId} nicht gefunden`);
            return;
        }
        
        // Formularfelder mit den Werten des Sonderwunsches füllen
        editSonderwunschIdInput.value = wunsch.id;
        editSonderwunschNameInput.value = wunsch.name;
        editSonderwunschDescriptionInput.value = wunsch.description || '';
        
        // ID des aktuellen Sonderwunsches speichern
        aktuelleSonderwunschId = wunsch.id;
        
        // Erstellungsformular ausblenden
        document.getElementById('sonderwunsch-form').style.display = 'none';
        document.getElementById('toggle-btn-text').textContent = '+ Neuen Sonderwunsch hinzufügen';
        
        // Bearbeitungs-Panel anzeigen
        document.getElementById('edit-sonderwunsch-panel').style.display = 'block';
        
        // Scrolle zum Bearbeitungsformular
        document.getElementById('edit-sonderwunsch-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Fehler beim Anzeigen des Bearbeitungs-Panels:', error);
        alert('Fehler beim Laden des Sonderwunsches. Bitte versuchen Sie es erneut.');
    }
}

/**
 * Speichert die Daten aus dem Sonderwunsch-Formular
 */
async function speichereSonderwunschFormularDaten() {
    try {
        // Daten aus dem Formular auslesen
        const name = sonderwunschNameInput.value.trim();
        const description = sonderwunschDescriptionInput.value.trim();
        
        // Validierung
        if (!name) {
            alert('Bitte geben Sie einen Namen für den Sonderwunsch ein.');
            return;
        }
        
        // Sonderwunsch-Objekt erstellen
        const neuerSonderwunsch = {
            name,
            description
        };
        
        // Sonderwunsch speichern
        await speichereSonderwunsch(neuerSonderwunsch);
        
        // Formular zurücksetzen und ausblenden
        sonderwunschNameInput.value = '';
        sonderwunschDescriptionInput.value = '';
        document.getElementById('sonderwunsch-form').style.display = 'none';
        document.getElementById('toggle-btn-text').textContent = '+ Neuen Sonderwunsch hinzufügen';
        
        // Sonderwünsche neu laden UND in der Liste anzeigen
        await zeigeSonderwunschListe();
        
        // Erfolgsmeldung
        alert('Sonderwunsch wurde erfolgreich gespeichert.');
    } catch (error) {
        console.error('Fehler beim Speichern des Sonderwunsches:', error);
        alert(`Fehler beim Speichern des Sonderwunsches: ${error.message}`);
    }
}

/**
 * Handler für das Löschen eines Sonderwunsches
 * @param {string} id - Die ID des zu löschenden Sonderwunsches
 */
async function loescheSonderwunschHandler(id) {
    try {
        // Sonderwunsch löschen
        await loescheSonderwunsch(id);
        
        // Wenn wir uns im Bearbeitungspanel befinden und der gelöschte Sonderwunsch
        // der aktuell bearbeitete ist, Bearbeitungspanel ausblenden
        if (aktuelleSonderwunschId === id) {
            document.getElementById('edit-sonderwunsch-panel').style.display = 'none';
            aktuelleSonderwunschId = null;
        }
        
        // Sonderwünsche neu laden und anzeigen
        await zeigeSonderwunschListe();
        
        // Erfolgsmeldung
        alert('Sonderwunsch wurde erfolgreich gelöscht.');
    } catch (error) {
        console.error('Fehler beim Löschen des Sonderwunsches:', error);
        alert(`Fehler beim Löschen des Sonderwunsches: ${error.message}`);
    }
}

/**
 * Aktualisiert einen bestehenden Sonderwunsch mit den Daten aus dem Bearbeitungs-Formular
 */
async function aktualisiereSonderwunschFormularDaten() {
    try {
        // Daten aus dem Formular auslesen
        const id = editSonderwunschIdInput.value;
        const name = editSonderwunschNameInput.value.trim();
        const description = editSonderwunschDescriptionInput.value.trim();
        
        // Validierung
        if (!name) {
            alert('Bitte geben Sie einen Namen für den Sonderwunsch ein.');
            return;
        }
        
        // Sonderwunsch-Objekt erstellen
        const aktualisierterSonderwunsch = {
            id,
            name,
            description
        };
        
        // Sonderwunsch aktualisieren
        await aktualisiereSonderwunsch(aktualisierterSonderwunsch);
        
        // Bearbeitungspanel ausblenden
        document.getElementById('edit-sonderwunsch-panel').style.display = 'none';
        aktuelleSonderwunschId = null;
        
        // Sonderwünsche neu laden UND in der Liste anzeigen
        await zeigeSonderwunschListe();
        
        // Erfolgsmeldung
        alert('Sonderwunsch wurde erfolgreich aktualisiert.');
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Sonderwunsches:', error);
        alert(`Fehler beim Aktualisieren des Sonderwunsches: ${error.message}`);
    }
}

// Module exportieren
export {
    initialisiere,
    oeffneKategorieFormular,
    wechsleTab,
    zeigeExtraOptionenListe,
    zeigeSonderwunschListe,
    getExtraKategorien,
    getExtraOptionen,
    aktualisiereKategorieDropdowns,
    fuegeExtraKategorienHinzu,
    aktualisiereSonderwunschFormularDaten
};
