/**
 * VIB3CODE MULTI-VISUALIZER WEBGL SYSTEM
 * 
 * DIRECT WEBGL APPROACH - No kernelized abstraction
 * Multiple simultaneous visualizer instances per section
 * Integrates with existing home-master parameter system
 * 
 * ARCHITECTURE DECISION: Use Direct WebGL instead of complex kernel system
 * See: TECHNICAL_ARCHITECTURE_DECISION.md
 */

console.log('🎯 VIB3CODE Multi-Visualizer WebGL - Direct Implementation Loading...');

class VIB3MultiVisualizerWebGL {
    constructor(canvas, homeMasterSystem) {
        this.canvas = canvas;
        this.homeMaster = homeMasterSystem;
        this.instancesPerSection = 3; // 3+ visualizers per section
        
        // Initialize WebGL context
        this.gl = this.initializeWebGL();
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // Multi-visualizer state
        this.currentSection = 'home';
        this.instances = [];
        this.shaderProgram = null;
        this.buffers = {};
        
        // Animation state
        this.time = 0;
        this.animationId = null;
        this.isRunning = false;
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        console.log('🎨 Multi-Visualizer WebGL initialized');
    }
    
    initializeWebGL() {
        const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.error('❌ WebGL not supported');
            return null;
        }
        
        // Set canvas size
        this.resizeCanvas();
        
        // WebGL setup
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.02, 0.02, 0.08, 1.0); // Dark background
        
        // Handle canvas resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('✅ WebGL context initialized');
        return gl;
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    async initialize() {
        try {
            // Initialize shaders
            await this.initializeShaders();
            
            // Initialize geometry buffers
            this.initializeGeometryBuffers();
            
            // Create initial instances for current section
            this.createInstances(this.currentSection);
            
            console.log('✅ Multi-Visualizer WebGL fully initialized');
            return this;
            
        } catch (error) {
            console.error('❌ Multi-Visualizer WebGL initialization failed:', error);
            throw error;
        }
    }
    
    async initializeShaders() {
        // Vertex shader - handles 4D to 3D projection
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_modelMatrix;
            uniform float u_time;
            uniform float u_dimension;
            uniform float u_morphFactor;
            
            varying vec4 v_color;
            varying float v_depth;
            
            // 4D rotation matrices
            mat4 rotateXW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, 0.0, 0.0, -s,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    s, 0.0, 0.0, c
                );
            }
            
            mat4 rotateYZ(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, c, -s, 0.0,
                    0.0, s, c, 0.0,
                    0.0, 0.0, 0.0, 1.0
                );
            }
            
            void main() {
                vec4 pos = a_position;
                
                // 4D transformations
                pos = rotateXW(u_time * 0.3) * pos;
                pos = rotateYZ(u_time * 0.2) * pos;
                
                // 4D to 3D projection (perspective)
                float w = pos.w + 2.0; // Distance from 4D "camera"
                vec3 projected = pos.xyz / (w * 0.5);
                
                // Apply model transformations
                vec4 worldPos = u_modelMatrix * vec4(projected, 1.0);
                
                gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
                
                // Color based on 4D depth and parameters
                float intensity = 0.5 + 0.5 * sin(u_time + pos.w);
                v_color = vec4(a_color.rgb * intensity, a_color.a);
                v_depth = gl_Position.z;
            }
        `;
        
        // Fragment shader - handles visual effects
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec4 v_color;
            varying float v_depth;
            
            uniform float u_time;
            uniform float u_glitchIntensity;
            uniform vec3 u_baseColor;
            
            void main() {
                vec4 color = v_color;
                
                // Add base color tinting
                color.rgb *= u_baseColor;
                
                // Glitch effects
                if (u_glitchIntensity > 0.0) {
                    float glitch = sin(u_time * 10.0 + v_depth * 20.0) * u_glitchIntensity;
                    color.rgb += vec3(glitch * 0.1, 0.0, glitch * 0.2);
                }
                
                // Depth-based alpha
                color.a *= (1.0 - abs(v_depth) * 0.3);
                
                gl_FragColor = color;
            }
        `;
        
        // Compile and link shaders
        this.shaderProgram = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        
        if (!this.shaderProgram) {
            throw new Error('Failed to create shader program');
        }
        
        // Get attribute and uniform locations
        this.shaderLocations = {
            attributes: {
                position: this.gl.getAttribLocation(this.shaderProgram, 'a_position'),
                color: this.gl.getAttribLocation(this.shaderProgram, 'a_color')
            },
            uniforms: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'u_projectionMatrix'),
                viewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'u_viewMatrix'),
                modelMatrix: this.gl.getUniformLocation(this.shaderProgram, 'u_modelMatrix'),
                time: this.gl.getUniformLocation(this.shaderProgram, 'u_time'),
                dimension: this.gl.getUniformLocation(this.shaderProgram, 'u_dimension'),
                morphFactor: this.gl.getUniformLocation(this.shaderProgram, 'u_morphFactor'),
                glitchIntensity: this.gl.getUniformLocation(this.shaderProgram, 'u_glitchIntensity'),
                baseColor: this.gl.getUniformLocation(this.shaderProgram, 'u_baseColor')
            }
        };
        
        console.log('🎨 Shaders compiled and linked');
    }
    
    createShaderProgram(vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('❌ Shader program link error:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('❌ Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    initializeGeometryBuffers() {
        // Create geometry for different shapes
        this.geometries = {
            hypercube: this.createHypercubeGeometry(),
            tetrahedron: this.createTetrahedronGeometry(),
            sphere: this.createSphereGeometry(),
            torus: this.createTorusGeometry(),
            wave: this.createWaveGeometry()
        };
        
        console.log('🔷 Geometry buffers created');
    }
    
    createHypercubeGeometry() {
        // 4D hypercube vertices (16 vertices, 4D coordinates)
        const vertices = [
            // Inner cube
            -1, -1, -1, -1,
             1, -1, -1, -1,
             1,  1, -1, -1,
            -1,  1, -1, -1,
            -1, -1,  1, -1,
             1, -1,  1, -1,
             1,  1,  1, -1,
            -1,  1,  1, -1,
            // Outer cube
            -1, -1, -1,  1,
             1, -1, -1,  1,
             1,  1, -1,  1,
            -1,  1, -1,  1,
            -1, -1,  1,  1,
             1, -1,  1,  1,
             1,  1,  1,  1,
            -1,  1,  1,  1
        ];
        
        // Colors (magenta theme for home)
        const colors = [];
        for (let i = 0; i < 16; i++) {
            colors.push(1.0, 0.0, 1.0, 0.8); // Magenta
        }
        
        // Edges connecting hypercube vertices
        const indices = [
            // Inner cube edges
            0,1, 1,2, 2,3, 3,0,
            4,5, 5,6, 6,7, 7,4,
            0,4, 1,5, 2,6, 3,7,
            // Outer cube edges
            8,9, 9,10, 10,11, 11,8,
            12,13, 13,14, 14,15, 15,12,
            8,12, 9,13, 10,14, 11,15,
            // Inner to outer connections
            0,8, 1,9, 2,10, 3,11,
            4,12, 5,13, 6,14, 7,15
        ];
        
        return this.createBuffers(vertices, colors, indices);
    }
    
    createTetrahedronGeometry() {
        // 4D tetrahedron (5 vertices)
        const vertices = [
            0, 0, 0, 0,
            1, 1, 1, 1,
            1, -1, -1, 1,
            -1, 1, -1, 1,
            -1, -1, 1, 1
        ];
        
        // Colors (cyan theme for articles)
        const colors = [];
        for (let i = 0; i < 5; i++) {
            colors.push(0.0, 1.0, 1.0, 0.8); // Cyan
        }
        
        // Connect all vertices to each other
        const indices = [
            0,1, 0,2, 0,3, 0,4,
            1,2, 1,3, 1,4,
            2,3, 2,4,
            3,4
        ];
        
        return this.createBuffers(vertices, colors, indices);
    }
    
    createSphereGeometry() {
        // Simplified 4D sphere using latitude/longitude approach
        const vertices = [];
        const colors = [];
        const indices = [];
        
        const rings = 8;
        const sectors = 12;
        
        for (let r = 0; r < rings; r++) {
            for (let s = 0; s < sectors; s++) {
                const phi = (r / rings) * Math.PI;
                const theta = (s / sectors) * Math.PI * 2;
                const w = (r / rings - 0.5) * 2; // 4th dimension
                
                const x = Math.sin(phi) * Math.cos(theta);
                const y = Math.sin(phi) * Math.sin(theta);
                const z = Math.cos(phi);
                
                vertices.push(x, y, z, w);
                colors.push(1.0, 1.0, 0.0, 0.7); // Yellow
            }
        }
        
        // Create line indices for wireframe sphere
        for (let r = 0; r < rings - 1; r++) {
            for (let s = 0; s < sectors; s++) {
                const current = r * sectors + s;
                const next = r * sectors + ((s + 1) % sectors);
                const below = (r + 1) * sectors + s;
                
                indices.push(current, next);
                indices.push(current, below);
            }
        }
        
        return this.createBuffers(vertices, colors, indices);
    }
    
    createTorusGeometry() {
        // 4D torus
        const vertices = [];
        const colors = [];
        const indices = [];
        
        const majorRadius = 1.5;
        const minorRadius = 0.5;
        const majorSegments = 16;
        const minorSegments = 8;
        
        for (let i = 0; i < majorSegments; i++) {
            for (let j = 0; j < minorSegments; j++) {
                const u = (i / majorSegments) * Math.PI * 2;
                const v = (j / minorSegments) * Math.PI * 2;
                
                const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
                const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
                const z = minorRadius * Math.sin(v);
                const w = Math.sin(u * 2) * 0.5; // 4th dimension variation
                
                vertices.push(x, y, z, w);
                colors.push(0.0, 1.0, 0.0, 0.7); // Green
            }
        }
        
        // Create indices for torus wireframe
        for (let i = 0; i < majorSegments; i++) {
            for (let j = 0; j < minorSegments; j++) {
                const current = i * minorSegments + j;
                const nextI = ((i + 1) % majorSegments) * minorSegments + j;
                const nextJ = i * minorSegments + ((j + 1) % minorSegments);
                
                indices.push(current, nextI);
                indices.push(current, nextJ);
            }
        }
        
        return this.createBuffers(vertices, colors, indices);
    }
    
    createWaveGeometry() {
        // 4D wave function
        const vertices = [];
        const colors = [];
        const indices = [];
        
        const size = 20;
        const step = 0.3;
        
        for (let x = -size; x <= size; x += step) {
            for (let y = -size; y <= size; y += step) {
                const z = Math.sin(x * 0.3) * Math.cos(y * 0.3);
                const w = Math.sin(x * 0.2 + y * 0.2) * 0.5;
                
                vertices.push(x * 0.1, y * 0.1, z * 0.5, w);
                colors.push(1.0, 0.0, 1.0, 0.6); // Pink
            }
        }
        
        // Create grid connections
        const pointsPerRow = Math.floor((size * 2) / step) + 1;
        for (let i = 0; i < vertices.length / 4 - pointsPerRow; i++) {
            if ((i + 1) % pointsPerRow !== 0) {
                indices.push(i, i + 1); // Horizontal
            }
            indices.push(i, i + pointsPerRow); // Vertical
        }
        
        return this.createBuffers(vertices, colors, indices);
    }
    
    createBuffers(vertices, colors, indices) {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        
        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        
        const indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
        
        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer,
            vertexCount: vertices.length / 4,
            indexCount: indices.length
        };
    }
    
    createInstances(sectionId) {
        // Clear existing instances
        this.instances = [];
        
        // Get base parameters from home-master system
        const baseParams = this.homeMaster ? 
            this.homeMaster.getSectionConfig(sectionId) : 
            this.getDefaultParams(sectionId);
        
        // Get geometry type for this section
        const geometryType = this.homeMaster ? 
            this.homeMaster.FIXED_GEOMETRIES[sectionId] : 
            this.getDefaultGeometry(sectionId);
        
        // Create 3 instances with parameter variations
        for (let i = 0; i < this.instancesPerSection; i++) {
            const instanceParams = this.createInstanceVariation(baseParams, i);
            const instance = {
                id: `${sectionId}_instance_${i}`,
                geometry: geometryType,
                params: instanceParams,
                position: this.getInstancePosition(i),
                matrix: this.createIdentityMatrix()
            };
            
            this.instances.push(instance);
        }
        
        console.log(`🎨 Created ${this.instances.length} instances for section: ${sectionId}`);
    }
    
    createInstanceVariation(baseParams, instanceIndex) {
        // Parameter variations for visual richness
        const variations = [
            { speedMultiplier: 0.5, scaleMultiplier: 1.2, offsetX: -0.3 },  // Slow & large, left
            { speedMultiplier: 1.0, scaleMultiplier: 1.0, offsetX: 0.0 },   // Normal, center
            { speedMultiplier: 1.5, scaleMultiplier: 0.8, offsetX: 0.3 }    // Fast & small, right
        ];
        
        const variation = variations[instanceIndex] || variations[0];
        
        return {
            ...baseParams,
            rotationSpeed: baseParams.rotationSpeed * variation.speedMultiplier,
            scale: baseParams.scale * variation.scaleMultiplier,
            offsetX: variation.offsetX,
            instanceId: instanceIndex
        };
    }
    
    getInstancePosition(instanceIndex) {
        // Position instances side by side
        const spacing = 2.5;
        const totalWidth = (this.instancesPerSection - 1) * spacing;
        const startX = -totalWidth / 2;
        
        return {
            x: startX + instanceIndex * spacing,
            y: 0,
            z: 0
        };
    }
    
    getDefaultParams(sectionId) {
        // Fallback parameters if home-master system not available
        const defaults = {
            home: { rotationSpeed: 0.5, scale: 1.0, dimension: 3.5, glitchIntensity: 0.2 },
            articles: { rotationSpeed: 0.4, scale: 0.8, dimension: 3.2, glitchIntensity: 0.1 },
            videos: { rotationSpeed: 0.6, scale: 1.2, dimension: 3.8, glitchIntensity: 0.3 },
            podcasts: { rotationSpeed: 0.55, scale: 1.1, dimension: 3.6, glitchIntensity: 0.25 },
            ema: { rotationSpeed: 0.45, scale: 0.9, dimension: 3.3, glitchIntensity: 0.15 }
        };
        
        return defaults[sectionId] || defaults.home;
    }
    
    getDefaultGeometry(sectionId) {
        // Fallback geometry mapping
        const geometries = {
            home: 'hypercube',
            articles: 'tetrahedron',
            videos: 'sphere',
            podcasts: 'torus',
            ema: 'wave'
        };
        
        return geometries[sectionId] || 'hypercube';
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
        
        console.log('🎬 Multi-Visualizer animation started');
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        console.log('⏹️ Multi-Visualizer animation stopped');
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update time for animations
        this.time += deltaTime * 0.001;
        
        // Update FPS counter
        this.updateFPS();
        
        // Render frame
        this.render();
        
        // Schedule next frame
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
        
        if (!this.lastFPSUpdate) {
            this.lastFPSUpdate = currentTime;
        }
    }
    
    render() {
        // Clear canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Use shader program
        this.gl.useProgram(this.shaderProgram);
        
        // Set up projection matrix
        const projectionMatrix = this.createPerspectiveMatrix(
            Math.PI / 4, // FOV
            this.canvas.width / this.canvas.height, // Aspect ratio
            0.1, // Near
            100.0 // Far
        );
        
        // Set up view matrix (camera)
        const viewMatrix = this.createViewMatrix();
        
        // Set uniform matrices
        this.gl.uniformMatrix4fv(this.shaderLocations.uniforms.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.shaderLocations.uniforms.viewMatrix, false, viewMatrix);
        this.gl.uniform1f(this.shaderLocations.uniforms.time, this.time);
        
        // Render each instance
        this.instances.forEach(instance => {
            this.renderInstance(instance);
        });
    }
    
    renderInstance(instance) {
        const geometry = this.geometries[instance.geometry];
        if (!geometry) return;
        
        // Create model matrix for this instance
        const modelMatrix = this.createModelMatrix(instance);
        this.gl.uniformMatrix4fv(this.shaderLocations.uniforms.modelMatrix, false, modelMatrix);
        
        // Set instance-specific uniforms
        this.gl.uniform1f(this.shaderLocations.uniforms.dimension, instance.params.dimension || 3.5);
        this.gl.uniform1f(this.shaderLocations.uniforms.morphFactor, instance.params.morphFactor || 0.5);
        this.gl.uniform1f(this.shaderLocations.uniforms.glitchIntensity, instance.params.glitchIntensity || 0.2);
        
        // Set color based on geometry type
        const baseColor = this.getGeometryColor(instance.geometry);
        this.gl.uniform3fv(this.shaderLocations.uniforms.baseColor, baseColor);
        
        // Bind geometry buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.position);
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.position);
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.position, 4, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.color);
        this.gl.enableVertexAttribArray(this.shaderLocations.attributes.color);
        this.gl.vertexAttribPointer(this.shaderLocations.attributes.color, 4, this.gl.FLOAT, false, 0, 0);
        
        // Draw geometry
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        this.gl.drawElements(this.gl.LINES, geometry.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    
    createModelMatrix(instance) {
        const matrix = this.createIdentityMatrix();
        
        // Apply transformations
        this.translateMatrix(matrix, instance.position.x, instance.position.y, instance.position.z);
        this.scaleMatrix(matrix, instance.params.scale, instance.params.scale, instance.params.scale);
        
        // Apply rotation based on time and instance parameters
        const rotationSpeed = instance.params.rotationSpeed || 0.5;
        const rotX = this.time * rotationSpeed * 0.7;
        const rotY = this.time * rotationSpeed;
        const rotZ = this.time * rotationSpeed * 0.3;
        
        this.rotateMatrix(matrix, rotX, 1, 0, 0);
        this.rotateMatrix(matrix, rotY, 0, 1, 0);
        this.rotateMatrix(matrix, rotZ, 0, 0, 1);
        
        return matrix;
    }
    
    getGeometryColor(geometryType) {
        // Color themes for different geometries
        const colors = {
            hypercube: [1.0, 0.0, 1.0],    // Magenta
            tetrahedron: [0.0, 1.0, 1.0],  // Cyan
            sphere: [1.0, 1.0, 0.0],       // Yellow
            torus: [0.0, 1.0, 0.0],        // Green
            wave: [1.0, 0.0, 1.0]          // Pink
        };
        
        return colors[geometryType] || [1.0, 1.0, 1.0];
    }
    
    // Matrix utility functions
    createIdentityMatrix() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }
    
    createViewMatrix() {
        // Simple view matrix - camera looking at origin from a distance
        const matrix = this.createIdentityMatrix();
        this.translateMatrix(matrix, 0, 0, -8);
        return matrix;
    }
    
    translateMatrix(matrix, x, y, z) {
        matrix[12] += matrix[0] * x + matrix[4] * y + matrix[8] * z;
        matrix[13] += matrix[1] * x + matrix[5] * y + matrix[9] * z;
        matrix[14] += matrix[2] * x + matrix[6] * y + matrix[10] * z;
        matrix[15] += matrix[3] * x + matrix[7] * y + matrix[11] * z;
    }
    
    scaleMatrix(matrix, x, y, z) {
        matrix[0] *= x; matrix[1] *= x; matrix[2] *= x; matrix[3] *= x;
        matrix[4] *= y; matrix[5] *= y; matrix[6] *= y; matrix[7] *= y;
        matrix[8] *= z; matrix[9] *= z; matrix[10] *= z; matrix[11] *= z;
    }
    
    rotateMatrix(matrix, angle, x, y, z) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const oneMinusC = 1 - c;
        
        const xx = x * x; const yy = y * y; const zz = z * z;
        const xy = x * y; const xz = x * z; const yz = y * z;
        const xs = x * s; const ys = y * s; const zs = z * s;
        
        const r00 = xx * oneMinusC + c;
        const r01 = xy * oneMinusC + zs;
        const r02 = xz * oneMinusC - ys;
        const r10 = xy * oneMinusC - zs;
        const r11 = yy * oneMinusC + c;
        const r12 = yz * oneMinusC + xs;
        const r20 = xz * oneMinusC + ys;
        const r21 = yz * oneMinusC - xs;
        const r22 = zz * oneMinusC + c;
        
        const m00 = matrix[0], m01 = matrix[1], m02 = matrix[2], m03 = matrix[3];
        const m10 = matrix[4], m11 = matrix[5], m12 = matrix[6], m13 = matrix[7];
        const m20 = matrix[8], m21 = matrix[9], m22 = matrix[10], m23 = matrix[11];
        
        matrix[0] = r00 * m00 + r01 * m10 + r02 * m20;
        matrix[1] = r00 * m01 + r01 * m11 + r02 * m21;
        matrix[2] = r00 * m02 + r01 * m12 + r02 * m22;
        matrix[3] = r00 * m03 + r01 * m13 + r02 * m23;
        matrix[4] = r10 * m00 + r11 * m10 + r12 * m20;
        matrix[5] = r10 * m01 + r11 * m11 + r12 * m21;
        matrix[6] = r10 * m02 + r11 * m12 + r12 * m22;
        matrix[7] = r10 * m03 + r11 * m13 + r12 * m23;
        matrix[8] = r20 * m00 + r21 * m10 + r22 * m20;
        matrix[9] = r20 * m01 + r21 * m11 + r22 * m21;
        matrix[10] = r20 * m02 + r21 * m12 + r22 * m22;
        matrix[11] = r20 * m03 + r21 * m13 + r22 * m23;
    }
    
    // Public interface methods
    switchSection(sectionId) {
        if (this.currentSection === sectionId) return;
        
        this.currentSection = sectionId;
        this.createInstances(sectionId);
        
        console.log(`🔄 Switched to section: ${sectionId} with ${this.instances.length} instances`);
    }
    
    updateParameters(newParams) {
        // Update all instances with new parameters from home-master
        this.instances.forEach((instance, index) => {
            instance.params = this.createInstanceVariation(newParams, index);
        });
    }
    
    getPerformanceInfo() {
        return {
            fps: this.fps,
            instances: this.instances.length,
            section: this.currentSection,
            isRunning: this.isRunning,
            webglContextLost: this.gl.isContextLost()
        };
    }
    
    dispose() {
        this.stop();
        
        // Clean up WebGL resources
        if (this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
        }
        
        Object.values(this.geometries || {}).forEach(geometry => {
            if (geometry.position) this.gl.deleteBuffer(geometry.position);
            if (geometry.color) this.gl.deleteBuffer(geometry.color);
            if (geometry.indices) this.gl.deleteBuffer(geometry.indices);
        });
        
        console.log('🗑️ Multi-Visualizer WebGL disposed');
    }
}

// Global initialization function
let vib3MultiVisualizer = null;

async function initializeVIB3MultiVisualizer() {
    try {
        console.log('🚀 Starting VIB3 Multi-Visualizer WebGL System...');
        
        // Get or create canvas
        let canvas = document.getElementById('vib3-visualizer-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'vib3-visualizer-canvas';
            canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: -1;
                pointer-events: none;
                background: transparent;
            `;
            document.body.insertBefore(canvas, document.body.firstChild);
        }
        
        // Get home-master system if available
        const homeMasterSystem = window.homeMasterSystem || window.HomeBasedReactiveSystem || null;
        
        // Create and initialize multi-visualizer
        vib3MultiVisualizer = new VIB3MultiVisualizerWebGL(canvas, homeMasterSystem);
        await vib3MultiVisualizer.initialize();
        
        // Start animation
        vib3MultiVisualizer.start();
        
        // Export to global scope
        window.vib3MultiVisualizer = vib3MultiVisualizer;
        window.vib3MultiVisualizerReady = true;
        
        // Listen for home-master changes if available
        if (homeMasterSystem && typeof homeMasterSystem.onChange === 'function') {
            homeMasterSystem.onChange((newParams) => {
                vib3MultiVisualizer.updateParameters(newParams);
            });
        }
        
        console.log('✅ VIB3 Multi-Visualizer WebGL System ready');
        console.log('📊 Performance info:', vib3MultiVisualizer.getPerformanceInfo());
        
        return vib3MultiVisualizer;
        
    } catch (error) {
        console.error('❌ VIB3 Multi-Visualizer initialization failed:', error);
        return null;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVIB3MultiVisualizer);
} else {
    // DOM already loaded
    setTimeout(initializeVIB3MultiVisualizer, 100);
}

// Export for ES6 modules
export { VIB3MultiVisualizerWebGL, initializeVIB3MultiVisualizer };
export default VIB3MultiVisualizerWebGL;