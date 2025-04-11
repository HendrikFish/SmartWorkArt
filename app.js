// Einfaches JavaScript für die Startseite
// MCP-Integration importieren
const { integrateMCP } = require('./mcp-integration');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Willkommen auf der Seniorenheim-Portal Startseite!');
    
    // MCP integrieren
    integrateMCP();
    
    // Füge hier weiteren JavaScript-Code für die Startseite hinzu, falls nötig
}); 