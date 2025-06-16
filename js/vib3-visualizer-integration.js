// VIB3CODE Advanced Visualizer Integration System
// Context-aware parameter mapping for HyperAV visualizer

(function() {
    'use strict';
    
    window.VIB3VisualizerIntegration = {
        // Current state tracking
        state: {
            currentSection: 'home',
            scrollPosition: 0,
            scrollVelocity: 0,
            mousePosition: { x: 0.5, y: 0.5 },
            mouseVelocity: { x: 0, y: 0 },
            clickIntensity: 0,
            userActivity: 1.0,
            readingDepth: 0,
            interactionHistory: []
        },
        
        // Section-specific parameter presets
        sectionPresets: {
            home: {
                geometryType: 'hypercube',
                projectionMethod: 'perspective',
                baseRotationSpeed: 0.2,
                colorScheme: {
                    primary: [0.0, 0.85, 1.0],  // Cyan
                    secondary: [1.0, 0.0, 0.8],   // Magenta
                    background: [0.02, 0.0, 0.1]  // Deep blue
                },
                gridDensity: 8.0,
                morphFactor: 0.5
            },
            articles: {
                geometryType: 'hypercube',
                projectionMethod: 'orthographic',
                baseRotationSpeed: 0.1,
                colorScheme: {
                    primary: [0.2, 0.8, 1.0],     // Light blue
                    secondary: [0.8, 0.3, 1.0],   // Purple
                    background: [0.0, 0.02, 0.08] // Dark blue
                },
                gridDensity: 12.0,
                morphFactor: 0.3
            },
            videos: {
                geometryType: 'hypersphere',
                projectionMethod: 'stereographic',
                baseRotationSpeed: 0.3,
                colorScheme: {
                    primary: [1.0, 0.2, 0.5],     // Hot pink
                    secondary: [0.2, 1.0, 0.5],   // Green
                    background: [0.05, 0.0, 0.05] // Purple black
                },
                gridDensity: 6.0,
                morphFactor: 0.7
            },
            podcasts: {
                geometryType: 'hypertetrahedron',
                projectionMethod: 'perspective',
                baseRotationSpeed: 0.15,
                colorScheme: {
                    primary: [1.0, 0.5, 0.0],     // Orange
                    secondary: [0.0, 0.8, 1.0],   // Cyan
                    background: [0.02, 0.02, 0.0] // Dark amber
                },
                gridDensity: 10.0,
                morphFactor: 0.6
            },
            ema: {
                geometryType: 'hypercube',
                projectionMethod: 'perspective',
                baseRotationSpeed: 0.25,
                colorScheme: {
                    primary: [0.5, 0.0, 1.0],     // Purple
                    secondary: [0.0, 1.0, 0.5],   // Teal
                    background: [0.0, 0.0, 0.05]  // Deep purple
                },
                gridDensity: 16.0,
                morphFactor: 0.8
            }
        },
        
        // Interaction mappings
        interactions: {
            scroll: {
                rotationSpeed: { factor: 0.001, damping: 0.95 },
                morphFactor: { factor: 0.0002, damping: 0.9 },
                colorShift: { factor: 0.0001, damping: 0.85 },
                glitchIntensity: { factor: 0.00005, threshold: 50, damping: 0.8 }
            },
            mouse: {
                dimensions: { factorX: 0.5, factorY: 0.5, center: { x: 0.5, y: 0.5 } },
                patternIntensity: { factor: 1.0, radius: 0.3 },
                lineThickness: { factor: 0.02, min: 0.01, max: 0.05 }
            },
            click: {
                universeModifier: { impulse: 0.5, decay: 0.95 },
                glitchIntensity: { impulse: 0.3, decay: 0.9 },
                colorShift: { impulse: 0.2, decay: 0.92 }
            }
        },
        
        // Initialize the integration system
        init: function() {
            console.log('🎨 Initializing VIB3 Visualizer Integration...');
            
            // Setup event listeners
            this.setupScrollTracking();
            this.setupMouseTracking();
            this.setupClickTracking();
            this.setupSectionTracking();
            
            // Start update loop
            this.startUpdateLoop();
            
            // Apply initial section preset
            this.applySectionPreset('home');
            
            console.log('✅ VIB3 Visualizer Integration initialized');
        },
        
        // Track scroll behavior
        setupScrollTracking: function() {
            var self = this;
            var lastScrollY = window.scrollY;
            var scrollTimeout;
            
            window.addEventListener('scroll', function() {
                var currentScrollY = window.scrollY;
                self.state.scrollVelocity = currentScrollY - lastScrollY;
                self.state.scrollPosition = currentScrollY;
                lastScrollY = currentScrollY;
                
                // Calculate reading depth
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                self.state.readingDepth = docHeight > 0 ? currentScrollY / docHeight : 0;
                
                // Reset velocity after scroll stops
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(function() {
                    self.state.scrollVelocity = 0;
                }, 100);
            });
        },
        
        // Track mouse movement
        setupMouseTracking: function() {
            var self = this;
            var lastMouseX = 0, lastMouseY = 0;
            
            document.addEventListener('mousemove', function(e) {
                var x = e.clientX / window.innerWidth;
                var y = e.clientY / window.innerHeight;
                
                self.state.mouseVelocity.x = x - lastMouseX;
                self.state.mouseVelocity.y = y - lastMouseY;
                self.state.mousePosition.x = x;
                self.state.mousePosition.y = y;
                
                lastMouseX = x;
                lastMouseY = y;
            });
        },
        
        // Track click interactions
        setupClickTracking: function() {
            var self = this;
            
            document.addEventListener('click', function(e) {
                self.state.clickIntensity = 1.0;
                
                // Add to interaction history
                self.state.interactionHistory.push({
                    type: 'click',
                    position: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
                    timestamp: Date.now(),
                    target: e.target.tagName
                });
                
                // Keep only last 10 interactions
                if (self.state.interactionHistory.length > 10) {
                    self.state.interactionHistory.shift();
                }
            });
        },
        
        // Track section changes
        setupSectionTracking: function() {
            var self = this;
            
            // Listen for magazine router section changes
            document.addEventListener('section-changed', function(e) {
                self.state.currentSection = e.detail.section;
                self.applySectionPreset(e.detail.section);
            });
        },
        
        // Apply section-specific visualizer preset
        applySectionPreset: function(section) {
            var preset = this.sectionPresets[section] || this.sectionPresets.home;
            
            if (window.HyperAVCore && window.HyperAVCore.instance) {
                window.HyperAVCore.instance.updateParameters({
                    geometryType: preset.geometryType,
                    projectionMethod: preset.projectionMethod,
                    colorScheme: preset.colorScheme,
                    gridDensity: preset.gridDensity,
                    morphFactor: preset.morphFactor
                });
            }
        },
        
        // Main update loop
        startUpdateLoop: function() {
            var self = this;
            
            function update() {
                self.updateVisualizerParameters();
                requestAnimationFrame(update);
            }
            
            update();
        },
        
        // Update visualizer based on all tracked interactions
        updateVisualizerParameters: function() {
            // Try HyperAV first, fall back to simple visualizer
            if (window.HyperAVController) {
                this.updateHyperAV();
            } else if (window.VisualizerSimple) {
                this.updateSimpleVisualizer();
            }
        },
        
        // Update HyperAV visualizer specifically
        updateHyperAV: function() {
            var section = this.sectionPresets[this.state.currentSection] || this.sectionPresets.home;
            
            try {
                // Set geometry type based on section
                window.HyperAVController.setPolytope(section.geometryType);
                
                // Calculate dynamic parameters
                var scrollMappings = this.interactions.scroll;
                var rotationSpeed = section.baseRotationSpeed + (this.state.scrollVelocity * scrollMappings.rotationSpeed.factor);
                var morphFactor = Math.max(0, Math.min(1, 
                    section.morphFactor + (this.state.scrollVelocity * scrollMappings.morphFactor.factor)
                ));
                var colorShift = Math.abs(this.state.scrollVelocity * scrollMappings.colorShift.factor);
                
                // Mouse-based dimensions
                var mouseMappings = this.interactions.mouse;
                var dimensions = 4 + Math.floor((this.state.mousePosition.x - mouseMappings.dimensions.center.x) * mouseMappings.dimensions.factorX * 4);
                dimensions = Math.max(3, Math.min(8, dimensions));
                
                // Update visual style parameters
                var styleParams = {
                    morphFactor: morphFactor,
                    rotationSpeed: rotationSpeed,
                    lineThickness: 0.01 + (this.state.mousePosition.y * mouseMappings.lineThickness.factor),
                    colorShift: colorShift,
                    dimensions: dimensions,
                    projectionMethod: section.projectionMethod
                };
                
                window.HyperAVController.setVisualStyle(styleParams);
                
                // Update colors
                window.HyperAVController.setColors({
                    primary: section.colorScheme.primary,
                    secondary: section.colorScheme.secondary,
                    background: section.colorScheme.background
                });
                
            } catch (error) {
                console.warn('HyperAV update failed:', error);
            }
        },
        
        // Update simple visualizer (fallback)
        updateSimpleVisualizer: function() {
            var section = this.sectionPresets[this.state.currentSection] || this.sectionPresets.home;
            
            // Scroll-based parameters
            var scrollMappings = this.interactions.scroll;
            var params = {
                rotationSpeed: section.baseRotationSpeed + (this.state.scrollVelocity * scrollMappings.rotationSpeed.factor),
                morphFactor: Math.max(0, Math.min(1, 
                    section.morphFactor + (this.state.scrollVelocity * scrollMappings.morphFactor.factor)
                )),
                colorShift: Math.abs(this.state.scrollVelocity * scrollMappings.colorShift.factor),
                glitchIntensity: 0
            };
            
            // Add glitch on fast scroll
            if (Math.abs(this.state.scrollVelocity) > scrollMappings.glitchIntensity.threshold) {
                params.glitchIntensity = Math.min(0.5, Math.abs(this.state.scrollVelocity) * scrollMappings.glitchIntensity.factor);
            }
            
            // Mouse-based parameters
            var mouseMappings = this.interactions.mouse;
            var mouseDistanceFromCenter = Math.sqrt(
                Math.pow(this.state.mousePosition.x - mouseMappings.dimensions.center.x, 2) +
                Math.pow(this.state.mousePosition.y - mouseMappings.dimensions.center.y, 2)
            );
            
            params.dimensions = 4.0 + 
                (this.state.mousePosition.x - 0.5) * mouseMappings.dimensions.factorX +
                (this.state.mousePosition.y - 0.5) * mouseMappings.dimensions.factorY;
            
            params.patternIntensity = Math.max(0, 1.0 - (mouseDistanceFromCenter / mouseMappings.patternIntensity.radius));
            
            params.lineThickness = mouseMappings.lineThickness.min + 
                (mouseDistanceFromCenter * mouseMappings.lineThickness.factor);
            
            // Click-based parameters (decay over time)
            if (this.state.clickIntensity > 0) {
                var clickMappings = this.interactions.click;
                params.universeModifier = 1.0 + (this.state.clickIntensity * clickMappings.universeModifier.impulse);
                params.glitchIntensity = (params.glitchIntensity || 0) + (this.state.clickIntensity * clickMappings.glitchIntensity.impulse);
                params.colorShift = (params.colorShift || 0) + (this.state.clickIntensity * clickMappings.colorShift.impulse);
                
                // Decay click intensity
                this.state.clickIntensity *= clickMappings.universeModifier.decay;
                if (this.state.clickIntensity < 0.01) this.state.clickIntensity = 0;
            }
            
            // Reading depth affects visualization complexity
            params.gridDensity = section.gridDensity * (0.5 + this.state.readingDepth * 0.5);
            
            // Apply all parameters
            window.HyperAVCore.instance.updateParameters(params);
        },
        
        // Glassmorphic UI helper
        applyGlassmorphism: function(element, options) {
            options = options || {};
            var blur = options.blur || 10;
            var opacity = options.opacity || 0.1;
            var tint = options.tint || 'cyan';
            
            element.style.backdropFilter = 'blur(' + blur + 'px)';
            element.style.webkitBackdropFilter = 'blur(' + blur + 'px)';
            element.style.backgroundColor = 'rgba(0, 0, 0, ' + opacity + ')';
            element.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            element.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.1), inset 0 0 20px rgba(255, 0, 255, 0.05)';
            
            if (tint) {
                element.setAttribute('data-tint', tint);
            }
        },
        
        // Get current visualizer state for UI elements
        // Get current visualizer state for display
        getVisualizerState: function() {
            var preset = this.sectionPresets[this.state.currentSection] || this.sectionPresets.home;
            return {
                section: this.state.currentSection,
                preset: preset,
                activity: {
                    scroll: Math.abs(this.state.scrollVelocity),
                    mouse: Math.sqrt(this.state.mouseVelocity.x * this.state.mouseVelocity.x + 
                                   this.state.mouseVelocity.y * this.state.mouseVelocity.y),
                    click: this.state.clickIntensity
                },
                depth: this.state.readingDepth
            };
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.VIB3VisualizerIntegration.init();
        });
    } else {
        window.VIB3VisualizerIntegration.init();
    }
})();