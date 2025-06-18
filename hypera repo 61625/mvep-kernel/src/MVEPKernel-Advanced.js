/* packages/mvep-kernel/src/MVEPKernel-Advanced.js - v2.0 */

/**
 * MVEP (Multimodal Visualization Enhancement Protocol) Kernel - Advanced Edition
 * Based on the superior moiré hypercube pattern with true 4D mathematics
 * Core 4D visualization engine for polytopal data projection
 */
export class MVEPKernelAdvanced {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // Data streaming
        this.dataStream = null;
        this.dataPlugin = null;
        
        // Advanced visualization parameters (based on moiré hypercube)
        this.params = {
            morphFactor: 0.5,       // Data complexity → morphing
            dimension: 3.5,         // 3D to 4D transformation 
            glitchIntensity: 0.5,   // RGB color splitting
            rotationSpeed: 0.5,     // 4D rotation speed
            gridDensity: 10.0,      // Lattice density
            mouseX: 0.5,           // Interactive center X
            mouseY: 0.5,           // Interactive center Y
            ...options
        };
        
        // Animation state
        this.animationId = null;
        this.startTime = Date.now();
        
        this._init();
    }
    
    _init() {
        // Initialize WebGL context
        this.gl.clearColor(0.05, 0.05, 0.1, 1.0);
        
        // Set viewport
        this.resize();
        
        // Compile advanced shaders with 4D mathematics
        this._compileAdvancedShaders();
        
        // Create geometry buffers
        this._createBuffers();
        
        // Setup interaction
        this._setupInteraction();
        
        // Start render loop
        this.start();
    }
    
    /**
     * Compile the advanced shader system with true 4D hypercube mathematics
     * @private
     */
    _compileAdvancedShaders() {
        // Vertex shader - simple fullscreen quad
        const vertexShaderSource = `
            attribute vec2 a_position;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Fragment shader with advanced 4D hypercube mathematics
        const fragmentShaderSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform float u_morphFactor;
            uniform float u_glitchIntensity;
            uniform float u_rotationSpeed;
            uniform float u_dimension;
            uniform float u_gridDensity;
            
            // Advanced 4D rotation matrices for true hypercube projection
            mat4 rotateXY(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    c, -s, 0, 0,
                    s, c, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                );
            }
            
            mat4 rotateXZ(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    c, 0, -s, 0,
                    0, 1, 0, 0,
                    s, 0, c, 0,
                    0, 0, 0, 1
                );
            }
            
            mat4 rotateXW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    c, 0, 0, -s,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    s, 0, 0, c
                );
            }
            
            mat4 rotateYZ(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    1, 0, 0, 0,
                    0, c, -s, 0,
                    0, s, c, 0,
                    0, 0, 0, 1
                );
            }
            
            mat4 rotateYW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    1, 0, 0, 0,
                    0, c, 0, -s,
                    0, 0, 1, 0,
                    0, s, 0, c
                );
            }
            
            mat4 rotateZW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, c, -s,
                    0, 0, s, c
                );
            }
            
            // Project a 4D point to 3D space with perspective
            vec3 project4Dto3D(vec4 p) {
                float w = 2.0 / (2.0 + p.w); // Perspective divide
                return vec3(p.x * w, p.y * w, p.z * w);
            }
            
            // Project a 3D point to 2D space
            vec2 project3Dto2D(vec3 p) {
                float z = 2.0 / (3.0 + p.z); // Perspective divide
                return vec2(p.x * z, p.y * z);
            }
            
            // Advanced lattice edge calculation
            float latticeEdges(vec3 p, float gridSize, float lineWidth) {
                vec3 grid = fract(p * gridSize);
                vec3 edges = 1.0 - smoothstep(0.0, lineWidth, abs(grid - 0.5));
                return max(max(edges.x, edges.y), edges.z);
            }
            
            // Lattice vertices for connection points
            float latticeVertices(vec3 p, float gridSize, float vertexSize) {
                vec3 grid = fract(p * gridSize);
                vec3 distToVertex = min(grid, 1.0 - grid);
                float minDist = min(min(distToVertex.x, distToVertex.y), distToVertex.z);
                return 1.0 - smoothstep(0.0, vertexSize, minDist);
            }
            
            // Main hypercube lattice function with data-driven morphing
            float hypercubeLattice(vec3 p, float morphFactor, float gridSize) {
                // Base cubic lattice
                float edges = latticeEdges(p, gridSize, 0.03);
                float vertices = latticeVertices(p, gridSize, 0.05);
                
                // Time-based rotation for 4D visualization
                float timeFactor = u_time * 0.2 * u_rotationSpeed;
                
                // Data-driven distortion based on morphFactor
                vec3 distortedP = p;
                distortedP.x += sin(p.z * 2.0 + timeFactor) * morphFactor * 0.2;
                distortedP.y += cos(p.x * 2.0 + timeFactor) * morphFactor * 0.2;
                distortedP.z += sin(p.y * 2.0 + timeFactor) * morphFactor * 0.1;
                
                // 4D hypercube projection when dimension > 3.0
                if (u_dimension > 3.0) {
                    // Create 4D point by extending 3D with computed W coordinate
                    float w = sin(length(p) * 3.0 + u_time * 0.3) * (u_dimension - 3.0);
                    vec4 p4d = vec4(distortedP, w);
                    
                    // Apply multiple 4D rotations for true hypercube effect
                    p4d = rotateXW(timeFactor * 0.31) * p4d;
                    p4d = rotateYW(timeFactor * 0.27) * p4d;
                    p4d = rotateZW(timeFactor * 0.23) * p4d;
                    
                    // Project back to 3D
                    distortedP = project4Dto3D(p4d);
                }
                
                // Calculate lattice for distorted position
                float distortedEdges = latticeEdges(distortedP, gridSize, 0.03);
                float distortedVertices = latticeVertices(distortedP, gridSize, 0.05);
                
                // Blend based on morphFactor (data complexity)
                edges = mix(edges, distortedEdges, morphFactor);
                vertices = mix(vertices, distortedVertices, morphFactor);
                
                return max(edges, vertices);
            }
            
            void main() {
                // Normalized pixel coordinates with aspect ratio
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspectRatio = u_resolution.x / u_resolution.y;
                uv.x *= aspectRatio;
                
                // Interactive center point from mouse/data
                vec2 center = vec2(u_mouse.x * aspectRatio, u_mouse.y);
                
                // Create 3D space coordinates
                vec3 p = vec3(uv - center, 0.0);
                
                // Apply rotation based on time and rotation speed
                float timeRotation = u_time * 0.2 * u_rotationSpeed;
                mat2 rotation = mat2(
                    cos(timeRotation), -sin(timeRotation),
                    sin(timeRotation), cos(timeRotation)
                );
                p.xy = rotation * p.xy;
                
                // Add z-dimension movement
                p.z = sin(u_time * 0.1) * 0.5;
                
                // Calculate main hypercube lattice
                float lattice = hypercubeLattice(p, u_morphFactor, u_gridDensity);
                
                // RGB color splitting for glitch/moiré effect
                float glitchAmount = u_glitchIntensity * (0.1 + 0.1 * sin(u_time * 5.0));
                
                // Calculate offset vectors for RGB channels
                vec2 rOffset = vec2(glitchAmount, glitchAmount * 0.5);
                vec2 gOffset = vec2(-glitchAmount * 0.3, glitchAmount * 0.2);
                vec2 bOffset = vec2(glitchAmount * 0.1, -glitchAmount * 0.4);
                
                // Apply color channel shifting
                float r = hypercubeLattice(vec3(p.xy + rOffset, p.z), u_morphFactor, u_gridDensity);
                float g = hypercubeLattice(vec3(p.xy + gOffset, p.z), u_morphFactor, u_gridDensity);
                float b = hypercubeLattice(vec3(p.xy + bOffset, p.z), u_morphFactor, u_gridDensity);
                
                // Create moiré interference patterns
                float moireGrid1 = hypercubeLattice(p, u_morphFactor, u_gridDensity * 1.01);
                float moireGrid2 = hypercubeLattice(p, u_morphFactor, u_gridDensity * 0.99);
                float moire = abs(moireGrid1 - moireGrid2) * 0.5;
                
                // Blend moiré with RGB channels
                r = mix(r, moire, 0.3);
                g = mix(g, moire, 0.4);
                b = mix(b, moire, 0.5);
                
                // Color scheme: deep space to neon
                vec3 baseColor = vec3(0.1, 0.2, 0.4);
                vec3 latticeColor = vec3(0.9, 0.8, 1.0);
                
                // Final color with RGB splitting
                vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
                
                // Add subtle pulsing glow
                color += vec3(0.1, 0.2, 0.4) * (0.5 + 0.5 * sin(u_time * 0.5));
                
                // Vignette effect
                float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - vec2(center.x, center.y)));
                color *= vignette;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        // Create and compile shaders
        const vertexShader = this._createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        // Create shader program
        this.program = this._createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);
        
        // Get all uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            glitchIntensity: this.gl.getUniformLocation(this.program, 'u_glitchIntensity'),
            rotationSpeed: this.gl.getUniformLocation(this.program, 'u_rotationSpeed'),
            dimension: this.gl.getUniformLocation(this.program, 'u_dimension'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity')
        };
        
        // Get attribute location
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    }
    
    /**
     * Create and compile a shader
     * @private
     */
    _createShader(type, source) {
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
    
    /**
     * Create and link shader program
     * @private
     */
    _createProgram(vertexShader, fragmentShader) {
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
    
    /**
     * Create vertex buffers for fullscreen quad
     * @private
     */
    _createBuffers() {
        // Fullscreen quad vertices
        const vertices = new Float32Array([
            -1.0, -1.0,  // bottom left
             1.0, -1.0,  // bottom right
            -1.0,  1.0,  // top left
             1.0,  1.0,  // top right
        ]);
        
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    }
    
    /**
     * Setup mouse/touch interaction
     * @private
     */
    _setupInteraction() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.params.mouseX = (event.clientX - rect.left) / rect.width;
            this.params.mouseY = 1.0 - (event.clientY - rect.top) / rect.height;
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const rect = this.canvas.getBoundingClientRect();
                this.params.mouseX = (event.touches[0].clientX - rect.left) / rect.width;
                this.params.mouseY = 1.0 - (event.touches[0].clientY - rect.top) / rect.height;
                event.preventDefault();
            }
        }, { passive: false });
        
        // Window resize
        window.addEventListener('resize', () => this.resize());
    }
    
    /**
     * Inject a data stream for visualization
     * @param {DataStream} stream - Stream of data to visualize
     * @param {DataPlugin} plugin - Plugin to interpret the data
     */
    injectDataStream(stream, plugin) {
        this.dataStream = stream;
        this.dataPlugin = plugin;
        
        // Process initial data
        if (this.dataStream && this.dataPlugin) {
            this._updateVisualizationFromData();
        }
    }
    
    /**
     * Update visualization parameters from data stream
     * @private
     */
    _updateVisualizationFromData() {
        if (!this.dataStream || !this.dataPlugin) return;
        
        const data = this.dataStream.getData();
        const visualParams = this.dataPlugin.process(data);
        
        // Map plugin output to advanced shader uniforms
        if (visualParams.dimension !== undefined) {
            this.params.dimension = Math.max(3.0, Math.min(4.0, visualParams.dimension));
        }
        if (visualParams.morphing !== undefined) {
            this.params.morphFactor = Math.max(0.0, Math.min(1.0, visualParams.morphing));
        }
        if (visualParams.color !== undefined) {
            this.params.glitchIntensity = Math.max(0.0, Math.min(1.0, visualParams.color));
        }
        if (visualParams.rotation !== undefined) {
            this.params.rotationSpeed = Math.max(0.0, Math.min(2.0, visualParams.rotation));
        }
        if (visualParams.density !== undefined) {
            this.params.gridDensity = Math.max(5.0, Math.min(20.0, visualParams.density));
        }
        
        // Interactive center based on data focus
        if (visualParams.centerX !== undefined) {
            this.params.mouseX = visualParams.centerX;
        }
        if (visualParams.centerY !== undefined) {
            this.params.mouseY = visualParams.centerY;
        }
    }
    
    /**
     * Render a single frame
     * @private
     */
    _render() {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.startTime) / 1000;
        
        // Update from data stream
        this._updateVisualizationFromData();
        
        // Clear canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Use shader program
        this.gl.useProgram(this.program);
        
        // Setup position attribute
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Set all uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, elapsedTime);
        this.gl.uniform2f(this.uniforms.mouse, this.params.mouseX, this.params.mouseY);
        this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.params.glitchIntensity);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.params.rotationSpeed);
        this.gl.uniform1f(this.uniforms.dimension, this.params.dimension);
        this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity);
        
        // Draw fullscreen quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        // Continue animation
        if (this.animationId) {
            this.animationId = requestAnimationFrame(() => this._render());
        }
    }
    
    /**
     * Start the visualization
     */
    start() {
        if (!this.animationId) {
            this.animationId = requestAnimationFrame(() => this._render());
        }
    }
    
    /**
     * Stop the visualization
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Resize the canvas and viewport
     */
    resize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
        }
    }
    
    /**
     * Update visualization parameters
     * @param {Object} params - Parameters to update
     */
    updateParams(params) {
        Object.assign(this.params, params);
    }
    
    /**
     * Get current visualization state
     */
    getState() {
        return {
            ...this.params,
            time: (Date.now() - this.startTime) / 1000
        };
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
        if (this.positionBuffer) {
            this.gl.deleteBuffer(this.positionBuffer);
        }
        if (this.program) {
            this.gl.deleteProgram(this.program);
        }
    }
}

// Data stream class (same as before)
export class DataStream {
    constructor() {
        this.data = null;
        this.listeners = [];
    }
    
    update(data) {
        this.data = data;
        this.listeners.forEach(listener => listener(data));
    }
    
    getData() {
        return this.data;
    }
    
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
}

export default MVEPKernelAdvanced;