/**
 * Enhanced Multi-Instance Visualizer System
 * Integrates vibrant shaders from VIB3CODE reference demo
 * with the adaptive multi-instance architecture
 */

console.log('🎨 Loading Enhanced Multi-Instance Visualizer System...');

class EnhancedVisualizerManager {
    constructor() {
        console.log('🎨 Initializing Enhanced VisualizerManager...');
        
        this.instances = {};
        this.currentMasterStyleKey = 'home';
        this.isTransitioning = false;
        
        // Enhanced master style presets with SECTION-SPECIFIC GEOMETRIES
        this.masterStylePresets = {
            home: {
                baseColor: [1.0, 0.0, 1.0], // Magenta - Digital sovereignty
                gridDensity: 12.0,
                morphFactor: 0.5,
                dimension: 3.5,
                glitchIntensity: 0.3,
                rotationSpeed: 0.5,
                intensity: 0.8,
                geometry: 0, // Hypercube - Core identity
                latticeStyle: 1.0,
                interactionMultiplier: 1.0
            },
            articles: {
                baseColor: [0.0, 1.0, 1.0], // Cyan - Technical precision  
                gridDensity: 8.0,
                morphFactor: 0.7,
                dimension: 3.2,
                glitchIntensity: 0.2,
                rotationSpeed: 0.7,
                intensity: 0.9,
                geometry: 1, // Tetrahedron - Structural precision
                latticeStyle: 2.0,
                interactionMultiplier: 0.8
            },
            videos: {
                baseColor: [1.0, 0.0, 0.5], // Pink-red - Dynamic content
                gridDensity: 15.0,
                morphFactor: 0.3,
                dimension: 3.8,
                glitchIntensity: 0.1,
                rotationSpeed: 0.3,
                intensity: 0.7,
                geometry: 2, // Sphere - Infinite potential
                latticeStyle: 1.0,
                interactionMultiplier: 1.2
            },
            podcasts: {
                baseColor: [0.0, 1.0, 0.0], // Green - Flow and growth
                gridDensity: 10.0,
                morphFactor: 0.8,
                dimension: 3.6,
                glitchIntensity: 0.4,
                rotationSpeed: 0.6,
                intensity: 0.85,
                geometry: 3, // Torus - Continuous flow
                latticeStyle: 1.0,
                interactionMultiplier: 0.9
            },
            ema: {
                baseColor: [1.0, 1.0, 0.0], // Yellow - Freedom and liberation
                gridDensity: 16.0,
                morphFactor: 0.4,
                dimension: 3.3,
                glitchIntensity: 0.3,
                rotationSpeed: 0.9,
                intensity: 1.0,
                geometry: 6, // Wave function - Probability spaces
                latticeStyle: 1.0,
                interactionMultiplier: 1.1
            }
        };
        
        this.globalVelocity = { x: 0, y: 0, scroll: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.lastScrollY = 0;
        this.lastTime = Date.now();
        
        this.setupGlobalInteractions();
        
        console.log('✅ Enhanced VisualizerManager initialized');
    }
    
    setupGlobalInteractions() {
        // Mouse velocity tracking
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            const deltaTime = now - this.lastTime;
            
            if (deltaTime > 0) {
                this.globalVelocity.x = (e.clientX - this.lastMousePos.x) / deltaTime * 100;
                this.globalVelocity.y = (e.clientY - this.lastMousePos.y) / deltaTime * 100;
                
                this.lastMousePos.x = e.clientX;
                this.lastMousePos.y = e.clientY;
                this.lastTime = now;
            }
        });
        
        // Scroll velocity tracking
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const deltaTime = now - this.lastTime;
            const currentY = window.scrollY;
            
            if (deltaTime > 0) {
                this.globalVelocity.scroll = Math.abs(currentY - this.lastScrollY) / deltaTime * 100;
                this.lastScrollY = currentY;
                this.lastTime = now;
            }
        });
    }
    
    addInstance(id, canvas, baseConfig, rules = {}) {
        if (this.instances[id]) {
            console.warn(`EnhancedVisualizerManager: Instance '${id}' already exists. Replacing.`);
            this.instances[id].stop();
        }
        
        this.instances[id] = new EnhancedManagedVisualizer(id, canvas, baseConfig, rules, this);
        console.log(`EnhancedVisualizerManager: Added instance '${id}'.`);
        
        return this.instances[id];
    }
    
    removeInstance(id) {
        if (this.instances[id]) {
            this.instances[id].stop();
            delete this.instances[id];
            console.log(`EnhancedVisualizerManager: Removed instance '${id}'.`);
        }
    }
    
    getInstance(id) {
        return this.instances[id] || null;
    }
    
    applyMasterStyle(styleKey) {
        if (this.isTransitioning || this.currentMasterStyleKey === styleKey) {
            return;
        }
        
        console.log(`🎨 Applying enhanced master style: ${styleKey}`);
        
        this.isTransitioning = true;
        const targetConfig = this.masterStylePresets[styleKey];
        
        if (!targetConfig) {
            console.error(`EnhancedVisualizerManager: Unknown style key: ${styleKey}`);
            this.isTransitioning = false;
            return;
        }
        
        const transitionPromises = Object.values(this.instances).map(instance => {
            if (instance && typeof instance.updateWithNewMaster === 'function') {
                return instance.updateWithNewMaster(targetConfig);
            }
            return Promise.resolve();
        });
        
        Promise.all(transitionPromises).then(() => {
            this.currentMasterStyleKey = styleKey;
            this.isTransitioning = false;
            console.log(`✅ Enhanced master style '${styleKey}' applied to all instances`);
            
            document.dispatchEvent(new CustomEvent('enhancedStyleTransitionComplete', {
                detail: { styleKey: styleKey }
            }));
        }).catch(err => {
            console.error("EnhancedVisualizerManager: Error during transitions:", err);
            this.isTransitioning = false;
        });
    }
    
    getCurrentMasterStyleKey() {
        return this.currentMasterStyleKey;
    }
    
    isInTransition() {
        return this.isTransitioning;
    }
}

class EnhancedManagedVisualizer {
    constructor(id, canvas, baseConfig, rules, manager) {
        this.id = id;
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        this.manager = manager;
        
        if (!this.gl) {
            console.error('Enhanced WebGL not supported');
            return;
        }
        
        this.baseConfig = { ...baseConfig };
        this.rules = { ...rules };
        this.currentComputedConfig = { ...baseConfig };
        
        // Enhanced interaction state
        this.interactionState = {
            type: 'idle',
            intensity: 0,
            lastActivity: Date.now(),
            holdStart: 0,
            isHolding: false,
            mouseX: 0.5,
            mouseY: 0.5
        };
        
        this.time = 0;
        this.animationId = null;
        this.transitionDuration = this.baseConfig.transitionDuration || 1000;
        
        this.init();
    }
    
    init() {
        this.setupEnhancedShaders();
        this.resize();
        this.setupInteractions();
        window.addEventListener('resize', () => this.resize());
        this.start();
    }
    
    setupEnhancedShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Enhanced fragment shader with vibrant effects from reference demo
        const fragmentShaderSource = `
            precision highp float;
            
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
            uniform vec2 u_mouse;
            uniform float u_interactionIntensity;
            
            // 4D rotation matrices for dimensional effects
            mat4 rotateXW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c);
            }
            
            mat4 rotateYW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c);
            }
            
            mat4 rotateZW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c);
            }
            
            vec3 project4Dto3D(vec4 p) {
                float w = 2.0 / (2.0 + p.w);
                return vec3(p.x * w, p.y * w, p.z * w);
            }
            
            // Enhanced geometry generators with vibrant spiral effects
            float hypercubeLattice(vec3 p, float gridSize, float style) {
                vec3 grid = fract(p * gridSize);
                vec3 edges = 1.0 - smoothstep(0.0, 0.03, abs(grid - 0.5));
                float lattice = max(max(edges.x, edges.y), edges.z);
                
                // Add spiral tunnel effects
                float spiral = sin(length(p) * 8.0 + u_time * 2.0) * 0.5 + 0.5;
                float tunnel = 1.0 / (1.0 + length(p) * 2.0);
                
                return lattice * (0.6 + 0.4 * spiral) * (0.8 + 0.2 * tunnel);
            }
            
            float tetrahedronLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float d1 = length(q);
                float d2 = length(q - vec3(0.5, 0.0, 0.0));
                float d3 = length(q - vec3(0.0, 0.5, 0.0));
                float d4 = length(q - vec3(0.0, 0.0, 0.5));
                float minDist = min(min(d1, d2), min(d3, d4));
                
                float lattice = 1.0 - smoothstep(0.0, 0.1, minDist);
                
                // Enhanced geometric precision with flowing effects
                float flow = sin(p.x * 6.0 + u_time) * cos(p.y * 6.0 + u_time * 0.7) * 0.3 + 0.7;
                return lattice * flow;
            }
            
            float sphereLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float r = length(q);
                float lattice = 1.0 - smoothstep(0.2, 0.5, r);
                
                // Infinite potential with radial gradients
                float radial = sin(r * 12.0 + u_time * 3.0) * 0.4 + 0.6;
                float pulse = 0.9 + 0.1 * sin(u_time * 2.0);
                
                return lattice * radial * pulse;
            }
            
            float torusLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float r1 = sqrt(q.x*q.x + q.y*q.y);
                float r2 = sqrt((r1 - 0.3)*(r1 - 0.3) + q.z*q.z);
                float lattice = 1.0 - smoothstep(0.0, 0.1, r2);
                
                // Flow patterns for content streams
                float angle = atan(q.y, q.x);
                float flow = sin(angle * 4.0 + u_time * 2.0) * 0.3 + 0.7;
                
                return lattice * flow;
            }
            
            float kleinLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize);
                float u = q.x * 2.0 * 3.14159;
                float v = q.y * 2.0 * 3.14159;
                float x = cos(u) * (3.0 + cos(u/2.0) * sin(v) - sin(u/2.0) * sin(2.0*v));
                float klein = length(vec2(x, q.z)) - 0.1;
                
                float lattice = 1.0 - smoothstep(0.0, 0.05, abs(klein));
                float topology = sin(u + v + u_time) * 0.2 + 0.8;
                
                return lattice * topology;
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
                
                // Recursive complexity visualization
                float complexity = sin(fractal * 4.0 + u_time) * 0.3 + 0.7;
                return lattice * complexity;
            }
            
            float waveLattice(vec3 p, float gridSize, float style) {
                vec3 q = p * gridSize;
                float wave = sin(q.x * 2.0) * sin(q.y * 2.0) * sin(q.z * 2.0 + u_time);
                float lattice = smoothstep(-0.5, 0.5, wave);
                
                // Probability space interference patterns
                float interference = sin(length(q) * 3.0 + u_time * 2.0) * 0.4 + 0.6;
                return lattice * interference;
            }
            
            float crystalLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float d = max(max(abs(q.x), abs(q.y)), abs(q.z));
                float lattice = 1.0 - smoothstep(0.3, 0.5, d);
                
                // Systematic growth patterns
                float growth = sin(d * 8.0 + u_time * 0.5) * 0.2 + 0.8;
                return lattice * growth;
            }
            
            float getGeometryValue(vec3 p, float gridSize, float geomType, float style) {
                if (geomType < 0.5) return hypercubeLattice(p, gridSize, style);
                else if (geomType < 1.5) return tetrahedronLattice(p, gridSize, style);
                else if (geomType < 2.5) return sphereLattice(p, gridSize, style);
                else if (geomType < 3.5) return torusLattice(p, gridSize, style);
                else if (geomType < 4.5) return kleinLattice(p, gridSize, style);
                else if (geomType < 5.5) return fractalLattice(p, gridSize, style);
                else if (geomType < 6.5) return waveLattice(p, gridSize, style);
                else return crystalLattice(p, gridSize, style);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspectRatio = u_resolution.x / u_resolution.y;
                uv.x *= aspectRatio;
                
                vec2 center = vec2(u_mouse.x * aspectRatio, u_mouse.y);
                vec3 p = vec3(uv - center, 0.0);
                
                // Enhanced interaction-driven rotation
                float timeRotation = u_time * 0.2 * u_rotationSpeed * (1.0 + u_interactionIntensity * u_intensity);
                mat2 rotation = mat2(cos(timeRotation), -sin(timeRotation), sin(timeRotation), cos(timeRotation));
                p.xy = rotation * p.xy;
                p.z = sin(u_time * 0.1) * 0.5;
                
                // Apply 4D transformations for dimensional shifts
                if (u_dimension > 3.0) {
                    float w = sin(length(p) * 3.0 + u_time * 0.3) * (u_dimension - 3.0) * (1.0 + u_interactionIntensity * u_intensity * 0.5);
                    vec4 p4d = vec4(p, w);
                    
                    p4d = rotateXW(timeRotation * 0.31) * p4d;
                    p4d = rotateYW(timeRotation * 0.27) * p4d;
                    p4d = rotateZW(timeRotation * 0.23) * p4d;
                    
                    p = project4Dto3D(p4d);
                }
                
                // Dynamic grid density based on interaction
                float dynamicGridDensity = u_gridDensity * (1.0 + u_interactionIntensity * u_intensity * 0.3);
                
                // Get geometry value
                float lattice = getGeometryValue(p, dynamicGridDensity, u_geometry, u_latticeStyle);
                
                // Enhanced chromatic aberration glitch effects
                float glitchAmount = u_glitchIntensity * (0.1 + 0.1 * sin(u_time * 5.0)) * (1.0 + u_interactionIntensity * u_intensity);
                
                vec2 rOffset = vec2(glitchAmount, glitchAmount * 0.5);
                vec2 gOffset = vec2(-glitchAmount * 0.3, glitchAmount * 0.2);
                vec2 bOffset = vec2(glitchAmount * 0.1, -glitchAmount * 0.4);
                
                float r = getGeometryValue(vec3(p.xy + rOffset, p.z), dynamicGridDensity, u_geometry, u_latticeStyle);
                float g = getGeometryValue(vec3(p.xy + gOffset, p.z), dynamicGridDensity, u_geometry, u_latticeStyle);
                float b = getGeometryValue(vec3(p.xy + bOffset, p.z), dynamicGridDensity, u_geometry, u_latticeStyle);
                
                // Enhanced color mixing with vibrant gradients
                vec3 baseColor = vec3(0.02, 0.05, 0.1);
                vec3 latticeColor = u_baseColor * (0.8 + 0.2 * u_interactionIntensity * u_intensity);
                
                // Create rich gradients like reference site
                vec3 gradientMod = vec3(
                    1.0 + 0.4 * sin(u_time + length(p) * 2.0),
                    1.0 + 0.4 * sin(u_time * 1.3 + length(p) * 2.5),
                    1.0 + 0.4 * sin(u_time * 0.7 + length(p) * 1.8)
                );
                
                latticeColor *= gradientMod;
                
                vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
                
                // Enhanced glow and vibrancy
                color += u_baseColor * 0.2 * (0.5 + 0.5 * sin(u_time * 0.5)) * u_interactionIntensity * u_intensity;
                
                // Enhanced tunnel/spiral effects for depth
                float depth = 1.0 + sin(length(p) * 10.0 + u_time * 3.0) * 0.3;
                color *= depth;
                
                // Enhanced vignette with interactive center
                float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - vec2(center.x, center.y)));
                color *= vignette;
                
                // Enhanced alpha for better blending
                float alpha = (lattice * u_intensity * 0.85) + 0.15;
                
                gl_FragColor = vec4(color, alpha);
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
            latticeStyle: this.gl.getUniformLocation(this.program, 'u_latticeStyle'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            interactionIntensity: this.gl.getUniformLocation(this.program, 'u_interactionIntensity')
        };
        
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    }
    
    setupInteractions() {
        // Enhanced interaction tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.interactionState.mouseX = (e.clientX - rect.left) / rect.width;
            this.interactionState.mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
            this.interactionState.lastActivity = Date.now();
            this.updateInteractionState('move', 0.4);
        });
        
        // Click/Hold interactions
        const startHold = (e) => {
            this.interactionState.isHolding = true;
            this.interactionState.holdStart = Date.now();
            this.updateInteractionState('hold', 1.0);
        };
        
        const endHold = () => {
            this.interactionState.isHolding = false;
            this.updateInteractionState('release', 0.1);
        };
        
        this.canvas.addEventListener('mousedown', startHold);
        this.canvas.addEventListener('mouseup', endHold);
        this.canvas.addEventListener('touchstart', startHold, { passive: false });
        this.canvas.addEventListener('touchend', endHold);
        
        // Inactivity detection
        setInterval(() => {
            const timeSinceActivity = Date.now() - this.interactionState.lastActivity;
            if (timeSinceActivity > 3000) {
                this.updateInteractionState('idle', 0.0);
            }
        }, 1000);
    }
    
    updateInteractionState(type, intensity) {
        this.interactionState.type = type;
        this.interactionState.intensity = Math.max(this.interactionState.intensity * 0.95, intensity);
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Enhanced shader compile error:', this.gl.getShaderInfoLog(shader));
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
            console.error('Enhanced program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    updateWithNewMaster(masterConfig) {
        return new Promise((resolve) => {
            const startConfig = { ...this.currentComputedConfig };
            const targetConfig = { ...masterConfig };
            
            // Apply derivation rules to ALL parameters from master
            if (this.rules.derivation) {
                Object.keys(this.rules.derivation).forEach(param => {
                    const rule = this.rules.derivation[param];
                    if (typeof rule === 'function') {
                        if (param === 'baseColor' && Array.isArray(masterConfig[param])) {
                            targetConfig[param] = rule(masterConfig[param]);
                        } else {
                            targetConfig[param] = rule(masterConfig[param]);
                        }
                    } else if (typeof rule === 'number') {
                        targetConfig[param] = masterConfig[param] * rule;
                    }
                });
            }
            
            const transitionDuration = this.transitionDuration;
            const startTime = Date.now();
            
            const transition = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / transitionDuration, 1.0);
                const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                
                // Interpolate parameters
                Object.keys(targetConfig).forEach(key => {
                    if (typeof targetConfig[key] === 'number') {
                        this.currentComputedConfig[key] = startConfig[key] + (targetConfig[key] - startConfig[key]) * eased;
                    } else if (Array.isArray(targetConfig[key])) {
                        this.currentComputedConfig[key] = startConfig[key].map((val, i) => 
                            val + (targetConfig[key][i] - val) * eased
                        );
                    } else {
                        this.currentComputedConfig[key] = targetConfig[key];
                    }
                });
                
                if (progress < 1.0) {
                    requestAnimationFrame(transition);
                } else {
                    resolve();
                }
            };
            
            transition();
        });
    }
    
    resize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    render() {
        if (!this.gl || !this.program) return;
        
        // Apply velocity-based interaction effects
        const velocityIntensity = Math.min(
            (Math.abs(this.manager.globalVelocity.x) + Math.abs(this.manager.globalVelocity.y) + 
             this.manager.globalVelocity.scroll) / 100, 
            1.0
        ) * 0.1; // 1/10th intensity as requested
        
        const totalInteractionIntensity = Math.max(this.interactionState.intensity, velocityIntensity);
        
        // Handle hold interactions for dimensional shift
        let holdEffect = 0;
        if (this.interactionState.isHolding) {
            const holdDuration = Date.now() - this.interactionState.holdStart;
            holdEffect = Math.min(holdDuration / 2000, 1.0);
        }
        
        const currentDimension = this.currentComputedConfig.dimension + holdEffect * 0.5;
        
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);
        
        // Enable blending for multi-layer effects
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // Setup vertex attributes
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Set uniforms with enhanced parameters
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.mouse, this.interactionState.mouseX, this.interactionState.mouseY);
        this.gl.uniform3fv(this.uniforms.baseColor, this.currentComputedConfig.baseColor);
        this.gl.uniform1f(this.uniforms.gridDensity, this.currentComputedConfig.gridDensity * (1.0 + totalInteractionIntensity * 0.2));
        this.gl.uniform1f(this.uniforms.morphFactor, this.currentComputedConfig.morphFactor);
        this.gl.uniform1f(this.uniforms.dimension, currentDimension);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.currentComputedConfig.glitchIntensity);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.currentComputedConfig.rotationSpeed);
        this.gl.uniform1f(this.uniforms.geometry, this.currentComputedConfig.geometry);
        this.gl.uniform1f(this.uniforms.intensity, this.currentComputedConfig.intensity);
        this.gl.uniform1f(this.uniforms.latticeStyle, this.currentComputedConfig.latticeStyle || 1.0);
        this.gl.uniform1f(this.uniforms.interactionIntensity, totalInteractionIntensity);
        
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        // Decay interaction intensity
        this.interactionState.intensity *= 0.98;
        this.manager.globalVelocity.x *= 0.95;
        this.manager.globalVelocity.y *= 0.95;
        this.manager.globalVelocity.scroll *= 0.95;
    }
    
    animate() {
        if (!this.animationId) return;
        
        this.time += 0.016; // ~60fps
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        if (this.animationId) return;
        this.animationId = true;
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            this.animationId = null;
        }
    }
}

// Export enhanced classes
window.EnhancedVisualizerManager = EnhancedVisualizerManager;
window.EnhancedManagedVisualizer = EnhancedManagedVisualizer;

console.log('✅ Enhanced Multi-Instance Visualizer System loaded successfully');