document.addEventListener("DOMContentLoaded", () => { 
  const BASE_URL = "https://smartworkart.onrender.com"; // Einheitliche Basis-URL für alle APIs

  const zutatenForm = document.getElementById("zutaten-form");
  const zutatenTabelleBody = document.querySelector("#zutaten-tabelle tbody");
  const filterSection = document.getElementById("filter-section");
  const toggleFilterBtn = document.getElementById("toggle-filter-btn");
  const filterKategorie = document.getElementById("filter-kategorie");
  const searchName = document.getElementById("search-name");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  const nameInput = document.getElementById("name");
  const autocompleteList = document.getElementById("autocomplete-list-form"); // Angepasst nach eindeutigen IDs
  const speichernBtn = document.getElementById("speichern-btn");
  const aktualisierenBtn = document.getElementById("aktualisieren-btn");
  const basiseinheitSelect = document.getElementById("basiseinheit");
  const verwendungseinheitInput = document.getElementById("verwendungseinheit");

  let zutaten = [];

  // Hilfsfunktionen
  function fillToggleGroup(groupId, selectedValues, hiddenInputId) {
    const buttons = document.querySelectorAll(`#${groupId} .toggle-button`);
    buttons.forEach(btn => {
      if (selectedValues.includes(btn.dataset.value)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
      hiddenInput.value = selectedValues.join(", ");
    }
  }
  document.getElementById('import-btn').addEventListener('click', () => {
    const importFile = document.getElementById('import-file');
    if (importFile) {
      importFile.click(); // Öffnet das Datei-Upload-Fenster
    }
  });
  
  document.getElementById('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.warn('Keine Datei ausgewählt.');
      return;
    }
  
    try {
      const data = await file.text(); // Dateiinhalt lesen
      const zutaten = JSON.parse(data); // JSON parsen
  
      const response = await fetch('http://localhost:8086/api/zutaten/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zutaten),
      });
  
      if (!response.ok) {
        throw new Error('Fehler beim Importieren der Daten.');
      }
  
      alert('Zutaten erfolgreich importiert.');
    } catch (error) {
      console.error('Fehler beim Importieren:', error);
      alert('Fehler beim Importieren: ' + error.message);
    }
  });
  
  

  exportBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/zutaten/export`,  {
        method: "GET",
      });
  
      if (!res.ok) {
        throw new Error(`Fehler beim Export: ${res.statusText}`);
      }
  
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zutaten.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Fehler beim Exportieren:", error);
      alert("Fehler beim Exportieren der Zutaten.");
    }
  });
  importFile.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return alert("Keine Datei ausgewählt.");
  
    try {
      const text = await file.text();
      const data = JSON.parse(text);
  
      const res = await fetch(`${BASE_URL}/api/zutaten/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
  
      if (!res.ok) {
        throw new Error("Fehler beim Importieren der Daten.");
      }
  
      const result = await res.json();
      alert(result.message || "Import erfolgreich.");
    } catch (error) {
      console.error("Fehler beim Importieren:", error);
      alert("Fehler beim Importieren: " + error.message);
    }
  });
  function fillAllergeneToggleGroup(groupId, selectedValues, selectedCodes) {
    const buttons = document.querySelectorAll(`#${groupId} .toggle-button`);
    buttons.forEach(btn => {
      if (selectedValues.includes(btn.dataset.value)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    const allergeneInput = document.getElementById("allergene");
    const allergenCodeInput = document.getElementById("allergen-code");
    if (allergeneInput) {
      allergeneInput.value = selectedValues.join(", ");
    }
    if (allergenCodeInput) {
      allergenCodeInput.value = selectedCodes.join(", ");
    }
  }

  function getVerwendungseinheit(basiseinheit) {
    const einheitenMap = {
      kg: "g",
      g: "kg",
      l: "ml",
      ml: "l",
      Stück: "Stück",
    };
    return einheitenMap[basiseinheit];
  }

  function umrechnenEinheit(basiseinheit, verwendungseinheit) {
    const einheiten = {
      kg: { kg: 1, g: 1000 },
      g: { g: 1, kg: 0.001 },
      l: { l: 1, ml: 1000 },
      ml: { ml: 1, l: 0.001 },
      Stück: { Stück: 1 },
    };
    return einheiten[basiseinheit]?.[verwendungseinheit] || 1;
  }

  function fillForm(z) {
    console.log('fillForm aufgerufen mit Zutat:', z);

    const zutatIdElement = document.getElementById("zutat-id");
    const nameElement = document.getElementById("name");
    const preisProBasiseinheitElement = document.getElementById("preisProBasiseinheit");
    const preisProVerwendungseinheitElement = document.getElementById("preisProVerwendungseinheit");
    const basiseinheitSelect = document.getElementById("basiseinheit");
    const verwendungseinheitInput = document.getElementById("verwendungseinheit");
    const speichernBtn = document.getElementById("speichern-btn");
    const aktualisierenBtn = document.getElementById("aktualisieren-btn");

    // Debugging: Überprüfe, ob die Elemente existieren
    console.log("zutatIdElement:", zutatIdElement);
    console.log("nameElement:", nameElement);
    console.log("preisProBasiseinheitElement:", preisProBasiseinheitElement);
    console.log("preisProVerwendungseinheitElement:", preisProVerwendungseinheitElement);
    console.log("basiseinheitSelect:", basiseinheitSelect);
    console.log("verwendungseinheitInput:", verwendungseinheitInput);
    console.log("speichernBtn:", speichernBtn);
    console.log("aktualisierenBtn:", aktualisierenBtn);

    // Überprüfe, ob die Elemente existieren
    if (!zutatIdElement) console.error('Element mit ID "zutat-id" fehlt.');
    if (!nameElement) console.error('Element mit ID "name" fehlt.');
    if (!preisProBasiseinheitElement) console.error('Element mit ID "preisProBasiseinheit" fehlt.');
    if (!preisProVerwendungseinheitElement) console.error('Element mit ID "preisProVerwendungseinheit" fehlt.');
    if (!basiseinheitSelect) console.error('Element mit ID "basiseinheit" fehlt.');
    if (!verwendungseinheitInput) console.error('Element mit ID "verwendungseinheit" fehlt.');
    if (!speichernBtn) console.error('Element mit ID "speichern-btn" fehlt.');
    if (!aktualisierenBtn) console.error('Element mit ID "aktualisieren-btn" fehlt.');

    // Setze die Werte, wenn die Elemente vorhanden sind
    if (zutatIdElement) zutatIdElement.value = z.id;
    if (nameElement) nameElement.value = z.name;
    if (preisProBasiseinheitElement) preisProBasiseinheitElement.value = z.preisProBasiseinheit;
    if (basiseinheitSelect) basiseinheitSelect.value = z.basiseinheit;
    if (verwendungseinheitInput) verwendungseinheitInput.value = z.verwendungseinheit;

    // Fülle die Toggle-Gruppen
    fillToggleGroup("lieferanten-buttons", z.lieferanten, "lieferanten");
    fillToggleGroup("kategorien-buttons", z.kategorien, "kategorien");
    fillAllergeneToggleGroup("allergene-buttons", z.allergene, z.allergenCodes);

    // Zeige jetzt den "Aktualisieren"-Button an und verstecke den "Speichern"-Button
    if (speichernBtn) speichernBtn.style.display = "none";
    if (aktualisierenBtn) aktualisierenBtn.style.display = "inline-block";

    // Setze den Preis pro Verwendungseinheit im Formular, falls vorhanden
    if (preisProVerwendungseinheitElement) {
      if (z.preisProVerwendungseinheit) {
        preisProVerwendungseinheitElement.value = z.preisProVerwendungseinheit.toFixed(4);
      } else {
        preisProVerwendungseinheitElement.value = "";
      }
      console.log("Preis pro Verwendungseinheit gesetzt auf:", preisProVerwendungseinheitElement.value);
    } else {
      console.error('Element mit ID "preisProVerwendungseinheit" wurde nicht gefunden.');
    }
  }

  // Filter ein/ausblenden
  toggleFilterBtn.addEventListener("click", () => {
    console.log("Filter-Button geklickt");
    filterSection.style.display =
      filterSection.style.display === "none" ? "block" : "none";
  });

  // Zutaten von Backend laden
  async function loadZutaten() {
    try {
      const response = await fetch("http://localhost:8086/api/zutaten");
      if (!response.ok) throw new Error("Fehler beim Laden der Zutaten");
      zutaten = await response.json();
      renderTabelle(zutaten); // Vollständige Liste anzeigen
    } catch (error) {
      console.error("Fehler beim Laden der Zutaten:", error);
    }
  }

  loadZutaten();

  function renderTabelle(data) {
    zutatenTabelleBody.innerHTML = ""; // Bestehende Inhalte löschen

    data.forEach((zutat) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${zutat.id}</td>
        <td>${zutat.name}</td>
        <td>${zutat.basiseinheit}</td>
        <td>${zutat.preisProBasiseinheit.toFixed(2)} €</td>
        <td>${zutat.verwendungseinheit}</td>
        <td>${zutat.preisProVerwendungseinheit.toFixed(4)} €</td>
        <td>${zutat.lieferanten.join(", ")}</td>
        <td>${zutat.kategorien.join(", ")}</td>
        <td>${zutat.allergene || ""}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${zutat.id}">Bearbeiten</button>
          <button class="action-btn delete-btn" data-id="${zutat.id}">Löschen</button>
        </td>
      `;
      zutatenTabelleBody.appendChild(row);
    });
  }

  // Event-Listener für die Basiseinheit-Änderung
  basiseinheitSelect.addEventListener("change", () => {
    const basiseinheit = basiseinheitSelect.value;
    const ve = getVerwendungseinheit(basiseinheit);
    if (!ve && basiseinheit) {
      alert(
        `Keine passende Verwendungseinheit für ${basiseinheit} definiert! Bitte Mapping erweitern.`
      );
      verwendungseinheitInput.value = "";
    } else {
      verwendungseinheitInput.value = ve || "";
    }
    console.log(
      `Basiseinheit ausgewählt: ${basiseinheit}, Verwendungseinheit: ${verwendungseinheitInput.value}`
    );
  });

  // Formular-Submit-Event
  zutatenForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("zutat-id").value.trim();
    const name = document.getElementById("name").value.trim();
    const preisProBasiseinheit = parseFloat(
        document.getElementById("preisProBasiseinheit").value
    );
    const basiseinheit = basiseinheitSelect.value;
    const verwendungseinheit = verwendungseinheitInput.value.trim();

    const lieferanten = getToggleValues("lieferanten-buttons");
    const kategorien = getToggleValues("kategorien-buttons");
    const allergene = getToggleValues("allergene-buttons");
    const allergenCodes = getAllergenCodes();

    // Berechnung des Preises pro Verwendungseinheit (€) mit vier Dezimalstellen
    const preisProVerwendungseinheit = parseFloat(
        (preisProBasiseinheit / umrechnenEinheit(basiseinheit, verwendungseinheit)).toFixed(4)
    );

    // Validierung im Frontend
    if (!name) {
        alert("Bitte einen Namen eingeben.");
        return;
    }
    if (isNaN(preisProBasiseinheit) || preisProBasiseinheit <= 0) {
        alert("Bitte einen gültigen Preis pro Basiseinheit eingeben (größer 0).");
        return;
    }
    if (!basiseinheit) {
        alert("Bitte eine Basiseinheit auswählen.");
        return;
    }
    if (!verwendungseinheit) {
        alert("Verwendungseinheit ist nicht gesetzt. Bitte Basiseinheit wählen.");
        return;
    }
    if (lieferanten.length === 0) {
        alert("Bitte mindestens einen Lieferanten auswählen.");
        return;
    }

    const zutat = {
        name,
        preisProBasiseinheit,
        basiseinheit,
        verwendungseinheit,
        lieferanten,
        kategorien,
        allergene,
        allergenCodes,
        preisProVerwendungseinheit, // Hinzugefügt
    };

    console.log("Zu sendende Zutat:", zutat);

    try {
        const url = id ? `${BASE_URL}/api/zutaten/${id}` : `${BASE_URL}/api/zutaten`;
        const method = id ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(zutat),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("Backend-Fehler:", errorData);

            let errorMessage = "Fehler beim Speichern der Zutat.";
            if (
                errorData.errors &&
                Array.isArray(errorData.errors) &&
                errorData.errors.length > 0
            ) {
                errorMessage = errorData.errors
                    .map((e) => e.msg || "Unbekannter Fehler")
                    .join(", ");
            } else if (errorData.error) {
                errorMessage = errorData.error;
            }

            throw new Error(errorMessage);
        }

        const savedZutat = await res.json();
        alert(
            `Zutat "${savedZutat.name}" erfolgreich ${
                id ? "aktualisiert" : "gespeichert"
            }!`
        );
        resetFormAndButtons();
        loadZutaten();
    } catch (error) {
        console.error("Fehler beim Speichern der Zutat:", error);
        alert(
            `Fehler: ${error.message}. Bitte überprüfe die Backend-Logs (console.log(req.body) im Backend).`
        );
    }
});


  function resetFormAndButtons() {
    zutatenForm.reset();
    document.getElementById("zutat-id").value = "";
    removeAllActiveClasses("lieferanten-buttons");
    removeAllActiveClasses("kategorien-buttons");
    removeAllActiveClasses("allergene-buttons");
    verwendungseinheitInput.value = "";
    document.getElementById("allergen-code").value = "";
    if (speichernBtn) speichernBtn.style.display = "inline-block";
    if (aktualisierenBtn) aktualisierenBtn.style.display = "none";
  }

  function removeAllActiveClasses(groupId) {
    const buttons = document.querySelectorAll(`#${groupId} .toggle-button`);
    buttons.forEach((btn) => btn.classList.remove("active"));
    if (groupId === "allergene-buttons") {
      document.getElementById("allergen-code").value = "";
    }
    document.getElementById(
      groupId === "lieferanten-buttons"
        ? "lieferanten"
        : groupId === "kategorien-buttons"
        ? "kategorien"
        : "allergene"
    ).value = "";
  }

  // Einzelner Event-Listener für alle Toggle-Buttons
  const toggleButtons = document.querySelectorAll(".toggle-button");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      if (btn.parentElement.id === "allergene-buttons") {
        const value = btn.dataset.value;
        const code = btn.dataset.code;
        console.log(`Clicked Allergen: ${value}, Code: ${code}`);
        updateAllergeneInputs(value, code);
      } else {
        updateHiddenInput(btn.parentElement.id, btn.dataset.value);
      }
    });
  });

  function updateAllergeneInputs(value, code) {
    const allergeneInput = document.getElementById("allergene");
    const allergenCodeInput = document.getElementById("allergen-code");

    // Allergene aktualisieren
    let allergene = allergeneInput.value ? allergeneInput.value.split(", ") : [];
    if (allergene.includes(value)) {
      allergene = allergene.filter(item => item !== value);
    } else {
      allergene.push(value);
    }
    allergeneInput.value = allergene.join(", ");

    // Allergen-Codes aktualisieren
    let allergenCodes = allergenCodeInput.value ? allergenCodeInput.value.split(", ") : [];
    if (allergenCodes.includes(code)) {
      allergenCodes = allergenCodes.filter(c => c !== code);
    } else {
      allergenCodes.push(code);
    }
    allergenCodeInput.value = allergenCodes.join(", ");

    console.log(`Allergene: ${allergeneInput.value}`);
    console.log(`Allergen-Codes: ${allergenCodeInput.value}`);
  }

  function updateHiddenInput(groupId, value) {
    const hiddenInput = document.getElementById(
      groupId === "lieferanten-buttons" ? "lieferanten" :
      groupId === "kategorien-buttons" ? "kategorien" :
      "allergene" // Default, aber sollte nicht erreicht werden
    );

    let currentValues = hiddenInput.value ? hiddenInput.value.split(", ") : [];
    if (currentValues.includes(value)) {
      currentValues = currentValues.filter(v => v !== value);
    } else {
      currentValues.push(value);
    }
    hiddenInput.value = currentValues.join(", ");
    console.log(`Update ${hiddenInput.id}:`, hiddenInput.value);
  }
  function updateHiddenInput(groupId, value) {
    const hiddenInput = document.getElementById(
        groupId === "lieferanten-buttons" ? "lieferanten" :
        groupId === "kategorien-buttons" ? "kategorien" :
        groupId === "allergene-buttons" ? "allergene" : null
    );

    if (!hiddenInput) {
        console.error(`Kein verstecktes Eingabefeld für ${groupId} gefunden.`);
        return;
    }

    let currentValues = hiddenInput.value ? hiddenInput.value.split(", ") : [];
    if (currentValues.includes(value)) {
        currentValues = currentValues.filter(v => v !== value);
    } else {
        currentValues.push(value);
    }
    hiddenInput.value = currentValues.join(", ");
    console.log(`Update ${hiddenInput.id}:`, hiddenInput.value);
}
  function getToggleValues(groupId) {
    const buttons = document.querySelectorAll(
      `#${groupId} .toggle-button.active`
    );
    return Array.from(buttons).map((btn) => btn.dataset.value);
  }

  function getAllergenCodes() {
    const allergenCodeInput = document.getElementById("allergen-code");
    return allergenCodeInput.value ? allergenCodeInput.value.split(", ") : [];
  }

  filterKategorie.addEventListener("change", applyFilter);
searchName.addEventListener("input", debounce(applyFilter, 300));
document.getElementById("clear-search-btn").addEventListener("click", () => {
  document.getElementById("filter-kategorie").value = ""; // Kategorie zurücksetzen
  document.getElementById("search-name").value = ""; // Suchfeld leeren
  applyFilter(); // Filterfunktion ohne Einschränkungen aufrufen
});

function applyFilter() {
  const kategorie = filterKategorie.value.trim().toLowerCase();
  const name = searchName.value.trim().toLowerCase();

  // Ausgangspunkt ist die vollständige Liste
  let gefilterteZutaten = zutaten;

  // Nach Kategorie filtern, wenn eine Kategorie ausgewählt ist
  if (kategorie) {
    gefilterteZutaten = gefilterteZutaten.filter((zutat) =>
      zutat.kategorien.some((kat) => kat.toLowerCase() === kategorie)
    );
  }

  // Nach Namen filtern, wenn etwas im Suchfeld steht
  if (name) {
    gefilterteZutaten = gefilterteZutaten.filter((zutat) =>
      zutat.name.toLowerCase().includes(name)
    );
  }

  // Tabelle mit den gefilterten Zutaten rendern
  renderTabelle(gefilterteZutaten);
}

  // Tabelle mit den gefilterten Zutaten aktualisieren
  function renderTabelle(zutatenListe) {
    const tableBody = document.querySelector("#zutaten-tabelle tbody");
    tableBody.innerHTML = ""; // Bestehende Inhalte löschen

    zutatenListe.forEach((zutat) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${zutat.id}</td>
            <td>${zutat.name}</td>
            <td>${zutat.basiseinheit}</td>
            <td>${zutat.preisProBasiseinheit.toFixed(2)} €</td>
            <td>${zutat.verwendungseinheit}</td>
            <td>${zutat.preisProVerwendungseinheit.toFixed(4)} €</td>
            <td>${zutat.lieferanten}</td>
            <td>${zutat.kategorien}</td>
            <td>${zutat.allergene || ""}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${zutat.id}">Bearbeiten</button>
                <button class="action-btn delete-btn" data-id="${zutat.id}">Löschen</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}


  function debounce(func, delay) {
    let debounceTimer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  }

  nameInput.addEventListener(
    "input",
    debounce(async () => {
      const query = nameInput.value.trim();
      if (query.length === 0) {
        autocompleteList.innerHTML = "";
        autocompleteList.style.display = "none";
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/api/zutaten/ingredient-list`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const suggestions = await res.json();
        const filtered = suggestions
          .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3);

        autocompleteList.innerHTML = "";
        if (filtered.length > 0) {
          filtered.forEach((s) => {
            const div = document.createElement("div");
            div.textContent = s;
            div.addEventListener("click", () => {
              nameInput.value = s;
              autocompleteList.innerHTML = "";
              autocompleteList.style.display = "none";
            });
            autocompleteList.appendChild(div);
          });
          autocompleteList.style.display = "block";
        } else {
          autocompleteList.style.display = "none";
        }
      } catch (error) {
        console.error("Fehler beim Laden der Autocomplete-Vorschläge:", error);
      }
    }, 300)
  );

  document.addEventListener("click", (e) => {
    if (!nameInput.contains(e.target) && !autocompleteList.contains(e.target)) {
      autocompleteList.innerHTML = "";
      autocompleteList.style.display = "none";
    }
  });

  zutatenTabelleBody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-btn")) {
      const zutatId = e.target.dataset.id;
      console.log("Klick auf Bearbeiten, ID:", zutatId);
      const zutat = zutaten.find((z) => z.id.toString() === zutatId);
  
      if (zutat) {
        fillForm(zutat); // Formular mit den Daten ausfüllen
  
        // Nach oben scrollen
        document.getElementById("zutaten-form").scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        console.error("Zutat nicht gefunden:", zutatId);
      }
    }


    if (e.target.classList.contains("delete-btn")) {
      const zutatId = e.target.dataset.id;
      if (confirm("Möchtest du diese Zutat wirklich löschen?")) {
        try {
          // URL korrigiert mit /api/zutaten
          const res = await fetch(`${BASE_URL}/api/zutaten/${zutatId}`, {
            method: "DELETE",
          });
    
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
              errorData.error || "Fehler beim Löschen der Zutat."
            );
          }
    
          alert("Zutat erfolgreich gelöscht.");
          loadZutaten(); // Tabelle neu laden
        } catch (error) {
          console.error("Fehler:", error);
          alert(error.message);
        }
      }
    }
    aktualisierenBtn.addEventListener("click", async () => {
      const id = document.getElementById("zutat-id").value.trim();
      const name = document.getElementById("name").value.trim();
      const preisProBasiseinheit = parseFloat(document.getElementById("preisProBasiseinheit").value);
      const basiseinheit = basiseinheitSelect.value;
      const verwendungseinheit = verwendungseinheitInput.value.trim();
      const lieferanten = getToggleValues("lieferanten-buttons");
      const kategorien = getToggleValues("kategorien-buttons");
      const allergene = getToggleValues("allergene-buttons");
      const allergenCodes = getAllergenCodes();
    
      const preisProVerwendungseinheit = parseFloat(
        (preisProBasiseinheit / umrechnenEinheit(basiseinheit, verwendungseinheit)).toFixed(4)
      );
    
      if (!id) {
        alert("Keine Zutat ausgewählt zum Aktualisieren.");
        return;
      }
    
      const zutat = {
        name,
        preisProBasiseinheit,
        basiseinheit,
        verwendungseinheit,
        lieferanten,
        kategorien,
        allergene,
        allergenCodes,
        preisProVerwendungseinheit,
      };
    
      try {
        const url = `${BASE_URL}/api/zutaten/${id}`;
        console.log("PUT-URL:", url); // Debugging
    
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(zutat),
        });
    
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Fehler beim Aktualisieren.");
        }
    
        const updatedZutat = await res.json();
        alert(`Zutat "${updatedZutat.name}" erfolgreich aktualisiert.`);
        resetFormAndButtons();
        loadZutaten();
      } catch (error) {
        console.error("Fehler beim Aktualisieren der Zutat:", error);
        alert(error.message);
      }
    });
});

  });   
