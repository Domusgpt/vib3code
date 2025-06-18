/* packages/mvep-kernel/src/MVEPKernel-Configurable.js - v2.1 */

/**
 * MVEP (Multimodal Visualization Enhancement Protocol) Kernel - User Configurable Edition
 * Revolutionary 4D data visualization with complete user customization
 * Built from the superior moiré hypercube pattern with scalable dimensions and custom encoding
 */
export class MVEPKernelConfigurable {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // User-configurable dimension scaling
        this.dimensionConfig = {
            minDimension: config.minDimension || 2.0,
            maxDimension: config.maxDimension || 6.0,
            defaultDimension: config.defaultDimension || 3.5,
            scaleType: config.scaleType || 'logarithmic', // linear, logarithmic, exponential
            complexityMapping: config.complexityMapping || 'depth' // depth, nodes, entropy, custom
        };
        
        // User-configurable encoding mappings
        this.encodingConfig = {
            // Data properties → Visual parameters mapping
            mappings: {
                dimension: config.dimensionMapping || {
                    dataProperty: 'depth',
                    transform: 'logarithmic',
                    range: [this.dimensionConfig.minDimension, this.dimensionConfig.maxDimension]
                },
                morphing: config.morphingMapping || {
                    dataProperty: 'complexity',
                    transform: 'linear',
                    range: [0.0, 1.0]
                },
                color: config.colorMapping || {
                    dataProperty: 'typeVariety',
                    transform: 'linear',
                    range: [0.0, 1.0],
                    palette: 'spectrum' // spectrum, thermal, plasma, custom
                },
                rotation: config.rotationMapping || {
                    dataProperty: 'changeRate',
                    transform: 'linear',
                    range: [0.0, 2.0]
                },
                density: config.densityMapping || {
                    dataProperty: 'detailLevel',
                    transform: 'exponential',
                    range: [0.3, 3.0]
                }
            },
            // Custom transform functions
            customTransforms: config.customTransforms || {},
            // User-defined data analysis functions
            customAnalysis: config.customAnalysis || {}
        };
        
        // Advanced shader configuration
        this.shaderConfig = {
            hypercubeVertices: config.hypercubeVertices || 16, // 4D: 16, 5D: 32, 6D: 64
            rotationAxes: config.rotationAxes || 6, // 4D: 6 axes, 5D: 10 axes, 6D: 15 axes
            moireComplexity: config.moireComplexity || 2, // Number of interference patterns
            rgbSplitting: config.rgbSplitting !== false, // Enable/disable RGB effects
            perspectiveDepth: config.perspectiveDepth || 3.0
        };
        
        // Data streaming
        this.dataStream = null;
        this.dataPlugin = null;
        
        // Computed visualization parameters
        this.params = {
            morphFactor: 0.5,
            dimension: this.dimensionConfig.defaultDimension,
            glitchIntensity: 0.5,
            rotationSpeed: 0.5,
            gridDensity: 10.0,
            mouseX: 0.5,
            mouseY: 0.5,
            ...config.initialParams
        };
        
        // Animation state
        this.animationId = null;
        this.startTime = Date.now();
        
        // User callback hooks
        this.hooks = {
            onParameterUpdate: config.onParameterUpdate || null,
            onDataUpdate: config.onDataUpdate || null,
            onRender: config.onRender || null
        };
        
        this._init();
    }
    
    _init() {
        // Initialize WebGL context
        this.gl.clearColor(0.05, 0.05, 0.1, 1.0);
        
        // Set viewport
        this.resize();
        
        // Compile configurable shaders
        this._compileConfigurableShaders();
        
        // Create geometry buffers
        this._createBuffers();
        
        // Setup interaction
        this._setupInteraction();
        
        // Start render loop
        this.start();
    }
    
    /**
     * Compile shaders with user-configurable parameters
     * @private
     */
    _compileConfigurableShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Generate configurable fragment shader
        const fragmentShaderSource = this._generateConfigurableFragmentShader();
        
        // Create and compile shaders
        const vertexShader = this._createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        // Create shader program
        this.program = this._createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);
        
        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            glitchIntensity: this.gl.getUniformLocation(this.program, 'u_glitchIntensity'),
            rotationSpeed: this.gl.getUniformLocation(this.program, 'u_rotationSpeed'),
            dimension: this.gl.getUniformLocation(this.program, 'u_dimension'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
            maxDimension: this.gl.getUniformLocation(this.program, 'u_maxDimension'),
            hypercubeVertices: this.gl.getUniformLocation(this.program, 'u_hypercubeVertices'),
            moireComplexity: this.gl.getUniformLocation(this.program, 'u_moireComplexity')
        };
        
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    }
    
    /**
     * Generate fragment shader based on user configuration
     * @private
     */
    _generateConfigurableFragmentShader() {
        const maxDim = this.dimensionConfig.maxDimension;
        const rotationAxes = this.shaderConfig.rotationAxes;
        const moireComplexity = this.shaderConfig.moireComplexity;
        
        return `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform float u_morphFactor;
            uniform float u_glitchIntensity;
            uniform float u_rotationSpeed;
            uniform float u_dimension;
            uniform float u_gridDensity;
            uniform float u_maxDimension;
            uniform float u_hypercubeVertices;
            uniform float u_moireComplexity;
            
            ${this._generateRotationMatrices(maxDim)}
            
            // Project n-dimensional point to 3D space
            vec3 projectNDto3D(vec4 p, float targetDim) {
                float w = 2.0 / (2.0 + p.w * (targetDim - 3.0));
                return vec3(p.x * w, p.y * w, p.z * w);
            }
            
            // Project 3D point to 2D space
            vec2 project3Dto2D(vec3 p) {
                float z = 2.0 / (${this.shaderConfig.perspectiveDepth} + p.z);
                return vec2(p.x * z, p.y * z);
            }
            
            // Configurable lattice edge calculation
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
            
            // Configurable hypercube lattice with n-dimensional support
            float hypercubeLattice(vec3 p, float morphFactor, float gridSize, float dimension) {
                // Base lattice
                float edges = latticeEdges(p, gridSize, 0.03);
                float vertices = latticeVertices(p, gridSize, 0.05);
                
                // Time-based rotation
                float timeFactor = u_time * 0.2 * u_rotationSpeed;
                
                // Data-driven distortion
                vec3 distortedP = p;
                distortedP.x += sin(p.z * 2.0 + timeFactor) * morphFactor * 0.2;
                distortedP.y += cos(p.x * 2.0 + timeFactor) * morphFactor * 0.2;
                distortedP.z += sin(p.y * 2.0 + timeFactor) * morphFactor * 0.1;
                
                // N-dimensional hypercube projection
                if (dimension > 3.0) {
                    // Create n-dimensional point
                    float w = sin(length(p) * 3.0 + u_time * 0.3) * (dimension - 3.0);
                    vec4 pND = vec4(distortedP, w);
                    
                    // Apply multiple rotation matrices based on target dimension
                    ${this._generateDynamicRotations()}
                    
                    // Project back to 3D
                    distortedP = projectNDto3D(pND, dimension);
                }
                
                // Calculate lattice for distorted position
                float distortedEdges = latticeEdges(distortedP, gridSize, 0.03);
                float distortedVertices = latticeVertices(distortedP, gridSize, 0.05);
                
                // Blend based on morphFactor
                edges = mix(edges, distortedEdges, morphFactor);
                vertices = mix(vertices, distortedVertices, morphFactor);
                
                return max(edges, vertices);
            }
            
            ${this._generateMoirePatterns(moireComplexity)}
            
            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                float aspectRatio = u_resolution.x / u_resolution.y;
                uv.x *= aspectRatio;
                
                vec2 center = vec2(u_mouse.x * aspectRatio, u_mouse.y);
                vec3 p = vec3(uv - center, 0.0);
                
                // Apply rotation
                float timeRotation = u_time * 0.2 * u_rotationSpeed;
                mat2 rotation = mat2(
                    cos(timeRotation), -sin(timeRotation),
                    sin(timeRotation), cos(timeRotation)
                );
                p.xy = rotation * p.xy;
                p.z = sin(u_time * 0.1) * 0.5;
                
                // Calculate main hypercube lattice with configurable dimension
                float lattice = hypercubeLattice(p, u_morphFactor, u_gridDensity, u_dimension);
                
                ${this._generateRGBSplitting()}
                
                ${this._generateColorMapping()}
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }
    
    /**
     * Generate rotation matrices for n-dimensional space
     * @private
     */
    _generateRotationMatrices(maxDim) {
        let matrices = '';
        
        // Generate all possible rotation matrices for max dimension
        const axes = ['x', 'y', 'z', 'w', 'v', 'u']; // Up to 6D
        
        for (let i = 0; i < axes.length && i < maxDim; i++) {
            for (let j = i + 1; j < axes.length && j < maxDim; j++) {
                const axis1 = axes[i];
                const axis2 = axes[j];
                
                matrices += `
                    mat4 rotate${axis1.toUpperCase()}${axis2.toUpperCase()}(float theta) {
                        float c = cos(theta);
                        float s = sin(theta);
                        mat4 m = mat4(1.0);
                        m[${i}][${i}] = c; m[${i}][${j}] = -s;
                        m[${j}][${i}] = s; m[${j}][${j}] = c;
                        return m;
                    }
                `;
            }
        }
        
        return matrices;
    }
    
    /**
     * Generate dynamic rotation application based on dimension
     * @private
     */
    _generateDynamicRotations() {
        return `
            // Apply rotations based on actual dimension
            if (dimension >= 4.0) {
                pND = rotateXW(timeFactor * 0.31) * pND;
                pND = rotateYW(timeFactor * 0.27) * pND;
                pND = rotateZW(timeFactor * 0.23) * pND;
            }
            if (dimension >= 5.0) {
                pND = rotateXV(timeFactor * 0.19) * pND;
                pND = rotateYV(timeFactor * 0.17) * pND;
                pND = rotateZV(timeFactor * 0.13) * pND;
                pND = rotateWV(timeFactor * 0.11) * pND;
            }
            if (dimension >= 6.0) {
                pND = rotateXU(timeFactor * 0.07) * pND;
                pND = rotateYU(timeFactor * 0.05) * pND;
                pND = rotateZU(timeFactor * 0.03) * pND;
                pND = rotateWU(timeFactor * 0.02) * pND;
                pND = rotateVU(timeFactor * 0.01) * pND;
            }
        `;
    }
    
    /**
     * Generate moiré interference patterns
     * @private
     */
    _generateMoirePatterns(complexity) {
        let patterns = '';
        
        for (let i = 0; i < complexity; i++) {
            const offset1 = 1.0 + (i * 0.01);
            const offset2 = 1.0 - (i * 0.01);
            
            patterns += `
                float moireGrid${i}A = hypercubeLattice(p, u_morphFactor, u_gridDensity * ${offset1}, u_dimension);
                float moireGrid${i}B = hypercubeLattice(p, u_morphFactor, u_gridDensity * ${offset2}, u_dimension);
                float moire${i} = abs(moireGrid${i}A - moireGrid${i}B) * 0.${5 - i};
            `;
        }
        
        return patterns;
    }
    
    /**
     * Generate RGB splitting effects
     * @private
     */
    _generateRGBSplitting() {
        if (!this.shaderConfig.rgbSplitting) {
            return `
                vec3 color = mix(vec3(0.1, 0.2, 0.4), vec3(0.9, 0.8, 1.0), lattice);
            `;
        }
        
        return `
            // RGB color splitting for advanced visual effects
            float glitchAmount = u_glitchIntensity * (0.1 + 0.1 * sin(u_time * 5.0));
            
            vec2 rOffset = vec2(glitchAmount, glitchAmount * 0.5);
            vec2 gOffset = vec2(-glitchAmount * 0.3, glitchAmount * 0.2);
            vec2 bOffset = vec2(glitchAmount * 0.1, -glitchAmount * 0.4);
            
            float r = hypercubeLattice(vec3(p.xy + rOffset, p.z), u_morphFactor, u_gridDensity, u_dimension);
            float g = hypercubeLattice(vec3(p.xy + gOffset, p.z), u_morphFactor, u_gridDensity, u_dimension);
            float b = hypercubeLattice(vec3(p.xy + bOffset, p.z), u_morphFactor, u_gridDensity, u_dimension);
            
            // Apply moiré patterns to color channels
            ${this._generateMoireBlending()}
        `;
    }
    
    /**
     * Generate moiré pattern blending
     * @private
     */
    _generateMoireBlending() {
        let blending = '';
        
        for (let i = 0; i < this.shaderConfig.moireComplexity; i++) {
            blending += `
                r = mix(r, moire${i}, 0.${3 + i});
                g = mix(g, moire${i}, 0.${4 + i});
                b = mix(b, moire${i}, 0.${5 + i});
            `;
        }
        
        return blending;
    }
    
    /**
     * Generate color mapping based on user configuration
     * @private
     */
    _generateColorMapping() {
        const palette = this.encodingConfig.mappings.color.palette;
        
        switch (palette) {
            case 'thermal':
                return `
                    vec3 baseColor = vec3(0.0, 0.0, 0.4);
                    vec3 hotColor = vec3(1.0, 0.4, 0.0);
                    vec3 color = mix(baseColor, hotColor, vec3(r, g, b));
                `;
            case 'plasma':
                return `
                    vec3 color = vec3(
                        0.5 + 0.5 * sin(r * 3.14159 + 0.0),
                        0.5 + 0.5 * sin(g * 3.14159 + 2.094),
                        0.5 + 0.5 * sin(b * 3.14159 + 4.188)
                    );
                `;
            default: // spectrum
                return `
                    vec3 baseColor = vec3(0.1, 0.2, 0.4);
                    vec3 latticeColor = vec3(0.9, 0.8, 1.0);
                    vec3 color = mix(baseColor, latticeColor, vec3(r, g, b));
                    
                    // Add pulsing glow
                    color += vec3(0.1, 0.2, 0.4) * (0.5 + 0.5 * sin(u_time * 0.5));
                    
                    // Vignette effect
                    float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - center));
                    color *= vignette;
                `;
        }
    }
    
    /**
     * Update data analysis and mapping configuration
     * @param {Object} config - New configuration
     */
    updateConfiguration(config) {
        // Merge new configuration
        if (config.dimensionConfig) {
            Object.assign(this.dimensionConfig, config.dimensionConfig);
        }
        if (config.encodingConfig) {
            // Deep merge encoding configuration
            if (config.encodingConfig.mappings) {
                Object.assign(this.encodingConfig.mappings, config.encodingConfig.mappings);
            }
            if (config.encodingConfig.customTransforms) {
                Object.assign(this.encodingConfig.customTransforms, config.encodingConfig.customTransforms);
            }
        }
        if (config.shaderConfig) {
            Object.assign(this.shaderConfig, config.shaderConfig);
        }
        
        // Recompile shaders if needed
        if (config.shaderConfig) {
            this._compileConfigurableShaders();
        }
        
        // Trigger re-analysis of current data
        if (this.dataStream && this.dataPlugin) {
            this._updateVisualizationFromData();
        }
    }
    
    /**
     * Advanced data analysis with user-configurable mapping
     * @private
     */
    _updateVisualizationFromData() {
        if (!this.dataStream || !this.dataPlugin) return;
        
        const data = this.dataStream.getData();
        
        // Use custom analysis if provided
        const analysis = this.encodingConfig.customAnalysis.analyze ? 
            this.encodingConfig.customAnalysis.analyze(data) :
            this._defaultAnalysis(data);
        
        // Apply user-configured mappings
        Object.keys(this.encodingConfig.mappings).forEach(param => {
            const mapping = this.encodingConfig.mappings[param];
            const dataValue = analysis[mapping.dataProperty] || 0;
            
            // Apply transform
            let transformedValue = this._applyTransform(dataValue, mapping.transform, mapping);
            
            // Clamp to range
            transformedValue = Math.max(mapping.range[0], 
                Math.min(mapping.range[1], transformedValue));
            
            this.params[param] = transformedValue;
        });
        
        // Call user hook
        if (this.hooks.onDataUpdate) {
            this.hooks.onDataUpdate(analysis, this.params);
        }
    }
    
    /**
     * Apply transform function to data value
     * @private
     */
    _applyTransform(value, transform, mapping) {
        // Use custom transform if provided
        if (this.encodingConfig.customTransforms[transform]) {
            return this.encodingConfig.customTransforms[transform](value, mapping);
        }
        
        // Built-in transforms
        switch (transform) {
            case 'logarithmic':
                return Math.log(Math.max(1, value));
            case 'exponential':
                return Math.exp(value / 10);
            case 'sqrt':
                return Math.sqrt(Math.max(0, value));
            case 'power':
                const power = mapping.power || 2;
                return Math.pow(Math.max(0, value), power);
            case 'sigmoid':
                return 1 / (1 + Math.exp(-value));
            default: // linear
                return value;
        }
    }
    
    /**
     * Default data analysis
     * @private
     */
    _defaultAnalysis(data) {
        return {
            depth: this._getDepth(data),
            complexity: this._getComplexity(data),
            typeVariety: this._getTypeVariety(data),
            changeRate: this._getChangeRate(data),
            detailLevel: this._getDetailLevel(data),
            nodes: this._countNodes(data)
        };
    }
    
    // Helper analysis methods
    _getDepth(obj, current = 0) {
        if (typeof obj !== 'object' || obj === null) return current;
        let maxDepth = current;
        for (let key in obj) {
            maxDepth = Math.max(maxDepth, this._getDepth(obj[key], current + 1));
        }
        return maxDepth;
    }
    
    _getComplexity(obj) {
        return JSON.stringify(obj).length / 100; // Normalize to reasonable range
    }
    
    _getTypeVariety(obj, types = new Set()) {
        if (obj === null) return types.add('null').size;
        if (Array.isArray(obj)) {
            types.add('array');
            obj.forEach(item => this._getTypeVariety(item, types));
        } else if (typeof obj === 'object') {
            types.add('object');
            Object.values(obj).forEach(value => this._getTypeVariety(value, types));
        } else {
            types.add(typeof obj);
        }
        return types.size;
    }
    
    _getChangeRate(data) {
        // Simple heuristic based on array lengths and nested changes
        return Math.random(); // Placeholder - would track actual change rate over time
    }
    
    _getDetailLevel(obj) {
        return Object.keys(obj || {}).length;
    }
    
    _countNodes(obj) {
        if (typeof obj !== 'object' || obj === null) return 1;
        let count = 1;
        for (let key in obj) {
            count += this._countNodes(obj[key]);
        }
        return count;
    }
    
    // Rest of the methods from MVEPKernelAdvanced...
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
    
    _createBuffers() {
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
    
    _setupInteraction() {
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.params.mouseX = (event.clientX - rect.left) / rect.width;
            this.params.mouseY = 1.0 - (event.clientY - rect.top) / rect.height;
        });
        
        this.canvas.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const rect = this.canvas.getBoundingClientRect();
                this.params.mouseX = (event.touches[0].clientX - rect.left) / rect.width;
                this.params.mouseY = 1.0 - (event.touches[0].clientY - rect.top) / rect.height;
                event.preventDefault();
            }
        }, { passive: false });
        
        window.addEventListener('resize', () => this.resize());
    }
    
    injectDataStream(stream, plugin) {
        this.dataStream = stream;
        this.dataPlugin = plugin;
        
        if (this.dataStream && this.dataPlugin) {
            this._updateVisualizationFromData();
        }
    }
    
    _render() {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.startTime) / 1000;
        
        this._updateVisualizationFromData();
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.program);
        
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Set all uniforms including configurable ones
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, elapsedTime);
        this.gl.uniform2f(this.uniforms.mouse, this.params.mouseX, this.params.mouseY);
        this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        this.gl.uniform1f(this.uniforms.glitchIntensity, this.params.glitchIntensity);
        this.gl.uniform1f(this.uniforms.rotationSpeed, this.params.rotationSpeed);
        this.gl.uniform1f(this.uniforms.dimension, this.params.dimension);
        this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity);
        this.gl.uniform1f(this.uniforms.maxDimension, this.dimensionConfig.maxDimension);
        this.gl.uniform1f(this.uniforms.hypercubeVertices, this.shaderConfig.hypercubeVertices);
        this.gl.uniform1f(this.uniforms.moireComplexity, this.shaderConfig.moireComplexity);
        
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        // Call user render hook
        if (this.hooks.onRender) {
            this.hooks.onRender(this.params, elapsedTime);
        }
        
        if (this.animationId) {
            this.animationId = requestAnimationFrame(() => this._render());
        }
    }
    
    start() {
        if (!this.animationId) {
            this.animationId = requestAnimationFrame(() => this._render());
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
        }
    }
    
    updateParams(params) {
        Object.assign(this.params, params);
        
        if (this.hooks.onParameterUpdate) {
            this.hooks.onParameterUpdate(this.params);
        }
    }
    
    getState() {
        return {
            params: { ...this.params },
            dimensionConfig: { ...this.dimensionConfig },
            encodingConfig: { ...this.encodingConfig },
            shaderConfig: { ...this.shaderConfig },
            time: (Date.now() - this.startTime) / 1000
        };
    }
    
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

export default MVEPKernelConfigurable;