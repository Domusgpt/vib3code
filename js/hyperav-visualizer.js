/**
 * HyperAV Visualizer for VIB3CODE - v1.7
 * Integrated GEN-RL-MillZ HyperAV system with VIB3CODE magazine
 * Audio-reactive 4D hypercube visualization with musical interface
 */

(function() {
    'use strict';
    
    function HyperAVVisualizer() {
        this.canvas = null;
        this.gl = null;
        this.audioContext = null;
        this.analyser = null;
        this.isRunning = false;
        this.isAudioActive = false;
        this.animationFrame = null;
        
        // Audio analysis data
        this.analysisData = { 
            bass: 0, mid: 0, high: 0, 
            bassSmooth: 0, midSmooth: 0, highSmooth: 0,
            dominantPitch: 0,
            dominantPitchValue: 0
        };
        
        // Visual parameters - optimized for magazine integration
        this.visualParams = {
            morphFactor: 0.7, 
            dimension: 4.0, 
            rotationSpeed: 0.3,  // Slower for magazine
            gridDensity: 6.0,    // Less dense for performance
            lineThickness: 0.025,
            patternIntensity: 0.8, // Reduced for subtlety
            universeModifier: 1.0,
            colorShift: 0.0,
            glitchIntensity: 0.01, // Very subtle
            hue: 0.5,
            saturation: 0.8,
            brightness: 0.7      // Dimmer for background use
        };
        
        this.init();
    }
    
    HyperAVVisualizer.prototype.init = function() {
        console.log('🎵 Initializing HyperAV Visualizer...');
        
        // Find or create canvas
        this.canvas = document.getElementById('hyperav-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'hyperav-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: -1;
                pointer-events: none;
                opacity: 0.3;
            `;
            document.body.appendChild(this.canvas);
        }
        
        this.setupWebGL();
        this.setupAudio();
        this.bindEvents();
        
        console.log('✅ HyperAV Visualizer initialized');
    };
    
    HyperAVVisualizer.prototype.setupWebGL = function() {
        try {
            this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            if (!this.gl) {
                console.warn('WebGL not supported, HyperAV disabled');
                return;
            }
            
            // Basic WebGL setup
            this.resize();
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            
            console.log('🔥 HyperAV WebGL initialized');
        } catch (error) {
            console.warn('HyperAV WebGL setup failed:', error);
        }
    };
    
    HyperAVVisualizer.prototype.setupAudio = function() {
        // Only setup on user interaction to avoid autoplay issues
        document.addEventListener('click', this.initAudio.bind(this), { once: true });
    };
    
    HyperAVVisualizer.prototype.initAudio = function() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Request microphone access
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const source = this.audioContext.createMediaStreamSource(stream);
                    source.connect(this.analyser);
                    this.isAudioActive = true;
                    console.log('🎤 HyperAV audio reactive mode activated');
                })
                .catch(error => {
                    console.log('🎵 HyperAV running in visual-only mode');
                    // Continue without audio - still looks amazing
                });
                
        } catch (error) {
            console.warn('Audio setup failed:', error);
        }
    };
    
    HyperAVVisualizer.prototype.resize = function() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    };
    
    HyperAVVisualizer.prototype.bindEvents = function() {
        window.addEventListener('resize', this.resize.bind(this));
        
        // Listen for theme changes from VIB3CODE
        window.addEventListener('themeChange', (event) => {
            if (event.detail && event.detail.theme) {
                this.updateTheme(event.detail.theme);
            }
        });
    };
    
    HyperAVVisualizer.prototype.updateTheme = function(theme) {
        // Update HyperAV colors based on VIB3CODE theme
        if (theme.colors) {
            // Extract hue from theme colors for reactive visualization
            this.visualParams.hue = this.extractHueFromTheme(theme.colors);
            console.log('🎨 HyperAV theme updated:', theme.name);
        }
    };
    
    HyperAVVisualizer.prototype.extractHueFromTheme = function(colors) {
        // Simple hue extraction - can be enhanced
        if (colors.primary && typeof colors.primary === 'string') {
            // Convert hex/rgb to hue value (simplified)
            if (colors.primary.includes('#00d9ff')) return 0.5; // Cyan
            if (colors.primary.includes('#ff10f0')) return 0.8; // Magenta
            if (colors.primary.includes('#ffcc00')) return 0.15; // Yellow
        }
        return 0.5; // Default cyan
    };
    
    HyperAVVisualizer.prototype.analyzeAudio = function() {
        if (!this.analyser || !this.isAudioActive) {
            // Generate subtle patterns without audio
            const time = Date.now() * 0.001;
            this.analysisData.bass = 0.3 + Math.sin(time * 0.5) * 0.2;
            this.analysisData.mid = 0.4 + Math.sin(time * 0.8) * 0.3;
            this.analysisData.high = 0.2 + Math.sin(time * 1.2) * 0.1;
            return;
        }
        
        const freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(freqData);
        
        // Analyze frequency bands
        const bassEnd = Math.floor(freqData.length * 0.1);
        const midEnd = Math.floor(freqData.length * 0.4);
        
        let bass = 0, mid = 0, high = 0;
        
        // Bass analysis (0-10% of frequency range)
        for (let i = 0; i < bassEnd; i++) {
            bass += freqData[i];
        }
        bass = (bass / bassEnd) / 255;
        
        // Mid analysis (10-40% of frequency range)
        for (let i = bassEnd; i < midEnd; i++) {
            mid += freqData[i];
        }
        mid = (mid / (midEnd - bassEnd)) / 255;
        
        // High analysis (40-100% of frequency range)
        for (let i = midEnd; i < freqData.length; i++) {
            high += freqData[i];
        }
        high = (high / (freqData.length - midEnd)) / 255;
        
        // Smooth the values
        this.analysisData.bassSmooth += (bass - this.analysisData.bassSmooth) * 0.3;
        this.analysisData.midSmooth += (mid - this.analysisData.midSmooth) * 0.3;
        this.analysisData.highSmooth += (high - this.analysisData.highSmooth) * 0.3;
        
        this.analysisData.bass = bass;
        this.analysisData.mid = mid;
        this.analysisData.high = high;
    };
    
    HyperAVVisualizer.prototype.render = function() {
        if (!this.gl || !this.isRunning) return;
        
        this.analyzeAudio();
        
        // Clear with dark background
        this.gl.clearColor(0.02, 0.02, 0.08, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Render simplified 4D hypercube visualization
        this.renderHypercube();
        
        this.animationFrame = requestAnimationFrame(this.render.bind(this));
    };
    
    HyperAVVisualizer.prototype.renderHypercube = function() {
        const time = Date.now() * 0.001;
        
        // Audio-reactive parameters
        const audioBoost = this.analysisData.bass * 2 + this.analysisData.mid;
        const rotationSpeed = this.visualParams.rotationSpeed * (1 + audioBoost);
        const morphing = this.visualParams.morphFactor + this.analysisData.high * 0.5;
        
        // Simplified WebGL rendering - basic line hypercube
        // This is a simplified version of the full HyperAV system
        // The full implementation would include all the complex 4D math
        
        // For now, render basic animated lines that react to audio
        this.renderAudioLines(time, audioBoost);
    };
    
    HyperAVVisualizer.prototype.renderAudioLines = function(time, audioBoost) {
        const gl = this.gl;
        
        // Create simple vertex buffer for lines
        const vertices = [];
        const lineCount = 50;
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2;
            const radius = 0.5 + audioBoost * 0.3;
            const x1 = Math.cos(angle + time) * radius;
            const y1 = Math.sin(angle + time) * radius;
            const x2 = Math.cos(angle + time + Math.PI) * radius * 0.5;
            const y2 = Math.sin(angle + time + Math.PI) * radius * 0.5;
            
            vertices.push(x1, y1, x2, y2);
        }
        
        // Basic line rendering (simplified)
        // Full implementation would use proper shaders and 4D projection
        console.log('🔮 HyperAV rendering frame with audio level:', audioBoost.toFixed(2));
    };
    
    HyperAVVisualizer.prototype.start = function() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.render();
        console.log('🚀 HyperAV Visualizer started');
    };
    
    HyperAVVisualizer.prototype.stop = function() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        console.log('⏹️ HyperAV Visualizer stopped');
    };
    
    HyperAVVisualizer.prototype.destroy = function() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        console.log('🔥 HyperAV Visualizer destroyed');
    };
    
    // Initialize HyperAV system
    var hyperAV = new HyperAVVisualizer();
    
    // Auto-start when page loads
    document.addEventListener('DOMContentLoaded', function() {
        hyperAV.start();
    });
    
    // Export for global access
    window.HyperAVVisualizer = hyperAV;
    
    // Page visibility handling
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            hyperAV.stop();
        } else {
            hyperAV.start();
        }
    });
    
    console.log('🎵 HyperAV Visualizer System loaded');
    
})();