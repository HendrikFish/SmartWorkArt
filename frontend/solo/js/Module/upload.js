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
        const cameraBtn = document.getElementById('openCameraBtn');
        const galleryBtn = document.getElementById('openGalleryBtn');
        
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => {
                Modal.hide('smartphoneOptionsModal');
                Modal.show('cameraModal');
                this.initializeCamera();
            }, { once: true });
        }
        
        if (galleryBtn) {
            galleryBtn.addEventListener('click', () => {
                Modal.hide('smartphoneOptionsModal');
                this.openFileDialog();
            }, { once: true });
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
            
            console.log(`Kamera initialisiert mit Modus: ${this.currentFacingMode}`);
            return stream;
        } catch (error) {
            console.error('Fehler beim Initialisieren der Kamera:', error);
            Toast.show('Fehler beim Zugriff auf die Kamera', 'error');
            return null;
        }
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

    async captureImage() {
        try {
            const video = document.getElementById('cameraPreview');
            const canvas = document.createElement('canvas');
            
            // Verwende die tatsächliche Auflösung des Video-Streams
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0);
            
            // Optimiere das Bild - erhöhe Kontrast und Helligkeit
            this.optimizeImage(canvas);
            
            // Zeige Lade-Overlay an
            this.showLoadingOverlay();
            
            return new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95); // Höhere Qualität für bessere OCR-Ergebnisse
            });
        } catch (error) {
            console.error('Fehler beim Erfassen des Bildes:', error);
            Toast.show('Fehler beim Erfassen des Bildes', 'error');
            this.hideLoadingOverlay();
            return null;
        }
    },
    
    optimizeImage(canvas) {
        try {
            const context = canvas.getContext('2d');
            
            // Lade die Pixel-Daten
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Parameter für die Optimierung
            const contrast = 1.3; // Höherer Wert = mehr Kontrast (1.0 = keine Änderung)
            const brightness = 15; // Wertebereich -255 bis 255
            
            // Anwenden von Kontrast und Helligkeit
            for (let i = 0; i < data.length; i += 4) {
                // Rot, Grün, Blau Kanäle
                for (let j = 0; j < 3; j++) {
                    // Kontrast anwenden
                    let value = data[i + j];
                    value = ((value / 255 - 0.5) * contrast + 0.5) * 255;
                    
                    // Helligkeit anwenden
                    value += brightness;
                    
                    // Werte auf 0-255 begrenzen
                    data[i + j] = Math.max(0, Math.min(255, value));
                }
                // Alpha-Kanal (i+3) bleibt unverändert
            }
            
            // Aktualisierte Daten zurück ins Canvas schreiben
            context.putImageData(imageData, 0, 0);
            
            console.log('Bild wurde optimiert: Kontrast und Helligkeit angepasst');
            return true;
        } catch (error) {
            console.error('Fehler bei der Bildoptimierung:', error);
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
        }
        
        // Zeige das Overlay an
        overlay.style.display = 'flex';
    },
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
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

    // Verarbeitung des aufgenommenen Bildes - jetzt identisch zur Desktop-Version
    async processImageFromCamera() {
        try {
            // Bild aufnehmen
            const imageBlob = await this.captureImage();
            if (!imageBlob) {
                Toast.show('Fehler beim Aufnehmen des Bildes', 'error');
                return;
            }
            
            // Modal schließen, da die Aufnahme erfolgreich war
            Modal.hide('cameraModal');
            
            // Erstelle einen File-Objekt aus dem Blob für eine einheitliche Verarbeitung
            const imageFile = new File([imageBlob], "kamera_aufnahme.jpg", {
                type: "image/jpeg",
                lastModified: new Date().getTime()
            });
            
            console.log('Bild erfolgreich aufgenommen und als File-Objekt formatiert');
            
            // Verarbeite das Bild genau wie in der Desktop-Version
            await OCRManager.processImage(imageFile);
            
            // Verstecke Lade-Overlay
            this.hideLoadingOverlay();
            
        } catch (error) {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
            Toast.show('Fehler bei der OCR-Verarbeitung', 'error');
            this.hideLoadingOverlay();
        }
    }
}; 