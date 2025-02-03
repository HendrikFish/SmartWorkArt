const fs = require('fs');
const path = require('path');

const testResident = {
    firstName: "Test",
    lastName: "Bewohner",
    gender: "Herr",
    areas: {}
};

// Korrekter Pfad vom Projektroot aus
const filePath = path.join(__dirname, '../data/solo/person/upToDate/test_bewohner.json');

// Stelle sicher, dass das Verzeichnis existiert
const dirPath = path.dirname(filePath);
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

fs.writeFileSync(filePath, JSON.stringify(testResident, null, 2));
console.log('Test-Bewohner wurde erstellt in:', filePath); 