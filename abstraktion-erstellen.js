const fs = require('fs');
const path = require('path');

// Basisverzeichnis des Projekts
const baseDir = './frontend';

// Inhalt der Abstraktionsdatei
const abstraktionContent = `# Abstraktion

## Zweck
Diese Komponente dient zur [Hauptfunktion beschreiben].

## Datenmodell
- Hauptentitäten: [Liste relevanter Datenstrukturen]
- Datenfluss: [Wie Daten verarbeitet werden]

## Benutzeroberfläche
- Hauptkomponenten: [Auflistung]
- Interaktionen: [Wie Benutzer mit der Komponente interagieren]

## Integration
- Verbindungen: [Wie diese Komponente mit anderen interagiert]
- API-Aufrufe: [Relevante Backend-Endpunkte]

## Besonderheiten
- [Spezielle Implementierungsdetails]
`;

// Verzeichnisse durchsuchen und Abstraktionsdateien erstellen
function erstelleAbstraktionsdateien(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Fehler beim Lesen des Verzeichnisses ${dir}:`, err);
      return;
    }

    // Prüfen, ob ein index.html im Verzeichnis existiert
    const hatIndexHtml = files.some(file => 
      !file.isDirectory() && file.name === 'index.html');

    if (hatIndexHtml) {
      // Abstraktionsdatei erstellen
      const abstraktionPath = path.join(dir, 'Abstraktion.md');
      fs.writeFile(abstraktionPath, abstraktionContent, err => {
        if (err) {
          console.error(`Fehler beim Erstellen von ${abstraktionPath}:`, err);
        } else {
          console.log(`Abstraktionsdatei erstellt: ${abstraktionPath}`);
        }
      });
    }

    // Unterverzeichnisse durchsuchen
    files.forEach(file => {
      if (file.isDirectory()) {
        erstelleAbstraktionsdateien(path.join(dir, file.name));
      }
    });
  });
}

// Starte den Prozess
erstelleAbstraktionsdateien(baseDir); 