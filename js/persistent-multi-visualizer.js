/**
 * PERSISTENT MULTI-VISUALIZER SYSTEM
 * 
 * 3-4 visualizer instances that run continuously and morph their parameters
 * based on navigation events. Creates smooth "portal" transitions between
 * sections by transitioning geometry, colors, and effects smoothly.
 */

class VisualizerManager {
    constructor() {
        this.instances = {};
        
        this.currentMasterStyleKey = 'home';
        this.transitionDuration = 1000; // 1 second transitions
        this.isTransitioning = false;
        
        // Section configuration presets
        this.masterStylePresets = {
            home: {
                geometry: 0, // Hypercube
                baseColor: [1.0, 0.0, 1.0], // Magenta
                gridDensity: 12.0,
                morphFactor: 0.5,
                dimension: 3.5,
                glitchIntensity: 0.3,
                rotationSpeed: 0.5,
                latticeStyle: 'hybrid'
            },
            articles: {
                geometry: 1, // Tetrahedron
                baseColor: [0.0, 1.0, 1.0], // Cyan
                gridDensity: 16.0,
                morphFactor: 0.2,
                dimension: 3.0,
                glitchIntensity: 0.1,
                rotationSpeed: 0.3,
                latticeStyle: 'wireframe'
            },
            videos: {
                geometry: 2, // Sphere
                baseColor: [1.0, 0.2, 0.4], // Pink-red
                gridDensity: 15.0,
                morphFactor: 0.7,
                dimension: 3.8,
                glitchIntensity: 0.2,
                rotationSpeed: 0.4,
                latticeStyle: 'solid'
            },
            podcasts: {
                geometry: 3, // Torus
                baseColor: [1.0, 0.5, 0.0], // Orange
                gridDensity: 10.0,
                morphFactor: 0.6,
                dimension: 3.3,
                glitchIntensity: 0.4,
                rotationSpeed: 0.6,
                latticeStyle: 'hybrid'
            },
            ema: {
                geometry: 5, // Fractal
                baseColor: [0.5, 0.0, 1.0], // Purple
                gridDensity: 20.0,
                morphFactor: 0.9,
                dimension: 3.6,
                glitchIntensity: 0.6,
                rotationSpeed: 0.2,
                latticeStyle: 'hybrid'
            }
        };
        
        this.globalVelocityState = {
            mouseVelocity: 0,
            scrollVelocity: 0,
            lastMouseX: 0,
            lastMouseY: 0,
            lastTime: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupGlobalTracking();
        this.setupNavigationListener(); // Or its future equivalent applyMasterStyle
    }
    
    setupGlobalTracking() {
        // Track mouse velocity globally
        document.addEventListener('mousemove', (e) => {
            const now = performance.now();
            const deltaTime = now - this.globalVelocityState.lastTime;
            
            if (deltaTime > 0) {
                const deltaX = e.clientX - this.globalVelocityState.lastMouseX;
                const deltaY = e.clientY - this.globalVelocityState.lastMouseY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                this.globalVelocityState.mouseVelocity = distance / deltaTime;
                this.globalVelocityState.lastMouseX = e.clientX;
                this.globalVelocityState.lastMouseY = e.clientY;
                this.globalVelocityState.lastTime = now;
            }
        });
        
        // Track scroll velocity
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            this.globalVelocityState.scrollVelocity = Math.abs(currentScrollY - lastScrollY);
            lastScrollY = currentScrollY;
            
            setTimeout(() => {
                this.globalVelocityState.scrollVelocity *= 0.8;
            }, 100);
        });
    }
    
    setupNavigationListener() {
        // Listen for section changes
        document.addEventListener('sectionChange', (event) => {
            const newSection = event.detail.section;
            this.applyMasterStyle(newSection);
        });
        
        // Also listen for navigation clicks
        document.addEventListener('click', (event) => {
            const navLink = event.target.closest('[data-section]');
            if (navLink) {
                const section = navLink.getAttribute('data-section');
                this.applyMasterStyle(section);
            }
        });
    }

    addInstance(id, canvasElement, initialConfig, rules, globalVelocityStateRef) {
        if (!canvasElement) {
            console.error(`VisualizerManager: Canvas element not provided for instance ID '${id}'.`);
            return null;
        }
        if (this.instances[id]) {
            console.warn(`VisualizerManager: Instance with ID '${id}' already exists. Overwriting.`);
            this.instances[id].stop(); // Stop existing if any
        }
        try {
            const newInstance = new ManagedVisualizer(
                canvasElement, // Pass the actual canvas element
                initialConfig,
                globalVelocityStateRef
            );
            newInstance.id = id; // Assign the ID to the instance for reference
            newInstance.rules = rules || {}; // Store rules for later use
            this.instances[id] = newInstance;
            console.log(`VisualizerManager: Added instance '${id}'.`);
            return newInstance;
        } catch (error) {
            console.error(`VisualizerManager: Error creating ManagedVisualizer for ID '${id}':`, error);
            return null;
        }
    }

    removeInstance(id) {
        if (this.instances[id]) {
            this.instances[id].stop();
            // Potentially also clean up canvas if manager was responsible, though now it's passed in.
            delete this.instances[id];
            console.log(`VisualizerManager: Removed instance '${id}'.`);
        } else {
            console.warn(`VisualizerManager: Instance with ID '${id}' not found for removal.`);
        }
    }

    getInstance(id) {
        return this.instances[id] || null;
    }
    
    applyMasterStyle(styleKey) { // Renamed from transitionToSection
        if (this.isTransitioning || this.currentMasterStyleKey === styleKey) {
            return;
        }
        
        console.log(`VisualizerManager: Applying master style: ${styleKey}`); // Updated log
        
        this.isTransitioning = true;
        const targetConfig = this.masterStylePresets[styleKey]; // Use new property name
        
        if (!targetConfig) {
            console.error(`VisualizerManager: Unknown master style key: ${styleKey}`); // Updated log
            this.isTransitioning = false;
            return;
        }
        
        // Create smooth transitions for all visualizers
        // const transitions = Object.keys(this.instances).map(instanceId => { // Old way
        //     const visualizer = this.instances[instanceId];
        //     if (visualizer) {
        //         return this.smoothTransition(visualizer, targetConfig, instanceId); // This method is removed
        //     }
        //     return Promise.resolve();
        // });

        const transitionPromises = Object.values(this.instances).map(instance => {
            if (instance && typeof instance.updateWithNewMaster === 'function') {
                // Pass the masterConfig and the instance's own rules
                return instance.updateWithNewMaster(targetConfig); // masterIntensity argument removed
            }
            return Promise.resolve();
        });
        
        Promise.all(transitionPromises).then(() => {
            this.currentMasterStyleKey = styleKey; // Use new property name
            this.isTransitioning = false;
            console.log(`VisualizerManager: Master style '${styleKey}' application complete for all instances.`); // Updated log
            
            // Dispatch completion event for text animations
            document.dispatchEvent(new CustomEvent('masterStyleTransitionComplete', { // Updated event name
                detail: { styleKey: styleKey } // Updated detail
            }));
        }).catch(err => {
            console.error("VisualizerManager: Error during instance transitions: ", err);
            this.isTransitioning = false; // Unlock even if some fail
        });
    }
    
    // Public API for external control
    getCurrentMasterStyleKey() { // Renamed method
        return this.currentMasterStyleKey; // Use new property name
    }
    
    isInTransition() {
        return this.isTransitioning;
    }
    
    getVisualizer(instanceId) { // Parameter name changed for clarity, was 'layer'
        return this.instances[instanceId];
    }

    propagateGlobalEffect(effectType, effectParams) {
        console.log(`VisualizerManager: Propagating global effect '${effectType}' to all instances.`);
        Object.values(this.instances).forEach(instance => {
            if (instance && typeof instance.applyGlobalEffect === 'function') {
                instance.applyGlobalEffect(effectType, effectParams);
            }
        });
    }
}

class ManagedVisualizer {
    constructor(canvasElement, config, globalVelocityState) {
        this.canvas = canvasElement;
        this.rules = {}; // Will be set by addInstance
        this.baseConfig = config; // Renamed from this.config
        this.currentComputedConfig = { ...this.baseConfig }; // Initialize currentComputedConfig
        this.globalVelocityState = globalVelocityState;
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.time = 0;
        this.animationId = null;
        this.transitionDuration = this.baseConfig.transitionDuration || 1000; // Default transition duration for instance
        
        this.init();
    }
    
    init() {
        this.setupShaders();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.start();
    }
    
    setupShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec3 u_baseColor;
            uniform float u_gridDensity;
            uniform float u_morphFactor;
            uniform float u_dimension;
            uniform float u_glitchIntensity;
            uniform float u_rotationSpeed;
            uniform float u_geometry;
            uniform float u_intensity;
            uniform float u_latticeStyle;
            
            // Multi-geometry system (same as before)
            float hypercubeLattice(vec3 p, float gridSize, float style) {
                vec3 grid = fract(p * gridSize);
                vec3 edges = 1.0 - smoothstep(0.0, 0.05, abs(grid - 0.5));
                float lattice = max(max(edges.x, edges.y), edges.z);
                
                if (style < 0.5) return lattice;
                else if (style < 1.5) return lattice * 0.7 + 0.3;
                else return lattice * 0.8 + 0.2;
            }
            
            float tetrahedronLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float d1 = length(q);
                float d2 = length(q - vec3(0.5, 0.0, 0.0));
                float d3 = length(q - vec3(0.0, 0.5, 0.0));
                float d4 = length(q - vec3(0.0, 0.0, 0.5));
                float minDist = min(min(d1, d2), min(d3, d4));
                
                if (style < 0.5) {
                    vec3 edges = abs(q);
                    float edgeField = min(min(edges.x, edges.y), edges.z);
                    return 1.0 - smoothstep(0.0, 0.05, edgeField) * smoothstep(0.0, 0.2, minDist);
                } else if (style < 1.5) {
                    return 1.0 - smoothstep(0.1, 0.3, minDist);
                } else {
                    vec3 edges = abs(q);
                    float edgeField = min(min(edges.x, edges.y), edges.z);
                    float solidField = 1.0 - smoothstep(0.1, 0.2, minDist);
                    float wireField = 1.0 - smoothstep(0.0, 0.03, edgeField);
                    return max(solidField * 0.6, wireField);
                }
            }
            
            float sphereLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float r = length(q);
                float lattice = 1.0 - smoothstep(0.2, 0.5, r);
                
                if (style < 0.5) return lattice * 0.6;
                else if (style < 1.5) return lattice;
                else return lattice * 0.8 + 0.1;
            }
            
            float torusLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float r1 = sqrt(q.x*q.x + q.y*q.y);
                float r2 = sqrt((r1 - 0.3)*(r1 - 0.3) + q.z*q.z);
                float lattice = 1.0 - smoothstep(0.0, 0.1, r2);
                
                if (style < 0.5) return lattice * 0.7;
                else if (style < 1.5) return lattice;
                else return lattice * 0.85 + 0.1;
            }
            
            float fractalLattice(vec3 p, float gridSize, float style) {
                vec3 q = p * gridSize;
                float scale = 1.0;
                float fractal = 0.0;
                for(int i = 0; i < 4; i++) {
                    q = fract(q) - 0.5;
                    fractal += abs(length(q)) / scale;
                    scale *= 2.0;
                    q *= 2.0;
                }
                float lattice = 1.0 - smoothstep(0.0, 1.0, fractal);
                
                if (style < 0.5) return lattice * 0.5;
                else if (style < 1.5) return lattice * 0.8;
                else return lattice * 0.7 + 0.2;
            }
            
            float getGeometryLattice(vec3 p, float gridSize, float geomType, float style) {
                if (geomType < 0.5) return hypercubeLattice(p, gridSize, style);
                else if (geomType < 1.5) return tetrahedronLattice(p, gridSize, style);
                else if (geomType < 2.5) return sphereLattice(p, gridSize, style);
                else if (geomType < 3.5) return torusLattice(p, gridSize, style);
                else return fractalLattice(p, gridSize, style);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspectRatio = u_resolution.x / u_resolution.y;
                uv.x *= aspectRatio;
                
                vec3 p = vec3(uv - 0.5, 0.0);
                
                // Subtle rotation
                float timeRotation = u_time * u_rotationSpeed * u_intensity * 0.3;
                mat2 rotation = mat2(cos(timeRotation), -sin(timeRotation), sin(timeRotation), cos(timeRotation));
                p.xy = rotation * p.xy;
                
                // Get lattice value
                float lattice = getGeometryLattice(p, u_gridDensity, u_geometry, u_latticeStyle);
                
                // Subtle glitch effects
                float glitch = u_glitchIntensity * u_intensity * 0.2;
                
                // Final color
                vec3 color = u_baseColor * lattice;
                color *= (1.0 + glitch * sin(u_time * 10.0) * 0.1);
                
                gl_FragColor = vec4(color, lattice * u_intensity);
            }
        `;
        
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        // Setup geometry
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Get uniform locations
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            baseColor: this.gl.getUniformLocation(this.program, 'u_baseColor'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            dimension: this.gl.getUniformLocation(this.program, 'u_dimension'),
            glitchIntensity: this.gl.getUniformLocation(this.program, 'u_glitchIntensity'),
            rotationSpeed: this.gl.getUniformLocation(this.program, 'u_rotationSpeed'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            latticeStyle: this.gl.getUniformLocation(this.program, 'u_latticeStyle')
        };
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    updateConfig(newConfig) {
        this.currentComputedConfig = { ...this.currentComputedConfig, ...newConfig };
    }

    updateWithNewMaster(masterConfig) { // masterIntensity argument removed
        const pDerivRules = (this.rules && this.rules.parameterDerivation) ? this.rules.parameterDerivation : {};
        let finalTargetConfig = {};

        // Helper to safely get values
        const getValue = (paramKey, masterVal, baseVal, currentVal, defaultVal) => {
            if (pDerivRules[paramKey] === 'fixed' && baseVal !== undefined) {
                return baseVal;
            } else if (pDerivRules[paramKey] && typeof pDerivRules[paramKey].multiplierRelativeToMaster === 'number' && masterVal !== undefined) {
                return masterVal * pDerivRules[paramKey].multiplierRelativeToMaster;
            } else if (pDerivRules[paramKey] && pDerivRules[paramKey].colorOverride) { // Specific for baseColor
                return [...pDerivRules[paramKey].colorOverride];
            }
            return masterVal !== undefined ? masterVal : (currentVal !== undefined ? currentVal : defaultVal);
        };

        // Geometry
        finalTargetConfig.geometry = getValue('geometry', masterConfig.geometry, this.baseConfig.geometry, this.currentComputedConfig.geometry, 0);

        // BaseColor
        const defaultColor = [1,1,1];
        let derivedBaseColor = getValue('baseColor', masterConfig.baseColor, this.baseConfig.baseColor, this.currentComputedConfig.baseColor, defaultColor);
        // Ensure baseColor is an array, especially if coming from masterConfig or baseConfig directly
        finalTargetConfig.baseColor = Array.isArray(derivedBaseColor) ? [...derivedBaseColor] : defaultColor;


        // Intensity
        finalTargetConfig.intensity = getValue('intensity', masterConfig.intensity, this.baseConfig.intensity, this.currentComputedConfig.intensity, 0.1);

        // GridDensity
        finalTargetConfig.gridDensity = getValue('gridDensity', masterConfig.gridDensity, this.baseConfig.gridDensity, this.currentComputedConfig.gridDensity, 10.0);

        // MorphFactor
        finalTargetConfig.morphFactor = getValue('morphFactor', masterConfig.morphFactor, this.baseConfig.morphFactor, this.currentComputedConfig.morphFactor, 0.5);

        // Dimension
        finalTargetConfig.dimension = getValue('dimension', masterConfig.dimension, this.baseConfig.dimension, this.currentComputedConfig.dimension, 3.0);

        // GlitchIntensity
        finalTargetConfig.glitchIntensity = getValue('glitchIntensity', masterConfig.glitchIntensity, this.baseConfig.glitchIntensity, this.currentComputedConfig.glitchIntensity, 0.0);

        // RotationSpeed
        finalTargetConfig.rotationSpeed = getValue('rotationSpeed', masterConfig.rotationSpeed, this.baseConfig.rotationSpeed, this.currentComputedConfig.rotationSpeed, 0.5);

        // LatticeStyle
        finalTargetConfig.latticeStyle = getValue('latticeStyle', masterConfig.latticeStyle, this.baseConfig.latticeStyle, this.currentComputedConfig.latticeStyle, 'hybrid');

        // ReactivityConfig - merge master's with base's, base taking precedence for specific reactivity params
        finalTargetConfig.reactivityConfig = {
            ...(masterConfig.reactivityConfig || {}),
            ...(this.baseConfig.reactivityConfig || {})
        };
        // If a rule specifically sets reactivityConfig to 'fixed', it would use only baseConfig.reactivityConfig
        if (pDerivRules.reactivityConfig === 'fixed' && this.baseConfig.reactivityConfig) {
            finalTargetConfig.reactivityConfig = { ...this.baseConfig.reactivityConfig };
        }


        // console.log(`Instance ${this.id}: Master:`, masterConfig, `Base:`, this.baseConfig, `Rules:`, this.rules, `Computed Target:`, finalTargetConfig);
        return this.smoothTransition(finalTargetConfig); // Return the promise
    }

    smoothTransition(targetConfig) { // visualizer and layer params removed
        return new Promise((resolve) => {
            const startTime = performance.now();
            // Use this instance's current config as the starting point
            const startConfig = { ...this.currentComputedConfig };

            // targetConfig is now the fully computed specific config for this instance

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                // Use this.transitionDuration, ensure it's set in ManagedVisualizer or passed in
                const progress = Math.min(elapsed / this.transitionDuration, 1);
                const ease = this.easeInOutCubic(progress);
                const newConfig = this.interpolateConfig(startConfig, targetConfig, ease);
                this.updateConfig(newConfig); // updateConfig updates this.currentComputedConfig

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure final state is exactly targetConfig
                    this.updateConfig(targetConfig);
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    interpolateConfig(start, end, progress) {
        const result = {};

        // Interpolate numeric values
        for (const key in end) {
            if (typeof end[key] === 'number' && typeof start[key] === 'number') {
                result[key] = start[key] + (end[key] - start[key]) * progress;
            } else if (Array.isArray(end[key]) && Array.isArray(start[key])) {
                // Interpolate color arrays
                result[key] = start[key].map((startVal, index) =>
                    startVal + (end[key][index] - startVal) * progress
                );
            } else {
                // For non-numeric values (like latticeStyle), switch at midpoint
                result[key] = progress < 0.5 ? start[key] : end[key];
            }
        }

        return result;
    }

    applyGlobalEffect(effectType, effectParams) {
        console.log(`Instance ${this.id}: Applying global effect '${effectType}' with params:`, effectParams);
        let needsImmediateRenderUpdate = false; // Flag if a non-transitioning change is made

        switch (effectType) {
            case 'INVERT_COLORS':
                if (this.currentComputedConfig.baseColor) {
                    this.currentComputedConfig.baseColor = this.currentComputedConfig.baseColor.map(c => 1.0 - c);
                    needsImmediateRenderUpdate = true;
                }
                break;
            case 'MULTIPLY_GRID_DENSITY':
                if (effectParams && typeof effectParams.factor === 'number') {
                    this.currentComputedConfig.gridDensity *= effectParams.factor;
                    needsImmediateRenderUpdate = true;
                }
                break;
            case 'CYCLE_GEOMETRY':
                // Assuming 5 geometries, indexed 0-4, as per current shader comments (Hypercube to Fractal)
                // If more are added to shader, this maxGeomIndex needs update.
                const maxGeomIndex = 4; // Hypercube, Tetrahedron, Sphere, Torus, Fractal
                this.currentComputedConfig.geometry = (this.currentComputedConfig.geometry + 1) % (maxGeomIndex + 1);
                needsImmediateRenderUpdate = true;
                break;
            // Add more cases here, e.g., for swapping parameters if effectParams includes another instance's config
            default:
                console.warn(`Instance ${this.id}: Unknown global effectType '${effectType}'`);
                return;
        }

        if (needsImmediateRenderUpdate) {
            // For immediate changes not going through smoothTransition,
            // the existing render loop will pick up changes to currentComputedConfig.
            // If a transition is desired for a global effect, this method could call smoothTransition.
            console.log(`Instance ${this.id}: Updated config for effect '${effectType}', new gridDensity: ${this.currentComputedConfig.gridDensity}, new geometry: ${this.currentComputedConfig.geometry}`);
        }
    }
    
    render() {
        this.time = performance.now() * 0.001;
        
        // Calculate velocity influence
        const mouseVel = Math.min(this.globalVelocityState.mouseVelocity * 0.1, 1.0);
        const scrollVel = Math.min(this.globalVelocityState.scrollVelocity * 0.1, 1.0);
        const velocityInfluence = (mouseVel + scrollVel) * this.currentComputedConfig.intensity;
        
        // Clear
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Enable blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        this.gl.useProgram(this.program);
        
        // Set uniforms
        const rConfig = this.currentComputedConfig.reactivityConfig || {};

        // Helper to parse reactivity value which can be number or {multiplier, direction} object
        function parseReactivityRule(ruleValue, defaultMultiplier) {
            let multiplier = defaultMultiplier;
            let direction = 1; // 1 for direct, -1 for inverse

            if (typeof ruleValue === 'number') {
                multiplier = ruleValue;
            } else if (typeof ruleValue === 'object' && ruleValue !== null) {
                multiplier = (ruleValue.multiplier !== undefined) ? ruleValue.multiplier : defaultMultiplier;
                if (ruleValue.direction === 'inverse') {
                    direction = -1;
                }
            }
            return { multiplier, direction };
        }

        const gridDensityRule = parseReactivityRule(rConfig.gridDensityFromVelocity, 2.0);
        const glitchRule = parseReactivityRule(rConfig.glitchFromMouseVelocity, 0.05);
        const rotationRule = parseReactivityRule(rConfig.rotationFromScrollVelocity, 0.1);
        const intensityRule = parseReactivityRule(rConfig.intensityFromVelocity, 1.0);

        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform3fv(this.uniforms.baseColor, this.currentComputedConfig.baseColor || [1,1,1]);

        const currentGridDensity = this.currentComputedConfig.gridDensity || 0;
        this.gl.uniform1f(this.uniforms.gridDensity, currentGridDensity + velocityInfluence * gridDensityRule.multiplier * gridDensityRule.direction);

        this.gl.uniform1f(this.uniforms.morphFactor, this.currentComputedConfig.morphFactor || 0.5);
        this.gl.uniform1f(this.uniforms.dimension, this.currentComputedConfig.dimension || 3.0);

        const currentGlitchIntensity = this.currentComputedConfig.glitchIntensity || 0;
        this.gl.uniform1f(this.uniforms.glitchIntensity, currentGlitchIntensity + mouseVel * glitchRule.multiplier * glitchRule.direction);

        const currentRotationSpeed = this.currentComputedConfig.rotationSpeed || 0;
        this.gl.uniform1f(this.uniforms.rotationSpeed, currentRotationSpeed + scrollVel * rotationRule.multiplier * rotationRule.direction);

        this.gl.uniform1f(this.uniforms.geometry, this.currentComputedConfig.geometry || 0);

        const currentIntensity = this.currentComputedConfig.intensity || 0;
        this.gl.uniform1f(this.uniforms.intensity, currentIntensity + velocityInfluence * intensityRule.multiplier * intensityRule.direction);
        
        // Set lattice style
        const latticeStyleMap = { wireframe: 0.0, solid: 1.0, hybrid: 2.0 };
        this.gl.uniform1f(this.uniforms.latticeStyle, latticeStyleMap[this.currentComputedConfig.latticeStyle] || 0.0);
        
        // Draw
        const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        this.animationId = requestAnimationFrame(() => this.render());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    start() {
        if (!this.animationId) {
            this.render();
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Global instance
window.visualizerManager = new VisualizerManager();