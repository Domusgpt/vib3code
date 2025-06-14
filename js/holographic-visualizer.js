// VIB3CODE Holographic Visualizer - Inspired by Gen-Rl-MiLLz
(function() {
    'use strict';
    
    function HolographicVisualizer() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        this.time = 0;
        
        // Holographic elements
        this.particles = [];
        this.waves = [];
        this.geometries = [];
        this.holographicLayers = [];
        
        // Theme integration
        this.currentTheme = {
            primary: '#00d9ff',
            secondary: '#ff10f0', 
            accent: '#ffcc00',
            intensity: 1.0
        };
        
        this.init();
    }
    
    HolographicVisualizer.prototype.init = function() {
        console.log('🌟 Initializing Holographic Visualizer...');
        
        this.canvas = document.getElementById('visualizer-canvas');
        if (!this.canvas) {
            console.warn('Visualizer canvas not found');
            return;
        }
        
        this.setupCanvas();
        this.createHolographicElements();
        this.bindThemeEvents();
        this.start();
        
        console.log('✅ Holographic Visualizer initialized');
    };
    
    HolographicVisualizer.prototype.setupCanvas = function() {
        var self = this;
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', function() {
            self.resizeCanvas();
        });
        
        // Set canvas styles for glassmorphic backdrop
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
    };
    
    HolographicVisualizer.prototype.resizeCanvas = function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    };
    
    HolographicVisualizer.prototype.createHolographicElements = function() {
        // Create floating particles
        for (var i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 1000,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                vz: (Math.random() - 0.5) * 5,
                size: Math.random() * 3 + 1,
                life: Math.random(),
                type: Math.floor(Math.random() * 3),
                holographicShift: Math.random() * Math.PI * 2
            });
        }
        
        // Create wave systems
        for (var j = 0; j < 5; j++) {
            this.waves.push({
                amplitude: 50 + Math.random() * 100,
                frequency: 0.01 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03,
                opacity: 0.1 + Math.random() * 0.3,
                layer: j
            });
        }
        
        // Create geometric patterns
        this.geometries = [
            { type: 'hypercube', rotation: 0, scale: 1 },
            { type: 'torus', rotation: 0, scale: 0.8 },
            { type: 'fractal', rotation: 0, scale: 0.6 }
        ];
        
        // Create holographic layers
        for (var k = 0; k < 3; k++) {
            this.holographicLayers.push({
                offsetX: Math.random() * 20 - 10,
                offsetY: Math.random() * 20 - 10,
                opacity: 0.1 + Math.random() * 0.2,
                color: k === 0 ? 'cyan' : k === 1 ? 'magenta' : 'yellow',
                phase: Math.random() * Math.PI * 2
            });
        }
    };
    
    HolographicVisualizer.prototype.bindThemeEvents = function() {
        var self = this;
        
        window.addEventListener('themeChange', function(event) {
            if (event.detail && event.detail.theme) {
                self.updateTheme(event.detail.theme);
            }
        });
    };
    
    HolographicVisualizer.prototype.updateTheme = function(theme) {
        if (theme.colors) {
            this.currentTheme = {
                primary: theme.colors.primary || this.currentTheme.primary,
                secondary: theme.colors.secondary || this.currentTheme.secondary,
                accent: theme.colors.accent || this.currentTheme.accent,
                intensity: theme.intensity || this.currentTheme.intensity
            };
        }
        
        console.log('🌟 Holographic theme updated:', theme.name || 'Unknown');
    };
    
    HolographicVisualizer.prototype.render = function() {
        if (!this.isRunning) return;
        
        this.time += 0.016 * this.currentTheme.intensity;
        
        // Clear with subtle gradient
        this.clearWithGradient();
        
        // Render holographic layers
        this.renderHolographicLayers();
        
        // Render wave systems
        this.renderWaves();
        
        // Render geometric patterns
        this.renderGeometries();
        
        // Render particles
        this.renderParticles();
        
        // Render glassmorphic overlay
        this.renderGlassmorphicOverlay();
        
        var self = this;
        this.animationId = requestAnimationFrame(function() {
            self.render();
        });
    };
    
    HolographicVisualizer.prototype.clearWithGradient = function() {
        var ctx = this.ctx;
        
        // Create subtle animated background
        var gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, 
            Math.max(this.canvas.width, this.canvas.height)
        );
        
        var primaryColor = this.hexToRgb(this.currentTheme.primary);
        var secondaryColor = this.hexToRgb(this.currentTheme.secondary);
        
        gradient.addColorStop(0, 'rgba(' + Math.floor(primaryColor.r * 255) + ', ' + 
                                     Math.floor(primaryColor.g * 255) + ', ' + 
                                     Math.floor(primaryColor.b * 255) + ', 0.02)');
        gradient.addColorStop(1, 'rgba(' + Math.floor(secondaryColor.r * 255) + ', ' + 
                                     Math.floor(secondaryColor.g * 255) + ', ' + 
                                     Math.floor(secondaryColor.b * 255) + ', 0.01)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    
    HolographicVisualizer.prototype.renderHolographicLayers = function() {
        var ctx = this.ctx;
        
        for (var i = 0; i < this.holographicLayers.length; i++) {
            var layer = this.holographicLayers[i];
            
            ctx.save();
            ctx.globalAlpha = layer.opacity * Math.sin(this.time * 0.5 + layer.phase) * 0.5 + 0.5;
            ctx.globalCompositeOperation = 'screen';
            
            // Animated holographic shift
            var shiftX = Math.sin(this.time * 0.3 + layer.phase) * layer.offsetX;
            var shiftY = Math.cos(this.time * 0.2 + layer.phase) * layer.offsetY;
            
            ctx.translate(shiftX, shiftY);
            
            // Draw holographic grid
            ctx.strokeStyle = this.getHolographicColor(layer.color);
            ctx.lineWidth = 1;
            
            var gridSize = 50;
            for (var x = -gridSize; x < this.canvas.width + gridSize; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.canvas.height);
                ctx.stroke();
            }
            
            for (var y = -gridSize; y < this.canvas.height + gridSize; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.canvas.width, y);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    };
    
    HolographicVisualizer.prototype.renderWaves = function() {
        var ctx = this.ctx;
        
        for (var i = 0; i < this.waves.length; i++) {
            var wave = this.waves[i];
            
            ctx.save();
            ctx.globalAlpha = wave.opacity * this.currentTheme.intensity;
            ctx.strokeStyle = this.currentTheme.primary;
            ctx.lineWidth = 2;
            ctx.globalCompositeOperation = 'lighten';
            
            ctx.beginPath();
            
            for (var x = 0; x <= this.canvas.width; x += 5) {
                var y = this.canvas.height / 2 + 
                       Math.sin(x * wave.frequency + this.time * wave.speed + wave.phase) * 
                       wave.amplitude * Math.sin(this.time * 0.1 + wave.layer);
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            ctx.restore();
        }
    };
    
    HolographicVisualizer.prototype.renderGeometries = function() {
        var ctx = this.ctx;
        var centerX = this.canvas.width / 2;
        var centerY = this.canvas.height / 2;
        
        for (var i = 0; i < this.geometries.length; i++) {
            var geo = this.geometries[i];
            geo.rotation += 0.01 * this.currentTheme.intensity;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(geo.rotation);
            ctx.scale(geo.scale, geo.scale);
            ctx.globalAlpha = 0.3 * this.currentTheme.intensity;
            ctx.strokeStyle = this.currentTheme.accent;
            ctx.lineWidth = 1;
            
            switch (geo.type) {
                case 'hypercube':
                    this.drawHypercube(ctx);
                    break;
                case 'torus':
                    this.drawTorus(ctx);
                    break;
                case 'fractal':
                    this.drawFractal(ctx);
                    break;
            }
            
            ctx.restore();
        }
    };
    
    HolographicVisualizer.prototype.drawHypercube = function(ctx) {
        var size = 100;
        var depth = 50;
        
        // Front face
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        // Back face
        ctx.strokeRect(-size/2 + depth, -size/2 + depth, size, size);
        
        // Connecting lines
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(-size/2 + depth, -size/2 + depth);
        ctx.moveTo(size/2, -size/2);
        ctx.lineTo(size/2 + depth, -size/2 + depth);
        ctx.moveTo(size/2, size/2);
        ctx.lineTo(size/2 + depth, size/2 + depth);
        ctx.moveTo(-size/2, size/2);
        ctx.lineTo(-size/2 + depth, size/2 + depth);
        ctx.stroke();
    };
    
    HolographicVisualizer.prototype.drawTorus = function(ctx) {
        var majorRadius = 80;
        var minorRadius = 30;
        var segments = 20;
        
        for (var i = 0; i < segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            var x = Math.cos(angle) * majorRadius;
            var y = Math.sin(angle) * majorRadius;
            
            ctx.beginPath();
            ctx.arc(x, y, minorRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    };
    
    HolographicVisualizer.prototype.drawFractal = function(ctx) {
        var iterations = 5;
        var scale = 120;
        
        function drawBranch(x, y, angle, length, depth) {
            if (depth === 0) return;
            
            var endX = x + Math.cos(angle) * length;
            var endY = y + Math.sin(angle) * length;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            var newLength = length * 0.7;
            drawBranch(endX, endY, angle - 0.5, newLength, depth - 1);
            drawBranch(endX, endY, angle + 0.5, newLength, depth - 1);
        }
        
        drawBranch(0, scale/2, -Math.PI/2, scale/3, iterations);
    };
    
    HolographicVisualizer.prototype.renderParticles = function() {
        var ctx = this.ctx;
        
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            
            // Update particle
            p.x += p.vx * this.currentTheme.intensity;
            p.y += p.vy * this.currentTheme.intensity;
            p.z += p.vz * this.currentTheme.intensity;
            p.life += 0.01;
            p.holographicShift += 0.05;
            
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            if (p.z < 0) p.z = 1000;
            if (p.z > 1000) p.z = 0;
            
            if (p.life > 1) p.life = 0;
            
            // Render particle with holographic effect
            var alpha = Math.sin(p.life * Math.PI) * this.currentTheme.intensity;
            var scale = (1000 - p.z) / 1000;
            var actualSize = p.size * scale;
            
            if (actualSize > 0.5) {
                ctx.save();
                ctx.globalAlpha = alpha * 0.8;
                
                // Holographic color shifting
                var colorShift = Math.sin(p.holographicShift) * 0.5 + 0.5;
                var color = this.interpolateColors(
                    this.currentTheme.primary,
                    this.currentTheme.secondary,
                    colorShift
                );
                
                // Draw multiple layers for holographic effect
                for (var layer = 0; layer < 3; layer++) {
                    var layerOffset = layer * 2;
                    var layerAlpha = alpha * (0.5 - layer * 0.1);
                    
                    ctx.globalAlpha = layerAlpha;
                    ctx.fillStyle = color;
                    
                    ctx.beginPath();
                    ctx.arc(
                        p.x + layerOffset, 
                        p.y + layerOffset, 
                        actualSize, 
                        0, 
                        Math.PI * 2
                    );
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }
    };
    
    HolographicVisualizer.prototype.renderGlassmorphicOverlay = function() {
        var ctx = this.ctx;
        
        // Create subtle glassmorphic patterns
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.globalCompositeOperation = 'lighten';
        
        var gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, this.currentTheme.primary);
        gradient.addColorStop(0.5, this.currentTheme.accent);
        gradient.addColorStop(1, this.currentTheme.secondary);
        
        ctx.fillStyle = gradient;
        
        // Animated glass panels
        for (var i = 0; i < 5; i++) {
            var x = (i / 5) * this.canvas.width + Math.sin(this.time * 0.1 + i) * 50;
            var y = Math.cos(this.time * 0.05 + i) * 100 + this.canvas.height / 2;
            var width = 200;
            var height = this.canvas.height;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.sin(this.time * 0.02 + i) * 0.1);
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.restore();
        }
        
        ctx.restore();
    };
    
    // Utility functions
    HolographicVisualizer.prototype.hexToRgb = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0.8, b: 1 };
    };
    
    HolographicVisualizer.prototype.getHolographicColor = function(colorName) {
        switch (colorName) {
            case 'cyan': return '#00ffff';
            case 'magenta': return '#ff00ff';
            case 'yellow': return '#ffff00';
            default: return this.currentTheme.primary;
        }
    };
    
    HolographicVisualizer.prototype.interpolateColors = function(color1, color2, factor) {
        var c1 = this.hexToRgb(color1);
        var c2 = this.hexToRgb(color2);
        
        var r = Math.floor((c1.r + (c2.r - c1.r) * factor) * 255);
        var g = Math.floor((c1.g + (c2.g - c1.g) * factor) * 255);
        var b = Math.floor((c1.b + (c2.b - c1.b) * factor) * 255);
        
        return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    };
    
    HolographicVisualizer.prototype.start = function() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.render();
        
        console.log('🌟 Holographic Visualizer started');
    };
    
    HolographicVisualizer.prototype.stop = function() {
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        console.log('⏹️ Holographic Visualizer stopped');
    };
    
    HolographicVisualizer.prototype.destroy = function() {
        this.stop();
        this.particles = [];
        this.waves = [];
        this.geometries = [];
        this.holographicLayers = [];
        
        console.log('🔥 Holographic Visualizer destroyed');
    };
    
    // Initialize visualizer
    var visualizer = new HolographicVisualizer();
    
    // Export for theme engine access
    window.SimpleVisualizer = visualizer;
    window.HolographicVisualizer = visualizer;
    
    // Handle page unload
    window.addEventListener('beforeunload', function() {
        visualizer.destroy();
    });
    
    // Pause/resume based on visibility
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            visualizer.stop();
        } else {
            visualizer.start();
        }
    });
    
})();