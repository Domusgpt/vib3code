/**
 * MULTI-INSTANCE VISUALIZER SYSTEM
 * 
 * Multiple specialized visualizer instances for different UI elements:
 * - Background visualizer (subtle, ambient)
 * - Header visualizer (geometric, lattice-focused)
 * - Content visualizers (context-aware, content-specific)
 * - Interactive element visualizers (button states, hover effects)
 */

class MultiInstanceVisualizerManager {
    constructor() {
        this.instances = new Map();
        this.globalVelocityState = {
            mouseVelocity: 0,
            scrollVelocity: 0,
            lastMouseX: 0,
            lastMouseY: 0,
            lastTime: 0
        };
        
        this.setupGlobalTracking();
    }
    
    setupGlobalTracking() {
        // Track mouse velocity globally for all instances
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
            
            // Decay scroll velocity
            setTimeout(() => {
                this.globalVelocityState.scrollVelocity *= 0.8;
            }, 100);
        });
    }
    
    createInstance(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return null;
        }
        
        const instance = new SpecializedVisualizer(canvas, config, this.globalVelocityState);
        this.instances.set(canvasId, instance);
        return instance;
    }
    
    // Preset configurations for different UI elements
    static getPresets() {
        return {
            backgroundAmbient: {
                intensity: 0.1,           // Very subtle
                mouseResponse: 0.05,      // Barely noticeable mouse effect
                velocityResponse: 0.2,    // More responsive to velocity
                geometryEmphasis: 0.3,    // Less geometric, more ambient
                gridDensityBase: 8.0,
                morphFactorBase: 0.2,
                dimensionBase: 3.1,
                glitchBase: 0.1,
                rotationBase: 0.1
            },
            
            headerGeometric: {
                intensity: 0.3,           // More visible but still subtle
                mouseResponse: 0.1,       // Gentle mouse response
                velocityResponse: 0.4,    // Good velocity response
                geometryEmphasis: 0.8,    // Strong geometric emphasis
                gridDensityBase: 12.0,    // Dense lattice
                morphFactorBase: 0.1,     // Minimal morphing
                dimensionBase: 3.0,       // Pure 3D geometry
                glitchBase: 0.05,         // Very minimal glitch
                rotationBase: 0.2
            },
            
            contentContextual: {
                intensity: 0.2,
                mouseResponse: 0.08,
                velocityResponse: 0.3,
                geometryEmphasis: 0.6,
                gridDensityBase: 10.0,
                morphFactorBase: 0.3,
                dimensionBase: 3.2,
                glitchBase: 0.15,
                rotationBase: 0.15
            },
            
            interactiveElement: {
                intensity: 0.4,           // More responsive for interactive elements
                mouseResponse: 0.15,      // Noticeable but not jarring
                velocityResponse: 0.5,    // Responsive to quick movements
                geometryEmphasis: 0.7,
                gridDensityBase: 15.0,
                morphFactorBase: 0.4,
                dimensionBase: 3.3,
                glitchBase: 0.2,
                rotationBase: 0.3
            },
            
            // Specialized tetrahedron variants
            tetrahedronLatticeLight: {
                intensity: 0.15,
                mouseResponse: 0.06,
                velocityResponse: 0.25,
                geometryEmphasis: 0.9,    // Maximum geometric emphasis
                gridDensityBase: 20.0,    // Very dense lattice
                morphFactorBase: 0.05,    // Almost no morphing
                dimensionBase: 3.0,       // Pure geometric
                glitchBase: 0.02,         // Minimal glitch
                rotationBase: 0.1,
                latticeStyle: 'wireframe' // Special rendering mode
            },
            
            tetrahedronLatticeMedium: {
                intensity: 0.25,
                mouseResponse: 0.08,
                velocityResponse: 0.35,
                geometryEmphasis: 0.85,
                gridDensityBase: 16.0,
                morphFactorBase: 0.1,
                dimensionBase: 3.1,
                glitchBase: 0.05,
                rotationBase: 0.15,
                latticeStyle: 'solid'
            },
            
            tetrahedronLatticeHeavy: {
                intensity: 0.35,
                mouseResponse: 0.12,
                velocityResponse: 0.45,
                geometryEmphasis: 0.8,
                gridDensityBase: 12.0,
                morphFactorBase: 0.2,
                dimensionBase: 3.2,
                glitchBase: 0.1,
                rotationBase: 0.2,
                latticeStyle: 'hybrid'
            }
        };
    }
}

class SpecializedVisualizer {
    constructor(canvas, config, globalVelocityState) {
        this.canvas = canvas;
        this.config = config;
        this.globalVelocityState = globalVelocityState;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.time = 0;
        this.animationId = null;
        
        // Local state for this instance
        this.localState = {
            gridDensity: config.gridDensityBase,
            morphFactor: config.morphFactorBase,
            dimension: config.dimensionBase,
            glitchIntensity: config.glitchBase,
            rotationSpeed: config.rotationBase,
            currentIntensity: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupShaders();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.start();
    }
    
    setupShaders() {
        // Enhanced shader with lattice style support
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
            uniform float u_geometryEmphasis;
            uniform float u_latticeStyle; // 0=wireframe, 1=solid, 2=hybrid
            
            // Multi-geometry lattice system with style variants
            float hypercubeLattice(vec3 p, float gridSize, float style) {
                vec3 grid = fract(p * gridSize);
                vec3 edges = 1.0 - smoothstep(0.0, 0.05, abs(grid - 0.5));
                float lattice = max(max(edges.x, edges.y), edges.z);
                
                if (style < 0.5) return lattice; // wireframe
                else if (style < 1.5) return lattice * 0.7 + 0.3; // solid
                else return lattice * 0.8 + 0.2; // hybrid
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
                
                if (style < 0.5) return lattice * 0.6; // wireframe
                else if (style < 1.5) return lattice; // solid
                else return lattice * 0.8 + 0.1; // hybrid
            }
            
            float torusLattice(vec3 p, float gridSize, float style) {
                vec3 q = fract(p * gridSize) - 0.5;
                float r1 = sqrt(q.x*q.x + q.y*q.y);
                float r2 = sqrt((r1 - 0.3)*(r1 - 0.3) + q.z*q.z);
                float lattice = 1.0 - smoothstep(0.0, 0.1, r2);
                
                if (style < 0.5) return lattice * 0.7; // wireframe
                else if (style < 1.5) return lattice; // solid
                else return lattice * 0.85 + 0.1; // hybrid
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
                
                if (style < 0.5) return lattice * 0.5; // wireframe
                else if (style < 1.5) return lattice * 0.8; // solid
                else return lattice * 0.7 + 0.2; // hybrid
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
                
                // SUBTLE rotation based on time and velocity
                float timeRotation = u_time * u_rotationSpeed * u_intensity * 0.3; // Much more subtle
                mat2 rotation = mat2(cos(timeRotation), -sin(timeRotation), sin(timeRotation), cos(timeRotation));
                p.xy = rotation * p.xy;
                
                // Get lattice value with geometry and style support
                float lattice = getGeometryLattice(p, u_gridDensity, u_geometry, u_latticeStyle);
                
                // Apply geometry emphasis
                lattice = mix(lattice * 0.3, lattice, u_geometryEmphasis);
                
                // Very subtle glitch effects
                float glitch = u_glitchIntensity * u_intensity * 0.2; // Much more subtle
                
                // Final color with emphasis on geometric structure
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
            geometryEmphasis: this.gl.getUniformLocation(this.program, 'u_geometryEmphasis'),
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
    
    updateParameters() {
        // VELOCITY-BASED PARAMETER UPDATES (much more subtle)
        const mouseVel = Math.min(this.globalVelocityState.mouseVelocity * this.config.mouseResponse, 1.0);
        const scrollVel = Math.min(this.globalVelocityState.scrollVelocity * this.config.velocityResponse * 0.01, 1.0);
        
        // Combined velocity influence (much more subtle)
        const velocityInfluence = (mouseVel + scrollVel) * this.config.intensity;
        
        // Update local state with smooth transitions
        this.localState.currentIntensity = velocityInfluence;
        
        // Grid density responds to velocity instead of position
        this.localState.gridDensity = this.config.gridDensityBase + velocityInfluence * 2.0; // Much smaller variation
        
        // Rotation speed responds to scroll velocity
        this.localState.rotationSpeed = this.config.rotationBase + scrollVel * 0.1; // Very subtle
        
        // Glitch responds to mouse velocity
        this.localState.glitchIntensity = this.config.glitchBase + mouseVel * 0.05; // Minimal glitch
    }
    
    render() {
        this.time = performance.now() * 0.001;
        this.updateParameters();
        
        // Clear
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0); // Transparent background
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Enable blending for layered effects
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        this.gl.useProgram(this.program);
        
        // Set uniforms with current state
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform3fv(this.uniforms.baseColor, this.config.baseColor || [0.0, 1.0, 1.0]);
        this.gl.uniform1f(this.uniforms.gridDensity, this.localState.gridDensity);
        this.gl.uniform1f(this.uniforms.morphFactor, this.localState.morphFactor);
        this.gl.uniform1f(this.uniforms.dimension, this.localState.dimension);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.localState.glitchIntensity);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.localState.rotationSpeed);
        this.gl.uniform1f(this.uniforms.geometry, this.config.geometry || 0.0);
        this.gl.uniform1f(this.uniforms.intensity, this.localState.currentIntensity);
        this.gl.uniform1f(this.uniforms.geometryEmphasis, this.config.geometryEmphasis);
        
        // Set lattice style based on config
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
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
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

// Global manager instance
window.visualizerManager = new MultiInstanceVisualizerManager();