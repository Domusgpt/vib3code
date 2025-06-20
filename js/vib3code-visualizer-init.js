/**
 * VIB3CODE MAGAZINE - PHASE 2B VISUALIZER INITIALIZATION
 * 
 * Implements the new VisualizerManager with ManagedVisualizer instances
 * for the VIB3CODE digital magazine. Creates multiple specialized
 * visualizer instances with rule-based parameter derivation.
 */

class VIB3CodeVisualizerInit {
    constructor() {
        this.initialized = false;
        this.canvasElements = {};
        this.instanceConfigs = {};
        this.init();
    }
    
    init() {
        console.log('🎨 VIB3CODE Visualizer Init starting...');
        console.log('- VisualizerManager available:', typeof window.VisualizerManager);
        console.log('- visualizerManager instance:', !!window.visualizerManager);
        
        if (typeof window.VisualizerManager === 'undefined') {
            console.error('❌ VisualizerManager not found. Make sure persistent-multi-visualizer.js is loaded first.');
            console.log('Available globals:', Object.keys(window).filter(k => k.includes('visual') || k.includes('Visual')));
            return;
        }
        
        console.log('🎨 Initializing VIB3CODE Phase 2b Visualizer System...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupVisualizers());
        } else {
            this.setupVisualizers();
        }
    }
    
    setupVisualizers() {
        console.log('🔧 Setting up visualizers...');
        
        // Debug existing canvases
        const existingCanvases = document.querySelectorAll('canvas');
        console.log('Existing canvases before setup:', existingCanvases.length);
        existingCanvases.forEach((canvas, i) => {
            console.log(`Canvas ${i+1}: id="${canvas.id}", class="${canvas.className}"`);
        });
        
        this.createCanvasElements();
        this.defineInstanceConfigurations();
        this.createVisualizerInstances();
        this.setupNavigationIntegration();
        this.initialized = true;
        
        console.log('✅ VIB3CODE Visualizer System initialized with Phase 2b architecture');
        console.log('- VisualizerManager with rule-based reactivity');
        console.log('- ManagedVisualizer instances with parameter derivation');
        console.log('- Portal transitions between geometric spaces');
        console.log('- Master style control with auto-derivation');
    }
    
    createCanvasElements() {
        console.log('🎨 Creating canvas elements...');
        
        // EMERGENCY: Remove ALL existing canvases to prevent conflicts
        const existingCanvases = document.querySelectorAll('canvas');
        console.log(`🧹 Removing ${existingCanvases.length} existing canvases to prevent conflicts`);
        existingCanvases.forEach(canvas => {
            console.log(`Removing canvas: ${canvas.id || 'unnamed'} with class: ${canvas.className}`);
            canvas.remove();
        });
        
        // Define the canvas configurations
        const canvasConfigs = [
            { id: 'vib3-header-canvas', className: 'vib3-header-visualizer', zIndex: 1 },
            { id: 'vib3-content-canvas', className: 'vib3-content-visualizer', zIndex: 0 },
            { id: 'vib3-ambient-canvas', className: 'vib3-ambient-visualizer', zIndex: -1 }
        ];
        
        canvasConfigs.forEach(config => {
            // Remove existing canvas if present
            const existing = document.getElementById(config.id);
            if (existing) {
                existing.remove();
            }
            
            // Create new canvas
            const canvas = document.createElement('canvas');
            canvas.id = config.id;
            canvas.className = config.className;
            
            // Set canvas styles for proper layering
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = config.zIndex.toString();
            
            // Set initial size
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Append to body
            document.body.appendChild(canvas);
            
            // Store reference
            this.canvasElements[config.id] = canvas;
            
            console.log(`✅ Created canvas: ${config.id}`);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            Object.values(this.canvasElements).forEach(canvas => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        });
    }
    
    defineInstanceConfigurations() {
        console.log('⚙️ Defining instance configurations...');
        
        // Header visualizer - most prominent
        this.instanceConfigs.header = {
            baseConfig: {
                geometry: 0, // Starts with hypercube but will be overridden by master
                baseColor: [1.0, 0.0, 1.0], // Magenta - will be overridden by master
                gridDensity: 15.0,
                morphFactor: 0.1,
                dimension: 3.2,
                glitchIntensity: 0.1,
                rotationSpeed: 0.3,
                latticeStyle: 'hybrid',
                intensity: 0.3,
                transitionDuration: 1200
            },
            rules: {
                parameterDerivation: {
                    intensity: { multiplierRelativeToMaster: 0.8 },
                    gridDensity: { multiplierRelativeToMaster: 1.2 },
                    morphFactor: 'fixed' // Keep base value
                },
                eventReactions: {
                    'GLOBAL_SCROLL_UPDATE': {
                        gridDensity: {
                            source: 'masterEffect.deltas.gridDensity',
                            multiplier: 2.0,
                            min: 10.0,
                            max: 25.0
                        },
                        rotationSpeed: {
                            source: 'masterEffect.deltas.rotationSpeed',
                            multiplier: 1.5,
                            min: 0.1,
                            max: 1.0
                        }
                    },
                    'GLOBAL_MOUSE_MOVE_UPDATE': {
                        glitchIntensity: {
                            source: 'masterEffect.deltas.glitchIntensity',
                            multiplier: 0.8,
                            min: 0.0,
                            max: 0.5
                        }
                    }
                },
                allowedAdjustments: ['intensity', 'gridDensity', 'rotationSpeed', 'glitchIntensity']
            }
        };
        
        // Content visualizer - medium intensity
        this.instanceConfigs.content = {
            baseConfig: {
                geometry: 1, // Tetrahedron
                baseColor: [0.0, 1.0, 1.0], // Cyan
                gridDensity: 12.0,
                morphFactor: 0.3,
                dimension: 3.0,
                glitchIntensity: 0.05,
                rotationSpeed: 0.2,
                latticeStyle: 'wireframe',
                intensity: 0.15,
                transitionDuration: 1000
            },
            rules: {
                parameterDerivation: {
                    intensity: { multiplierRelativeToMaster: 0.4 },
                    gridDensity: { multiplierRelativeToMaster: 0.8 },
                    baseColor: 'fixed' // Keep cyan for content
                },
                eventReactions: {
                    'GLOBAL_SCROLL_UPDATE': {
                        gridDensity: {
                            source: 'masterEffect.deltas.gridDensity',
                            multiplier: 1.0,
                            min: 8.0,
                            max: 20.0
                        }
                    },
                    'GLOBAL_MOUSE_MOVE_UPDATE': {
                        morphFactor: {
                            source: 'masterEffect.deltas.morphFactor',
                            multiplier: 0.5,
                            min: 0.1,
                            max: 0.7
                        }
                    }
                },
                allowedAdjustments: ['intensity', 'gridDensity', 'morphFactor']
            }
        };
        
        // Ambient visualizer - subtle background
        this.instanceConfigs.ambient = {
            baseConfig: {
                geometry: 2, // Sphere
                baseColor: [0.8, 0.8, 1.0], // Light blue
                gridDensity: 8.0,
                morphFactor: 0.8,
                dimension: 3.1,
                glitchIntensity: 0.02,
                rotationSpeed: 0.1,
                latticeStyle: 'solid',
                intensity: 0.05,
                transitionDuration: 1500
            },
            rules: {
                parameterDerivation: {
                    intensity: { multiplierRelativeToMaster: 0.2 },
                    gridDensity: 'fixed', // Keep stable grid
                    morphFactor: { multiplierRelativeToMaster: 1.5 }
                },
                eventReactions: {
                    'GLOBAL_SCROLL_UPDATE': {
                        morphFactor: {
                            source: 'raw.scrollVelocity',
                            multiplier: 0.01,
                            direction: 'inverse',
                            min: 0.5,
                            max: 1.0
                        }
                    }
                },
                allowedAdjustments: ['intensity', 'morphFactor']
            }
        };
    }
    
    createVisualizerInstances() {
        console.log('🎭 Creating managed visualizer instances...');
        
        // Ensure we have the global VisualizerManager
        if (!window.visualizerManager) {
            console.error('❌ Global visualizerManager not found');
            return;
        }
        
        const manager = window.visualizerManager;
        
        // Create header instance
        const headerInstance = manager.addInstance(
            'vib3-header',
            this.canvasElements['vib3-header-canvas'],
            this.instanceConfigs.header.baseConfig,
            this.instanceConfigs.header.rules,
            manager.globalVelocityState
        );
        
        // Create content instance  
        const contentInstance = manager.addInstance(
            'vib3-content',
            this.canvasElements['vib3-content-canvas'],
            this.instanceConfigs.content.baseConfig,
            this.instanceConfigs.content.rules,
            manager.globalVelocityState
        );
        
        // Create ambient instance
        const ambientInstance = manager.addInstance(
            'vib3-ambient',
            this.canvasElements['vib3-ambient-canvas'],
            this.instanceConfigs.ambient.baseConfig,
            this.instanceConfigs.ambient.rules,
            manager.globalVelocityState
        );
        
        if (headerInstance && contentInstance && ambientInstance) {
            console.log('✅ All visualizer instances created successfully');
            console.log('- Header instance: High intensity with scroll reactivity');
            console.log('- Content instance: Medium intensity with tetrahedron geometry');
            console.log('- Ambient instance: Subtle background with sphere geometry');
        } else {
            console.error('❌ Failed to create some visualizer instances');
        }
        
        // Test global effects
        setTimeout(() => {
            console.log('🧪 Testing global effects...');
            manager.propagateGlobalEffect('CYCLE_GEOMETRY', {});
        }, 3000);
        
        // Test section transition
        setTimeout(() => {
            console.log('🌀 Testing section transition...');
            manager.applyMasterStyle('articles');
        }, 5000);
        
        // Return to home
        setTimeout(() => {
            console.log('🏠 Returning to home style...');
            manager.applyMasterStyle('home');
        }, 7000);
    }
    
    setupNavigationIntegration() {
        console.log('🧭 Setting up navigation integration...');
        
        // Listen for navigation clicks
        document.addEventListener('click', (event) => {
            const navLink = event.target.closest('[data-section]');
            if (navLink && window.visualizerManager) {
                const section = navLink.getAttribute('data-section');
                console.log(`🌀 Navigation to section: ${section}`);
                window.visualizerManager.applyMasterStyle(section);
            }
        });
        
        // Listen for custom section change events
        document.addEventListener('sectionChange', (event) => {
            if (window.visualizerManager && event.detail && event.detail.section) {
                const section = event.detail.section;
                console.log(`🌀 Section change event: ${section}`);
                window.visualizerManager.applyMasterStyle(section);
            }
        });
        
        // Set up intersection observer for automatic section detection
        this.setupSectionObserver();
    }
    
    setupSectionObserver() {
        const sections = document.querySelectorAll('.magazine-section, section[id]');
        if (sections.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const sectionId = entry.target.id;
                    const section = sectionId.replace('section-', '');
                    
                    if (window.visualizerManager && section) {
                        console.log(`👁️ Section in view: ${section}`);
                        window.visualizerManager.applyMasterStyle(section);
                    }
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '-10% 0px -10% 0px'
        });
        
        sections.forEach(section => observer.observe(section));
        
        console.log('✅ Section observer set up for automatic transitions');
    }
    
    // Public API for external control
    testGlobalEffects() {
        if (!window.visualizerManager) return;
        
        console.log('🧪 Testing all global effects...');
        
        setTimeout(() => {
            window.visualizerManager.propagateGlobalEffect('INVERT_COLORS', {});
        }, 1000);
        
        setTimeout(() => {
            window.visualizerManager.propagateGlobalEffect('MULTIPLY_GRID_DENSITY', { factor: 1.5 });
        }, 2000);
        
        setTimeout(() => {
            window.visualizerManager.propagateGlobalEffect('CYCLE_GEOMETRY', {});
        }, 3000);
        
        setTimeout(() => {
            window.visualizerManager.propagateGlobalEffect('SWAP_INSTANCE_CONFIGS', { 
                instanceId1: 'vib3-header', 
                instanceId2: 'vib3-content' 
            });
        }, 4000);
    }
    
    getCurrentState() {
        if (!window.visualizerManager) return null;
        
        return {
            currentMasterStyle: window.visualizerManager.getCurrentMasterStyleKey(),
            isTransitioning: window.visualizerManager.isInTransition(),
            instances: Object.keys(window.visualizerManager.instances),
            canvasElements: Object.keys(this.canvasElements)
        };
    }
}

// Global initialization
window.vib3CodeVisualizer = new VIB3CodeVisualizerInit();

// Export for external use
window.testVisualizerEffects = () => window.vib3CodeVisualizer.testGlobalEffects();
window.getVisualizerState = () => window.vib3CodeVisualizer.getCurrentState();

console.log('🎨 VIB3CODE Visualizer Init loaded and ready');