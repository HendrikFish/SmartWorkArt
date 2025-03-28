// Modal-Verwaltung
export const Modal = {
    activeModals: [],

    show: (modalId) => {
        try {
            Modal.hideAll();
            const modal = document.getElementById(modalId);
            if (modal) {
                console.log('Zeige Modal an:', modalId);
                
                // Setze display zunächst auf flex
                modal.style.display = 'flex';
                
                // Überprüfe sofort, ob das Modal korrekt angezeigt wird
                console.log('Modal display-Status:', modal.style.display);
                
                // Füge die show-Klasse mit einem kleinen Verzug hinzu
                setTimeout(() => {
                    modal.classList.add('show');
                    console.log('Modal-Klasse hinzugefügt:', modal.classList.contains('show'));
                    
                    // Neu: Initialisiere alle Close-Buttons im Modal
                    const closeButtons = modal.querySelectorAll('.close-modal');
                    closeButtons.forEach(btn => {
                        // Clone den Button, um alte Event-Listener zu entfernen
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                        
                        // Füge den neuen Event-Listener hinzu
                        newBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Schließen-Button in Modal geklickt:', modalId);
                            Modal.hide(modalId);
                        });
                        
                        console.log('Schließen-Button-Listener hinzugefügt:', modalId);
                    });
                    
                    // Spezielle Behandlung für die Bewohnerformulare
                    if (modalId === 'newResidentForm') {
                        console.log('Neuer Bewohner Form angezeigt - überprüfe Event-Listener');
                        
                        // Starte ein kurzes Timeout, um sicherzustellen, dass alle DOM-Elemente bereit sind
                        setTimeout(() => {
                            // Überprüfe, ob die Buttons klickbar sind
                            const areaButtons = modal.querySelectorAll('.area-button');
                            console.log(`${areaButtons.length} Bereichs-Buttons gefunden`);
                            
                            if (areaButtons.length > 0) {
                                // Stelle sicher, dass alle Buttons klickbar sind
                                areaButtons.forEach(btn => {
                                    // Event-Listener-Debugging
                                    const clone = btn.cloneNode(true);
                                    btn.parentNode.replaceChild(clone, btn);
                                    
                                    clone.addEventListener('click', function() {
                                        console.log('Button geklickt:', this.dataset.area, this.dataset.value || this.dataset.gender);
                                        
                                        const buttonGroup = this.closest('.area-buttons');
                                        const isMultiple = buttonGroup?.dataset.multiple === 'true';
                                        
                                        if (isMultiple) {
                                            this.classList.toggle('active');
                                        } else {
                                            // Entferne 'active' von allen Buttons in der Gruppe
                                            buttonGroup.querySelectorAll('.area-button').forEach(b => 
                                                b.classList.remove('active'));
                                            this.classList.add('active');
                                        }
                                        
                                        // Aktualisiere das versteckte Eingabefeld
                                        const areaName = this.dataset.area;
                                        const gender = this.dataset.gender;
                                        
                                        if (gender) {
                                            const hiddenInput = document.getElementById('gender');
                                            if (hiddenInput) hiddenInput.value = gender;
                                        } else if (areaName) {
                                            const hiddenInput = document.getElementById(`area_${areaName}`);
                                            if (hiddenInput) {
                                                if (isMultiple) {
                                                    const activeButtons = Array.from(buttonGroup.querySelectorAll('.area-button.active'))
                                                        .map(activeBtn => activeBtn.dataset.value);
                                                    hiddenInput.value = activeButtons.join(',');
                                                } else {
                                                    hiddenInput.value = this.dataset.value;
                                                }
                                            }
                                        }
                                    });
                                });
                                
                                console.log('Event-Listener für Bereichs-Buttons im Modal wurden neu hinzugefügt');
                            }
                        }, 100);
                    }
                }, 10);
                
                Modal.activeModals.push(modalId);
                document.body.style.overflow = 'hidden';
            } else {
                console.error('Modal nicht gefunden:', modalId);
            }
        } catch (error) {
            console.error('Fehler beim Anzeigen des Modals:', error);
        }
    },

    hide: (modalId) => {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                console.log('Verstecke Modal:', modalId);
                modal.classList.remove('show');
                
                // Timeout für die Übergangsanimation
                setTimeout(() => {
                    modal.style.display = 'none';
                    console.log('Modal verborgen:', modalId);
                }, 300);
                
                // Entferne aus der Liste der aktiven Modals
                Modal.activeModals = Modal.activeModals.filter(id => id !== modalId);
                
                // Setze overflow zurück, wenn keine Modals mehr aktiv sind
                if (Modal.activeModals.length === 0) {
                    document.body.style.overflow = '';
                }
            }
        } catch (error) {
            console.error('Fehler beim Verstecken des Modals:', error);
        }
    },

    hideAll: () => {
        try {
            console.log('Verstecke alle Modals');
            Modal.activeModals.forEach(modalId => {
                Modal.hide(modalId);
            });
            Modal.activeModals = [];
            document.body.style.overflow = '';
        } catch (error) {
            console.error('Fehler beim Verstecken aller Modals:', error);
        }
    },

    init: () => {
        try {
            console.log('Initialisiere Modal-System...');
            
            // Funktion zur Initialisierung von Schließen-Buttons
            const initCloseButtons = () => {
                // Event-Listener für die Schließen-Buttons
                document.querySelectorAll('.close-modal').forEach(btn => {
                    // Clone den Button, um alte Event-Listener zu entfernen
                    const newBtn = btn.cloneNode(true);
                    btn.parentNode.replaceChild(newBtn, btn);
                    
                    // Füge den neuen Event-Listener hinzu
                    newBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Schließen-Button geklickt');
                        const modal = this.closest('.modal');
                        if (modal && modal.id) {
                            console.log('Schließe Modal:', modal.id);
                            Modal.hide(modal.id);
                        } else {
                            console.log('Kein Modal gefunden, verstecke alle');
                            Modal.hideAll();
                        }
                    });
                });
                
                console.log('Schließen-Button-Listener initialisiert');
            };
            
            // Initialisiere Schließen-Buttons beim Start
            initCloseButtons();
            
            // Event-Listener für Klicks außerhalb des Modals
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(event) {
                    if (event.target === this) {
                        Modal.hide(this.id);
                    }
                });
            });
            
            // Füge einen Event-Listener zum Dokument hinzu, der dynamisch hinzugefügte Buttons behandelt
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1 && node.classList && node.classList.contains('close-modal')) {
                                console.log('Neuer Schließen-Button erkannt:', node);
                                node.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    const modal = this.closest('.modal');
                                    if (modal && modal.id) {
                                        console.log('Schließe Modal (dynamisch):', modal.id);
                                        Modal.hide(modal.id);
                                    } else {
                                        Modal.hideAll();
                                    }
                                });
                            }
                        });
                    }
                });
            });
            
            // Observer starten
            observer.observe(document.body, { 
                childList: true,
                subtree: true
            });
            
            // Escape-Taste zum Schließen von Modals
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && Modal.activeModals.length > 0) {
                    const lastModalId = Modal.activeModals[Modal.activeModals.length - 1];
                    Modal.hide(lastModalId);
                }
            });
            
            console.log('Modal-Event-Listener vollständig initialisiert');
        } catch (error) {
            console.error('Fehler beim Initialisieren der Modal-Event-Listener:', error);
        }
    }
};
