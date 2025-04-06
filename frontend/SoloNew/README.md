# Solo-Anwendung für Seniorenheime

## 🎯 Systemübersicht
Moderne Webanwendung zur Optimierung der Arbeitsabläufe in Seniorenheimen, entwickelt mit Bootstrap 5 für maximale Benutzerfreundlichkeit und Zugänglichkeit.

## ✨ Hauptfunktionen

### 1. Verbesserte OCR-Erkennung
- 🔍 **Automatische Bewohnererkennung**
  - Bootstrap-Alerts für Erkennungsstatus
  - Fortschrittsanzeige während der Verarbeitung
  - Responsive Bildvorschau
- 🔄 **Datenbankintegration**
  - Echtzeit-Validierung mit Bootstrap-Feedback
  - Toast-Benachrichtigungen für Statusupdates
- ⚠️ **Fehlerbehandlung**
  - Benutzerfreundliche Fehlermeldungen
  - Guided Error Recovery

### 2. Optimierte Filter-Darstellung
- 📊 **Filter-Banner**
  - Bootstrap-Grid für responsive Darstellung
  - Sticky-Header für bessere Navigation
  - Collapse/Expand Funktionalität
- 🔀 **Erweiterte Sortierung**
  - Dynamische Dropdown-Menüs
  - Multi-Select Filteroptionen
  - Real-time Aktualisierung
- 👥 **Bewohner-Gruppierung**
  - Bootstrap-Cards für übersichtliche Darstellung
  - Accordion-Komponenten für Details
  - Responsive Listenansicht

### 3. UI/UX Verbesserungen
- 📱 **Responsive Design**
  - Mobile-First Ansatz
  - Bootstrap Breakpoints optimiert
  - Touch-freundliche Bedienelemente
- 🎨 **Visuelles Feedback**
  - Animierte Zustandsänderungen
  - Intuitive Icon-Sprache
  - Konsistente Farbcodierung
- 💻 **Layout-Optimierung**
  - Effiziente Raumnutzung
  - Flexible Container-Strukturen
  - Barrierefreie Navigation

## 🛠️ Technische Implementierung
- Bootstrap 5.3.x Framework
- Responsive Grid-System
- Utility-Klassen für konsistentes Styling
- JavaScript-Komponenten für interaktive Elemente

## 📱 Responsive Breakpoints
- xs: <576px (Mobile)
- sm: ≥576px (Tablets)
- md: ≥768px (Kleine Desktops)
- lg: ≥992px (Desktop)
- xl: ≥1200px (Große Displays)

## 🔧 Performance-Optimierungen
- Lazy Loading für Bilder
- Code-Splitting
- Optimierte Asset-Delivery
- Caching-Strategien

## 🎯 Nutzen
Die Anwendung bietet:
- Intuitive Bedienung für Pflegepersonal
- Effiziente Verwaltungsprozesse
- Optimierte Arbeitsabläufe
- Verbesserte Bewohnerbetreuung

## 📈 Zukünftige Entwicklung
- Weitere UI/UX Optimierungen
- Erweiterte Filter-Funktionen
- Verbesserte OCR-Genauigkeit
- Zusätzliche Reporting-Features

# Seniorenheim Verwaltungssystem 2025

## Überblick
Die Website dient der Verwaltung und Organisation des täglichen Ablaufs in einem Seniorenheim. Sie ermöglicht es dem Personal, Bewohnerdaten zu verwalten, Essenspläne zu erstellen und den täglichen Betrieb effizient zu gestalten.

### Backend-Struktur (`backend/data/solo/`)
Das Backend-Verzeichnis ist die zentrale Datenverwaltung des Systems und besteht aus zwei Hauptkomponenten:

1. **Konfigurationsverzeichnis** (`config/`)
   - Speichert alle Systemkonfigurationen
   - Enthält `formConfig.json` für die Bereichskonfiguration
   - Verwaltet Einstellungen und Standardwerte
   - Ermöglicht die Anpassung des Systems ohne Code-Änderungen

2. **Personenverzeichnis** (`person/`)
   - Speichert alle Bewohnerdaten
   - Unterteilt in:
     - `upToDate/`: Aktuelle Bewohnerdaten
     - `old/`: Historische Daten entlassener Bewohner
   - Ermöglicht die Nachverfolgung von Bewohnerhistorie
   - Sichert die Datenpersistenz
   - Dient als Backup um versehentlich gelöschte Personen zurück in `upToDate/` zu bringen wenn benötigt

### Hauptfunktionen


### 1. Erfassung und Verwaltung von Bewohnerdaten

- Bewohner werden als Cards angezeigt mit:
  - Platzhalter-Bild: `frontend/SoloNew/img/person.png`
  - Name des Bewohners
- Datenquelle: Einzelne JSON-Dateien pro Bewohner in  
  `backend/data/solo/person/upToDate/`
- Die JSON-Dateien enthalten:
  - `firstName`, `lastName`, `gender`
  - `areas`: benutzerdefinierte Zusatzinformationen

**Beispiel für ein `areas`-Feld in `formConfig.json`:**

```json
{
  "name": "Wo wird das Essen eingetragen!",
  "multiple": false,
  "menuFilter": true,
  "changeable": false,
  "buttons": [
    { "label": "Zimmer" },
    { "label": "Saal" },
    { "label": "1.OG" },
    { "label": "2.OG" },
    { "label": "3.OG" }
  ]
}
```

---

### 2. MODAL 1 – Neuer Bewohner

- Startet die manuelle Eingabe:
  - Vorname, Nachname
  - Alle Felder aus `formConfig.json`
- Speichern-Button erstellt eine JSON-Datei unter:  
  `backend/data/solo/person/upToDate/`
- Dateiname: `Vorname_Nachname.json`
- Vor dem Speichern:
  - Überprüfung auf Doppelte anhand des Inhalts, nicht Dateiname

**Beispiel für Bewohner-Datei:**

```json
{
  "firstName": "Hendrik",
  "lastName": "Fischer",
  "gender": "Herr",
  "areas": {
    "Allergene": "Laktoseintoleranz",
    "Frühstück": "3. OG",
    "Mittagessen": "2. OG",
    "Abendessen": "1. OG",
    "Wo wird das Essen eingetragen!": "Speisesaal"
  },
  "vergin": "40",
  "lastModified": "2025-03-28T17:08:51.350Z"
}
```

---

### 3. MODAL 2 – Dokumentenerkennung (OCR)

- Öffnet sich über Button **„Dokumentenerkennung“**
- Zwei Wege:
  - **PC:** Bild-Upload
  - **Smartphone/Tablet:** Bild-Upload oder Kamera
- Bei Kamera:
  - Symbole: Kamera wechseln, Foto aufnehmen, Schließen (X)
  - Toast: „Bitte Dokument fotografieren“
  - Nach Aufnahme: OCR läuft mit Ladespinner

**Ergebnisanzeige:**
- Namen werden logisch gruppiert (z. B. durch Nähe im Text)
- Darstellung: Liste mit Checkboxen
- Bereits vorhandene Namen:
  - Rot markiert
  - Checkbox entfernt
  - Hinweis: *„Name schon vorhanden“*

**Footer:**

```html
<div class="modal-footer">
  <button type="button" class="secondary-btn" id="selectAllBtn">Alle</button>
  <button type="button" class="primary-btn" id="confirmOcrResults">Speichern</button>
  <button type="button" class="secondary-btn" id="manualSelectBtn">Manuell</button>
  <button type="button" class="danger-btn" id="cancelOcrResults">Abbrechen</button>
</div>
```

---

### 4. Manueller OCR-Modus



**Ablauf:**
1. Überschrift: *„Vorname anklicken“*
2. Klick auf Wort → wird grün und im Header angezeigt
3. Dann: *„Nachname anklicken“*
4. Beide Namen kombiniert → blauer Button mit `X` zum Entfernen
5. Bei bereits existierendem Namen → Button rot, wird nicht gespeichert
6. Vorgang wiederholt sich, bis alle Namen gewählt wurden
7. Klick auf **„Namen übernehmen“**

### 5. MODAL 3 – Auferstehung
-Auferstehung- Öffnet ein weiteres Modal:

**Aufteilung:**
- **10 % Header:** Name des Modals "Entlassene Bewohner"
- **80 % Body:** Liste der Bewohner welche Verstorben sind und in backend\data\solo\person\old verschoben wurden. und dem "Wiederherstellen" Buttons
- **10 % Footer:** Button: "Schließen"

```html Beispiel
<div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="resurrectionModalLabel">Entlassene Bewohner</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
                </div>
                <div class="modal-body">
                    <div id="dismissedResidentsList"><div class="list-group"><div class="list-group-item d-flex justify-content-between align-items-center"><div>2, 2</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>2, 22</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Alt und Runzlig, Hendriko</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Austria, Myneva</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Heinrich, Hendrik</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Otto, Berger</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Rachs, Kowald</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>sepp, Gerd</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Verstorben, Test</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Walter , Mimose Wa</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div><div class="list-group-item d-flex justify-content-between align-items-center"><div>Zepp, Gustl</div><div><button class="btn btn-outline-success btn-sm"><i class="fas fa-undo"></i> Wiederherstellen</button></div></div></div></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Schließen</button>
                </div>
            </div>
```


-
### 6. MODAL 4 – Konfiguration
-Konfiguration- Öffnet ein weiteres Modal:

**Aufteilung:**
- **10 % Header:** Name des Modals "Bereiche" und "Filter"
- **80 % Body:** Bei Bereiche: Ein Bereiche Hinzufügen Button und die Bereits erstellten Bereiche mit ihren Auswahlen und Switches für : 
Mehrfachauswahl (Ein Bewohner kann mehrere der im Bereich bereitgestellten Buttons "Informationen" wählen)
Als Filter verwenden (der Bereich wird im Modal "Filter" als Filter angezeigt)
Änderbar  (gibt an ob der Bereich nach dem ersten eintargen bzw. wahl noch einmal geändert werden darf)
- **10 % Footer:** Button: "Schließen"

```html Beispiel


<div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="configModalLabel">Konfiguration</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
                </div>
                <div class="modal-body">
                    <!-- Bootstrap Tabs -->
                    <ul class="nav nav-tabs" id="configTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="areas-tab" data-bs-toggle="tab" data-bs-target="#areasTab" type="button" role="tab" aria-controls="areasTab" aria-selected="true">Bereiche</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="filter-tab" data-bs-toggle="tab" data-bs-target="#filterTab" type="button" role="tab" aria-controls="filterTab" aria-selected="false" tabindex="-1">Filter</button>
                        </li>
                    </ul>                   
                        <!-- Bereiche Tab -->
                        <div class="tab-pane fade active show" id="areasTab" role="tabpanel" aria-labelledby="areas-tab">
                            <div class="sticky-header mb-3">
                                <button type="button" class="btn btn-primary" id="addAreaBtn">
                                    <i class="fas fa-plus"></i> Bereich hinzufügen
                                </button>
                            </div>
                            <div id="areasList" class="areas-list"><div class="card mb-3" data-area-name="Sexy">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Sexy</h5>
                    <button type="button" class="btn btn-sm btn-danger delete-area-btn" data-area-name="Sexy">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="area-name-0" class="form-label">Name</label>
                        <input type="text" class="form-control area-name" id="area-name-0" value="Sexy">
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-multiple" type="checkbox" id="area-multiple-0">
                            <label class="form-check-label" for="area-multiple-0">Mehrfachauswahl</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-menu-filter" type="checkbox" id="area-menu-filter-0">
                            <label class="form-check-label" for="area-menu-filter-0">Als Filter verwenden</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-changeable" type="checkbox" id="area-changeable-0">
                            <label class="form-check-label" for="area-changeable-0">Änderbar</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6>Buttons</h6>
                        <div class="buttons-list" id="area-buttons-0">
                            <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Yes" data-index="0">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="0">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="No" data-index="1">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="1">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Jup" data-index="2">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                           </div>
                        <button type="button" class="btn btn-sm btn-outline-primary add-button-btn" data-area-name="Sexy">
                            <i class="fas fa-plus"></i> Button hinzufügen
                        </button>
                    </div>
                </div>
            </div><div class="card mb-3" data-area-name="Allergene">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Allergene</h5>
                    <button type="button" class="btn btn-sm btn-danger delete-area-btn" data-area-name="Allergene">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="area-name-1" class="form-label">Name</label>
                        <input type="text" class="form-control area-name" id="area-name-1" value="Allergene">
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-multiple" type="checkbox" id="area-multiple-1">
                            <label class="form-check-label" for="area-multiple-1">Mehrfachauswahl</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-menu-filter" type="checkbox" id="area-menu-filter-1">
                            <label class="form-check-label" for="area-menu-filter-1">Als Filter verwenden</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-changeable" type="checkbox" id="area-changeable-1">
                            <label class="form-check-label" for="area-changeable-1">Änderbar</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6>Buttons</h6>
                        <div class="buttons-list" id="area-buttons-1">
                            <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Laktoseintoleranz" data-index="0">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="0">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Fruktoseunverträglichkeit" data-index="1">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="1">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Nussallergie" data-index="2">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Breikost" data-index="3">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="3">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Schwertangst" data-index="4">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="4">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary add-button-btn" data-area-name="Allergene">
                            <i class="fas fa-plus"></i> Button hinzufügen
                        </button>
                    </div>
                </div>
            </div><div class="card mb-3" data-area-name="Frühstück">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Frühstück</h5>
                    <button type="button" class="btn btn-sm btn-danger delete-area-btn" data-area-name="Frühstück">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="area-name-2" class="form-label">Name</label>
                        <input type="text" class="form-control area-name" id="area-name-2" value="Frühstück">
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-multiple" type="checkbox" id="area-multiple-2">
                            <label class="form-check-label" for="area-multiple-2">Mehrfachauswahl</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-menu-filter" type="checkbox" id="area-menu-filter-2">
                            <label class="form-check-label" for="area-menu-filter-2">Als Filter verwenden</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-changeable" type="checkbox" id="area-changeable-2">
                            <label class="form-check-label" for="area-changeable-2">Änderbar</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6>Buttons</h6>
                        <div class="buttons-list" id="area-buttons-2">
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Saal" data-index="0">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="0">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="1. OG" data-index="1">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="1">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="2. OG" data-index="2">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="3. OG" data-index="3">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="3">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary add-button-btn" data-area-name="Frühstück">
                            <i class="fas fa-plus"></i> Button hinzufügen
                        </button>
                    </div>
                </div>
            </div><div class="card mb-3" data-area-name="Mittagessen">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Mittagessen</h5>
                    <button type="button" class="btn btn-sm btn-danger delete-area-btn" data-area-name="Mittagessen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="area-name-3" class="form-label">Name</label>
                        <input type="text" class="form-control area-name" id="area-name-3" value="Mittagessen">
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-multiple" type="checkbox" id="area-multiple-3">
                            <label class="form-check-label" for="area-multiple-3">Mehrfachauswahl</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-menu-filter" type="checkbox" id="area-menu-filter-3">
                            <label class="form-check-label" for="area-menu-filter-3">Als Filter verwenden</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-changeable" type="checkbox" id="area-changeable-3">
                            <label class="form-check-label" for="area-changeable-3">Änderbar</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6>Buttons</h6>
                        <div class="buttons-list" id="area-buttons-3">
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Saal" data-index="0">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="0">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="1. OG" data-index="1">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="1">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="2. OG" data-index="2">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="3. OG" data-index="3">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="3">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary add-button-btn" data-area-name="Mittagessen">
                            <i class="fas fa-plus"></i> Button hinzufügen
                        </button>
                    </div>
                </div>
            </div><div class="card mb-3" data-area-name="Abendessen">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Abendessen</h5>
                    <button type="button" class="btn btn-sm btn-danger delete-area-btn" data-area-name="Abendessen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="area-name-4" class="form-label">Name</label>
                        <input type="text" class="form-control area-name" id="area-name-4" value="Abendessen">
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-multiple" type="checkbox" id="area-multiple-4">
                            <label class="form-check-label" for="area-multiple-4">Mehrfachauswahl</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-menu-filter" type="checkbox" id="area-menu-filter-4" checked="">
                            <label class="form-check-label" for="area-menu-filter-4">Als Filter verwenden</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-changeable" type="checkbox" id="area-changeable-4">
                            <label class="form-check-label" for="area-changeable-4">Änderbar</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6>Buttons</h6>
                        <div class="buttons-list" id="area-buttons-4">
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Saal" data-index="0">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="0">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="1. OG" data-index="1">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="1">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="2. OG" data-index="2">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="3. OG" data-index="3">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="3">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary add-button-btn" data-area-name="Abendessen">
                            <i class="fas fa-plus"></i> Button hinzufügen
                        </button>
                    </div>
                </div>
            </div><div class="card mb-3" data-area-name="Wo wird das Essen eingetragen!">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Wo wird das Essen eingetragen!</h5>
                    <button type="button" class="btn btn-sm btn-danger delete-area-btn" data-area-name="Wo wird das Essen eingetragen!">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="area-name-5" class="form-label">Name</label>
                        <input type="text" class="form-control area-name" id="area-name-5" value="Wo wird das Essen eingetragen!">
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-multiple" type="checkbox" id="area-multiple-5">
                            <label class="form-check-label" for="area-multiple-5">Mehrfachauswahl</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-menu-filter" type="checkbox" id="area-menu-filter-5" checked="">
                            <label class="form-check-label" for="area-menu-filter-5">Als Filter verwenden</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-changeable" type="checkbox" id="area-changeable-5">
                            <label class="form-check-label" for="area-changeable-5">Änderbar</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6>Buttons</h6>
                        <div class="buttons-list" id="area-buttons-5">
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Zimmer" data-index="0">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="0">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="Saal" data-index="1">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="1">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="1.OG" data-index="2">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="2.OG" data-index="3">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="3">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="3.OG" data-index="4">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="4">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary add-button-btn" data-area-name="Wo wird das Essen eingetragen!">
                            <i class="fas fa-plus"></i> Button hinzufügen
                        </button>
                    </div>
                </div>
            </div></div>
                        </div>
                        
                        <!-- Filter Tab -->
                        <div class="tab-pane fade" id="filterTab" role="tabpanel" aria-labelledby="filter-tab">
                            <div id="filterOptions" class="filter-options"><div class="filter-group mb-4"><h5 class="mb-2">Filter nach Bereich</h5><div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-outline-secondary filter-btn area-filter" data-value="Sexy">Sexy</button><button class="btn btn-sm btn-outline-secondary filter-btn area-filter" data-value="Allergene">Allergene</button><button class="btn btn-sm btn-outline-secondary filter-btn area-filter" data-value="Frühstück">Frühstück</button><button class="btn btn-sm btn-outline-secondary filter-btn area-filter" data-value="Mittagessen">Mittagessen</button><button class="btn btn-sm btn-outline-secondary filter-btn area-filter" data-value="Abendessen">Abendessen</button><button class="btn btn-sm btn-outline-secondary filter-btn area-filter" data-value="Wo wird das Essen eingetragen!">Wo wird das Essen eingetragen!</button></div></div></div>
                        <button class="btn btn-warning mt-3">Filter neu laden</button></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
                    <button type="button" class="btn btn-primary" id="saveConfigBtn">Speichern</button>
                </div>
            </div>



Modals: 
   -<div class="d-flex justify-content-between align-items-center flex-wrap">
                    <h1>Bewohner-Verwaltung</h1>
                    <div class="action-buttons d-flex flex-wrap gap-2">
                        <button id="newResidentBtn" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Neuer Bewohner
                        </button>
                        <button id="uploadBtn" class="btn btn-primary">
                            <i class="fas fa-upload"></i> Dokumentenerkennung
                        </button>
                        <button id="resurrectionBtn" class="btn btn-secondary">
                            <i class="fas fa-cross"></i> Auferstehung
                        </button>
                        <button id="configBtn" class="btn btn-secondary">
                            <i class="fas fa-cog"></i> Konfiguration
                        </button>
                    </div>
                </div>



3. **Flexible Konfiguration**
   - Beim Einpflegen beziehungsweise erstellen von Bewohnern ist nur der Vorname und Nachnameein fixer Bestandteil. Alle anderen Informationen die erfasst werden, werden vom Benutzer erstellt
   Dies geschieht durch anpassbare Bereiche. Ein Bereich ist quasi eine Überschrift oder das Hauptmerkmal wie zum Beispiel "Wo wird das Essen eingetragen". Die Kategorien sind dann die wählbaren Optionen in diesem Fall wo das Essen eingetragen wird also in diesem Beispiel: Saal, 1.OG, 2.OG, 3.OG.
   - Anpassbare Bereiche und Kategorien
   
 

4. **Filter-System**
   - die Vom Benutzer erstellten Informations Inputs mit den zugehörigen Kategorien welche in backend\data\solo\config\formConfig.json  liegen werden zum Filtern der Bewohner benutzt.  
   - Filterung nach Bereichen und Feldern
   - Dynamische Gruppierung von Bewohnern
   - Übersichtliche Darstellung der gefilterten Ergebnisse
   - Klare Anzeige des aktiven Filters

5. **Benutzerfreundlichkeit**
   - Intuitive Bedienung
   - Übersichtliche Darstellung
   - Schnelle Erfassung von Daten

### Zielgruppe
- Pflegepersonal
- Küchenpersonal
- Verwaltungspersonal
- Externe Dienstleister

### Technische Features
- Responsive Design für mobile Nutzung
- Offline-Fähigkeit für grundlegende Funktionen
- Automatische Datensynchronisation
- Sichere Datenspeicherung

## Bereichskonfiguration und Filter-Logik

### Übersicht
Das System ermöglicht die flexible Konfiguration von Bereichen (Areas) für die Bewohnerverwaltung. Jeder Bereich kann individuell angepasst werden und verschiedene Funktionen erfüllen.

### Bereichskonfiguration

#### Grundstruktur
Jeder Bereich besteht aus:
- Einem Namen (z.B. "Allergene", "Frühstück", "Mittagessen")
- Konfigurierbaren Buttons (z.B. "Saal", "1. OG", "2. OG")
- Verschiedenen Einstellungsmöglichkeiten

#### Einstellungsmöglichkeiten pro Bereich

1. **Mehrfachauswahl erlauben**
   - Ermöglicht die Auswahl mehrerer Buttons gleichzeitig
   - Beispiel: Ein Bewohner kann mehrere Allergene haben

2. **Menü-Filter**
   - Ermöglicht die Filterung der Bewohner nach diesem Bereich
   - Beispiel: Alle Bewohner im Saal für das Frühstück anzeigen

3. **Menü Relevant**
   - Bestimmt, ob der Bereich im Bewohnerformular bearbeitet werden kann
   - Beispiel: Essensort kann geändert werden

### Filter-Logik

#### Implementierung
Die Filter-Logik ist in zwei Hauptkomponenten aufgeteilt:

1. **ConfigManager**
   - Verwaltet die Konfiguration der Bereiche
   - Speichert die Einstellungen in `formConfig.json`
   - Ermöglicht das Hinzufügen/Löschen von Bereichen und Buttons

2. **FilterManager**
   - Verarbeitet die aktiven Filter
   - Zeigt gefilterte Bewohner an
   - Unterstützt kombinierte Filter (mehrere Bereiche gleichzeitig)
   - Gruppiert Bewohner nach Filterkriterien
   - Zeigt deutlich den aktiven Filter an

#### Filter-Typen

1. **Feld-Filter**
   - Filtert nach persönlichen Daten (Name, Geschlecht, etc.)
   - Wird in der Konfiguration definiert

2. **Bereichs-Filter**
   - Filtert nach konfigurierten Bereichen
   - Berücksichtigt die Einstellungen des Bereichs (Mehrfachauswahl, etc.)

#### Filter-Anzeige

1. **Banner für aktiven Filter**
   - Zeigt den Namen des aktiven Filters prominent an
   - Bietet eine einfache Möglichkeit, den Filter zurückzusetzen
   - Maximiert die Platznutzung der Bewohnerliste

2. **Gruppierung der Ergebnisse**
   - Sortiert Ergebnisse in logischer Reihenfolge:
     - Textbasierte Einträge zuerst
     - Numerische Einträge in aufsteigender Reihenfolge
     - "Keine Informationen vorhanden" immer am Ende
   - Verbesserte Übersichtlichkeit für Benutzer

### Beispiel-Konfiguration

```json
{
  "areas": [
    {
      "name": "Allergene",
      "multiple": true,
      "menuFilter": false,
      "changeable": true,
      "buttons": [
        { "label": "Laktoseintoleranz" },
        { "label": "Fruktoseunverträglichkeit" },
        { "label": "Nussallergie" }
      ]
    },
    {
      "name": "Frühstück",
      "multiple": false,
      "menuFilter": true,
      "changeable": true,
      "buttons": [
        { "label": "Saal" },
        { "label": "1. OG" },
        { "label": "2. OG" },
        { "label": "3. OG" }
      ]
    }
  ]
}
```

### Verwendung

1. **Bereich erstellen**
   - Klicken Sie auf "+ Bereich hinzufügen"
   - Geben Sie einen Namen ein
   - Konfigurieren Sie die Einstellungen
   - Fügen Sie Buttons hinzu

2. **Filter aktivieren**
   - Wählen Sie "Menü-Filter" für Bereiche, die als Filter verwendet werden sollen
   - Die gefilterten Bewohner werden automatisch angezeigt
   - Ein Banner zeigt den aktiven Filter deutlich an

3. **Mehrfachauswahl**
   - Aktivieren Sie "Mehrfachauswahl erlauben" für Bereiche, die mehrere Optionen erlauben sollen
   - Beispiel: Ein Bewohner kann mehrere Allergene haben

4. **Bearbeitbarkeit**
   - Aktivieren Sie "Menü Relevant" für Bereiche, die im Bewohnerformular bearbeitet werden sollen
   - Deaktivieren Sie es für Bereiche, die nur angezeigt werden sollen

### Technische Details

#### Speicherung
- Die Konfiguration wird in `backend/data/solo/config/formConfig.json` gespeichert
- Änderungen werden sofort wirksam
- Die Konfiguration wird beim Start der Anwendung geladen

#### Filter-Logik
```javascript
// Beispiel für die Filter-Logik
applyAreaFilter(residents, areaName, config) {
    const area = config.areas.find(a => a.name === areaName);
    if (!area) return residents;

    return residents.filter(resident => {
        const residentArea = resident.areas?.[areaName];
        if (!residentArea) return false;

        if (area.allowMultiple) {
            return Array.isArray(residentArea) && residentArea.length > 0;
        } else {
            return residentArea;
        }
    });
}
```

#### JSON-Dateistruktur

1. **Bewohnerdaten** (`person/upToDate/[name].json`)
```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "gender": "m",
  "birthDate": "1940-01-01",
  "room": "101",
  "areas": {
    "Allergene": ["Laktoseintoleranz", "Nussallergie"],
    "Frühstück": "Saal",
    "Mittagessen": "1. OG",
    "Abendessen": "Saal"
  },
  "lastModified": "2024-03-27T12:00:00Z",
  "status": "active"
}
```

2. **Konfigurationsdaten** (`config/formConfig.json`)
```json
{
  "areas": [
    {
      "name": "Allergene",
      "multiple": true,
      "menuFilter": false,
      "changeable": true,
      "buttons": [
        { "label": "Laktoseintoleranz" },
        { "label": "Fruktoseunverträglichkeit" },
        { "label": "Nussallergie" }
      ]
    },
    {
      "name": "Frühstück",
      "multiple": false,
      "menuFilter": true,
      "changeable": true,
      "buttons": [
        { "label": "Saal" },
        { "label": "1. OG" },
        { "label": "2. OG" },
        { "label": "3. OG" }
      ]
    }
  ]
}
```

#### API-Endpunkte

1. **Bewohnerverwaltung**
   - `GET /api/solo/residents` - Liste aller aktiven Bewohner
   - `POST /api/solo/resident` - Neuen Bewohner erstellen
   - `PUT /api/solo/resident/:name` - Bewohnerdaten aktualisieren
   - `POST /api/solo/resident/dismiss/:name` - Bewohner entlassen
   - `POST /api/solo/resident/resurrect/:name` - Bewohner wiederherstellen

2. **Konfiguration**
   - `GET /api/solo/config` - Konfiguration laden
   - `POST /api/solo/config` - Konfiguration aktualisieren

3. **Filter und Suche**
   - `GET /api/solo/residents/filter` - Bewohner nach Kriterien filtern
   - `GET /api/solo/residents/search` - Bewohner durchsuchen

#### Datenvalidierung

1. **Eingabevalidierung**
   - Pflichtfelder: Vorname, Nachname, Geschlecht
   - Datumsformat: ISO 8601 (YYYY-MM-DD)
   - Bereichswerte: Müssen in der Konfiguration definiert sein

2. **Datenintegrität**
   - Eindeutige Bewohneridentifikation
   - Konsistente Bereichswerte
   - Automatische Zeitstempel für Änderungen

3. **Validierungsregeln**
```javascript
const validationRules = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZäöüßÄÖÜ\s-]+$/
  },
  areas: {
    validateAgainstConfig: true,
    allowMultiple: (areaName) => config.areas.find(a => a.name === areaName)?.allowMultiple
  }
};
```

#### Backup-Strategie

1. **Automatische Backups**
   - Tägliche Sicherungskopie um 00:00 Uhr
   - Wöchentliche Archivierung
   - Monatliche Langzeitarchivierung

2. **Backup-Struktur**
```
backup/
├── daily/
│   └── YYYY-MM-DD/
│       ├── config/
│       └── person/
├── weekly/
│   └── week-XX/
└── monthly/
    └── YYYY-MM/
```

3. **Wiederherstellung**
   - Automatische Wiederherstellung bei Datenverlust
   - Manuelle Wiederherstellung aus Archiv
   - Versionierung der Backups

4. **Sicherheitsmaßnahmen**
   - Verschlüsselte Backups
   - Mehrfache Redundanz
   - Regelmäßige Backup-Tests

#### OCR-Funktionalität

1. **Dokumentenverarbeitung**
   - Unterstützt PDF, JPG, PNG und andere Bildformate
   - Automatische Texterkennung mit Tesseract.js
   - Mehrsprachige Unterstützung (primär Deutsch)

2. **Datenextraktion**
   - Erkennung von Namen und persönlichen Daten
   - Strukturierte Erfassung von Informationen
   - Validierung der erkannten Daten

3. **Integration**
   - Direkte Verknüpfung mit Bewohnerdatenbank
   - Automatische Vorschläge für bestehende Bewohner
   - Manuelle Korrekturmöglichkeiten

4. **API-Endpunkt**
   - `POST /api/solo/ocr/process` - Dokumentenverarbeitung
   - Parameter: Bilddatei (multipart/form-data)
   - Rückgabe: Erkannte Texte und strukturierte Daten

### Verbesserungsmöglichkeiten

1. **Performance-Optimierung**
   - Implementierung von Caching für häufig verwendete Filter
   - Optimierung der Filter-Logik für große Datenmengen

2. **Benutzerfreundlichkeit**
   - Drag & Drop für Button-Reihenfolge
   - Vorschau der Filter-Effekte
   - Speichern von Filter-Vorlagen

3. **Erweiterbarkeit**
   - Unterstützung für komplexere Filter-Logiken
   - Integration von Statistiken und Auswertungen
   - Export/Import von Konfigurationen

### Fehlerbehebung

1. **Filter funktioniert nicht**
   - Prüfen Sie, ob "Menü-Filter" aktiviert ist
   - Überprüfen Sie die Konfiguration in `formConfig.json`
   - Prüfen Sie die Browser-Konsole auf Fehler

2. **Mehrfachauswahl nicht möglich**
   - Stellen Sie sicher, dass "Mehrfachauswahl erlauben" aktiviert ist
   - Überprüfen Sie die Button-Konfiguration

3. **Bereich nicht bearbeitbar**
   - Aktivieren Sie "Menü Relevant" für den Bereich
   - Prüfen Sie die Berechtigungen 

# Solo-Modul Dokumentation

## ResidentDetailModal

Der `ResidentDetailModal` ist eine wichtige Komponente für die Verwaltung der Bewohnerdetails. Er ermöglicht das Anzeigen und Bearbeiten aller Informationen eines Bewohners.

### Funktionen

#### 1. Anzeigen der Bewohnerdetails
- Zeigt alle persönlichen Informationen des Bewohners an
- Zeigt alle konfigurierten Bereiche mit ihren Buttons
- Markiert aktive Buttons in blau basierend auf den gespeicherten Werten
- Unterstützt Einzel- und Mehrfachauswahl von Buttons

#### 2. Bearbeiten der Bewohnerdetails
- Alle Felder sind bearbeitbar
- Buttons können durch Klicken aktiviert/deaktiviert werden
- Änderungen werden erst beim Klicken auf "Speichern" gespeichert
- Unterstützt das Entlassen von Bewohnern

### Datenstruktur

Die Bewohnerdaten werden in JSON-Dateien gespeichert:
```json
{
  "firstName": "Vorname",
  "lastName": "Nachname",
  "gender": "Geschlecht",
  "areas": {
    "Bereich1": "Wert1",
    "Bereich2": "Wert2, Wert3"
  },
  "vergin": "Alter",
  "lastModified": "Zeitstempel"
}
```

### Konfiguration

Die Anzeige und Bearbeitung wird durch die `formConfig.json` gesteuert:
```json
{
  "fields": [
    {
      "id": "vergin",
      "label": "Alter",
      "type": "number",
      "required": false
    }
  ],
  "areas": [
    {
      "name": "Allergene",
      "multiple": true,
      "menuFilter": false,
      "changeable": true,
      "buttons": [
        { "label": "Laktoseintoleranz" },
        { "label": "Fruktoseunverträglichkeit" },
        { "label": "Nussallergie" }
      ]
    },
    {
      "name": "Frühstück",
      "multiple": false,
      "menuFilter": true,
      "changeable": true,
      "buttons": [
        { "label": "Saal" },
        { "label": "1. OG" },
        { "label": "2. OG" },
        { "label": "3. OG" }
      ]
    }
  ]
}
```

### Verwendung

```javascript
// Modal initialisieren
ResidentDetailModal.init();

// Bewohnerdetails anzeigen
ResidentDetailModal.show(resident, () => {
    // Callback nach erfolgreichem Speichern
    console.log('Bewohner wurde aktualisiert');
});
```

### CSS-Klassen

- `.filter-button`: Basis-Styling für alle Buttons
- `.filter-button.active`: Styling für aktive Buttons (blau)
- `.area-group`: Container für einen Bereich mit Buttons
- `.button-group`: Container für die Buttons eines Bereichs

### Event-Handler

1. Button-Klicks:
   - Toggle den aktiven Zustand
   - Aktualisieren die UI
   - Speichern den neuen Zustand im resident-Objekt

2. Speichern-Button:
   - Sammelt alle Formular-Daten
   - Speichert die Änderungen in der JSON-Datei
   - Aktualisiert die UI

3. Entlassen-Button:
   - Bestätigungsdialog
   - Verschiebt den Bewohner in den "old"-Ordner
   - Aktualisiert die UI

### Fehlerbehandlung

- Validierung der Eingaben
- Fehlermeldungen bei API-Fehlern
- Bestätigungsdialoge für wichtige Aktionen
- Automatische UI-Aktualisierung nach Fehlern 

# Seniorenheim-Management-System

## OCR-System (Texterkennung) mit erweiterter Erkennung

### Überblick
Das OCR-System ermöglicht die automatische Erkennung von Text aus Dokumenten und Bildern, insbesondere zur Erfassung neuer Bewohner. Es bietet nun erweiterte Funktionen zur Erkennung bereits existierender Bewohner und vermeidet Duplikate.

### Verbesserte Erkennung existierender Bewohner

#### Automatische Prüfung gegen Datenbank
Bei der Verarbeitung von Dokumenten prüft das System automatisch, ob erkannte Namen bereits in der Datenbank existieren:

1. **Farbliche Kennzeichnung**
   - Bereits existierende Bewohner werden rot markiert
   - Einträge enthalten den Hinweis "Person existiert bereits im System"
   - Checkboxen werden automatisch deaktiviert

2. **Intelligente Namensüberprüfung**
   - Vergleich unabhängig von Groß-/Kleinschreibung
   - Normalisierung von Sonderzeichen
   - Exakte Übereinstimmung von Vor- und Nachname erforderlich

3. **Verbesserte Fehlerbehandlung**
   - Keine Fehlermeldungen beim Versuch, existierende Bewohner zu speichern
   - Klare Benutzerbenachrichtigungen über übersprungene Einträge
   - Differenzierte Erfolgsmeldungen

#### Benutzerfreundliche Oberfläche

1. **Visuelles Feedback**
   - Rot markierte Einträge für existierende Bewohner
   - Farblich abgeschwächte Einträge für mögliche Duplikate
   - Klare Warnhinweise direkt unter den Namen

2. **Optimierte Checkbox-Steuerung**
   - Vorselektierte Checkboxen nur für neue Bewohner
   - Automatisch deaktivierte Checkboxen für existierende Bewohner
   - "Alle auswählen"-Button ignoriert existierende Bewohner

3. **Verbesserte Erfolgsmeldungen**
   - Anzeige der Anzahl neu erstellter Bewohner
   - Information über übersprungene existierende Bewohner
   - Spezifische Meldungen für verschiedene Szenarien

### Komponenten des OCR-Systems

#### 1. `OCRManager`
Die Hauptkomponente für die Verarbeitung von Bildern und Extraktion von Text:

```javascript
export const OCRManager = {
    async processImage(imageFile) {
        // Verarbeitet Bilder und extrahiert Text
        // Übermittelt Bilder an die OCR-API
        // Extrahiert automatisch Namen und prüft auf Duplikate
    },
    
    extractNames(text) {
        // Extrahiert Namen aus dem erkannten Text mit verschiedenen Regex-Mustern
        // Normalisiert und filtert die erkannten Namen
        // Berechnet die Konfidenz der erkannten Namen
    },
    
    calculateConfidence(text) {
        // Berechnet eine Konfidenz-Bewertung für erkannte Namen
        // Berücksichtigt Faktoren wie ungewöhnliche Zeichen oder Länge
    }
}
```

#### 2. `OCRModalManager`
Verwaltet die Benutzeroberfläche für die OCR-Ergebnisse:

```javascript
export const OCRModalManager = {
    lastRecognizedText: '', // Speichert den letzten erkannten Text
    
    async showResults(names, duplicates) {
        // Prüfe, welche Namen bereits existieren
        const existingResidentsMap = {};
        // Lade aktuelle Bewohner aus der Datenbank
        // Markiere existierende Bewohner in der Oberfläche
        // ...
    },
    
    attachEventListeners(content, names, resolve) {
        // Zähler für erfolgreich erstellte und übersprungene Bewohner
        let createdCount = 0;
        let skippedCount = 0;
        
        // Intelligente Verarbeitung der ausgewählten Namen
        // Überspringen existierender Bewohner
        // Anzeige differenzierter Erfolgsmeldungen
        // ...
    }
}
```

#### 3. `UploadManager`
Verwaltet das Hochladen und die Kameraintegration:

```javascript
export const UploadManager = {
    openFileDialog() {
        // Öffnet einen Datei-Dialog zur Auswahl von Bildern
        // Validiert die ausgewählten Dateien
        // Übergibt gültige Bilder an den OCRManager
    },
    
    processImageFromCamera() {
        // Nimmt ein Foto mit der Gerätekamera auf
        // Optimiert das Bild für die OCR-Verarbeitung
        // Übergibt das aufgenommene Bild an den OCRManager
    }
}
```

### OCR-Workflow

1. **Bildaufnahme**:
   - Hochladen eines Dokuments über den Datei-Dialog
   - Aufnahme eines Fotos mit der Gerätekamera
   - Optimierung des Bildes (Kontrast, Helligkeit)

2. **Textextraktion**:
   - Übermittlung des Bildes an die OCR-API (`/api/solo/ocr/process`)
   - Extraktion des Volltexts mit Tesseract.js
   - Rückgabe des erkannten Textes und Metadaten

3. **Namensextraktion**:
   - Automatische Erkennung von Namen mit verschiedenen Regex-Mustern
   - Bewertung der Konfidenz jedes erkannten Namens
   - Filterung von Duplikaten und unwahrscheinlichen Ergebnissen

4. **Ergebnisanzeige**:
   - Bei erkannten Namen: Anzeige der Liste mit Bearbeitungsoptionen
   - Bei keinen Namen: Anzeige des Volltexts zur manuellen Auswahl
   - Markierung möglicher Duplikate zur Vermeidung doppelter Einträge

5. **Manuelle Auswahl**:
   - Interaktive Benutzeroberfläche mit klickbaren Wort-Buttons
   - Automatische Zuweisung zu Vorname oder Nachname im Wechsel
   - Möglichkeit zur direkten Bearbeitung der Textfelder

6. **Bewohner erstellen**:
   - Validierung der ausgewählten Namen
   - Prüfung auf bestehende Bewohner zur Vermeidung von Duplikaten
   - Speicherung der neuen Bewohner in der Datenbank
   - Aktualisierung der Bewohnerliste in der Benutzeroberfläche

### Benutzererfahrung und UI

#### Desktop-Erfahrung
- Klassische Dateiauswahl über den Datei-Dialog
- Erweiterte Textauswahl mit Mausmarkierung
- Vollständige Tastaturunterstützung

#### Mobile Erfahrung
- Optimierte Kameranutzung mit visuellen Hilfen
- Einfache Wortauswahl durch Tippen
- Angepasste Benutzeroberfläche für Touchscreens
- Responsive Design für verschiedene Bildschirmgrößen

### CSS-Styling

Das OCR-System verwendet spezielle CSS-Klassen für ein konsistentes Erscheinungsbild:

```css
/* Wort-Buttons für die Textauswahl */
.word-button {
    display: inline-block;
    margin: 2px;
    padding: 5px 10px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.word-button.selected {
    background-color: #007bff;
    color: white;
    border-color: #0056b3;
}

/* OCR-Ergebnisliste */
.ocr-results-list {
    max-height: 60vh;
    overflow-y: auto;
    margin-bottom: 15px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background-color: #f8fafc;
}

.ocr-result-item {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-bottom: 1px solid #e2e8f0;
}

.ocr-result-item.duplicate {
    background-color: #fff5f5;
    opacity: 0.7;
}

/* Markierung existierender Bewohner */
.ocr-result-item.existing-resident {
    background-color: #fff0f0;
    border-left: 3px solid #e53e3e;
}

.ocr-existing-warning {
    color: #e53e3e;
    font-size: 12px;
    margin-top: 5px;
    font-weight: 500;
}
```

### Technische Implementierung

#### Backend-Integration
- RESTful API-Endpunkt für OCR-Verarbeitung
- Serverseitige Verarbeitung mit Tesseract.js
- Mehrsprachige Unterstützung (Deutsch als Hauptsprache)

#### Frontendkomponenten
- JavaScript-Module für die OCR-Verarbeitung
- Responsive Modals für die Benutzerinteraktion
- Asynchrone Verarbeitung mit Promises

#### Optimierungen
- Bild-Vorverarbeitung für bessere OCR-Ergebnisse
- Zwischenspeicherung von Zwischenergebnissen
- Verzögerte Ladung für bessere Performance

### Einrichtung und Konfiguration

1. **OCR-API einrichten**:
   - Tesseract.js auf dem Server installieren
   - Sprachpakete für Deutsch konfigurieren
   - API-Endpunkt in der Backend-Konfiguration aktivieren

2. **Frontend-Integration**:
   - OCR-Module in die Hauptanwendung einbinden
   - Modal-Templates in die HTML-Struktur einfügen
   - CSS-Styles für OCR-Komponenten laden

3. **Kamera-Berechtigungen**:
   - Entsprechende Berechtigungen in der Webanwendung anfordern
   - Fallback-Mechanismen für nicht unterstützte Browser implementieren
   - Sicherheitsrichtlinien für Kamerazugriff beachten

## Filter-System mit verbesserter Darstellung

### Verbessertes Filter-Banner
Die aktiven Filter werden nun in einem auffälligen Banner angezeigt:

1. **Volle Seitenbreite**
   - Nutzt den verfügbaren Platz optimal
   - Verbesserte Sichtbarkeit des aktiven Filters

2. **Klares Feedback**
   - Zeigt den Namen des aktiven Filters prominent an
   - Bietet einen deutlichen "Filter zurücksetzen"-Button
   - Responsive Design für alle Gerätetypen

3. **Platzoptimierung**
   - Ersetzt die Liste der Bewohner, wenn ein Filter aktiv ist
   - Maximiert den verfügbaren Platz für die gefilterten Ergebnisse
   - Verbesserte Textumbrüche für lange Filternamen

### Verbesserte Sortierung der Filterergebnisse
Die gefilterten Bewohner werden nun intelligent sortiert:

1. **Optimierte Reihenfolge**
   - Textbasierte Einträge zuerst
   - Numerische Einträge in aufsteigender Reihenfolge (z.B. "1. OG", "2. OG")
   - "Kein Informationen vorhanden" immer am Ende

2. **Konsistente Darstellung**
   - Alphabetische Sortierung innerhalb der Gruppen
   - Klar abgegrenzte Gruppenbereiche
   - Deutliche Überschriften mit Anzahl der Bewohner

### CSS-Styling

```css
/* Filter-Banner Styles */
.active-filter-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--primary-color);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0;
    margin-bottom: 1rem;
    margin-left: -2rem;
    margin-right: -2rem;
    width: calc(100% + 4rem);
    box-sizing: border-box;
}

.active-filter-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
}

.filter-label {
    font-size: 0.9rem;
    opacity: 0.9;
    white-space: nowrap;
}

.filter-value {
    font-size: 1.1rem;
    font-weight: 600;
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
}
```

## Zusammenfassung der neuen Funktionen

Die Solo-Anwendung wurde um folgende Hauptfunktionen erweitert:

1. **Verbesserte OCR-Erkennung existierender Bewohner**
   - Automatische Erkennung und Markierung existierender Bewohner
   - Intelligente Überprüfung gegen die Bewohnerdatenbank
   - Verbesserte Fehlerbehandlung und Benutzerbenachrichtigungen

2. **Optimierte Filter-Darstellung**
   - Deutliches Filter-Banner über die gesamte Seitenbreite
   - Verbesserte Sortierlogik für Filter-Ergebnisse
   - Intelligente Gruppierung und Anzeige der gefilterten Bewohner

3. **Verbesserte Benutzeroberfläche**
   - Klareres visuelles Feedback
   - Optimierte Platznutzung
   - Responsive Anpassungen für alle Gerätetypen

Die Anwendung bietet nun eine noch intuitivere Benutzeroberfläche für Pflegepersonal und Verwaltung und optimiert die täglichen Arbeitsabläufe in Seniorenheimen. 

<div class="row" id="residentCards"></div> 