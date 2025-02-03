function createNavbar() {
    // Container für die Navbar erstellen
    const navbar = document.createElement('nav');
    navbar.className = 'main-navbar';
    
    // Logo/Icon Container
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    
    // Modulname aus der URL extrahieren und formatieren
    const currentPath = window.location.pathname;
    const moduleName = currentPath.split('/')[1] || 'Dashboard';
    const formattedModuleName = moduleName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Titel-Container
    const titleContainer = document.createElement('div');
    titleContainer.className = 'title-container';
    
    // Modulname hinzufügen
    const title = document.createElement('h1');
    title.className = 'module-title';
    title.textContent = formattedModuleName;
    titleContainer.appendChild(title);
    
    // Button-Container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Dashboard-Button erstellen
    const dashboardBtn = document.createElement('button');
    dashboardBtn.className = 'dashboard-btn';
    dashboardBtn.textContent = 'Zurück zum Dashboard';
    dashboardBtn.onclick = () => window.location.href = '/dashboard';
    buttonContainer.appendChild(dashboardBtn);
    
    // Elemente zur Navbar hinzufügen
    navbar.appendChild(logoContainer);
    navbar.appendChild(titleContainer);
    navbar.appendChild(buttonContainer);
    
    // Navbar am Anfang des body einfügen
    document.body.insertBefore(navbar, document.body.firstChild);
}

// Navbar erstellen, sobald das DOM geladen ist
document.addEventListener('DOMContentLoaded', createNavbar);