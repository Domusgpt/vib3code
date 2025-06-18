/* packages/mvep-kernel/src/MVEPKernel.js - v1.0 */
import { GeometryManager } from './GeometryManager.js';
import { ProjectionManager } from './ProjectionManager.js';
import { ShaderManager } from './ShaderManager.js';

/**
 * MVEP (Multimodal Visualization Enhancement Protocol) Kernel
 * Core 4D visualization engine for polytopal data projection
 * Extracted from HyperAV, generalized for any data type
 */
export class MVEPKernel {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // Core managers
        this.shaderManager = new ShaderManager(this.gl);
        this.geometryManager = new GeometryManager();
        this.projectionManager = new ProjectionManager();
        
        // Data streaming
        this.dataStream = null;
        this.dataPlugin = null;
        
        // Visualization parameters
        this.params = {
            dimension: 4.0,
            morphFactor: 0.5,
            rotationSpeed: 1.0,
            gridDensity: 1.0,
            colorShift: 0.0,
            projectionMethod: 'perspective',
            ...options
        };
        
        // Animation state
        this.animationId = null;
        this.time = 0;
        this.lastTime = 0;
        
        this._init();
    }
    
    _init() {
        // Initialize WebGL context
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // Set viewport
        this.resize();
        
        // Compile shaders
        this._compileShaders();
        
        // Create geometry buffers
        this._createBuffers();
        
        // Start render loop
        this.start();
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
        
        // Get latest data from stream
        const data = this.dataStream.getData();
        
        // Process through plugin to get visual parameters
        const visualParams = this.dataPlugin.process(data);
        
        // Apply to visualization
        if (visualParams.dimension !== undefined) {
            this.params.dimension = visualParams.dimension;
        }
        if (visualParams.morphing !== undefined) {
            this.params.morphFactor = visualParams.morphing;
        }
        if (visualParams.color !== undefined) {
            this.params.colorShift = visualParams.color;
        }
        if (visualParams.rotation !== undefined) {
            this.params.rotationSpeed = visualParams.rotation;
        }
        if (visualParams.density !== undefined) {
            this.params.gridDensity = visualParams.density;
        }
    }
    
    /**
     * Compile vertex and fragment shaders
     * @private
     */
    _compileShaders() {
        const vertexShader = `#version 300 es
            precision highp float;
            
            in vec3 a_position;
            uniform mat4 u_mvpMatrix;
            uniform float u_time;
            
            out vec3 v_position;
            out vec3 v_worldPos;
            
            void main() {
                v_position = a_position;
                v_worldPos = a_position;
                gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
            }
        `;
        
        // Get geometry-specific shader code
        const geometry = this.geometryManager.getGeometry('hypercube');
        const geometryCode = geometry.getShaderCode();
        
        // Get projection code
        const projectionCode = this.projectionManager.getProjectionCode(this.params.projectionMethod);
        
        const fragmentShader = `#version 300 es
            precision highp float;
            
            in vec3 v_position;
            in vec3 v_worldPos;
            
            uniform float u_time;
            uniform float u_dimension;
            uniform float u_morphFactor;
            uniform float u_rotationSpeed;
            uniform float u_gridDensity;
            uniform float u_colorShift;
            uniform float u_lineThickness;
            uniform float u_shellWidth;
            uniform float u_tetraThickness;
            uniform float u_universeModifier;
            uniform float u_audioBass;
            uniform float u_audioMid;
            uniform float u_audioHigh;
            
            out vec4 fragColor;
            
            // 4D rotation matrices
            mat4 rotXW(float angle) {
                float c = cos(angle), s = sin(angle);
                return mat4(
                    c, 0, 0, -s,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    s, 0, 0, c
                );
            }
            
            mat4 rotYZ(float angle) {
                float c = cos(angle), s = sin(angle);
                return mat4(
                    1, 0, 0, 0,
                    0, c, -s, 0,
                    0, s, c, 0,
                    0, 0, 0, 1
                );
            }
            
            mat4 rotZW(float angle) {
                float c = cos(angle), s = sin(angle);
                return mat4(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, c, -s,
                    0, 0, s, c
                );
            }
            
            mat4 rotYW(float angle) {
                float c = cos(angle), s = sin(angle);
                return mat4(
                    1, 0, 0, 0,
                    0, c, 0, -s,
                    0, 0, 1, 0,
                    0, s, 0, c
                );
            }
            
            ${projectionCode}
            ${geometryCode}
            
            void main() {
                vec3 rayDir = normalize(v_worldPos);
                vec3 rayOrigin = vec3(0.0);
                
                // Ray marching
                float t = 0.0;
                float latticeValue = 0.0;
                
                for (int i = 0; i < 64; i++) {
                    vec3 p = rayOrigin + rayDir * t;
                    float d = length(p) - 2.0; // Sphere boundary
                    
                    if (d > 0.001) {
                        t += d;
                        continue;
                    }
                    
                    latticeValue = calculateLattice(p);
                    if (latticeValue > 0.01 || t > 10.0) break;
                    
                    t += 0.05;
                }
                
                // Color based on data and time
                vec3 color = vec3(0.0);
                if (latticeValue > 0.01) {
                    float hue = u_colorShift + u_time * 0.1 + latticeValue * 0.5;
                    color = 0.5 + 0.5 * cos(6.28318 * (hue + vec3(0.0, 0.33, 0.67)));
                    color *= latticeValue;
                }
                
                fragColor = vec4(color, latticeValue);
            }
        `;
        
        this.shaderProgram = this.shaderManager.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.shaderProgram);
        
        // Get uniform locations
        this.uniforms = {
            mvpMatrix: this.gl.getUniformLocation(this.shaderProgram, 'u_mvpMatrix'),
            time: this.gl.getUniformLocation(this.shaderProgram, 'u_time'),
            dimension: this.gl.getUniformLocation(this.shaderProgram, 'u_dimension'),
            morphFactor: this.gl.getUniformLocation(this.shaderProgram, 'u_morphFactor'),
            rotationSpeed: this.gl.getUniformLocation(this.shaderProgram, 'u_rotationSpeed'),
            gridDensity: this.gl.getUniformLocation(this.shaderProgram, 'u_gridDensity'),
            colorShift: this.gl.getUniformLocation(this.shaderProgram, 'u_colorShift'),
            lineThickness: this.gl.getUniformLocation(this.shaderProgram, 'u_lineThickness'),
            shellWidth: this.gl.getUniformLocation(this.shaderProgram, 'u_shellWidth'),
            tetraThickness: this.gl.getUniformLocation(this.shaderProgram, 'u_tetraThickness'),
            universeModifier: this.gl.getUniformLocation(this.shaderProgram, 'u_universeModifier'),
            audioBass: this.gl.getUniformLocation(this.shaderProgram, 'u_audioBass'),
            audioMid: this.gl.getUniformLocation(this.shaderProgram, 'u_audioMid'),
            audioHigh: this.gl.getUniformLocation(this.shaderProgram, 'u_audioHigh')
        };
    }
    
    /**
     * Create vertex buffers for rendering
     * @private
     */
    _createBuffers() {
        // Create a simple cube for ray marching
        const vertices = new Float32Array([
            -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1, // Back
            -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1, // Front
            -1, -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, // Left
             1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1, // Right
            -1, -1, -1, -1, -1,  1,  1, -1,  1,  1, -1, -1, // Bottom
            -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1  // Top
        ]);
        
        const indices = new Uint16Array([
            0,  1,  2,  0,  2,  3,  // Back
            4,  5,  6,  4,  6,  7,  // Front
            8,  9, 10,  8, 10, 11,  // Left
            12, 13, 14, 12, 14, 15,  // Right
            16, 17, 18, 16, 18, 19,  // Bottom
            20, 21, 22, 20, 22, 23   // Top
        ]);
        
        // Create vertex buffer
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        
        // Create index buffer
        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
        
        // Set up vertex attributes
        const positionLoc = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 3, this.gl.FLOAT, false, 0, 0);
    }
    
    /**
     * Render a single frame
     * @private
     */
    _render(currentTime) {
        // Update time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.time += deltaTime * 0.001;
        
        // Update from data stream
        this._updateVisualizationFromData();
        
        // Clear canvas
        this.gl.clearColor(0.05, 0.05, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Update uniforms
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform1f(this.uniforms.dimension, this.params.dimension);
        this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.params.rotationSpeed);
        this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity);
        this.gl.uniform1f(this.uniforms.colorShift, this.params.colorShift);
        this.gl.uniform1f(this.uniforms.lineThickness, 0.02);
        this.gl.uniform1f(this.uniforms.shellWidth, 0.05);
        this.gl.uniform1f(this.uniforms.tetraThickness, 0.03);
        this.gl.uniform1f(this.uniforms.universeModifier, 1.0);
        
        // Default audio values (will be overridden by audio plugin if present)
        this.gl.uniform1f(this.uniforms.audioBass, 0.0);
        this.gl.uniform1f(this.uniforms.audioMid, 0.0);
        this.gl.uniform1f(this.uniforms.audioHigh, 0.0);
        
        // Set MVP matrix
        const mvpMatrix = this._createMVPMatrix();
        this.gl.uniformMatrix4fv(this.uniforms.mvpMatrix, false, mvpMatrix);
        
        // Draw
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
        
        // Continue animation
        if (this.animationId) {
            this.animationId = requestAnimationFrame((t) => this._render(t));
        }
    }
    
    /**
     * Create Model-View-Projection matrix
     * @private
     */
    _createMVPMatrix() {
        const aspect = this.canvas.width / this.canvas.height;
        const fov = Math.PI / 4;
        const near = 0.1;
        const far = 100.0;
        
        // Perspective matrix
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        
        const perspective = new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
        
        // View matrix (camera at z=5)
        const view = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -5, 1
        ]);
        
        // Model matrix (identity for now)
        const model = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        // Multiply matrices (simplified for demo)
        return perspective;
    }
    
    /**
     * Start the visualization
     */
    start() {
        if (!this.animationId) {
            this.lastTime = performance.now();
            this.animationId = requestAnimationFrame((t) => this._render(t));
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
     * Switch geometry type
     * @param {string} geometryType - 'hypercube', 'hypersphere', or 'hypertetrahedron'
     */
    setGeometry(geometryType) {
        this.params.geometryType = geometryType;
        this._compileShaders(); // Recompile with new geometry
    }
    
    /**
     * Set projection method
     * @param {string} method - 'perspective', 'orthographic', or 'stereographic'
     */
    setProjection(method) {
        this.params.projectionMethod = method;
        this._compileShaders(); // Recompile with new projection
    }
    
    /**
     * Rotate in 4D space
     * @param {number} speed - Rotation speed multiplier
     */
    rotate4D(speed = 1.0) {
        this.params.rotationSpeed = speed;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
        if (this.vertexBuffer) {
            this.gl.deleteBuffer(this.vertexBuffer);
        }
        if (this.indexBuffer) {
            this.gl.deleteBuffer(this.indexBuffer);
        }
        if (this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
        }
    }
}

/**
 * Data stream interface for feeding data to the kernel
 */
export class DataStream {
    constructor() {
        this.data = null;
        this.listeners = [];
    }
    
    /**
     * Update the data in the stream
     * @param {*} data - New data
     */
    update(data) {
        this.data = data;
        this.listeners.forEach(listener => listener(data));
    }
    
    /**
     * Get current data
     * @returns {*} Current data
     */
    getData() {
        return this.data;
    }
    
    /**
     * Add listener for data updates
     * @param {Function} listener - Callback function
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * Remove listener
     * @param {Function} listener - Callback function to remove
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
}

export default MVEPKernel;