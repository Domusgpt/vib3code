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
        
        this.analysisData = { 
            bass: 0, mid: 0, high: 0, 
            bassSmooth: 0, midSmooth: 0, highSmooth: 0,
            dominantPitch: 0,
            dominantPitchValue: 0
        };
        
        this.visualParams = {
            morphFactor: 0.7, 
            dimension: 4.0, 
            rotationSpeed: 0.3,
            gridDensity: 6.0,
            lineThickness: 0.025,
            patternIntensity: 0.8,
            universeModifier: 1.0,
            colorShift: 0.0,
            glitchIntensity: 0.01,
            hue: 0.5,
            saturation: 0.8,
            brightness: 0.7
        };
        
        this.init();
    }
    
    HyperAVVisualizer.prototype.init = function() {
        console.log('🎵 Initializing HyperAV Visualizer...');
        
        this.canvas = document.getElementById('hyperav-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'hyperav-canvas';
            this.canvas.style.cssText =
                'position: fixed;' +
                'top: 0;' +
                'left: 0;' +
                'width: 100vw;' +
                'height: 100vh;' +
                'z-index: -1;' +
                'pointer-events: none;' +
                'opacity: 0.3;';
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
        document.addEventListener('click', this.initAudio.bind(this), { once: true });
    };
    
    HyperAVVisualizer.prototype.initAudio = function() {
        var self = this;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(stream) {
                    var source = self.audioContext.createMediaStreamSource(stream); // Converted
                    source.connect(self.analyser);
                    self.isAudioActive = true;
                    console.log('🎤 HyperAV audio reactive mode activated');
                })
                .catch(function(error) {
                    console.log('🎵 HyperAV running in visual-only mode');
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
        var self = this;
        window.addEventListener('resize', this.resize.bind(this));
        
        window.addEventListener('themeChange', function(event) {
            if (event.detail && event.detail.theme) {
                self.updateTheme(event.detail.theme);
            }
        });
    };
    
    HyperAVVisualizer.prototype.updateTheme = function(theme) {
        if (theme.colors) {
            this.visualParams.hue = this.extractHueFromTheme(theme.colors);
            console.log('🎨 HyperAV theme updated:', theme.name);
        }
    };
    
    HyperAVVisualizer.prototype.extractHueFromTheme = function(colors) {
        if (colors.primary && typeof colors.primary === 'string') {
            if (colors.primary.includes('#00d9ff')) return 0.5;
            if (colors.primary.includes('#ff10f0')) return 0.8;
            if (colors.primary.includes('#ffcc00')) return 0.15;
        }
        return 0.5;
    };
    
    HyperAVVisualizer.prototype.analyzeAudio = function() {
        if (!this.analyser || !this.isAudioActive) {
            var time = Date.now() * 0.001; // Converted
            this.analysisData.bass = 0.3 + Math.sin(time * 0.5) * 0.2;
            this.analysisData.mid = 0.4 + Math.sin(time * 0.8) * 0.3;
            this.analysisData.high = 0.2 + Math.sin(time * 1.2) * 0.1;
            return;
        }
        
        var freqData = new Uint8Array(this.analyser.frequencyBinCount); // Converted
        this.analyser.getByteFrequencyData(freqData);
        
        var bassEnd = Math.floor(freqData.length * 0.1); // Converted
        var midEnd = Math.floor(freqData.length * 0.4); // Converted
        
        var bass = 0, mid = 0, high = 0; // Converted let to var
        
        for (var i = 0; i < bassEnd; i++) { // Converted let to var
            bass += freqData[i];
        }
        bass = (bass / bassEnd) / 255;
        
        for (var i = bassEnd; i < midEnd; i++) { // Converted let to var
            mid += freqData[i];
        }
        mid = (mid / (midEnd - bassEnd)) / 255;
        
        for (var i = midEnd; i < freqData.length; i++) { // Converted let to var
            high += freqData[i];
        }
        high = (high / (freqData.length - midEnd)) / 255;
        
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
        
        this.gl.clearColor(0.02, 0.02, 0.08, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.renderHypercube();
        
        this.animationFrame = requestAnimationFrame(this.render.bind(this));
    };
    
    HyperAVVisualizer.prototype.renderHypercube = function() {
        var time = Date.now() * 0.001; // Converted
        
        var audioBoost = this.analysisData.bass * 2 + this.analysisData.mid; // Converted
        var rotationSpeed = this.visualParams.rotationSpeed * (1 + audioBoost); // Converted
        var morphing = this.visualParams.morphFactor + this.analysisData.high * 0.5; // Converted
        
        this.renderAudioLines(time, audioBoost);
    };
    
    HyperAVVisualizer.prototype.renderAudioLines = function(time, audioBoost) {
        var gl = this.gl; // Converted
        
        var vertices = []; // Converted
        var lineCount = 50; // Converted
        
        for (var i = 0; i < lineCount; i++) { // Converted let to var
            var angle = (i / lineCount) * Math.PI * 2; // Converted
            var radius = 0.5 + audioBoost * 0.3; // Converted
            var x1 = Math.cos(angle + time) * radius; // Converted
            var y1 = Math.sin(angle + time) * radius; // Converted
            var x2 = Math.cos(angle + time + Math.PI) * radius * 0.5; // Converted
            var y2 = Math.sin(angle + time + Math.PI) * radius * 0.5; // Converted
            
            vertices.push(x1, y1, x2, y2);
        }
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
    
    var hyperAV = new HyperAVVisualizer();
    
    document.addEventListener('DOMContentLoaded', function() {
        hyperAV.start();
    });
    
    window.HyperAVVisualizer = hyperAV;
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            hyperAV.stop();
        } else {
            hyperAV.start();
        }
    });
    
    console.log('🎵 HyperAV Visualizer System loaded');
    
})();