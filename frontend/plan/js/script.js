document.addEventListener("DOMContentLoaded", () => {
  class MenuPlanner {
    constructor() {
      // Initialisierung der aktuellen Woche und des Jahres
      const now = moment(); // Aktuelles Datum
      this.currentWeek = now.isoWeek(); // Aktuelle ISO-Woche
      this.currentYear = now.isoWeekYear(); // Aktuelles ISO-Jahr
  
      console.log(`Starte mit Jahr=${this.currentYear}, KW=${this.currentWeek}`);
  
      this.weekData = {}; // Platzhalter für geladene Daten
      this.activeButtons = {}; // Initialisierung des Zustands der Buttons
  
      // API-Base-URL festlegen
      this.baseUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:8086"
          : "http://192.168.0.99:8086";
  
      // Event-Listener und UI-Update initialisieren
      this.initEventListeners();
      this.updateWeekInfo();
      this.loadCurrentWeek(); // Daten der aktuellen Woche laden
      this.setupRecipeSearch(); // Suchfeld initialisieren
    
      // Neuer Event-Listener für den Reload-Button
      document.getElementById("reloadBaseButton")
        .addEventListener("click", () => this.reloadBaseData());
    }

    // Event-Listener initialisieren
    initEventListeners() {
      document
        .getElementById("prevWeek")
        .addEventListener("click", () => this.navigateWeek(-1));
      document
        .getElementById("nextWeek")
        .addEventListener("click", () => this.navigateWeek(1));
      document
        .getElementById("currentWeek")
        .addEventListener("click", () => this.goToCurrentWeek());
      document
        .getElementById("clearPlanButton")
        .addEventListener("click", () => this.clearPlan());
    }

    // Kalenderwoche wechseln
    navigateWeek(direction) {
      console.log(`navigateWeek() vor Änderung: Jahr=${this.currentYear}, KW=${this.currentWeek}`);
    
      // Aktuelles Datum basierend auf ISO-Jahr und ISO-Woche
      let currentDate = moment().isoWeekYear(this.currentYear).isoWeek(this.currentWeek);
      
      // Woche hinzufügen/abziehen
      currentDate.add(direction, 'weeks');
      
      // Neue Werte setzen
      this.currentWeek = currentDate.isoWeek();
      this.currentYear = currentDate.isoWeekYear();
    
      console.log(`navigateWeek() nach Änderung: Jahr=${this.currentYear}, KW=${this.currentWeek}`);
    
      this.updateWeekInfo();
      this.loadCurrentWeek();
    }
    

    updateWeekInfo() {
      console.log(`updateWeekInfo() vor Berechnung: Jahr=${this.currentYear}, KW=${this.currentWeek}`);
    
      // Start der Woche mit genauer ISO-Berechnung
      const startOfWeek = moment()
        .isoWeekYear(this.currentYear) // ISO-Jahr verwenden
        .isoWeek(this.currentWeek)    // ISO-Woche setzen
        .startOf('isoWeek');          // Start der Woche
    
      const endOfWeek = startOfWeek.clone().endOf('isoWeek'); // Ende der Woche
    
      console.log(`updateWeekInfo() Start=${startOfWeek.format("DD.MM.YYYY")}, Ende=${endOfWeek.format("DD.MM.YYYY")}`);
      
      document.getElementById("weekNumber").textContent = `KW ${this.currentWeek}`;
      document.getElementById("dateRange").textContent = `${startOfWeek.format("DD.MM.YYYY")} - ${endOfWeek.format("DD.MM.YYYY")}`;
    }

    async loadCurrentWeek() {
      console.log(`API-Aufruf für Jahr=${this.currentYear}, KW=${this.currentWeek}`);
      try {
        // Prüfen ob es sich um eine zukünftige Woche handelt
        const currentDate = moment();
        const targetDate = moment().isoWeekYear(this.currentYear).isoWeek(this.currentWeek);
        const isInFuture = targetDate.isAfter(currentDate, 'week');

        // API-Aufruf mit zusätzlichem Parameter für zukünftige Wochen
        const response = await fetch(
          `${this.baseUrl}/api/calc/${this.currentYear}/${this.currentWeek}?useRotation=${isInFuture}`
        );
        
        if (!response.ok) throw new Error(`HTTP Fehler: ${response.status}`);
        
        const data = await response.json();
        console.log("API-Daten:", data);

        this.weekData = data;
        this.updateUI();
      } catch (error) {
        console.error("Fehler beim Laden der Woche:", error.message);
      }
    }
  
    async loadEinrichtungen() {
      try {
        const response = await fetch(`${this.baseUrl}/api/einrichtungen`);
        if (!response.ok) throw new Error(`HTTP Fehler: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error("Fehler beim Laden der Einrichtungen:", error.message);
        return [];
      }
    }
    // Benutzeroberfläche aktualisieren
    async updateUI() {
      const tbody = document.querySelector("#menuTable tbody");
      tbody.innerHTML = ""; // Bestehende Inhalte löschen
  
      const categories = ["suppe", "menue1", "menue2", "dessert", "divider", "abendSuppe", "milchspeise", "normalkost"];
      const einrichtungen = await this.loadEinrichtungen(); // Einrichtungen laden
  
      categories.forEach((category) => {
          if (category === "divider") {
              const tr = document.createElement("tr");
              tr.innerHTML = `<td colspan="${this.weekData.days.length + 1}" class="divider-row"></td>`;
              tbody.appendChild(tr);
          } else {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                  <td>${this.getCategoryName(category)}</td>
                  ${this.weekData.days.map(dayData => `
                      <td data-category="${category}" data-day="${dayData.day}">
                          ${this.createRecipeList(dayData[category])}
                      </td>
                  `).join("")}
              `;
              tbody.appendChild(tr);
  
              if (category === "menue1" || category === "menue2") {
                  const einTr = document.createElement("tr");
                  einTr.innerHTML = `
                      <td>Einrichtungen</td>
                      ${this.weekData.days.map(dayData => `
                          <td>
                              ${einrichtungen
                                  .filter(einrichtung => {
                                      const speiseangebot = einrichtung.speiseangebot.find(sa => sa.tag === dayData.day);
                                      return speiseangebot && speiseangebot.hauptspeise;
                                  })
                                  .map(einrichtung => {
                                      const kuerzel = einrichtung.kuerzel;
                                      const targetArray = category === "menue1" ? "Einrichtungen-Menü1" : "Einrichtungen-Menü2";
                                      const isActive = dayData[targetArray]?.includes(kuerzel);
  
                                      // Sicherstellen, dass `this.activeButtons` initialisiert ist
                                      this.activeButtons = this.activeButtons || {};
                                      this.activeButtons[`${dayData.day}-${kuerzel}-${category}`] = isActive;
  
                                      return `<button 
                                          id="${dayData.day}-${kuerzel.replace(/-/g, "__")}-${category}" 
                                          class="einrichtung-button ${isActive ? "active" : ""}"
                                          style="${!isActive && this.isCounterpartActive(dayData, kuerzel, category) ? "display: none;" : ""}">
                                              ${kuerzel}
                                      </button>`;
                                  })
                                  .join("")}
                          </td>
                      `).join("")}
                  `;
                  tbody.appendChild(einTr);
              }
          }
      });
  
      this.setupButtonActions();
      this.setupDragAndDrop();
      this.setupRemoveButtons();
  }
// Die neue Methode
isCounterpartActive(dayData, kuerzel, activeCategory) {
  const counterpartCategory = activeCategory === "menue1" ? "Einrichtungen-Menü2" : "Einrichtungen-Menü1";
  return dayData[counterpartCategory]?.includes(kuerzel);
}  
    setupButtonActions() {
      document.querySelectorAll(".einrichtung-button").forEach(button => {
          button.addEventListener("click", (e) => {
              const buttonId = e.target.id;
              const [day, rawKuerzel, category] = buttonId.split("-");
              const kuerzel = rawKuerzel.replace(/__/g, "-");
              const dayData = this.weekData.days.find(d => d.day === day);
  
              if (!dayData) return;
  
              // Arrays initialisieren falls sie nicht existieren
              if (!dayData["Einrichtungen-Menü1"]) dayData["Einrichtungen-Menü1"] = [];
              if (!dayData["Einrichtungen-Menü2"]) dayData["Einrichtungen-Menü2"] = [];
  
              const active = this.activeButtons[buttonId];
              this.activeButtons[buttonId] = !active;
  
              if (this.activeButtons[buttonId]) {
                  e.target.classList.add("active");
                  const targetArray = category === "menue1" ? "Einrichtungen-Menü1" : "Einrichtungen-Menü2";
                  if (!dayData[targetArray].includes(kuerzel)) {
                      dayData[targetArray].push(kuerzel);
                  }
                  this.hideCounterpartButtons(day, kuerzel, category);
              } else {
                  e.target.classList.remove("active");
                  const targetArray = category === "menue1" ? "Einrichtungen-Menü1" : "Einrichtungen-Menü2";
                  dayData[targetArray] = dayData[targetArray].filter(e => e !== kuerzel);
                  this.showCounterpartButtons(day, kuerzel, category);
              }
  
              this.saveCurrentWeek();
          });
      });
  }

  hideCounterpartButtons(day, kuerzel, activeCategory) {
    const counterpartCategory = activeCategory === "menue1" ? "menue2" : "menue1";
    const safeKuerzel = kuerzel.replace(/-/g, "__"); // Ersetze Bindestriche
    const counterpartButton = document.querySelector(`#${day}-${safeKuerzel}-${counterpartCategory}`);
    if (counterpartButton) {
        counterpartButton.style.display = "none";
    }
}

showCounterpartButtons(day, kuerzel, activeCategory) {
    const counterpartCategory = activeCategory === "menue1" ? "menue2" : "menue1";
    const safeKuerzel = kuerzel.replace(/-/g, "__"); // Ersetze Bindestriche
    const counterpartButton = document.querySelector(`#${day}-${safeKuerzel}-${counterpartCategory}`);
    if (counterpartButton) {
        counterpartButton.style.display = "inline-block";
    }
}
    // Kategorie-Namen zurückgeben
    getCategoryName(category) {
      const categoryNames = {
        suppe: "Suppe",
        menue1: "Menü 1",
        menue2: "Menü 2",
        dessert: "Dessert",
        abendSuppe: "Abend-Suppe",
        milchspeise: "Milchspeise",
        normalkost: "Normalkost",
      };

      // Keine Beschriftung für die Trennungszeile
      return category === "divider" ? "" : categoryNames[category] || category;
    }

    // Rezeptliste für eine Zelle generieren
    createRecipeList(recipes) {
        return `
            <div class="cell-handle" draggable="true"></div>
            <div class="cell-content">
                ${recipes?.map((recipe, index) =>
                    `<div class="recipe-item" draggable="true" data-index="${index}" data-recipe='${JSON.stringify(recipe)}' title="${recipe.name}">
                        <span class="recipe-name">${recipe.name}</span>
                        <button class="remove-recipe" data-index="${index}">&times;</button>
                    </div>`
                ).join("") || ""}
            </div>
        `;
    }

    // Rezept-Suchfeld aktivieren
    setupRecipeSearch() {
        const searchInput = document.getElementById("recipeSearch");
        const searchResults = document.getElementById("searchResults");

        searchInput.addEventListener("input", async (e) => {
            const term = e.target.value.trim().toLowerCase();
            if (term.length < 1) {
                searchResults.innerHTML = "";
                searchResults.style.display = "none";
                return;
            }

            const recipes = await this.searchRecipes(term);
            this.displaySearchResults(recipes);
        });
    }

    // Rezepte suchen
    async searchRecipes(term) {
        try {
            const url = `${this.baseUrl}/api/plan/recipes?search=${encodeURIComponent(term)}`;
            console.log("API-Aufruf:", url); // Debugging
            const response = await fetch(url);

            if (!response.ok) {
                console.error("API-Antwortstatus:", response.status);
                throw new Error(`Fehler beim Abrufen der Rezepte: ${response.status}`);
            }

            const data = await response.json();
            console.log("Rezepte:", data); // Debugging
            return data;
        } catch (error) {
            console.error("Fehler bei der Rezeptsuche:", error.message);
            return [];
        }
    }

    // Suchergebnisse anzeigen
    displaySearchResults(recipes) {
        const searchResults = document.getElementById("searchResults");

        if (recipes.length === 0) {
            searchResults.innerHTML = "<div class='no-results'>Keine Ergebnisse gefunden</div>";
            searchResults.style.display = "flex";
            return;
        }

        const limitedRecipes = recipes.slice(0, 4);

        searchResults.innerHTML = limitedRecipes
            .map(
                (recipe) =>
                    `<div class="recipe-item" draggable="true" data-recipe='${JSON.stringify(
                        recipe
                    )}'>${recipe.name}</div>`
            )
            .join("");

        searchResults.style.display = "flex";

        this.setupSearchDragAndDrop();
    }

    // Drag-and-Drop für Suchergebnisse aktivieren
    setupSearchDragAndDrop() {
      document.querySelectorAll(".recipe-item").forEach((item) => {
        item.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", item.dataset.recipe);
        });
      });
    }

    // Drag-and-Drop für die Tabelle aktivieren
    setupDragAndDrop() {
        // Zelltausch-Funktionalität für Handles (ganze Zelle)
        document.querySelectorAll(".cell-handle").forEach(handle => {
            handle.addEventListener("dragstart", (e) => {
                const cell = handle.closest("td");
                if (!cell || !cell.dataset.category || !cell.dataset.day) {
                    console.warn("Ungültige Quellzelle für Drag & Drop");
                    e.preventDefault();
                    return;
                }
                
                const dragData = {
                    category: cell.dataset.category,
                    day: cell.dataset.day
                };

                try {
                    const jsonData = JSON.stringify(dragData);
                    e.dataTransfer.setData("application/cell-swap", jsonData);
                    e.dataTransfer.effectAllowed = "move";
                } catch (error) {
                    console.error("Fehler beim Setzen der Drag-Daten:", error);
                    e.preventDefault();
                }
            });
        });

        // Einzelne Rezepte Drag & Drop
        document.querySelectorAll(".recipe-item").forEach((item) => {
            item.addEventListener("dragstart", (e) => {
                e.stopPropagation(); // Verhindert Konflikt mit dem Handle-Drag
                try {
                    const recipe = JSON.parse(item.dataset.recipe);
                    const parentCell = item.closest("td");
                    if (parentCell) {
                        recipe.oldCategory = parentCell.dataset.category;
                        recipe.oldDay = parentCell.dataset.day;
                    }
                    e.dataTransfer.setData("text/plain", JSON.stringify(recipe));
                } catch (error) {
                    console.error("Fehler beim Drag-Start eines Rezepts:", error);
                    e.preventDefault();
                }
            });
        });

        // Drop-Zonen für beide Arten von Drops
        document.querySelectorAll("#menuTable td").forEach(cell => {
            if (cell.classList.contains("divider-row")) return;

            cell.addEventListener("dragover", (e) => {
                // Erlaubt beide Arten von Drops
                if (e.dataTransfer.types.includes("application/cell-swap") || 
                    e.dataTransfer.types.includes("text/plain")) {
                    e.preventDefault();
                    cell.classList.add("drag-cell-over");
                }
            });

            cell.addEventListener("dragleave", () => {
                cell.classList.remove("drag-cell-over");
            });

            cell.addEventListener("drop", (e) => {
                e.preventDefault();
                cell.classList.remove("drag-cell-over");

                try {
                    // Prüfen, ob es sich um einen Zellentausch handelt
                    const cellSwapData = e.dataTransfer.getData("application/cell-swap");
                    if (cellSwapData) {
                        const sourceData = JSON.parse(cellSwapData);
                        if (sourceData && sourceData.category && sourceData.day) {
                            this.swapCells(sourceData, {
                                category: cell.dataset.category,
                                day: cell.dataset.day
                            });
                            return;
                        }
                    }

                    // Wenn kein Zellentausch, dann einzelnes Rezept
                    const recipeData = e.dataTransfer.getData("text/plain");
                    if (recipeData) {
                        const recipe = JSON.parse(recipeData);
                        const targetDay = this.weekData.days.find(d => d.day === cell.dataset.day);
                        
                        if (targetDay) {
                            // Wenn es ein bestehendes Rezept ist, entferne es aus der alten Position
                            if (recipe.oldDay && recipe.oldCategory) {
                                const sourceDay = this.weekData.days.find(d => d.day === recipe.oldDay);
                                if (sourceDay && sourceDay[recipe.oldCategory]) {
                                    sourceDay[recipe.oldCategory] = sourceDay[recipe.oldCategory]
                                        .filter(r => r.name !== recipe.name);
                                }
                            }

                            // Füge das Rezept zur neuen Position hinzu
                            if (!targetDay[cell.dataset.category]) {
                                targetDay[cell.dataset.category] = [];
                            }
                            targetDay[cell.dataset.category].push(recipe);
                            
                            this.updateUI();
                            this.saveCurrentWeek();
                        }
                    }
                } catch (error) {
                    console.error("Fehler beim Drop:", error);
                }
            });
        });
    }

    // Neue Methode für den Zelltausch
    swapCells(source, target) {
        const sourceDay = this.weekData.days.find(d => d.day === source.day);
        const targetDay = this.weekData.days.find(d => d.day === target.day);

        if (!sourceDay || !targetDay) return;

        // Temporäre Kopie der Quellrezepte
        const tempRecipes = [...(sourceDay[source.category] || [])];
        
        // Tausche die Rezepte
        sourceDay[source.category] = [...(targetDay[target.category] || [])];
        targetDay[target.category] = tempRecipes;

        this.updateUI();
        this.saveCurrentWeek();
    }

    // Entfernen-Buttons aktivieren
    setupRemoveButtons() {
      document.querySelectorAll(".remove-recipe").forEach((button) => {
        button.addEventListener("click", (e) => {
          const cell = button.closest("td");
          const category = cell.dataset.category;
          const day = cell.dataset.day;
          const index = parseInt(button.dataset.index, 10);

          const dayData = this.weekData.days.find((d) => d.day === day);
          if (!dayData || !dayData[category]) return;

          dayData[category].splice(index, 1);
          this.updateUI();
          this.saveCurrentWeek();
        });
      });
    }

    // Aktuelle Woche speichern
    async saveCurrentWeek() {
      try {
        // Prüfen ob es sich um eine zukünftige Woche handelt
        const currentDate = moment();
        const targetDate = moment().isoWeekYear(this.currentYear).isoWeek(this.currentWeek);
        const isInFuture = targetDate.isAfter(currentDate, 'week');

        const response = await fetch(
          `${this.baseUrl}/api/plan/${this.currentYear}/${this.currentWeek}?useRotation=${isInFuture}`, 
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.weekData),
          }
        );

        if (!response.ok) throw new Error(`Fehler beim Speichern: ${response.status}`);
        console.log("Kalenderwoche erfolgreich gespeichert.");
      } catch (error) {
        console.error("Fehler beim Speichern der Woche:", error.message);
      }
    }

    // Menüplan löschen
    clearPlan() {
      if (!confirm("Wollen Sie den KOMPLETTEN Menüplan löschen?")) return;
      if (
        !confirm(
          "Alle Daten gehen verloren und können nicht wiederhergestellt werden."
        )
      )
        return;

      this.weekData.days.forEach((day) => {
        Object.keys(day).forEach((category) => {
          if (Array.isArray(day[category])) day[category] = [];
        });
      });

      this.updateUI();
      this.saveCurrentWeek();

      showToast("Menüplan gelöscht!", "success");
    }

    // Neue Methode zum Neuladen der Basisdaten
    async reloadBaseData() {
        if (!confirm("Möchten Sie die Daten der letzten Basiswoche neu laden?")) return;

        try {
            const currentDate = moment();
            const targetDate = moment().isoWeekYear(this.currentYear).isoWeek(this.currentWeek);
            const isInFuture = targetDate.isAfter(currentDate, 'week');

            // Korrigierte URL: /api/calc statt /api/plan/calc
            const response = await fetch(
                `${this.baseUrl}/api/calc/${this.currentYear}/${this.currentWeek}?useRotation=true&forceReload=true`,
                { method: "GET" }
            );

            if (!response.ok) throw new Error(`HTTP Fehler: ${response.status}`);
            
            const data = await response.json();
            this.weekData = data;
            this.updateUI();
            this.saveCurrentWeek();
            
            showToast("Basisdaten erfolgreich neu geladen!", "success");
        } catch (error) {
            console.error("Fehler beim Neuladen der Basisdaten:", error);
            showToast("Fehler beim Neuladen der Basisdaten", "error");
        }
    }

    // Neue Methode hinzufügen:
    goToCurrentWeek() {
        const now = moment();
        this.currentWeek = now.isoWeek();
        this.currentYear = now.isoWeekYear();
        
        this.updateWeekInfo();
        this.loadCurrentWeek();
    }
  }

  // Toast-Benachrichtigungen
  function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
  }

  new MenuPlanner();
});
