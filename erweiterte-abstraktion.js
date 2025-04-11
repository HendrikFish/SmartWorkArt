const fs = require('fs');
const path = require('path');

// Basisverzeichnis des Projekts
const baseDir = path.resolve(__dirname, 'frontend');

// Erweiterte Vorlage für Abstraktionsdatei
const abstraktionContent = `# Abstraktion

## Zweck
Diese Komponente dient zur [Hauptfunktion beschreiben].

## Datenmodell
- Hauptentitäten: [Liste relevanter Datenstrukturen]
- Datenfluss: [Wie Daten verarbeitet werden]
- Datenabhängigkeiten: [Welche anderen Komponenten auf diese Daten zugreifen]

## Benutzeroberfläche
- Hauptkomponenten: [Auflistung]
- Interaktionen: [Wie Benutzer mit der Komponente interagieren]
- Barrierefreiheit: [Spezielle Anpassungen für Senioren]

## Integration
- Verbindungen: [Wie diese Komponente mit anderen interagiert]
- API-Aufrufe: [Relevante Backend-Endpunkte]
- Ereignisse: [Events, die ausgelöst oder empfangen werden]

## Besonderheiten
- [Spezielle Implementierungsdetails]
- [Bekannte Einschränkungen]
- [Best Practices bei der Erweiterung]

## Tutorial
Schritt-für-Schritt Anleitung zur Verwendung dieser Komponente:

1. [Erster Schritt]
2. [Zweiter Schritt]
3. [Dritter Schritt]

## Codebeispiele
\`\`\`javascript
// Beispielcode für die Verwendung dieser Komponente
\`\`\`

## Verwandte Komponenten
- [Komponente 1]: [Kurze Beschreibung der Beziehung]
- [Komponente 2]: [Kurze Beschreibung der Beziehung]
`;

// Verzeichnisse durchsuchen und Abstraktionsdateien erstellen
function erstelleAbstraktionsdateien(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    // Prüfen, ob ein index.html im Verzeichnis existiert
    const hatIndexHtml = files.some(file => 
      !file.isDirectory() && file.name === 'index.html');

    if (hatIndexHtml) {
      // Abstraktionsdatei erstellen
      const abstraktionPath = path.join(dir, 'Abstraktion.md');
      fs.writeFileSync(abstraktionPath, abstraktionContent);
      console.log(`Abstraktionsdatei erstellt: ${abstraktionPath}`);
    }

    // Unterverzeichnisse durchsuchen
    files.forEach(file => {
      if (file.isDirectory()) {
        erstelleAbstraktionsdateien(path.join(dir, file.name));
      }
    });
  } catch (err) {
    console.error(`Fehler beim Verarbeiten des Verzeichnisses ${dir}:`, err);
  }
}

// Starte den Prozess
erstelleAbstraktionsdateien(baseDir);
console.log("Abstraktionsdateien wurden erstellt!"); 