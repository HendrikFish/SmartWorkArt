/**
 * Bewohner-Karussell
 * Zeigt Bewohnerkarten in einem Karussell an:
 * - Desktop: 10 Karten pro Seite mit Navigationstasten bei Bedarf
 * - Mobil: 4 Karten mit horizontalem Wischen
 */

const BewohnerKarussell = (function() {
    // Konfiguration
    const CONFIG = {
        desktopCardsPerPage: 6,  // Desktop: 10 Karten pro Seite
        mobileCardsPerPage: 4,    // Mobil: 4 Karten pro Seite
        smallScreenCardsPerPage: 2, // Kleine Bildschirme: 2 Karten pro Seite
        mobileBreakpoint: 1000,
        smallScreenBreakpoint: 480
    };

    // Status
    let currentPage = 0;
    let totalPages = 0;
    let isMobileView = false;
    let touchStartX = 0;
    let touchEndX = 0;
    let container = null;
    let allCards = [];
    let resizeTimer = null;
    let mutationObserver = null;

    /**
     * Initialisiert das Karussell und richtet Eventlistener ein
     */
    function initialisiere() {
        // Bewohner-Container finden
        container = document.getElementById('bewohner-container');
        
        if (!container) {
            console.error('Bewohner-Container nicht gefunden!');
            return;
        }

        // CSS-Datei für das Karussell laden
        if (!document.querySelector('link[href*="karussell.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './css/karussell.css';
            document.head.appendChild(link);
        }
        
        // Prüfen, ob wir in der mobilen oder Desktop-Ansicht sind
        checkViewportSize();
        
        // Beobachter einrichten, um auf Änderungen im Container zu reagieren
        setupObserver();
        
        // Event Listener für Fenstergröße
        window.addEventListener('resize', handleResize);
    }

    /**
     * Prüft die Viewport-Größe und passt die Ansicht entsprechend an
     */
    function checkViewportSize() {
        const windowWidth = window.innerWidth;
        const oldIsMobileView = isMobileView;
        
        isMobileView = windowWidth <= CONFIG.mobileBreakpoint;
        
        // Wenn sich die Ansicht geändert hat, Karussell neu initialisieren
        if (oldIsMobileView !== isMobileView || !totalPages) {
            initKarussell();
        }
    }

    /**
     * Behandelt Änderungen der Fenstergröße
     */
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            checkViewportSize();
        }, 250);
    }

    /**
     * Richtet einen Beobachter für den Bewohner-Container ein
     */
    function setupObserver() {
        if (mutationObserver) {
            mutationObserver.disconnect();
        }
        
        // Debounce-Timer für MutationObserver
        let observerTimer = null;
        
        mutationObserver = new MutationObserver((mutations) => {
            // Debounce für bessere Performance
            clearTimeout(observerTimer);
            observerTimer = setTimeout(() => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' || 
                        (mutation.type === 'attributes' && mutation.attributeName === 'class')) {
                        initKarussell();
                        break;
                    }
                }
            }, 100);
        });
        
        mutationObserver.observe(container, { 
            childList: true, 
            attributes: true,
            subtree: true
        });
    }

    /**
     * Initialisiert das Karussell basierend auf der Anzahl der Karten
     */
    function initKarussell() {
        if (!container) return;
        
        // Alle Bewohnerkarten sammeln
        allCards = Array.from(container.querySelectorAll('.bewohner-card'));
        
        if (allCards.length === 0) return;
        
        const cardsPerPage = isMobileView ? 
            (window.innerWidth <= CONFIG.smallScreenBreakpoint ? 
                CONFIG.smallScreenCardsPerPage : 
                CONFIG.mobileCardsPerPage) : 
            CONFIG.desktopCardsPerPage;
        
        totalPages = Math.ceil(allCards.length / cardsPerPage);
        
        // Sicherstellen, dass die aktuelle Seite gültig ist
        if (currentPage >= totalPages) {
            currentPage = Math.max(0, totalPages - 1);
        }
        
        // Container-Klasse für Mobile anpassen
        if (isMobileView) {
            container.classList.add('mobile-karussell');
            
            // Alle Karten im Mobilmodus immer sichtbar machen
            allCards.forEach(card => {
                card.style.display = '';
            });
            
            initTouchEvents();
            
            // Swipe-Hinweis hinzufügen, falls noch nicht angezeigt
            if (!localStorage.getItem('swipeHintShown') && !document.querySelector('.swipe-hint')) {
                const swipeHint = document.createElement('div');
                swipeHint.className = 'swipe-hint';
                swipeHint.textContent = 'Nach links/rechts wischen für mehr Bewohner';
                container.parentNode.insertBefore(swipeHint, container);
                
                // Hinweis als angezeigt markieren
                localStorage.setItem('swipeHintShown', 'true');
                
                // Nach Animation entfernen
                setTimeout(() => {
                    if (swipeHint.parentNode) {
                        swipeHint.parentNode.removeChild(swipeHint);
                    }
                }, 5000);
            }
        } else {
            container.classList.remove('mobile-karussell');
        }
        
        // Navigationssteuerung anzeigen wenn nötig
        if (totalPages > 1) {
            if (!document.querySelector('.karussell-controls')) {
                createNavigationControls();
            } else {
                updateNavigationControls();
            }
        }
        
        // Aktuelle Seite anzeigen
        showPage(currentPage);
    }

    /**
     * Behandelt das Scroll-Event und markiert die aktive Karte
     */
    function handleScroll() {
        if (!isMobileView || !container) return;
        
        // Debounce für bessere Performance
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateActiveCard();
        }, 100);
    }

    /**
     * Aktualisiert die aktive Karte basierend auf der Scroll-Position
     */
    function updateActiveCard() {
        if (!isMobileView || allCards.length === 0) return;
        
        // Berechne das sichtbare Zentrum des Containers
        const containerLeft = container.scrollLeft;
        const containerWidth = container.offsetWidth;
        const visibleCenter = containerLeft + containerWidth / 2;
        
        // Ermittle den sichtbaren Bereich
        const visibleLeft = containerLeft;
        const visibleRight = containerLeft + containerWidth;
        
        // Entferne alle aktiven Klassen
        allCards.forEach(card => card.classList.remove('active'));
        
        // Finde die Karten im sichtbaren Bereich
        const visibleCards = allCards.filter(card => {
            const cardLeft = card.offsetLeft;
            const cardRight = cardLeft + card.offsetWidth;
            
            // Karte ist sichtbar, wenn ein Teil davon im sichtbaren Bereich ist
            return (cardRight > visibleLeft && cardLeft < visibleRight);
        });
        
        // Wenn wir vier Karten haben, markiere die erste als aktiv
        if (visibleCards.length >= 1) {
            visibleCards[0].classList.add('active');
            
            // Aktualisiere die aktuelle Seite basierend auf dem Index der ersten sichtbaren Karte
            const cardIndex = allCards.indexOf(visibleCards[0]);
            const cardsPerPage = isMobileView ? 
                (window.innerWidth <= CONFIG.smallScreenBreakpoint ? 
                    CONFIG.smallScreenCardsPerPage : 
                    CONFIG.mobileCardsPerPage) : 
                CONFIG.desktopCardsPerPage;
            
            const newPage = Math.floor(cardIndex / cardsPerPage);
            if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
                currentPage = newPage;
                updateNavigationControls();
            }
        }
    }

    /**
     * Zeigt die angegebene Seite von Karten an
     * @param {number} pageIndex - Index der anzuzeigenden Seite
     */
    function showPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= totalPages) return;
        
        currentPage = pageIndex;
        
        const cardsPerPage = isMobileView ? 
            (window.innerWidth <= CONFIG.smallScreenBreakpoint ? 
                CONFIG.smallScreenCardsPerPage : 
                CONFIG.mobileCardsPerPage) : 
            CONFIG.desktopCardsPerPage;
        
        // Wenn mobile Ansicht, scrolle zum Anfang der richtigen Karten
        if (isMobileView && allCards.length > 0) {
            const targetIndex = currentPage * cardsPerPage;
            if (targetIndex < allCards.length) {
                const targetCard = allCards[targetIndex];
                
                if (targetCard) {
                    // Einfaches und zuverlässiges Scrolling zur Zielkarte
                    container.scrollTo({
                        left: targetCard.offsetLeft,
                        behavior: 'smooth'
                    });
                    
                    // Alle Karten sichtbar machen im mobilen Modus
                    allCards.forEach(card => {
                        card.style.display = '';
                    });
                }
            }
        } else {
            // Für Desktop: Karten ein-/ausblenden
            allCards.forEach((card, index) => {
                const isOnCurrentPage = index >= currentPage * cardsPerPage && 
                                      index < (currentPage + 1) * cardsPerPage;
                
                card.style.display = isOnCurrentPage ? '' : 'none';
            });
        }
        
        // Navigationselemente aktualisieren
        updateNavigationControls();
    }

    /**
     * Erstellt Navigationselemente für das Karussell
     */
    function createNavigationControls() {
        const controls = document.createElement('div');
        controls.className = 'karussell-controls';
        
        // Zurück-Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'karussell-prev-btn';
        prevBtn.innerHTML = '&lsaquo;';
        prevBtn.setAttribute('aria-label', 'Vorherige Seite');
        prevBtn.addEventListener('click', () => showPage(currentPage - 1));
        
        // Seitenzahl-Anzeige
        const pageIndicator = document.createElement('div');
        pageIndicator.className = 'karussell-page-indicator';
        
        // Weiter-Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'karussell-next-btn';
        nextBtn.innerHTML = '&rsaquo;';
        nextBtn.setAttribute('aria-label', 'Nächste Seite');
        nextBtn.addEventListener('click', () => showPage(currentPage + 1));
        
        // Elemente zum DOM hinzufügen
        controls.appendChild(prevBtn);
        controls.appendChild(pageIndicator);
        controls.appendChild(nextBtn);
        
        // Nach dem Container einfügen
        container.parentNode.insertBefore(controls, container.nextSibling);
        
        // Status aktualisieren
        updateNavigationControls();
    }

    /**
     * Aktualisiert den Zustand der Navigationselemente
     */
    function updateNavigationControls() {
        const controls = document.querySelector('.karussell-controls');
        if (!controls) return;
        
        const prevBtn = controls.querySelector('.karussell-prev-btn');
        const nextBtn = controls.querySelector('.karussell-next-btn');
        const pageIndicator = controls.querySelector('.karussell-page-indicator');
        
        // Zurück-Button deaktivieren, wenn wir auf der ersten Seite sind
        if (prevBtn) {
            prevBtn.disabled = currentPage === 0;
        }
        
        // Weiter-Button deaktivieren, wenn wir auf der letzten Seite sind
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages - 1;
        }
        
        // Seitenzahl aktualisieren
        if (pageIndicator) {
            pageIndicator.textContent = `${currentPage + 1}/${totalPages}`;
        }
        
        // Steuerelemente ausblenden, wenn es nur eine Seite gibt
        controls.style.display = totalPages > 1 ? '' : 'none';
    }

    /**
     * Initialisiert Touch-Events für das Wischen auf Mobilgeräten
     */
    function initTouchEvents() {
        // Touch-Events entfernen, falls sie bereits existieren
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchmove', handleTouchMove);
        
        // Touch-Events hinzufügen
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        // Touchmove-Event hinzufügen für flüssigeres Verhalten
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
    }

    /**
     * Behandelt das Touchmove-Event
     * @param {TouchEvent} e - Das Touchmove-Event
     */
    function handleTouchMove(e) {
        // Nur die Position speichern, keine weiteren Aktionen während des Bewegens
        if (e.changedTouches && e.changedTouches.length > 0) {
            touchEndX = e.changedTouches[0].screenX;
        }
    }

    /**
     * Behandelt das Touchstart-Event
     * @param {TouchEvent} e - Das Touchstart-Event
     */
    function handleTouchStart(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
            touchStartX = e.changedTouches[0].screenX;
        }
    }

    /**
     * Behandelt das Touchend-Event
     * @param {TouchEvent} e - Das Touchend-Event
     */
    function handleTouchEnd(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
            touchEndX = e.changedTouches[0].screenX;
            
            // Verzögerung einbauen, um zu vermeiden, dass UI-Updates sich stapeln
            setTimeout(() => {
                handleSwipe();
            }, 10);
        }
    }

    /**
     * Verarbeitet Wischgesten
     */
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        // Überprüfen, ob der Swipe signifikant genug ist
        if (Math.abs(swipeDistance) < swipeThreshold) return;
        
        // Nach links gewischt (nächste Seite)
        if (swipeDistance < -swipeThreshold && currentPage < totalPages - 1) {
            // Verzögertes Update verwenden
            requestAnimationFrame(() => {
                showPage(currentPage + 1);
            });
        }
        
        // Nach rechts gewischt (vorherige Seite)
        if (swipeDistance > swipeThreshold && currentPage > 0) {
            // Verzögertes Update verwenden
            requestAnimationFrame(() => {
                showPage(currentPage - 1);
            });
        }
    }

    // Öffentliche API
    return {
        initialisiere: initialisiere,
        naechsteSeite: function() { showPage(currentPage + 1); },
        vorherigeSeite: function() { showPage(currentPage - 1); },
        geheZuSeite: showPage
    };
})();

// Automatisch initialisieren, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', function() {
    BewohnerKarussell.initialisiere();
}); 