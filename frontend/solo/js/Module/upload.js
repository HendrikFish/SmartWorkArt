import { Toast } from './module.js';
import { OCRManager } from './ocr.js';
import { Modal } from './modal.js';

export const UploadManager = {
    // Kamera-Stream und aktuelle Kamera
    currentStream: null,
    currentFacingMode: 'environment', // 'user' für Frontkamera, 'environment' für Rückkamera (Standardeinstellung für Dokumente)

    // Initialisierung der Upload-Funktionen
    init() {
        // Button-Listener für mobilen Upload initialisieren
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                if (this.isMobileDevice()) {
                    // Auf Mobilgeräten: Auswahl zwischen Kamera und Galerie anzeigen
                    Modal.show('smartphoneOptionsModal');
                    
                    // Event-Listener für Optionen einrichten
                    this.setupMobileOptions();
                } else {
                    // Auf Desktop: Direkt Datei-Dialog öffnen
                    this.openFileDialog();
                }
            });
        }
    },
    
    // Richtet die Event-Listener für die mobilen Auswahloptionen ein
    setupMobileOptions() {
        // Entferne bestehende Event-Listener, um doppelte zu vermeiden
        const cameraBtn = document.getElementById('openCameraBtn');
        const galleryBtn = document.getElementById('openGalleryBtn');
        
        if (cameraBtn) {
            // Alten Event-Listener entfernen durch Klonen des Elements
            const newCameraBtn = cameraBtn.cloneNode(true);
            cameraBtn.parentNode.replaceChild(newCameraBtn, cameraBtn);
            
            // Neuen Event-Listener hinzufügen
            newCameraBtn.addEventListener('click', async () => {
                Modal.hide('smartphoneOptionsModal');
                // Kurze Verzögerung, damit das Modal vollständig geschlossen ist
                setTimeout(async () => {
                    Modal.show('cameraModal');
                    await this.initializeCamera();
                }, 100);
            });
        }
        
        if (galleryBtn) {
            // Alten Event-Listener entfernen durch Klonen des Elements
            const newGalleryBtn = galleryBtn.cloneNode(true);
            galleryBtn.parentNode.replaceChild(newGalleryBtn, galleryBtn);
            
            // Neuen Event-Listener hinzufügen
            newGalleryBtn.addEventListener('click', () => {
                Modal.hide('smartphoneOptionsModal');
                // Kurze Verzögerung, damit das Modal vollständig geschlossen ist
                setTimeout(() => {
                    this.openFileDialog();
                }, 100);
            });
        }
    },

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    isTabletDevice() {
        return /iPad|Android/i.test(navigator.userAgent) && !this.isMobileDevice();
    },

    async initializeCamera() {
        try {
            // Stoppt vorherigen Stream, falls vorhanden
            if (this.currentStream) {
                this.stopCamera(this.currentStream);
            }

            // Vollständig neue Buttons erstellen statt nur Inhalte zu leeren
            this.recreateCameraButtons();

            // Konfiguriere Kamera mit aktueller Ausrichtung und höchster verfügbarer Auflösung
            const constraints = { 
                video: { 
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('cameraPreview');
            if (video) {
                video.srcObject = stream;
                
                // Warte, bis das Video geladen ist
                await new Promise(resolve => {
                    video.onloadedmetadata = () => {
                        resolve();
                    };
                });
                
                video.play();
            }
            
            // Speichere Stream für spätere Referenz
            this.currentStream = stream;
            
            // Optimiere Vollbildmodus auf Mobilgeräten
            this.optimizeForMobile();
            
            // Füge Event-Listener für die Kamera-Steuerelemente hinzu
            this.addCameraControlsListeners();
            
            console.log(`Kamera initialisiert mit Modus: ${this.currentFacingMode}`);
            return stream;
        } catch (error) {
            console.error('Fehler beim Initialisieren der Kamera:', error);
            Toast.show('Fehler beim Zugriff auf die Kamera', 'error');
            return null;
        }
    },

    // Neue Methode zum vollständigen Neuerstellen der Kamera-Buttons
    recreateCameraButtons() {
        const container = document.querySelector('.camera-controls');
        if (!container) return;

        // Rechteckige Buttons mit Schwarz-Weiß-Symbolen
        container.innerHTML = `
            <button type="button" id="captureBtn" class="camera-control-btn">
                <span style="font-size: 18px; color: #000;">⬤</span>
            </button>
            <button type="button" id="switchCameraBtn" class="camera-control-btn">
                <span style="font-size: 18px; color: #000;">↻</span>
            </button>
        `;
        
        // Verbessere die Button-Styles direkt
        const captureBtn = document.getElementById('captureBtn');
        const switchBtn = document.getElementById('switchCameraBtn');
        
        if (captureBtn) {
            // Stil für den Aufnahme-Button (rechteckig)
            captureBtn.style.width = '80px';
            captureBtn.style.height = '50px';
            captureBtn.style.borderRadius = '8px';
            captureBtn.style.backgroundColor = '#ffffff';
            captureBtn.style.border = '2px solid #3b82f6';
            captureBtn.style.cursor = 'pointer';
            captureBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            captureBtn.style.display = 'flex';
            captureBtn.style.alignItems = 'center';
            captureBtn.style.justifyContent = 'center';
            captureBtn.style.transition = 'all 0.2s ease';
            
            // Hover-Effekt manuell hinzufügen
            captureBtn.addEventListener('mouseover', () => {
                captureBtn.style.backgroundColor = '#f0f9ff';
                captureBtn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
            });
            
            captureBtn.addEventListener('mouseout', () => {
                captureBtn.style.backgroundColor = '#ffffff';
                captureBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            });
            
            captureBtn.addEventListener('mousedown', () => {
                captureBtn.style.transform = 'translateY(2px)';
                captureBtn.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
            });
            
            captureBtn.addEventListener('mouseup', () => {
                captureBtn.style.transform = 'translateY(0)';
                captureBtn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
            });
        }
        
        if (switchBtn) {
            // Stil für den Wechsel-Button (rechteckig)
            switchBtn.style.width = '60px';
            switchBtn.style.height = '50px';
            switchBtn.style.borderRadius = '8px';
            switchBtn.style.backgroundColor = '#ffffff';
            switchBtn.style.border = '2px solid #64748b';
            switchBtn.style.cursor = 'pointer';
            switchBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            switchBtn.style.display = 'flex';
            switchBtn.style.alignItems = 'center';
            switchBtn.style.justifyContent = 'center';
            switchBtn.style.transition = 'all 0.2s ease';
            
            // Hover-Effekt manuell hinzufügen
            switchBtn.addEventListener('mouseover', () => {
                switchBtn.style.backgroundColor = '#f8fafc';
                switchBtn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
            });
            
            switchBtn.addEventListener('mouseout', () => {
                switchBtn.style.backgroundColor = '#ffffff';
                switchBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            });
            
            switchBtn.addEventListener('mousedown', () => {
                switchBtn.style.transform = 'translateY(2px)';
                switchBtn.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
            });
            
            switchBtn.addEventListener('mouseup', () => {
                switchBtn.style.transform = 'translateY(0)';
                switchBtn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
            });
        }
        
        console.log('Kamera-Buttons wurden mit rechteckigem Design und Schwarz-Weiß-Symbolen neu erstellt');
    },

    optimizeForMobile() {
        if (this.isMobileDevice()) {
            // Vollbild für Kamera-Vorschau aktivieren
            try {
                const modal = document.getElementById('cameraModal');
                
                // Überlappende Elemente in der Navbar und Footer vermeiden
                const metaViewport = document.querySelector('meta[name="viewport"]');
                if (metaViewport) {
                    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
                
                // Füge Überschrift hinzu, falls noch nicht vorhanden
                if (!document.querySelector('.camera-hint')) {
                    const hint = document.createElement('div');
                    hint.className = 'camera-hint';
                    hint.textContent = 'Dokument fotografieren';
                    
                    const container = document.querySelector('.camera-container');
                    if (container) {
                        container.appendChild(hint);
                    }
                }
                
                // Hinweis nach 3 Sekunden ausblenden (zur Sicherheit, falls CSS-Animation nicht funktioniert)
                setTimeout(() => {
                    const hint = document.querySelector('.camera-hint');
                    if (hint) {
                        hint.style.opacity = '0';
                        hint.style.visibility = 'hidden';
                    }
                }, 3000);
            } catch (error) {
                console.error('Fehler bei der Mobile-Optimierung:', error);
            }
        }
    },

    stopCamera(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    },

    async switchCamera() {
        try {
            // Wechsle zwischen Front- und Rückkamera
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
            console.log(`Wechsel Kamera zu: ${this.currentFacingMode}`);
            
            // Initialisiere Kamera neu mit neuer Ausrichtung
            await this.initializeCamera();
            
            Toast.show(`Kamera gewechselt`, 'info', 1000);
        } catch (error) {
            console.error('Fehler beim Wechseln der Kamera:', error);
            Toast.show('Fehler beim Wechseln der Kamera', 'error');
        }
    },

    // Optimiere und erfasse ein Bild von der Kamera
    async captureImage() {
        try {
            // Prüfe, ob die Kamera aktiv ist
            const video = document.getElementById('cameraPreview');
            if (!video || !video.srcObject) {
                throw new Error('Kamera ist nicht aktiv');
            }
            
            console.log('Erfasse Bild von Kamera...');
            
            // Erstelle ein Canvas, um das Bild zu erfassen
            const canvas = document.createElement('canvas');
            // Verwende die innere Größe des Videos (natürliche Größe)
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            
            // Setze Canvas-Größe auf die Videogröße
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            
            console.log(`Bild wird in Originalgröße erfasst: ${videoWidth}x${videoHeight}`);
            
            // Zeichne das aktuelle Videobild auf das Canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, videoWidth, videoHeight);
            
            // Optimiere das Bild für die OCR
            this.enhanceImageForOCR(canvas, context);
            
            // Konvertiere Canvas zu Blob/File
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            
            console.log('Bild erfolgreich erfasst:', blob.size, 'Bytes');
            return blob;
        } catch (error) {
            console.error('Fehler beim Erfassen des Bildes:', error);
            Toast.show('Fehler beim Erfassen des Bildes', 'error', 5000);
            return null;
        }
    },
    
    // Verbessere die Bildqualität für die OCR
    enhanceImageForOCR(canvas, context) {
        try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            console.log('Verbessere Bild für OCR...');
            
            // Parameter für die Bildverbesserung
            const contrast = 1.4;   // Erhöhter Kontrast für bessere Texterkennung
            const brightness = 10;  // Leicht erhöhte Helligkeit
            const threshold = 120;  // Schwellwert für Binarisierung (0-255)
            
            // Verbessere Kontrast und Helligkeit
            for (let i = 0; i < data.length; i += 4) {
                // Kontrast und Helligkeit anpassen
                data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
                data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
                data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));
                
                // Optional: Binarisierung für Text
                // Konvertiere zu Graustufe und wende Schwellwert an
                const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (gray > threshold) {
                    data[i] = data[i + 1] = data[i + 2] = 255; // Weiß
                } else {
                    data[i] = data[i + 1] = data[i + 2] = 0;   // Schwarz
                }
            }
            
            // Aktualisiere das Canvas mit den verbesserten Daten
            context.putImageData(imageData, 0, 0);
            
            console.log('Bild wurde optimiert: Kontrast und Helligkeit angepasst');
            return true;
        } catch (error) {
            console.error('Fehler bei der Bildverbesserung:', error);
            return false;
        }
    },

    showLoadingOverlay() {
        // Erstelle Lade-Overlay, falls noch nicht vorhanden
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Text wird erkannt...</div>
            `;
            document.body.appendChild(overlay);
        } else {
            // Aktualisiere den Text, falls das Overlay bereits existiert
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = 'Text wird erkannt...';
            }
        }
        
        // Stelle sicher, dass das Overlay im Vordergrund angezeigt wird
        overlay.style.zIndex = '9999';
        
        // Zeige das Overlay an
        overlay.style.display = 'flex';
        console.log('Lade-Overlay angezeigt');
    },
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            // Entferne das Overlay vollständig, statt es nur auszublenden
            try {
                overlay.remove();
                console.log('Lade-Overlay entfernt');
            } catch (error) {
                console.error('Fehler beim Entfernen des Lade-Overlays:', error);
                // Fallback: Ausblenden
                overlay.style.display = 'none';
            }
        }
    },

    validateFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            Toast.show('Nur Bilder im Format JPG oder PNG sind erlaubt', 'error');
            return false;
        }

        if (file.size > maxSize) {
            Toast.show('Die Datei darf nicht größer als 10MB sein', 'error');
            return false;
        }

        return true;
    },

    createFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        return input;
    },
    
    async openFileDialog() {
        try {
            console.log('Öffne Datei-Dialog');
            const input = this.createFileInput();
            
            input.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file && this.validateFile(file)) {
                    try {
                        // Zeige Lade-Overlay an
                        this.showLoadingOverlay();
                        
                        // Verarbeite das Bild mit OCRManager
                        await OCRManager.processImage(file);
                        
                        // Verstecke Lade-Overlay
                        this.hideLoadingOverlay();
                    } catch (error) {
                        console.error('Fehler bei der Bildverarbeitung:', error);
                        Toast.show('Fehler bei der Bildverarbeitung', 'error');
                        this.hideLoadingOverlay();
                    }
                }
                
                // Entferne das Input-Element nach der Verarbeitung
                document.body.removeChild(input);
            });
            
            // Löse den Klick aus, um den Datei-Dialog zu öffnen
            input.click();
        } catch (error) {
            console.error('Fehler beim Öffnen des Datei-Dialogs:', error);
            Toast.show('Fehler beim Öffnen des Datei-Dialogs', 'error');
            this.hideLoadingOverlay();
        }
    },

    // Verarbeitung des aufgenommenen Bildes
    async processImageFromCamera() {
        try {
            // Stoppe die Kamera und räume auf
            if (this.currentStream) {
                this.stopCamera(this.currentStream);
                this.currentStream = null;
            }
            
            // Modal schließen, da die Aufnahme erfolgreich war
            Modal.hide('cameraModal');
            
            // Explizit Ladebildschirm anzeigen bevor wir das Bild aufnehmen
            this.showLoadingOverlay();
            
            // Toast anzeigen, dass die Auswertung läuft
            Toast.show('Auswertung läuft...', 'info', 5000);
            
            // Bild aufnehmen
            const imageBlob = await this.captureImage();
            if (!imageBlob) {
                Toast.show('Fehler beim Aufnehmen des Bildes', 'error', 5000);
                this.hideLoadingOverlay();
                return;
            }
            
            // Erstelle einen File-Objekt aus dem Blob für eine einheitliche Verarbeitung
            const imageFile = new File([imageBlob], "kamera_aufnahme.jpg", {
                type: "image/jpeg",
                lastModified: new Date().getTime()
            });
            
            console.log('Bild erfolgreich aufgenommen und als File-Objekt formatiert');
            
            // Stelle sicher, dass der Ladebildschirm sichtbar ist
            this.showLoadingOverlay();
            
            // Verarbeite das Bild genau wie in der Desktop-Version
            await OCRManager.processImage(imageFile);
            
            // Ladebildschirm nach dem OCR-Prozess ausblenden (als Fallback)
            // Dies sollte normalerweise bereits im OCR-Manager passieren
            setTimeout(() => {
                this.hideLoadingOverlay();
            }, 500);
            
        } catch (error) {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
            Toast.show('Fehler bei der OCR-Verarbeitung', 'error', 5000);
            this.hideLoadingOverlay();
        }
    },

    // Fügt Event-Listener für die Kamera-Steuerelemente hinzu
    addCameraControlsListeners() {
        // Listener für den Aufnahme-Button
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            // Alten Event-Listener entfernen
            const newCaptureBtn = captureBtn.cloneNode(true);
            captureBtn.parentNode.replaceChild(newCaptureBtn, captureBtn);
            
            // Neuen Event-Listener hinzufügen
            newCaptureBtn.addEventListener('click', () => {
                this.processImageFromCamera();
            });
        }
        
        // Listener für den Kamera-Wechsel-Button
        const switchCameraBtn = document.getElementById('switchCameraBtn');
        if (switchCameraBtn) {
            // Alten Event-Listener entfernen
            const newSwitchBtn = switchCameraBtn.cloneNode(true);
            switchCameraBtn.parentNode.replaceChild(newSwitchBtn, switchCameraBtn);
            
            // Neuen Event-Listener hinzufügen
            newSwitchBtn.addEventListener('click', () => {
                this.switchCamera();
            });
        }
    }
}; 