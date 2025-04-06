/**
 * Dark Mode Manager
 * Verwaltet das Farbschema der Anwendung (Hell/Dunkel)
 */

export const DarkModeManager = {
  /**
   * Schlüssel für die Speicherung der Dark Mode-Einstellung im localStorage
   */
  STORAGE_KEY: 'soloNewDarkMode',
  
  /**
   * Gibt an, ob der Dark Mode aktiv ist
   */
  isDarkMode: false,
  
  /**
   * Initialisiert den Dark Mode Manager
   */
  init() {
    // Prüfe, ob eine Systemeinstellung für das Farbschema vorhanden ist
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Prüfe, ob der Benutzer bereits eine Präferenz gespeichert hat
    const storedPreference = localStorage.getItem(this.STORAGE_KEY);
    
    // Aktiviere den Dark Mode, wenn der Benutzer ihn gespeichert hat oder wenn das System ihn bevorzugt
    if (storedPreference === 'true' || (storedPreference === null && prefersDarkMode)) {
      this.enableDarkMode(false); // Stille Aktivierung ohne Toast
    } else {
      this.disableDarkMode(false); // Stille Deaktivierung ohne Toast
    }
    
    // Event-Listener für Änderungen der Systemeinstellung
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (localStorage.getItem(this.STORAGE_KEY) === null) {
        // Nur reagieren, wenn der Benutzer keine explizite Präferenz gespeichert hat
        if (event.matches) {
          this.enableDarkMode(false);
        } else {
          this.disableDarkMode(false);
        }
      }
    });
    
    // Event-Listener für den Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        this.toggleDarkMode();
      });
      
      // Aktualisiere den Zustand des Toggles
      darkModeToggle.checked = this.isDarkMode;
    }
    
    console.log('Dark Mode Manager initialisiert. Aktueller Modus:', this.isDarkMode ? 'Dunkel' : 'Hell');
  },
  
  /**
   * Aktiviert den Dark Mode
   * @param {boolean} showToast Gibt an, ob eine Toast-Benachrichtigung angezeigt werden soll
   */
  enableDarkMode(showToast = true) {
    // Dark Mode aktiv setzen
    this.isDarkMode = true;
    
    // Dark Mode-Klasse zum HTML-Element hinzufügen
    document.documentElement.classList.add('dark-mode');
    
    // Dark Mode in localStorage speichern
    localStorage.setItem(this.STORAGE_KEY, 'true');
    
    // Dark Mode-spezifische Anpassungen
    this.updateUIForDarkMode();
    
    // Aktualisiere Checkbox, falls vorhanden
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.checked = true;
    }
    
    // Toast-Benachrichtigung anzeigen, wenn gewünscht
    if (showToast && window.app && window.app.toast) {
      window.app.toast.info('Dunkles Design aktiviert');
    }
  },
  
  /**
   * Deaktiviert den Dark Mode
   * @param {boolean} showToast Gibt an, ob eine Toast-Benachrichtigung angezeigt werden soll
   */
  disableDarkMode(showToast = true) {
    // Dark Mode inaktiv setzen
    this.isDarkMode = false;
    
    // Dark Mode-Klasse vom HTML-Element entfernen
    document.documentElement.classList.remove('dark-mode');
    
    // Dark Mode in localStorage speichern
    localStorage.setItem(this.STORAGE_KEY, 'false');
    
    // Light Mode-spezifische Anpassungen
    this.updateUIForLightMode();
    
    // Aktualisiere Checkbox, falls vorhanden
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.checked = false;
    }
    
    // Toast-Benachrichtigung anzeigen, wenn gewünscht
    if (showToast && window.app && window.app.toast) {
      window.app.toast.info('Helles Design aktiviert');
    }
  },
  
  /**
   * Wechselt zwischen Dark Mode und Light Mode
   */
  toggleDarkMode() {
    if (this.isDarkMode) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  },
  
  /**
   * Aktualisiert die UI für den Dark Mode
   */
  updateUIForDarkMode() {
    // Bootstrap-Klassen für Dark Mode anpassen
    document.querySelectorAll('.card').forEach(card => {
      card.classList.add('bg-dark');
      card.classList.add('text-light');
      card.classList.remove('bg-light');
      card.classList.remove('text-dark');
    });
    
    document.querySelectorAll('.btn-outline-secondary').forEach(btn => {
      btn.classList.add('btn-outline-light');
      btn.classList.remove('btn-outline-secondary');
    });
    
    document.querySelectorAll('.list-group-item').forEach(item => {
      item.classList.add('bg-dark');
      item.classList.add('text-light');
      item.classList.remove('bg-light');
      item.classList.remove('text-dark');
    });
    
    // Hauptcontainer mit Gradienten-Hintergrund versehen
    document.querySelectorAll('main.col-12.px-md-4').forEach(main => {
      main.style.background = 'rgb(0,0,0)';
      main.style.background = 'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(214,214,214,1) 100%)';
      
    });
    
    // Navbar anpassen
    const navbar = document.querySelector('.main-navbar');
    if (navbar) {
      navbar.classList.add('navbar-dark');
      navbar.classList.add('bg-dark');
      navbar.classList.remove('navbar-light');
      navbar.classList.remove('bg-light');
    }
    
    // Modal anpassen
    document.querySelectorAll('.modal-content').forEach(modal => {
      modal.classList.add('bg-dark');
      modal.classList.add('text-light');
    });
    
    // Input-Felder anpassen
    document.querySelectorAll('.form-control').forEach(input => {
      input.classList.add('bg-dark');
      input.classList.add('text-light');
      input.classList.add('border-secondary');
    });
    
    // Dark Mode Toggle Button anpassen
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      const iconElement = darkModeToggle.querySelector('i');
      if (iconElement) {
        iconElement.className = 'fas fa-sun';
      } else {
        // Falls kein i-Element vorhanden ist, eines erstellen
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
      darkModeToggle.title = 'In den hellen Modus wechseln';
    }
    
    // Setze dunkles Meta-Theme für Browser-UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#212529');
    }
  },
  
  /**
   * Aktualisiert die UI für den Light Mode
   */
  updateUIForLightMode() {
    // Bootstrap-Klassen für Light Mode anpassen
    document.querySelectorAll('.card').forEach(card => {
      card.classList.remove('bg-dark');
      card.classList.remove('text-light');
      card.classList.add('bg-light');
      card.classList.add('text-dark');
    });
    
    document.querySelectorAll('.btn-outline-light').forEach(btn => {
      btn.classList.remove('btn-outline-light');
      btn.classList.add('btn-outline-secondary');
    });
    
    document.querySelectorAll('.list-group-item').forEach(item => {
      item.classList.remove('bg-dark');
      item.classList.remove('text-light');
      item.classList.add('bg-light');
      item.classList.add('text-dark');
    });
    
    // Hauptcontainer zurücksetzen
    document.querySelectorAll('main.col-12.px-md-4').forEach(main => {
      main.style.background = '';
    });
    
    // Navbar anpassen
    const navbar = document.querySelector('.main-navbar');
    if (navbar) {
      navbar.classList.remove('navbar-dark');
      navbar.classList.remove('bg-dark');
      navbar.classList.add('navbar-light');
      navbar.classList.add('bg-light');
    }
    
    // Modal anpassen
    document.querySelectorAll('.modal-content').forEach(modal => {
      modal.classList.remove('bg-dark');
      modal.classList.remove('text-light');
    });
    
    // Input-Felder anpassen
    document.querySelectorAll('.form-control').forEach(input => {
      input.classList.remove('bg-dark');
      input.classList.remove('text-light');
      input.classList.remove('border-secondary');
    });
    
    // Dark Mode Toggle Button anpassen
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      const iconElement = darkModeToggle.querySelector('i');
      if (iconElement) {
        iconElement.className = 'fas fa-moon';
      } else {
        // Falls kein i-Element vorhanden ist, eines erstellen
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      }
      darkModeToggle.title = 'In den dunklen Modus wechseln';
    }
    
    // Setze helles Meta-Theme für Browser-UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#f8f9fa');
    }
  }
}; 