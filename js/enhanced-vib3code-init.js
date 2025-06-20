/**
 * Enhanced VIB3CODE Visualizer Initialization
 * Integrates vibrant effects with adaptive multi-instance system
 */

console.log('🎨 VIB3CODE Enhanced Shader Integration starting...');

// Enhance the existing home-master system with vibrant shaders
window.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 DOM loaded, enhancing existing home-master system with vibrant shaders...');
    
    // Wait for home-master system to initialize first
    setTimeout(() => {
        if (typeof window.visualizerManager === 'undefined') {
            console.error('❌ Home-master VisualizerManager not found! Need to wait for shared-reactive-core to load.');
            return;
        }
        
        console.log('✅ Found existing VisualizerManager, enhancing with vibrant shaders...');
        
        // ENHANCE existing instances with vibrant shader effects
        const manager = window.visualizerManager;
        
        // Replace the basic shader system with enhanced shaders in existing instances
        Object.values(manager.instances).forEach(instance => {
            if (instance && instance.setupShaders) {
                console.log(`🎨 Enhancing instance ${instance.id} with vibrant shaders...`);
                enhanceInstanceWithVibrantShaders(instance);
            }
        });
    
    // Create main background canvas
    const mainCanvas = document.createElement('canvas');
    mainCanvas.id = 'enhanced-main-visualizer';
    mainCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1;
        pointer-events: none;
        background: transparent;
    `;
    document.body.insertBefore(mainCanvas, document.body.firstChild);
    
    // ===== CREATE 3 DISTINCT UI VISUALIZER INSTANCES =====
    
    // Instance 1: Main Background - Follows section geometry exactly
    const mainInstance = enhancedManager.addInstance(
        'vib3-main',
        mainCanvas,
        {
            geometry: 0, // Will change per section
            baseColor: [1.0, 0.0, 1.0], // Will change per section
            gridDensity: 12.0,
            morphFactor: 0.5,
            dimension: 3.5,
            glitchIntensity: 0.3,
            rotationSpeed: 0.5,
            latticeStyle: 1.0,
            intensity: 0.8,
            transitionDuration: 1200
        },
        {
            // Main instance derives ALL parameters from master
            derivation: {
                geometry: (master) => master, // EXACT geometry match
                baseColor: (master) => master, // EXACT color match
                gridDensity: (master) => master,
                morphFactor: (master) => master,
                dimension: (master) => master,
                glitchIntensity: (master) => master,
                rotationSpeed: (master) => master,
                intensity: (master) => master
            },
            eventReactions: {
                scroll: { affectedParams: ['gridDensity', 'morphFactor'], intensity: 0.3 },
                click: { affectedParams: ['dimension', 'rotationSpeed'], intensity: 0.5 }
            }
        }
    );
    
    // Create UI Canvas 1: Header Accent
    const headerCanvas = document.createElement('canvas');
    headerCanvas.id = 'vib3-header-visualizer';
    headerCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100px;
        z-index: 3;
        pointer-events: none;
        background: transparent;
        mix-blend-mode: overlay;
    `;
    document.body.insertBefore(headerCanvas, document.body.firstChild);
    
    // Instance 2: Header Accent - Fixed Tetrahedron with derived colors
    const headerInstance = enhancedManager.addInstance(
        'vib3-header',
        headerCanvas,
        {
            geometry: 1, // ALWAYS Tetrahedron (geometric precision)
            baseColor: [0.0, 1.0, 1.0], // Will derive from master
            gridDensity: 8.0,
            morphFactor: 0.7,
            dimension: 3.2,
            glitchIntensity: 0.2,
            rotationSpeed: 0.7,
            latticeStyle: 2.0,
            intensity: 0.6,
            transitionDuration: 800
        },
        {
            derivation: {
                // Header stays Tetrahedron but gets master colors
                geometry: () => 1, // ALWAYS Tetrahedron
                baseColor: (master) => [
                    master[0] * 0.7, // Derived from master
                    master[1] * 1.2, 
                    master[2] * 0.9
                ],
                gridDensity: (master) => master * 0.6, // Sparser for header
                intensity: (master) => master * 0.7
            }
        }
    );
    
    // Create UI Canvas 2: Content Accent with Visual Border
    const accentCanvas = document.createElement('canvas');
    accentCanvas.id = 'vib3-accent-visualizer';
    accentCanvas.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        height: 200px;
        z-index: 4;
        pointer-events: none;
        background: transparent;
        border-radius: 15px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        mix-blend-mode: screen;
        box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
    `;
    document.body.insertBefore(accentCanvas, document.body.firstChild);
    
    // Add instance labels for debugging
    const createInstanceLabel = (text, canvas) => {
        const label = document.createElement('div');
        label.textContent = text;
        label.style.cssText = `
            position: absolute;
            top: ${canvas.id === 'vib3-header-visualizer' ? '10px' : 'auto'};
            bottom: ${canvas.id === 'vib3-accent-visualizer' ? '205px' : 'auto'};
            right: ${canvas.id === 'vib3-accent-visualizer' ? '25px' : 'auto'};
            left: ${canvas.id === 'vib3-header-visualizer' ? '20px' : 'auto'};
            color: rgba(255, 255, 255, 0.6);
            font-size: 10px;
            font-family: monospace;
            z-index: 1000;
            pointer-events: none;
            background: rgba(0, 0, 0, 0.7);
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        document.body.appendChild(label);
    };
    
    createInstanceLabel('🎨 MAIN: Section Geometry', mainCanvas);
    createInstanceLabel('📱 HEADER: Fixed Tetrahedron', headerCanvas);
    createInstanceLabel('💎 ACCENT: Fixed Fractal', accentCanvas);
    
    // Instance 3: Accent Corner - Fixed Fractal with complementary colors
    const accentInstance = enhancedManager.addInstance(
        'vib3-accent',
        accentCanvas,
        {
            geometry: 5, // ALWAYS Fractal (complexity)
            baseColor: [0.5, 0.0, 1.0], // Will derive complementary
            gridDensity: 20.0,
            morphFactor: 0.6,
            dimension: 3.7,
            glitchIntensity: 0.6,
            rotationSpeed: 0.8,
            latticeStyle: 1.0,
            intensity: 0.9,
            transitionDuration: 600
        },
        {
            derivation: {
                // Accent always Fractal with complementary colors
                geometry: () => 5, // ALWAYS Fractal
                baseColor: (master) => [
                    1.0 - master[0], // Complementary color
                    1.0 - master[1],
                    master[2] * 1.3
                ],
                gridDensity: (master) => master * 1.5, // Denser for detail
                rotationSpeed: (master) => master * 1.2, // Faster for dynamism
                intensity: (master) => master * 1.1 // Slightly more intense
            }
        }
    );
    
    // Enhanced logo visualizer (if canvas exists)
    const logoCanvas = document.getElementById('logo-visualizer-canvas');
    let logoInstance = null;
    
    if (logoCanvas) {
        logoInstance = enhancedManager.addInstance(
            'enhanced-logo',
            logoCanvas,
            {
                geometry: 0, // Hypercube for logo
                baseColor: [1.0, 0.0, 1.0], // Magenta
                gridDensity: 25.0, // Very dense for small size
                morphFactor: 0.8,
                dimension: 3.8,
                glitchIntensity: 0.4,
                rotationSpeed: 0.8,
                latticeStyle: 1.0,
                intensity: 0.9,
                transitionDuration: 600
            },
            {
                derivation: {
                    // Logo stays vibrant regardless of master
                    intensity: () => 0.9,
                    gridDensity: () => 25.0, // Always dense
                    rotationSpeed: (master) => master * 1.5 // Extra dynamic
                },
                eventReactions: {
                    scroll: {
                        affectedParams: ['dimension', 'morphFactor'],
                        intensity: 0.4
                    },
                    click: {
                        affectedParams: ['glitchIntensity', 'rotationSpeed'],
                        intensity: 0.8
                    }
                }
            }
        );
        
        console.log('✅ Enhanced logo visualizer instance created');
    }
    
    // Connect to magazine router for section transitions
    if (typeof window.magazineRouter !== 'undefined') {
        console.log('🔗 Connecting enhanced visualizer to magazine router...');
        
        // Override the router's visualization handling
        const originalHandleRoute = window.magazineRouter.handleRouteChange;
        window.magazineRouter.handleRouteChange = function(themeKey) {
            console.log(`🎨 Enhanced route change to: ${themeKey}`);
            
            // Apply enhanced master style
            enhancedManager.applyMasterStyle(themeKey);
            
            // Call original handler for other effects
            if (originalHandleRoute) {
                originalHandleRoute.call(this, themeKey);
            }
        };
        
        // Set initial theme
        enhancedManager.applyMasterStyle('home');
        
    } else {
        console.log('⚠️ Magazine router not found, using manual section detection...');
        
        // Manual section detection with enhanced effects
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '-20% 0px -20% 0px'
        };
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    let themeKey = 'home';
                    
                    // Map section IDs to theme keys
                    const sectionThemeMap = {
                        'section-home': 'home',
                        'section-articles': 'articles',
                        'section-videos': 'videos',
                        'section-podcasts': 'podcasts',
                        'section-ema': 'ema'
                    };
                    
                    if (sectionThemeMap[sectionId]) {
                        themeKey = sectionThemeMap[sectionId];
                    }
                    
                    console.log(`🎨 Enhanced section change detected: ${themeKey}`);
                    enhancedManager.applyMasterStyle(themeKey);
                }
            });
        }, observerOptions);
        
        // Observe all sections
        document.querySelectorAll('[id^="section-"]').forEach(section => {
            sectionObserver.observe(section);
        });
        
        // Set initial theme
        enhancedManager.applyMasterStyle('home');
    }
    
    // Create live geometry indicator
    const geometryIndicator = document.createElement('div');
    geometryIndicator.id = 'geometry-indicator';
    geometryIndicator.style.cssText = `
        position: fixed;
        top: 120px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid rgba(0, 255, 255, 0.5);
        border-radius: 10px;
        padding: 10px;
        color: #ffffff;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
        min-width: 200px;
    `;
    geometryIndicator.innerHTML = `
        <div style="color: #ff00ff; font-weight: bold; margin-bottom: 5px;">🔮 GEOMETRY STATUS</div>
        <div>Current: <span id="current-geometry" style="color: #00ffff;">Hypercube</span></div>
        <div>Section: <span id="current-section" style="color: #ffff00;">HOME</span></div>
        <div style="margin-top: 8px; font-size: 10px; color: #888;">
            Click sections to see geometry change
        </div>
    `;
    document.body.appendChild(geometryIndicator);

    // Enhanced interaction feedback with geometry updates
    document.addEventListener('enhancedStyleTransitionComplete', (event) => {
        const styleKey = event.detail.styleKey;
        console.log(`✅ Enhanced style transition complete: ${styleKey}`);
        
        // Update geometry indicator
        const geometryNames = {
            home: 'Hypercube',
            articles: 'Tetrahedron', 
            videos: 'Sphere',
            podcasts: 'Torus',
            ema: 'Wave Function'
        };
        
        const currentGeometryEl = document.getElementById('current-geometry');
        const currentSectionEl = document.getElementById('current-section');
        
        if (currentGeometryEl) {
            currentGeometryEl.textContent = geometryNames[styleKey] || 'Unknown';
        }
        if (currentSectionEl) {
            currentSectionEl.textContent = styleKey.toUpperCase();
        }
        
        // Update any other UI indicators
        const currentThemeElements = document.querySelectorAll('[data-current-theme]');
        currentThemeElements.forEach(el => {
            el.textContent = styleKey.charAt(0).toUpperCase() + styleKey.slice(1);
        });
        
        console.log(`🔮 Geometry changed to: ${geometryNames[styleKey]} (${styleKey})`);
    });
    
    // Performance monitoring
    let frameCount = 0;
    let lastFPSCheck = Date.now();
    
    function checkPerformance() {
        frameCount++;
        const now = Date.now();
        
        if (now - lastFPSCheck > 5000) { // Check every 5 seconds
            const fps = (frameCount * 1000) / (now - lastFPSCheck);
            
            if (fps < 30) {
                console.warn(`⚠️ Enhanced visualizer performance warning: ${fps.toFixed(1)} FPS`);
                
                // Auto-reduce quality if needed
                Object.values(enhancedManager.instances).forEach(instance => {
                    if (instance.currentComputedConfig) {
                        instance.currentComputedConfig.gridDensity *= 0.8;
                        instance.currentComputedConfig.intensity *= 0.9;
                    }
                });
            }
            
            frameCount = 0;
            lastFPSCheck = now;
        }
        
        requestAnimationFrame(checkPerformance);
    }
    
    checkPerformance();
    
    console.log('✅ Enhanced VIB3CODE 3-Instance UI System Initialized');
    console.log('🎯 3 Distinct Visualizer Instances:');
    console.log('   🎨 MAIN: Section-responsive geometry (Hypercube→Tetrahedron→Sphere→Torus→Wave)');
    console.log('   📱 HEADER: Fixed Tetrahedron with derived colors (100px height)');
    console.log('   💎 ACCENT: Fixed Fractal with complementary colors (bottom-right corner)');
    console.log('   🔮 LOGO: Enhanced logo window (if present)');
    console.log('');
    console.log('🔄 Section Geometry Mapping:');
    console.log('   • HOME: Hypercube (Magenta) - Digital sovereignty');
    console.log('   • ARTICLES: Tetrahedron (Cyan) - Technical precision');
    console.log('   • VIDEOS: Sphere (Pink) - Infinite potential');
    console.log('   • PODCASTS: Torus (Green) - Continuous flow');
    console.log('   • EMA: Wave Function (Yellow) - Probability spaces');
    
    // Enhanced debugging interface
    window.debugEnhancedVisualizer = {
        manager: enhancedManager,
        instances: {
            main: mainInstance,
            header: headerInstance, 
            accent: accentInstance,
            logo: logoInstance
        },
        applyTheme: (themeKey) => {
            console.log(`🎨 Applying theme: ${themeKey.toUpperCase()}`);
            enhancedManager.applyMasterStyle(themeKey);
        },
        testSectionTransitions: () => {
            console.log('🧪 Testing all section transitions...');
            const sections = ['home', 'articles', 'videos', 'podcasts', 'ema'];
            let i = 0;
            const cycle = () => {
                if (i < sections.length) {
                    console.log(`→ ${sections[i].toUpperCase()}: geometry ${enhancedManager.masterStylePresets[sections[i]].geometry}`);
                    enhancedManager.applyMasterStyle(sections[i]);
                    i++;
                    setTimeout(cycle, 2000);
                } else {
                    console.log('🏠 Back to HOME');
                    enhancedManager.applyMasterStyle('home');
                }
            };
            cycle();
        }
    };
    
});