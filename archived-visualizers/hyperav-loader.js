// HyperAV Full System Loader for VIB3CODE
// Loads the complete visualizer system and integrates with magazine

(function() {
    'use strict';
    
    window.HyperAVLoader = {
        config: {
            basePath: './visualizer/',
            modules: [
                'core/ShaderManager.js',
                'core/GeometryManager.js', 
                'core/ProjectionManager.js',
                'core/HypercubeCore.js',
                'js/VisualizerController.js',
                'js/hyperav-main.js'
            ],
            styles: [
                'css/neumorphic-vars.css',
                'css/neumorphic-style.css',
                'css/enhanced-styles.css'
            ]
        },
        
        // Load all required modules
        loadModules: function() {
            console.log('🚀 Loading HyperAV Full System...');
            
            // Load styles first
            this.config.styles.forEach(function(stylePath) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = this.config.basePath + stylePath;
                document.head.appendChild(link);
            }.bind(this));
            
            // Create visualizer container
            this.createVisualizerContainer();
            
            // Load JavaScript modules
            return this.loadScriptsSequentially();
        },
        
        // Create the visualizer canvas and container
        createVisualizerContainer: function() {
            // Check if container already exists
            if (document.getElementById('hyperav-container')) return;
            
            // Create container
            var container = document.createElement('div');
            container.id = 'hyperav-container';
            container.style.cssText =
                'position: fixed;' +
                'top: 0;' +
                'left: 0;' +
                'width: 100%;' +
                'height: 100%;' +
                'z-index: -1;' +
                'pointer-events: none;';
            
            // Create canvas
            var canvas = document.createElement('canvas');
            canvas.id = 'hypercube-canvas';
            canvas.style.cssText =
                'width: 100%;' +
                'height: 100%;' +
                'display: block;';
            
            container.appendChild(canvas);
            document.body.insertBefore(container, document.body.firstChild);
            
            // Make interactive areas pointer-aware
            this.setupInteractiveAreas();
        },
        
        // Setup interactive areas for direct visualizer control
        setupInteractiveAreas: function() {
            // Create invisible interaction zones
            var interactionOverlay = document.createElement('div');
            interactionOverlay.id = 'visualizer-interaction-overlay';
            interactionOverlay.style.cssText =
                'position: fixed;' +
                'top: 0;' +
                'left: 0;' +
                'width: 100%;' +
                'height: 100%;' +
                'z-index: 5;' +
                'pointer-events: none;';
            
            // Top-left corner for direct dimension control
            var dimensionZone = document.createElement('div');
            dimensionZone.className = 'interaction-zone dimension-control';
            dimensionZone.style.cssText =
                'position: absolute;' +
                'top: 0;' +
                'left: 0;' +
                'width: 200px;' +
                'height: 200px;' +
                'pointer-events: auto;' +
                'cursor: crosshair;';
            dimensionZone.title = 'Drag to control dimensions';
            
            // Bottom-right corner for morph control
            var morphZone = document.createElement('div');
            morphZone.className = 'interaction-zone morph-control';
            morphZone.style.cssText =
                'position: absolute;' +
                'bottom: 0;' +
                'right: 0;' +
                'width: 200px;' +
                'height: 200px;' +
                'pointer-events: auto;' +
                'cursor: move;';
            morphZone.title = 'Drag to control morphing';
            
            interactionOverlay.appendChild(dimensionZone);
            interactionOverlay.appendChild(morphZone);
            document.body.appendChild(interactionOverlay);
        },
        
        // Load scripts sequentially to maintain dependencies
        loadScriptsSequentially: function() {
            var self = this;
            var scripts = this.config.modules;
            var index = 0;
            
            return new Promise(function(resolve, reject) {
                function loadNext() {
                    if (index >= scripts.length) {
                        resolve();
                        return;
                    }
                    
                    var script = document.createElement('script');
                    script.type = 'module';
                    script.src = self.config.basePath + scripts[index];
                    
                    script.onload = function() {
                        console.log('✅ Loaded:', scripts[index]);
                        index++;
                        loadNext();
                    };
                    
                    script.onerror = function(e) {
                        console.error('❌ Failed to load:', scripts[index], e);
                        reject(new Error('Failed to load ' + scripts[index]));
                    };
                    
                    document.head.appendChild(script);
                }
                
                loadNext();
            });
        },
        
        // Initialize the full system
        init: function() {
            var self = this;
            
            this.loadModules().then(function() {
                console.log('✅ HyperAV modules loaded successfully');
                
                // Wait for visualizer to initialize
                setTimeout(function() {
                    self.initializeHyperAV();
                    self.integrateWithMagazine();
                    self.setupParameterDisplay();
                }, 1000);
                
            }).catch(function(error) {
                console.error('❌ Failed to load HyperAV:', error);
                // Fall back to simple visualizer
                self.loadFallbackVisualizer();
            });
        },
        
        // Initialize HyperAV controller
        initializeHyperAV: function() {
            try {
                var canvas = document.getElementById('hypercube-canvas');
                if (!canvas) {
                    console.error('HyperAV canvas not found');
                    return;
                }
                
                // Initialize core system if available
                if (window.HypercubeCore) {
                    var core = new window.HypercubeCore(canvas);
                    
                    // Initialize controller if available
                    if (window.VisualizerController) {
                        window.HyperAVController = new window.VisualizerController(core);
                        console.log('✅ HyperAV Controller initialized');
                    }
                }
                
            } catch (error) {
                console.error('Failed to initialize HyperAV:', error);
            }
        },
        
        // Integrate with magazine router
        integrateWithMagazine: function() {
            // Ensure VIB3VisualizerIntegration is loaded
            if (!window.VIB3VisualizerIntegration) {
                var script = document.createElement('script');
                script.src = 'js/vib3-visualizer-integration.js';
                document.head.appendChild(script);
            }
            
            // Connect to magazine router events
            if (window.MagazineRouter && window.MagazineRouter.navigateToSection) {
                var originalNavigate = window.MagazineRouter.navigateToSection;
                window.MagazineRouter.navigateToSection = function(section, itemId) {
                    originalNavigate.call(window.MagazineRouter, section, itemId);
                    
                    // Dispatch custom event for visualizer
                    document.dispatchEvent(new CustomEvent('section-changed', {
                        detail: { section: section }
                    }));
                };
            }
        },
        
        // Setup parameter display overlay
        setupParameterDisplay: function() {
            var display = document.createElement('div');
            display.className = 'parameter-indicator';
            display.innerHTML =
                '<div class="param">' +
                    '<span>Section:</span>' +
                    '<span class="param-value" id="param-section">home</span>' +
                '</div>' +
                '<div class="param">' +
                    '<span>Geometry:</span>' +
                    '<span class="param-value" id="param-geometry">hypercube</span>' +
                '</div>' +
                '<div class="param">' +
                    '<span>Activity:</span>' +
                    '<span class="param-value" id="param-activity">0.0</span>' +
                '</div>' +
                '<div class="param">' +
                    '<span>Depth:</span>' +
                    '<span class="param-value" id="param-depth">0%</span>' +
                '</div>';
            document.body.appendChild(display);
            
            // Update display periodically
            setInterval(function() {
                if (window.VIB3VisualizerIntegration && 
                    typeof window.VIB3VisualizerIntegration.getVisualizerState === 'function') {
                    try {
                        var state = window.VIB3VisualizerIntegration.getVisualizerState();
                        if (state && state.preset && state.activity) {
                            document.getElementById('param-section').textContent = state.section || 'unknown';
                            document.getElementById('param-geometry').textContent = state.preset.geometryType || 'unknown';
                            document.getElementById('param-activity').textContent = 
                                ((state.activity.scroll || 0) + (state.activity.mouse || 0) + (state.activity.click || 0)).toFixed(2);
                            document.getElementById('param-depth').textContent = 
                                Math.round((state.depth || 0) * 100) + '%';
                        }
                    } catch (error) {
                        // Silently handle errors to prevent console spam
                        // console.warn('HyperAV: Parameter display update failed:', error.message);
                    }
                }
            }, 100);
        },
        
        // Fallback to simple visualizer if full system fails
        loadFallbackVisualizer: function() {
            console.log('⚠️ Loading fallback visualizer...');
            var script = document.createElement('script');
            script.src = 'js/holographic-visualizer.js';
            document.head.appendChild(script);
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.HyperAVLoader.init();
        });
    } else {
        window.HyperAVLoader.init();
    }
})();