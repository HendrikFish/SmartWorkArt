# SoloMenü-Anwendung - Detaillierte Dokumentation

Diese Anwendung ist Teil eines größeren Projekts zur Verwaltung des täglichen Ablaufs in einem Seniorenheim. Die SoloMenü-Anwendung hilft speziell bei der Verwaltung und Darstellung individueller Essensauswahlpläne für Bewohner nach Stockwerken (Saal, 1.OG, 2.OG, 3.OG) und ermöglicht die Navigation durch Kalenderwochen.

## Inhaltsverzeichnis

1. [Hauptfunktionen](#hauptfunktionen)
2. [Technische Struktur](#technische-struktur)
3. [Moduldetails und Funktionsweise](#moduldetails-und-funktionsweise)
   - [Kalenderwoche](#kalenderwoche)
   - [Bewohnerverwaltung](#bewohnerverwaltung)
   - [Menüplantabelle und Essensauswahl](#menüplantabelle-und-essensauswahl)
   - [Extramenüs und Kategorien](#extramenüs-und-kategorien)
   - [Responsive Design](#responsive-design)
4. [Backend-Integration](#backend-integration)
5. [Datenstrukturen](#datenstrukturen)
6. [Entwicklung und Erweiterung](#entwicklung-und-erweiterung)

## Hauptfunktionen

- **Kalenderwochennavigation**: Navigieren durch die Kalenderwochen mit Vor- und Zurück-Buttons
- **Stockwerkfilterung**: Anzeigen der Bewohner nach Stockwerk/Bereich (Saal, 1.OG, 2.OG, 3.OG)
- **Bewohnerauswahl**: Auswahl eines Bewohners zur Erfassung seiner Essensauswahl
- **Bewohnerdetails**: Anzeigen detaillierter Informationen zu einem Bewohner in einem Overlay-Panel
- **Menüplan-Erfassung**: Erfassen und Speichern individueller Essensauswahlen für jeden Bewohner
- **Portionsgrößenauswahl**: Auswahl verschiedener Portionsgrößen (100%, 50%, 25%, keine) für jede Mahlzeit
- **Extramenü-Verwaltung**: Hinzufügen und Verwalten von zusätzlichen Menükategorien
- **Responsive Design**: Optimierte Ansichten für Desktop und Smartphones

## Technische Struktur

Die Anwendung verwendet modernes JavaScript mit einer modularen Struktur:

```
soloMenue/
├── css/
│   ├── style.css          # Hauptstilregeln
│   ├── panel.css          # Stilregeln für Panels/Overlays
│   ├── form.css           # Stilregeln für Formulare
│   └── smartphone.css     # Stilregeln für Smartphone-Ansicht
├── js/
│   ├── script.js          # Hauptskript (Modul-Initialisierung)
│   └── module/
│       ├── kalenderwoche.js      # Kalenderwochenberechnung und -navigation
│       ├── bewohnerDate.js       # Bewohnerdaten und -filterung
│       ├── bewohnerButton.js     # Einheitliche Breite der Bewohnerkarten
│       ├── bearbeitungsPanel.js  # Bewohnerdetails-Panel
│       ├── bewohnerAuswahl.js    # Essensauswahl für Bewohner
│       ├── funktionenTabelle.js  # Menüplantabelle
│       └── tabeleAdd.js          # Extramenü-Verwaltung
└── index.html             # Hauptdokument
```

## Moduldetails und Funktionsweise

### Kalenderwoche

#### Hauptfunktionen in `kalenderwoche.js`:

- **`berechneKalenderwoche(datum)`**: Berechnet die Kalenderwoche für ein gegebenes Datum nach ISO-Standard.
- **`berechneKalenderwochenDaten(kw, jahr)`**: Berechnet Start- und Enddatum einer Kalenderwoche.
- **`aktualisiereKalenderwocheAnzeige()`**: Aktualisiert die Anzeige der aktuellen Kalenderwoche im DOM.
- **`setzeKalenderwoche(kw, jahr)`**: Setzt die aktuelle Kalenderwoche und aktualisiert alle abhängigen Elemente.
- **`naechsteKalenderwoche()`/`vorherigeKalenderwoche()`**: Navigation zwischen Kalenderwochen.
- **`logKalenderwoche(aktion)`**: Protokolliert Kalenderwochen-Aktionen für Debugging-Zwecke.

#### Event-Handling:

- Beim Ändern der Kalenderwoche wird ein `kalenderwocheChanged`-Event ausgelöst, auf das andere Module reagieren.
- Die Menüplantabelle wird automatisch für die neue Kalenderwoche aktualisiert.
- Aktive Bewohnerauswahlen werden für die neue Kalenderwoche geladen.

### Bewohnerverwaltung

#### Hauptfunktionen in `bewohnerDate.js`:

- **`ladeFilterKonfiguration()`**: Lädt die Stockwerksfilter-Konfiguration vom Server.
- **`ladeBewohner()`**: Lädt alle Bewohner vom Server.
- **`erstelleFilterButtons(filterConfig)`**: Erstellt die Filterschaltflächen für Stockwerke.
- **`wechsleKategorie(kategorie)`**: Ändert den Stockwerksfilter und aktualisiert die Bewohnerliste.
- **`zeigeGefilterteBewohner()`**: Zeigt die Bewohner für den aktuellen Filter an.
- **`setzeGlobalAktivenBewohner(bewohnerId)`**: Setzt den aktiven Bewohner global.

#### Bewohnerkarten-Funktionalität:

- Jede Bewohnerkarte zeigt den Namen des Bewohners und einen Details-Button.
- Auf Desktop werden Vor- und Nachname angezeigt, auf Mobilgeräten nur der Nachname.
- Klick auf einen Bewohner markiert ihn als aktiv und lädt seinen Essensauswahlplan.
- Der Details-Button öffnet ein Panel mit weiteren Informationen.

### Menüplantabelle und Essensauswahl

#### Hauptfunktionen in `funktionenTabelle.js`:

- **`ladeMenueplan(kw, jahr)`**: Lädt die Menüplandaten für eine Kalenderwoche vom Server.
- **`erstelleLeereTabelle()`**: Erstellt eine leere Tabelle mit Wochentagen und Kategorien.
- **`fuelleTabelle(tabelle, menuplanDaten)`**: Füllt die Tabelle mit den Menüplandaten.
- **`strukturiereTabelleFuerMobile(tabelle)`**: Strukturiert die Tabelle für Mobilgeräte um.
- **`aktualisiereNachBewohnerAuswahl()`**: Aktualisiert die Mobilansicht nach einer Bewohnerauswahl.

#### Hauptfunktionen in `bewohnerAuswahl.js`:

- **`ladeBewohnerAuswahl(bewohner, kw, jahr)`**: Lädt die Essensauswahl für einen Bewohner.
- **`erstelleNeueBewohnerAuswahl()`**: Erstellt eine neue Essensauswahl, wenn keine existiert.
- **`speichereBewohnerAuswahl()`**: Speichert die aktuelle Essensauswahl auf dem Server.
- **`aktualisiereMenueAuswahl(tag, kategorie, portion, mahlzeiten)`**: Aktualisiert die Auswahl für eine Mahlzeit.
- **`rotierePortionsGroesse(zelle, tag, kategorie)`**: Wechselt durch die Portionsgrößen (100%, 50%, 25%, keine).
- **`handleZellenKlick(zelle, tag, kategorie)`**: Verarbeitet Klicks auf Menüplan-Zellen.
- **`aktualisiereTabelle(tabelle)`**: Aktualisiert die Tabelle basierend auf der aktuellen Bewohnerauswahl.
- **`findeTabellenZelle(tabelle, tag, kategorie)`**: Findet eine Tabellenzelle anhand von Tag und Kategorie.
- **`aktualisiereZellInMobileAnsicht(originaleZelle)`**: Aktualisiert die mobile Ansicht nach Änderungen.

#### Portionsgrößen-Funktionalität:

Die Anwendung unterstützt vier Portionsgrößen, die durch Klicken auf eine Menüzelle rotieren:
- **100%**: Grün markiert - volle Portion
- **50%**: Orange markiert - halbe Portion
- **25%**: Hellblau markiert - Viertelportion
- **keine**: Keine Markierung - keine Portion

#### Auswahlen speichern und laden:

- Bei jedem Klick auf eine Zelle wird die Auswahl sofort auf dem Server gespeichert.
- Beim Wechseln des Bewohners oder der Kalenderwoche werden die bestehenden Auswahlen geladen.
- Die Daten werden im Format `backend/data/soloMenue/<jahr>/KW<nummer>/<Vorname>_<Nachname>.json` gespeichert.

### Extramenüs und Kategorien

#### Hauptfunktionen in `tabeleAdd.js`:

- **`ladeExtraKategorien()`**: Lädt zusätzliche Menükategorien vom Server.
- **`speichereKategorie(kategorie)`**: Speichert eine neue oder aktualisierte Kategorie.
- **`loescheKategorie(id)`**: Löscht eine Kategorie.
- **`fuegeExtraKategorienHinzu(tabelle)`**: Fügt zusätzliche Kategorien zur Menüplantabelle hinzu.
- **`oeffneKategorieFormular()`**: Öffnet das Formular zum Verwalten von Kategorien.
- **`zeigeKategorienListe()`**: Zeigt die Liste der vorhandenen Kategorien an.

#### Extramenü-Verwaltung:

- Über den "+"-Button oben rechts können zusätzliche Kategorien verwaltet werden.
- Kategorien können hinzugefügt, bearbeitet oder gelöscht werden.
- Die Kategorien werden für alle Wochentage angezeigt und können wie normale Kategorien ausgewählt werden.

### Responsive Design

#### Desktop-Ansicht:

- Die Bewohnerkarten werden in einer Reihe angezeigt, mit Vor- und Nachnamen.
- Die Menüplantabelle zeigt alle Wochentage nebeneinander mit Kategorien in den Zeilen.
- Details-Buttons sind vollständig beschriftet.

#### Smartphone-Ansicht (in `smartphone.css`):

- Die Bewohnerkarten werden in einem Raster mit bis zu 5 Karten pro Zeile angezeigt.
- Nur der Nachname wird angezeigt, Vornamen werden ausgeblendet.
- Der Details-Button wird durch ein "⋯"-Symbol ersetzt.
- Die Menüplantabelle wird umstrukturiert:
  - Jeder Tag wird als separater Abschnitt angezeigt.
  - Unter jedem Tag werden alle Kategorien untereinander aufgelistet.
  - Auswahlen werden durch farbliche Hervorhebung dargestellt.
  - Die Darstellung synchronisiert sich automatisch zwischen Desktop- und Mobilansicht.

#### Implementierung der mobilen Ansicht:

- **`strukturiereTabelleFuerMobile(tabelle)`**: Erzeugt eine alternative Darstellung für mobile Geräte.
- **`aktualisiereNachBewohnerAuswahl()`**: Aktualisiert die mobile Ansicht nach Änderungen.
- **`aktualisiereZellInMobileAnsicht(originaleZelle)`**: Synchronisiert Änderungen zwischen den Ansichten.
- Bei Änderung der Gerätegröße oder Orientierung wird die Ansicht automatisch angepasst.

## Backend-Integration

Die Anwendung kommuniziert mit dem Backend über folgende API-Endpunkte:

- **Filterkonfiguration**: `/api/solomenue/config/filter`
- **Bewohnerdaten**:
  - Alle Bewohner: `/api/solomenue/bewohner`
  - Einzelner Bewohner: `/api/solomenue/bewohner/:id`
  - Bewohner nach Kategorie: `/api/solomenue/bewohner/kategorie/:kategorie`
- **Menüpläne**:
  - Menüplan nach Jahr/KW: `/api/solomenue/menueplan/:jahr/:kw`
  - Verfügbare KWs für ein Jahr: `/api/solomenue/menueplan-kws/:jahr`
  - Verfügbare Jahre: `/api/solomenue/menueplan-jahre`
- **Extras und Zusätze**:
  - Extra-Menüs: `/api/solomenue/extras`
  - Extra-Wünsche: `/api/solomenue/wuensche`
  - Eigene Kategorien: `/api/solomenue/extra-kategorien`
- **Bewohnerauswahl**:
  - Auswahl laden: `/api/solomenue/auswahl/:jahr/:kw/:bewohnerId`
  - Auswahl speichern: `/api/solomenue/auswahl/:jahr/:kw/:bewohnerId` (POST)

## Datenstrukturen

### Bewohnerdaten

```json
{
  "firstName": "Vorname",
  "lastName": "Nachname",
  "gender": "Geschlecht",
  "areas": {
    "Wo wird das Essen eingetragen!": "Saal",  // oder "1.OG", "2.OG", "3.OG"
    "Weitere Bereiche": "Werte"
  },
  "vergin": "Alter",
  "lastModified": "2025-01-09T13:56:27.604Z"
}
```

### Menüplandaten

```json
{
  "year": 2025,
  "week": 2,
  "days": [
    {
      "day": "Montag",
      "suppe": [
        {
          "rezeptId": 2,
          "name": "Rindersuppe",
          "rezeptKategorien": ["Suppe"],
          "zutaten": [...]
        }
      ],
      "menue1": [...],
      "menue2": [...],
      "dessert": [...],
      "abendSuppe": [...],
      "milchspeise": [...],
      "normalkost": [...]
    },
    // Weitere Tage...
  ]
}
```

### Bewohnerauswahlsdaten

```json
{
  "name": "Vorname_Nachname",
  "Montag": {
    "suppe": {
      "portion": "100%",
      "selected": true,
      "mahlzeiten": [
        {
          "rezeptId": 2,
          "name": "Rindersuppe"
        }
      ]
    },
    "menue1": {
      "portion": "50%",
      "selected": true,
      "mahlzeiten": [...]
    },
    "extra_kaltePlatte": {
      "portion": "25%",
      "selected": true,
      "isExtra": true,
      "mahlzeiten": [
        {
          "name": "Kalte Platte Deluxe",
          "isExtraKategorie": true
        }
      ]
    }
    // Weitere Kategorien...
  },
  // Weitere Tage...
}
```

### Extramenüs und -kategorien

```json
// extraMenue.json
{
  "extramenues": [
    {
      "id": "extra1",
      "name": "Suppe",
      "description": "Tagessuppe nach Wahl"
    },
    // Weitere Extramenüs...
  ]
}

// extraKategorie.json
[
  {
    "id": "kaltePlatte",
    "displayKategorie": "Kalte Platte",
    "text": "Kalte Platte Deluxe"
  },
  // Weitere Kategorien...
]
```

## Entwicklung und Erweiterung

### Erweiterung der Anwendung

1. **Neue Kategorie hinzufügen**: Extramenüs können über die Benutzeroberfläche hinzugefügt werden.

2. **Backend-Erweiterungen**:
   - Neue Endpunkte in `soloMenueRoutes.js` hinzufügen
   - Controller-Logik in `soloMenueController.js` implementieren

3. **Frontend-Erweiterungen**:
   - Neue Module in `js/module/` hinzufügen
   - Bestehende Module erweitern
   - Neue CSS-Stile in den entsprechenden CSS-Dateien hinzufügen

### Wichtige Funktionsabläufe

1. **Bewohnerauswahl**:
   ```
   Bewohner auswählen → ladeBewohnerAuswahl() → 
   Wenn existiert → Laden und anzeigen
   Wenn nicht existiert → erstelleNeueBewohnerAuswahl()
   ```

2. **Portionsgröße ändern**:
   ```
   Zelle klicken → handleZellenKlick() → rotierePortionsGroesse() → 
   aktualisiereMenueAuswahl() → speichereBewohnerAuswahl() → 
   aktualisiereZellInMobileAnsicht()
   ```

3. **Kalenderwoche ändern**:
   ```
   Button klicken → naechste/vorherigeKalenderwoche() → 
   setzeKalenderwoche() → aktualisiereKalenderwocheAnzeige() → 
   kalenderwocheChanged Event → 
   aktualisiereNachKalenderwocheAenderung() → zeigeMenueplanTabelle()
   ```

### Responsive Design-Workflow

1. **Erkennung der Bildschirmgröße**:
   ```
   CSS: @media screen and (max-width: 767px) { ... }
   JS: if (window.innerWidth <= 767) { ... }
   ```

2. **Tabellen-Umstrukturierung**:
   ```
   zeigeMenueplanTabelle() → strukturiereTabelleFuerMobile() → 
   (Erstellt alternative Struktur für mobile Geräte)
   ```

3. **Synchronisierung zwischen den Ansichten**:
   ```
   rotierePortionsGroesse() → aktualisiereZellInMobileAnsicht() → 
   (Aktualisiert beide Ansichten konsistent)
   ``` 