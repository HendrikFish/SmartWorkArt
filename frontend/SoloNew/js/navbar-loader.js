/**
 * Navbar-Loader für SoloNew
 * Lädt die Navbar aus dem frontend/navbar Ordner und bindet sie in die Anwendung ein
 */

// Funktion zum Laden der Navbar
export async function loadNavbar() {
    try {
        // 1. CSS laden
        await loadNavbarCSS();
        
        // 2. Navbar erstellen
        createNavbar();
        
        // 3. Body-Padding anpassen für Fixed Navbar
        document.body.style.paddingTop = '70px';
        
        console.log('Navbar erfolgreich geladen');
    } catch (error) {
        console.error('Fehler beim Laden der Navbar:', error);
    }
}

// CSS laden
async function loadNavbarCSS() {
    // Prüfen, ob die CSS bereits geladen ist
    if (document.querySelector('link[href="/frontend/navbar/navbar.css"]')) {
        return;
    }
    
    // CSS-Link erstellen und einfügen
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/frontend/navbar/navbar.css';
    document.head.appendChild(link);
    
    // Warten, bis die CSS geladen ist
    return new Promise((resolve, reject) => {
        link.onload = resolve;
        link.onerror = reject;
    });
}

// Navbar erstellen
function createNavbar() {
    // Container für die Navbar erstellen
    const navbar = document.createElement('nav');
    navbar.className = 'main-navbar';
    
    // Logo/Icon Container
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    
    // Logo hinzufügen (optional)
    const logo = document.createElement('img');
    logo.src = '/frontend/navbar/logo.png'; // Falls ein Logo vorhanden ist
    logo.alt = 'Logo';
    logo.onerror = function() {
        // Falls kein Logo gefunden wird, Icons verwenden
        this.remove();
        const icon = document.createElement('i');
        icon.className = 'fas fa-users';
        icon.style.fontSize = '24px';
        logoContainer.appendChild(icon);
    };
    logoContainer.appendChild(logo);
    
    // Titel-Container
    const titleContainer = document.createElement('div');
    titleContainer.className = 'title-container';
    
    // Titel hinzufügen
    const title = document.createElement('h1');
    title.className = 'module-title';
    title.textContent = 'Bewohner-Verwaltung';
    titleContainer.appendChild(title);
    
    // Button-Container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Dark Mode Toggle-Button erstellen
    const darkModeBtn = document.createElement('button');
    darkModeBtn.className = 'btn btn-outline-secondary me-2';
    darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    darkModeBtn.title = 'Dark/Light Mode umschalten';
    darkModeBtn.id = 'darkModeToggle';
    buttonContainer.appendChild(darkModeBtn);
    
    // Dashboard-Button erstellen
    const dashboardBtn = document.createElement('button');
    dashboardBtn.className = 'dashboard-btn';
    dashboardBtn.innerHTML = '<i class="fas fa-home"></i> Zurück zum Dashboard';
    dashboardBtn.onclick = () => window.location.href = '/dashboard';
    buttonContainer.appendChild(dashboardBtn);
    
    // Elemente zur Navbar hinzufügen
    navbar.appendChild(logoContainer);
    navbar.appendChild(titleContainer);
    navbar.appendChild(buttonContainer);
    
    // Navbar am Anfang des body einfügen
    document.body.insertBefore(navbar, document.body.firstChild);
}

// Navbar automatisch laden, wenn das Modul importiert wird
document.addEventListener('DOMContentLoaded', loadNavbar); 