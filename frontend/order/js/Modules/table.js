// public/js/Modules/table.js

import { openInfoPopup } from "./infoPopup.js";

// Besser: wir exportieren updateDependencies UNTEN und rufen es NUR intern auf.
// Falls wir es wirklich extern brauchen, legen wir es woanders ab. 
// Hier zeige ich dir die "pure" Variante.

export async function populateTable(orders, speiseangebot, gruppen) {
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
    const components = ["suppe", "hauptspeise", "dessert"];
    const angebotMap = speiseangebot && Array.isArray(speiseangebot) ? {} : null;
    if (angebotMap) {
      speiseangebot.forEach((tagObj) => {
        angebotMap[tagObj.tag] = tagObj;
      });
    }

    components.forEach((component) => {
      if (component === "hauptspeise") {
        gruppen.forEach((gruppe) => {
          const row = document.createElement("tr");
          const headerCell = document.createElement("td");
          headerCell.innerHTML = `${component.charAt(0).toUpperCase() + component.slice(1)}<br><small>${gruppe.name}</small>`;
          row.appendChild(headerCell);

          days.forEach((day) => {
            const cell = document.createElement("td");
            const daySpeiseangebot = angebotMap ? angebotMap[day] : undefined;
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

              const savedOrder = orders.find(
                (order) =>
                  order.day === day &&
                  order.component === component &&
                  order.group === gruppe.name
              );
              if (savedOrder) {
                input.value = savedOrder.amount;
                input.style.color = "black";
                input.style.fontWeight = "bold";
                input.style.backgroundColor = "lightgreen";
                input.style.border = "2px solid black";
                input.dataset.userModified = "false";
              } else {
                // Falls du "gruppe.anzahl" als Default haben möchtest:
                input.value = gruppe.anzahl || 0;
                input.style.color = "gray";
                input.style.fontWeight = "normal";
                input.dataset.userModified = "false";
              }

              input.addEventListener("input", () => {
                const value = input.value === "" ? 0 : Number(input.value);
                input.dataset.userModified = "true";

                if (value > 0) {
                    // Positive Werte werden hervorgehoben
                    input.style.color = "black";
                    input.style.fontWeight = "bold";
                    input.style.backgroundColor = "lightgreen";
                    input.style.border = "2px solid black";
                } else {
                    // Bei 0 oder leerer Eingabe zurück auf grau
                    input.style.color = "gray";
                    input.style.fontWeight = "normal";
                    input.style.backgroundColor = "";
                    input.style.border = "";
                    input.dataset.userModified = "false";
                    // Stelle sicher dass ein leeres Feld als 0 angezeigt wird
                    input.value = "0";
                }

                updateDependencies(day, gruppen);
              });

              input.addEventListener("focus", () => {
                if (input.style.color === "gray") {
                  input.value = "";
                }
              });

              input.addEventListener("blur", () => {
                if (input.value === "") {
                  input.value = "0";
                  input.style.color = "gray";
                  input.style.fontWeight = "normal";
                  input.style.backgroundColor = "";
                  input.style.border = "";
                  input.dataset.userModified = "false";
                }
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
        headerCell.textContent = component.charAt(0).toUpperCase() + component.slice(1);
        row.appendChild(headerCell);

        days.forEach((day) => {
          const cell = document.createElement("td");
          const daySpeiseangebot = angebotMap ? angebotMap[day] : undefined;
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
              input.disabled = true;

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
                input.value = 0;
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

    // INFO-Zeile
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
          (order) => order.day === day && 
          order.component === "information" &&
          order.info
        )?.info || "";

        if (savedInfo) {
          button.classList.add("info-saved");
          button.style.color = "black";
          button.style.backgroundColor = "lightgreen";
          button.dataset.info = savedInfo;
        }

        button.addEventListener("click", () => {
          const modal = document.getElementById("info-modal");
          const infoInput = document.getElementById("info-input");
          infoInput.value = savedInfo;
          openInfoPopup(day, savedInfo);
        });
        
        cell.appendChild(button);
      }
      infoRow.appendChild(cell);
    });
    tbody.appendChild(infoRow);
}

// Nur intern verwendet, aber wir exportieren es, falls es z. B. in weekNavigation gebraucht würde.
// Hier benötigen wir "gruppen" nur, wenn wir es nicht via Parameter bekommen.
// In dem Beispiel definieren wir es lokal:
export function updateDependencies(day, gruppen) {
    const hauptspeiseInputs = gruppen.map(gruppe => {
      const input = document.querySelector(
        `input[data-day='${day}'][data-component='hauptspeise'][data-group='${gruppe.name}']`
      );
      return {
        input,
        isUserValue: input && (
          input.dataset.userModified === "true" ||
          (input.value && input.style.color === "black")
        ),
        value: input ? parseInt(input.value) || 0 : 0
      };
    });

    const hasUserInputs = hauptspeiseInputs.some(item => item.isUserValue);
    const totalHauptspeisen = hasUserInputs
      ? hauptspeiseInputs
          .filter(item => item.isUserValue)
          .reduce((sum, item) => sum + item.value, 0)
      : 0;

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
}
