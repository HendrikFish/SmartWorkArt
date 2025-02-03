// public/js/Modules/api.js

import { currentOrders } from "./globalVariables.js";
import { showToast } from "./toast.js";
import { populateTable } from "./table.js";

export async function loadEinrichtungGruppen(einrichtung) {
    try {
      const response = await fetch(`/api/orders/einrichtungen`);
      if (!response.ok) {
        throw new Error(`HTTP-Fehler beim Laden der Einrichtungen: ${response.status}`);
      }
      const einrichtungen = await response.json();
      const gefunden = einrichtungen.find((e) => e.name === einrichtung.name);
      if (!gefunden) {
        console.warn(`Einrichtung "${einrichtung.name}" nicht gefunden.`);
        return [];
      }
      console.log(`Gruppen für "${gefunden.name}" geladen:`, gefunden.gruppen);
      return gefunden.gruppen || [];
    } catch (error) {
      console.error("Fehler beim Laden der Gruppen:", error);
      return [];
    }
}

export async function loadWeekData(einrichtungName, week, year, gruppenParam) {
    try {
      const einrichtungNameEncoded = einrichtungName.replace(/ /g, "_");
      const encodedEinrichtungName = encodeURIComponent(einrichtungNameEncoded);

      const ordersResponse = await fetch(
        `/api/orders/load/${year}/${week}/${encodedEinrichtungName}`
      );
      if (!ordersResponse.ok) {
        throw new Error(`HTTP-Fehler beim Laden der Bestellungen: ${ordersResponse.status}`);
      }

      const ordersData = await ordersResponse.json();
      currentOrders.length = 0; // Liste vorher leeren
      if (ordersData.orders) {
        currentOrders.push(...ordersData.orders);
      }

      console.log("Geladene Orders:", currentOrders);

      const response = await fetch("/api/orders/einrichtungen");
      if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
      }

      const einrichtungen = await response.json();
      const gefunden = einrichtungen.find((e) => e.name === einrichtungName);
      if (!gefunden) {
        console.warn(`Einrichtung "${einrichtungName}" nicht gefunden.`);
        populateTable(currentOrders, [], gruppenParam);
        return;
      }

      const speiseangebot = gefunden.speiseangebot || [];
      if (!Array.isArray(speiseangebot) || speiseangebot.length === 0) {
        console.warn("Speiseangebot ist leer oder ungültig:", speiseangebot);
      }

      console.log("Geladenes Speiseangebot:", speiseangebot);
      populateTable(currentOrders, speiseangebot, gruppenParam);
    } catch (error) {
      console.error("Fehler beim Laden der Wochenplandaten:", error);
      showToast("Es gab ein Problem beim Laden der Wochenplandaten.", false);
    }
}

export async function loadInfoFromFile(day) {
    // ... loadInfoFromFile Implementierung ...
}
