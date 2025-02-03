// Globale Variablen
const BASE_URL = "http://localhost:8086"; // Einheitliche Basis-URL für alle APIs
let zutatenListe = []; // Wird durch ladeZutaten befüllt

const rezeptForm = document.getElementById("rezept-form");
const rezeptZutatenTabelleBody = document.getElementById(
  "rezeptZutatenTabelleBody"
);
const zutatenNameInput = document.getElementById("zutatenName");
const zutatenErgebnisse = document.getElementById("zutaten-ergebnisse");

// Überprüfen, welche Elemente fehlen
if (!rezeptForm) console.error("Das Element mit der ID 'rezept-form' fehlt.");
if (!rezeptZutatenTabelleBody)
  console.error("Das Element mit der ID 'rezeptZutatenTabelleBody' fehlt.");
if (!zutatenNameInput)
  console.error("Das Element mit der ID 'zutatenName' fehlt.");
if (!zutatenErgebnisse)
  console.error("Das Element mit der ID 'zutaten-ergebnisse' fehlt.");

if (
  !rezeptForm ||
  !rezeptZutatenTabelleBody ||
  !zutatenNameInput ||
  !zutatenErgebnisse
) {
  console.error("Ein oder mehrere notwendige DOM-Elemente fehlen.");
}

// Funktion zum Laden der Zutaten
async function ladeZutaten() {
  try {
    const res = await fetch(`${BASE_URL}/api/zutaten`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`HTTP-Fehler: ${res.status}`);
    }

    zutatenListe = await res.json();
    console.log("Geladene Zutaten:", zutatenListe);
  } catch (error) {
    console.error("Fehler beim Laden der Zutaten:", error);
  }
}

// Autovervollständigung
if (zutatenNameInput) {
  zutatenNameInput.addEventListener("input", () => {
    const query = zutatenNameInput.value.toLowerCase().trim();
    zutatenErgebnisse.innerHTML = ""; // Vorschläge leeren

    if (query.length === 0) {
      return; // Keine Vorschläge anzeigen, wenn das Feld leer ist
    }

    // Filtere Zutaten basierend auf der Eingabe
    const gefilterteZutaten = zutatenListe.filter((zutat) =>
      zutat.name.toLowerCase().includes(query)
    );

    // Keine Ergebnisse gefunden
    if (gefilterteZutaten.length === 0) {
      const keineErgebnisse = document.createElement("div");
      keineErgebnisse.classList.add("autocomplete-item");
      keineErgebnisse.textContent = "Keine passenden Ergebnisse gefunden";
      zutatenErgebnisse.appendChild(keineErgebnisse);
      return;
    }

    // Vorschläge anzeigen
    gefilterteZutaten.forEach((zutat) => {
      const vorschlag = document.createElement("div");
      vorschlag.classList.add("autocomplete-item");
      vorschlag.textContent = zutat.name;

      // Beim Klicken auf einen Vorschlag
      vorschlag.addEventListener("click", () => {
        zutatenNameInput.value = zutat.name;
        zutatenErgebnisse.innerHTML = ""; // Vorschläge leeren
        hinzufuegenZutat(zutat); // Zutat zur Tabelle hinzufügen
      });

      zutatenErgebnisse.appendChild(vorschlag);
    });
  });
}

// Funktion zum Hinzufügen einer Zutat zur Tabelle
function hinzufuegenZutat(zutat) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${zutat.name}</td>
    <td><input type="number" class="menge-input" data-id="${zutat.id}" min="0" step="1" value="100"></td>
    <td>${zutat.verwendungseinheit}</td>
    <td class="preis-cell">-</td>
    <td><button type="button" class="entfernen-btn">Entfernen</button></td>
  `;

  const mengeInput = row.querySelector(".menge-input");
  const preisCell = row.querySelector(".preis-cell");

  // Initiale Berechnung des Preises
  const initialMenge = parseFloat(mengeInput.value);
  if (!isNaN(initialMenge)) {
    const preis = (initialMenge * zutat.preisProVerwendungseinheit).toFixed(2);
    preisCell.textContent = `${preis} €`;
  }

  // Eventlistener: Neuberechnung des Preises bei Mengenänderung
  mengeInput.addEventListener("input", () => {
    const menge = parseFloat(mengeInput.value);
    if (!isNaN(menge)) {
      const preis = (menge * zutat.preisProVerwendungseinheit).toFixed(2);
      preisCell.textContent = `${preis} €`;
    } else {
      preisCell.textContent = "-";
    }
    zutatenErgebnisse.innerHTML = "";
    zutatenNameInput.value = "";// Leere das Eingabefeld für die Autovervollständigung
    aktualisiereGesamtpreis(); // Aktualisiere den Gesamtpreis
     
      // Leere auch die Vorschlagsliste
    
  });
  // Entfernen-Button
  const entfernenBtn = row.querySelector(".entfernen-btn");
  entfernenBtn.addEventListener("click", () => {
    row.remove();
    aktualisiereGesamtpreis(); // Aktualisiere den Gesamtpreis
  });

  rezeptZutatenTabelleBody.appendChild(row);

  // Aktualisiere den Gesamtpreis direkt nach dem Hinzufügen der Zutat
  aktualisiereGesamtpreis();
}
function aktualisiereGesamtpreis() {
  const zutatenReihen = rezeptZutatenTabelleBody.querySelectorAll("tr");
  let gesamtPreis = 0;

  zutatenReihen.forEach((row) => {
    const preisText = row.querySelector(".preis-cell").textContent;
    const preis = parseFloat(preisText.replace("€", "").trim());
    if (!isNaN(preis)) {
      gesamtPreis += preis;
    }
  });

  const gesamtPreisElement = document.getElementById("gesamtPreis");
  gesamtPreisElement.textContent = `${gesamtPreis.toFixed(2)} €`;
}



// Rezept speichern
if (rezeptForm) {
  rezeptForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rezeptName = rezeptForm.rezeptName.value.trim();
    const rezeptKategorie = rezeptForm.rezeptKategorie.value;
    const rezeptInformationen = rezeptForm.rezeptInformationen.value.trim(); // Textfeld für Informationen auslesen

    if (!rezeptName || !rezeptKategorie) {
      alert("Bitte füllen Sie alle erforderlichen Felder aus.");
      return;
    }

    try {
      // Überprüfen, ob die Kategorie-Datei existiert und Rezeptname bereits verwendet wird
      const res = await fetch(
        `${BASE_URL}/api/rezepte/kategorie/${rezeptKategorie}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error(
          `Fehler beim Abrufen der Kategorie-Datei: ${res.status}`
        );
      }

      const vorhandeneRezepte = await res.json();
      const rezeptExistiert = vorhandeneRezepte.some(
        (rezept) => rezept.name.toLowerCase() === rezeptName.toLowerCase()
      );

      if (rezeptExistiert) {
        alert(
          "Ein Rezept mit diesem Namen existiert bereits in der Kategorie."
        );
        return;
      }

      // Verarbeite die Zutaten aus der Tabelle
      const zutaten = Array.from(
        rezeptZutatenTabelleBody.querySelectorAll("tr")
      )
        .map((row) => {
          const menge = parseFloat(row.querySelector(".menge-input").value);
          const zutatId = row.querySelector(".menge-input").dataset.id;
          const zutatDetails = zutatenListe.find((z) => z.id == zutatId);

          if (!zutatDetails) {
            console.error(`Zutat mit ID ${zutatId} nicht gefunden.`);
            return null;
          }

          return {
            ...zutatDetails,
            menge,
          };
        })
        .filter((zutat) => zutat !== null);

      if (zutaten.length === 0) {
        alert("Bitte fügen Sie mindestens eine Zutat hinzu.");
        return;
      }

      const rezept = {
        name: rezeptName,
        rezeptKategorien: [rezeptKategorie],
        zutaten,
        infos: rezeptInformationen, // Text aus dem <textarea> wird hinzugefügt
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Rezept speichern
      const speichernRes = await fetch(`${BASE_URL}/api/rezepte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rezept),
      });

      if (!speichernRes.ok)
        throw new Error("Fehler beim Speichern des Rezepts");

      alert("Rezept erfolgreich gespeichert.");
      rezeptForm.reset();
      rezeptZutatenTabelleBody.innerHTML = "";
    } catch (error) {
      console.error("Fehler:", error);
      alert("Speichern fehlgeschlagen.");
    }
  });
}


// Starte das Laden der Zutaten, wenn die Seite geladen ist
document.addEventListener("DOMContentLoaded", ladeZutaten);
