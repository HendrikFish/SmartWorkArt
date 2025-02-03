// Datei: public/js/script.js

let currentEinrichtung = null;
let currentWeek = null;
let currentYear = null;
let gruppen = []; // Deklariere 'gruppen' im höheren Scope

// Funktion für Toast-Nachrichten am Anfang der Datei hinzufügen
function showToast(message, isSuccess = true) {
    // Entferne existierende Toasts
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    // Toast-Element erstellen
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    
    // Styling
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.color = 'white';
    toast.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
    toast.style.zIndex = '1000';
    toast.style.transition = 'opacity 0.5s ease-in-out';

    // Toast zur Seite hinzufügen
    document.body.appendChild(toast);

    // Nach 2 Sekunden ausblenden und entfernen
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 2000);
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Script.js wurde geladen");

  try {
    // Einrichtungen laden
    const response = await fetch("/api/orders/einrichtungen");
    if (!response.ok) {
      throw new Error(`HTTP-Fehler: ${response.status}`);
    }

    const einrichtungen = await response.json();
    console.log("Einrichtungen:", einrichtungen);

    // Buttons für die Einrichtungen erstellen
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
    alert("Es gab ein Problem beim Abrufen der Einrichtungen.");
  }

  function openEinrichtung(einrichtung) {
    console.log(`Einrichtung geöffnet: ${einrichtung.name} (${einrichtung.kuerzel})`);
    const formTitle = document.getElementById("form-title");
    const formContainer = document.getElementById("form-container");

    let selectedYear = new Date().getFullYear();
    let selectedWeek = getISOWeek(new Date());

    // Set global variables
    currentEinrichtung = einrichtung;
    currentWeek = selectedWeek;
    currentYear = selectedYear;

    formTitle.textContent = `Wochenplan für ${einrichtung.name}`;
    updateWeekDisplay(selectedWeek, selectedYear);

    // Gruppen aus Daten/Einrichtungen laden
    async function loadEinrichtungGruppen(einrichtung) {
      try {
        const response = await fetch(`/api/orders/einrichtungen`);
        if (!response.ok) {
          throw new Error(
            `HTTP-Fehler beim Laden der Einrichtungen: ${response.status}`
          );
        }

        const einrichtungen = await response.json();
        const gefunden = einrichtungen.find((e) => e.name === einrichtung.name);
        if (!gefunden) {
          console.warn(`Einrichtung "${einrichtung.name}" nicht gefunden.`);
          return [];
        }

        console.log(
          `Gruppen für "${gefunden.name}" geladen:`,
          gefunden.gruppen
        );
        return gefunden.gruppen || [];
      } catch (error) {
        console.error("Fehler beim Laden der Gruppen:", error);
        return [];
      }
    }

    // Daten laden und Tabelle aktualisieren
    async function updateTable() {
      gruppen = await loadEinrichtungGruppen(einrichtung); // Weise 'gruppen' zu
      if (!gruppen || !Array.isArray(gruppen) || gruppen.length === 0) {
        console.warn(
          "Keine Gruppen gefunden. Übergebe leeres Array an populateTable."
        );
        return populateTable([], [], gruppen); // Korrigiere die Parameteranzahl
      }

      console.log("Gruppen geladen:", gruppen);

      // WeekData laden und Gruppen explizit übergeben
      await loadWeekData(einrichtung.name, selectedWeek, selectedYear, gruppen);
    }

    updateTable();

    document.getElementById("prev-week").onclick = () =>
      changeWeek(-1, einrichtung.name);
    document.getElementById("next-week").onclick = () =>
      changeWeek(1, einrichtung.name);
    document.getElementById("save-button").onclick = () =>
      saveOrder(einrichtung, selectedWeek, selectedYear);

    // Neuer Button für aktuelle Woche
    const weekNavigation = document.getElementById("next-week").parentElement;
    
    // Entferne zuerst einen möglicherweise vorhandenen Button
    const existingButton = weekNavigation.querySelector('button[data-type="current-week"]');
    if (existingButton) {
        existingButton.remove();
    }

    // Erstelle den neuen Button
    const currentWeekBtn = document.createElement("button");
    currentWeekBtn.textContent = "Aktuelle Woche";
    currentWeekBtn.setAttribute('data-type', 'current-week'); // Eindeutiges Attribut
    currentWeekBtn.style.backgroundColor = "#4CAF50";
    currentWeekBtn.style.color = "white";
    currentWeekBtn.style.marginLeft = "10px";
    currentWeekBtn.onclick = () => loadCurrentWeek(einrichtung.name);
    weekNavigation.appendChild(currentWeekBtn);

    formContainer.classList.remove("hidden");

    function updateWeekDisplay(week, year) {
      const weekDisplay = document.getElementById("week-display");
      weekDisplay.textContent = `KW ${week}, ${year}`;
    }

    function changeWeek(offset, einrichtungName) {
      // Prüfe auf ungespeicherte Änderungen - korrigierter Selektor
      const modifiedInputs = document.querySelectorAll('input[data-user-modified="true"]');
      console.log("Gefundene modifizierte Inputs:", modifiedInputs.length); // Debug-Ausgabe
      
      if (modifiedInputs.length > 0) {
          const confirm = window.confirm("Sie haben Werte eingetragen aber nicht gespeichert! Sollen diese gespeichert werden?\n\n[OK] speichert die Werte und wechselt die Woche\n[Abbrechen] verwirft die Werte und Sie bleiben in der Woche");
          if (confirm) {
              // Speichere die Werte
              saveOrder(currentEinrichtung, currentWeek, currentYear).then(() => {
                  // Nach erfolgreichem Speichern die Woche wechseln
                  executeWeekChange();
              });
              return;
          } else {
              // Zurücksetzen der modifizierten Werte
              modifiedInputs.forEach(input => {
                  input.dataset.userModified = "false";
                  input.style.color = "gray";
                  input.style.fontWeight = "normal";
                  input.style.backgroundColor = "";
                  input.style.border = "";
                  
                  // Lade die ursprünglichen Werte neu
                  loadWeekData(currentEinrichtung.name, currentWeek, currentYear, gruppen);
              });
              return; // In der aktuellen Woche bleiben
          }
      }

      // Wenn keine Änderungen vorhanden sind, direkt die Woche wechseln
      executeWeekChange();

      // Hilfsfunktion für den Wochenwechsel
      function executeWeekChange() {
          const date = getDateFromWeek(selectedWeek, selectedYear);
          date.setDate(date.getDate() + offset * 7);

          selectedWeek = getISOWeek(date);
          selectedYear = getISOWeekYear(date);

          // Update global variables
          currentWeek = selectedWeek;
          currentYear = selectedYear;

          console.log("Wechsel zu KW:", selectedWeek, selectedYear);

          updateWeekDisplay(selectedWeek, selectedYear);
          updateTable();
      }
    }

    // Funktion zum Laden der aktuellen Woche
    function loadCurrentWeek(einrichtungName) {
        // Prüfe auf ungespeicherte Änderungen
        const modifiedInputs = document.querySelectorAll('input[data-user-modified="true"]');
        console.log("Gefundene modifizierte Inputs:", modifiedInputs.length);
        
        if (modifiedInputs.length > 0) {
            const confirm = window.confirm("Sie haben Werte eingetragen aber nicht gespeichert! Sollen diese gespeichert werden?\n\n[OK] speichert die Werte und wechselt die Woche\n[Abbrechen] verwirft die Werte und Sie bleiben in der Woche");
            if (confirm) {
                // Speichere die Werte
                saveOrder(currentEinrichtung, currentWeek, currentYear).then(() => {
                    // Nach erfolgreichem Speichern zur aktuellen Woche wechseln
                    executeCurrentWeekChange();
                });
                return;
            } else {
                // Zurücksetzen der modifizierten Werte
                modifiedInputs.forEach(input => {
                    input.dataset.userModified = "false";
                    input.style.color = "gray";
                    input.style.fontWeight = "normal";
                    input.style.backgroundColor = "";
                    input.style.border = "";
                });
                // Lade die ursprünglichen Werte neu
                loadWeekData(currentEinrichtung.name, currentWeek, currentYear, gruppen);
                return;
            }
        }

        // Wenn keine Änderungen vorhanden sind, direkt zur aktuellen Woche wechseln
        executeCurrentWeekChange();

        function executeCurrentWeekChange() {
            const today = new Date();
            const newWeek = getISOWeek(today);
            const newYear = today.getFullYear();

            // Update global variables
            currentWeek = newWeek;
            currentYear = newYear;
            selectedWeek = newWeek;
            selectedYear = newYear;

            console.log("Wechsel zur aktuellen KW:", newWeek, newYear);

            updateWeekDisplay(newWeek, newYear);
            updateTable();
        }
    }
  }

  let currentOrders = [];

  console.log("Aktuelle Daten aus currentOrders:", currentOrders);
  async function loadWeekData(einrichtungName, week, year, gruppenParam) {
    try {
      // URL für den API-Aufruf vorbereiten
      const einrichtungNameEncoded = einrichtungName.replace(/ /g, "_");
      const encodedEinrichtungName = encodeURIComponent(einrichtungNameEncoded);

      // Bestellungen (WeekData) abrufen
      const ordersResponse = await fetch(
        `/api/orders/load/${year}/${week}/${encodedEinrichtungName}`
      );
      if (!ordersResponse.ok) {
        throw new Error(
          `HTTP-Fehler beim Laden der Bestellungen: ${ordersResponse.status}`
        );
      }

      // Geladene Bestellungen in die globale Variable speichern
      const ordersData = await ordersResponse.json();
      currentOrders = ordersData.orders || []; // Speichere die geladenen Orders global

      console.log("Geladene Orders:", currentOrders); // Debugging

      // Speiseangebot abrufen
      const response = await fetch("/api/orders/einrichtungen");
      if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
      }

      const einrichtungen = await response.json();
      const gefunden = einrichtungen.find((e) => e.name === einrichtungName);
      if (!gefunden) {
        console.warn(`Einrichtung "${einrichtungName}" nicht gefunden.`);
        populateTable(currentOrders, [], gruppenParam); // Korrigiere die Parameteranzahl
        return;
      }

      const speiseangebot = gefunden.speiseangebot || [];
      if (!Array.isArray(speiseangebot) || speiseangebot.length === 0) {
        console.warn("Speiseangebot ist leer oder ungültig:", speiseangebot);
      }

      console.log("Geladenes Speiseangebot:", speiseangebot); // Debugging

      // Tabelle mit den geladenen Daten aktualisieren
      populateTable(currentOrders, speiseangebot, gruppenParam);
    } catch (error) {
      console.error("Fehler beim Laden der Wochenplandaten:", error);
      alert("Es gab ein Problem beim Laden der Wochenplandaten.");
    }
  }

  async function populateTable(orders, speiseangebot, gruppen) {
    const tbody = document.getElementById("wochenplan").querySelector("tbody");
    tbody.innerHTML = "";

    const days = [
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
        "Sonntag",
    ];
    const components = ["suppe", "hauptspeise", "dessert"]; // Suppe zuerst, dann Hauptspeise, dann Dessert

    const angebotMap =
        speiseangebot && Array.isArray(speiseangebot) ? {} : null;
    if (angebotMap) {
        speiseangebot.forEach((tagObj) => {
            angebotMap[tagObj.tag] = tagObj;
        });
    }

    // Erst alle Komponenten erstellen
    components.forEach((component) => {
        if (component === "hauptspeise") {
            gruppen.forEach((gruppe) => {
                const row = document.createElement("tr");
                const headerCell = document.createElement("td");

                headerCell.innerHTML = `${
                    component.charAt(0).toUpperCase() + component.slice(1)
                }<br><small>${gruppe.name}</small>`;
                row.appendChild(headerCell);

                days.forEach((day) => {
                    const cell = document.createElement("td");
                    const daySpeiseangebot = angebotMap[day];

                    let isAllowed = false;
                    if (daySpeiseangebot) {
                        if (daySpeiseangebot.alleOptionen) {
                            isAllowed = true;
                        } else {
                            isAllowed = daySpeiseangebot[component];
                        }
                    }

                    if (isAllowed) {
                        const input = document.createElement("input");
                        input.type = "number";
                        input.min = "0";
                        input.placeholder = "0";
                        input.dataset.day = day;
                        input.dataset.component = component;
                        input.dataset.group = gruppe.name;

                        // Initialer Wert ohne Setzen von data-userModified
                        const savedOrder = orders.find(
                            (order) =>
                                order.day === day &&
                                order.component === component &&
                                order.group === gruppe.name
                        );
                        console.log(`Hauptspeise - Suche nach Order für ${day}, Gruppe: ${gruppe.name}`, savedOrder);
                        if (savedOrder) {
                            input.value = savedOrder.amount;
                            input.style.color = "black";
                            input.style.fontWeight = "bold";
                            if (component === "hauptspeise") {
                                input.style.backgroundColor = "lightgreen";
                            }
                            input.style.border = "2px solid black";
                            input.dataset.userModified = "false"; // Explicitly set to "false"
                        } else {
                            // Initialer Wert auf Basis der Hauptspeisen
                            const totalHauptspeisen = gruppen.reduce((sum, gruppe) => {
                                const hauptInput = document.querySelector(
                                    `input[data-day='${day}'][data-component='hauptspeise'][data-group='${gruppe.name}']`
                                );
                                return (
                                    sum +
                                    (hauptInput ? parseInt(hauptInput.value) || 0 : gruppe.anzahl)
                                );
                            }, 0);

                            input.value = totalHauptspeisen;
                            input.style.color = "gray";
                            input.style.fontWeight = "normal";
                            input.dataset.userModified = "false";
                        }

                        // Ereignislistener für Änderungen
                        input.addEventListener("input", () => {
                            const value = parseInt(input.value, 10) || 0;
                            input.dataset.userModified = "true";
                            
                            if (value > 0) {
                                input.style.color = "black";
                                input.style.fontWeight = "bold";
                                input.style.backgroundColor = "lightgreen";
                                input.style.border = "2px solid black";
                            } else {
                                input.style.color = "gray";
                                input.style.fontWeight = "normal";
                                input.style.backgroundColor = "";
                                input.style.border = "";
                                input.dataset.userModified = "false";
                            }

                            // Abhängige Komponenten aktualisieren
                            updateDependencies(day, gruppen);
                        });

                        cell.appendChild(input);
                    }

                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            });
        } else {
            const row = document.createElement("tr");
            const headerCell = document.createElement("td");

            headerCell.textContent =
                component.charAt(0).toUpperCase() + component.slice(1);
            row.appendChild(headerCell);

            days.forEach((day) => {
                const cell = document.createElement("td");
                const daySpeiseangebot = angebotMap[day];

                let isAllowed = false;
                if (daySpeiseangebot) {
                    if (daySpeiseangebot.alleOptionen) {
                        isAllowed = true;
                    } else {
                        isAllowed = daySpeiseangebot[component];
                    }
                }

                if (isAllowed) {
                    if (component === "suppe" || component === "dessert") {
                        const input = document.createElement("input");
                        input.type = "number";
                        input.min = "0";
                        input.placeholder = "0";
                        input.dataset.day = day;
                        input.dataset.component = component;
                        input.dataset.group = "Gesamt";
                        input.disabled = true; // Nicht bearbeitbar

                        // Initialer Wert aus gespeicherten Orders
                        const savedOrder = orders.find(
                            (order) =>
                                order.day === day &&
                                order.component === component &&
                                order.group === "Gesamt"
                        );
                        if (savedOrder) {
                            input.value = savedOrder.amount;
                            input.style.color = "black";
                            input.style.fontWeight = "bold";
                            input.style.border = "1px solid black";
                            input.dataset.userModified = "false";
                        } else {
                            // Initialer Wert auf Basis der Hauptspeisen
                            const totalHauptspeisen = gruppen.reduce((sum, gruppe) => {
                                const hauptInput = document.querySelector(
                                    `input[data-day='${day}'][data-component='hauptspeise'][data-group='${gruppe.name}']`
                                );
                                return (
                                    sum +
                                    (hauptInput ? parseInt(hauptInput.value) || 0 : gruppe.anzahl)
                                );
                            }, 0);

                            input.value = totalHauptspeisen;
                            input.style.color = "gray";
                            input.style.fontWeight = "normal";
                            input.dataset.userModified = "false";
                        }

                        cell.appendChild(input);
                    }
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        }
    });

    // Info-Zeile nach allen Komponenten hinzufügen
    const infoRow = document.createElement("tr");
    const infoHeaderCell = document.createElement("td");
    infoHeaderCell.textContent = "Information";
    infoRow.appendChild(infoHeaderCell);

    days.forEach((day) => {
        const cell = document.createElement("td");
        const daySpeiseangebot = angebotMap[day];

        let isAllowed = false;
        if (daySpeiseangebot) {
            if (daySpeiseangebot.alleOptionen) {
                isAllowed = true;
            } else {
                isAllowed = daySpeiseangebot["hauptspeise"];
            }
        }

        if (isAllowed) {
            const button = document.createElement("button");
            button.textContent = "INFO";
            button.classList.add("info-button");
            button.dataset.day = day;

            const savedInfo = orders.find(
                (order) =>
                    order.day === day && order.component === "information"
            )?.info || "";

            if (savedInfo) {
                button.classList.add("info-saved");
                button.style.color = "black";
            }

            button.dataset.info = savedInfo;
            button.addEventListener("click", () => openInfoPopup(day, savedInfo));

            cell.appendChild(button);
        }
        infoRow.appendChild(cell);
    });

    // Info-Zeile am Ende hinzufügen
    tbody.appendChild(infoRow);
  }


  async function loadInfoFromFile(day) {
    try {
      const response = await fetch(`/api/orders/load-info/${day}`);
      if (!response.ok) {
        throw new Error(`HTTP-Fehler beim Laden der Info: ${response.status}`);
      }
      const data = await response.json();
      return data.info || "";
    } catch (error) {
      console.error("Fehler beim Laden der Info:", error.message);
      return ""; // Fallback: Leere Info
    }
  }

  // Beim Öffnen des Popups aktuelle Daten laden
  async function handleInfoButtonClick(day) {
    const latestInfo = await loadInfoFromFile(day); // Lädt aktuelle Info
    openInfoPopup(day, latestInfo);
  }

  function updateDependencies(day, gruppen) {
    // Finde alle Hauptspeise-Inputs für diesen Tag
    const hauptspeiseInputs = gruppen.map(gruppe => {
        const input = document.querySelector(
            `input[data-day='${day}'][data-component='hauptspeise'][data-group='${gruppe.name}']`
        );
        return {
            input,
            isUserValue: input && (
                input.dataset.userModified === "true" || // Vom Benutzer modifiziert
                (input.value && input.style.color === "black") // Oder gespeicherter Wert (schwarz)
            ),
            value: input ? parseInt(input.value) || 0 : 0
        };
    });

    // Prüfe, ob es überhaupt Benutzereingaben gibt
    const hasUserInputs = hauptspeiseInputs.some(item => item.isUserValue);

    // Berechne die Summe nur aus Benutzereingaben
    const totalHauptspeisen = hasUserInputs 
        ? hauptspeiseInputs
            .filter(item => item.isUserValue)
            .reduce((sum, item) => sum + item.value, 0)
        : 0;

    // Aktualisiere Suppen und Desserts
    ["suppe", "dessert"].forEach((component) => {
        const dependentInputs = document.querySelectorAll(
            `input[data-day='${day}'][data-component='${component}']`
        );
        dependentInputs.forEach((input) => {
            input.value = totalHauptspeisen;
            if (hasUserInputs) {
                input.style.color = "black";
                input.style.fontWeight = "bold";
                input.style.border = "1px solid black";
                input.dataset.userModified = "true";
            } else {
                input.style.color = "gray";
                input.style.fontWeight = "normal";
                input.style.border = "";
                input.dataset.userModified = "false";
            }
        });
    });

    console.log(`Abhängige Komponenten für ${day} aktualisiert:`, {
        totalHauptspeisen,
        hasUserInputs,
        inputs: hauptspeiseInputs.map(item => ({
            group: item.input?.dataset.group,
            isUserValue: item.isUserValue,
            value: item.value
        }))
    });
  }

  async function saveOrder(einrichtung, week, year) {
    const inputs = document.querySelectorAll("#wochenplan input");
    const orders = [];

    // Sammle alle Hauptspeise-Inputs wie bisher
    const hauptspeiseInputs = Array.from(inputs).filter(input => 
        input.dataset.component === 'hauptspeise' && 
        (input.dataset.userModified === "true" || input.style.color === "black") &&
        parseInt(input.value, 10) > 0
    );

    if (hauptspeiseInputs.length > 0) {
        const inputsByDay = {};
        hauptspeiseInputs.forEach(input => {
            const day = input.dataset.day;
            if (!inputsByDay[day]) {
                inputsByDay[day] = [];
            }
            inputsByDay[day].push(input);
        });

        // Finde das Speiseangebot für die aktuelle Einrichtung
        const speiseangebot = einrichtung.speiseangebot || [];
        const angebotMap = {};
        speiseangebot.forEach(tagObj => {
            angebotMap[tagObj.tag] = tagObj;
        });

        Object.entries(inputsByDay).forEach(([day, dayInputs]) => {
            // Speichere Hauptspeisen
            dayInputs.forEach(input => {
                orders.push({
                    day: input.dataset.day,
                    component: input.dataset.component,
                    group: input.dataset.group,
                    amount: parseInt(input.value, 10),
                });
            });

            const totalHauptspeisen = dayInputs.reduce((sum, input) => 
                sum + parseInt(input.value, 10), 0
            );

            // Prüfe das Speiseangebot für diesen Tag
            const tagAngebot = angebotMap[day];
            if (tagAngebot) {
                // Prüfe für Suppe und Dessert basierend auf dem Speiseangebot
                if (tagAngebot.alleOptionen || tagAngebot.suppe) {
                    orders.push({
                        day: day,
                        component: 'suppe',
                        group: "Gesamt",
                        amount: totalHauptspeisen,
                    });
                }
                
                if (tagAngebot.alleOptionen || tagAngebot.dessert) {
                    orders.push({
                        day: day,
                        component: 'dessert',
                        group: "Gesamt",
                        amount: totalHauptspeisen,
                    });
                }
            }
        });
    }

    // Wenn keine Änderungen vorgenommen wurden
    if (orders.length === 0) {
        showToast("Keine Änderungen zum Speichern vorhanden.", false);
        return;
    }

    // Sicherstellen, dass das Kürzel vorhanden ist
    if (!einrichtung.kuerzel) {
        console.error("Fehlendes Kürzel für die Einrichtung!");
        showToast("Kürzel der Einrichtung fehlt!", false);
        return;
    }

    try {
        const response = await fetch("/api/orders/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                einrichtung: einrichtung.name,
                kuerzel: einrichtung.kuerzel,
                orders: orders,
                week: parseInt(week, 10),
                year: parseInt(year, 10),
            }),
        });

        if (response.ok) {
            showToast("Bestellung erfolgreich gespeichert!", true);
            // Nach erfolgreichem Speichern alle userModified Flags zurücksetzen
            inputs.forEach(input => {
                if (input.dataset.userModified === "true") {
                    input.dataset.userModified = "false";
                    input.style.borderColor = "";
                }
            });
        } else {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }
    } catch (error) {
        console.error("Fehler beim Speichern der Bestellung:", error.message);
        showToast("Es gab ein Problem beim Speichern der Bestellung.", false);
    }
  }


  function getDateFromWeek(week, year) {
    const tmp = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = tmp.getDay() || 7;
    const ISOweekStart = new Date(tmp);
    if (dayOfWeek <= 4) {
      ISOweekStart.setDate(tmp.getDate() - dayOfWeek + 1);
    } else {
      ISOweekStart.setDate(tmp.getDate() + (8 - dayOfWeek));
    }
    return ISOweekStart;
  }

  function getISOWeekYear(date) {
    const tmp = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    return tmp.getUTCFullYear();
  }

  function getISOWeek(date) {
    const tmp = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  }

  // Definiere die openInfoPopup-Funktion
  async function openInfoPopup(day, info) {
    console.log(`openInfoPopup aufgerufen für ${day} mit Info: ${info}`); // Debugging

    const modal = document.getElementById("info-modal");
    const infoInput = document.getElementById("info-input");
    const saveInfoButton = document.getElementById("save-info-button");
    const closeButton = modal.querySelector(".close-button");

    if (!modal || !infoInput || !saveInfoButton || !closeButton) {
      console.error("Modal-Elemente nicht gefunden.");
      return;
    }

    // Setze den Informationstext
    infoInput.value = info || "";

    // Zeige das Modal an, indem die Klasse 'hidden' entfernt wird
    modal.classList.remove("hidden");

    // Entferne vorherige Event-Listener, um doppelte Listener zu vermeiden
    saveInfoButton.onclick = null;
    closeButton.onclick = null;

    // Speichern der Information
    saveInfoButton.onclick = async () => {
      const newInfo = infoInput.value.trim();
      console.log(`Information für ${day} gespeichert: ${newInfo}`);

      // Aktualisiere das data-info Attribut des entsprechenden INFO-Buttons
      const infoButtons = document.querySelectorAll(".info-button");
      infoButtons.forEach((button) => {
        if (button.dataset.day === day) {
          button.dataset.info = newInfo;
          if (newInfo !== "") {
            button.classList.add("info-saved");
          } else {
            button.classList.remove("info-saved");
          }
        }
      });

      // Sende die Information an den Server
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

        if (response.ok) {
          console.log("Information erfolgreich gespeichert!");
          // Optional: Zeige eine Bestätigung im UI
          // alert("Information erfolgreich gespeichert!");
        } else {
          throw new Error(`HTTP-Fehler: ${response.status}`);
        }
      } catch (error) {
        console.error("Fehler beim Speichern der Information:", error.message);
        alert("Es gab ein Problem beim Speichern der Information.");
      }

      // Schließe das Modal
      modal.classList.add("hidden");
    };

    // Schließe das Modal, wenn der Benutzer auf das "x" klickt
    closeButton.onclick = () => {
      modal.classList.add("hidden");
    };

    // Schließe das Modal, wenn der Benutzer außerhalb des Modal-Inhalts klickt
    window.onclick = (event) => {
      if (event.target == modal) {
        modal.classList.add("hidden");
      }
    };
  }
});
