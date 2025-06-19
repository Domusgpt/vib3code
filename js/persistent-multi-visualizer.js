/**
 * PERSISTENT MULTI-VISUALIZER SYSTEM
 * 
 * 3-4 visualizer instances that run continuously and morph their parameters
 * based on navigation events. Creates smooth "portal" transitions between
 * sections by transitioning geometry, colors, and effects smoothly.
 */

class PersistentMultiVisualizer {
    constructor() {
        this.visualizers = {
            header: null,
            content: null,
            ambient: null,
            interactive: null
        };
        
        this.currentSection = 'home';
        this.transitionDuration = 1000; // 1 second transitions
        this.isTransitioning = false;
        
        // Section configuration presets
        this.sectionConfigs = {
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
        this.createPersistentVisualizers();
        this.setupNavigationListener();
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
    
    createPersistentVisualizers() {
        // Create fixed canvas elements
        this.createCanvas('persistent-header', 'header-visualizer');
        this.createCanvas('persistent-content', 'content-visualizer');
        this.createCanvas('persistent-ambient', 'ambient-visualizer');
        
        // Initialize visualizer instances
        this.visualizers.header = new PersistentVisualizerInstance(
            'persistent-header', 
            { ...this.sectionConfigs.home, intensity: 0.3, opacity: 0.25 },
            this.globalVelocityState
        );
        
        this.visualizers.content = new PersistentVisualizerInstance(
            'persistent-content',
            { ...this.sectionConfigs.home, intensity: 0.15, opacity: 0.12 },
            this.globalVelocityState
        );
        
        this.visualizers.ambient = new PersistentVisualizerInstance(
            'persistent-ambient',
            { ...this.sectionConfigs.home, intensity: 0.08, opacity: 0.06 },
            this.globalVelocityState
        );
        
        console.log('🎨 Persistent multi-visualizer system initialized');
        console.log('- 3 layers: header, content, ambient');
        console.log('- Smooth parameter morphing on navigation');
        console.log('- Portal transition effects enabled');
    }
    
    createCanvas(id, className) {
        const canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.className = className;
        document.body.appendChild(canvas);
        
        // Position the canvas layers
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = this.getZIndex(className);
    }
    
    getZIndex(className) {
        const zIndexMap = {
            'header-visualizer': '1',
            'content-visualizer': '0',
            'ambient-visualizer': '-1'
        };
        return zIndexMap[className] || '0';
    }
    
    setupNavigationListener() {
        // Listen for section changes
        document.addEventListener('sectionChange', (event) => {
            const newSection = event.detail.section;
            this.transitionToSection(newSection);
        });
        
        // Also listen for navigation clicks
        document.addEventListener('click', (event) => {
            const navLink = event.target.closest('[data-section]');
            if (navLink) {
                const section = navLink.getAttribute('data-section');
                this.transitionToSection(section);
            }
        });
    }
    
    transitionToSection(targetSection) {
        if (this.isTransitioning || this.currentSection === targetSection) {
            return;
        }
        
        console.log(`🌀 Portal transition: ${this.currentSection} → ${targetSection}`);
        
        this.isTransitioning = true;
        const targetConfig = this.sectionConfigs[targetSection];
        
        if (!targetConfig) {
            console.error(`❌ Unknown section: ${targetSection}`);
            this.isTransitioning = false;
            return;
        }
        
        // Create smooth transitions for all visualizers
        const transitions = Object.keys(this.visualizers).map(layer => {
            const visualizer = this.visualizers[layer];
            if (visualizer) {
                return this.smoothTransition(visualizer, targetConfig, layer);
            }
            return Promise.resolve();
        });
        
        Promise.all(transitions).then(() => {
            this.currentSection = targetSection;
            this.isTransitioning = false;
            console.log(`✅ Portal transition complete: ${targetSection}`);
            
            // Dispatch completion event for text animations
            document.dispatchEvent(new CustomEvent('visualizerTransitionComplete', {
                detail: { section: targetSection }
            }));
        });
    }
    
    smoothTransition(visualizer, targetConfig, layer) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const startConfig = { ...visualizer.config };
            
            // Layer-specific intensity modifiers
            const intensityMap = {
                header: 0.3,
                content: 0.15,
                ambient: 0.08
            };
            
            const targetConfigAdjusted = {
                ...targetConfig,
                intensity: intensityMap[layer] || 0.15
            };
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / this.transitionDuration, 1);
                
                // Smooth easing function
                const ease = this.easeInOutCubic(progress);
                
                // Interpolate all parameters
                const newConfig = this.interpolateConfig(startConfig, targetConfigAdjusted, ease);
                visualizer.updateConfig(newConfig);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
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
    
    // Public API for external control
    getCurrentSection() {
        return this.currentSection;
    }
    
    isInTransition() {
        return this.isTransitioning;
    }
    
    getVisualizer(layer) {
        return this.visualizers[layer];
    }
}

class PersistentVisualizerInstance {
    constructor(canvasId, config, globalVelocityState) {
        this.canvas = document.getElementById(canvasId);
        this.config = config;
        this.globalVelocityState = globalVelocityState;
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.time = 0;
        this.animationId = null;
        
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
        this.config = { ...this.config, ...newConfig };
    }
    
    render() {
        this.time = performance.now() * 0.001;
        
        // Calculate velocity influence
        const mouseVel = Math.min(this.globalVelocityState.mouseVelocity * 0.05, 1.0);
        const scrollVel = Math.min(this.globalVelocityState.scrollVelocity * 0.01, 1.0);
        const velocityInfluence = (mouseVel + scrollVel) * this.config.intensity;
        
        // Clear
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Enable blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        this.gl.useProgram(this.program);
        
        // Set uniforms
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform3fv(this.uniforms.baseColor, this.config.baseColor);
        this.gl.uniform1f(this.uniforms.gridDensity, this.config.gridDensity + velocityInfluence * 2.0);
        this.gl.uniform1f(this.uniforms.morphFactor, this.config.morphFactor);
        this.gl.uniform1f(this.uniforms.dimension, this.config.dimension);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.config.glitchIntensity + mouseVel * 0.05);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.config.rotationSpeed + scrollVel * 0.1);
        this.gl.uniform1f(this.uniforms.geometry, this.config.geometry);
        this.gl.uniform1f(this.uniforms.intensity, this.config.intensity + velocityInfluence);
        
        // Set lattice style
        const latticeStyleMap = { wireframe: 0.0, solid: 1.0, hybrid: 2.0 };
        this.gl.uniform1f(this.uniforms.latticeStyle, latticeStyleMap[this.config.latticeStyle] || 0.0);
        
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
window.persistentMultiVisualizer = new PersistentMultiVisualizer();