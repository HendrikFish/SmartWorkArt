// script.js
document.addEventListener("DOMContentLoaded", () => {
  class MenuPlanner {
    constructor() {
      // Moment.js Verfügbarkeit prüfen
      this.checkMomentAvailability();

      // Initialisierung mit Konsistenzprüfung
      const now = moment();
      this.currentWeek = now.isoWeek(); // Aktuelle ISO-Woche
      this.currentYear = now.isoWeekYear(); // Aktuelles ISO-Jahr

      // Validierung der Woche
      if (this.currentWeek < 1 || this.currentWeek > 53) {
        console.error('Ungültige Kalenderwoche:', this.currentWeek);
        this.currentWeek = now.isoWeek(); // Reset auf aktuelle Woche
      }

      this.weekData = {};

      this.baseUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:8086"
          : "http://192.168.0.99:8086";

      this.initEventListeners();
      this.updateWeekInfo();
      this.loadCurrentWeek();

      // Starte das Auto-Refresh
      this.startAutoRefresh();
    }

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

      // Optional: Plan löschen
      // document
      //   .getElementById("clearPlanButton")
      //   .addEventListener("click", () => this.clearPlan());
    }

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
        const response = await fetch(`${this.baseUrl}/api/calc/${this.currentYear}/${this.currentWeek}`);
        if (!response.ok) throw new Error(`HTTP Fehler: ${response.status}`);
        
        const data = await response.json();
        console.log("API-Daten:", data);
    
        
    
        this.weekData = data;
        this.updateUI();
      } catch (error) {
        console.error("Fehler beim Laden der Woche:", error.message);
      }
    }

    async loadOrderData() {
      const orders = {};
      const year = this.currentYear;
      const week = this.currentWeek;
      const dirPath = `${this.baseUrl}/api/calc/data/order/${year}/${week}`;

      try {
        const response = await fetch(dirPath);
        
        // Wenn keine Daten gefunden wurden (404) oder anderer Fehler
        if (!response.ok) {
          if (response.status === 404) {
            // Freundliche Benachrichtigung
            showToast('Für diese Woche liegen noch keine Bestellungen vor.', 'info');
            return orders;
          } else {
            console.warn(`Warnung: Fehler beim Laden der Bestelldaten für ${year}/KW${week}:`, response.status);
          }
          return orders;
        }

        const fileList = await response.json();

        for (const file of fileList) {
          const filePath = `${dirPath}/${file}`;
          try {
            const fileResponse = await fetch(filePath);
            if (!fileResponse.ok) {
              console.warn(`Datei nicht gefunden: ${filePath}`);
              continue;
            }

            const data = await fileResponse.json();
            const kuerzel = data.kuerzel;

            data.orders.forEach((order) => {
              const key = `${kuerzel}-${order.day}-${order.component}`;
              orders[key] = (orders[key] || 0) + order.amount;
            });
          } catch (error) {
            console.warn(`Fehler beim Verarbeiten von ${file}:`, error.message);
            continue; // Mit nächster Datei fortfahren
          }
        }
      } catch (error) {
        // Ruhige Behandlung - kein console.warn mehr
        showToast('Für diese Woche liegen noch keine Bestellungen vor.', 'info');
        return orders;
      }

      return orders;
    }

    // ----------------------------------------------------
    // Erzeugt 2 Zeilen:
    //   1) Header-Zeile mit Button (toggle)
    //   2) Detail-Zeile (anfangs hidden), in der die Inputfelder liegen
    // ----------------------------------------------------
    createCollapsibleRowSet(label, category, orders) {
      const headerTr = document.createElement("tr");
      headerTr.classList.add("collapsible-header");
      headerTr.innerHTML = `
        <td colspan="15">
          <button class="toggle-button">${label}</button>
        </td>
      `;

      const detailTr = document.createElement("tr");
      detailTr.classList.add("collapsible-detail", "collapsed");
      
      // Erster <td> zeigt das Label, dann pro Tag ein <td>
      detailTr.innerHTML = `
        <td>${label}</td>
        ${this.weekData.days
          .map(
            (dayData) => `
            <td data-day="${dayData.day}" data-category="${category}" data-component="${category}">
              ${this.createCategoryElements(category, dayData.day, orders)}
            </td>
            `
          )
          .join("")}
      `;

      // Klick-Logik
      headerTr.querySelector(".toggle-button").addEventListener("click", () => {
        if (detailTr.classList.contains("collapsed")) {
          detailTr.classList.remove("collapsed");
          detailTr.classList.add("expanded");
          detailTr.style.display = "";
        } else {
          detailTr.classList.add("collapsed");
          detailTr.classList.remove("expanded");
          setTimeout(() => {
            if (detailTr.classList.contains("collapsed")) {
              detailTr.style.display = "none";
            }
          }, 800); // Auf 800ms erhöht für die längere Öffnungsanimation
        }
      });

      return [headerTr, detailTr];
    }

    // UI aktualisieren
    async updateUI() {
      console.log("updateUI() gestartet");
      const orders = await this.loadOrderData();
      const tbody = document.querySelector("#menuTable tbody");
      tbody.innerHTML = "";

      // Kategorien – Reihenfolge soll exakt eingehalten werden
      const categories = [
        { key: "suppe", name: "Suppe" },
        { key: "Einrichtungen-Menü1", name: "Einrichtungen-Menü1" },
        { key: "menue1", name: "Menü 1" },
        { key: "Einrichtungen-Menü2", name: "Einrichtungen-Menü2" },
        { key: "menue2", name: "Menü 2" },
        { key: "dessert", name: "Dessert" },
        { key: "abendSuppe", name: "Abend-Suppe" },
        { key: "milchspeise", name: "Milchspeise" },
        { key: "normalkost", name: "Normalkost" },
      ];

      // --- SUPPE: erst collapsible-Zahlen, dann Rezepte ---
      {
        const [suppeHeaderTr, suppeDetailTr] = this.createCollapsibleRowSet(
          "Suppe-Zahlen",
          "suppe",
          orders
        );
        tbody.appendChild(suppeHeaderTr);
        tbody.appendChild(suppeDetailTr);

        const suppeRezepteRow = document.createElement("tr");
        suppeRezepteRow.innerHTML = `
          <td>Suppe</td>
          ${this.weekData.days
            .map(
              (dayData) => `
            <td data-day="${dayData.day}" data-component="suppe">
              ${this.createRecipeList(dayData.suppe)}
            </td>`
            )
            .join("")}
        `;
        tbody.appendChild(suppeRezepteRow);
      }

      // --- Restliche Kategorien ---
      categories.forEach(({ key, name }) => {
        if (key === "suppe") return;

        // Sonderfall: dessert => collapsible + Rezepte
        if (key === "dessert") {
          const [dessertHeaderTr, dessertDetailTr] = this.createCollapsibleRowSet(
            "Dessert-Buttons",
            "dessert",
            orders
          );
          tbody.appendChild(dessertHeaderTr);
          tbody.appendChild(dessertDetailTr);

          const dessertRow = document.createElement("tr");
          dessertRow.innerHTML = `
            <td>${name}</td>
            ${this.weekData.days
              .map(
                (dayData) => `
              <td data-day="${dayData.day}" data-component="dessert">
                ${this.createRecipeList(dayData.dessert)}
              </td>`
              )
              .join("")}
          `;
          tbody.appendChild(dessertRow);
          return;
        }

        // Einrichtungen-Menü1 -> collapsible
        if (key === "Einrichtungen-Menü1") {
          const [headerTr, detailTr] = this.createCollapsibleRowSet(
            "Einrichtungen-Menü1",
            "Einrichtungen-Menü1",
            orders
          );
          tbody.appendChild(headerTr);
          tbody.appendChild(detailTr);
          return;
        }

        // Einrichtungen-Menü2 -> collapsible
        if (key === "Einrichtungen-Menü2") {
          const [headerTr, detailTr] = this.createCollapsibleRowSet(
            "Einrichtungen-Menü2",
            "Einrichtungen-Menü2",
            orders
          );
          tbody.appendChild(headerTr);
          tbody.appendChild(detailTr);
          return;
        }

        // Alle anderen normal
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${name}</td>
          ${this.weekData.days
            .map((dayData) => {
              // z.B. menue1, menue2, abendSuppe etc.
              return `
                <td data-day="${dayData.day}" data-component="${key}">
                  ${this.createRecipeList(dayData[key])}
                </td>
              `;
            })
            .join("")}
        `;
        tbody.appendChild(tr);
      });

      // Eingabefelder aktualisieren
      this.assignOrderValuesToInputs(orders);

      // Drag and Drop
      this.setupDragAndDrop();

      // Mengen berechnen
      this.calcRecipeTotals();

      // Doppeltes Rendering
      tbody.innerHTML = "";

      // --- SUPPE nochmal ---
      {
        const [suppeHeaderTr2, suppeDetailTr2] = this.createCollapsibleRowSet(
          "Suppe-Zahlen",
          "suppe",
          orders
        );
        tbody.appendChild(suppeHeaderTr2);
        tbody.appendChild(suppeDetailTr2);

        const suppeRezepteRow2 = document.createElement("tr");
        suppeRezepteRow2.innerHTML = `
          <td>Suppe</td>
          ${this.weekData.days
            .map(
              (dayData) => `
            <td data-day="${dayData.day}" data-component="suppe">
              ${this.createRecipeList(dayData.suppe)}
            </td>`
            )
            .join("")}
        `;
        tbody.appendChild(suppeRezepteRow2);
      }

      // Restliche Kategorien erneut
      categories.forEach(({ key, name }) => {
        if (key === "suppe") return;

        if (key === "dessert") {
          const [dessertHeaderTr2, dessertDetailTr2] = this.createCollapsibleRowSet(
            "Dessert-Buttons",
            "dessert",
            orders
          );
          tbody.appendChild(dessertHeaderTr2);
          tbody.appendChild(dessertDetailTr2);

          const dessertRow2 = document.createElement("tr");
          dessertRow2.innerHTML = `
            <td>${name}</td>
            ${this.weekData.days
              .map(
                (dayData) => `
              <td data-day="${dayData.day}" data-component="dessert">
                ${this.createRecipeList(dayData.dessert)}
              </td>`
              )
              .join("")}
          `;
          tbody.appendChild(dessertRow2);
          return;
        }

        if (key === "Einrichtungen-Menü1") {
          const [headerTr2, detailTr2] = this.createCollapsibleRowSet(
            "Einrichtungen-Menü1",
            "Einrichtungen-Menü1",
            orders
          );
          tbody.appendChild(headerTr2);
          tbody.appendChild(detailTr2);
          return;
        }
        if (key === "Einrichtungen-Menü2") {
          const [headerTr2, detailTr2] = this.createCollapsibleRowSet(
            "Einrichtungen-Menü2",
            "Einrichtungen-Menü2",
            orders
          );
          tbody.appendChild(headerTr2);
          tbody.appendChild(detailTr2);
          return;
        }

        const tr2 = document.createElement("tr");
        tr2.innerHTML = `
          <td>${name}</td>
          ${this.weekData.days
            .map((dayData) => {
              return `
                <td data-day="${dayData.day}" data-component="${key}">
                  ${this.createRecipeList(dayData[key])}
                </td>
              `;
            })
            .join("")}
        `;
        tbody.appendChild(tr2);
      });

      this.assignOrderValuesToInputs(orders);
      this.setupDragAndDrop();
    
    console.log("updateUI() beendet");
  }
    calcRecipeTotals() {
      // Für jeden Tag in weekData
      this.weekData.days.forEach(dayData => {
        const day = dayData.day;
    
        // -------------------
        // SUPPE
        // -------------------
        let totalSuppe = 0;
        // Alle facility-inputs und category-inputs in suppe summieren
        document.querySelectorAll(`
          td[data-day="${day}"][data-component="suppe"] .facility-input,
          td[data-day="${day}"][data-category="suppe"] .category-row input
        `).forEach(inp => {
          totalSuppe += parseInt(inp.value) || 0;
        });
        // Rezepte hochrechnen
        if (Array.isArray(dayData.suppe)) {
          dayData.suppe.forEach(recipe => {
            if (!recipe.zutaten) return;
            recipe.calcMengen = recipe.zutaten.map(z => {
              const summe = (z.menge || 0) * totalSuppe;
              // Gramm zu Kilogramm
              if (z.verwendungseinheit === "g" && summe >= 1000) {
                return `${(summe / 1000).toFixed(2)} KG`;
              }
              // Milliliter zu Liter
              if (z.verwendungseinheit === "ml" && summe >= 1000) {
                return `${(summe / 1000).toFixed(2)} L`;
              }
              return `${summe.toFixed(2)} ${z.verwendungseinheit}`;
            });
          });
        }
    
        // -------------------
        // MENÜ 1
        // -------------------
        let totalMenue1 = 0;
    
    // a) Alle <input> in der Spalte "Einrichtungen-Menü1" => class="category-input"
    //    (Wenn du zusätzlich facility-input nutzt, passe es an)
    document.querySelectorAll(`
      td[data-day="${day}"][data-component="Einrichtungen-Menü1"] .category-input
    `).forEach(inp => {
      totalMenue1 += parseInt(inp.value) || 0;
    });
    
    // b) Falls du noch "Buttons" oder category-row in [data-category="menue1"] hast, 
    //    kannst du die hier ebenfalls dazurechnen. 
    //    (Nur wenn du "Suppe-Buttons" etc. ähnlich nutzt.)
    // document.querySelectorAll(`
    //   td[data-day="${day}"][data-category="menue1"] .category-row input
    // `).forEach(inp => {
    //   totalMenue1 += parseInt(inp.value) || 0;
    // });

    // c) Rezepte in dayData.menue1 hochrechnen
    if (Array.isArray(dayData.menue1)) {
      dayData.menue1.forEach(recipe => {
        if (!recipe.zutaten) return;
        recipe.calcMengen = recipe.zutaten.map(zutat => {
          const mengeProPortion = parseFloat(zutat.menge) || 0;
          const summe = mengeProPortion * totalMenue1;
          // Ab 1000 g => in kg umwandeln
          if (zutat.verwendungseinheit === "g" && summe >= 1000) {
            return `${(summe / 1000).toFixed(2)} KG`;
          }
          // Sonst original Einheit
          return `${summe.toFixed(2)} ${zutat.verwendungseinheit}`;
        });
      });
    }
    
        // -------------------
        // MENÜ 2
        // -------------------
        let totalMenue2 = 0;
    
        // a) Alle <input> in der Spalte "Einrichtungen-Menü1" => class="category-input"
        //    (Wenn du zusätzlich facility-input nutzt, passe es an)
        document.querySelectorAll(`
          td[data-day="${day}"][data-component="Einrichtungen-Menü2"] .category-input
        `).forEach(inp => {
          totalMenue2 += parseInt(inp.value) || 0;
        });
        
        // b) Falls du noch "Buttons" oder category-row in [data-category="menue1"] hast, 
        //    kannst du die hier ebenfalls dazurechnen. 
        //    (Nur wenn du "Suppe-Buttons" etc. ähnlich nutzt.)
        // document.querySelectorAll(`
        //   td[data-day="${day}"][data-category="menue1"] .category-row input
        // `).forEach(inp => {
        //   totalMenue1 += parseInt(inp.value) || 0;
        // });
    
        // c) Rezepte in dayData.menue2 hochrechnen
        if (Array.isArray(dayData.menue2)) {
          dayData.menue2.forEach(recipe => {
            if (!recipe.zutaten) return;
            recipe.calcMengen = recipe.zutaten.map(zutat => {
              const mengeProPortion = parseFloat(zutat.menge) || 0;
              const summe = mengeProPortion * totalMenue2;
              // Ab 1000 g => in kg umwandeln
              if (zutat.verwendungseinheit === "g" && summe >= 1000) {
                return `${(summe / 1000).toFixed(2)} KG`;
              }
              // Sonst original Einheit
              return `${summe.toFixed(2)} ${zutat.verwendungseinheit}`;
            });
          });
        }
    
        // -------------------
        // DESSERT
        // -------------------
        let totalDessert = 0;
        document.querySelectorAll(`
          td[data-day="${day}"][data-component="dessert"] .facility-input,
          td[data-day="${day}"][data-category="dessert"] .category-row input
        `).forEach(inp => {
          totalDessert += parseInt(inp.value) || 0;
        });
        if (Array.isArray(dayData.dessert)) {
          dayData.dessert.forEach(recipe => {
            if (!recipe.zutaten) return;
            recipe.calcMengen = recipe.zutaten.map(z => {
              const summe = (z.menge || 0) * totalDessert;
              if (z.verwendungseinheit === "g" && summe >= 1000) {
                return `${(summe / 1000).toFixed(2)} KG`;
              }
              return `${summe.toFixed(2)} ${z.verwendungseinheit}`;
            });
          });
        }
    
        // -------------------
        // ABENDSUPPE
        // -------------------
        let totalAbendSuppe = 0;
        document.querySelectorAll(`
          td[data-day="${day}"][data-component="abendSuppe"] .facility-input,
          td[data-day="${day}"][data-category="abendSuppe"] .category-row input
        `).forEach(inp => {
          totalAbendSuppe += parseInt(inp.value) || 0;
        });
        if (Array.isArray(dayData.abendSuppe)) {
          dayData.abendSuppe.forEach(recipe => {
            if (!recipe.zutaten) return;
            recipe.calcMengen = recipe.zutaten.map(z => {
              const summe = (z.menge || 0) * totalAbendSuppe;
              if (z.verwendungseinheit === "g" && summe >= 1000) {
                return `${(summe / 1000).toFixed(2)} KG`;
              }
              return `${summe.toFixed(2)} ${z.verwendungseinheit}`;
            });
          });
        }
    
        // -------------------
        // MILCHSPEISE
        // -------------------
        let totalMilchspeise = 0;
        document.querySelectorAll(`
          td[data-day="${day}"][data-component="milchspeise"] .facility-input,
          td[data-day="${day}"][data-category="milchspeise"] .category-row input
        `).forEach(inp => {
          totalMilchspeise += parseInt(inp.value) || 0;
        });
        if (Array.isArray(dayData.milchspeise)) {
          dayData.milchspeise.forEach(recipe => {
            if (!recipe.zutaten) return;
            recipe.calcMengen = recipe.zutaten.map(z => {
              const summe = (z.menge || 0) * totalMilchspeise;
              if (z.verwendungseinheit === "g" && summe >= 1000) {
                return `${(summe / 1000).toFixed(2)} KG`;
              }
              return `${summe.toFixed(2)} ${z.verwendungseinheit}`;
            });
          });
        }
    
        // -------------------
        // NORMALKOST
        // -------------------
        let totalNormalkost = 0;
        document.querySelectorAll(`
          td[data-day="${day}"][data-component="normalkost"] .facility-input,
          td[data-day="${day}"][data-category="normalkost"] .category-row input
        `).forEach(inp => {
          totalNormalkost += parseInt(inp.value) || 0;
        });
        if (Array.isArray(dayData.normalkost)) {
          dayData.normalkost.forEach(recipe => {
            if (!recipe.zutaten) return;
            recipe.calcMengen = recipe.zutaten.map(z => {
              const summe = (z.menge || 0) * totalNormalkost;
              if (z.verwendungseinheit === "g" && summe >= 1000) {
                return `${(summe / 1000).toFixed(2)} KG`;
              }
              return `${summe.toFixed(2)} ${z.verwendungseinheit}`;
            });
          });
        }
      });
    }
    

    // Eingabefelder mit Summen befüllen
    assignOrderValuesToInputs(orders) {
      document.querySelectorAll(".facility-row").forEach(row => {
        const kuerzel = row.querySelector("span")?.textContent.trim() || "";
        const input = row.querySelector("input");
        const td = row.closest("td");

        if (!td || !kuerzel) return;

        const day = td.dataset.day;
        let component = td.dataset.component;

        // Mappen auf "hauptspeise", falls Einrichtungen-Menü1/2
        if (component === "Einrichtungen-Menü1" || component === "Einrichtungen-Menü2") {
          component = "hauptspeise";
        }

        const key = `${kuerzel}-${day}-${component}`;
        const totalAmount = orders[key] || 0;
        input.value = totalAmount;
      });
    }

    createCategoryElements(category, day, orders) {
      const dayData = this.weekData.days.find(d => d.day === day);
      
      let usedCategory = category;
      if (usedCategory === "Einrichtungen-Menü1" || usedCategory === "Einrichtungen-Menü2") {
        usedCategory = "hauptspeise";
      }

      // Einrichtungen aus den Plandaten holen
      let facilities = [];
      
      if (category === "suppe" || category === "dessert") {
        const potentialFacilities = [
          ...(dayData["Einrichtungen-Menü1"] || []),
          ...(dayData["Einrichtungen-Menü2"] || [])
        ];

        facilities = potentialFacilities.filter(facility => {
          const orderKey = `${facility}-${day}-${category}`;
          return orders[orderKey] && orders[orderKey] > 0;
        });
      } else {
        facilities = dayData[category] || [];
      }

      if (facilities.length === 0) return "-";

      const facilityRows = facilities
        .map(facility => {
          const key = `${facility}-${day}-${usedCategory}`;
          const amount = orders[key] || 0;
          
          return `
            <div class="category-row">
              <button
                class="category-button"
                data-category="${category}"
                data-day="${day}"
                data-facility="${facility}"
              >
                ${facility}
              </button>
              <input 
                type="number" 
                class="category-input" 
                value="${amount}"
                onchange="this.closest('td').dispatchEvent(new CustomEvent('input-changed')); this.closest('td').querySelector('.total-input').value = Array.from(this.closest('td').querySelectorAll('.category-input')).reduce((sum, input) => sum + (parseInt(input.value) || 0), 0)"
              />
            </div>
          `;
        })
        .join("");

      // Gesamt-Zeile hinzufügen
      const totalSum = facilities.reduce((sum, facility) => {
        const key = `${facility}-${day}-${usedCategory}`;
        return sum + (orders[key] || 0);
      }, 0);

      return `
        ${facilityRows}
        <div class="total-row">
          <button class="total-button">Gesamt</button>
          <input type="text" class="total-input" value="${totalSum}" readonly>
        </div>
      `;
    }
  
    createFacilityList(facilities = [], day, component, orders) {
      let usedComp = component;
      if (usedComp === "Einrichtungen-Menü1" || usedComp === "Einrichtungen-Menü2") {
        usedComp = "hauptspeise";
      }

      return (
        facilities
          .map(facility => {
            const key = `${facility}-${day}-${usedComp}`;
            const amount = orders[key] || 0;
            return `
              <div class="facility-row">
                <span>${facility}</span>
                <input type="number" class="facility-input" value="${amount}" />
              </div>
            `;
          })
          .join("") || "Keine Einrichtungen"
      );
    }

    createRecipeList(recipes = []) {
      return recipes
        ?.map((recipe) => {
          return (
            recipe.zutaten
              ?.map((z, index) => {
                const baseMenge = `${z.name}: ${z.menge} ${z.verwendungseinheit}`;
                let calcMenge = recipe.calcMengen ? recipe.calcMengen[index] : "-";
                
                // Umrechnung für die Anzeige
                if (calcMenge && calcMenge.endsWith("ml")) {
                  const menge = parseFloat(calcMenge);
                  if (menge >= 1000) {
                    calcMenge = `${(menge / 1000).toFixed(2)} L`;
                  }
                }
                
                return `
                  <div class="recipe-amount-container">
                    <div class="recipe-base-amount">
                      <div class="recipe-name">${name}</div>
                      <div class="recipe-base-quantity">${baseMenge}</div>
                    </div>
                    <div class="recipe-calc-amount">${calcMenge}</div>
                  </div>
                `;
              })
              .join("") || "-"
          );
        })
        .join("") || "-";
    }
    

    setupDragAndDrop() {
      document.querySelectorAll("#menuTable td").forEach((cell) => {
        if (cell.classList.contains("divider-row")) {
          return;
        }
        cell.addEventListener("dragover", (e) => e.preventDefault());
        cell.addEventListener("dragenter", () => cell.classList.add("drag-over"));
        cell.addEventListener("dragleave", () => cell.classList.remove("drag-over"));
        cell.addEventListener("drop", async (e) => {
          e.preventDefault();
          cell.classList.remove("drag-over");
          const recipeData = JSON.parse(e.dataTransfer.getData("text/plain"));
          const category = cell.dataset.category;
          const day = cell.dataset.day;
          if (!category || !day) {
            console.error("Ungültige Zelle für das Ablegen:", cell);
            return;
          }
          const dayData = this.weekData.days.find((d) => d.day === day);
          if (!dayData) {
            console.error(`Tag "${day}" nicht gefunden.`);
            return;
          }
          // Weiterverarbeitung, wenn nötig
        });
      });

      document.querySelectorAll(".recipe-item").forEach((item) => {
        item.addEventListener("dragstart", (e) => {
          const parentCell = item.closest("td");
          if (!parentCell) {
            console.error("Rezept befindet sich nicht in einer Zelle.");
            return;
          }
          const recipe = JSON.parse(item.dataset.recipe || "{}");
          recipe.oldCategory = parentCell.dataset.category;
          recipe.oldDay = parentCell.dataset.day;
          e.dataTransfer.setData("text/plain", JSON.stringify(recipe));
        });
      });
    }

    async searchRecipes(term) {
      try {
        const url = `${this.baseUrl}/api/calc/recipes?search=${encodeURIComponent(term)}`;
        console.log("API-Aufruf:", url);
        const response = await fetch(url);
        if (!response.ok) {
          console.error("API-Antwortstatus:", response.status);
          throw new Error(`Fehler beim Abrufen der Rezepte: ${response.status}`);
        }
        const data = await response.json();
        console.log("Rezepte:", data);
        return data;
      } catch (error) {
        console.error("Fehler bei der Rezeptsuche:", error.message);
        return [];
      }
    }

    displaySearchResults(recipes) {
      const searchResults = document.getElementById("searchResults");
      searchResults.innerHTML = recipes
        .map(
          (recipe) =>
            `<div class="recipe-item" draggable="true" data-recipe='${JSON.stringify(
              recipe
            )}'>${recipe.name}</div>`
        )
        .join("");
      searchResults.style.display = "block";
      this.setupSearchDragAndDrop();
    }

    setupSearchDragAndDrop() {
      document.querySelectorAll(".recipe-item").forEach((item) => {
        item.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", item.dataset.recipe);
        });
      });
    }

    // Menüplan löschen (optional)
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
      showToast("Menüplan gelöscht!", "success");
    }

    startAutoRefresh() {
      // Alle 2 Minuten (120000 Millisekunden)
      setInterval(async () => {
        try {
          // Lade neue Bestelldaten
          const orders = await this.loadOrderData();
          
          // Aktualisiere die Inputfelder
          this.assignOrderValuesToInputs(orders);
          
          // Berechne die Rezeptmengen neu
          this.calcRecipeTotals();
          
          // Aktualisiere die Rezeptanzeige
          this.updateRecipeDisplay();
          
          console.log("Auto-Refresh durchgeführt:", new Date().toLocaleTimeString());
        } catch (error) {
          console.error("Fehler beim Auto-Refresh:", error);
        }
      }, 120000);
    }

    // Neue Methode zum Aktualisieren der Rezeptanzeige
    updateRecipeDisplay() {
      document.querySelectorAll('#menuTable td[data-component]').forEach(td => {
        const component = td.dataset.component;
        const day = td.dataset.day;
        if (!component || !day) return;

        const dayData = this.weekData.days.find(d => d.day === day);
        if (!dayData || !dayData[component]) return;

        // Ersetze den gesamten Inhalt der Zelle mit der neuen Rezeptanzeige
        const recipes = dayData[component];
        if (Array.isArray(recipes)) {
          td.innerHTML = this.createRecipeList(recipes);
        }
      });
    }

    checkMomentAvailability() {
      if (typeof moment === 'undefined') {
        console.error('Moment.js ist nicht geladen! Bitte überprüfen Sie die Einbindung von moment.min.js');
        
        // Versuche moment.js nachzuladen
        const script = document.createElement('script');
        script.src = './moment.min.js';
        script.onerror = () => {
          const errorMsg = 'Kritischer Fehler: moment.js konnte nicht geladen werden. Bitte überprüfen Sie, ob die Datei moment.min.js im gleichen Verzeichnis wie script.js liegt.';
          alert(errorMsg);
          throw new Error(errorMsg);
        };
        document.head.appendChild(script);
        
        // Warte kurz und prüfe erneut
        setTimeout(() => {
          if (typeof moment === 'undefined') {
            const errorMsg = 'Kritischer Fehler: moment.js konnte nicht initialisiert werden.';
            alert(errorMsg);
            throw new Error(errorMsg);
          }
        }, 500);
      }
    }

    goToCurrentWeek() {
      const now = moment();
      this.currentWeek = now.isoWeek();
      this.currentYear = now.isoWeekYear();
      this.updateWeekInfo();
      this.loadCurrentWeek();
    }
  }

  // Toast-Helfer
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
